import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLang } from '../i18n'
import type { DictKey } from '../i18n/dict'
import { placeOrder } from '../lib/placeOrder'
import { money } from '../lib/products'
import { useShop } from '../store/shop'
import { btn, Empty, input } from '../components/ui'

const PHONE = /^\+?[0-9 ()-]{7,20}$/

export default function Checkout() {
  const { t, pick } = useLang()
  const nav = useNavigate()
  const { cart, total, clear } = useShop()
  const [f, setF] = useState({ name: '', phone: '', city: '', address: '', comment: '' })
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  if (!cart.length) return <Empty text={t('cart.empty')} to="/catalog" cta={t('nav.catalog')} />

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (busy) return
    if (!PHONE.test(f.phone.trim())) { setErr(t('err.phone')); return }
    setBusy(true); setErr('')
    try {
      const r = await placeOrder(f, cart) // saves to Supabase first; throws on any failure
      clear()
      nav(`/order/${r.orderNumber}`, { state: { fresh: true, wa: r.waUrl }, replace: true })
    } catch (ex) {
      const m = (ex as Error).message
      setErr(m.includes('out_of_stock') || m.includes('product_unavailable') ? t('err.stock')
        : m.includes('invalid_phone') ? t('err.phone') : t('err.generic'))
      setBusy(false) // WhatsApp is NOT opened
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
    <form onSubmit={submit} className="mx-auto max-w-lg animate-fade-up space-y-4 rounded-3xl bg-white p-5 shadow-card md:p-8">
      <h1 className="text-2xl font-extrabold md:text-3xl">{t('checkout.title')}</h1>
      {field('name', 'checkout.name')}{field('phone', 'checkout.phoneWa')}
      {field('address', 'checkout.addressOpt', false)}{field('comment', 'checkout.comment', false)}

      <section className="rounded-xl bg-brand-gray p-4">
        <h2 className="mb-2 font-bold">{t('checkout.review')}</h2>
        <ul className="divide-y divide-neutral-200 text-sm">
          {cart.map((l) => (
            <li key={l.key} className="flex justify-between gap-3 py-2">
              <span>{pick(l, 'name')}{[l.size, l.color].filter(Boolean).length > 0 && <span className="text-neutral-500"> · {[l.size, l.color].filter(Boolean).join(' · ')}</span>}
                <span className="block text-xs text-neutral-500">{l.quantity} × {money(l.unit_price)} ({t('checkout.each')})</span></span>
              <span className="font-semibold">{money(l.quantity * l.unit_price)}</span>
            </li>
          ))}
        </ul>
        <p className="mt-3 flex justify-between text-lg font-extrabold"><span>{t('cart.total')}</span><span>{money(total)}</span></p>
      </section>

      <p className="text-xs text-neutral-500">{t('checkout.waNote')}</p>
      {err && <p className="rounded-xl bg-red-50 p-3 text-sm text-brand-red">{err}</p>}
      <button disabled={busy} className={`${btn} w-full`}>{busy ? t('checkout.sending') : t('checkout.confirm')}</button>
    </form>
  )
}
