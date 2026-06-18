import { describe, expect, test } from 'vitest'

import { updateProfileSchema } from './auth-profile'

describe('auth profile validation', () => {
  test('normalizes whitespace around profile fields', () => {
    const result = updateProfileSchema.parse({
      displayName: '  Alex  ',
      username: '  alex_collector  ',
      bio: '  Courtside collector  ',
    })

    expect(result).toEqual({
      displayName: 'Alex',
      username: 'alex_collector',
      bio: 'Courtside collector',
    })
  })

  test('rejects invalid usernames', () => {
    const result = updateProfileSchema.safeParse({
      displayName: 'Alex',
      username: 'alex collector',
      bio: '',
    })

    expect(result.success).toBe(false)
  })
})
