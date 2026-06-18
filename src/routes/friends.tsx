import { Link, createFileRoute } from '@tanstack/react-router'
import { Search, Users } from 'lucide-react'
import { useEffect, useState } from 'react'

import { InfoPanel, PageIntro, StateCard } from '#/components/route-state'
import { getFriendsSnapshot } from '#/server/app.functions'

export const Route = createFileRoute('/friends')({
  loader: () => getFriendsSnapshot(),
  pendingComponent: () => (
    <StateCard
      title="Loading friends"
      message="Collecting friend activity and invite state."
    />
  ),
  errorComponent: ({ error }) => (
    <StateCard
      title="Friends unavailable"
      message={error.message || 'We could not load your network right now.'}
      tone="danger"
    />
  ),
  component: FriendsRoute,
})

function FriendsRoute() {
  const data = Route.useLoaderData()
  const [incomingRequests, setIncomingRequests] = useState(data.incomingRequests)
  const [outgoingRequests, setOutgoingRequests] = useState(data.outgoingRequests)
  const [friends, setFriends] = useState(data.friends)
  const [query, setQuery] = useState('')
  const [searchState, setSearchState] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle')
  const [searchError, setSearchError] = useState<string | null>(null)
  const [searchResults, setSearchResults] = useState<
    Array<{
      id: string
      username: string
      displayName: string
      isPrivate: boolean
      relation: 'friends' | 'incoming_pending' | 'outgoing_pending' | 'none'
    }>
  >([])

  useEffect(() => {
    if (query.trim().length < 2) {
      setSearchResults([])
      setSearchState('idle')
      setSearchError(null)
      return
    }

    let isCancelled = false
    const timeoutId = window.setTimeout(async () => {
      setSearchState('loading')
      setSearchError(null)

      try {
        const response = await fetch(`/api/friends/search?q=${encodeURIComponent(query)}`)
        const payload = (await response.json()) as {
          results?: Array<{
            id: string
            username: string
            displayName: string
            isPrivate: boolean
            relation: 'friends' | 'incoming_pending' | 'outgoing_pending' | 'none'
          }>
          error?: string
        }

        if (!response.ok) {
          throw new Error(payload.error || 'Unable to search collectors.')
        }

        if (!isCancelled) {
          setSearchResults(payload.results || [])
          setSearchState('ready')
        }
      } catch (caught) {
        if (!isCancelled) {
          setSearchError(
            caught instanceof Error ? caught.message : 'Unable to search collectors.',
          )
          setSearchState('error')
        }
      }
    }, 250)

    return () => {
      isCancelled = true
      window.clearTimeout(timeoutId)
    }
  }, [query])

  async function sendFriendRequest(targetProfileId: string) {
    setSearchError(null)

    try {
      const response = await fetch('/api/friend-requests', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          targetProfileId,
        }),
      })
      const payload = (await response.json()) as { error?: string }

      if (!response.ok) {
        throw new Error(payload.error || 'Unable to send request.')
      }

      const target = searchResults.find((result) => result.id === targetProfileId)
      setSearchResults((current) =>
        current.map((result) =>
          result.id === targetProfileId ? { ...result, relation: 'outgoing_pending' } : result,
        ),
      )
      if (target) {
        setOutgoingRequests((current) => [
          {
            id: crypto.randomUUID(),
            createdAtLabel: 'Today',
            message: null,
            profile: {
              id: target.id,
              username: target.username,
              displayName: target.displayName,
            },
          },
          ...current.filter((request) => request.profile.id !== target.id),
        ])
      }
    } catch (caught) {
      setSearchError(caught instanceof Error ? caught.message : 'Unable to send request.')
    }
  }

  async function respondToRequest(requestId: string, action: 'accept' | 'decline') {
    try {
      const response = await fetch(`/api/friend-requests/${requestId}`, {
        method: 'PATCH',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({ action }),
      })
      const payload = (await response.json()) as { error?: string }

      if (!response.ok) {
        throw new Error(payload.error || 'Unable to update request.')
      }

      const request = incomingRequests.find((item) => item.id === requestId)
      setIncomingRequests((current) => current.filter((item) => item.id !== requestId))
      if (request) {
        setSearchResults((current) =>
          current.map((result) =>
            result.id === request.profile.id
              ? { ...result, relation: action === 'accept' ? 'friends' : 'none' }
              : result,
          ),
        )
      }

      if (action === 'accept' && request) {
        setFriends((current) => [
          {
            createdAtLabel: 'Today',
            profile: request.profile,
            visibleMomentCount: 0,
          },
          ...current,
        ])
      }
    } catch (caught) {
      setSearchError(caught instanceof Error ? caught.message : 'Unable to update request.')
    }
  }

  async function removeFriend(friendProfileId: string) {
    try {
      const response = await fetch(`/api/friendships/${friendProfileId}`, {
        method: 'DELETE',
      })
      const payload = (await response.json()) as { error?: string }

      if (!response.ok) {
        throw new Error(payload.error || 'Unable to remove friend.')
      }

      setFriends((current) => current.filter((item) => item.profile.id !== friendProfileId))
      setSearchResults((current) =>
        current.map((result) =>
          result.id === friendProfileId ? { ...result, relation: 'none' } : result,
        ),
      )
    } catch (caught) {
      setSearchError(caught instanceof Error ? caught.message : 'Unable to remove friend.')
    }
  }

  return (
    <div className="space-y-5">
      <PageIntro
        eyebrow="Social graph"
        title="Friends"
        description="Search collectors, manage incoming requests, and keep your game-day circle close."
        action={
          <div className="rounded-full border border-teal-300/20 bg-teal-400/10 p-3 text-teal-100">
            <Users className="h-5 w-5" />
          </div>
        }
      />

      <InfoPanel
        title="Find collectors"
        description="Search by username or display name, then send requests without leaving the page."
      >
        <label className="block space-y-2 text-sm text-slate-200">
          <span>Search people</span>
          <div className="flex items-center gap-3 rounded-[1.4rem] border border-white/10 bg-slate-950/60 px-4 py-3">
            <Search className="h-4 w-4 text-slate-400" />
            <input
              className="w-full bg-transparent text-white outline-none placeholder:text-slate-500"
              placeholder="Search usernames or display names"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
        </label>

        {searchError ? (
          <div className="mt-4">
            <StateCard title="Search unavailable" message={searchError} tone="danger" />
          </div>
        ) : null}

        {searchState === 'loading' ? (
          <div className="mt-4">
            <StateCard title="Searching" message="Looking through collector profiles." />
          </div>
        ) : null}

        {searchState === 'ready' && searchResults.length === 0 ? (
          <div className="mt-4">
            <StateCard
              title="No matches yet"
              message="Try a different username or display name."
              tone="warning"
            />
          </div>
        ) : null}

        {searchResults.length > 0 ? (
          <div className="mt-4 space-y-3">
            {searchResults.map((result) => (
              <div
                key={result.id}
                className="flex items-center justify-between gap-3 rounded-[1.4rem] border border-white/10 bg-white/5 p-4"
              >
                <div>
                  <p className="text-base font-semibold text-white">{result.displayName}</p>
                  <p className="mt-1 text-sm text-slate-400">@{result.username}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    className="text-sm font-medium text-teal-200 no-underline"
                    params={{ username: result.username }}
                    to="/vault/$username"
                  >
                    Vault
                  </Link>
                  {result.relation === 'none' ? (
                    <button
                      type="button"
                      className="rounded-full bg-amber-400 px-3 py-2 text-sm font-medium text-slate-950 transition hover:bg-amber-300"
                      onClick={() => {
                        void sendFriendRequest(result.id)
                      }}
                    >
                      Add
                    </button>
                  ) : (
                    <span className="rounded-full border border-white/10 px-3 py-2 text-xs uppercase tracking-[0.18em] text-slate-300">
                      {result.relation === 'friends'
                        ? 'Friends'
                        : result.relation === 'incoming_pending'
                          ? 'Needs reply'
                          : 'Pending'}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </InfoPanel>

      <InfoPanel
        title="Incoming requests"
        description="Accept or decline collectors who want into your circle."
      >
        {incomingRequests.length === 0 ? (
          <StateCard
            title="No pending requests"
            message="New incoming requests will land here."
          />
        ) : (
          <div className="space-y-3">
            {incomingRequests.map((request) => (
              <div
                key={request.id}
                className="rounded-[1.4rem] border border-white/10 bg-white/5 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-base font-semibold text-white">
                      {request.profile.displayName}
                    </p>
                    <p className="mt-1 text-sm text-slate-400">@{request.profile.username}</p>
                    <p className="mt-2 text-xs uppercase tracking-[0.18em] text-slate-500">
                      Sent {request.createdAtLabel}
                    </p>
                    {request.message ? (
                      <p className="mt-3 text-sm leading-6 text-slate-300">{request.message}</p>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="rounded-full bg-teal-400/15 px-3 py-2 text-sm font-medium text-teal-100 transition hover:bg-teal-400/25"
                      onClick={() => {
                        void respondToRequest(request.id, 'accept')
                      }}
                    >
                      Accept
                    </button>
                    <button
                      type="button"
                      className="rounded-full bg-rose-500/15 px-3 py-2 text-sm font-medium text-rose-100 transition hover:bg-rose-500/25"
                      onClick={() => {
                        void respondToRequest(request.id, 'decline')
                      }}
                    >
                      Decline
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </InfoPanel>

      <InfoPanel
        title="Outgoing requests"
        description="Collectors you invited and are waiting to hear back from."
      >
        {outgoingRequests.length === 0 ? (
          <StateCard
            title="No outgoing requests"
            message="Search above to send your first request."
          />
        ) : (
          <div className="space-y-3">
            {outgoingRequests.map((request) => (
              <div
                key={request.id}
                className="flex items-center justify-between gap-3 rounded-[1.4rem] border border-white/10 bg-white/5 p-4"
              >
                <div>
                  <p className="text-base font-semibold text-white">
                    {request.profile.displayName}
                  </p>
                  <p className="mt-1 text-sm text-slate-400">@{request.profile.username}</p>
                </div>
                <span className="rounded-full border border-white/10 px-3 py-2 text-xs uppercase tracking-[0.18em] text-slate-300">
                  Pending
                </span>
              </div>
            ))}
          </div>
        )}
      </InfoPanel>

      <InfoPanel
        title="Friends list"
        description="Your accepted collector network, ready for private moments and shared game-day context."
      >
        {friends.length === 0 ? (
          <StateCard
            title="No friends added yet"
            message="Search above to build your first crew."
            tone="warning"
          />
        ) : (
          <div className="space-y-3">
            {friends.map((friend) => (
              <div
                key={friend.profile.id}
                className="flex items-center justify-between gap-3 rounded-[1.4rem] border border-white/10 bg-white/5 p-4"
              >
                <div>
                  <p className="text-base font-semibold text-white">
                    {friend.profile.displayName}
                  </p>
                  <p className="mt-1 text-sm text-slate-400">@{friend.profile.username}</p>
                  <p className="mt-2 text-sm text-slate-300">
                    {friend.visibleMomentCount} visible moments
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    className="rounded-full border border-white/10 px-3 py-2 text-sm font-medium text-slate-100 no-underline transition hover:bg-white/5"
                    params={{ username: friend.profile.username }}
                    to="/vault/$username"
                  >
                    View vault
                  </Link>
                  <button
                    type="button"
                    className="rounded-full bg-rose-500/15 px-3 py-2 text-sm font-medium text-rose-100 transition hover:bg-rose-500/25"
                    onClick={() => {
                      void removeFriend(friend.profile.id)
                    }}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </InfoPanel>
    </div>
  )
}
