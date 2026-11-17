import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLang } from '../i18n'
import type { DictKey } from '../i18n/dict'
import { createOrder } from '../lib/api'
import { money } from '../lib/products'
import { useShop } from '../store/shop'
import { btn, Empty, input } from '../components/ui'

const PHONE = /^\+?[0-9 ()-]{7,20}$/

export default function Checkout() {
  const { t } = useLang()
  const nav = useNavigate()
  const { cart, total, clear } = useShop()
  const [f, setF] = useState({ name: '', phone: '', city: '', address: '', comment: '' })
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  if (!cart.length) return <Empty text={t('cart.empty')} to="/catalog" cta={t('nav.catalog')} />

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!PHONE.test(f.phone.trim())) { setErr(t('err.phone')); return }
    setBusy(true); setErr('')
    try {
      const r = await createOrder({
        customer: f,
        items: cart.map((l) => ({ product_id: l.product_id, quantity: l.quantity, size: l.size, color: l.color })),
      })
      clear()
      nav(`/order/${r.order_number}`, { state: { fresh: true } })
    } catch (ex) {
      const m = (ex as Error).message
      setErr(m.includes('out_of_stock') || m.includes('product_unavailable') ? t('err.stock')
        : m.includes('invalid_phone') ? t('err.phone') : t('err.generic'))
      setBusy(false)
    }
  }
  const field = (k: keyof typeof f, label: DictKey, req = true) => (
    <label className="block text-sm"><span className="mb-1 block font-medium">{t(label)}</span>
      {k === 'comment'
        ? <textarea className={input} rows={3} maxLength={500} value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} />
        : <input className={input} required={req} maxLength={300} value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} type={k === 'phone' ? 'tel' : 'text'} />}
    </label>
  )
  return (
    <form onSubmit={submit} className="mx-auto max-w-lg space-y-4">
      <h1 className="text-2xl font-bold">{t('checkout.title')}</h1>
      {field('name', 'checkout.name')}{field('phone', 'checkout.phone')}{field('city', 'checkout.city')}
      {field('address', 'checkout.address')}{field('comment', 'checkout.comment', false)}
      <p className="flex justify-between text-lg font-bold"><span>{t('cart.total')}</span><span>{money(total)}</span></p>
      {err && <p className="rounded-lg bg-red-50 p-3 text-sm text-brand-red">{err}</p>}
      <button disabled={busy} className={`${btn} w-full`}>{busy ? t('checkout.sending') : t('checkout.submit')}</button>
    </form>
  )
}
