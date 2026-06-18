import { createFileRoute } from '@tanstack/react-router'

import { searchProfilesForViewer } from '#/server/social.server'

async function handleSearch(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const results = await searchProfilesForViewer(searchParams.get('q') || '')

    return Response.json({
      results,
    })
  } catch (error) {
    return Response.json(
      {
        error: error instanceof Error ? error.message : 'Unable to search collectors.',
      },
      { status: 400 },
    )
  }
}

export const Route = createFileRoute('/api/friends/search')({
  server: {
    handlers: {
      GET: ({ request }) => handleSearch(request),
    },
  },
})
