import { describe, expect, test } from 'vitest'

import {
  buildSeatInfo,
  cardVariantFromTemplate,
  formatMomentDateLabel,
} from './moment-card-data'

describe('moment card data helpers', () => {
  test('maps templates onto known card variants', () => {
    expect(
      cardVariantFromTemplate({
        slug: 'playoff-prime',
        themeName: 'playoff',
      }),
    ).toBe('playoff')
  })

  test('builds seat info from partial location details', () => {
    expect(
      buildSeatInfo({
        section: '112',
        row: 'F',
        seat: '9',
      }),
    ).toBe('Section 112 • Row F • Seat 9')
  })

  test('formats saved moment dates for slab labels', () => {
    expect(formatMomentDateLabel(new Date('2026-06-18T12:00:00.000Z'))).toBe('Jun 18, 2026')
  })
})
