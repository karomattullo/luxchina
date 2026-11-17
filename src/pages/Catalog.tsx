import { useSearchParams } from 'react-router-dom'
import { useLang } from '../i18n'
import { fetchCategories, fetchProducts, finalPrice } from '../lib/products'
import { useLoad } from '../lib/useLoad'
import { useShop } from '../store/shop'
import ProductCard from '../components/ProductCard'
import { Empty, ErrorBox, input, Loading } from '../components/ui'

export default function Catalog() {
  const { t, pick } = useLang()
  const [sp, setSp] = useSearchParams()
  const q = (sp.get('q') ?? '').trim().toLowerCase()
  const cat = sp.get('cat') ?? ''
  const sort = sp.get('sort') ?? 'new'
  const prods = useLoad(fetchProducts)
  const cats = useLoad(fetchCategories)

  const set = (k: string, v: string) => { const n = new URLSearchParams(sp); if (v) n.set(k, v); else n.delete(k); setSp(n, { replace: true }) }
  const catId = cats.data?.find((c) => c.slug === cat)?.id

  let items = (prods.data ?? []).filter((p) =>
    (!cat || (catId !== undefined && p.category_id === catId)) &&
    (!q || p.name_tj.toLowerCase().includes(q) || p.name_ru.toLowerCase().includes(q)))
  if (sort === 'asc') items = [...items].sort((a, b) => finalPrice(a) - finalPrice(b))
  if (sort === 'desc') items = [...items].sort((a, b) => finalPrice(b) - finalPrice(a))

  return (
    <div>
      <div className="mb-6 grid gap-3 md:grid-cols-3">
        <input className={input} defaultValue={sp.get('q') ?? ''} placeholder={t('nav.search')} onChange={(e) => set('q', e.target.value)} />
        <select className={input} value={cat} onChange={(e) => set('cat', e.target.value)}>
          <option value="">{t('catalog.all')}</option>
          {cats.data?.map((c) => <option key={c.id} value={c.slug}>{pick(c, 'name')}</option>)}
        </select>
        <select className={input} value={sort} onChange={(e) => set('sort', e.target.value)}>
          <option value="new">{t('catalog.sortNew')}</option>
          <option value="asc">{t('catalog.sortAsc')}</option>
          <option value="desc">{t('catalog.sortDesc')}</option>
        </select>
      </div>
      {prods.loading && <Loading />}
      {prods.error && <ErrorBox msg={prods.error} />}
      {!prods.loading && !prods.error && items.length === 0 && <Empty text={t('catalog.empty')} />}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">{items.map((p) => <ProductCard key={p.id} p={p} />)}</div>
    </div>
  )
}

export function Favorites() {
  const { t } = useLang()
  const { favs } = useShop()
  const prods = useLoad(fetchProducts)
  const items = (prods.data ?? []).filter((p) => favs.includes(p.id))
  if (prods.loading) return <Loading />
  if (prods.error) return <ErrorBox msg={prods.error} />
  if (!items.length) return <Empty text={t('fav.empty')} to="/catalog" cta={t('nav.catalog')} />
  return <div className="grid grid-cols-2 gap-4 md:grid-cols-4">{items.map((p) => <ProductCard key={p.id} p={p} />)}</div>
}
