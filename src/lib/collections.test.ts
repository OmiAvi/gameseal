import { describe, expect, test } from 'vitest'

import { buildCollectionSlug, getNextCoverMomentIdOnRemoval } from './collections'

describe('collection helpers', () => {
  test('normalizes collection titles into slugs', () => {
    expect(buildCollectionSlug('  Opening Night Classics  ')).toBe('opening-night-classics')
  })

  test('falls back to a default slug when the title has no slug characters', () => {
    expect(buildCollectionSlug('!!!')).toBe('collection')
  })

  test('keeps the existing cover when a different moment is removed', () => {
    expect(
      getNextCoverMomentIdOnRemoval({
        currentCoverMomentId: 'moment-1',
        removedMomentId: 'moment-2',
        remainingMomentIds: ['moment-1', 'moment-3'],
      }),
    ).toBe('moment-1')
  })

  test('promotes the next remaining moment when the cover is removed', () => {
    expect(
      getNextCoverMomentIdOnRemoval({
        currentCoverMomentId: 'moment-1',
        removedMomentId: 'moment-1',
        remainingMomentIds: ['moment-3', 'moment-4'],
      }),
    ).toBe('moment-3')
  })
})
