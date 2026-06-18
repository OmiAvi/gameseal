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
    <div className="space-y-5">
      <PageIntro
        eyebrow="Saved collectible"
        title={data.title}
        description={`Captured by ${data.creatorDisplayName}. The slab keeps the image sealed while the back preserves the story, venue context, and game details.`}
      />

      <section className="grid gap-5 lg:grid-cols-[minmax(0,28rem)_minmax(0,1fr)]">
        <div className="lg:sticky lg:top-24 lg:self-start">
          <MomentCard3D moment={data.card} size="detail" />
        </div>

        <div className="space-y-5">
          <InfoPanel
            title="Moment details"
            description="Everything entered during mint is preserved here and shown with the same live slab system used in preview."
          >
            <div className="grid gap-3 sm:grid-cols-2 text-sm text-slate-200">
              <div className="rounded-[1.2rem] border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Venue</p>
                <p className="mt-2 font-semibold text-white">{data.venueName}</p>
              </div>
              <div className="rounded-[1.2rem] border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Date</p>
                <p className="mt-2 font-semibold text-white">{data.dateLabel}</p>
              </div>
              <div className="rounded-[1.2rem] border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Matchup</p>
                <p className="mt-2 font-semibold text-white">{data.matchup}</p>
              </div>
              <div className="rounded-[1.2rem] border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Final score</p>
                <p className="mt-2 font-semibold text-white">{data.finalScore}</p>
              </div>
              <div className="rounded-[1.2rem] border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Seat</p>
                <p className="mt-2 font-semibold text-white">{data.seatInfo}</p>
              </div>
              <div className="rounded-[1.2rem] border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Privacy</p>
                <p className="mt-2 font-semibold capitalize text-white">{data.visibility}</p>
              </div>
              <div className="rounded-[1.2rem] border border-white/10 bg-white/5 p-4 sm:col-span-2">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Card template</p>
                <p className="mt-2 font-semibold text-white">{data.templateName}</p>
              </div>
            </div>
          </InfoPanel>

          <InfoPanel
            title="Story"
            description="The back of the slab is powered by the same saved story text, so editing this later can update the collectible without turning it into a static image."
          >
            <p className="text-sm leading-6 text-slate-200">
              {data.caption?.trim() || 'No story was added for this moment yet.'}
            </p>
          </InfoPanel>

          <InfoPanel
            title="Collections"
            description="Create collections, set their visibility, and add or remove this moment from your own curated sets."
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
                  <div
                    key={collection.id}
                    className="flex items-center justify-between gap-3 rounded-[1.2rem] border border-white/10 bg-white/5 p-4"
                  >
                    <div>
                      <p className="text-base font-semibold text-white">{collection.title}</p>
                      <p className="mt-1 text-sm text-slate-400 capitalize">
                        {collection.visibility}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Link
                        className="text-sm font-medium text-teal-200 no-underline"
                        params={{ collectionId: collection.id }}
                        to="/collections/$collectionId"
                      >
                        Open
                      </Link>
                      <button
                        type="button"
                        className={`rounded-full px-3 py-2 text-sm font-medium transition ${
                          collection.containsMoment
                            ? 'bg-rose-500/15 text-rose-100 hover:bg-rose-500/25'
                            : 'bg-amber-400 text-slate-950 hover:bg-amber-300'
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

            <div className="mt-5 space-y-3 rounded-[1.4rem] border border-white/10 bg-slate-950/45 p-4">
              <p className="text-sm font-semibold text-white">Create collection</p>
              <label className="block space-y-2 text-sm text-slate-200">
                <span>Title</span>
                <input
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white"
                  value={newCollectionTitle}
                  onChange={(event) => setNewCollectionTitle(event.target.value)}
                />
              </label>
              <label className="block space-y-2 text-sm text-slate-200">
                <span>Description</span>
                <textarea
                  className="min-h-24 w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white"
                  value={newCollectionDescription}
                  onChange={(event) => setNewCollectionDescription(event.target.value)}
                />
              </label>
              <label className="block space-y-2 text-sm text-slate-200">
                <span>Visibility</span>
                <select
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white"
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
                className="w-full rounded-2xl bg-amber-400 px-4 py-3 font-semibold text-slate-950 transition hover:bg-amber-300 disabled:opacity-60"
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
