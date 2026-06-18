import { useEffect, useRef, useState } from 'react'

import { ChevronLeft, ChevronRight, RotateCcw, Rotate3d } from 'lucide-react'

import { APP_NAME } from '#/lib/config'
import {
  flipCardKeyPressed,
  flipRotation,
  nextRotationFromDelta,
  normalizeRotation,
  visibleCardSide,
  type MomentCardData,
  type MomentCardVariant,
} from '#/lib/moment-card'

const variantStyles: Record<
  MomentCardVariant,
  {
    shell: string
    panel: string
    label: string
    edge: string
    badge: string
    accent: string
    glow: string
  }
> = {
  base: {
    shell:
      'from-slate-200 via-slate-50 to-slate-300 text-slate-950 shadow-[0_28px_90px_rgba(2,6,23,0.35)]',
    panel: 'from-[#0d1724] via-[#112336] to-[#0a1522] text-slate-100',
    label: 'from-teal-500/30 via-cyan-300/20 to-amber-200/20',
    edge: 'from-slate-500 via-slate-300 to-slate-600',
    badge: 'border-cyan-200/35 bg-cyan-300/10 text-cyan-50',
    accent: '#67e8f9',
    glow: 'rgba(103, 232, 249, 0.22)',
  },
  rivalry: {
    shell:
      'from-rose-200 via-amber-50 to-rose-300 text-slate-950 shadow-[0_28px_90px_rgba(127,29,29,0.34)]',
    panel: 'from-[#25080b] via-[#401117] to-[#17060a] text-rose-50',
    label: 'from-rose-500/32 via-amber-300/20 to-rose-950/10',
    edge: 'from-rose-800 via-rose-500 to-slate-900',
    badge: 'border-rose-200/30 bg-rose-300/12 text-rose-50',
    accent: '#fb7185',
    glow: 'rgba(251, 113, 133, 0.22)',
  },
  playoff: {
    shell:
      'from-blue-100 via-slate-50 to-blue-300 text-slate-950 shadow-[0_28px_90px_rgba(29,78,216,0.33)]',
    panel: 'from-[#08111f] via-[#102340] to-[#0b1830] text-blue-50',
    label: 'from-blue-500/35 via-sky-200/20 to-slate-100/15',
    edge: 'from-blue-800 via-blue-500 to-slate-900',
    badge: 'border-blue-200/30 bg-blue-300/12 text-blue-50',
    accent: '#93c5fd',
    glow: 'rgba(147, 197, 253, 0.25)',
  },
  'road-game': {
    shell:
      'from-cyan-100 via-slate-100 to-slate-300 text-slate-950 shadow-[0_28px_90px_rgba(8,47,73,0.33)]',
    panel: 'from-[#081018] via-[#102032] to-[#07111d] text-slate-100',
    label: 'from-cyan-500/30 via-slate-100/15 to-slate-100/8',
    edge: 'from-cyan-900 via-slate-500 to-slate-950',
    badge: 'border-cyan-200/25 bg-cyan-300/10 text-cyan-50',
    accent: '#67e8f9',
    glow: 'rgba(103, 232, 249, 0.18)',
  },
  'first-venue': {
    shell:
      'from-amber-100 via-stone-50 to-orange-200 text-slate-950 shadow-[0_28px_90px_rgba(180,83,9,0.3)]',
    panel: 'from-[#22140b] via-[#3a2414] to-[#1a1008] text-amber-50',
    label: 'from-amber-500/34 via-orange-300/18 to-stone-100/10',
    edge: 'from-amber-900 via-amber-500 to-stone-900',
    badge: 'border-amber-200/28 bg-amber-300/12 text-amber-50',
    accent: '#f59e0b',
    glow: 'rgba(245, 158, 11, 0.21)',
  },
  overtime: {
    shell:
      'from-violet-100 via-slate-100 to-violet-300 text-slate-950 shadow-[0_28px_90px_rgba(109,40,217,0.3)]',
    panel: 'from-[#170a28] via-[#2a1249] to-[#13081f] text-violet-50',
    label: 'from-violet-500/36 via-fuchsia-300/18 to-slate-100/8',
    edge: 'from-violet-900 via-violet-500 to-slate-950',
    badge: 'border-violet-200/28 bg-violet-300/10 text-violet-50',
    accent: '#c084fc',
    glow: 'rgba(192, 132, 252, 0.22)',
  },
  walkoff: {
    shell:
      'from-emerald-100 via-lime-50 to-emerald-300 text-slate-950 shadow-[0_28px_90px_rgba(21,128,61,0.3)]',
    panel: 'from-[#07170d] via-[#123120] to-[#08150e] text-emerald-50',
    label: 'from-emerald-500/34 via-lime-300/18 to-slate-100/10',
    edge: 'from-emerald-900 via-emerald-500 to-slate-950',
    badge: 'border-emerald-200/30 bg-emerald-300/10 text-emerald-50',
    accent: '#86efac',
    glow: 'rgba(134, 239, 172, 0.22)',
  },
  'buzzer-beater': {
    shell:
      'from-orange-100 via-amber-50 to-orange-300 text-slate-950 shadow-[0_28px_90px_rgba(154,52,18,0.32)]',
    panel: 'from-[#231109] via-[#472010] to-[#170b07] text-orange-50',
    label: 'from-orange-500/35 via-amber-300/20 to-slate-100/8',
    edge: 'from-orange-900 via-orange-500 to-slate-950',
    badge: 'border-orange-200/30 bg-orange-300/10 text-orange-50',
    accent: '#fdba74',
    glow: 'rgba(253, 186, 116, 0.24)',
  },
  legendary: {
    shell:
      'from-yellow-100 via-stone-50 to-yellow-300 text-slate-950 shadow-[0_28px_90px_rgba(133,77,14,0.35)]',
    panel: 'from-[#1f1305] via-[#3d2a0d] to-[#181005] text-amber-50',
    label: 'from-yellow-400/36 via-amber-300/22 to-slate-100/10',
    edge: 'from-yellow-900 via-amber-500 to-stone-900',
    badge: 'border-yellow-200/35 bg-yellow-300/12 text-yellow-50',
    accent: '#fde68a',
    glow: 'rgba(254, 240, 138, 0.25)',
  },
}

