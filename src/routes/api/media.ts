import { createFileRoute } from '@tanstack/react-router'

import { serveMomentMedia } from '#/server/moments.server'

async function handleGetMedia({ request }: { request: Request }) {
  const url = new URL(request.url)
  const momentId = url.searchParams.get('momentId')

  if (!momentId) {
    return new Response('Missing moment id', {
      status: 400,
    })
  }

  return serveMomentMedia(momentId)
}

export const Route = createFileRoute('/api/media')({
  server: {
    handlers: {
      GET: handleGetMedia,
    },
  },
})
