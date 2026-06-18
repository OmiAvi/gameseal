import { describe, expect, test } from 'vitest'

import {
  flipCardKeyPressed,
  flipRotation,
  nextRotationFromDelta,
  normalizeRotation,
  visibleCardSide,
} from './moment-card'

describe('moment-card helpers', () => {
  test('normalizes negative rotation values into a full circle', () => {
    expect(normalizeRotation(-45)).toBe(315)
  })

  test('applies drag deltas with wraparound', () => {
    expect(nextRotationFromDelta(350, 20, 1)).toBe(10)
  })

  test('flips to the opposite face across the full circle', () => {
    expect(flipRotation(0)).toBe(180)
    expect(flipRotation(270)).toBe(90)
  })

  test('detects which face is visible from the rotation angle', () => {
    expect(visibleCardSide(0)).toBe('front')
    expect(visibleCardSide(180)).toBe('back')
    expect(visibleCardSide(360)).toBe('front')
  })

  test('only flips on keyboard activation keys', () => {
    expect(flipCardKeyPressed('Enter')).toBe(true)
    expect(flipCardKeyPressed(' ')).toBe(true)
    expect(flipCardKeyPressed('Escape')).toBe(false)
  })
})
