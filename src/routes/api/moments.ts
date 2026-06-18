import { createFileRoute } from '@tanstack/react-router'

import { createMomentFromRequest } from '#/server/moments.server'

async function handleCreateMoment({ request }: { request: Request }) {
  try {
    const payload = await createMomentFromRequest(request)

    return Response.json(payload, {
      status: 201,
    })
  } catch (error) {
    return Response.json(
      {
        error: error instanceof Error ? error.message : 'Unable to mint this moment.',
      },
      {
        status: 400,
      },
    )
  }
}

export const Route = createFileRoute('/api/moments')({
  server: {
    handlers: {
      POST: handleCreateMoment,
    },
  },
})
