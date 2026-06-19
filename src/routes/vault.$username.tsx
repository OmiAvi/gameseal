import { useEffect, useMemo, useState } from 'react'

import { Link, createFileRoute } from '@tanstack/react-router'
import { Globe2, Grid2x2, LockKeyhole, MapPinned, Users } from 'lucide-react'
import { z } from 'zod'

import { MomentCard3D } from '#/components/moment-card-3d'
import { InfoPanel, PageIntro, StateCard } from '#/components/route-state'
import { VaultVenueMap } from '#/components/vault-venue-map'
import { getVaultSnapshot } from '#/server/app.functions'

const vaultSearchSchema = z.object({
  view: z.enum(['cards', 'map']).optional(),
})

export const Route = createFileRoute('/vault/$username')({
  validateSearch: vaultSearchSchema,
  loader: ({ params }) => getVaultSnapshot({ data: params }),
  pendingComponent: () => (
    <StateCard
      title="Opening vault"
      message="Checking server-side visibility rules for this collector."
    />
  ),
  errorComponent: ({ error }) => (
    <StateCard
      title="Vault unavailable"
      message={error.message || 'We could not open this vault right now.'}
      tone="danger"
    />
  ),
  component: VaultRoute,
})

function VaultRoute() {
  const data = Route.useLoaderData()
  const search = Route.useSearch()
  const view = search.view ?? 'cards'
  const [selectedVenueId, setSelectedVenueId] = useState<string | null>(
    data.mappedVenues[0]?.id ?? null,
  )

  useEffect(() => {
    if (!selectedVenueId && data.mappedVenues[0]) {
      setSelectedVenueId(data.mappedVenues[0].id)
    }
  }, [data.mappedVenues, selectedVenueId])

  const selectedVenue = useMemo(
    () => data.venues.find((venue) => venue.id === selectedVenueId) ?? data.venues[0] ?? null,
    [data.venues, selectedVenueId],
  )

  return (
    <div className="gs-page">
      <PageIntro
        eyebrow="Collector profile"
        title={`${data.displayName}'s vault`}
        description={`@${data.username}${data.bio ? ` • ${data.bio}` : ''}`}
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

      <section className="gs-stat-grid">
        <StatCard
          label="Visible cards"
          value={data.stats.visibleCardCount === null ? 'Hidden' : String(data.stats.visibleCardCount)}
        />
        <StatCard
          label="Venues"
          value={data.stats.venueCount === null ? 'Hidden' : String(data.stats.venueCount)}
        />
        <StatCard
          label="Mapped venues"
          value={
            data.stats.mappedVenueCount === null ? 'Hidden' : String(data.stats.mappedVenueCount)
          }
        />
        <StatCard label="Friends" value={String(data.stats.friendCount)} />
      </section>

      <InfoPanel
        title="Vault controls"
        description="Switch between collectible slab view and venue map view with a URL-backed mode toggle."
        muted
      >
        <div className="grid grid-cols-2 gap-2">
          <Link
            className={`flex items-center justify-center gap-2 rounded-[1rem] border px-4 py-3 text-sm font-medium no-underline transition ${
              view === 'cards'
                ? 'border-[var(--gs-border-strong)] bg-[var(--gs-ink)] text-white'
                : 'border-[var(--gs-border)] bg-white/72 text-[var(--gs-ink-soft)] hover:text-[var(--gs-ink)]'
            }`}
            params={{ username: data.username }}
            search={{ view: 'cards' }}
            to="/vault/$username"
          >
            <Grid2x2 className="h-4 w-4" />
            Card view
          </Link>
          <Link
            className={`flex items-center justify-center gap-2 rounded-[1rem] border px-4 py-3 text-sm font-medium no-underline transition ${
              view === 'map'
                ? 'border-[rgba(207,177,118,0.28)] bg-[var(--gs-gold-soft)] text-[#6e5426]'
                : 'border-[var(--gs-border)] bg-white/72 text-[var(--gs-ink-soft)] hover:text-[var(--gs-ink)]'
            }`}
            params={{ username: data.username }}
            search={{ view: 'map' }}
            to="/vault/$username"
          >
            <MapPinned className="h-4 w-4" />
            Map view
          </Link>
        </div>
      </InfoPanel>

      {!data.canViewMoments ? (
        <StateCard
          title="Vault locked"
          message={
            data.visibility === 'private'
              ? 'This vault is private. Cards and mapped venues stay hidden unless the viewer is the owner or an approved friend.'
              : 'This vault has moments that are only visible to allowed viewers.'
          }
          tone="warning"
        />
      ) : null}

      {data.canViewMoments && data.cards.length === 0 ? (
        <StateCard
          title="Vault is empty"
          message="This collector does not have any visible published moment cards yet."
        />
      ) : null}

      {data.canViewMoments && data.cards.length > 0 && view === 'cards' ? (
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
                  className="text-sm font-semibold text-[#e4c995]"
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

      {data.canViewMoments && view === 'map' ? (
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
            message="This vault has visible cards, but none of their venues currently include map coordinates."
          />
        )
      ) : null}

      <InfoPanel
        title="Privacy rules"
        description="Profile visibility and per-moment visibility are enforced on the server before any cards or venue pins are returned to the client."
        muted
      >
        <div className="flex items-center gap-2 text-sm text-[var(--gs-ink-soft)]">
          <Users className="h-4 w-4 text-[var(--gs-ink-faint)]" />
          {data.isOwner
            ? 'You are viewing your own vault.'
            : data.isFriend
              ? 'You are viewing this vault as an approved friend.'
              : 'You are viewing only the moments this collector exposes publicly.'}
        </div>
      </InfoPanel>
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
