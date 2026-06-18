import { and, asc, desc, eq, inArray } from 'drizzle-orm'

import { createDb } from '#/db/client'
import {
  cardTemplates,
  collectionMoments,
  collections,
  friendships,
  momentCards,
  momentMedia,
  moments,
  profiles,
  venues,
} from '#/db/schema'
import {
  buildMomentCardData,
  buildSeatInfo,
  formatMomentDateLabel,
} from '#/lib/moment-card-data'
import { draftMomentCard } from '#/lib/moment-card-demo'
import {
  buildCollectionSlug,
  getNextCoverMomentIdOnRemoval,
} from '#/lib/collections'
import { env } from 'cloudflare:workers'
import { getCurrentUser, requireCurrentUser } from '#/server/auth'
import type { CollectionParams } from '#/server/schemas'

function getDb() {
  return createDb(env.DB)
}

async function isViewerFriendOfProfile(profileId: string) {
  const currentUser = await getCurrentUser()
  const viewerProfileId = currentUser?.profile?.id ?? null

  if (!viewerProfileId || viewerProfileId === profileId) {
    return false
  }

  const db = getDb()
  return db
    .select({ id: friendships.id })
    .from(friendships)
    .where(and(eq(friendships.profileId, profileId), eq(friendships.friendProfileId, viewerProfileId)))
    .limit(1)
    .then((rows) => rows.length > 0)
}

async function canViewerAccessCollection(collection: {
  ownerProfileId: string
  visibility: 'public' | 'friends' | 'private'
}) {
  const currentUser = await getCurrentUser()
  const viewerProfileId = currentUser?.profile?.id ?? null
  const isOwner = viewerProfileId === collection.ownerProfileId

  if (collection.visibility === 'public' || isOwner) {
    return {
      canView: true,
      isOwner,
      isFriend: false,
    }
  }

  if (!viewerProfileId || collection.visibility !== 'friends') {
    return {
      canView: false,
      isOwner,
      isFriend: false,
    }
  }

  const isFriend = await isViewerFriendOfProfile(collection.ownerProfileId)

  return {
    canView: isFriend,
    isOwner,
    isFriend,
  }
}

function canViewerAccessMoment({
  collectionAccess,
  momentVisibility,
}: {
  collectionAccess: { isOwner: boolean; isFriend: boolean }
  momentVisibility: 'public' | 'friends' | 'private'
}) {
  if (collectionAccess.isOwner) {
    return true
  }

  if (momentVisibility === 'public') {
    return true
  }

  if (momentVisibility === 'friends') {
    return collectionAccess.isFriend
  }

  return false
}

export async function loadViewerCollectionsForMoment(momentId: string) {
  const currentUser = await requireCurrentUser()

  if (!currentUser.profile) {
    throw new Error('A profile is required before collections can be used.')
  }

  const db = getDb()
  const [collectionRows, membershipRows] = await Promise.all([
    db
      .select()
      .from(collections)
      .where(eq(collections.ownerProfileId, currentUser.profile.id))
      .orderBy(desc(collections.updatedAt)),
    db
      .select()
      .from(collectionMoments)
      .where(eq(collectionMoments.momentId, momentId)),
  ])

  const membershipSet = new Set(
    membershipRows
      .filter((row) => row.addedByProfileId === currentUser.profile?.id || collectionRows.some((collection) => collection.id === row.collectionId))
      .map((row) => row.collectionId),
  )

  return collectionRows.map((collection) => ({
    id: collection.id,
    title: collection.title,
    slug: collection.slug,
    visibility: collection.visibility,
    coverMomentId: collection.coverMomentId,
    containsMoment: membershipSet.has(collection.id),
  }))
}

