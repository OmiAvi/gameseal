import { Link } from '@tanstack/react-router'

import { APP_NAME, APP_TAGLINE } from '#/lib/config'

import { BottomNav } from './bottom-nav'

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(13,148,136,0.28),_transparent_34%),linear-gradient(180deg,_#04111c_0%,_#071826_52%,_#02060c_100%)] text-slate-100">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 pb-28 pt-4">
        <header className="sticky top-0 z-20 mb-4 flex items-center justify-between rounded-full border border-white/10 bg-slate-950/55 px-4 py-3 backdrop-blur">
          <Link
            to="/feed"
            className="flex items-center gap-3 no-underline transition hover:opacity-90"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-400/15 text-xs font-semibold uppercase tracking-[0.3em] text-teal-200">
              GS
            </div>
            <div>
              <p className="text-sm font-semibold tracking-[0.18em] text-slate-100 uppercase">
                {APP_NAME}
              </p>
              <p className="text-xs text-slate-400">
                {APP_TAGLINE}
              </p>
            </div>
          </Link>

          <div className="flex items-center gap-2 text-sm">
            <Link
              to="/moments/demo"
              className="rounded-full border border-white/10 px-3 py-2 text-slate-200 no-underline transition hover:border-amber-300/40 hover:text-white"
            >
              Demo
            </Link>
            <Link
              to="/friends"
              className="rounded-full border border-white/10 px-3 py-2 text-slate-200 no-underline transition hover:border-teal-300/40 hover:text-white"
            >
              Friends
            </Link>
            <Link
              to="/settings"
              className="rounded-full border border-white/10 px-3 py-2 text-slate-200 no-underline transition hover:border-teal-300/40 hover:text-white"
            >
              Settings
            </Link>
          </div>
        </header>

        <main className="flex-1">{children}</main>
      </div>

      <BottomNav />
    </div>
  )
}
