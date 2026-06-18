import { describe, expect, test } from 'vitest'

import {
  normalizeProfileSearchQuery,
  parseMatchupTeams,
  slugifySocialName,
} from './social'

describe('social helpers', () => {
  test('normalizes people search input', () => {
    expect(normalizeProfileSearchQuery('  Alex   Rivers  ')).toBe('alex rivers')
  })

  test('parses matchup strings with vs separator', () => {
    expect(parseMatchupTeams('Lions vs. Comets')).toEqual({
      awayTeamName: 'Lions',
      homeTeamName: 'Comets',
    })
  })

  test('parses matchup strings with at separator', () => {
    expect(parseMatchupTeams('Pilots at Owls')).toEqual({
      awayTeamName: 'Pilots',
      homeTeamName: 'Owls',
    })
  })

  test('slugifies social names for placeholder records', () => {
    expect(slugifySocialName('New York Knights')).toBe('new-york-knights')
  })
})
