import { env } from 'cloudflare:workers'

import { and, desc, eq, inArray, like, ne, notInArray, or, sql } from 'drizzle-orm'

import { createDb } from '#/db/client'
import {
  blocks,
  cardTemplates,
  friendRequests,
  friendships,
  gameAttendees,
  games,
  momentCards,
  momentComments,
  momentMedia,
  momentReactions,
  moments,
  profiles,
  teams,
  venues,
} from '#/db/schema'
import {
  buildMomentCardData,
  buildSeatInfo,
  formatMomentDateLabel,
} from '#/lib/moment-card-data'
import { draftMomentCard } from '#/lib/moment-card-demo'
import {
  MOMENT_REACTION_TYPES,
  normalizeProfileSearchQuery,
  parseMatchupTeams,
  slugifySocialName,
  type MomentReactionType,
} from '#/lib/social'
import { getCurrentUser, requireCurrentUser } from '#/server/auth'

function getDb() {
  return createDb(env.DB)
}

type AttendeeSummary = {
  gameId: string | null
  totalCount: number
  friendCount: number
  viewerWasThere: boolean
  friendNames: string[]
}

type FeedComment = {
  id: string
  body: string
  createdAtLabel: string
  authorDisplayName: string
}

type FeedMoment = {
  momentId: string
  creator: {
    id: string
    username: string
    displayName: string
  }
  title: string
  caption: string | null
  venueName: string
  dateLabel: string
  matchup: string
  finalScore: string
  seatInfo: string
  card: ReturnType<typeof buildMomentCardData>
  reactions: Array<{
    type: MomentReactionType
    count: number
    viewerHasReacted: boolean
  }>
  reactionTotal: number
  comments: FeedComment[]
  commentCount: number
  attendeeSummary: AttendeeSummary
}

async function requireViewerProfile() {
  const currentUser = await requireCurrentUser()

  if (!currentUser.profile) {
    throw new Error('A profile is required before social features can be used.')
  }

  return currentUser.profile
}

async function getFriendIds(profileId: string) {
  const db = getDb()
  const rows = await db
    .select({ friendProfileId: friendships.friendProfileId })
    .from(friendships)
    .where(eq(friendships.profileId, profileId))

  return rows.map((row) => row.friendProfileId)
}

async function getBlockedProfileIds(profileId: string) {
  const db = getDb()
  const blockRows = await db
    .select({
      blockerProfileId: blocks.blockerProfileId,
      blockedProfileId: blocks.blockedProfileId,
    })
    .from(blocks)
    .where(
      or(
        eq(blocks.blockerProfileId, profileId),
        eq(blocks.blockedProfileId, profileId),
      ),
    )

  return blockRows.flatMap((row) => {
    const blockerProfileId = row.blockerProfileId
    const blockedProfileId = row.blockedProfileId

    if (blockerProfileId === profileId) {
      return [blockedProfileId]
    }

    return [blockerProfileId]
  })
}

async function canViewerAccessMoment(moment: {
  creatorProfileId: string
  visibility: 'public' | 'friends' | 'private'
}) {
  const currentUser = await getCurrentUser()
  const viewerProfileId = currentUser?.profile?.id ?? null

  if (viewerProfileId === moment.creatorProfileId) {
    return true
  }

  if (moment.visibility === 'public') {
    return true
  }

  if (!viewerProfileId || moment.visibility === 'private') {
    return false
  }

  const db = getDb()
  return db
    .select({ id: friendships.id })
    .from(friendships)
    .where(
      and(
        eq(friendships.profileId, moment.creatorProfileId),
        eq(friendships.friendProfileId, viewerProfileId),
      ),
    )
    .limit(1)
    .then((rows) => rows.length > 0)
}

