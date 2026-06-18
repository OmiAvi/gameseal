import { useEffect, useMemo, useState } from 'react'

import { Link, createFileRoute } from '@tanstack/react-router'
import { Globe2, Grid2x2, LockKeyhole, MapPinned } from 'lucide-react'
import { z } from 'zod'

import { MomentCard3D } from '#/components/moment-card-3d'
import { InfoPanel, PageIntro, StateCard } from '#/components/route-state'
import { VaultVenueMap } from '#/components/vault-venue-map'
import { getCollectionSnapshot } from '#/server/app.functions'

const collectionSearchSchema = z.object({
  view: z.enum(['cards', 'map']).optional(),
})

export const Route = createFileRoute('/collections/$collectionId')({
  validateSearch: collectionSearchSchema,
  loader: ({ params }) => getCollectionSnapshot({ data: params }),
  pendingComponent: () => (
    <StateCard
      title="Loading collection"
      message="Pulling saved cards, cover slab, and allowed venue markers."
    />
  ),
  errorComponent: ({ error }) => (
    <StateCard
      title="Collection unavailable"
      message={error.message || 'We could not load this collection right now.'}
      tone="danger"
    />
  ),
  component: CollectionRoute,
})

function CollectionRoute() {
  const data = Route.useLoaderData()
  const search = Route.useSearch()
  const view = search.view ?? 'cards'
  const [selectedVenueId, setSelectedVenueId] = useState<string | null>(
    data.mappedVenues[0]?.id ?? null,
  )
  const [visibility, setVisibility] = useState<'public' | 'friends' | 'private'>(data.visibility)
  const [coverMomentId, setCoverMomentId] = useState<string | null>(data.coverCard?.momentId ?? null)
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!selectedVenueId && data.mappedVenues[0]) {
      setSelectedVenueId(data.mappedVenues[0].id)
    }
  }, [data.mappedVenues, selectedVenueId])

  const selectedVenue = useMemo(
    () => data.venues.find((venue) => venue.id === selectedVenueId) ?? data.venues[0] ?? null,
    [data.venues, selectedVenueId],
  )

  async function saveCollectionSettings() {
    setSaveState('saving')
    setError(null)

    try {
      const response = await fetch(`/api/collections/${data.id}`, {
        method: 'PATCH',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          visibility,
          coverMomentId,
        }),
      })

      const payload = (await response.json()) as { error?: string }
      if (!response.ok) {
        throw new Error(payload.error || 'Unable to update collection settings.')
      }

      setSaveState('saved')
    } catch (caught) {
      setSaveState('error')
      setError(caught instanceof Error ? caught.message : 'Unable to update collection settings.')
    }
  }

  return (
    <div className="space-y-5">
      <PageIntro
        eyebrow="Collection"
        title={data.title}
        description={
          data.description?.trim() ||
          `Curated by ${data.ownerDisplayName}. Switch between card and map views with the URL-backed toggle.`
        }
        action={
          <div className="rounded-full border border-white/10 bg-slate-950/55 p-3 text-slate-100">
            {data.visibility === 'private' ? (
              <LockKeyhole className="h-5 w-5" />
            ) : (
              <Globe2 className="h-5 w-5" />
            )}
          </div>
        }
      />

      {data.coverCard ? (
        <div className="lg:max-w-md">
          <MomentCard3D moment={data.coverCard.card} />
        </div>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Cards" value={String(data.stats.cardCount)} />
        <StatCard label="Venues" value={String(data.stats.venueCount)} />
        <StatCard label="Mapped venues" value={String(data.stats.mappedVenueCount)} />
      </section>

      <InfoPanel
        title="Collection view"
        description="Switch between collectible card layout and venue map view."
      >
        <div className="grid grid-cols-2 gap-2">
          <Link
            className={`flex items-center justify-center gap-2 rounded-[1.2rem] border px-4 py-3 text-sm font-medium no-underline transition ${
              view === 'cards'
                ? 'border-teal-300/30 bg-teal-400/15 text-teal-50'
                : 'border-white/10 bg-white/5 text-slate-300 hover:text-white'
            }`}
            params={{ collectionId: data.id }}
            search={{ view: 'cards' }}
            to="/collections/$collectionId"
          >
            <Grid2x2 className="h-4 w-4" />
            Card view
          </Link>
          <Link
            className={`flex items-center justify-center gap-2 rounded-[1.2rem] border px-4 py-3 text-sm font-medium no-underline transition ${
              view === 'map'
                ? 'border-amber-300/30 bg-amber-400/15 text-amber-50'
                : 'border-white/10 bg-white/5 text-slate-300 hover:text-white'
            }`}
            params={{ collectionId: data.id }}
            search={{ view: 'map' }}
            to="/collections/$collectionId"
          >
            <MapPinned className="h-4 w-4" />
            Map view
          </Link>
        </div>
      </InfoPanel>

      {data.isOwner ? (
        <InfoPanel
          title="Collection settings"
          description="Owners can set collection visibility and choose which saved card should act as the cover slab."
        >
          <div className="space-y-4">
            <label className="block space-y-2 text-sm text-slate-200">
              <span>Visibility</span>
              <select
                className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white"
                value={visibility}
                onChange={(event) =>
                  setVisibility(event.target.value as 'public' | 'friends' | 'private')
                }
              >
                <option value="public">Public</option>
                <option value="friends">Friends only</option>
                <option value="private">Private</option>
              </select>
            </label>

            <label className="block space-y-2 text-sm text-slate-200">
              <span>Cover card</span>
              <select
                className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white"
                value={coverMomentId ?? ''}
                onChange={(event) => setCoverMomentId(event.target.value || null)}
              >
                {data.cards.map((entry) => (
                  <option key={entry.momentId} value={entry.momentId}>
                    {entry.title}
                  </option>
                ))}
              </select>
            </label>

            {error ? <StateCard title="Save failed" message={error} tone="danger" /> : null}
            {saveState === 'saved' ? (
              <StateCard title="Saved" message="Collection settings updated." />
            ) : null}

            <button
              type="button"
              className="w-full rounded-2xl bg-amber-400 px-4 py-3 font-semibold text-slate-950 transition hover:bg-amber-300 disabled:opacity-60"
              disabled={saveState === 'saving'}
              onClick={() => {
                void saveCollectionSettings()
              }}
            >
              {saveState === 'saving' ? 'Saving...' : 'Save collection settings'}
            </button>
          </div>
        </InfoPanel>
      ) : null}

      {data.cards.length === 0 ? (
        <StateCard
          title="Collection is empty"
          message="No visible cards are in this collection yet."
        />
      ) : null}

      {data.cards.length > 0 && view === 'cards' ? (
        <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {data.cards.map((entry) => (
            <div key={entry.momentId} className="space-y-3">
              <MomentCard3D moment={entry.card} />
              <InfoPanel
                title={entry.title}
                description={`${entry.venueName} • ${entry.dateLabel} • ${entry.seatInfo}`}
              >
                <Link
                  className="text-sm font-medium text-teal-200 no-underline"
                  params={{ momentId: entry.momentId }}
                  to="/moments/$momentId"
                >
                  Open saved moment
                </Link>
              </InfoPanel>
            </div>
          ))}
        </section>
      ) : null}

      {data.cards.length > 0 && view === 'map' ? (
        data.mappedVenues.length > 0 ? (
          <section className="space-y-5">
            <VaultVenueMap
              points={data.mappedVenues}
              selectedVenueId={selectedVenueId}
              onSelectVenue={setSelectedVenueId}
            />

            {selectedVenue ? (
              <div className="rounded-t-[2rem] border border-white/10 bg-slate-950/85 p-5 shadow-[0_-18px_60px_rgba(2,6,23,0.3)]">
                <div className="mb-4 flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.26em] text-amber-200/80">
                      Venue moments
                    </p>
                    <h2 className="mt-1 text-2xl font-semibold text-white">{selectedVenue.name}</h2>
                    <p className="mt-2 text-sm text-slate-300">
                      {[selectedVenue.city, selectedVenue.region].filter(Boolean).join(', ')}
                    </p>
                  </div>
                  <div className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-100">
                    {selectedVenue.moments.length} cards
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  {selectedVenue.moments.map((entry) => (
                    <Link
                      key={entry.momentId}
                      className="block rounded-[1.4rem] border border-white/10 bg-white/5 p-4 text-left no-underline transition hover:border-teal-300/30 hover:bg-white/8"
                      params={{ momentId: entry.momentId }}
                      to="/moments/$momentId"
                    >
                      <p className="text-base font-semibold text-white">{entry.title}</p>
                      <p className="mt-2 text-sm text-slate-300">
                        {entry.matchup} • {entry.finalScore}
                      </p>
                      <p className="mt-2 text-sm text-slate-400">{entry.dateLabel}</p>
                    </Link>
                  ))}
                </div>
              </div>
            ) : null}
          </section>
        ) : (
          <StateCard
            title="No mapped venues yet"
            message="This collection has visible cards, but none of their venues currently include map coordinates."
          />
        )
      ) : null}
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.6rem] border border-white/10 bg-slate-950/55 p-4">
      <p className="text-xs uppercase tracking-[0.24em] text-slate-400">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
    </div>
  )
}
