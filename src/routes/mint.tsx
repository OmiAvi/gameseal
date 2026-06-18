import { useDeferredValue, useEffect, useState } from 'react'

import { Link, createFileRoute, useRouter } from '@tanstack/react-router'

import { MomentCard3D } from '#/components/moment-card-3d'
import { InfoPanel, PageIntro, StateCard } from '#/components/route-state'
import {
  buildMomentCardData,
  buildSeatInfo,
  cardVariantFromTemplate,
  formatMomentDateLabel,
  hypeLabelFromRating,
  memoryRatingLabel,
} from '#/lib/moment-card-data'
import { draftMomentCard } from '#/lib/moment-card-demo'
import { getMintSnapshot } from '#/server/app.functions'

const memoryRatingOptions = [6, 7, 8, 9, 10]

export const Route = createFileRoute('/mint')({
  loader: () => getMintSnapshot(),
  pendingComponent: () => (
    <StateCard
      title="Preparing the mint flow"
      message="Checking storage bindings and laying out the capture workspace."
    />
  ),
  errorComponent: ({ error }) => (
    <StateCard
      title="Mint setup failed"
      message={error.message || 'We could not prepare the mint workspace.'}
      tone="danger"
    />
  ),
  component: MintRoute,
})

function MintRoute() {
  const data = Route.useLoaderData()
  const router = useRouter()
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [caption, setCaption] = useState('')
  const [venue, setVenue] = useState(data.venues[0]?.name || '')
  const [date, setDate] = useState('')
  const [matchup, setMatchup] = useState('')
  const [finalScore, setFinalScore] = useState('')
  const [section, setSection] = useState('')
  const [row, setRow] = useState('')
  const [seat, setSeat] = useState('')
  const [memoryRating, setMemoryRating] = useState('8')
  const [cardTemplateId, setCardTemplateId] = useState(data.templates[0]?.id || '')
  const [privacy, setPrivacy] = useState<'public' | 'friends' | 'private'>('public')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!selectedFile) {
      setPreviewUrl(null)
      return
    }

    const objectUrl = URL.createObjectURL(selectedFile)
    setPreviewUrl(objectUrl)

    return () => {
      URL.revokeObjectURL(objectUrl)
    }
  }, [selectedFile])

  const deferredTitle = useDeferredValue(title)
  const deferredCaption = useDeferredValue(caption)
  const deferredVenue = useDeferredValue(venue)
  const deferredDate = useDeferredValue(date)
  const deferredMatchup = useDeferredValue(matchup)
  const deferredFinalScore = useDeferredValue(finalScore)
  const deferredSection = useDeferredValue(section)
  const deferredRow = useDeferredValue(row)
  const deferredSeat = useDeferredValue(seat)
  const deferredMemoryRating = useDeferredValue(memoryRating)
  const deferredTemplateId = useDeferredValue(cardTemplateId)
  const deferredPrivacy = useDeferredValue(privacy)

  const selectedTemplate =
    data.templates.find((template) => template.id === deferredTemplateId) || data.templates[0]
  const selectedVenue =
    data.venues.find((entry) => entry.name === deferredVenue) || null
  const ratingNumber = Number(deferredMemoryRating) || 8

  const previewCard = buildMomentCardData({
    media: null,
    mediaUrl: previewUrl || draftMomentCard.photoSrc,
    moment: {
      id: 'preview-card',
      title: deferredTitle || 'Untitled moment',
      caption: deferredCaption || 'Tell the story behind the shot on the back of the slab.',
      matchup: deferredMatchup || 'Matchup pending',
      finalScore: deferredFinalScore || 'Score pending',
      memoryRating: ratingNumber,
      capturedAt: deferredDate ? new Date(`${deferredDate}T12:00:00.000Z`) : null,
      section: deferredSection || null,
      row: deferredRow || null,
      seat: deferredSeat || null,
      createdAt: new Date(),
      visibility: deferredPrivacy,
    },
    template: {
      id: selectedTemplate?.id || 'preview-template',
      name: selectedTemplate?.name || 'Preview Slab',
      slug: selectedTemplate?.slug || 'base',
      themeName: selectedTemplate?.themeName || 'base',
      description: selectedTemplate?.description || null,
      accentColor: null,
      foilStyle: null,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    venue: selectedVenue
      ? {
          id: selectedVenue.id,
          name: selectedVenue.name,
          slug: selectedVenue.slug,
          city: selectedVenue.city,
          region: selectedVenue.region,
          country: 'USA',
          timezone: 'America/New_York',
          latitude: null,
          longitude: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      : {
          id: 'custom-venue',
          name: deferredVenue || 'Venue pending',
          slug: 'custom-venue',
          city: 'TBD',
          region: null,
          country: 'USA',
          timezone: 'America/New_York',
          latitude: null,
          longitude: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
    collectionBadges: [selectedTemplate?.name || 'Template preview'],
  })

  previewCard.variant = selectedTemplate
    ? cardVariantFromTemplate(selectedTemplate)
    : draftMomentCard.variant
  previewCard.seatInfo = buildSeatInfo({
    section: deferredSection || null,
    row: deferredRow || null,
    seat: deferredSeat || null,
  })
  previewCard.dateLabel = deferredDate
    ? formatMomentDateLabel(new Date(`${deferredDate}T12:00:00.000Z`))
    : 'Date pending'
  previewCard.memoryRatingLabel = memoryRatingLabel(ratingNumber)
  previewCard.hypeLabel = hypeLabelFromRating(ratingNumber)

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    if (!selectedFile) {
      setError('Choose an image before minting.')
      return
    }

    const formData = new FormData()
    formData.set('image', selectedFile)
    formData.set('title', title)
    formData.set('caption', caption)
    formData.set('venue', venue)
    formData.set('date', date)
    formData.set('matchup', matchup)
    formData.set('finalScore', finalScore)
    formData.set('section', section)
    formData.set('row', row)
    formData.set('seat', seat)
    formData.set('memoryRating', memoryRating)
    formData.set('cardTemplateId', cardTemplateId)
    formData.set('privacy', privacy)

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/moments', {
        method: 'POST',
        body: formData,
      })

      const payload = (await response.json()) as { error?: string; momentId?: string }

      if (!response.ok || !payload.momentId) {
        throw new Error(payload.error || 'Unable to mint this moment right now.')
      }

      await router.navigate({
        params: {
          momentId: payload.momentId,
        },
        to: '/moments/$momentId',
      })
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to mint this moment right now.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-md space-y-5 lg:max-w-6xl">
      <PageIntro
        eyebrow="Primary action"
        title="Mint a new moment"
        description="Upload the image, capture the game details, and preview the sealed slab before the moment is written to D1 and stored in R2."
      />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,24rem)_minmax(0,1fr)]">
        <section className="space-y-5">
          <InfoPanel
            title="Moment details"
            description={`Signed in as ${data.currentUser.email}. This flow stores image files in ${data.mediaBinding} and collectible metadata in ${data.metadataBinding}.`}
          >
            <form className="space-y-4" onSubmit={onSubmit}>
              <label className="block space-y-2 text-sm text-slate-200">
                <span>Upload image</span>
                <input
                  required
                  accept="image/*"
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white"
                  name="image"
                  type="file"
                  onChange={(event) => {
                    setSelectedFile(event.target.files?.[0] || null)
                  }}
                />
              </label>

              <label className="block space-y-2 text-sm text-slate-200">
                <span>Title</span>
                <input
                  required
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white"
                  maxLength={80}
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                />
              </label>

              <label className="block space-y-2 text-sm text-slate-200">
                <span>Caption / story</span>
                <textarea
                  className="min-h-28 w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white"
                  maxLength={400}
                  value={caption}
                  onChange={(event) => setCaption(event.target.value)}
                />
              </label>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="block space-y-2 text-sm text-slate-200">
                  <span>Venue</span>
                  <input
                    required
                    list="venue-suggestions"
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white"
                    value={venue}
                    onChange={(event) => setVenue(event.target.value)}
                  />
                </label>

                <label className="block space-y-2 text-sm text-slate-200">
                  <span>Date</span>
                  <input
                    required
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white"
                    type="date"
                    value={date}
                    onChange={(event) => setDate(event.target.value)}
                  />
                </label>
              </div>

              <datalist id="venue-suggestions">
                {data.venues.map((entry) => (
                  <option key={entry.id} value={entry.name}>
                    {entry.city}
                    {entry.region ? `, ${entry.region}` : ''}
                  </option>
                ))}
              </datalist>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="block space-y-2 text-sm text-slate-200">
                  <span>Matchup</span>
                  <input
                    required
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white"
                    placeholder="Comets vs Lions"
                    value={matchup}
                    onChange={(event) => setMatchup(event.target.value)}
                  />
                </label>

                <label className="block space-y-2 text-sm text-slate-200">
                  <span>Final score</span>
                  <input
                    required
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white"
                    placeholder="108-101"
                    value={finalScore}
                    onChange={(event) => setFinalScore(event.target.value)}
                  />
                </label>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <label className="block space-y-2 text-sm text-slate-200">
                  <span>Section</span>
                  <input
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white"
                    value={section}
                    onChange={(event) => setSection(event.target.value)}
                  />
                </label>

                <label className="block space-y-2 text-sm text-slate-200">
                  <span>Row</span>
                  <input
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white"
                    value={row}
                    onChange={(event) => setRow(event.target.value)}
                  />
                </label>

                <label className="block space-y-2 text-sm text-slate-200">
                  <span>Seat</span>
                  <input
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white"
                    value={seat}
                    onChange={(event) => setSeat(event.target.value)}
                  />
                </label>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <label className="block space-y-2 text-sm text-slate-200">
                  <span>Memory rating</span>
                  <select
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white"
                    value={memoryRating}
                    onChange={(event) => setMemoryRating(event.target.value)}
                  >
                    {memoryRatingOptions.map((rating) => (
                      <option key={rating} value={String(rating)}>
                        {rating}/10
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block space-y-2 text-sm text-slate-200 sm:col-span-2">
                  <span>Card template</span>
                  <select
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white"
                    value={cardTemplateId}
                    onChange={(event) => setCardTemplateId(event.target.value)}
                  >
                    {data.templates.map((template) => (
                      <option key={template.id} value={template.id}>
                        {template.name} • {template.variant}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="block space-y-2 text-sm text-slate-200">
                <span>Privacy</span>
                <select
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white"
                  value={privacy}
                  onChange={(event) =>
                    setPrivacy(event.target.value as 'public' | 'friends' | 'private')
                  }
                >
                  <option value="public">Public</option>
                  <option value="friends">Friends only</option>
                  <option value="private">Private</option>
                </select>
              </label>

              {error ? (
                <StateCard title="Mint failed" message={error} tone="danger" />
              ) : null}

              <button
                type="submit"
                className="w-full rounded-2xl bg-amber-400 px-4 py-3 font-semibold text-slate-950 transition hover:bg-amber-300 disabled:opacity-60"
                disabled={isSubmitting || data.templates.length === 0}
              >
                {isSubmitting ? 'Saving moment...' : 'Mint moment'}
              </button>
            </form>
          </InfoPanel>

          <InfoPanel
            title="Storage targets"
            description="This mint writes the image to the media bucket, stores metadata in D1, then redirects to the saved collectible detail page."
          >
            <div className="space-y-3 text-sm text-slate-200">
              <div className="rounded-[1.2rem] border border-white/10 bg-white/5 p-4">
                Images upload to <strong>{data.mediaBinding}</strong>
              </div>
              <div className="rounded-[1.2rem] border border-white/10 bg-white/5 p-4">
                Metadata saves to <strong>{data.metadataBinding}</strong>
              </div>
              <div className="rounded-[1.2rem] border border-white/10 bg-white/5 p-4">
                Draft slots remaining: <strong>{data.draftSlotsRemaining}</strong>
              </div>
            </div>
          </InfoPanel>
        </section>

        <section className="space-y-5 lg:sticky lg:top-24 lg:self-start">
          <MomentCard3D moment={previewCard} size="detail" />

          <InfoPanel
            title="Live slab preview"
            description="The uploaded image is shown sealed in the slab immediately, and the chosen template drives the front label, badge treatment, and back metadata panel."
          >
            <div className="flex flex-wrap gap-2 text-xs text-slate-200">
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
                {selectedTemplate?.name || 'Template pending'}
              </span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
                {previewCard.dateLabel}
              </span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
                {previewCard.seatInfo}
              </span>
            </div>
          </InfoPanel>

          <InfoPanel
            title="Need inspiration?"
            description="The demo gallery shows the same 360 slab system across multiple variants before you lock in the final template."
          >
            <Link
              to="/moments/demo"
              className="text-sm font-medium text-amber-200 no-underline"
            >
              Open the Moment Card demo gallery
            </Link>
          </InfoPanel>
        </section>
      </div>
    </div>
  )
}
