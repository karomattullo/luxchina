import { createContext, useContext, useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { Link, Navigate, NavLink, Route, Routes } from 'react-router-dom'
import LangSwitcher from '../components/LangSwitcher'
import { btn, ErrorBox, input, Loading } from '../components/ui'
import { useLang } from '../i18n'
import type { DictKey } from '../i18n/dict'
import { getAdminStats } from '../lib/api'
import { money } from '../lib/products'
import { supabase } from '../lib/supabase'
import { useLoad } from '../lib/useLoad'
import CategoriesAdmin from './CategoriesAdmin'
import { adminOrders, adminProducts } from './db'
import { OrderDetail, Orders, StatusBadge } from './OrdersAdmin'
import { ProductForm, Products } from './ProductsAdmin'

interface Auth { ready: boolean; isAdmin: boolean; login: (e: string, p: string) => Promise<boolean>; logout: () => Promise<void> }
const Ctx = createContext<Auth | null>(null)

async function checkAdmin(): Promise<boolean> {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return false
  const { data } = await supabase.from('profiles').select('role').eq('id', session.user.id).maybeSingle()
  return data?.role === 'admin' // real protection is RLS in the database; this only decides what to show
}

function AuthProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false)
  const [isAdmin, setAdmin] = useState(false)
  useEffect(() => { checkAdmin().then(setAdmin).catch(() => setAdmin(false)).finally(() => setReady(true)) }, [])
  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return false
    const ok = await checkAdmin()
    if (!ok) await supabase.auth.signOut()
    setAdmin(ok); return ok
  }
  const logout = async () => { await supabase.auth.signOut(); setAdmin(false) }
  return <Ctx.Provider value={{ ready, isAdmin, login, logout }}>{children}</Ctx.Provider>
}
const useAuth = () => { const c = useContext(Ctx); if (!c) throw new Error('no auth'); return c }

function Login() {
  const { t } = useLang()
  const { login } = useAuth()
  const [email, setEmail] = useState(''); const [pw, setPw] = useState('')
  const [err, setErr] = useState(false); const [busy, setBusy] = useState(false)
  const submit = async (e: FormEvent) => { e.preventDefault(); setBusy(true); setErr(!(await login(email.trim(), pw))); setBusy(false) }
  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4">
      <form onSubmit={submit} className="w-full max-w-sm space-y-4 rounded-2xl bg-white p-6 shadow">
        <img src="/logo.png" alt="LUXCHINA" className="mx-auto h-24" />
        <h1 className="text-center text-lg font-bold">{t('admin.login')}</h1>
        <input className={input} type="email" required autoComplete="username" placeholder={t('a.email')} value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className={input} type="password" required autoComplete="current-password" placeholder={t('a.password')} value={pw} onChange={(e) => setPw(e.target.value)} />
        {err && <p className="text-sm text-brand-red">{t('a.loginFail')}</p>}
        <button disabled={busy} className={`${btn} w-full`}>{t('admin.login')}</button>
        <div className="text-center"><LangSwitcher /></div>
      </form>
    </div>
  )
}

const NAV: { to: string; key: DictKey; end?: boolean }[] = [
  { to: '/admin', key: 'a.dashboard', end: true }, { to: '/admin/products', key: 'a.products' },
  { to: '/admin/orders', key: 'a.orders' }, { to: '/admin/categories', key: 'a.categories' },
]

function Shell({ children }: { children: ReactNode }) {
  const { t } = useLang(); const { logout } = useAuth()
  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-2">
          <Link to="/admin"><img src="/logo.png" alt="LUXCHINA" className="h-10" /></Link>
          <nav className="flex flex-1 gap-4 overflow-x-auto text-sm font-medium">
            {NAV.map((n) => <NavLink key={n.to} to={n.to} end={n.end} className={({ isActive }) => `whitespace-nowrap py-2 ${isActive ? 'text-brand-red' : ''}`}>{t(n.key)}</NavLink>)}
          </nav>
          <LangSwitcher />
          <Link to="/" className="hidden text-sm text-neutral-500 sm:block">{t('a.store')}</Link>
          <button type="button" onClick={logout} className="text-sm text-brand-red">{t('a.logout')}</button>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return <div className="rounded-xl bg-white p-4 shadow-sm"><p className="text-xs text-neutral-500">{label}</p><p className="mt-1 text-2xl font-bold">{value}</p></div>
}

function Dashboard() {
  const { t } = useLang()
  const stats = useLoad(getAdminStats); const prods = useLoad(adminProducts); const orders = useLoad(adminOrders)
  if (stats.error) return <ErrorBox msg={stats.error} />
  if (!stats.data) return <Loading />
  const s = stats.data
  const tracked = (prods.data ?? []).filter((p) => p.product_type === 'in_stock')
  return (
    <div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        <Stat label={t('a.statProducts')} value={s.total_products} /><Stat label={t('a.statOrders')} value={s.total_orders} />
        <Stat label={t('a.statNew')} value={s.new_orders} /><Stat label={t('a.statDone')} value={s.completed_orders} />
        <Stat label={t('a.statRevenue')} value={money(s.total_sales)} />
        <Stat label={t('a.statStock')} value={tracked.reduce((n, p) => n + p.stock_quantity, 0)} />
        <Stat label={t('a.statOut')} value={tracked.filter((p) => p.stock_quantity === 0).length} />
      </div>
      <h2 className="mb-3 mt-8 text-lg font-bold">{t('a.recent')}</h2>
      <ul className="divide-y rounded-xl bg-white shadow-sm">
        {(orders.data ?? []).slice(0, 5).map((o) => (
          <li key={o.id}><Link to={`/admin/orders/${o.id}`} className="flex items-center justify-between gap-2 p-3 text-sm hover:bg-neutral-50">
            <span><b>{o.order_number}</b> · {o.customer_name}</span><span className="flex items-center gap-3">{money(o.total)}<StatusBadge s={o.status} /></span>
          </Link></li>
        ))}
      </ul>
    </div>
  )
}

export default function AdminApp() {
  return <AuthProvider><Gate /></AuthProvider>
}
function Gate() {
  const { ready, isAdmin } = useAuth()
  if (!ready) return <Loading />
  if (!isAdmin) return <Login />
  return (
    <Shell>
      <Routes>
        <Route index element={<Dashboard />} />
        <Route path="products" element={<Products />} />
        <Route path="products/new" element={<ProductForm />} />
        <Route path="products/:id" element={<ProductForm />} />
        <Route path="categories" element={<CategoriesAdmin />} />
        <Route path="orders" element={<Orders />} />
        <Route path="orders/:id" element={<OrderDetail />} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    </Shell>
  )
}