function formatVariantName(variant: MomentCardVariant) {
  return variant.replace(/-/g, ' ')
}

function cardGlare(rotation: number, glow: string) {
  const normalized = normalizeRotation(rotation)
  const radians = (normalized * Math.PI) / 180
  const x = 50 + Math.sin(radians) * 28
  const y = 24 + Math.cos(radians) * 10
  const edgeOpacity = 0.16 + Math.abs(Math.sin(radians)) * 0.1

  return {
    background: `
      radial-gradient(circle at ${x}% ${y}%, rgba(255,255,255,0.42), rgba(255,255,255,0.12) 16%, transparent 44%),
      linear-gradient(120deg, rgba(255,255,255,${edgeOpacity}) 0%, transparent 35%, transparent 65%, rgba(255,255,255,0.08) 100%),
      linear-gradient(180deg, rgba(255,255,255,0.08), transparent 18%, transparent 82%, rgba(0,0,0,0.16)),
      radial-gradient(circle at 50% 14%, ${glow}, transparent 54%)
    `,
  }
}

export function SlabTopLabel({
  appName,
  momentId,
  venue,
  matchup,
  dateLabel,
  finalScore,
  variant,
}: {
  appName: string
  momentId: string
  venue: string
  matchup: string
  dateLabel: string
  finalScore: string
  variant: MomentCardVariant
}) {
  const theme = variantStyles[variant]

  return (
    <div
      className={`rounded-[1.2rem] border border-white/16 bg-gradient-to-br ${theme.label} px-3 py-3 text-slate-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.55)]`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.34em] text-slate-700/80">
            {appName}
          </p>
          <p className="mt-1 text-sm font-semibold text-slate-900">{matchup}</p>
        </div>
        <div className="rounded-full border border-slate-900/10 bg-white/55 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.28em] text-slate-700">
          {momentId}
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] leading-4 text-slate-700">
        <div className="rounded-2xl bg-slate-950/5 px-2.5 py-2">
          <p className="uppercase tracking-[0.22em] text-slate-700/70">Venue</p>
          <p className="mt-1 font-semibold text-slate-900">{venue}</p>
        </div>
        <div className="rounded-2xl bg-slate-950/5 px-2.5 py-2">
          <p className="uppercase tracking-[0.22em] text-slate-700/70">Date</p>
          <p className="mt-1 font-semibold text-slate-900">{dateLabel}</p>
        </div>
        <div className="rounded-2xl bg-slate-950/5 px-2.5 py-2">
          <p className="uppercase tracking-[0.22em] text-slate-700/70">Final</p>
          <p className="mt-1 font-semibold text-slate-900">{finalScore}</p>
        </div>
        <div className="rounded-2xl bg-slate-950/5 px-2.5 py-2">
          <p className="uppercase tracking-[0.22em] text-slate-700/70">Variant</p>
          <p className="mt-1 font-semibold capitalize text-slate-900">
            {formatVariantName(variant)}
          </p>
        </div>
      </div>
    </div>
  )
}

