import { useState } from 'react'

import { Link, createFileRoute, useRouter } from '@tanstack/react-router'
import { z } from 'zod'

import { InfoPanel, PageIntro, StateCard } from '#/components/route-state'
import { authClient } from '#/lib/auth-client'

const searchSchema = z.object({
  redirect: z.string().optional(),
})

export const Route = createFileRoute('/sign-up')({
  validateSearch: searchSchema,
  component: SignUpRoute,
})

function SignUpRoute() {
  const search = Route.useSearch()
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function onSubmit(formData: FormData) {
    setError(null)
    setIsSubmitting(true)

    const result = await authClient.signUp.email({
      email: String(formData.get('email') || ''),
      password: String(formData.get('password') || ''),
      name: String(formData.get('displayName') || ''),
      username: String(formData.get('username') || ''),
      callbackURL: search.redirect,
    })

    setIsSubmitting(false)

    if (result.error) {
      setError(result.error.message || 'Unable to create your account.')
      return
    }

    await router.navigate({ to: search.redirect || '/settings' })
  }

  return (
    <div className="space-y-5">
      <PageIntro
        eyebrow="Create account"
        title="Join GameSeal"
        description="Set up email/password access and reserve a username for your collector profile."
      />

      <InfoPanel
        title="Create your profile"
        description="Your Better Auth account creates a matching GameSeal profile in D1 right after sign up."
      >
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault()
            void onSubmit(new FormData(event.currentTarget))
          }}
        >
          <label className="block space-y-2 text-sm text-slate-200">
            <span>Display name</span>
            <input
              required
              className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none ring-0"
              name="displayName"
              type="text"
            />
          </label>

          <label className="block space-y-2 text-sm text-slate-200">
            <span>Username</span>
            <input
              required
              className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none ring-0"
              name="username"
              type="text"
            />
          </label>

          <label className="block space-y-2 text-sm text-slate-200">
            <span>Email</span>
            <input
              required
              className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none ring-0"
              name="email"
              type="email"
            />
          </label>

          <label className="block space-y-2 text-sm text-slate-200">
            <span>Password</span>
            <input
              required
              minLength={8}
              className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none ring-0"
              name="password"
              type="password"
            />
          </label>

          {error ? (
            <StateCard title="Sign-up failed" message={error} tone="danger" />
          ) : null}

          <button
            type="submit"
            className="w-full rounded-2xl bg-amber-400 px-4 py-3 font-semibold text-slate-950 transition hover:bg-amber-300 disabled:opacity-60"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Creating account...' : 'Create account'}
          </button>
        </form>
      </InfoPanel>

      <InfoPanel
        title="Already have an account?"
        description="Sign back in with your existing email and password."
      >
        <Link
          to="/sign-in"
          search={{ redirect: search.redirect }}
          className="text-sm font-medium text-teal-200 no-underline"
        >
          Go to sign in
        </Link>
      </InfoPanel>
    </div>
  )
}
