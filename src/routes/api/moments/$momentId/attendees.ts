import { createFileRoute } from '@tanstack/react-router'

import { markMomentAttendance } from '#/server/social.server'

async function handleCheckIn({ params }: { params: { momentId: string } }) {
  try {
    const result = await markMomentAttendance(params.momentId)

    return Response.json(result)
  } catch (error) {
    return Response.json(
      {
        error: error instanceof Error ? error.message : 'Unable to mark attendance.',
      },
      { status: 400 },
    )
  }
}

export const Route = createFileRoute('/api/moments/$momentId/attendees')({
  server: {
    handlers: {
      POST: handleCheckIn,
    },
  },
})
