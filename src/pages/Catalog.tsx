import { useSearchParams } from 'react-router-dom'
import ProductCard from '../components/ProductCard'
import { Empty, ErrorBox, input, ProductSkeletons } from '../components/ui'
import { useLang } from '../i18n'
import { fetchCategories, fetchProducts, finalPrice } from '../lib/products'
import { useLoad } from '../lib/useLoad'
import { useShop } from '../store/shop'

const pill = (on: boolean) => `rounded-full border px-4 py-2 text-sm font-medium transition ${on ? 'border-brand-red bg-brand-red text-white' : 'border-neutral-300 bg-white hover:border-brand-black'}`

export default function Catalog() {
  const { t, pick } = useLang()
  const [sp, setSp] = useSearchParams()
  const q = (sp.get('q') ?? '').trim().toLowerCase()
  const cat = sp.get('cat') ?? ''
  const sort = sp.get('sort') ?? 'new'
  const sale = sp.get('sale') === '1'
  const stock = sp.get('stock') === '1'
  const prods = useLoad(fetchProducts)
  const cats = useLoad(fetchCategories)

  const set = (k: string, v: string) => { const n = new URLSearchParams(sp); if (v) n.set(k, v); else n.delete(k); setSp(n, { replace: true }) }
  const catId = cats.data?.find((c) => c.slug === cat)?.id
  const catName = cats.data?.find((c) => c.slug === cat)

  let items = (prods.data ?? []).filter((p) =>
    (!cat || (catId !== undefined && p.category_id === catId)) &&
    (!q || p.name_tj.toLowerCase().includes(q) || p.name_ru.toLowerCase().includes(q)) &&
    (!sale || p.discount_price !== null) &&
    (!stock || (p.product_type === 'in_stock' && p.stock_quantity > 0)))
  if (sort === 'asc') items = [...items].sort((a, b) => finalPrice(a) - finalPrice(b))
  if (sort === 'desc') items = [...items].sort((a, b) => finalPrice(b) - finalPrice(a))

  return (
    <div>
      <h1 className="text-2xl font-extrabold md:text-3xl">{catName ? pick(catName, 'name') : t('nav.catalog')}</h1>
      <div className="no-scrollbar -mx-4 mt-4 flex items-center gap-2 overflow-x-auto px-4 pb-2 md:mx-0 md:flex-wrap md:px-0">
        <select className={`${input} !w-auto shrink-0 !rounded-full !py-2`} value={sort} onChange={(e) => set('sort', e.target.value)} aria-label="sort">
          <option value="new">{t('catalog.sortNew')}</option>
          <option value="asc">{t('catalog.sortAsc')}</option>
          <option value="desc">{t('catalog.sortDesc')}</option>
        </select>
        <button type="button" className={`${pill(sale)} shrink-0`} aria-pressed={sale} onClick={() => set('sale', sale ? '' : '1')}>{t('filter.sale')}</button>
        <button type="button" className={`${pill(stock)} shrink-0`} aria-pressed={stock} onClick={() => set('stock', stock ? '' : '1')}>{t('filter.stock')}</button>
        {!prods.loading && <span className="ml-auto shrink-0 pl-2 text-sm text-neutral-500">{items.length} {t('catalog.found')}</span>}
      </div>
      <div className="mt-4">
        {prods.loading && <ProductSkeletons />}
        {prods.error && <ErrorBox msg={prods.error} />}
        {!prods.loading && !prods.error && items.length === 0 && <Empty text={t('catalog.empty')} />}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-5">{items.map((p) => <ProductCard key={p.id} p={p} />)}</div>
      </div>
    </div>
  )
}

export function Favorites() {
  const { t } = useLang()
  const { favs } = useShop()
  const prods = useLoad(fetchProducts)
  const items = (prods.data ?? []).filter((p) => favs.includes(p.id))
  if (prods.loading) return <ProductSkeletons n={4} />
  if (prods.error) return <ErrorBox msg={prods.error} />
  if (!items.length) return <Empty text={t('fav.empty')} to="/catalog" cta={t('nav.catalog')} />
  return (
    <div>
      <h1 className="mb-4 text-2xl font-extrabold md:text-3xl">{t('nav.favorites')}</h1>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-5">{items.map((p) => <ProductCard key={p.id} p={p} />)}</div>
    </div>
  )
}