export async function createCollectionForViewer(input: {
  title: string
  description?: string
  visibility: 'public' | 'friends' | 'private'
  coverMomentId?: string | null
}) {
  const currentUser = await requireCurrentUser()

  if (!currentUser.profile) {
    throw new Error('A profile is required before collections can be created.')
  }

  const db = getDb()
  const normalizedTitle = input.title.trim()

  if (normalizedTitle.length < 2) {
    throw new Error('Collection title must be at least 2 characters.')
  }

  const baseSlug = buildCollectionSlug(normalizedTitle)
  const existingCollections = await db
    .select({ slug: collections.slug })
    .from(collections)
    .where(eq(collections.ownerProfileId, currentUser.profile.id))

  const slugSet = new Set(existingCollections.map((collection) => collection.slug))
  let slug = baseSlug
  let attempt = 2
  while (slugSet.has(slug)) {
    slug = `${baseSlug}-${attempt}`
    attempt += 1
  }

  const now = new Date()
  const collectionId = crypto.randomUUID()

  await db.insert(collections).values({
    id: collectionId,
    ownerProfileId: currentUser.profile.id,
    slug,
    title: normalizedTitle,
    description: input.description?.trim() || null,
    visibility: input.visibility,
    coverMomentId: input.coverMomentId ?? null,
    createdAt: now,
    updatedAt: now,
  })

  return {
    collectionId,
  }
}

export async function addMomentToCollection(input: {
  collectionId: string
  momentId: string
}) {
  const currentUser = await requireCurrentUser()

  if (!currentUser.profile) {
    throw new Error('A profile is required before collections can be updated.')
  }

  const db = getDb()
  const [collection] = await db
    .select()
    .from(collections)
    .where(eq(collections.id, input.collectionId))
    .limit(1)

  if (!collection || collection.ownerProfileId !== currentUser.profile.id) {
    throw new Error('You can only edit your own collections.')
  }

  const [moment] = await db
    .select()
    .from(moments)
    .where(eq(moments.id, input.momentId))
    .limit(1)

  if (!moment) {
    throw new Error('Moment not found.')
  }

  const [existingMembership] = await db
    .select()
    .from(collectionMoments)
    .where(
      and(
        eq(collectionMoments.collectionId, collection.id),
        eq(collectionMoments.momentId, input.momentId),
      ),
    )
    .limit(1)

  if (existingMembership) {
    return {
      collectionId: collection.id,
      momentId: input.momentId,
    }
  }

  const [lastPosition] = await db
    .select({ position: collectionMoments.position })
    .from(collectionMoments)
    .where(eq(collectionMoments.collectionId, collection.id))
    .orderBy(desc(collectionMoments.position))
    .limit(1)

  const now = new Date()
  await db.insert(collectionMoments).values({
    collectionId: collection.id,
    momentId: input.momentId,
    addedByProfileId: currentUser.profile.id,
    position: (lastPosition?.position ?? -1) + 1,
    createdAt: now,
  })

  await db
    .update(collections)
    .set({
      coverMomentId: collection.coverMomentId ?? input.momentId,
      updatedAt: now,
    })
    .where(eq(collections.id, collection.id))

  return {
    collectionId: collection.id,
    momentId: input.momentId,
  }
}

export async function removeMomentFromCollection(input: {
  collectionId: string
  momentId: string
}) {
  const currentUser = await requireCurrentUser()

  if (!currentUser.profile) {
    throw new Error('A profile is required before collections can be updated.')
  }

  const db = getDb()
  const [collection] = await db
    .select()
    .from(collections)
    .where(eq(collections.id, input.collectionId))
    .limit(1)

  if (!collection || collection.ownerProfileId !== currentUser.profile.id) {
    throw new Error('You can only edit your own collections.')
  }

  await db
    .delete(collectionMoments)
    .where(
      and(
        eq(collectionMoments.collectionId, collection.id),
        eq(collectionMoments.momentId, input.momentId),
      ),
    )

  const now = new Date()
  if (collection.coverMomentId === input.momentId) {
    const remainingMembershipRows = await db
      .select({ momentId: collectionMoments.momentId })
      .from(collectionMoments)
      .where(eq(collectionMoments.collectionId, collection.id))
      .orderBy(asc(collectionMoments.position))

    await db
      .update(collections)
      .set({
        coverMomentId: getNextCoverMomentIdOnRemoval({
          currentCoverMomentId: collection.coverMomentId,
          removedMomentId: input.momentId,
          remainingMomentIds: remainingMembershipRows.map((row) => row.momentId),
        }),
        updatedAt: now,
      })
      .where(eq(collections.id, collection.id))
  } else {
    await db
      .update(collections)
      .set({
        updatedAt: now,
      })
      .where(eq(collections.id, collection.id))
  }

  return {
    collectionId: collection.id,
    momentId: input.momentId,
  }
}

