import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ErrorBox, input, Loading } from '../components/ui'
import { useLang } from '../i18n'
import type { DictKey } from '../i18n/dict'
import { money } from '../lib/products'
import { supabase } from '../lib/supabase'
import { useLoad } from '../lib/useLoad'
import { ORDER_STATUSES, type OrderStatus, type PaymentStatus } from '../types/database'
import { adminOrder, adminOrders } from './db'

const COLORS: Record<OrderStatus, string> = {
  new: 'bg-red-100 text-brand-red', confirmed: 'bg-blue-100 text-blue-800', ordered_from_china: 'bg-purple-100 text-purple-800',
  in_transit: 'bg-amber-100 text-amber-800', arrived: 'bg-teal-100 text-teal-800', delivered: 'bg-green-100 text-green-800', cancelled: 'bg-neutral-200 text-neutral-600',
}
export function StatusBadge({ s }: { s: OrderStatus }) {
  const { t } = useLang()
  return <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${COLORS[s]}`}>{t(`status.${s}` as DictKey)}</span>
}

export function PayBadge({ p }: { p: PaymentStatus }) {
  const { t } = useLang()
  return <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${p === 'paid' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>{p === 'paid' ? t('a.payPaid') : t('a.payPending')}</span>
}

export function Orders() {
  const { t } = useLang()
  const { data, loading, error } = useLoad(adminOrders)
  const [q, setQ] = useState(''); const [st, setSt] = useState('')
  const n = q.trim().toLowerCase()
  const items = (data ?? []).filter((o) => (!st || o.status === st) &&
    (!n || `${o.order_number} ${o.customer_name} ${o.phone}`.toLowerCase().includes(n)))
  return (
    <div>
      <div className="mb-4 grid gap-2 md:grid-cols-[1fr_220px]">
        <input className={input} placeholder={t('a.searchOrders')} value={q} onChange={(e) => setQ(e.target.value)} />
        <select className={input} value={st} onChange={(e) => setSt(e.target.value)}>
          <option value="">{t('a.all')}</option>{ORDER_STATUSES.map((s) => <option key={s} value={s}>{t(`status.${s}` as DictKey)}</option>)}</select>
      </div>
      {loading && <Loading />}{error && <ErrorBox msg={error} />}
      {!loading && !items.length && <p className="py-10 text-center text-neutral-500">{t('a.noOrders')}</p>}
      <ul className="divide-y rounded-2xl bg-white shadow-card">
        {items.map((o) => (
          <li key={o.id}><Link to={`/admin/orders/${o.id}`} className="flex flex-wrap items-center justify-between gap-2 p-3 text-sm hover:bg-brand-gray">
            <span><b>{o.order_number}</b> · {o.customer_name}<br /><span className="text-neutral-500">{[o.phone, o.city].filter(Boolean).join(' · ')} · {new Date(o.created_at).toLocaleDateString('ru-RU')}</span></span>
            <span className="flex items-center gap-3 font-medium">{money(o.total)}<PayBadge p={o.payment_status} /><StatusBadge s={o.status} /></span>
          </Link></li>
        ))}
      </ul>
    </div>
  )
}

export function OrderDetail() {
  const { id } = useParams(); const { t } = useLang()
  const [tick, setTick] = useState(0); const [msg, setMsg] = useState(''); const [err, setErr] = useState('')
  const { data, loading, error } = useLoad(() => adminOrder(id ?? ''), [id, tick])
  if (loading) return <Loading />
  if (error) return <ErrorBox msg={error} />
  if (!data) return <p className="py-10 text-center">{t('common.notFound')}</p>
  const { order: o, items } = data
  const locked = o.status === 'cancelled'
  const change = async (s: OrderStatus) => {
    if (s === o.status) return
    if (s === 'cancelled' && !window.confirm(t('a.confirmCancel'))) return
    setErr(''); setMsg('')
    const { error: e } = await supabase.from('orders').update({ status: s }).eq('id', o.id)
    if (e) setErr(e.message); else { setMsg(t('a.saved')); setTick(tick + 1) }
  }
  const changePay = async (p: PaymentStatus) => {
    if (p === o.payment_status) return
    setErr(''); setMsg('')
    const { error: e } = await supabase.from('orders').update({ payment_status: p }).eq('id', o.id)
    if (e) setErr(e.message); else { setMsg(t('a.saved')); setTick(tick + 1) }
  }
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Link to="/admin/orders" className="text-sm text-neutral-500">← {t('a.back')}</Link>
      <div className="rounded-2xl bg-white p-5 shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-2"><h1 className="text-xl font-extrabold">{o.order_number}</h1><StatusBadge s={o.status} /></div>
        <p className="mt-1 text-xs text-neutral-500">{new Date(o.created_at).toLocaleString('ru-RU')}</p>
        <dl className="mt-4 space-y-1 text-sm">
          <div><dt className="inline font-medium">{t('a.customer')}: </dt><dd className="inline">{o.customer_name}</dd></div>
          <div><dt className="inline font-medium">{t('checkout.phone')}: </dt><dd className="inline"><a className="text-brand-red underline" href={`tel:${o.phone}`}>{o.phone}</a></dd></div>
          {o.city && <div><dt className="inline font-medium">{t('checkout.city')}: </dt><dd className="inline">{o.city}</dd></div>}
          {o.address && <div><dt className="inline font-medium">{t('checkout.address')}: </dt><dd className="inline">{o.address}</dd></div>}
          {o.comment && <div><dt className="inline font-medium">{t('checkout.comment')}: </dt><dd className="inline">{o.comment}</dd></div>}
        </dl>
      </div>
      <div className="rounded-2xl bg-white p-5 shadow-card">
        <h2 className="mb-2 font-bold">{t('a.items')}</h2>
        <ul className="divide-y text-sm">{items.map((i) => (
          <li key={i.id} className="flex justify-between gap-3 py-2"><span>{i.product_name} {[i.size, i.color].filter(Boolean).join(' · ')} × {i.quantity}</span><span>{money(i.unit_price * i.quantity)}</span></li>))}</ul>
        <p className="mt-3 flex justify-between text-lg font-extrabold"><span>{t('cart.total')}</span><span>{money(o.total)}</span></p>
      </div>
      <div className="rounded-2xl bg-white p-5 shadow-card">
        <label className="mb-2 block text-sm font-medium">{t('track.status')}</label>
        <select className={input} value={o.status} disabled={locked} onChange={(e) => change(e.target.value as OrderStatus)}>
          {ORDER_STATUSES.map((s) => <option key={s} value={s}>{t(`status.${s}` as DictKey)}</option>)}</select>
        {locked && <p className="mt-2 text-xs text-neutral-500">{t('a.cancelLocked')}</p>}
      </div>
      <div className="rounded-2xl bg-white p-5 shadow-card">
        <label className="mb-2 block text-sm font-medium">{t('a.payment')}</label>
        <select className={input} value={o.payment_status} disabled={locked} onChange={(e) => changePay(e.target.value as PaymentStatus)}>
          <option value="pending">{t('a.payPending')}</option><option value="paid">{t('a.payPaid')}</option></select>
        {msg && <p className="mt-2 text-sm text-green-700">{msg}</p>}{err && <p className="mt-2 text-sm text-brand-red">{err}</p>}
      </div>
    </div>
  )
}
