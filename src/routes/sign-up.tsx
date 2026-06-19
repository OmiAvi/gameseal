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
    <div className="gs-page-narrow">
      <PageIntro
        eyebrow="New collector"
        title="Create your GameSeal account"
        description="Reserve your display name and username, then start minting moments into premium collectibles."
      />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <InfoPanel
          title="Create your profile"
          description="Signing up creates the auth account and matching collector profile in D1 right away."
        >
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault()
              void onSubmit(new FormData(event.currentTarget))
            }}
          >
            <label className="gs-form-label">
              <span>Display name</span>
              <input required className="gs-field" name="displayName" type="text" />
            </label>

            <label className="gs-form-label">
              <span>Username</span>
              <input required className="gs-field" name="username" type="text" />
            </label>

            <label className="gs-form-label">
              <span>Email</span>
              <input required className="gs-field" name="email" type="email" />
            </label>

            <label className="gs-form-label">
              <span>Password</span>
              <input required minLength={8} className="gs-field" name="password" type="password" />
            </label>

            {error ? <StateCard title="Sign-up failed" message={error} tone="danger" /> : null}

            <button type="submit" className="gs-button-primary w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Creating account...' : 'Create account'}
            </button>
          </form>
        </InfoPanel>

        <InfoPanel
          title="Already inside?"
          description="Use your existing email and password to get back to your collector workspace."
          muted
        >
          <Link
            to="/sign-in"
            search={{ redirect: search.redirect }}
            className="inline-flex text-sm font-semibold text-[var(--gs-action)]"
          >
            Go to sign in
          </Link>
        </InfoPanel>
      </div>
    </div>
  )
}