export function PhotoWindow({
  photoSrc,
  title,
  seatInfo,
  variant,
}: {
  photoSrc: string
  title: string
  seatInfo: string
  variant: MomentCardVariant
}) {
  const theme = variantStyles[variant]

  return (
    <div className="relative overflow-hidden rounded-[1.6rem] border border-white/14 bg-slate-950/70 p-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]">
      <div className="relative overflow-hidden rounded-[1.2rem] border border-white/10 bg-slate-900">
        <img alt={title} className="block h-[16.6rem] w-full object-cover" src={photoSrc} />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(160deg,rgba(255,255,255,0.24),transparent_26%,transparent_68%,rgba(255,255,255,0.12))]" />
        <div className="pointer-events-none absolute inset-[6px] rounded-[1rem] border border-white/16" />
        <div
          className="pointer-events-none absolute inset-x-5 top-3 h-7 rounded-full blur-2xl"
          style={{ backgroundColor: theme.glow }}
        />
        <div className="absolute bottom-3 left-3 rounded-full border border-white/14 bg-slate-950/70 px-3 py-1.5 text-[11px] font-medium text-white backdrop-blur">
          {seatInfo}
        </div>
      </div>
    </div>
  )
}

export function CardNameplate({
  title,
  seatInfo,
  hypeLabel,
}: {
  title: string
  seatInfo: string
  hypeLabel: string
}) {
  return (
    <div className="rounded-[1.3rem] border border-white/10 bg-slate-950/45 px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-slate-400">
        Moment title
      </p>
      <h3 className="mt-1 text-xl font-semibold tracking-tight text-white">{title}</h3>
      <div className="mt-2 flex items-center justify-between gap-3 text-sm text-slate-300">
        <span>{seatInfo}</span>
        <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[11px] uppercase tracking-[0.22em] text-slate-200">
          {hypeLabel}
        </span>
      </div>
    </div>
  )
}

export function RarityBadge({
  rarity,
  variant,
}: {
  rarity: string
  variant: MomentCardVariant
}) {
  const theme = variantStyles[variant]

  return (
    <div
      className={`rounded-full border px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.26em] ${theme.badge}`}
    >
      {rarity}
    </div>
  )
}

export function MemoryRatingBadge({
  memoryRatingLabel,
  variant,
}: {
  memoryRatingLabel: string
  variant: MomentCardVariant
}) {
  const theme = variantStyles[variant]

  return (
    <div
      className={`rounded-full border px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.24em] ${theme.badge}`}
    >
      {memoryRatingLabel}
    </div>
  )
}

export function SlabShell({
  children,
  rotation,
  side,
  variant,
}: {
  children: React.ReactNode
  rotation: number
  side: 'front' | 'back'
  variant: MomentCardVariant
}) {
  const theme = variantStyles[variant]

  return (
    <div className={`relative h-full w-full overflow-hidden rounded-[2rem] bg-gradient-to-br ${theme.shell}`}>
      <div className="absolute inset-[7px] rounded-[1.7rem] bg-white/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.55)]" />
      <div className={`absolute inset-[12px] rounded-[1.45rem] bg-gradient-to-br ${theme.panel}`} />
      <div className="pointer-events-none absolute inset-[10px] rounded-[1.55rem] border border-white/24" />
      <div className="pointer-events-none absolute inset-x-6 top-2 h-10 rounded-full bg-white/30 blur-2xl" />
      <div
        className="pointer-events-none absolute inset-[14px] rounded-[1.4rem]"
        style={cardGlare(rotation, theme.glow)}
      />
      <div className="pointer-events-none absolute inset-y-[13px] left-[15px] w-px bg-white/18" />
      <div className="pointer-events-none absolute inset-y-[13px] right-[15px] w-px bg-black/12" />
      <div className="relative z-10 flex h-full flex-col gap-3 p-4">
        {children}
      </div>
      <div className="pointer-events-none absolute bottom-4 right-4 rounded-full border border-white/12 bg-black/10 px-3 py-1 text-[10px] uppercase tracking-[0.28em] text-white/75">
        {side}
      </div>
    </div>
  )
}

