import { env } from 'cloudflare:workers'

import { and, desc, eq, inArray } from 'drizzle-orm'

import { createDb } from '#/db/client'
import {
  type MomentRecord,
  cardTemplates,
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
  cardVariantFromTemplate,
  formatMomentDateLabel,
} from '#/lib/moment-card-data'
import { draftMomentCard } from '#/lib/moment-card-demo'
import { getCurrentUser, requireCurrentUser } from '#/server/auth'
import type { VaultParams } from '#/server/schemas'

function getDb() {
  return createDb(env.DB)
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function sanitizeFileName(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9.]+/g, '-')
    .replace(/-+/g, '-')
}

function parseMomentDate(value: string) {
  const date = new Date(`${value}T12:00:00.000Z`)

  if (Number.isNaN(date.getTime())) {
    throw new Error('Choose a valid game date.')
  }

  return date
}

function ratingToNumber(value: string) {
  const parsed = Number(value)

  if (!Number.isFinite(parsed)) {
    return null
  }

  return parsed
}

async function findOrCreateVenue(name: string) {
  const db = getDb()
  const normalizedName = name.trim()
  const normalizedSlug = slugify(normalizedName)

  const [existingVenue] = await db
    .select()
    .from(venues)
    .where(eq(venues.slug, normalizedSlug))
    .limit(1)

  if (existingVenue) {
    return existingVenue
  }

  const now = new Date()
  const newVenue = {
    id: crypto.randomUUID(),
    slug: normalizedSlug || `venue-${crypto.randomUUID().slice(0, 8)}`,
    name: normalizedName,
    city: 'TBD',
    region: null,
    country: 'USA',
    timezone: 'America/New_York',
    latitude: null,
    longitude: null,
    createdAt: now,
    updatedAt: now,
  } as const

  await db.insert(venues).values(newVenue)

  return newVenue
}

function buildStorageKey({
  fileName,
  momentId,
  profileId,
}: {
  fileName: string
  momentId: string
  profileId: string
}) {
  const safeName = sanitizeFileName(fileName) || 'upload.jpg'
  return `moments/${profileId}/${momentId}/${Date.now()}-${safeName}`
}

function parseMintFormData(formData: FormData) {
  const image = formData.get('image')
  const title = String(formData.get('title') || '').trim()
  const caption = String(formData.get('caption') || '').trim()
  const venue = String(formData.get('venue') || '').trim()
  const date = String(formData.get('date') || '').trim()
  const matchup = String(formData.get('matchup') || '').trim()
  const finalScore = String(formData.get('finalScore') || '').trim()
  const section = String(formData.get('section') || '').trim()
  const row = String(formData.get('row') || '').trim()
  const seat = String(formData.get('seat') || '').trim()
  const memoryRatingValue = String(formData.get('memoryRating') || '').trim()
  const cardTemplateId = String(formData.get('cardTemplateId') || '').trim()
  const privacy = String(formData.get('privacy') || '').trim()

  if (!(image instanceof File) || image.size === 0) {
    throw new Error('Please choose an image to mint.')
  }

  if (!image.type.startsWith('image/')) {
    throw new Error('Only image uploads are supported for minting right now.')
  }

  if (title.length < 3) {
    throw new Error('Add a title with at least 3 characters.')
  }

  if (venue.length < 2) {
    throw new Error('Add a venue name.')
  }

  if (!date) {
    throw new Error('Choose the game date.')
  }

  if (matchup.length < 3) {
    throw new Error('Add the matchup.')
  }

  if (finalScore.length < 2) {
    throw new Error('Add the final score.')
  }

  if (!['public', 'friends', 'private'].includes(privacy)) {
    throw new Error('Choose a valid privacy setting.')
  }

  const memoryRating = ratingToNumber(memoryRatingValue)

  if (!memoryRating || memoryRating < 1 || memoryRating > 10) {
    throw new Error('Choose a memory rating between 1 and 10.')
  }

  if (!cardTemplateId) {
    throw new Error('Choose a card template.')
  }

  return {
    image,
    title,
    caption,
    venue,
    date,
    matchup,
    finalScore,
    section: section || null,
    row: row || null,
    seat: seat || null,
    memoryRating,
    cardTemplateId,
    privacy: privacy as 'public' | 'friends' | 'private',
  }
}

