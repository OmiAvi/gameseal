import { createFileRoute } from '@tanstack/react-router'

import {
  addMomentToCollection,
  removeMomentFromCollection,
} from '#/server/collections.server'

async function handleAddMoment({
  params,
  request,
}: {
  params: { collectionId: string }
  request: Request
}) {
  try {
    const payload = (await request.json()) as {
      momentId?: string
    }

    const result = await addMomentToCollection({
      collectionId: params.collectionId,
      momentId: payload.momentId || '',
    })

    return Response.json(result)
  } catch (error) {
    return Response.json(
      {
        error: error instanceof Error ? error.message : 'Unable to add moment to collection.',
      },
      {
        status: 400,
      },
    )
  }
}

async function handleRemoveMoment({
  params,
  request,
}: {
  params: { collectionId: string }
  request: Request
}) {
  try {
    const payload = (await request.json()) as {
      momentId?: string
    }

    const result = await removeMomentFromCollection({
      collectionId: params.collectionId,
      momentId: payload.momentId || '',
    })

    return Response.json(result)
  } catch (error) {
    return Response.json(
      {
        error: error instanceof Error ? error.message : 'Unable to remove moment from collection.',
      },
      {
        status: 400,
      },
    )
  }
}

export const Route = createFileRoute('/api/collections/$collectionId/moments')({
  server: {
    handlers: {
      POST: handleAddMoment,
      DELETE: handleRemoveMoment,
    },
  },
})
