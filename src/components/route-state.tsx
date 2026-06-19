import type { ReactNode } from 'react'

type Appearance = 'utility' | 'collectible'

export function PageIntro({
  eyebrow,
  title,
  description,
  action,
  appearance = 'utility',
}: {
  eyebrow: string
  title: string
  description: string
  action?: ReactNode
  appearance?: Appearance
}) {
  const isCollectible = appearance === 'collectible'

  return (
    <section className={`gs-intro ${isCollectible ? 'gs-intro-collectible' : 'gs-intro-utility'}`}>
      <p
        className={`mb-3 text-[11px] font-semibold uppercase tracking-[0.32em] ${
          isCollectible ? 'text-[#e4c995]' : 'text-[var(--gs-action-ink)]'
        }`}
      >
        {eyebrow}
      </p>
      <div className="relative z-10 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1
            className={`text-3xl font-semibold tracking-[-0.04em] sm:text-[2.2rem] ${
              isCollectible ? 'text-[#fff7e8]' : 'text-[var(--gs-ink)]'
            }`}
          >
            {title}
          </h1>
          <p
            className={`mt-2 max-w-2xl text-sm leading-6 ${
              isCollectible ? 'text-[#ddd4c3]' : 'text-[var(--gs-ink-soft)]'
            }`}
          >
            {description}
          </p>
        </div>
        {action ? <div className="relative z-10 shrink-0">{action}</div> : null}
      </div>
    </section>
  )
}

export function InfoPanel({
  title,
  description,
  children,
  appearance = 'utility',
  muted = false,
}: {
  title: string
  description: string
  children?: ReactNode
  appearance?: Appearance
  muted?: boolean
}) {
  const panelClass =
    appearance === 'collectible'
      ? 'gs-panel gs-panel-collectible'
      : muted
        ? 'gs-panel gs-panel-muted'
        : 'gs-panel gs-panel-utility'

  return (
    <section className={panelClass}>
      <h2
        className={`text-lg font-semibold tracking-[-0.03em] ${
          appearance === 'collectible' ? 'text-[#fff7e8]' : 'text-[var(--gs-ink)]'
        }`}
      >
        {title}
      </h2>
      <p
        className={`mt-2 text-sm leading-6 ${
          appearance === 'collectible' ? 'text-[#d8cfbf]' : 'text-[var(--gs-ink-soft)]'
        }`}
      >
        {description}
      </p>
      {children ? <div className="mt-4">{children}</div> : null}
    </section>
  )
}

export function StateCard({
  title,
  message,
  tone = 'neutral',
  appearance = 'utility',
}: {
  title: string
  message: string
  tone?: 'neutral' | 'warning' | 'danger'
  appearance?: Appearance
}) {
  const toneClass =
    appearance === 'collectible'
      ? tone === 'danger'
        ? 'border-[#8f4d48] bg-[#2a1717] text-[#f7ddd7]'
        : tone === 'warning'
          ? 'border-[#7f6941] bg-[#271f13] text-[#f2e1bb]'
          : 'border-[rgba(207,177,118,0.22)] bg-[rgba(255,255,255,0.05)] text-[#f4efe2]'
      : tone === 'danger'
        ? 'border-[#e6c3be] bg-[var(--gs-danger-soft)] text-[#7f2f26]'
        : tone === 'warning'
          ? 'border-[#e4d1a7] bg-[var(--gs-warning-soft)] text-[#78561e]'
          : 'border-[var(--gs-border)] bg-[rgba(255,255,255,0.86)] text-[var(--gs-ink)]'

  return (
    <div className={`rounded-[1.35rem] border p-5 shadow-[0_14px_32px_rgba(21,24,33,0.08)] ${toneClass}`}>
      <p className="text-base font-semibold tracking-[-0.02em]">{title}</p>
      <p className="mt-2 text-sm leading-6 opacity-90">{message}</p>
    </div>
  )
}