async function loadFeedMomentsForViewer(viewerProfileId: string) {
  const db = getDb()
  const [friendIds, blockedProfileIds] = await Promise.all([
    getFriendIds(viewerProfileId),
    getBlockedProfileIds(viewerProfileId),
  ])

  if (friendIds.length === 0) {
    return []
  }

  const feedCreators = blockedProfileIds.length > 0
    ? friendIds.filter((friendId) => !blockedProfileIds.includes(friendId))
    : friendIds

  if (feedCreators.length === 0) {
    return []
  }

  return db
    .select()
    .from(moments)
    .where(
      and(
        eq(moments.status, 'published'),
        inArray(moments.creatorProfileId, feedCreators),
        or(eq(moments.visibility, 'public'), eq(moments.visibility, 'friends')),
      ),
    )
    .orderBy(desc(moments.publishedAt), desc(moments.createdAt))
    .limit(24)
}

function summarizeReactionsForMoment({
  momentId,
  reactionRows,
  viewerProfileId,
}: {
  momentId: string
  reactionRows: Array<{
    momentId: string
    profileId: string
    reactionType: MomentReactionType
  }>
  viewerProfileId: string
}) {
  const reactions = MOMENT_REACTION_TYPES.map((type) => {
    const rows = reactionRows.filter(
      (row) => row.momentId === momentId && row.reactionType === type,
    )

    return {
      type,
      count: rows.length,
      viewerHasReacted: rows.some((row) => row.profileId === viewerProfileId),
    }
  })

  return {
    total: reactions.reduce((sum, reaction) => sum + reaction.count, 0),
    reactions,
  }
}

async function findOrCreateTeam(name: string) {
  const db = getDb()
  const normalizedName = name.trim()
  const slug = slugifySocialName(normalizedName) || `team-${crypto.randomUUID().slice(0, 8)}`
  const [existing] = await db.select().from(teams).where(eq(teams.slug, slug)).limit(1)

  if (existing) {
    return existing
  }

  const now = new Date()
  const team = {
    id: crypto.randomUUID(),
    slug,
    name: normalizedName,
    shortName: normalizedName,
    city: normalizedName,
    league: 'community',
    sport: 'sports',
    primaryColor: null,
    secondaryColor: null,
    createdAt: now,
    updatedAt: now,
  } as const

  await db.insert(teams).values(team)

  return team
}

async function ensureGameForMoment(momentId: string) {
  const db = getDb()
  const [moment] = await db.select().from(moments).where(eq(moments.id, momentId)).limit(1)

  if (!moment) {
    throw new Error('Moment not found.')
  }

  if (moment.gameId) {
    return moment.gameId
  }

  if (!moment.venueId || !moment.capturedAt) {
    throw new Error('This moment is missing the venue or date needed to mark attendance.')
  }

  const { awayTeamName, homeTeamName } = parseMatchupTeams(moment.matchup)
  const [awayTeam, homeTeam] = await Promise.all([
    findOrCreateTeam(awayTeamName),
    findOrCreateTeam(homeTeamName),
  ])

  const gameSlug = [
    formatMomentDateLabel(moment.capturedAt).toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    awayTeam.slug,
    'at',
    homeTeam.slug,
    moment.venueId,
  ].join('-')

  const [existingGame] = await db.select().from(games).where(eq(games.slug, gameSlug)).limit(1)

  const now = new Date()
  const gameId = existingGame?.id ?? crypto.randomUUID()

  if (!existingGame) {
    await db.insert(games).values({
      id: gameId,
      slug: gameSlug,
      externalId: null,
      homeTeamId: homeTeam.id,
      awayTeamId: awayTeam.id,
      venueId: moment.venueId,
      status: 'final',
      startsAt: moment.capturedAt,
      seasonLabel: String(moment.capturedAt.getUTCFullYear()),
      weekLabel: null,
      createdAt: now,
      updatedAt: now,
    })
  }

  await db
    .update(moments)
    .set({
      gameId,
      updatedAt: now,
    })
    .where(eq(moments.id, moment.id))

  return gameId
}

