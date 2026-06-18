import type { CardTemplateRecord, MomentMediaRecord, MomentRecord, VenueRecord } from '#/db/schema'
import type { MomentCardData, MomentCardVariant } from '#/lib/moment-card'

const variantAliases = new Map<string, MomentCardVariant>([
  ['base', 'base'],
  ['rivalry', 'rivalry'],
  ['playoff', 'playoff'],
  ['road-game', 'road-game'],
  ['road', 'road-game'],
  ['first-venue', 'first-venue'],
  ['passport', 'first-venue'],
  ['overtime', 'overtime'],
  ['walkoff', 'walkoff'],
  ['buzzer-beater', 'buzzer-beater'],
  ['buzzer', 'buzzer-beater'],
  ['legendary', 'legendary'],
])

function normalizeVariantToken(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, '-')
}

export function cardVariantFromTemplate(template: Pick<CardTemplateRecord, 'slug' | 'themeName'>) {
  const tokens = [template.slug, template.themeName].map(normalizeVariantToken)

  for (const token of tokens) {
    const directMatch = variantAliases.get(token)
    if (directMatch) {
      return directMatch
    }

    for (const [alias, variant] of variantAliases.entries()) {
      if (token.includes(alias)) {
        return variant
      }
    }
  }

  return 'base'
}

export function buildSeatInfo({
  section,
  row,
  seat,
}: {
  section?: string | null
  row?: string | null
  seat?: string | null
}) {
  const parts = [
    section ? `Section ${section}` : null,
    row ? `Row ${row}` : null,
    seat ? `Seat ${seat}` : null,
  ].filter(Boolean)

  return parts.length > 0 ? parts.join(' • ') : 'Seat details pending'
}

export function formatMomentDateLabel(date: Date | null | undefined) {
  if (!date) {
    return 'Date pending'
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date)
}

export function memoryRatingLabel(memoryRating: number) {
  return `${memoryRating.toFixed(1)} Memory`
}

export function hypeLabelFromRating(memoryRating: number) {
  if (memoryRating >= 10) {
    return 'Hype Mythic'
  }

  if (memoryRating >= 9.5) {
    return 'Hype SS'
  }

  if (memoryRating >= 9) {
    return 'Hype S'
  }

  if (memoryRating >= 8) {
    return 'Hype A'
  }

  if (memoryRating >= 7) {
    return 'Hype B'
  }

  return 'Hype C'
}

export function buildMomentCardData({
  collectionBadges = [],
  media,
  mediaUrl,
  moment,
  template,
  venue,
}: {
  collectionBadges?: string[]
  media: Pick<MomentMediaRecord, 'storageKey'> | null
  mediaUrl: string
  moment: Pick<
    MomentRecord,
    | 'id'
    | 'title'
    | 'caption'
    | 'matchup'
    | 'finalScore'
    | 'memoryRating'
    | 'capturedAt'
    | 'section'
    | 'row'
    | 'seat'
    | 'createdAt'
    | 'visibility'
  >
  template: Pick<CardTemplateRecord, 'name' | 'slug' | 'themeName'>
  venue: Pick<VenueRecord, 'name'> | null
}): MomentCardData {
  const cardVariant = cardVariantFromTemplate(template)
  const story = moment.caption?.trim() || 'Moment story coming soon.'

  return {
    id: moment.id,
    variant: cardVariant,
    momentId: moment.id.slice(0, 8).toUpperCase(),
    venue: venue?.name || 'Venue pending',
    matchup: moment.matchup,
    dateLabel: formatMomentDateLabel(moment.capturedAt ?? moment.createdAt),
    finalScore: moment.finalScore,
    memoryRatingLabel: memoryRatingLabel(moment.memoryRating),
    hypeLabel: hypeLabelFromRating(moment.memoryRating),
    rarity: template.name,
    title: moment.title,
    seatInfo: buildSeatInfo({
      section: moment.section,
      row: moment.row,
      seat: moment.seat,
    }),
    story,
    gameDetails: [
      `${moment.matchup} finished ${moment.finalScore}.`,
      `Visibility: ${moment.visibility}.`,
      media ? `Media sealed in storage key ${media.storageKey.split('/').pop()}.` : 'Media upload pending.',
    ],
    companions: [],
    tags: [],
    collectionBadges:
      collectionBadges.length > 0 ? collectionBadges : ['Collection badges placeholder'],
    photoSrc: mediaUrl,
  }
}
