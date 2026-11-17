import { Link, NavLink, Outlet } from 'react-router-dom'
import { useLang } from '../i18n'
import type { DictKey } from '../i18n/dict'
import { isSupabaseConfigured } from '../lib/supabase'
import { useShop } from '../store/shop'
import LangSwitcher from './LangSwitcher'

const NAV: { to: string; key: DictKey; end?: boolean }[] = [
  { to: '/', key: 'nav.home', end: true },
  { to: '/catalog', key: 'nav.catalog' },
  { to: '/favorites', key: 'nav.favorites' },
  { to: '/cart', key: 'nav.cart' },
  { to: '/track', key: 'nav.track' },
]

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `text-sm font-medium transition-colors ${isActive ? 'text-brand-red' : 'text-brand-black hover:text-brand-red'}`

export default function Layout() {
  const { t } = useLang()
  const { count } = useShop()
  return (
    <div className="flex min-h-screen flex-col pb-16 md:pb-0">
      {!isSupabaseConfigured && (
        <div className="bg-brand-red px-4 py-2 text-center text-sm text-white">{t('setup.missingEnv')}</div>
      )}

      <header className="sticky top-0 z-20 border-b border-neutral-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link to="/" aria-label="LUXCHINA">
            <img src="/logo.png" alt="LUXCHINA" className="h-12 w-auto" />
          </Link>
          <nav className="hidden items-center gap-8 md:flex">
            {NAV.map((n) => (
              <NavLink key={n.to} to={n.to} end={n.end} className={linkClass}>{t(n.key)}{n.to === '/cart' && count > 0 ? ` (${count})` : ''}</NavLink>
            ))}
          </nav>
          <LangSwitcher />
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        <Outlet />
      </main>

      {/* Mobile bottom navigation */}
      <nav className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-5 border-t border-neutral-200 bg-white pb-[env(safe-area-inset-bottom)] md:hidden">
        {NAV.map((n) => (
          <NavLink
            key={n.to}
            to={n.to}
            end={n.end}
            className={({ isActive }) =>
              `py-3 text-center text-xs font-medium ${isActive ? 'text-brand-red' : 'text-neutral-600'}`
            }
          >
            {t(n.key)}{n.to === '/cart' && count > 0 ? ` (${count})` : ''}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