async function buildAttendeeSummary({
  gameId,
  viewerProfileId,
}: {
  gameId: string | null
  viewerProfileId: string
}): Promise<AttendeeSummary> {
  if (!gameId) {
    return {
      gameId: null,
      totalCount: 0,
      friendCount: 0,
      viewerWasThere: false,
      friendNames: [] as string[],
    }
  }

  const db = getDb()
  const friendIds = await getFriendIds(viewerProfileId)
  const attendeeRows = await db
    .select()
    .from(gameAttendees)
    .where(eq(gameAttendees.gameId, gameId))

  const attendeeProfileIds = attendeeRows.map((row) => row.profileId)
  const attendeeProfiles = attendeeProfileIds.length > 0
    ? await db
        .select({
          id: profiles.id,
          displayName: profiles.displayName,
        })
        .from(profiles)
        .where(
          attendeeProfileIds.length === 1
            ? eq(profiles.id, attendeeProfileIds[0])
            : inArray(profiles.id, attendeeProfileIds),
        )
    : []

  const profileById = new Map(attendeeProfiles.map((profile) => [profile.id, profile]))
  const friendAttendees = attendeeRows.filter((row) => friendIds.includes(row.profileId))

  return {
    gameId,
    totalCount: attendeeRows.length,
    friendCount: friendAttendees.length,
    viewerWasThere: attendeeRows.some((row) => row.profileId === viewerProfileId),
    friendNames: friendAttendees
      .map((row) => profileById.get(row.profileId)?.displayName)
      .filter((value): value is string => !!value)
      .slice(0, 4),
  }
}

export async function loadFriendsSnapshotForViewer() {
  const viewerProfile = await requireViewerProfile()
  const db = getDb()

  const [incomingRows, outgoingRows, friendshipRows] = await Promise.all([
    db
      .select({
        id: friendRequests.id,
        createdAt: friendRequests.createdAt,
        message: friendRequests.message,
        profileId: profiles.id,
        username: profiles.username,
        displayName: profiles.displayName,
      })
      .from(friendRequests)
      .innerJoin(profiles, eq(profiles.id, friendRequests.senderProfileId))
      .where(
        and(
          eq(friendRequests.receiverProfileId, viewerProfile.id),
          eq(friendRequests.status, 'pending'),
        ),
      )
      .orderBy(desc(friendRequests.createdAt)),
    db
      .select({
        id: friendRequests.id,
        createdAt: friendRequests.createdAt,
        message: friendRequests.message,
        profileId: profiles.id,
        username: profiles.username,
        displayName: profiles.displayName,
      })
      .from(friendRequests)
      .innerJoin(profiles, eq(profiles.id, friendRequests.receiverProfileId))
      .where(
        and(
          eq(friendRequests.senderProfileId, viewerProfile.id),
          eq(friendRequests.status, 'pending'),
        ),
      )
      .orderBy(desc(friendRequests.createdAt)),
    db
      .select({
        createdAt: friendships.createdAt,
        profileId: profiles.id,
        username: profiles.username,
        displayName: profiles.displayName,
      })
      .from(friendships)
      .innerJoin(profiles, eq(profiles.id, friendships.friendProfileId))
      .where(eq(friendships.profileId, viewerProfile.id))
      .orderBy(desc(friendships.createdAt)),
  ])

  const friendIds = friendshipRows.map((row) => row.profileId)
  const recentMomentRows = friendIds.length > 0
    ? await db
        .select({
          creatorProfileId: moments.creatorProfileId,
          id: moments.id,
        })
        .from(moments)
        .where(
          and(
            inArray(moments.creatorProfileId, friendIds),
            eq(moments.status, 'published'),
            or(eq(moments.visibility, 'public'), eq(moments.visibility, 'friends')),
          ),
        )
    : []

  return {
    viewer: {
      id: viewerProfile.id,
      username: viewerProfile.username,
      displayName: viewerProfile.displayName,
    },
    incomingRequests: incomingRows.map((row) => ({
      id: row.id,
      createdAtLabel: formatMomentDateLabel(row.createdAt),
      message: row.message,
      profile: {
        id: row.profileId,
        username: row.username,
        displayName: row.displayName,
      },
    })),
    outgoingRequests: outgoingRows.map((row) => ({
      id: row.id,
      createdAtLabel: formatMomentDateLabel(row.createdAt),
      message: row.message,
      profile: {
        id: row.profileId,
        username: row.username,
        displayName: row.displayName,
      },
    })),
    friends: friendshipRows.map((row) => ({
      createdAtLabel: formatMomentDateLabel(row.createdAt),
      profile: {
        id: row.profileId,
        username: row.username,
        displayName: row.displayName,
      },
      visibleMomentCount: recentMomentRows.filter(
        (moment) => moment.creatorProfileId === row.profileId,
      ).length,
    })),
  }
}

