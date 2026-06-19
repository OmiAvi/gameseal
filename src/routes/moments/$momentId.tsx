import { useEffect, useState } from 'react'

import { Link, createFileRoute } from '@tanstack/react-router'

import { MomentCard3D } from '#/components/moment-card-3d'
import { InfoPanel, PageIntro, StateCard } from '#/components/route-state'
import { getMomentSnapshot } from '#/server/app.functions'

export const Route = createFileRoute('/moments/$momentId')({
  loader: ({ params }) => getMomentSnapshot({ data: params }),
  pendingComponent: () => (
    <StateCard
      title="Loading saved moment"
      message="Pulling the collectible slab, metadata, and sealed media from storage."
    />
  ),
  errorComponent: ({ error }) => (
    <StateCard
      title="Moment unavailable"
      message={error.message || 'We could not load this moment right now.'}
      tone="danger"
    />
  ),
  component: MomentDetailRoute,
})

function MomentDetailRoute() {
  const data = Route.useLoaderData()
  const [collections, setCollections] = useState<
    Array<{
      id: string
      title: string
      slug: string
      visibility: 'public' | 'friends' | 'private'
      coverMomentId: string | null
      containsMoment: boolean
    }>
  >([])
  const [collectionState, setCollectionState] = useState<
    'idle' | 'loading' | 'ready' | 'error'
  >('loading')
  const [collectionError, setCollectionError] = useState<string | null>(null)
  const [isCreatingCollection, setIsCreatingCollection] = useState(false)
  const [newCollectionTitle, setNewCollectionTitle] = useState('')
  const [newCollectionDescription, setNewCollectionDescription] = useState('')
  const [newCollectionVisibility, setNewCollectionVisibility] = useState<
    'public' | 'friends' | 'private'
  >('public')

  useEffect(() => {
    let isCancelled = false

    async function loadCollections() {
      setCollectionState('loading')
      setCollectionError(null)

      try {
        const response = await fetch(`/api/moments/${data.momentId}/collections`)
        const payload = (await response.json()) as {
          collections?: Array<{
            id: string
            title: string
            slug: string
            visibility: 'public' | 'friends' | 'private'
            coverMomentId: string | null
            containsMoment: boolean
          }>
          error?: string
        }

        if (!response.ok) {
          throw new Error(payload.error || 'Unable to load collections.')
        }

        if (!isCancelled) {
          setCollections(payload.collections || [])
          setCollectionState('ready')
        }
      } catch (caught) {
        if (!isCancelled) {
          setCollectionError(
            caught instanceof Error ? caught.message : 'Unable to load collections.',
          )
          setCollectionState('error')
        }
      }
    }

    void loadCollections()

    return () => {
      isCancelled = true
    }
  }, [data.momentId])

  async function toggleCollectionMembership(collectionId: string, containsMoment: boolean) {
    setCollectionError(null)

    try {
      const response = await fetch(`/api/collections/${collectionId}/moments`, {
        method: containsMoment ? 'DELETE' : 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          momentId: data.momentId,
        }),
      })

      const payload = (await response.json()) as { error?: string }
      if (!response.ok) {
        throw new Error(payload.error || 'Unable to update collection membership.')
      }

      setCollections((current) =>
        current.map((collection) =>
          collection.id === collectionId
            ? {
                ...collection,
                containsMoment: !containsMoment,
              }
            : collection,
        ),
      )
    } catch (caught) {
      setCollectionError(
        caught instanceof Error ? caught.message : 'Unable to update collection membership.',
      )
    }
  }

  async function createCollection() {
    setCollectionError(null)
    setIsCreatingCollection(true)

    try {
      const response = await fetch('/api/collections', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          title: newCollectionTitle,
          description: newCollectionDescription,
          visibility: newCollectionVisibility,
          coverMomentId: data.momentId,
        }),
      })

      const payload = (await response.json()) as { collectionId?: string; error?: string }
      if (!response.ok || !payload.collectionId) {
        throw new Error(payload.error || 'Unable to create collection.')
      }

      const addResponse = await fetch(`/api/collections/${payload.collectionId}/moments`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          momentId: data.momentId,
        }),
      })
      const addPayload = (await addResponse.json()) as { error?: string }
      if (!addResponse.ok) {
        throw new Error(addPayload.error || 'Collection was created, but the moment could not be added.')
      }

      setCollections((current) => [
        {
          id: payload.collectionId!,
          title: newCollectionTitle,
          slug: '',
          visibility: newCollectionVisibility,
          coverMomentId: data.momentId,
          containsMoment: true,
        },
        ...current,
      ])
      setNewCollectionTitle('')
      setNewCollectionDescription('')
      setNewCollectionVisibility('public')
      setCollectionState('ready')
    } catch (caught) {
      setCollectionError(caught instanceof Error ? caught.message : 'Unable to create collection.')
    } finally {
      setIsCreatingCollection(false)
    }
  }

  return (
    <div className="gs-page">
      <PageIntro
        eyebrow="Saved collectible"
        title={data.title}
        description={`Captured by ${data.creatorDisplayName}. The slab keeps the image sealed while the back preserves the story, venue context, and game details.`}
        appearance="collectible"
      />

      <section className="grid gap-5 lg:grid-cols-[minmax(0,28rem)_minmax(0,1fr)]">
        <div className="lg:sticky lg:top-24 lg:self-start">
          <div className="gs-collectible-frame">
            <MomentCard3D moment={data.card} size="detail" />
          </div>
        </div>

        <div className="space-y-5">
          <InfoPanel
            title="Moment details"
            description="Everything entered during mint is preserved here and shown with the same live slab system used in preview."
            appearance="collectible"
          >
            <div className="grid gap-3 text-sm sm:grid-cols-2 text-[#e9decb]">
              <div className="gs-list-row-dark p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-[#b1a48f]">Venue</p>
                <p className="mt-2 font-semibold text-[#fff7e8]">{data.venueName}</p>
              </div>
              <div className="gs-list-row-dark p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-[#b1a48f]">Date</p>
                <p className="mt-2 font-semibold text-[#fff7e8]">{data.dateLabel}</p>
              </div>
              <div className="gs-list-row-dark p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-[#b1a48f]">Matchup</p>
                <p className="mt-2 font-semibold text-[#fff7e8]">{data.matchup}</p>
              </div>
              <div className="gs-list-row-dark p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-[#b1a48f]">Final score</p>
                <p className="mt-2 font-semibold text-[#fff7e8]">{data.finalScore}</p>
              </div>
              <div className="gs-list-row-dark p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-[#b1a48f]">Seat</p>
                <p className="mt-2 font-semibold text-[#fff7e8]">{data.seatInfo}</p>
              </div>
              <div className="gs-list-row-dark p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-[#b1a48f]">Privacy</p>
                <p className="mt-2 font-semibold capitalize text-[#fff7e8]">{data.visibility}</p>
              </div>
              <div className="gs-list-row-dark p-4 sm:col-span-2">
                <p className="text-xs uppercase tracking-[0.24em] text-[#b1a48f]">Card template</p>
                <p className="mt-2 font-semibold text-[#fff7e8]">{data.templateName}</p>
              </div>
            </div>
          </InfoPanel>

          <InfoPanel
            title="Story"
            description="The back of the slab is powered by the same saved story text, so editing this later can update the collectible without turning it into a static image."
            appearance="collectible"
          >
            <p className="text-sm leading-6 text-[#e9decb]">
              {data.caption?.trim() || 'No story was added for this moment yet.'}
            </p>
          </InfoPanel>

          <InfoPanel
            title="Collections"
            description="Create collections, set their visibility, and add or remove this moment from your own curated sets."
            muted
          >
            {collectionState === 'loading' ? (
              <StateCard
                title="Loading collections"
                message="Checking which of your collections already include this moment."
              />
            ) : null}

            {collectionError ? (
              <StateCard title="Collections unavailable" message={collectionError} tone="danger" />
            ) : null}

            {collectionState === 'ready' && collections.length === 0 ? (
              <StateCard
                title="No collections yet"
                message="Create your first collection here and use this moment as the cover card."
              />
            ) : null}

            {collections.length > 0 ? (
              <div className="space-y-3">
                {collections.map((collection) => (
                  <div key={collection.id} className="gs-list-row flex items-center justify-between gap-3">
                    <div>
                      <p className="text-base font-semibold text-[var(--gs-ink)]">{collection.title}</p>
                      <p className="mt-1 text-sm text-[var(--gs-ink-soft)] capitalize">
                        {collection.visibility}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Link
                        className="text-sm font-semibold text-[var(--gs-action)] no-underline"
                        params={{ collectionId: collection.id }}
                        to="/collections/$collectionId"
                      >
                        Open
                      </Link>
                      <button
                        type="button"
                        className={`rounded-full px-3 py-2 text-sm font-medium transition ${
                          collection.containsMoment
                            ? 'border border-[#dcb7b2] bg-[#fdf0ef] text-[#933f35] hover:bg-[#fae5e3]'
                            : 'bg-[var(--gs-action)] text-white hover:bg-[#215fe0]'
                        }`}
                        onClick={() => {
                          void toggleCollectionMembership(
                            collection.id,
                            collection.containsMoment,
                          )
                        }}
                      >
                        {collection.containsMoment ? 'Remove' : 'Add'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}

            <div className="mt-5 space-y-3 rounded-[1.4rem] border border-[var(--gs-border)] bg-white/72 p-4">
              <p className="text-sm font-semibold text-[var(--gs-ink)]">Create collection</p>
              <label className="gs-form-label">
                <span>Title</span>
                <input
                  className="gs-field"
                  value={newCollectionTitle}
                  onChange={(event) => setNewCollectionTitle(event.target.value)}
                />
              </label>
              <label className="gs-form-label">
                <span>Description</span>
                <textarea
                  className="gs-textarea min-h-24"
                  value={newCollectionDescription}
                  onChange={(event) => setNewCollectionDescription(event.target.value)}
                />
              </label>
              <label className="gs-form-label">
                <span>Visibility</span>
                <select
                  className="gs-select"
                  value={newCollectionVisibility}
                  onChange={(event) =>
                    setNewCollectionVisibility(
                      event.target.value as 'public' | 'friends' | 'private',
                    )
                  }
                >
                  <option value="public">Public</option>
                  <option value="friends">Friends only</option>
                  <option value="private">Private</option>
                </select>
              </label>
              <button
                type="button"
                className="gs-button-primary w-full disabled:opacity-60"
                disabled={isCreatingCollection}
                onClick={() => {
                  void createCollection()
                }}
              >
                {isCreatingCollection ? 'Creating...' : 'Create collection with this cover card'}
              </button>
            </div>
          </InfoPanel>
        </div>
      </section>
    </div>
  )
}
