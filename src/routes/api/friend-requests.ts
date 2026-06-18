import { createFileRoute } from '@tanstack/react-router'

import { sendFriendRequestToProfile } from '#/server/social.server'

async function handleCreateRequest({ request }: { request: Request }) {
  try {
    const payload = (await request.json()) as {
      targetProfileId?: string
      message?: string
    }

    const result = await sendFriendRequestToProfile({
      targetProfileId: payload.targetProfileId || '',
      message: payload.message,
    })

    return Response.json(result, { status: 201 })
  } catch (error) {
    return Response.json(
      {
        error: error instanceof Error ? error.message : 'Unable to send friend request.',
      },
      { status: 400 },
    )
  }
}

export const Route = createFileRoute('/api/friend-requests')({
  server: {
    handlers: {
      POST: handleCreateRequest,
    },
  },
})