export async function updateCollectionSettings(input: {
  collectionId: string
  visibility: 'public' | 'friends' | 'private'
  coverMomentId: string | null
}) {
  const currentUser = await requireCurrentUser()

  if (!currentUser.profile) {
    throw new Error('A profile is required before collections can be updated.')
  }

  const db = getDb()
  const [collection] = await db
    .select()
    .from(collections)
    .where(eq(collections.id, input.collectionId))
    .limit(1)

  if (!collection || collection.ownerProfileId !== currentUser.profile.id) {
    throw new Error('You can only edit your own collections.')
  }

  const now = new Date()
  await db
    .update(collections)
    .set({
      visibility: input.visibility,
      coverMomentId: input.coverMomentId,
      updatedAt: now,
    })
    .where(eq(collections.id, collection.id))

  return {
    collectionId: collection.id,
  }
}

export async function loadCollectionDetailSnapshot({ collectionId }: CollectionParams) {
  const db = getDb()
  const [collection] = await db
    .select()
    .from(collections)
    .where(eq(collections.id, collectionId))
    .limit(1)

  if (!collection) {
    throw new Error('Collection not found')
  }

  const access = await canViewerAccessCollection(collection)

  if (!access.canView) {
    throw new Error('You do not have permission to view this collection.')
  }

  const [owner, membershipRows] = await Promise.all([
    db
      .select()
      .from(profiles)
      .where(eq(profiles.id, collection.ownerProfileId))
      .limit(1)
      .then((rows) => rows[0] ?? null),
    db
      .select()
      .from(collectionMoments)
      .where(eq(collectionMoments.collectionId, collection.id))
      .orderBy(asc(collectionMoments.position)),
  ])

  const momentIds = membershipRows.map((row) => row.momentId)

  const [momentRows, mediaRows, cardRows] = await Promise.all([
    momentIds.length > 0
      ? db.select().from(moments).where(
          momentIds.length === 1 ? eq(moments.id, momentIds[0]) : inArray(moments.id, momentIds),
        )
      : Promise.resolve([]),
    momentIds.length > 0
      ? db.select().from(momentMedia).where(
          momentIds.length === 1 ? eq(momentMedia.momentId, momentIds[0]) : inArray(momentMedia.momentId, momentIds),
        )
      : Promise.resolve([]),
    momentIds.length > 0
      ? db
          .select({
            momentId: momentCards.momentId,
            templateId: cardTemplates.id,
            name: cardTemplates.name,
            slug: cardTemplates.slug,
            themeName: cardTemplates.themeName,
          })
          .from(momentCards)
          .innerJoin(cardTemplates, eq(cardTemplates.id, momentCards.templateId))
          .where(
            momentIds.length === 1 ? eq(momentCards.momentId, momentIds[0]) : inArray(momentCards.momentId, momentIds),
          )
      : Promise.resolve([]),
  ])

  const momentById = new Map(momentRows.map((row) => [row.id, row]))
  const allowedMoments = membershipRows
    .map((row) => momentById.get(row.momentId))
    .filter((moment): moment is NonNullable<typeof momentRows[number]> => !!moment)
    .filter((moment) =>
      canViewerAccessMoment({
        collectionAccess: access,
        momentVisibility: moment.visibility,
      }),
    )

  const allowedMomentIds = allowedMoments.map((moment) => moment.id)
  const allowedVenueIds = Array.from(
    new Set(allowedMoments.map((moment) => moment.venueId).filter((value): value is string => !!value)),
  )
  const filteredMediaRows = mediaRows.filter((media) => allowedMomentIds.includes(media.momentId))
  const filteredCardRows = cardRows.filter((card) => allowedMomentIds.includes(card.momentId))
  const filteredVenueRows =
    allowedVenueIds.length > 0
      ? await db.select().from(venues).where(
          allowedVenueIds.length === 1 ? eq(venues.id, allowedVenueIds[0]) : inArray(venues.id, allowedVenueIds),
        )
      : []

  const mediaByMomentId = new Map<string, (typeof filteredMediaRows)[number]>()
  for (const row of filteredMediaRows) {
    if (!mediaByMomentId.has(row.momentId) || row.sortOrder < (mediaByMomentId.get(row.momentId)?.sortOrder ?? 9999)) {
      mediaByMomentId.set(row.momentId, row)
    }
  }

  const templateByMomentId = new Map(filteredCardRows.map((row) => [row.momentId, row]))
  const venueById = new Map(filteredVenueRows.map((row) => [row.id, row]))

  const cards = allowedMoments.flatMap((moment) => {
    const template = templateByMomentId.get(moment.id)
    if (!template) {
      return []
    }

    const venue = moment.venueId ? (venueById.get(moment.venueId) ?? null) : null
    const media = mediaByMomentId.get(moment.id) ?? null
    const mediaUrl = media ? `/api/media?momentId=${encodeURIComponent(moment.id)}` : draftMomentCard.photoSrc

    return [
      {
        momentId: moment.id,
        title: moment.title,
        caption: moment.caption,
        matchup: moment.matchup,
        finalScore: moment.finalScore,
        dateLabel: formatMomentDateLabel(moment.capturedAt ?? moment.createdAt),
        venueName: venue?.name || 'Venue pending',
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
      },
    ]
  })

  const venuesForMap = new Map<
    string,
    {
      id: string
      name: string
      city: string
      region: string | null
      latitude: number | null
      longitude: number | null
      moments: typeof cards
    }
  >()

  for (const entry of cards) {
    const moment = allowedMoments.find((row) => row.id === entry.momentId)
    if (!moment?.venueId) {
      continue
    }

    const venue = venueById.get(moment.venueId)
    if (!venue) {
      continue
    }

    const existing = venuesForMap.get(venue.id)
    if (existing) {
      existing.moments.push(entry)
      continue
    }

    venuesForMap.set(venue.id, {
      id: venue.id,
      name: venue.name,
      city: venue.city,
      region: venue.region,
      latitude: venue.latitude ?? null,
      longitude: venue.longitude ?? null,
      moments: [entry],
    })
  }

  const coverCard = cards.find((entry) => entry.momentId === collection.coverMomentId) ?? cards[0] ?? null
  const mappedVenues = Array.from(venuesForMap.values()).filter(
    (venue) => venue.latitude !== null && venue.longitude !== null,
  )

  return {
    id: collection.id,
    ownerUsername: owner?.username || '',
    ownerDisplayName: owner?.displayName || 'Collector',
    title: collection.title,
    description: collection.description,
    visibility: collection.visibility,
    isOwner: access.isOwner,
    canView: access.canView,
    cards,
    coverCard,
    venues: Array.from(venuesForMap.values()),
    mappedVenues: mappedVenues.map((venue) => ({
      id: venue.id,
      name: venue.name,
      city: venue.city,
      region: venue.region,
      latitude: venue.latitude!,
      longitude: venue.longitude!,
      momentCount: venue.moments.length,
    })),
    stats: {
      cardCount: cards.length,
      venueCount: Array.from(venuesForMap.values()).length,
      mappedVenueCount: mappedVenues.length,
    },
  }
}
