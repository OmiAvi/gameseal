import { Link, useRouterState } from '@tanstack/react-router'

import { APP_NAME, APP_TAGLINE } from '#/lib/config'

import { BottomNav } from './bottom-nav'

const navItems = [
  { label: 'Feed', to: '/feed' as const },
  { label: 'Mint', to: '/mint' as const },
  { label: 'Friends', to: '/friends' as const },
  { label: 'Settings', to: '/settings' as const },
]

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  })
  const isAuthRoute = pathname === '/sign-in' || pathname === '/sign-up'

  if (isAuthRoute) {
    return <div className="min-h-screen text-[var(--gs-ink)]">{children}</div>
  }

  return (
    <div className="min-h-screen text-[var(--gs-ink)]">
      <div className="gs-shell-frame">
        <header className="gs-shell-topbar">
          <Link to="/feed" className="gs-shell-brand">
            <div className="gs-shell-brandmark">GS</div>
            <div className="min-w-0">
              <p className="truncate text-[11px] font-semibold uppercase tracking-[0.32em] text-[var(--gs-ink-soft)]">
                {APP_NAME}
              </p>
              <p className="truncate text-sm text-[var(--gs-ink)]">{APP_TAGLINE}</p>
            </div>
          </Link>

          <div className="hidden items-center gap-2 md:flex">
            {navItems.map((item) => {
              const isActive = pathname === item.to
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`gs-nav-chip ${isActive ? 'border-[var(--gs-border-strong)] bg-white text-[var(--gs-ink)]' : ''}`}
                >
                  {item.label}
                </Link>
              )
            })}
            <Link to="/moments/demo" className="gs-nav-chip">
              Card Demo
            </Link>
          </div>
        </header>

        <main className="flex-1">{children}</main>
      </div>

      <BottomNav />
    </div>
  )
}
