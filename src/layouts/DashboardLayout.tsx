import { Suspense, useState } from 'react'
import { Navigate, NavLink, Outlet, useLocation } from 'react-router-dom'
import {
  Activity,
  Bot,
  ClipboardCheck,
  FlaskConical,
  LayoutDashboard,
  LineChart,
  LogOut,
  Menu,
  Moon,
  Pill,
  Salad,
  Scale,
  Settings,
  UserRound,
  X,
} from 'lucide-react'
import { useAuthStore } from '../stores/authStore'

const navGroups = [
  {
    label: null,
    items: [
      { to: '/', label: 'Dashboard', icon: LayoutDashboard },
      { to: '/progress', label: 'Daily progress', icon: ClipboardCheck },
    ],
  },
  {
    label: 'Track',
    items: [
      { to: '/body-composition', label: 'Body composition', icon: Scale },
      { to: '/lab-reports', label: 'Lab reports', icon: FlaskConical },
      { to: '/sleep', label: 'Sleep & mood', icon: Moon },
      { to: '/exercise', label: 'Exercise', icon: Activity },
      { to: '/journey-trackers', label: 'Journey trackers', icon: LineChart },
    ],
  },
  {
    label: 'Plan',
    items: [
      { to: '/nutrition', label: 'Nutrition', icon: Salad },
      { to: '/inventory', label: 'Medicine cabinet', icon: Pill },
      { to: '/ai/chat', label: 'AI assistant', icon: Bot, matchPrefix: '/ai' },
    ],
  },
  {
    label: 'Account',
    items: [
      { to: '/profile', label: 'Profile & history', icon: UserRound },
      { to: '/settings', label: 'Settings', icon: Settings },
    ],
  },
]

export default function DashboardLayout() {
  const accessToken = useAuthStore((s) => s.accessToken)
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)

  if (!accessToken) {
    return <Navigate to="/login" replace />
  }

  return (
    <div className="flex min-h-screen">
      {menuOpen && <div className="fixed inset-0 z-30 bg-black/30 md:hidden" onClick={() => setMenuOpen(false)} />}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-60 flex-col border-r border-border bg-card p-4 transition-transform md:sticky md:top-0 md:h-screen md:translate-x-0 ${
          menuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="mb-6 flex items-center justify-between px-2">
          <span className="text-lg font-semibold text-foreground">Longevity</span>
          <button className="md:hidden" onClick={() => setMenuOpen(false)} aria-label="Close menu">
            <X size={18} />
          </button>
        </div>
        <nav className="flex flex-1 flex-col gap-4 overflow-y-auto">
          {navGroups.map((group, idx) => (
            <div key={group.label ?? idx} className="flex flex-col gap-1">
              {group.label && <div className="px-3 pb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{group.label}</div>}
              {group.items.map(({ to, label, icon: Icon, ...rest }) => {
                const prefix = 'matchPrefix' in rest ? rest.matchPrefix : undefined
                return (
                  <NavLink
                    key={to}
                    to={to}
                    end={to === '/'}
                    onClick={() => setMenuOpen(false)}
                    className={({ isActive }) => {
                      const active = isActive || (prefix != null && location.pathname.startsWith(prefix))
                      return `flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                        active ? 'bg-primary text-primary-foreground' : 'text-foreground hover:bg-accent'
                      }`
                    }}
                  >
                    <Icon size={16} />
                    {label}
                  </NavLink>
                )
              })}
            </div>
          ))}
        </nav>
        <div className="border-t border-border pt-3">
          <div className="px-2 pb-2 text-xs text-muted-foreground">{user?.name}</div>
          <button
            onClick={logout}
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-accent"
          >
            <LogOut size={16} />
            Log out
          </button>
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-border bg-card px-4 py-3 md:hidden">
          <button onClick={() => setMenuOpen(true)} aria-label="Open menu">
            <Menu size={20} />
          </button>
          <span className="font-semibold text-foreground">Longevity</span>
        </header>
        <main className="flex-1 overflow-y-auto bg-background p-4 md:p-6">
          <div className="mx-auto max-w-6xl">
            <Suspense fallback={<p className="text-sm text-muted-foreground">Loading…</p>}>
              <Outlet />
            </Suspense>
          </div>
        </main>
      </div>
    </div>
  )
}
