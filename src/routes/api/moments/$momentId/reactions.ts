import { createFileRoute } from '@tanstack/react-router'

import { toggleMomentReaction } from '#/server/social.server'

async function handleToggle({
  params,
  request,
}: {
  params: { momentId: string }
  request: Request
}) {
  try {
    const payload = (await request.json()) as {
      reactionType?: 'fire' | 'cheer' | 'wow' | 'ice'
    }

    const result = await toggleMomentReaction({
      momentId: params.momentId,
      reactionType: payload.reactionType || 'fire',
    })

    return Response.json(result)
  } catch (error) {
    return Response.json(
      {
        error: error instanceof Error ? error.message : 'Unable to update reaction.',
      },
      { status: 400 },
    )
  }
}

export const Route = createFileRoute('/api/moments/$momentId/reactions')({
  server: {
    handlers: {
      POST: handleToggle,
    },
  },
})
