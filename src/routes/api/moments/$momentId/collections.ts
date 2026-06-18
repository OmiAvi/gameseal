import { createFileRoute } from '@tanstack/react-router'

import { loadViewerCollectionsForMoment } from '#/server/collections.server'

async function handleGetCollections({
  params,
}: {
  params: { momentId: string }
}) {
  try {
    const result = await loadViewerCollectionsForMoment(params.momentId)

    return Response.json({
      collections: result,
    })
  } catch (error) {
    return Response.json(
      {
        error: error instanceof Error ? error.message : 'Unable to load collections.',
      },
      {
        status: 400,
      },
    )
  }
}

export const Route = createFileRoute('/api/moments/$momentId/collections')({
  server: {
    handlers: {
      GET: handleGetCollections,
    },
  },
})
