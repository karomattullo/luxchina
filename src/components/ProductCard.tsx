import { Link } from 'react-router-dom'
import { useLang } from '../i18n'
import { useShop } from '../store/shop'
import { finalPrice, money } from '../lib/products'
import type { Product } from '../types/database'

export default function ProductCard({ p }: { p: Product }) {
  const { pick, t } = useLang()
  const { favs, toggleFav } = useShop()
  const fav = favs.includes(p.id)
  const sale = p.discount_price !== null
  const avail = p.product_type === 'by_order' ? t('availability.by_order')
    : p.stock_quantity > 0 ? t('availability.in_stock') : t('availability.out')
  return (
    <div className="group relative">
      <Link to={`/product/${p.id}`}>
        <div className="relative aspect-square overflow-hidden rounded-xl bg-brand-gray">
          {p.images[0] && <img src={p.images[0]} alt={pick(p, 'name')} loading="lazy" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />}
          <div className="absolute left-2 top-2 flex gap-1 text-[10px] font-bold text-white">
            {p.is_new && <span className="rounded bg-brand-black px-1.5 py-0.5">NEW</span>}
            {sale && <span className="rounded bg-brand-red px-1.5 py-0.5">SALE</span>}
          </div>
        </div>
        <h3 className="mt-3 line-clamp-2 text-sm font-medium">{pick(p, 'name')}</h3>
        <p className="mt-1 text-sm">
          <span className="font-bold">{money(finalPrice(p))}</span>
          {sale && <span className="ml-2 text-neutral-400 line-through">{money(p.price)}</span>}
        </p>
        <p className="mt-1 text-xs text-neutral-500">{avail}</p>
      </Link>
      <button type="button" onClick={() => toggleFav(p.id)} aria-label="favorite" aria-pressed={fav}
        className={`absolute right-2 top-2 rounded-full bg-white/90 px-2 py-1 text-lg leading-none ${fav ? 'text-brand-red' : ''}`}>
        {fav ? '♥' : '♡'}
      </button>
    </div>
  )
}
