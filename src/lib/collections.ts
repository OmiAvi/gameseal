export function slugifyCollectionTitle(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function buildCollectionSlug(value: string) {
  return slugifyCollectionTitle(value) || 'collection'
}

export function getNextCoverMomentIdOnRemoval({
  currentCoverMomentId,
  removedMomentId,
  remainingMomentIds,
}: {
  currentCoverMomentId: string | null
  removedMomentId: string
  remainingMomentIds: string[]
}) {
  if (currentCoverMomentId !== removedMomentId) {
    return currentCoverMomentId
  }

  return remainingMomentIds[0] ?? null
}
