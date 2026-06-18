const FULL_ROTATION = 360
const DEFAULT_SENSITIVITY = 0.9

export const momentCardVariants = [
  'base',
  'rivalry',
  'playoff',
  'road-game',
  'first-venue',
  'overtime',
  'walkoff',
  'buzzer-beater',
  'legendary',
] as const

export type MomentCardVariant = (typeof momentCardVariants)[number]

export type MomentCardFace = 'front' | 'back'

export interface MomentCardData {
  id: string
  variant: MomentCardVariant
  momentId: string
  venue: string
  matchup: string
  dateLabel: string
  finalScore: string
  memoryRatingLabel: string
  hypeLabel: string
  rarity: string
  title: string
  seatInfo: string
  story: string
  gameDetails: string[]
  companions: string[]
  tags: string[]
  collectionBadges: string[]
  photoSrc: string
}

export function normalizeRotation(rotation: number) {
  const value = rotation % FULL_ROTATION
  return value < 0 ? value + FULL_ROTATION : value
}

export function nextRotationFromDelta(
  startRotation: number,
  deltaX: number,
  sensitivity = DEFAULT_SENSITIVITY,
) {
  return normalizeRotation(startRotation + deltaX * sensitivity)
}

export function flipRotation(rotation: number) {
  return normalizeRotation(rotation + 180)
}

export function visibleCardSide(rotation: number): MomentCardFace {
  const normalized = normalizeRotation(rotation)
  return normalized >= 90 && normalized < 270 ? 'back' : 'front'
}

export function flipCardKeyPressed(key: string) {
  return key === 'Enter' || key === ' '
}
