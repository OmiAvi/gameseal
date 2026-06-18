import { createFileRoute } from '@tanstack/react-router'

import { respondToFriendRequest } from '#/server/social.server'

async function handleRespond({
  params,
  request,
}: {
  params: { requestId: string }
  request: Request
}) {
  try {
    const payload = (await request.json()) as {
      action?: 'accept' | 'decline'
    }

    const result = await respondToFriendRequest({
      requestId: params.requestId,
      action: payload.action || 'decline',
    })

    return Response.json(result)
  } catch (error) {
    return Response.json(
      {
        error: error instanceof Error ? error.message : 'Unable to update friend request.',
      },
      { status: 400 },
    )
  }
}

export const Route = createFileRoute('/api/friend-requests/$requestId')({
  server: {
    handlers: {
      PATCH: handleRespond,
    },
  },
})
