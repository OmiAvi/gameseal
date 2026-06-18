import type { ReactNode } from 'react'

export function PageIntro({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string
  title: string
  description: string
  action?: ReactNode
}) {
  return (
    <section className="mb-5 rounded-[2rem] border border-white/10 bg-white/5 p-5 shadow-[0_18px_60px_rgba(2,6,12,0.35)] backdrop-blur">
      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.28em] text-teal-200/80">
        {eyebrow}
      </p>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-white">
            {title}
          </h1>
          <p className="mt-2 max-w-sm text-sm leading-6 text-slate-300">
            {description}
          </p>
        </div>
        {action}
      </div>
    </section>
  )
}

export function InfoPanel({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children?: ReactNode
}) {
  return (
    <section className="rounded-[1.8rem] border border-white/10 bg-slate-950/55 p-5">
      <h2 className="text-lg font-semibold text-white">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-slate-300">{description}</p>
      {children ? <div className="mt-4">{children}</div> : null}
    </section>
  )
}

export function StateCard({
  title,
  message,
  tone = 'neutral',
}: {
  title: string
  message: string
  tone?: 'neutral' | 'warning' | 'danger'
}) {
  const toneClass =
    tone === 'danger'
      ? 'border-rose-400/30 bg-rose-500/10 text-rose-100'
      : tone === 'warning'
        ? 'border-amber-300/30 bg-amber-400/10 text-amber-50'
        : 'border-white/10 bg-white/5 text-slate-100'

  return (
    <div className={`rounded-[1.6rem] border p-5 ${toneClass}`}>
      <p className="text-base font-semibold">{title}</p>
      <p className="mt-2 text-sm leading-6 opacity-90">{message}</p>
    </div>
  )
}
