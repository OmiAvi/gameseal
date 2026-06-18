import { createFileRoute } from '@tanstack/react-router'

import { addMomentComment } from '#/server/social.server'

async function handleCreate({
  params,
  request,
}: {
  params: { momentId: string }
  request: Request
}) {
  try {
    const payload = (await request.json()) as {
      body?: string
    }

    const result = await addMomentComment({
      momentId: params.momentId,
      body: payload.body || '',
    })

    return Response.json(result, { status: 201 })
  } catch (error) {
    return Response.json(
      {
        error: error instanceof Error ? error.message : 'Unable to add comment.',
      },
      { status: 400 },
    )
  }
}

export const Route = createFileRoute('/api/moments/$momentId/comments')({
  server: {
    handlers: {
      POST: handleCreate,
    },
  },
})