export async function loadMintComposerSnapshot() {
  const currentUser = await requireCurrentUser()
  const db = getDb()

  const [venueRows, templateRows] = await Promise.all([
    db.select().from(venues).orderBy(venues.name),
    db
      .select()
      .from(cardTemplates)
      .where(eq(cardTemplates.isActive, true))
      .orderBy(cardTemplates.name),
  ])

  return {
    currentUser: {
      id: currentUser.user.id,
      email: currentUser.user.email,
      displayName: currentUser.profile?.displayName || currentUser.user.name,
      profileId: currentUser.profile?.id || null,
    },
    draftSlotsRemaining: 3,
    mediaBinding: 'MOMENT_MEDIA',
    metadataBinding: 'DB',
    venues: venueRows.map((venue) => ({
      id: venue.id,
      name: venue.name,
      slug: venue.slug,
      city: venue.city,
      region: venue.region,
    })),
    templates: templateRows.map((template) => ({
      id: template.id,
      name: template.name,
      slug: template.slug,
      description: template.description,
      themeName: template.themeName,
      variant: cardVariantFromTemplate(template),
    })),
  }
}

export async function createMomentFromRequest(request: Request) {
  const currentUser = await requireCurrentUser()

  if (!currentUser.profile) {
    throw new Error('A profile is required before you can mint moments.')
  }

  const formData = await request.formData()
  const parsed = parseMintFormData(formData)
  const db = getDb()
  const [template] = await db
    .select()
    .from(cardTemplates)
    .where(and(eq(cardTemplates.id, parsed.cardTemplateId), eq(cardTemplates.isActive, true)))
    .limit(1)

  if (!template) {
    throw new Error('That card template is no longer available.')
  }

  const venue = await findOrCreateVenue(parsed.venue)
  const now = new Date()
  const capturedAt = parseMomentDate(parsed.date)
  const momentId = crypto.randomUUID()
  const mediaId = crypto.randomUUID()
  const cardId = crypto.randomUUID()
  const storageKey = buildStorageKey({
    fileName: parsed.image.name,
    momentId,
    profileId: currentUser.profile.id,
  })

  await env.MOMENT_MEDIA.put(storageKey, await parsed.image.arrayBuffer(), {
    httpMetadata: {
      contentType: parsed.image.type || 'application/octet-stream',
    },
  })

  try {
    await db.insert(moments).values({
      id: momentId,
      creatorProfileId: currentUser.profile.id,
      gameId: null,
      venueId: venue.id,
      title: parsed.title,
      caption: parsed.caption || null,
      matchup: parsed.matchup,
      finalScore: parsed.finalScore,
      section: parsed.section,
      row: parsed.row,
      seat: parsed.seat,
      memoryRating: parsed.memoryRating,
      visibility: parsed.privacy,
      status: 'published',
      capturedAt,
      publishedAt: now,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    })

    await db.insert(momentMedia).values({
      id: mediaId,
      momentId,
      mediaType: 'image',
      storageKey,
      mimeType: parsed.image.type || 'application/octet-stream',
      width: null,
      height: null,
      durationMs: null,
      sortOrder: 0,
      blurhash: null,
      createdAt: now,
    })

    await db.insert(momentCards).values({
      id: cardId,
      momentId,
      ownerProfileId: currentUser.profile.id,
      templateId: template.id,
      serialNumber: 1,
      editionSize: 1,
      mintedAt: now,
      createdAt: now,
      updatedAt: now,
    })
  } catch (error) {
    if (env.MOMENT_MEDIA.delete) {
      await env.MOMENT_MEDIA.delete(storageKey)
    }

    throw error
  }

  return {
    momentId,
  }
}

async function canCurrentUserViewMoment({
  creatorProfileId,
  visibility,
}: Pick<MomentRecord, 'creatorProfileId' | 'visibility'>) {
  const db = getDb()
  const currentUser = await getCurrentUser()
  const viewerProfileId = currentUser?.profile?.id ?? null
  const isOwner = viewerProfileId === creatorProfileId

  if (visibility === 'public' || isOwner) {
    return true
  }

  if (!viewerProfileId || visibility !== 'friends') {
    return false
  }

  return db
    .select({ id: friendships.id })
    .from(friendships)
    .where(
      and(
        eq(friendships.profileId, creatorProfileId),
        eq(friendships.friendProfileId, viewerProfileId),
      ),
    )
    .limit(1)
    .then((rows) => rows.length > 0)
}

async function canCurrentUserViewProfile({
  isPrivate,
  profileId,
}: {
  isPrivate: boolean
  profileId: string
}) {
  const currentUser = await getCurrentUser()
  const viewerProfileId = currentUser?.profile?.id ?? null
  const isOwner = viewerProfileId === profileId
  let isFriend = false

  if (viewerProfileId && !isOwner) {
    const db = getDb()
    isFriend = await db
      .select({ id: friendships.id })
      .from(friendships)
      .where(and(eq(friendships.profileId, profileId), eq(friendships.friendProfileId, viewerProfileId)))
      .limit(1)
      .then((rows) => rows.length > 0)
  }

  if (!isPrivate || isOwner) {
    return {
      canView: true,
      isFriend,
      isOwner,
      viewerProfileId,
    }
  }

  if (!viewerProfileId) {
    return {
      canView: false,
      isFriend: false,
      isOwner,
      viewerProfileId,
    }
  }

  return {
    canView: isFriend,
    isFriend,
    isOwner,
    viewerProfileId,
  }
}

