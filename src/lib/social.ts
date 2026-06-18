export const MOMENT_REACTION_TYPES = ['fire', 'cheer', 'wow', 'ice'] as const

export type MomentReactionType = (typeof MOMENT_REACTION_TYPES)[number]

export function normalizeProfileSearchQuery(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, ' ')
}

export function slugifySocialName(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function parseMatchupTeams(matchup: string) {
  const normalized = matchup.trim().replace(/\s+/g, ' ')
  const vsMatch = normalized.match(/^(.+?)\s+(?:vs\.?|v\.?)\s+(.+)$/i)

  if (vsMatch) {
    return {
      awayTeamName: vsMatch[1].trim(),
      homeTeamName: vsMatch[2].trim(),
    }
  }

  const atMatch = normalized.match(/^(.+?)\s+at\s+(.+)$/i)

  if (atMatch) {
    return {
      awayTeamName: atMatch[1].trim(),
      homeTeamName: atMatch[2].trim(),
    }
  }

  return {
    awayTeamName: normalized,
    homeTeamName: normalized,
  }
}