export function CardFront({ moment, rotation }: { moment: MomentCardData; rotation: number }) {
  return (
    <SlabShell rotation={rotation} side="front" variant={moment.variant}>
      <SlabTopLabel
        appName={APP_NAME}
        dateLabel={moment.dateLabel}
        finalScore={moment.finalScore}
        matchup={moment.matchup}
        momentId={moment.momentId}
        variant={moment.variant}
        venue={moment.venue}
      />
      <PhotoWindow
        photoSrc={moment.photoSrc}
        seatInfo={moment.seatInfo}
        title={moment.title}
        variant={moment.variant}
      />
      <CardNameplate
        hypeLabel={moment.hypeLabel}
        seatInfo={moment.seatInfo}
        title={moment.title}
      />
      <div className="mt-auto flex flex-wrap gap-2">
        <RarityBadge rarity={moment.rarity} variant={moment.variant} />
        <MemoryRatingBadge
          memoryRatingLabel={moment.memoryRatingLabel}
          variant={moment.variant}
        />
      </div>
    </SlabShell>
  )
}

export function CardBack({ moment, rotation }: { moment: MomentCardData; rotation: number }) {
  const theme = variantStyles[moment.variant]

  return (
    <SlabShell rotation={rotation} side="back" variant={moment.variant}>
      <SlabTopLabel
        appName={APP_NAME}
        dateLabel={moment.dateLabel}
        finalScore={moment.finalScore}
        matchup={moment.matchup}
        momentId={moment.momentId}
        variant={moment.variant}
        venue={moment.venue}
      />

      <div className="rounded-[1.4rem] border border-white/12 bg-slate-950/45 p-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-400">
          Moment story
        </p>
        <p className="mt-2 text-sm leading-6 text-slate-100">{moment.story}</p>
      </div>

      <div className="grid grid-cols-2 gap-2 text-sm text-slate-200">
        <div className="rounded-[1.2rem] border border-white/10 bg-white/5 p-3">
          <p className="text-[10px] uppercase tracking-[0.26em] text-slate-400">Venue / date</p>
          <p className="mt-1 font-semibold text-white">{moment.venue}</p>
          <p className="mt-1 text-slate-300">{moment.dateLabel}</p>
        </div>
        <div className="rounded-[1.2rem] border border-white/10 bg-white/5 p-3">
          <p className="text-[10px] uppercase tracking-[0.26em] text-slate-400">Final score</p>
          <p className="mt-1 font-semibold text-white">{moment.finalScore}</p>
          <p className="mt-1 text-slate-300">{moment.matchup}</p>
        </div>
      </div>

      <div className="rounded-[1.4rem] border border-white/12 bg-slate-950/45 p-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-400">
          Game details
        </p>
        <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-100">
          {moment.gameDetails.map((detail) => (
            <li key={detail} className="rounded-2xl border border-white/8 bg-white/5 px-3 py-2">
              {detail}
            </li>
          ))}
        </ul>
      </div>

      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="rounded-[1.2rem] border border-white/10 bg-white/5 p-3">
          <p className="text-[10px] uppercase tracking-[0.26em] text-slate-400">Companions</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {moment.companions.length > 0 ? (
              moment.companions.map((companion) => (
                <span
                  key={companion}
                  className={`rounded-full border px-2.5 py-1 text-[11px] ${theme.badge}`}
                >
                  {companion}
                </span>
              ))
            ) : (
              <span className="rounded-full border border-white/12 bg-slate-950/55 px-2.5 py-1 text-[11px] text-slate-300">
                Companion notes placeholder
              </span>
            )}
          </div>
        </div>
        <div className="rounded-[1.2rem] border border-white/10 bg-white/5 p-3">
          <p className="text-[10px] uppercase tracking-[0.26em] text-slate-400">Tags</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {moment.tags.length > 0 ? (
              moment.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-white/12 bg-slate-900/55 px-2.5 py-1 text-[11px] text-slate-100"
                >
                  #{tag}
                </span>
              ))
            ) : (
              <span className="rounded-full border border-white/12 bg-slate-950/55 px-2.5 py-1 text-[11px] text-slate-300">
                Tag placeholders
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-[1.3rem] border border-dashed border-white/16 bg-white/5 p-3">
        <p className="text-[10px] uppercase tracking-[0.28em] text-slate-400">
          Collection badges
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {moment.collectionBadges.length > 0 ? (
            moment.collectionBadges.map((badge) => (
              <span
                key={badge}
                className="rounded-full border border-white/12 bg-slate-950/55 px-3 py-1.5 text-[11px] font-medium text-white"
              >
                {badge}
              </span>
            ))
          ) : (
            <span className="rounded-full border border-white/12 bg-slate-950/55 px-3 py-1.5 text-[11px] font-medium text-slate-300">
              Collection badge placeholder
            </span>
          )}
        </div>
      </div>
    </SlabShell>
  )
}