export async function loadMomentDetailSnapshot(momentId: string) {
  const db = getDb()
  const [moment] = await db.select().from(moments).where(eq(moments.id, momentId)).limit(1)

  if (!moment) {
    throw new Error('Moment not found')
  }

  const canView = await canCurrentUserViewMoment(moment)

  if (!canView) {
    throw new Error('You do not have permission to view this moment.')
  }

  const [venue, media, card, creator] = await Promise.all([
    moment.venueId
      ? db.select().from(venues).where(eq(venues.id, moment.venueId)).limit(1).then((rows) => rows[0] ?? null)
      : Promise.resolve(null),
    db
      .select()
      .from(momentMedia)
      .where(eq(momentMedia.momentId, moment.id))
      .orderBy(momentMedia.sortOrder)
      .limit(1)
      .then((rows) => rows[0] ?? null),
    db
      .select({
        cardId: momentCards.id,
        templateId: cardTemplates.id,
        name: cardTemplates.name,
        slug: cardTemplates.slug,
        themeName: cardTemplates.themeName,
      })
      .from(momentCards)
      .innerJoin(cardTemplates, eq(cardTemplates.id, momentCards.templateId))
      .where(eq(momentCards.momentId, moment.id))
      .limit(1)
      .then((rows) => rows[0] ?? null),
    db
      .select()
      .from(profiles)
      .where(eq(profiles.id, moment.creatorProfileId))
      .limit(1)
      .then((rows) => rows[0] ?? null),
  ])

  if (!card) {
    throw new Error('Card template missing for this moment.')
  }

  const mediaUrl = media
    ? `/api/media?momentId=${encodeURIComponent(moment.id)}`
    : draftMomentCard.photoSrc

  return {
    momentId: moment.id,
    title: moment.title,
    caption: moment.caption,
    matchup: moment.matchup,
    finalScore: moment.finalScore,
    dateLabel: formatMomentDateLabel(moment.capturedAt ?? moment.createdAt),
    venueName: venue?.name || 'Venue pending',
    visibility: moment.visibility,
    creatorDisplayName: creator?.displayName || 'Collector',
    seatInfo: buildSeatInfo({
      section: moment.section,
      row: moment.row,
      seat: moment.seat,
    }),
    templateName: card.name,
    mediaUrl,
    card: buildMomentCardData({
      media,
      mediaUrl,
      moment,
      template: card,
      venue,
    }),
  }
}

export async function loadRecentMomentsForProfile(profileId: string) {
  const db = getDb()

  return db
    .select({
      id: moments.id,
      title: moments.title,
      createdAt: moments.createdAt,
    })
    .from(moments)
    .where(eq(moments.creatorProfileId, profileId))
    .orderBy(desc(moments.createdAt))
    .limit(12)
}

