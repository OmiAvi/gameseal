import { createFileRoute } from '@tanstack/react-router'

import { createCollectionForViewer } from '#/server/collections.server'

async function handleCreateCollection({ request }: { request: Request }) {
  try {
    const payload = (await request.json()) as {
      title?: string
      description?: string
      visibility?: 'public' | 'friends' | 'private'
      coverMomentId?: string | null
    }

    const result = await createCollectionForViewer({
      title: payload.title || '',
      description: payload.description,
      visibility: payload.visibility || 'public',
      coverMomentId: payload.coverMomentId ?? null,
    })

    return Response.json(result, {
      status: 201,
    })
  } catch (error) {
    return Response.json(
      {
        error: error instanceof Error ? error.message : 'Unable to create collection.',
      },
      {
        status: 400,
      },
    )
  }
}

export const Route = createFileRoute('/api/collections')({
  server: {
    handlers: {
      POST: handleCreateCollection,
    },
  },
})
