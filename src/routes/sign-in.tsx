import { useState } from 'react'

import { Link, createFileRoute, redirect, useRouter } from '@tanstack/react-router'
import { z } from 'zod'

import { InfoPanel, PageIntro, StateCard } from '#/components/route-state'
import { authClient } from '#/lib/auth-client'
import { getViewerSnapshot } from '#/server/auth.functions'

const searchSchema = z.object({
  redirect: z.string().optional(),
})

export const Route = createFileRoute('/sign-in')({
  validateSearch: searchSchema,
  beforeLoad: async () => {
    const viewer = await getViewerSnapshot()
    if (viewer) {
      throw redirect({ to: '/feed' })
    }
  },
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

    await router.navigate({ to: search.redirect || '/feed' })
  }

  return (
    <div className="gs-page-narrow">
      <PageIntro
        eyebrow="Account access"
        title="Sign in to your collector profile"
        description="Use your email and password to get back into your feed, vault, and mint workspace."
      />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <InfoPanel
          title="Email access"
          description="Authentication stays simple here so the product surfaces can stay focused on the moments."
        >
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault()
              void onSubmit(new FormData(event.currentTarget))
            }}
          >
            <label className="gs-form-label">
              <span>Email</span>
              <input required className="gs-field" name="email" type="email" />
            </label>

            <label className="gs-form-label">
              <span>Password</span>
              <input required className="gs-field" name="password" type="password" />
            </label>

            {error ? <StateCard title="Sign-in failed" message={error} tone="danger" /> : null}

            <button type="submit" className="gs-button-primary w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
        </InfoPanel>

        <InfoPanel
          title="Need an account?"
          description="Create a new collector identity with display name, username, and email access."
          muted
        >
          <Link
            to="/sign-up"
            search={{ redirect: search.redirect }}
            className="inline-flex text-sm font-semibold text-[var(--gs-action)]"
          >
            Go to sign up
          </Link>
        </InfoPanel>
      </div>
    </div>
  )
}
