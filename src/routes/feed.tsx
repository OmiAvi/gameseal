import { Link, createFileRoute } from '@tanstack/react-router'
import { Flame, MessageSquareMore, Sparkles, Ticket } from 'lucide-react'
import { useState } from 'react'

import { MomentCard3D } from '#/components/moment-card-3d'
import { InfoPanel, PageIntro, StateCard } from '#/components/route-state'
import { getFeedSnapshot } from '#/server/app.functions'

export const Route = createFileRoute('/feed')({
  loader: () => getFeedSnapshot(),
  pendingComponent: () => (
    <StateCard
      title="Loading the feed"
      message="Pulling the latest public moments from The Vault."
    />
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
    <div className="mx-auto max-w-md space-y-5 lg:max-w-5xl">
      <PageIntro
        eyebrow="Live now"
        title="Friend feed"
        description="Visible moments from your collector circle, with reactions, comments, and shared game-day attendance."
        action={
          <div className="rounded-full border border-amber-300/25 bg-amber-400/10 p-3 text-amber-100">
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

      {moments.map((moment) => (
        <section
          key={moment.momentId}
          className="space-y-4 rounded-[2rem] border border-white/10 bg-slate-950/55 p-4 shadow-[0_18px_60px_rgba(2,6,12,0.32)]"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-base font-semibold text-white">{moment.creator.displayName}</p>
              <p className="mt-1 text-sm text-slate-400">@{moment.creator.username}</p>
              <p className="mt-2 text-xs uppercase tracking-[0.18em] text-slate-500">
                {moment.venueName} • {moment.dateLabel}
              </p>
            </div>
            <Link
              className="rounded-full border border-white/10 px-3 py-2 text-sm text-slate-200 no-underline transition hover:bg-white/5"
              params={{ username: moment.creator.username }}
              to="/vault/$username"
            >
              Vault
            </Link>
          </div>

          <MomentCard3D moment={moment.card} />

          <InfoPanel
            title={moment.title}
            description={`${moment.matchup} • ${moment.finalScore} • ${moment.seatInfo}`}
          >
            <div className="space-y-4">
              <p className="text-sm leading-6 text-slate-200">
                {moment.caption?.trim() || 'No story added for this moment yet.'}
              </p>

              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {moment.reactions.map((reaction) => (
                  <button
                    key={reaction.type}
                    type="button"
                    className={`rounded-[1.1rem] border px-3 py-3 text-sm transition ${
                      reaction.viewerHasReacted
                        ? 'border-amber-300/35 bg-amber-400/15 text-amber-50'
                        : 'border-white/10 bg-white/5 text-slate-200 hover:bg-white/10'
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

              <div className="rounded-[1.4rem] border border-white/10 bg-white/5 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-white">
                      Reactions and comments
                    </p>
                    <p className="mt-1 text-sm text-slate-400">
                      {moment.reactionTotal} reactions • {moment.commentCount} comments
                    </p>
                  </div>
                  <Flame className="h-5 w-5 text-amber-200" />
                </div>

                <div className="mt-4 space-y-3">
                  {moment.comments.length === 0 ? (
                    <p className="text-sm text-slate-400">No comments yet. Start the thread.</p>
                  ) : (
                    moment.comments.map((comment) => (
                      <div
                        key={comment.id}
                        className="rounded-[1.1rem] border border-white/10 bg-slate-950/45 p-3"
                      >
                        <p className="text-sm font-medium text-white">
                          {comment.authorDisplayName}
                        </p>
                        <p className="mt-2 text-sm leading-6 text-slate-300">{comment.body}</p>
                      </div>
                    ))
                  )}
                </div>

                <div className="mt-4 flex gap-2">
                  <input
                    className="flex-1 rounded-[1.1rem] border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500"
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
                    className="rounded-[1.1rem] bg-teal-400/15 px-4 py-3 text-sm font-medium text-teal-100 transition hover:bg-teal-400/25"
                    onClick={() => {
                      void addComment(moment.momentId)
                    }}
                  >
                    Post
                  </button>
                </div>
              </div>

              <div className="rounded-[1.4rem] border border-white/10 bg-white/5 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-white">Shared game attendees</p>
                    <p className="mt-1 text-sm text-slate-400">
                      {moment.attendeeSummary.totalCount} total checked in
                      {moment.attendeeSummary.friendCount > 0
                        ? ` • ${moment.attendeeSummary.friendCount} friends were there too`
                        : ''}
                    </p>
                    {moment.attendeeSummary.friendNames.length > 0 ? (
                      <p className="mt-2 text-sm text-slate-300">
                        Seen with {moment.attendeeSummary.friendNames.join(', ')}
                      </p>
                    ) : null}
                  </div>
                  <Ticket className="h-5 w-5 text-teal-200" />
                </div>

                <button
                  type="button"
                  className={`mt-4 w-full rounded-[1.1rem] px-4 py-3 text-sm font-medium transition ${
                    moment.attendeeSummary.viewerWasThere
                      ? 'bg-teal-400/15 text-teal-100'
                      : 'bg-amber-400 text-slate-950 hover:bg-amber-300'
                  }`}
                  onClick={() => {
                    void markWasThere(moment.momentId)
                  }}
                >
                  {moment.attendeeSummary.viewerWasThere ? 'You were there too' : 'I was there too'}
                </button>
              </div>

              <div className="flex items-center gap-3">
                <Link
                  className="text-sm font-medium text-teal-200 no-underline"
                  params={{ momentId: moment.momentId }}
                  to="/moments/$momentId"
                >
                  Open full moment
                </Link>
                <MessageSquareMore className="h-4 w-4 text-slate-500" />
              </div>
            </div>
          </InfoPanel>
        </section>
      ))}
    </div>
  )
}
