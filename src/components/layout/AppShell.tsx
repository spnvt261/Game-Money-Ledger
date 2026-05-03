import { format } from 'date-fns'
import { vi } from 'date-fns/locale/vi'
import {
  Banknote,
  History,
  LayoutDashboard,
  LogOut,
  PlusCircle,
  Settings,
  ShieldCheck,
  UsersRound,
} from 'lucide-react'
import type { ComponentType } from 'react'
import {
  NavLink,
  Outlet,
  matchPath,
  useLocation,
  useNavigate,
} from 'react-router-dom'

import { NetworkBanner } from '@/components/NetworkBanner'
import { NetworkStatusBadge } from '@/components/NetworkStatusBadge'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/features/auth/useAuth'
import { appConfig } from '@/lib/env'
import { useNetworkStatus } from '@/lib/useNetworkStatus'
import { cn } from '@/lib/utils'

interface NavItem {
  to: string
  label: string
  icon: ComponentType<{ className?: string }>
  exact?: boolean
}

const navItems: NavItem[] = [
  { to: '/dashboard', label: 'Tổng quan', icon: LayoutDashboard },
  { to: '/matches', label: 'Lịch sử', icon: History, exact: true },
  { to: '/matches/new', label: 'Tạo trận', icon: PlusCircle },
  { to: '/players', label: 'Người chơi', icon: UsersRound },
  { to: '/settings', label: 'Cài đặt', icon: Settings },
]

function isNavItemActive(pathname: string, item: NavItem) {
  if (item.exact) {
    return pathname === item.to
  }

  return Boolean(matchPath({ path: `${item.to}/*`, end: false }, pathname))
}

function getPageTitle(pathname: string) {
  if (pathname.startsWith('/matches/new')) return 'Tạo trận mới'
  if (matchPath('/matches/:id', pathname)) return 'Chi tiết trận'

  return (
    navItems.find((item) => isNavItemActive(pathname, item))?.label ??
    'Không tìm thấy'
  )
}

export function AppShell() {
  const location = useLocation()
  const navigate = useNavigate()
  const network = useNetworkStatus()
  const { logout, session } = useAuth()
  const todayLabel = format(new Date(), 'EEEE, dd/MM/yyyy', { locale: vi })
  const expiresAtLabel = session
    ? format(new Date(session.expiresAt), 'dd/MM/yyyy HH:mm')
    : null

  const handleLogout = () => {
    const confirmed = window.confirm('Đăng xuất khỏi phiên quản trị hiện tại?')

    if (!confirmed) {
      return
    }

    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="flex min-h-screen">
        <aside className="hidden w-72 shrink-0 border-r bg-card/95 md:sticky md:top-0 md:flex md:h-screen md:flex-col md:self-start">
          <div className="flex h-20 items-center gap-3 border-b px-6">
            <div className="flex size-11 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
              <Banknote className="size-5" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold">{appConfig.appName}</p>
              <p className="text-xs text-muted-foreground">Sổ tiền nội bộ</p>
            </div>
          </div>

          <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto px-3 py-5">
            {navItems.map((item) => {
              const Icon = item.icon
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    cn(
                      'flex h-11 items-center gap-3 rounded-md px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground',
                      (isActive || isNavItemActive(location.pathname, item)) &&
                        'bg-accent text-accent-foreground',
                    )
                  }
                  end={item.exact}
                >
                  <Icon className="size-4" />
                  <span>{item.label}</span>
                </NavLink>
              )
            })}
          </nav>

          <div className="border-t p-4">
            <div className="rounded-lg border bg-muted/30 p-4">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-medium">Phiên quản trị</span>
                <Badge variant="success">
                  <ShieldCheck />
                  Admin
                </Badge>
              </div>
              <p className="mt-2 text-xs leading-5 text-muted-foreground">
                Token được lưu cục bộ và hết hạn lúc{' '}
                {expiresAtLabel ?? 'không xác định'}.
              </p>
            </div>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 border-b bg-background/90 backdrop-blur">
            <div className="flex min-h-16 flex-col gap-3 px-4 py-3 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:py-0">
              <div className="min-w-0">
                <p className="text-xs capitalize text-muted-foreground">
                  {todayLabel}
                </p>
                <h2 className="mt-1 truncate text-lg font-semibold tracking-normal">
                  {getPageTitle(location.pathname)}
                </h2>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <NetworkStatusBadge
                  status={network.status}
                  latencyMs={network.latencyMs}
                />
                <Badge variant="success">
                  <ShieldCheck />
                  Admin
                </Badge>
                <Button variant="outline" size="sm" onClick={handleLogout}>
                  <LogOut />
                  Đăng xuất
                </Button>
              </div>
            </div>
          </header>

          <NetworkBanner status={network.status} />

          <main className="flex-1 px-4 py-6 pb-24 sm:px-6 lg:px-8 lg:py-8 md:pb-8">
            <div className="mx-auto w-full max-w-7xl">
              <Outlet />
            </div>
          </main>
        </div>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t bg-card/95 px-2 pb-[calc(env(safe-area-inset-bottom)+0.35rem)] pt-2 shadow-lg md:hidden">
        <div className="mx-auto grid max-w-md grid-cols-5 gap-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const active = isNavItemActive(location.pathname, item)

            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={cn(
                  'flex h-14 flex-col items-center justify-center gap-1 rounded-md text-[11px] font-medium text-muted-foreground transition-colors',
                  active && 'bg-accent text-accent-foreground',
                )}
                end={item.exact}
              >
                <Icon className="size-5" />
                <span className="leading-none">{item.label}</span>
              </NavLink>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
