import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { IconHeart } from '../components/Icons'
import { btn, btnDark, Empty, ErrorBox, Loading } from '../components/ui'
import { useLang } from '../i18n'
import { fetchProduct, finalPrice, isAvailable, money } from '../lib/products'
import { useLoad } from '../lib/useLoad'
import { useShop } from '../store/shop'

const chip = (on: boolean) => `rounded-xl border px-4 py-2 text-sm font-medium transition ${on ? 'border-brand-black bg-brand-black text-white' : 'border-neutral-300 bg-white hover:border-brand-black'}`

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
  const fav = favs.includes(p.id)
  const submit = (): boolean => {
    if ((p.sizes.length && !size) || (p.colors.length && !color)) { setMsg(t('product.select')); return false }
    add({ product_id: p.id, name_tj: p.name_tj, name_ru: p.name_ru, image: p.images[0] ?? null, unit_price: finalPrice(p), size, color, quantity: qty })
    return true
  }
  const avail = p.product_type === 'by_order' ? t('availability.by_order') : ok ? t('availability.in_stock') : t('availability.out')
  const addToCart = () => { if (submit()) setMsg(t('product.added')) }
  const buyNow = () => { if (submit()) nav('/checkout') }

  return (
    <div className="pb-24 md:pb-0">
      <nav className="mb-4 text-xs text-neutral-500"><Link to="/" className="hover:text-brand-red">{t('nav.home')}</Link> › <Link to="/catalog" className="hover:text-brand-red">{t('nav.catalog')}</Link></nav>
      <div className="grid gap-6 md:grid-cols-2 md:gap-12">
        <div>
          <div className="relative aspect-square overflow-hidden rounded-3xl bg-brand-gray shadow-card">
            {p.images[img] && <img src={p.images[img]} alt={pick(p, 'name')} className="h-full w-full cursor-pointer object-cover" onClick={() => setImg((img + 1) % p.images.length)} />}
            {p.images.length > 1 && <span className="absolute bottom-3 right-3 rounded-full bg-black/60 px-2.5 py-1 text-xs font-medium text-white">{img + 1} / {p.images.length}</span>}
          </div>
          {p.images.length > 1 && (
            <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto">
              {p.images.map((u, i) => (
                <button key={u} type="button" onClick={() => setImg(i)} className={`h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 transition ${i === img ? 'border-brand-red' : 'border-transparent opacity-70'}`}>
                  <img src={u} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <h1 className="text-2xl font-extrabold leading-tight md:text-3xl">{pick(p, 'name')}</h1>
          <p className="mt-3 flex flex-wrap items-baseline gap-x-3">
            <span className={`text-3xl font-extrabold ${sale ? 'text-brand-red' : ''}`}>{money(finalPrice(p))}</span>
            {sale && <span className="text-lg text-neutral-400 line-through">{money(p.price)}</span>}
          </p>
          <p className="mt-2 inline-flex items-center gap-2 rounded-full bg-brand-gray px-3 py-1 text-xs font-medium">
            <span className={`h-2 w-2 rounded-full ${!ok ? 'bg-neutral-400' : p.product_type === 'in_stock' ? 'bg-green-500' : 'bg-amber-500'}`} />{avail}
          </p>
          {p.sizes.length > 0 && (
            <div className="mt-6"><p className="mb-2 text-sm font-bold">{t('product.size')}</p>
              <div className="flex flex-wrap gap-2">{p.sizes.map((s) => <button key={s} type="button" className={chip(size === s)} onClick={() => setSize(s)}>{s}</button>)}</div></div>
          )}
          {p.colors.length > 0 && (
            <div className="mt-5"><p className="mb-2 text-sm font-bold">{t('product.color')}</p>
              <div className="flex flex-wrap gap-2">{p.colors.map((c) => <button key={c} type="button" className={chip(color === c)} onClick={() => setColor(c)}>{c}</button>)}</div></div>
          )}
          {ok && (
            <div className="mt-5 flex items-center gap-3">
              <span className="text-sm font-bold">{t('product.qty')}</span>
              <div className="flex items-center rounded-full border border-neutral-300">
                <button type="button" className="h-10 w-10 text-lg" onClick={() => setQty(Math.max(1, qty - 1))}>−</button>
                <span className="w-8 text-center font-semibold">{qty}</span>
                <button type="button" className="h-10 w-10 text-lg" onClick={() => setQty(Math.min(max, qty + 1))}>+</button>
              </div>
            </div>
          )}
          {msg && <p className="mt-4 rounded-xl bg-brand-gray p-3 text-sm font-medium text-brand-red">{msg}</p>}
          <div className="mt-6 hidden flex-wrap gap-3 md:flex">
            <button type="button" disabled={!ok} className={btn} onClick={addToCart}>{t('product.addToCart')}</button>
            <button type="button" disabled={!ok} className={btnDark} onClick={buyNow}>{t('product.buyNow')}</button>
            <button type="button" className={`${chip(fav)} inline-flex items-center gap-2 !rounded-full`} onClick={() => toggleFav(p.id)}><IconHeart className="h-5 w-5" filled={fav} />{t('nav.favorites')}</button>
          </div>
          {(p.description_tj || p.description_ru) && <div className="mt-8 border-t border-neutral-100 pt-5"><p className="whitespace-pre-line text-sm leading-6 text-neutral-700">{pick(p, 'description')}</p></div>}
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-[calc(3.9rem+env(safe-area-inset-bottom))] z-20 flex items-center gap-2 border-t border-neutral-200 bg-white/95 p-3 backdrop-blur md:hidden">
        <button type="button" aria-label={t('nav.favorites')} aria-pressed={fav} onClick={() => toggleFav(p.id)} className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full border ${fav ? 'border-brand-red text-brand-red' : 'border-neutral-300'}`}><IconHeart className="h-6 w-6" filled={fav} /></button>
        <button type="button" disabled={!ok} className={`${btn} flex-1`} onClick={addToCart}>{t('product.addToCart')}</button>
        <button type="button" disabled={!ok} className={`${btnDark} flex-1`} onClick={buyNow}>{t('product.buyNow')}</button>
      </div>
    </div>
  )
}
