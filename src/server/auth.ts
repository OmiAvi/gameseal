import { env } from 'cloudflare:workers'

import { drizzleAdapter } from '@better-auth/drizzle-adapter'
import { eq } from 'drizzle-orm'
import { betterAuth } from 'better-auth'
import { tanstackStartCookies } from 'better-auth/tanstack-start'
import { username } from 'better-auth/plugins/username'
import { redirect } from '@tanstack/react-router'
import { getRequest } from '@tanstack/react-start/server'

import { createDb } from '#/db/client'
import {
  account,
  profiles,
  session,
  user,
  verification,
} from '#/db/schema'
import type { ProfileRecord } from '#/db/schema'

const DEVELOPMENT_SECRET = 'gameseal-dev-secret-change-me'

type SessionResult = Awaited<ReturnType<ReturnType<typeof getAuth>['api']['getSession']>>

export type CurrentUser = NonNullable<SessionResult> & {
  profile: ProfileRecord | null
}

export function getBindings() {
  return env
}

export function getDb() {
  return createDb(getBindings().DB)
}

function getAuthSecret() {
  const secret = getBindings().BETTER_AUTH_SECRET ?? process.env.BETTER_AUTH_SECRET

  if (secret) {
    return secret
  }

  if (process.env.NODE_ENV !== 'production') {
    return DEVELOPMENT_SECRET
  }

  throw new Error('BETTER_AUTH_SECRET is required in production')
}

function createProfileId(authUserId: string) {
  return `profile_${authUserId}`
}

async function syncProfileFromAuthUser(authUser: {
  id: string
  name: string
  username?: string | null
}) {
  const db = getDb()
  const now = new Date()
  const fallbackUsername =
    authUser.username?.trim().toLowerCase() || `user_${authUser.id.slice(0, 8)}`

  await db
    .insert(profiles)
    .values({
      id: createProfileId(authUser.id),
      authUserId: authUser.id,
      username: fallbackUsername,
      displayName: authUser.name,
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: profiles.authUserId,
      set: {
        username: fallbackUsername,
        displayName: authUser.name,
        updatedAt: now,
      },
    })
}

export function getAuth() {
  const db = getDb()
  const request = getRequest()

  return betterAuth({
    secret: getAuthSecret(),
    baseURL: new URL(request.url).origin,
    basePath: '/api/auth',
    database: drizzleAdapter(db, {
      provider: 'sqlite',
      schema: {
        user,
        session,
        account,
        verification,
      },
      camelCase: true,
    }),
    emailAndPassword: {
      enabled: true,
    },
    databaseHooks: {
      user: {
        create: {
          after: async (createdUser) => {
            await syncProfileFromAuthUser(createdUser)
          },
        },
        update: {
          after: async (updatedUser) => {
            await syncProfileFromAuthUser(updatedUser)
          },
        },
      },
    },
    plugins: [
      username({
        usernameNormalization: (value) => value.trim().toLowerCase(),
      }),
      tanstackStartCookies(),
    ],
  })
}

export async function getCurrentUser() {
  const auth = getAuth()
  const sessionResult = await auth.api.getSession({
    headers: getRequest().headers,
  })

  if (!sessionResult) {
    return null
  }

  const db = getDb()
  const [profile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.authUserId, sessionResult.user.id))
    .limit(1)

  return {
    ...sessionResult,
    profile,
  } satisfies CurrentUser
}

export async function requireCurrentUser() {
  const currentUser = await getCurrentUser()

  if (currentUser) {
    return currentUser
  }

  const request = getRequest()
  const { pathname, search } = new URL(request.url)

  throw redirect({
    to: '/sign-in',
    search: {
      redirect: `${pathname}${search}`,
    },
  })
}
