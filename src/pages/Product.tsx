import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useLang } from '../i18n'
import { fetchProduct, finalPrice, isAvailable, money } from '../lib/products'
import { useLoad } from '../lib/useLoad'
import { useShop } from '../store/shop'
import { btn, btnDark, Empty, ErrorBox, Loading } from '../components/ui'

const chip = (on: boolean) => `rounded-full border px-4 py-1.5 text-sm ${on ? 'border-brand-black bg-brand-black text-white' : 'border-neutral-300 hover:border-brand-black'}`

export default function ProductPage() {
  const { id } = useParams()
  const nav = useNavigate()
  const { t, pick } = useLang()
  const { add, favs, toggleFav } = useShop()
  const { data: p, loading, error } = useLoad(() => fetchProduct(id ?? ''), [id])
  const [img, setImg] = useState(0)
  const [size, setSize] = useState<string | null>(null)
  const [color, setColor] = useState<string | null>(null)
  const [qty, setQty] = useState(1)
  const [msg, setMsg] = useState('')

  if (loading) return <Loading />
  if (error) return <ErrorBox msg={error} />
  if (!p) return <Empty text={t('common.notFound')} to="/catalog" cta={t('nav.catalog')} />

  const ok = isAvailable(p)
  const max = p.product_type === 'in_stock' ? Math.max(1, p.stock_quantity) : 99
  const sale = p.discount_price !== null
  const submit = (): boolean => {
    if ((p.sizes.length && !size) || (p.colors.length && !color)) { setMsg(t('product.select')); return false }
    add({ product_id: p.id, name_tj: p.name_tj, name_ru: p.name_ru, image: p.images[0] ?? null, unit_price: finalPrice(p), size, color, quantity: qty })
    return true
  }
  const avail = p.product_type === 'by_order' ? t('availability.by_order') : ok ? t('availability.in_stock') : t('availability.out')

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <div>
        <div className="aspect-square overflow-hidden rounded-2xl bg-brand-gray">
          {p.images[img] && <img src={p.images[img]} alt={pick(p, 'name')} className="h-full w-full object-cover" />}
        </div>
        {p.images.length > 1 && (
          <div className="mt-3 flex gap-2 overflow-x-auto">
            {p.images.map((u, i) => (
              <button key={u} type="button" onClick={() => setImg(i)} className={`h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 ${i === img ? 'border-brand-red' : 'border-transparent'}`}>
                <img src={u} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>
      <div>
        <h1 className="text-2xl font-bold">{pick(p, 'name')}</h1>
        <p className="mt-2 text-xl">
          <span className="font-bold">{money(finalPrice(p))}</span>
          {sale && <span className="ml-3 text-base text-neutral-400 line-through">{money(p.price)}</span>}
        </p>
        <p className="mt-1 text-sm text-neutral-500">{avail}</p>
        <p className="mt-4 whitespace-pre-line text-sm text-neutral-700">{pick(p, 'description')}</p>

        {p.sizes.length > 0 && (
          <div className="mt-6"><p className="mb-2 text-sm font-semibold">{t('product.size')}</p>
            <div className="flex flex-wrap gap-2">{p.sizes.map((s) => <button key={s} type="button" className={chip(size === s)} onClick={() => setSize(s)}>{s}</button>)}</div></div>
        )}
        {p.colors.length > 0 && (
          <div className="mt-4"><p className="mb-2 text-sm font-semibold">{t('product.color')}</p>
            <div className="flex flex-wrap gap-2">{p.colors.map((c) => <button key={c} type="button" className={chip(color === c)} onClick={() => setColor(c)}>{c}</button>)}</div></div>
        )}

        {ok && (
          <div className="mt-4 flex items-center gap-3">
            <span className="text-sm font-semibold">{t('product.qty')}</span>
            <button type="button" className={chip(false)} onClick={() => setQty(Math.max(1, qty - 1))}>−</button>
            <span className="w-6 text-center">{qty}</span>
            <button type="button" className={chip(false)} onClick={() => setQty(Math.min(max, qty + 1))}>+</button>
          </div>
        )}

        {msg && <p className="mt-4 text-sm text-brand-red">{msg}</p>}
        <div className="mt-6 flex flex-wrap gap-3">
          <button type="button" disabled={!ok} className={btn} onClick={() => { if (submit()) setMsg(t('product.added')) }}>{t('product.addToCart')}</button>
          <button type="button" disabled={!ok} className={btnDark} onClick={() => { if (submit()) nav('/checkout') }}>{t('product.buyNow')}</button>
          <button type="button" className={chip(favs.includes(p.id))} onClick={() => toggleFav(p.id)}>{favs.includes(p.id) ? '♥' : '♡'} {t('nav.favorites')}</button>
        </div>
      </div>
    </div>
  )
}
