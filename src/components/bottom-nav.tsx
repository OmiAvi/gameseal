import { Link, useRouterState } from '@tanstack/react-router'
import { Camera, LayoutGrid, Trophy } from 'lucide-react'

export function BottomNav() {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  })

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-30 mx-auto w-full max-w-md px-4 pb-4 md:hidden"
    >
      <div className="grid grid-cols-3 gap-2 rounded-[1.6rem] border border-[var(--gs-border)] bg-[rgba(255,252,246,0.92)] p-2 shadow-[0_22px_50px_rgba(21,24,33,0.16)] backdrop-blur-xl">
        <BottomNavLink
          icon={LayoutGrid}
          isActive={pathname === '/feed'}
          label="Feed"
          to="/feed"
        />
        <BottomNavLink
          icon={Camera}
          isActive={pathname === '/mint'}
          isMint
          label="Mint"
          to="/mint"
        />
        <BottomNavLink
          icon={Trophy}
          isActive={pathname.startsWith('/vault/')}
          label="Vault"
          params={{ username: 'gameseal' }}
          to="/vault/$username"
        />
      </div>
    </nav>
  )
}

function BottomNavLink({
  icon: Icon,
  isActive,
  isMint = false,
  label,
  params,
  to,
}: {
  icon: typeof LayoutGrid
  isActive: boolean
  isMint?: boolean
  label: string
  params?: { username: string }
  to: '/feed' | '/mint' | '/vault/$username'
}) {
  const className = `flex min-h-[4.35rem] flex-col items-center justify-center rounded-[1.2rem] border text-xs font-medium transition ${
    isMint
      ? 'border-[rgba(207,177,118,0.26)] bg-[linear-gradient(180deg,#e3c990,#cfb176)] text-[#231a11] shadow-[0_14px_24px_rgba(207,177,118,0.22)]'
      : isActive
        ? 'border-[var(--gs-border-strong)] bg-white text-[var(--gs-ink)]'
        : 'border-transparent bg-transparent text-[var(--gs-ink-soft)]'
  }`

  const content = (
    <>
      <Icon className={`mb-1 ${isMint ? 'h-5 w-5' : 'h-[18px] w-[18px]'}`} />
      <span className={isMint ? 'uppercase tracking-[0.2em]' : ''}>{label}</span>
    </>
  )

  if (to === '/vault/$username') {
    return (
      <Link className={className} params={params!} to={to}>
        {content}
      </Link>
    )
  }

  return (
    <Link className={className} to={to}>
      {content}
    </Link>
  )
}
