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
    <div className="gs-page">
      <PageIntro
        eyebrow="Collection"
        title={data.title}
        description={
          data.description?.trim() ||
          `Curated by ${data.ownerDisplayName}. Switch between card and map views with the URL-backed toggle.`
        }
        appearance="collectible"
        action={
          <div className="rounded-[1.2rem] border border-[rgba(207,177,118,0.24)] bg-white/8 p-3 text-[#f4e2bf]">
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
          <div className="gs-collectible-frame">
            <MomentCard3D moment={data.coverCard.card} />
          </div>
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
        muted
      >
        <div className="grid grid-cols-2 gap-2">
          <Link
            className={`flex items-center justify-center gap-2 rounded-[1.2rem] border px-4 py-3 text-sm font-medium no-underline transition ${
              view === 'cards'
                ? 'border-[var(--gs-border-strong)] bg-[var(--gs-ink)] text-white'
                : 'border-[var(--gs-border)] bg-white/72 text-[var(--gs-ink-soft)] hover:text-[var(--gs-ink)]'
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
                ? 'border-[rgba(207,177,118,0.28)] bg-[var(--gs-gold-soft)] text-[#6e5426]'
                : 'border-[var(--gs-border)] bg-white/72 text-[var(--gs-ink-soft)] hover:text-[var(--gs-ink)]'
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
          muted
        >
          <div className="space-y-4">
            <label className="gs-form-label">
              <span>Visibility</span>
              <select
                className="gs-select"
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

            <label className="gs-form-label">
              <span>Cover card</span>
              <select
                className="gs-select"
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
              className="gs-button-primary w-full"
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
              <div className="gs-collectible-frame">
                <MomentCard3D moment={entry.card} />
              </div>
              <InfoPanel
                title={entry.title}
                description={`${entry.venueName} • ${entry.dateLabel} • ${entry.seatInfo}`}
                appearance="collectible"
              >
                <Link
                  className="text-sm font-semibold text-[#e4c995] no-underline"
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
              <div className="gs-panel gs-panel-collectible rounded-[1.8rem]">
                <div className="mb-4 flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.26em] text-[#e4c995]">
                      Venue moments
                    </p>
                    <h2 className="mt-1 text-2xl font-semibold text-[#fff7e8]">{selectedVenue.name}</h2>
                    <p className="mt-2 text-sm text-[#d8cfbf]">
                      {[selectedVenue.city, selectedVenue.region].filter(Boolean).join(', ')}
                    </p>
                  </div>
                  <div className="gs-pill-collectible">
                    {selectedVenue.moments.length} cards
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  {selectedVenue.moments.map((entry) => (
                    <Link
                      key={entry.momentId}
                      className="gs-list-row-dark block rounded-[1.4rem] p-4 text-left no-underline transition"
                      params={{ momentId: entry.momentId }}
                      to="/moments/$momentId"
                    >
                      <p className="text-base font-semibold text-[#fff7e8]">{entry.title}</p>
                      <p className="mt-2 text-sm text-[#d8cfbf]">
                        {entry.matchup} • {entry.finalScore}
                      </p>
                      <p className="mt-2 text-sm text-[#aa9f8a]">{entry.dateLabel}</p>
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
    <div className="gs-stat-card gs-stat-card-collectible">
      <p className="text-xs uppercase tracking-[0.24em] text-[#b1a48f]">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-[#fff7e8]">{value}</p>
    </div>
  )
}
