import { eq } from 'drizzle-orm'
import { createServerFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'

import { createDb } from '#/db/client'
import { profiles } from '#/db/schema'
import { updateProfileSchema } from '#/lib/auth-profile'
import { env } from 'cloudflare:workers'
import { getAuth, requireCurrentUser } from './auth'

export const getCurrentUserSnapshot = createServerFn({ method: 'GET' }).handler(
  async () => requireCurrentUser(),
)

export const updateCurrentProfile = createServerFn({ method: 'POST' })
  .validator(updateProfileSchema)
  .handler(async ({ data }) => {
    const currentUser = await requireCurrentUser()
    const auth = getAuth()
    const request = getRequest()

    await auth.api.updateUser({
      headers: request.headers,
      body: {
        name: data.displayName,
        username: data.username,
      },
    })

    const db = createDb(env.DB)
    const now = new Date()

    await db
      .update(profiles)
      .set({
        bio: data.bio?.trim() || null,
        updatedAt: now,
      })
      .where(eq(profiles.authUserId, currentUser.user.id))

    return requireCurrentUser()
  })