export async function searchProfilesForViewer(query: string) {
  const viewerProfile = await requireViewerProfile()
  const db = getDb()
  const normalizedQuery = normalizeProfileSearchQuery(query)

  if (normalizedQuery.length < 2) {
    return []
  }

  const blockedProfileIds = await getBlockedProfileIds(viewerProfile.id)
  const searchPattern = `%${normalizedQuery.replace(/\s+/g, '%')}%`
  const baseFilters = [
    ne(profiles.id, viewerProfile.id),
    or(
      like(profiles.username, searchPattern),
      sql`lower(${profiles.displayName}) like ${searchPattern}`,
    ),
  ]

  const profileRows = await db
    .select({
      id: profiles.id,
      username: profiles.username,
      displayName: profiles.displayName,
      isPrivate: profiles.isPrivate,
    })
    .from(profiles)
    .where(
      blockedProfileIds.length > 0
        ? and(...baseFilters, notInArray(profiles.id, blockedProfileIds))
        : and(...baseFilters),
    )
    .orderBy(profiles.username)
    .limit(12)

  const resultIds = profileRows.map((row) => row.id)

  if (resultIds.length === 0) {
    return []
  }

  const [friendRows, incomingRows, outgoingRows] = await Promise.all([
    db
      .select({ friendProfileId: friendships.friendProfileId })
      .from(friendships)
      .where(
        and(
          eq(friendships.profileId, viewerProfile.id),
          inArray(friendships.friendProfileId, resultIds),
        ),
      ),
    db
      .select({ senderProfileId: friendRequests.senderProfileId })
      .from(friendRequests)
      .where(
        and(
          eq(friendRequests.receiverProfileId, viewerProfile.id),
          eq(friendRequests.status, 'pending'),
          inArray(friendRequests.senderProfileId, resultIds),
        ),
      ),
    db
      .select({ receiverProfileId: friendRequests.receiverProfileId })
      .from(friendRequests)
      .where(
        and(
          eq(friendRequests.senderProfileId, viewerProfile.id),
          eq(friendRequests.status, 'pending'),
          inArray(friendRequests.receiverProfileId, resultIds),
        ),
      ),
  ])

  const friendSet = new Set(friendRows.map((row) => row.friendProfileId))
  const incomingSet = new Set(incomingRows.map((row) => row.senderProfileId))
  const outgoingSet = new Set(outgoingRows.map((row) => row.receiverProfileId))

  return profileRows.map((row) => ({
    id: row.id,
    username: row.username,
    displayName: row.displayName,
    isPrivate: row.isPrivate,
    relation: friendSet.has(row.id)
      ? 'friends'
      : incomingSet.has(row.id)
        ? 'incoming_pending'
        : outgoingSet.has(row.id)
          ? 'outgoing_pending'
          : 'none',
  }))
}

