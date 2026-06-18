import { useState } from 'react'

import { createFileRoute } from '@tanstack/react-router'

import { InfoPanel, PageIntro, StateCard } from '#/components/route-state'
import { updateCurrentProfile, getCurrentUserSnapshot } from '#/server/auth.functions'

export const Route = createFileRoute('/settings')({
  loader: () => getCurrentUserSnapshot(),
  pendingComponent: () => (
    <StateCard
      title="Loading settings"
      message="Loading your profile and account session."
    />
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
    <div className="space-y-5">
      <PageIntro
        eyebrow="App controls"
        title="Settings"
        description="Manage the collector profile tied to your Better Auth account."
      />

      <InfoPanel
        title="Profile"
        description={`Signed in as ${data.user.email}. Update your public display name and username here.`}
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
              defaultValue={data.user.name}
              className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none ring-0"
              name="displayName"
              type="text"
            />
          </label>

          <label className="block space-y-2 text-sm text-slate-200">
            <span>Username</span>
            <input
              required
              defaultValue={username}
              className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none ring-0"
              name="username"
              type="text"
            />
          </label>

          <label className="block space-y-2 text-sm text-slate-200">
            <span>Bio</span>
            <textarea
              defaultValue={bio}
              className="min-h-28 w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none ring-0"
              maxLength={160}
              name="bio"
            />
          </label>

          {error ? (
            <StateCard title="Update failed" message={error} tone="danger" />
          ) : null}

          {success ? <StateCard title="Saved" message={success} /> : null}

          <button
            type="submit"
            className="w-full rounded-2xl bg-teal-400 px-4 py-3 font-semibold text-slate-950 transition hover:bg-teal-300 disabled:opacity-60"
            disabled={isSaving}
          >
            {isSaving ? 'Saving...' : 'Save profile'}
          </button>
        </form>
      </InfoPanel>
    </div>
  )
}
