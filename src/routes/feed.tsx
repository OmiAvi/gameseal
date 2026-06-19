import { Link, createFileRoute } from '@tanstack/react-router'
import { Flame, MessageSquareMore, Sparkles, Ticket } from 'lucide-react'
import { useState } from 'react'

import { MomentCard3D } from '#/components/moment-card-3d'
import { InfoPanel, PageIntro, StateCard } from '#/components/route-state'
import { getFeedSnapshot } from '#/server/app.functions'

export const Route = createFileRoute('/feed')({
  loader: () => getFeedSnapshot(),
  pendingComponent: () => (
    <StateCard title="Loading the feed" message="Pulling the latest public moments from The Vault." />
  ),
  errorComponent: ({ error }) => (
    <StateCard
      title="Feed unavailable"
      message={error.message || 'We could not load the public feed right now.'}
      tone="danger"
    />
  ),
  component: FeedRoute,
})

function FeedRoute() {
  const data = Route.useLoaderData()
  const [moments, setMoments] = useState(data.moments)
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({})
  const [actionError, setActionError] = useState<string | null>(null)

  async function toggleReaction(
    momentId: string,
    reactionType: 'fire' | 'cheer' | 'wow' | 'ice',
  ) {
    setActionError(null)

    try {
      const response = await fetch(`/api/moments/${momentId}/reactions`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({ reactionType }),
      })
      const payload = (await response.json()) as {
        reactions?: Array<{
          type: 'fire' | 'cheer' | 'wow' | 'ice'
          count: number
          viewerHasReacted: boolean
        }>
        reactionTotal?: number
        error?: string
      }

      if (!response.ok || !payload.reactions) {
        throw new Error(payload.error || 'Unable to update reaction.')
      }

      setMoments((current) =>
        current.map((moment) =>
          moment.momentId === momentId
            ? {
                ...moment,
                reactions: payload.reactions!,
                reactionTotal: payload.reactionTotal ?? moment.reactionTotal,
              }
            : moment,
        ),
      )
    } catch (caught) {
      setActionError(caught instanceof Error ? caught.message : 'Unable to update reaction.')
    }
  }

  async function addComment(momentId: string) {
    setActionError(null)

    try {
      const response = await fetch(`/api/moments/${momentId}/comments`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          body: commentDrafts[momentId] || '',
        }),
      })
      const payload = (await response.json()) as {
        comment?: {
          id: string
          body: string
          createdAtLabel: string
          authorDisplayName: string
        }
        error?: string
      }

      if (!response.ok || !payload.comment) {
        throw new Error(payload.error || 'Unable to add comment.')
      }

      setMoments((current) =>
        current.map((moment) =>
          moment.momentId === momentId
            ? {
                ...moment,
                comments: [...moment.comments, payload.comment!].slice(-3),
                commentCount: moment.commentCount + 1,
              }
            : moment,
        ),
      )
      setCommentDrafts((current) => ({
        ...current,
        [momentId]: '',
      }))
    } catch (caught) {
      setActionError(caught instanceof Error ? caught.message : 'Unable to add comment.')
    }
  }

  async function markWasThere(momentId: string) {
    setActionError(null)

    try {
      const response = await fetch(`/api/moments/${momentId}/attendees`, {
        method: 'POST',
      })
      const payload = (await response.json()) as {
        attendeeSummary?: {
          gameId: string | null
          totalCount: number
          friendCount: number
          viewerWasThere: boolean
          friendNames: string[]
        }
        error?: string
      }

      if (!response.ok || !payload.attendeeSummary) {
        throw new Error(payload.error || 'Unable to mark attendance.')
      }

      setMoments((current) =>
        current.map((moment) =>
          moment.momentId === momentId
            ? {
                ...moment,
                attendeeSummary: payload.attendeeSummary!,
              }
            : moment,
        ),
      )
    } catch (caught) {
      setActionError(caught instanceof Error ? caught.message : 'Unable to mark attendance.')
    }
  }

  return (
    <div className="gs-page">
      <PageIntro
        eyebrow="Live now"
        title="Friend feed"
        description="A cleaner social workspace up front, with each card still treated like a collectible object once it lands in the stream."
        action={
          <div className="rounded-[1.2rem] border border-[var(--gs-border)] bg-white/72 p-3 text-[var(--gs-action)]">
            <Sparkles className="h-5 w-5" />
          </div>
        }
      />

      {actionError ? (
        <StateCard title="Action unavailable" message={actionError} tone="danger" />
      ) : null}

      {moments.length === 0 ? (
        <StateCard
          title="No friend moments yet"
          message="Add collectors in Friends, then their visible moments will start landing here."
          tone="warning"
        />
      ) : null}

      <div className="space-y-5">
        {moments.map((moment) => (
          <section key={moment.momentId} className="grid gap-5 xl:grid-cols-[24rem_minmax(0,1fr)]">
            <div className="gs-collectible-frame">
              <MomentCard3D moment={moment.card} />
            </div>

            <div className="space-y-4">
              <InfoPanel
                title={moment.title}
                description={`${moment.matchup} • ${moment.finalScore} • ${moment.seatInfo}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-base font-semibold text-[var(--gs-ink)]">
                      {moment.creator.displayName}
                    </p>
                    <p className="mt-1 text-sm text-[var(--gs-ink-soft)]">
                      @{moment.creator.username}
                    </p>
                    <p className="mt-2 text-[11px] uppercase tracking-[0.22em] text-[var(--gs-ink-faint)]">
                      {moment.venueName} • {moment.dateLabel}
                    </p>
                  </div>
                  <Link
                    className="gs-button-secondary px-3 py-2"
                    params={{ username: moment.creator.username }}
                    to="/vault/$username"
                  >
                    Vault
                  </Link>
                </div>

                <p className="mt-5 text-sm leading-6 text-[var(--gs-ink-soft)]">
                  {moment.caption?.trim() || 'No story added for this moment yet.'}
                </p>

                <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {moment.reactions.map((reaction) => (
                    <button
                      key={reaction.type}
                      type="button"
                      className={`rounded-[1rem] border px-3 py-3 text-left text-sm transition ${
                        reaction.viewerHasReacted
                          ? 'border-[rgba(207,177,118,0.28)] bg-[var(--gs-gold-soft)] text-[var(--gs-action-ink)]'
                          : 'border-[var(--gs-border)] bg-white/70 text-[var(--gs-ink)]'
                      }`}
                      onClick={() => {
                        void toggleReaction(moment.momentId, reaction.type)
                      }}
                    >
                      <span className="block font-medium capitalize">{reaction.type}</span>
                      <span className="mt-1 block text-xs opacity-80">{reaction.count}</span>
                    </button>
                  ))}
                </div>
              </InfoPanel>

              <div className="grid gap-4 lg:grid-cols-2">
                <InfoPanel
                  title="Reactions and comments"
                  description={`${moment.reactionTotal} reactions • ${moment.commentCount} comments`}
                  muted
                >
                  <div className="flex items-center gap-2 text-sm text-[var(--gs-ink-soft)]">
                    <Flame className="h-4 w-4 text-[var(--gs-action)]" />
                    Conversation stays attached to the collectible.
                  </div>

                  <div className="mt-4 space-y-3">
                    {moment.comments.length === 0 ? (
                      <p className="text-sm text-[var(--gs-ink-soft)]">
                        No comments yet. Start the thread.
                      </p>
                    ) : (
                      moment.comments.map((comment) => (
                        <div key={comment.id} className="gs-list-row">
                          <p className="text-sm font-medium text-[var(--gs-ink)]">
                            {comment.authorDisplayName}
                          </p>
                          <p className="mt-2 text-sm leading-6 text-[var(--gs-ink-soft)]">
                            {comment.body}
                          </p>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="mt-4 flex gap-2">
                    <input
                      className="gs-field flex-1"
                      placeholder="Add a comment"
                      value={commentDrafts[moment.momentId] || ''}
                      onChange={(event) =>
                        setCommentDrafts((current) => ({
                          ...current,
                          [moment.momentId]: event.target.value,
                        }))
                      }
                    />
                    <button
                      type="button"
                      className="gs-button-primary px-4 py-3"
                      onClick={() => {
                        void addComment(moment.momentId)
                      }}
                    >
                      Post
                    </button>
                  </div>
                </InfoPanel>

                <InfoPanel
                  title="Shared game attendees"
                  description={`${moment.attendeeSummary.totalCount} total checked in${moment.attendeeSummary.friendCount > 0 ? ` • ${moment.attendeeSummary.friendCount} friends were there too` : ''}`}
                  muted
                >
                  <div className="flex items-center gap-2 text-sm text-[var(--gs-ink-soft)]">
                    <Ticket className="h-4 w-4 text-[var(--gs-action)]" />
                    Attendance adds shared context without changing the saved card.
                  </div>

                  {moment.attendeeSummary.friendNames.length > 0 ? (
                    <p className="mt-4 text-sm text-[var(--gs-ink-soft)]">
                      Seen with {moment.attendeeSummary.friendNames.join(', ')}
                    </p>
                  ) : null}

                  <button
                    type="button"
                    className={`mt-4 w-full rounded-[1rem] px-4 py-3 text-sm font-semibold transition ${
                      moment.attendeeSummary.viewerWasThere
                        ? 'bg-[var(--gs-ink)] text-white'
                        : 'gs-button-gold'
                    }`}
                    onClick={() => {
                      void markWasThere(moment.momentId)
                    }}
                  >
                    {moment.attendeeSummary.viewerWasThere ? 'You were there too' : 'I was there too'}
                  </button>

                  <div className="mt-4 flex items-center gap-3">
                    <Link
                      className="text-sm font-semibold text-[var(--gs-action)]"
                      params={{ momentId: moment.momentId }}
                      to="/moments/$momentId"
                    >
                      Open full moment
                    </Link>
                    <MessageSquareMore className="h-4 w-4 text-[var(--gs-ink-faint)]" />
                  </div>
                </InfoPanel>
              </div>
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