export async function sendFriendRequestToProfile(input: {
  targetProfileId: string
  message?: string
}) {
  const viewerProfile = await requireViewerProfile()
  const db = getDb()

  if (input.targetProfileId === viewerProfile.id) {
    throw new Error('You cannot send a friend request to yourself.')
  }

  const [targetProfile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.id, input.targetProfileId))
    .limit(1)

  if (!targetProfile) {
    throw new Error('Profile not found.')
  }

  const [existingFriendship, existingOutgoing, existingIncoming] = await Promise.all([
    db
      .select({ id: friendships.id })
      .from(friendships)
      .where(
        and(
          eq(friendships.profileId, viewerProfile.id),
          eq(friendships.friendProfileId, targetProfile.id),
        ),
      )
      .limit(1)
      .then((rows) => rows[0] ?? null),
    db
      .select({ id: friendRequests.id })
      .from(friendRequests)
      .where(
        and(
          eq(friendRequests.senderProfileId, viewerProfile.id),
          eq(friendRequests.receiverProfileId, targetProfile.id),
          eq(friendRequests.status, 'pending'),
        ),
      )
      .limit(1)
      .then((rows) => rows[0] ?? null),
    db
      .select({ id: friendRequests.id })
      .from(friendRequests)
      .where(
        and(
          eq(friendRequests.senderProfileId, targetProfile.id),
          eq(friendRequests.receiverProfileId, viewerProfile.id),
          eq(friendRequests.status, 'pending'),
        ),
      )
      .limit(1)
      .then((rows) => rows[0] ?? null),
  ])

  if (existingFriendship) {
    throw new Error('You are already friends with this collector.')
  }

  if (existingOutgoing) {
    return {
      requestId: existingOutgoing.id,
      status: 'pending' as const,
    }
  }

  if (existingIncoming) {
    throw new Error('This collector already sent you a request. Accept it from your inbox.')
  }

  const requestId = crypto.randomUUID()
  await db.insert(friendRequests).values({
    id: requestId,
    senderProfileId: viewerProfile.id,
    receiverProfileId: targetProfile.id,
    status: 'pending',
    message: input.message?.trim() || null,
    createdAt: new Date(),
    respondedAt: null,
  })

  return {
    requestId,
    status: 'pending' as const,
  }
}

export async function respondToFriendRequest(input: {
  requestId: string
  action: 'accept' | 'decline'
}) {
  const viewerProfile = await requireViewerProfile()
  const db = getDb()
  const [request] = await db
    .select()
    .from(friendRequests)
    .where(eq(friendRequests.id, input.requestId))
    .limit(1)

  if (!request || request.receiverProfileId !== viewerProfile.id || request.status !== 'pending') {
    throw new Error('Friend request not found.')
  }

  const now = new Date()
  await db
    .update(friendRequests)
    .set({
      status: input.action === 'accept' ? 'accepted' : 'rejected',
      respondedAt: now,
    })
    .where(eq(friendRequests.id, request.id))

  if (input.action === 'accept') {
    await db.insert(friendships).values([
      {
        id: crypto.randomUUID(),
        profileId: request.senderProfileId,
        friendProfileId: request.receiverProfileId,
        sourceRequestId: request.id,
        createdAt: now,
      },
      {
        id: crypto.randomUUID(),
        profileId: request.receiverProfileId,
        friendProfileId: request.senderProfileId,
        sourceRequestId: request.id,
        createdAt: now,
      },
    ]).onConflictDoNothing()
  }

  return {
    requestId: request.id,
    status: input.action === 'accept' ? 'accepted' : 'rejected',
  }
}

export async function removeFriendshipWithProfile(friendProfileId: string) {
  const viewerProfile = await requireViewerProfile()
  const db = getDb()

  await db
    .delete(friendships)
    .where(
      or(
        and(
          eq(friendships.profileId, viewerProfile.id),
          eq(friendships.friendProfileId, friendProfileId),
        ),
        and(
          eq(friendships.profileId, friendProfileId),
          eq(friendships.friendProfileId, viewerProfile.id),
        ),
      ),
    )

  return {
    friendProfileId,
  }
}

