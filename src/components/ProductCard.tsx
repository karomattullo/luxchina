import { Link } from 'react-router-dom'
import { useLang } from '../i18n'
import { useShop } from '../store/shop'
import { finalPrice, money } from '../lib/products'
import type { Product } from '../types/database'
import { IconHeart } from './Icons'

export default function ProductCard({ p }: { p: Product }) {
  const { pick, t } = useLang()
  const { favs, toggleFav } = useShop()
  const fav = favs.includes(p.id)
  const sale = p.discount_price !== null
  const pct = sale ? Math.round((1 - (p.discount_price as number) / p.price) * 100) : 0
  const inStock = p.product_type === 'in_stock'
  const out = inStock && p.stock_quantity <= 0
  const avail = !inStock ? t('availability.by_order') : out ? t('availability.out') : t('availability.in_stock')
  return (
    <div className="group relative animate-fade-up overflow-hidden rounded-2xl bg-white shadow-card transition duration-300 hover:-translate-y-1 hover:shadow-lift">
      <Link to={`/product/${p.id}`} className="block">
        <div className="relative aspect-[4/5] overflow-hidden bg-brand-gray">
          {p.images[0] && <img src={p.images[0]} alt={pick(p, 'name')} loading="lazy" className={`h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 ${out ? 'opacity-60' : ''}`} />}
          <div className="absolute left-2 top-2 flex flex-col items-start gap-1 text-[10px] font-bold text-white">
            {sale && pct > 0 && <span className="rounded-full bg-brand-red px-2 py-0.5">-{pct}%</span>}
            {p.is_new && <span className="rounded-full bg-brand-black px-2 py-0.5">NEW</span>}
          </div>
        </div>
        <div className="p-3">
          <h3 className="line-clamp-2 min-h-[2.5rem] text-sm font-medium leading-5">{pick(p, 'name')}</h3>
          <p className="mt-1.5 flex flex-wrap items-baseline gap-x-2">
            <span className={`text-base font-extrabold ${sale ? 'text-brand-red' : ''}`}>{money(finalPrice(p))}</span>
            {sale && <span className="text-xs text-neutral-400 line-through">{money(p.price)}</span>}
          </p>
          <p className="mt-1 flex items-center gap-1.5 text-xs text-neutral-500">
            <span className={`h-1.5 w-1.5 rounded-full ${out ? 'bg-neutral-400' : inStock ? 'bg-green-500' : 'bg-amber-500'}`} />{avail}
          </p>
        </div>
      </Link>
      <button type="button" onClick={() => toggleFav(p.id)} aria-label={t('nav.favorites')} aria-pressed={fav}
        className={`absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-full bg-white/95 shadow-card transition active:scale-90 ${fav ? 'text-brand-red' : 'text-neutral-700'}`}>
        <IconHeart className="h-5 w-5" filled={fav} />
      </button>
    </div>
  )
}
