import { createFileRoute } from '@tanstack/react-router'

import { updateCollectionSettings } from '#/server/collections.server'

async function handleUpdateCollection({
  params,
  request,
}: {
  params: { collectionId: string }
  request: Request
}) {
  try {
    const payload = (await request.json()) as {
      visibility?: 'public' | 'friends' | 'private'
      coverMomentId?: string | null
    }

    const result = await updateCollectionSettings({
      collectionId: params.collectionId,
      visibility: payload.visibility || 'public',
      coverMomentId: payload.coverMomentId ?? null,
    })

    return Response.json(result)
  } catch (error) {
    return Response.json(
      {
        error: error instanceof Error ? error.message : 'Unable to update collection.',
      },
      {
        status: 400,
      },
    )
  }
}

export const Route = createFileRoute('/api/collections/$collectionId')({
  server: {
    handlers: {
      PATCH: handleUpdateCollection,
    },
  },
})