export async function loadFriendFeedSnapshot(): Promise<{
  viewer: {
    id: string
    username: string
    displayName: string
  }
  moments: FeedMoment[]
}> {
  const viewerProfile = await requireViewerProfile()
  const db = getDb()
  const momentRows = await loadFeedMomentsForViewer(viewerProfile.id)

  if (momentRows.length === 0) {
    return {
      viewer: {
        id: viewerProfile.id,
        username: viewerProfile.username,
        displayName: viewerProfile.displayName,
      },
      moments: [],
    }
  }

  const momentIds = momentRows.map((row) => row.id)
  const creatorIds = Array.from(new Set(momentRows.map((row) => row.creatorProfileId)))
  const venueIds = Array.from(
    new Set(momentRows.map((row) => row.venueId).filter((value): value is string => !!value)),
  )
  const gameIds = Array.from(
    new Set(momentRows.map((row) => row.gameId).filter((value): value is string => !!value)),
  )

  const [profileRows, venueRows, mediaRows, cardRows, reactionRows, commentRows] =
    await Promise.all([
      db
        .select({
          id: profiles.id,
          username: profiles.username,
          displayName: profiles.displayName,
        })
        .from(profiles)
        .where(
          creatorIds.length === 1
            ? eq(profiles.id, creatorIds[0])
            : inArray(profiles.id, creatorIds),
        ),
      venueIds.length > 0
        ? db
            .select()
            .from(venues)
            .where(venueIds.length === 1 ? eq(venues.id, venueIds[0]) : inArray(venues.id, venueIds))
        : Promise.resolve([]),
      db
        .select()
        .from(momentMedia)
        .where(
          momentIds.length === 1
            ? eq(momentMedia.momentId, momentIds[0])
            : inArray(momentMedia.momentId, momentIds),
        ),
      db
        .select({
          momentId: momentCards.momentId,
          name: cardTemplates.name,
          slug: cardTemplates.slug,
          themeName: cardTemplates.themeName,
        })
        .from(momentCards)
        .innerJoin(cardTemplates, eq(cardTemplates.id, momentCards.templateId))
        .where(
          momentIds.length === 1
            ? eq(momentCards.momentId, momentIds[0])
            : inArray(momentCards.momentId, momentIds),
        ),
      db
        .select({
          momentId: momentReactions.momentId,
          profileId: momentReactions.profileId,
          reactionType: momentReactions.reactionType,
        })
        .from(momentReactions)
        .where(
          momentIds.length === 1
            ? eq(momentReactions.momentId, momentIds[0])
            : inArray(momentReactions.momentId, momentIds),
        ),
      db
        .select({
          id: momentComments.id,
          momentId: momentComments.momentId,
          profileId: momentComments.profileId,
          body: momentComments.body,
          createdAt: momentComments.createdAt,
          deletedAt: momentComments.deletedAt,
        })
        .from(momentComments)
        .where(
          and(
            momentIds.length === 1
              ? eq(momentComments.momentId, momentIds[0])
              : inArray(momentComments.momentId, momentIds),
            sql`${momentComments.deletedAt} is null`,
          ),
        )
        .orderBy(desc(momentComments.createdAt)),
    ])

  const commentAuthorIds = Array.from(new Set(commentRows.map((row) => row.profileId)))
  const [commentAuthorRows, attendeeRows] = await Promise.all([
    commentAuthorIds.length > 0
      ? db
          .select({
            id: profiles.id,
            displayName: profiles.displayName,
          })
          .from(profiles)
          .where(
            commentAuthorIds.length === 1
              ? eq(profiles.id, commentAuthorIds[0])
              : inArray(profiles.id, commentAuthorIds),
          )
      : Promise.resolve([]),
    gameIds.length > 0
      ? db
          .select()
          .from(gameAttendees)
          .where(gameIds.length === 1 ? eq(gameAttendees.gameId, gameIds[0]) : inArray(gameAttendees.gameId, gameIds))
      : Promise.resolve([]),
  ])

  const attendeeProfileIds = Array.from(new Set(attendeeRows.map((row) => row.profileId)))
  const attendeeProfiles = attendeeProfileIds.length > 0
    ? await db
        .select({
          id: profiles.id,
          displayName: profiles.displayName,
        })
        .from(profiles)
        .where(
          attendeeProfileIds.length === 1
            ? eq(profiles.id, attendeeProfileIds[0])
            : inArray(profiles.id, attendeeProfileIds),
        )
    : []

  const friendIds = await getFriendIds(viewerProfile.id)
  const profileById = new Map(profileRows.map((row) => [row.id, row]))
  const venueById = new Map(venueRows.map((row) => [row.id, row]))
  const templateByMomentId = new Map(cardRows.map((row) => [row.momentId, row]))
  const commentAuthorById = new Map(commentAuthorRows.map((row) => [row.id, row.displayName]))
  const attendeeProfileById = new Map(attendeeProfiles.map((row) => [row.id, row.displayName]))

  const mediaByMomentId = new Map<string, (typeof mediaRows)[number]>()
  for (const row of mediaRows) {
    if (
      !mediaByMomentId.has(row.momentId) ||
      row.sortOrder < (mediaByMomentId.get(row.momentId)?.sortOrder ?? 9999)
    ) {
      mediaByMomentId.set(row.momentId, row)
    }
  }

  const momentsList: FeedMoment[] = momentRows.flatMap((moment) => {
    const creator = profileById.get(moment.creatorProfileId)
    const template = templateByMomentId.get(moment.id)

    if (!creator || !template) {
      return []
    }

    const venue = moment.venueId ? (venueById.get(moment.venueId) ?? null) : null
    const media = mediaByMomentId.get(moment.id) ?? null
    const mediaUrl = media
      ? `/api/media?momentId=${encodeURIComponent(moment.id)}`
      : draftMomentCard.photoSrc
    const reactionSummary = summarizeReactionsForMoment({
      momentId: moment.id,
      reactionRows: reactionRows as Array<{
        momentId: string
        profileId: string
        reactionType: MomentReactionType
      }>,
      viewerProfileId: viewerProfile.id,
    })
    const momentCommentsForFeed = commentRows
      .filter((comment) => comment.momentId === moment.id)
      .slice(0, 3)
      .reverse()
      .map((comment) => ({
        id: comment.id,
        body: comment.body,
        createdAtLabel: formatMomentDateLabel(comment.createdAt),
        authorDisplayName: commentAuthorById.get(comment.profileId) || 'Collector',
      }))

    const gameAttendeeRows = moment.gameId
      ? attendeeRows.filter((row) => row.gameId === moment.gameId)
      : []
    const friendAttendeeRows = gameAttendeeRows.filter((row) => friendIds.includes(row.profileId))

    return [
      {
        momentId: moment.id,
        creator: {
          id: creator.id,
          username: creator.username,
          displayName: creator.displayName,
        },
        title: moment.title,
        caption: moment.caption,
        venueName: venue?.name || 'Venue pending',
        dateLabel: formatMomentDateLabel(moment.capturedAt ?? moment.createdAt),
        matchup: moment.matchup,
        finalScore: moment.finalScore,
        seatInfo: buildSeatInfo({
          section: moment.section,
          row: moment.row,
          seat: moment.seat,
        }),
        card: buildMomentCardData({
          media,
          mediaUrl,
          moment,
          template,
          venue,
        }),
        reactions: reactionSummary.reactions,
        reactionTotal: reactionSummary.total,
        comments: momentCommentsForFeed,
        commentCount: commentRows.filter((comment) => comment.momentId === moment.id).length,
        attendeeSummary: {
          gameId: moment.gameId,
          totalCount: gameAttendeeRows.length,
          friendCount: friendAttendeeRows.length,
          viewerWasThere: gameAttendeeRows.some((row) => row.profileId === viewerProfile.id),
          friendNames: friendAttendeeRows
            .map((row) => attendeeProfileById.get(row.profileId))
            .filter((value): value is string => !!value)
            .slice(0, 4),
        },
      },
    ]
  })

  return {
    viewer: {
      id: viewerProfile.id,
      username: viewerProfile.username,
      displayName: viewerProfile.displayName,
    },
    moments: momentsList,
  }
}

