import { useState } from 'react'

import { Link, createFileRoute, useRouter } from '@tanstack/react-router'
import { z } from 'zod'

import { InfoPanel, PageIntro, StateCard } from '#/components/route-state'
import { authClient } from '#/lib/auth-client'

const searchSchema = z.object({
  redirect: z.string().optional(),
})

export const Route = createFileRoute('/sign-in')({
  validateSearch: searchSchema,
  component: SignInRoute,
})

function SignInRoute() {
  const search = Route.useSearch()
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function onSubmit(formData: FormData) {
    setError(null)
    setIsSubmitting(true)

    const result = await authClient.signIn.email({
      email: String(formData.get('email') || ''),
      password: String(formData.get('password') || ''),
      callbackURL: search.redirect,
    })

    setIsSubmitting(false)

    if (result.error) {
      setError(result.error.message || 'Unable to sign in.')
      return
    }

    await router.navigate({ to: search.redirect || '/settings' })
  }

  return (
    <div className="space-y-5">
      <PageIntro
        eyebrow="Welcome back"
        title="Sign in"
        description="Use your email and password to get back into The Vault."
      />

      <InfoPanel
        title="Email access"
        description="Sign in uses Better Auth with secure sessions stored in Cloudflare D1."
      >
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault()
            void onSubmit(new FormData(event.currentTarget))
          }}
        >
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
              className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none ring-0"
              name="password"
              type="password"
            />
          </label>

          {error ? (
            <StateCard title="Sign-in failed" message={error} tone="danger" />
          ) : null}

          <button
            type="submit"
            className="w-full rounded-2xl bg-teal-400 px-4 py-3 font-semibold text-slate-950 transition hover:bg-teal-300 disabled:opacity-60"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </InfoPanel>

      <InfoPanel
        title="Need an account?"
        description="Create a new collector profile with email, display name, and username."
      >
        <Link
          to="/sign-up"
          search={{ redirect: search.redirect }}
          className="text-sm font-medium text-teal-200 no-underline"
        >
          Go to sign up
        </Link>
      </InfoPanel>
    </div>
  )
}
