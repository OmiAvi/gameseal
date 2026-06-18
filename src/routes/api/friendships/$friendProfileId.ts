import { createFileRoute } from '@tanstack/react-router'

import { removeFriendshipWithProfile } from '#/server/social.server'

async function handleDelete({ params }: { params: { friendProfileId: string } }) {
  try {
    const result = await removeFriendshipWithProfile(params.friendProfileId)

    return Response.json(result)
  } catch (error) {
    return Response.json(
      {
        error: error instanceof Error ? error.message : 'Unable to remove friend.',
      },
      { status: 400 },
    )
  }
}

export const Route = createFileRoute('/api/friendships/$friendProfileId')({
  server: {
    handlers: {
      DELETE: handleDelete,
    },
  },
})