export async function toggleMomentReaction(input: {
  momentId: string
  reactionType: MomentReactionType
}) {
  const viewerProfile = await requireViewerProfile()
  const db = getDb()
  const [moment] = await db.select().from(moments).where(eq(moments.id, input.momentId)).limit(1)

  if (!moment || !(await canViewerAccessMoment(moment))) {
    throw new Error('Moment not found or unavailable.')
  }

  const [existingReaction] = await db
    .select()
    .from(momentReactions)
    .where(
      and(
        eq(momentReactions.momentId, input.momentId),
        eq(momentReactions.profileId, viewerProfile.id),
        eq(momentReactions.reactionType, input.reactionType),
      ),
    )
    .limit(1)

  if (existingReaction) {
    await db.delete(momentReactions).where(eq(momentReactions.id, existingReaction.id))
  } else {
    await db.insert(momentReactions).values({
      id: crypto.randomUUID(),
      momentId: input.momentId,
      profileId: viewerProfile.id,
      reactionType: input.reactionType,
      createdAt: new Date(),
    })
  }

  const reactionRows = await db
    .select({
      momentId: momentReactions.momentId,
      profileId: momentReactions.profileId,
      reactionType: momentReactions.reactionType,
    })
    .from(momentReactions)
    .where(eq(momentReactions.momentId, input.momentId))

  const summary = summarizeReactionsForMoment({
    momentId: input.momentId,
    reactionRows: reactionRows as Array<{
      momentId: string
      profileId: string
      reactionType: MomentReactionType
    }>,
    viewerProfileId: viewerProfile.id,
  })

  return {
    momentId: input.momentId,
    reactions: summary.reactions,
    reactionTotal: summary.total,
  }
}