export function CardControls({
  onFlip,
  onReset,
  onRotateLeft,
  onRotateRight,
  visibleSide,
}: {
  onFlip: () => void
  onReset: () => void
  onRotateLeft: () => void
  onRotateRight: () => void
  visibleSide: 'front' | 'back'
}) {
  return (
    <div className="grid grid-cols-4 gap-2 text-sm">
      <button
        type="button"
        className="flex items-center justify-center gap-1 rounded-full border border-white/10 bg-slate-900/75 px-3 py-2 text-slate-100 transition hover:border-teal-300/40"
        onClick={onRotateLeft}
      >
        <ChevronLeft className="h-4 w-4" />
        Left
      </button>
      <button
        type="button"
        className="flex items-center justify-center gap-1 rounded-full border border-white/10 bg-slate-900/75 px-3 py-2 text-slate-100 transition hover:border-teal-300/40"
        onClick={onFlip}
      >
        <Rotate3d className="h-4 w-4" />
        {visibleSide === 'front' ? 'Back' : 'Front'}
      </button>
      <button
        type="button"
        className="flex items-center justify-center gap-1 rounded-full border border-white/10 bg-slate-900/75 px-3 py-2 text-slate-100 transition hover:border-teal-300/40"
        onClick={onReset}
      >
        <RotateCcw className="h-4 w-4" />
        Reset
      </button>
      <button
        type="button"
        className="flex items-center justify-center gap-1 rounded-full border border-white/10 bg-slate-900/75 px-3 py-2 text-slate-100 transition hover:border-teal-300/40"
        onClick={onRotateRight}
      >
        Right
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  )
}

