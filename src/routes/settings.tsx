import { useState } from 'react'

import { createFileRoute } from '@tanstack/react-router'

import { InfoPanel, PageIntro, StateCard } from '#/components/route-state'
import { getCurrentUserSnapshot, updateCurrentProfile } from '#/server/auth.functions'

export const Route = createFileRoute('/settings')({
  loader: () => getCurrentUserSnapshot(),
  pendingComponent: () => (
    <StateCard title="Loading settings" message="Loading your profile and account session." />
  ),
  errorComponent: ({ error }) => (
    <StateCard
      title="Settings unavailable"
      message={error.message || 'We could not load settings right now.'}
      tone="danger"
    />
  ),
  component: SettingsRoute,
})

function SettingsRoute() {
  const data = Route.useLoaderData()
  const username = data.profile.username
  const bio = data.profile.bio ?? ''
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)

  async function onSubmit(formData: FormData) {
    setError(null)
    setSuccess(null)
    setIsSaving(true)

    try {
      await updateCurrentProfile({
        data: {
          displayName: String(formData.get('displayName') || ''),
          username: String(formData.get('username') || ''),
          bio: String(formData.get('bio') || ''),
        },
      })
      setSuccess('Profile updated.')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to save changes.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="gs-page-narrow">
      <PageIntro
        eyebrow="Account controls"
        title="Settings"
        description="Manage the public profile tied to your Better Auth session without touching the collectible presentation layer."
      />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <InfoPanel
          title="Profile"
          description={`Signed in as ${data.user.email}. Update the public details people see around your cards and vault.`}
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
              <input
                required
                defaultValue={data.user.name}
                className="gs-field"
                name="displayName"
                type="text"
              />
            </label>

            <label className="gs-form-label">
              <span>Username</span>
              <input
                required
                defaultValue={username}
                className="gs-field"
                name="username"
                type="text"
              />
            </label>

            <label className="gs-form-label">
              <span>Bio</span>
              <textarea
                defaultValue={bio}
                className="gs-textarea"
                maxLength={160}
                name="bio"
              />
            </label>

            {error ? <StateCard title="Update failed" message={error} tone="danger" /> : null}
            {success ? <StateCard title="Saved" message={success} /> : null}

            <button type="submit" className="gs-button-primary w-full" disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save profile'}
            </button>
          </form>
        </InfoPanel>

        <InfoPanel
          title="Profile usage"
          description="Your name, username, and bio appear in the feed, vault, and collection views."
          muted
        >
          <div className="space-y-3 text-sm text-[var(--gs-ink-soft)]">
            <div className="gs-list-row">
              Public vault links use <strong className="text-[var(--gs-ink)]">@{username}</strong>
            </div>
            <div className="gs-list-row">
              Bios stay capped at <strong className="text-[var(--gs-ink)]">160 characters</strong>
            </div>
          </div>
        </InfoPanel>
      </div>
    </div>
  )
}
