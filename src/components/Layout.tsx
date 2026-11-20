import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { useLang } from '../i18n'
import type { DictKey } from '../i18n/dict'
import { fetchCategories } from '../lib/products'
import { isSupabaseConfigured } from '../lib/supabase'
import { useLoad } from '../lib/useLoad'
import { WA_NUMBER } from '../lib/whatsapp'
import { useShop } from '../store/shop'
import { IconCart, IconGrid, IconHeart, IconHome, IconSearch, IconUser } from './Icons'
import LangSwitcher from './LangSwitcher'

function Badge({ n }: { n: number }) {
  if (n <= 0) return null
  return <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-brand-red px-1 text-[10px] font-bold text-white">{n > 99 ? '99+' : n}</span>
}
function IconLink({ to, label, count = 0, children }: { to: string; label: string; count?: number; children: ReactNode }) {
  return <Link to={to} aria-label={label} className="relative rounded-full p-2 transition hover:bg-brand-gray">{children}<Badge n={count} /></Link>
}

const BOTTOM: { to: string; key: DictKey; end?: boolean; icon: ReactNode; badge?: 'cart' | 'fav' }[] = [
  { to: '/', key: 'nav.home', end: true, icon: <IconHome className="h-6 w-6" /> },
  { to: '/catalog', key: 'nav.catalog', icon: <IconGrid className="h-6 w-6" /> },
  { to: '/favorites', key: 'nav.favorites', icon: <IconHeart className="h-6 w-6" />, badge: 'fav' },
  { to: '/cart', key: 'nav.cart', icon: <IconCart className="h-6 w-6" />, badge: 'cart' },
  { to: '/track', key: 'nav.track', icon: <IconUser className="h-6 w-6" /> },
]

export default function Layout() {
  const { t, pick } = useLang()
  const { count, favs } = useShop()
  const nav = useNavigate()
  const { pathname } = useLocation()
  const [sp] = useSearchParams()
  const [q, setQ] = useState(sp.get('q') ?? '')
  const cats = useLoad(fetchCategories)
  const activeCat = pathname === '/catalog' ? sp.get('cat') ?? '' : null
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  useEffect(() => { setQ(sp.get('q') ?? '') }, [sp])

  const submit = (e: FormEvent) => { e.preventDefault(); nav(`/catalog?q=${encodeURIComponent(q.trim())}`) }
  const search = (
    <form onSubmit={submit} className="relative w-full" role="search">
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('nav.search')} enterKeyHint="search"
        className="w-full rounded-full border border-transparent bg-brand-gray py-2.5 pl-11 pr-4 text-sm outline-none transition focus:border-brand-black focus:bg-white" />
      <IconSearch className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-400" />
    </form>
  )
  const chip = (on: boolean) => `shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition ${on ? 'bg-brand-red text-white' : 'bg-brand-gray text-brand-black hover:bg-neutral-200'}`

  return (
    <div className="flex min-h-screen flex-col bg-white pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-0">
      {!isSupabaseConfigured && <div className="bg-brand-red px-4 py-2 text-center text-sm text-white">{t('setup.missingEnv')}</div>}

      <div className="bg-brand-black text-xs text-neutral-300">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-1.5">
          <span className="truncate">{t('brand.tagline')}</span>
          <a href={`https://wa.me/${WA_NUMBER}`} target="_blank" rel="noreferrer" className="hidden hover:text-white sm:block">WhatsApp +{WA_NUMBER}</a>
        </div>
      </div>

      <header className="sticky top-0 z-30 border-b border-neutral-100 bg-white/95 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex h-16 items-center gap-3 md:h-20 md:gap-6">
            <Link to="/" aria-label="LUXCHINA" className="shrink-0"><img src="/logo.png" alt="LUXCHINA" className="h-12 w-auto md:h-16" /></Link>
            <div className="mx-auto hidden max-w-2xl flex-1 md:block">{search}</div>
            <div className="ml-auto flex items-center gap-1">
              <IconLink to="/favorites" label={t('nav.favorites')} count={favs.length}><IconHeart className="h-6 w-6" /></IconLink>
              <IconLink to="/cart" label={t('nav.cart')} count={count}><IconCart className="h-6 w-6" /></IconLink>
              <span className="hidden md:block"><IconLink to="/track" label={t('nav.track')}><IconUser className="h-6 w-6" /></IconLink></span>
              <span className="ml-1"><LangSwitcher /></span>
            </div>
          </div>
          <div className="pb-3 md:hidden">{search}</div>
          <nav className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-3" aria-label="categories">
            <Link to="/catalog" className={chip(activeCat === '')}>{t('home.seeAll')}</Link>
            {cats.data?.map((c) => <Link key={c.id} to={`/catalog?cat=${c.slug}`} className={chip(activeCat === c.slug)}>{pick(c, 'name')}</Link>)}
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-5 md:py-8"><Outlet /></main>

      <footer className="bg-brand-black text-neutral-300">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 md:grid-cols-3">
          <div>
            <span className="inline-block rounded-2xl bg-white p-2"><img src="/logo.png" alt="LUXCHINA" className="h-16 w-auto" /></span>
            <p className="mt-3 text-sm">{t('brand.tagline')}</p>
          </div>
          <div>
            <h4 className="mb-3 text-sm font-bold text-white">{t('footer.contacts')}</h4>
            <ul className="space-y-2 text-sm">
              <li><a className="hover:text-white" href={`https://wa.me/${WA_NUMBER}`} target="_blank" rel="noreferrer">WhatsApp: +{WA_NUMBER}</a></li>
              <li><a className="hover:text-white" href="https://instagram.com/luxchina.tj" target="_blank" rel="noreferrer">Instagram: @luxchina.tj</a></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-3 text-sm font-bold text-white">{t('footer.pages')}</h4>
            <ul className="space-y-2 text-sm">
              {BOTTOM.map((b) => <li key={b.to}><NavLink to={b.to} end={b.end} className="hover:text-white">{t(b.key)}</NavLink></li>)}
            </ul>
          </div>
        </div>
        <p className="border-t border-white/10 py-4 text-center text-xs text-neutral-500">{t('footer.rights')}</p>
      </footer>

      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-neutral-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
        {BOTTOM.map((b) => (
          <NavLink key={b.to} to={b.to} end={b.end}
            className={({ isActive }) => `flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium transition ${isActive ? 'text-brand-red' : 'text-neutral-500'}`}>
            <span className="relative">{b.icon}<Badge n={b.badge === 'cart' ? count : b.badge === 'fav' ? favs.length : 0} /></span>
            <span className="max-w-full truncate px-1">{t(b.key)}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