export function MomentCard3D({
  moment,
  size = 'compact',
}: {
  moment: MomentCardData
  size?: 'compact' | 'detail'
}) {
  const [rotation, setRotation] = useState(0)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)
  const dragStartX = useRef<number | null>(null)
  const dragStartRotation = useRef(0)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setPrefersReducedMotion(mediaQuery.matches)
    update()
    mediaQuery.addEventListener('change', update)
    return () => mediaQuery.removeEventListener('change', update)
  }, [])

  function beginDrag(clientX: number) {
    dragStartX.current = clientX
    dragStartRotation.current = rotation
  }

  function updateDrag(clientX: number) {
    if (dragStartX.current === null) {
      return
    }

    setRotation(nextRotationFromDelta(dragStartRotation.current, clientX - dragStartX.current))
  }

  function endDrag() {
    dragStartX.current = null
  }

  const face = visibleCardSide(rotation)
  const theme = variantStyles[moment.variant]
  const cardWidth =
    size === 'detail' ? 'min(88vw, 24rem)' : 'min(84vw, 18rem)'
  const sceneHeight =
    size === 'detail' ? 'min(calc(88vw * 1.52), 36.5rem)' : 'min(calc(84vw * 1.52), 27.5rem)'

  return (
    <section className="rounded-[2rem] border border-white/10 bg-white/5 p-4 shadow-[0_18px_60px_rgba(2,6,12,0.35)] backdrop-blur">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-200/80">
            Premium slab preview
          </p>
          <h3 className="mt-1 text-lg font-semibold text-white">{moment.title}</h3>
        </div>
        <div className="rounded-full border border-white/10 bg-slate-950/70 px-3 py-2 text-[11px] uppercase tracking-[0.24em] text-slate-100">
          {moment.variant}
        </div>
      </div>

      <div
        className="relative mx-auto touch-pan-y [perspective:2200px]"
        style={{ width: cardWidth, height: sceneHeight }}
        onPointerCancel={endDrag}
        onPointerLeave={endDrag}
        onPointerUp={endDrag}
      >
        <div
          aria-label="Moment card. Drag left or right to rotate 360 degrees. Press Enter or Space to flip. Use arrow keys to rotate."
          aria-pressed={face === 'back'}
          className="relative h-full w-full cursor-grab outline-none active:cursor-grabbing"
          role="button"
          tabIndex={0}
          onKeyDown={(event) => {
            if (flipCardKeyPressed(event.key)) {
              event.preventDefault()
              setRotation((current) => flipRotation(current))
            }

            if (event.key === 'ArrowLeft') {
              event.preventDefault()
              setRotation((current) => nextRotationFromDelta(current, -30))
            }

            if (event.key === 'ArrowRight') {
              event.preventDefault()
              setRotation((current) => nextRotationFromDelta(current, 30))
            }

            if (event.key === 'Home') {
              event.preventDefault()
              setRotation(0)
            }
          }}
          onPointerDown={(event) => {
            event.currentTarget.setPointerCapture(event.pointerId)
            beginDrag(event.clientX)
          }}
          onPointerMove={(event) => updateDrag(event.clientX)}
          style={{
            transformStyle: 'preserve-3d',
            transform: `rotateY(${rotation}deg) rotateX(${prefersReducedMotion ? 0 : 7}deg)`,
            transition: prefersReducedMotion ? 'none' : 'transform 240ms ease',
          }}
        >
          <div
            className={`absolute inset-y-[10px] right-[-7px] w-[14px] rounded-full bg-gradient-to-b ${theme.edge}`}
            style={{
              transform: 'rotateY(90deg)',
              transformStyle: 'preserve-3d',
            }}
          />
          <div
            className={`absolute inset-y-[10px] left-[-7px] w-[14px] rounded-full bg-gradient-to-b ${theme.edge}`}
            style={{
              transform: 'rotateY(-90deg)',
              transformStyle: 'preserve-3d',
            }}
          />
          <div
            className={`absolute inset-x-[14px] top-[-7px] h-[14px] rounded-full bg-gradient-to-r ${theme.edge}`}
            style={{ transform: 'rotateX(90deg)' }}
          />
          <div
            className={`absolute inset-x-[14px] bottom-[-7px] h-[14px] rounded-full bg-gradient-to-r ${theme.edge}`}
            style={{ transform: 'rotateX(-90deg)' }}
          />

          <div
            className="absolute inset-0"
            style={{
              backfaceVisibility: 'hidden',
              transform: 'translateZ(7px)',
            }}
          >
            <CardFront moment={moment} rotation={rotation} />
          </div>

          <div
            className="absolute inset-0"
            style={{
              backfaceVisibility: 'hidden',
              transform: 'rotateY(180deg) translateZ(7px)',
            }}
          >
            <CardBack moment={moment} rotation={rotation + 180} />
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-[1.4rem] border border-white/10 bg-slate-950/45 p-3">
        <div className="mb-3 flex items-center justify-between text-xs uppercase tracking-[0.24em] text-slate-400">
          <span>Visible side: {face}</span>
          <span>{Math.round(normalizeRotation(rotation))}°</span>
        </div>
        <CardControls
          onFlip={() => setRotation((current) => flipRotation(current))}
          onReset={() => setRotation(0)}
          onRotateLeft={() => setRotation((current) => nextRotationFromDelta(current, -28))}
          onRotateRight={() => setRotation((current) => nextRotationFromDelta(current, 28))}
          visibleSide={face}
        />
      </div>
    </section>
  )
}