export async function addMomentComment(input: {
  momentId: string
  body: string
}) {
  const viewerProfile = await requireViewerProfile()
  const db = getDb()
  const [moment] = await db.select().from(moments).where(eq(moments.id, input.momentId)).limit(1)

  if (!moment || !(await canViewerAccessMoment(moment))) {
    throw new Error('Moment not found or unavailable.')
  }

  const body = input.body.trim()

  if (body.length < 2) {
    throw new Error('Write at least 2 characters before posting a comment.')
  }

  const now = new Date()
  const commentId = crypto.randomUUID()

  await db.insert(momentComments).values({
    id: commentId,
    momentId: input.momentId,
    profileId: viewerProfile.id,
    parentCommentId: null,
    body,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  })

  return {
    comment: {
      id: commentId,
      body,
      createdAtLabel: formatMomentDateLabel(now),
      authorDisplayName: viewerProfile.displayName,
    },
  }
}

export async function markMomentAttendance(momentId: string) {
  const viewerProfile = await requireViewerProfile()
  const db = getDb()
  const [moment] = await db.select().from(moments).where(eq(moments.id, momentId)).limit(1)

  if (!moment || !(await canViewerAccessMoment(moment))) {
    throw new Error('Moment not found or unavailable.')
  }

  const gameId = await ensureGameForMoment(momentId)
  const now = new Date()

  await db
    .insert(gameAttendees)
    .values({
      id: crypto.randomUUID(),
      gameId,
      profileId: viewerProfile.id,
      status: 'checked_in',
      checkedInAt: now,
      createdAt: now,
    })
    .onConflictDoUpdate({
      target: [gameAttendees.gameId, gameAttendees.profileId],
      set: {
        status: 'checked_in',
        checkedInAt: now,
      },
    })

  const attendeeSummary = await buildAttendeeSummary({
    gameId,
    viewerProfileId: viewerProfile.id,
  })

  return {
    momentId,
    attendeeSummary,
  }
}
