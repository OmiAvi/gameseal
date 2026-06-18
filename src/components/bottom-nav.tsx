import { Link, useRouterState } from '@tanstack/react-router'
import { Camera, LayoutGrid, Trophy } from 'lucide-react'

export function BottomNav() {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  })

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-30 mx-auto w-full max-w-md px-4 pb-4"
    >
      <div className="grid grid-cols-3 gap-2 rounded-[2rem] border border-white/10 bg-slate-950/85 p-2 shadow-[0_25px_80px_rgba(2,6,12,0.55)] backdrop-blur-xl">
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
  const className = `flex min-h-16 flex-col items-center justify-center rounded-[1.4rem] no-underline transition ${
    isMint
      ? 'bg-amber-400 text-slate-950 shadow-[0_12px_30px_rgba(251,191,36,0.35)] hover:bg-amber-300'
      : isActive
        ? 'bg-teal-400/18 text-teal-100'
        : 'text-slate-400 hover:bg-white/5 hover:text-slate-100'
  }`

  if (to === '/vault/$username') {
    return (
      <Link className={className} params={params!} to={to}>
        <Icon className={`mb-1 ${isMint ? 'h-5 w-5' : 'h-[18px] w-[18px]'}`} />
        <span className={`text-xs font-medium ${isMint ? 'tracking-[0.2em] uppercase' : ''}`}>
          {label}
        </span>
      </Link>
    )
  }

  return (
    <Link className={className} to={to}>
      <Icon className={`mb-1 ${isMint ? 'h-5 w-5' : 'h-[18px] w-[18px]'}`} />
      <span className={`text-xs font-medium ${isMint ? 'tracking-[0.2em] uppercase' : ''}`}>
        {label}
      </span>
    </Link>
  )
}
