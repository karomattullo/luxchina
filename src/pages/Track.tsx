import { useEffect, useState, type FormEvent } from 'react'
import { useLocation, useParams } from 'react-router-dom'
import { useLang } from '../i18n'
import type { DictKey } from '../i18n/dict'
import { trackOrder } from '../lib/api'
import { money } from '../lib/products'
import { btn, input } from '../components/ui'
import type { TrackedOrder } from '../types/database'

export default function Track() {
  const { orderNumber } = useParams()
  const st = useLocation().state as { fresh?: boolean; wa?: string } | null
  const fresh = st?.fresh
  const wa = st?.wa
  const { t } = useLang()
  const [num, setNum] = useState(orderNumber ?? '')
  const [phone, setPhone] = useState('')
  const [res, setRes] = useState<TrackedOrder | null>(null)
  const [msg, setMsg] = useState('')

  // Right after a saved order: open WhatsApp once (the visible button below is the fallback).
  useEffect(() => {
    if (!fresh || !wa || !orderNumber) return
    const k = `luxchina.wa.${orderNumber}`
    try { if (sessionStorage.getItem(k)) return } catch { /* ignore */ }
    const id = window.setTimeout(() => {
      try { sessionStorage.setItem(k, '1') } catch { /* ignore */ }
      window.location.href = wa
    }, 1200)
    return () => window.clearTimeout(id)
  }, [fresh, wa, orderNumber])

  const submit = async (e: FormEvent) => {
    e.preventDefault(); setMsg(''); setRes(null)
    try {
      const r = await trackOrder(num, phone)
      if (r) setRes(r); else setMsg(t('track.notFound'))
    } catch { setMsg(t('err.generic')) }
  }
  return (
    <div className="mx-auto max-w-lg">
      {fresh && orderNumber && (
        <div className="mb-6 rounded-xl bg-brand-gray p-5 text-center">
          <p className="text-sm text-neutral-600">{t('order.number')}</p>
          <p className="text-3xl font-bold text-brand-red">{orderNumber}</p>
          <p className="mt-2 text-sm">{t('order.thanks')}</p>
          <p className="mt-2 text-sm">{t('order.payNote')}</p>
          {wa && <a href={wa} className={`${btn} mt-4`}>{t('order.openWa')}</a>}
        </div>
      )}
      <h1 className="text-2xl font-bold">{t('track.title')}</h1>
      <form onSubmit={submit} className="mt-4 space-y-3">
        <input className={input} required value={num} onChange={(e) => setNum(e.target.value)} placeholder={t('order.number')} />
        <input className={input} required type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder={t('checkout.phone')} />
        <button className={`${btn} w-full`}>{t('track.find')}</button>
      </form>
      {msg && <p className="mt-4 text-sm text-brand-red">{msg}</p>}
      {res && (
        <div className="mt-6 rounded-xl border border-neutral-200 p-5 text-sm">
          <p className="font-bold">{res.order_number}</p>
          <p className="mt-1">{t('track.status')}: <span className="font-semibold text-brand-red">{t(`status.${res.status}` as DictKey)}</span></p>
          <ul className="mt-3 divide-y">{res.items.map((i, k) => (
            <li key={k} className="flex justify-between py-2"><span>{i.name} {[i.size, i.color].filter(Boolean).join(' · ')} × {i.quantity}</span><span>{money(i.unit_price * i.quantity)}</span></li>
          ))}</ul>
          <p className="mt-3 flex justify-between font-bold"><span>{t('cart.total')}</span><span>{money(res.total)}</span></p>
        </div>
      )}
    </div>
  )
}