export async function loadVaultSnapshotFromUsername({ username }: VaultParams) {
  const db = getDb()
  const normalizedUsername = username.toLowerCase()
  const [profile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.username, normalizedUsername))
    .limit(1)

  if (!profile) {
    throw new Error('Vault not found')
  }

  const [{ canView, isFriend, isOwner }, recentMoments, friendCount] = await Promise.all([
    canCurrentUserViewProfile({
      isPrivate: profile.isPrivate,
      profileId: profile.id,
    }),
    db
      .select()
      .from(moments)
      .where(and(eq(moments.creatorProfileId, profile.id), eq(moments.status, 'published')))
      .orderBy(desc(moments.createdAt)),
    db
      .select({ id: friendships.id })
      .from(friendships)
      .where(eq(friendships.profileId, profile.id))
      .then((rows) => rows.length),
  ])

  const visibleMoments = canView
    ? recentMoments.filter((moment) => {
        if (isOwner) {
          return true
        }

        if (moment.visibility === 'public') {
          return true
        }

        return isFriend && moment.visibility === 'friends'
      })
    : []

  const visibleMomentIds = visibleMoments.map((moment) => moment.id)
  const venueIds = Array.from(
    new Set(visibleMoments.map((moment) => moment.venueId).filter((value): value is string => !!value)),
  )

  const [venueRows, mediaRows, cardRows] = await Promise.all([
    venueIds.length > 0
      ? db.select().from(venues).where(
          venueIds.length === 1 ? eq(venues.id, venueIds[0]) : inArray(venues.id, venueIds),
        )
      : Promise.resolve([]),
    visibleMomentIds.length > 0
      ? db
          .select()
          .from(momentMedia)
          .where(
            visibleMomentIds.length === 1
              ? eq(momentMedia.momentId, visibleMomentIds[0])
              : inArray(momentMedia.momentId, visibleMomentIds),
          )
      : Promise.resolve([]),
    visibleMomentIds.length > 0
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
            visibleMomentIds.length === 1
              ? eq(momentCards.momentId, visibleMomentIds[0])
              : inArray(momentCards.momentId, visibleMomentIds),
          )
      : Promise.resolve([]),
  ])

  const mediaByMomentId = new Map<string, (typeof mediaRows)[number]>()
  for (const row of mediaRows) {
    if (!mediaByMomentId.has(row.momentId) || row.sortOrder < (mediaByMomentId.get(row.momentId)?.sortOrder ?? 9999)) {
      mediaByMomentId.set(row.momentId, row)
    }
  }

  const cardByMomentId = new Map(cardRows.map((row) => [row.momentId, row]))
  const venueById = new Map(venueRows.map((row) => [row.id, row]))
  const momentById = new Map(visibleMoments.map((row) => [row.id, row]))

  const cards = visibleMoments.flatMap((moment) => {
    const template = cardByMomentId.get(moment.id)
    if (!template) {
      return []
    }

    const media = mediaByMomentId.get(moment.id) ?? null
    const venue = moment.venueId ? (venueById.get(moment.venueId) ?? null) : null
    const mediaUrl = media
      ? `/api/media?momentId=${encodeURIComponent(moment.id)}`
      : draftMomentCard.photoSrc

    return [
      {
        momentId: moment.id,
        title: moment.title,
        caption: moment.caption,
        venueName: venue?.name || 'Venue pending',
        dateLabel: formatMomentDateLabel(moment.capturedAt ?? moment.createdAt),
        seatInfo: buildSeatInfo({
          section: moment.section,
          row: moment.row,
          seat: moment.seat,
        }),
        matchup: moment.matchup,
        finalScore: moment.finalScore,
        templateName: template.name,
        mediaUrl,
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

  const venueMap = new Map<
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

  for (const card of cards) {
    const moment = momentById.get(card.momentId)
    if (!moment?.venueId) {
      continue
    }

    const venue = venueById.get(moment.venueId)
    if (!venue) {
      continue
    }

    const existing = venueMap.get(venue.id)
    if (existing) {
      existing.moments.push(card)
      continue
    }

    venueMap.set(venue.id, {
      id: venue.id,
      name: venue.name,
      city: venue.city,
      region: venue.region,
      latitude: venue.latitude ?? null,
      longitude: venue.longitude ?? null,
      moments: [card],
    })
  }

  const venuesForMap = Array.from(venueMap.values())
  const mappedVenues = venuesForMap.filter(
    (venue) => venue.latitude !== null && venue.longitude !== null,
  )

  return {
    username: profile.username,
    displayName: profile.displayName,
    bio: profile.bio,
    visibility: profile.isPrivate ? 'private' : 'public',
    isOwner,
    isFriend,
    canViewMoments: canView,
    stats: {
      visibleCardCount: canView ? cards.length : null,
      venueCount: canView ? venuesForMap.length : null,
      mappedVenueCount: canView ? mappedVenues.length : null,
      friendCount,
    },
    cards,
    venues: venuesForMap,
    mappedVenues: mappedVenues.map((venue) => ({
      id: venue.id,
      name: venue.name,
      city: venue.city,
      region: venue.region,
      latitude: venue.latitude!,
      longitude: venue.longitude!,
      momentCount: venue.moments.length,
    })),
  }
}

export async function serveMomentMedia(momentId: string) {
  const db = getDb()
  const [moment] = await db.select().from(moments).where(eq(moments.id, momentId)).limit(1)

  if (!moment) {
    return new Response('Not found', {
      status: 404,
    })
  }

  const canView = await canCurrentUserViewMoment(moment)

  if (!canView) {
    return new Response('Forbidden', {
      status: 403,
    })
  }

  const [media] = await db
    .select()
    .from(momentMedia)
    .where(eq(momentMedia.momentId, moment.id))
    .orderBy(momentMedia.sortOrder)
    .limit(1)

  if (!media) {
    return new Response('Not found', {
      status: 404,
    })
  }

  const object = await env.MOMENT_MEDIA.get(media.storageKey)

  if (!object) {
    return new Response('Not found', {
      status: 404,
    })
  }

  return new Response(await object.arrayBuffer(), {
    headers: {
      'cache-control': 'public, max-age=31536000, immutable',
      'content-type': object.httpMetadata?.contentType || 'application/octet-stream',
    },
  })
}
