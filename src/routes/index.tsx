import { createFileRoute, redirect } from '@tanstack/react-router'

import { getViewerSnapshot } from '#/server/auth.functions'

export const Route = createFileRoute('/')({
  beforeLoad: async () => {
    const viewer = await getViewerSnapshot()
    throw redirect({ to: viewer ? '/feed' : '/sign-up' })
  },
})
