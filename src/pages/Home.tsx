import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { IconBox, IconChat, IconTag, IconTruck } from '../components/Icons'
import ProductCard from '../components/ProductCard'
import { btn, Empty, ErrorBox, ProductSkeletons } from '../components/ui'
import { useLang } from '../i18n'
import type { DictKey } from '../i18n/dict'
import { fetchCategories, fetchProducts } from '../lib/products'
import { useLoad } from '../lib/useLoad'
import type { Product } from '../types/database'

function Section({ title, items, to }: { title: string; items: Product[]; to: string }) {
  const { t } = useLang()
  if (!items.length) return null
  return (
    <section className="mt-10 md:mt-14">
      <div className="mb-4 flex items-end justify-between">
        <h2 className="text-xl font-extrabold md:text-2xl">{title}</h2>
        <Link to={to} className="text-sm font-semibold text-brand-red">{t('home.seeAll')} →</Link>
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-5">{items.slice(0, 8).map((p) => <ProductCard key={p.id} p={p} />)}</div>
    </section>
  )
}

const BENEFITS: { icon: ReactNode; title: DictKey; text: DictKey }[] = [
  { icon: <IconTruck className="h-7 w-7" />, title: 'ben.delivery', text: 'ben.deliveryT' },
  { icon: <IconBox className="h-7 w-7" />, title: 'ben.track', text: 'ben.trackT' },
  { icon: <IconChat className="h-7 w-7" />, title: 'ben.support', text: 'ben.supportT' },
  { icon: <IconTag className="h-7 w-7" />, title: 'ben.order', text: 'ben.orderT' },
]

export default function Home() {
  const { t, pick } = useLang()
  const prods = useLoad(fetchProducts)
  const cats = useLoad(fetchCategories)
  const list = prods.data ?? []
  const shots = list.filter((p) => p.images[0]).slice(0, 3)
  const catImg = (id: string) => list.find((p) => p.category_id === id && p.images[0])?.images[0]

  return (
    <div>
      <section className="relative animate-fade-up overflow-hidden rounded-3xl bg-brand-black text-white shadow-lift">
        <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-brand-red" aria-hidden="true" />
        <div className="absolute -bottom-28 left-1/3 h-60 w-60 rotate-45 rounded-3xl bg-white/5" aria-hidden="true" />
        <div className="relative grid items-center gap-6 p-6 md:grid-cols-2 md:p-12">
          <div>
            <span className="inline-block rounded-full bg-white/10 px-3 py-1 text-xs font-medium">LUXCHINA · {t('brand.tagline')}</span>
            <h1 className="mt-4 text-3xl font-extrabold leading-tight md:text-5xl">{t('home.heroTitle')}</h1>
            <p className="mt-3 max-w-md text-neutral-300">{t('home.heroSub')}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/catalog" className={btn}>{t('home.shopNow')}</Link>
              <Link to="/catalog?sale=1" className="inline-flex items-center justify-center rounded-full border border-white/40 px-6 py-3 text-sm font-semibold transition hover:bg-white hover:text-brand-black">{t('home.sale')}</Link>
            </div>
          </div>
          {shots.length > 0 && (
            <div className="grid grid-cols-3 gap-3">
              {shots.map((p, i) => (
                <Link key={p.id} to={`/product/${p.id}`} className={`aspect-[3/4] overflow-hidden rounded-2xl bg-white/10 shadow-lift transition hover:-translate-y-1 ${i === 1 ? 'mt-5' : ''}`}>
                  <img src={p.images[0]} alt={pick(p, 'name')} className="h-full w-full object-cover" />
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="mt-6 grid grid-cols-2 gap-3 md:mt-8 md:grid-cols-4 md:gap-4">
        {BENEFITS.map((b) => (
          <div key={b.title} className="rounded-2xl bg-brand-gray p-4">
            <span className="text-brand-red">{b.icon}</span>
            <p className="mt-2 text-sm font-bold">{t(b.title)}</p>
            <p className="mt-0.5 text-xs text-neutral-500">{t(b.text)}</p>
          </div>
        ))}
      </section>

      {cats.data && cats.data.length > 0 && (
        <section className="mt-10 md:mt-14">
          <h2 className="mb-4 text-xl font-extrabold md:text-2xl">{t('home.categories')}</h2>
          <div className="grid grid-cols-4 gap-3 md:grid-cols-7 md:gap-4">
            {cats.data.map((c) => {
              const img = catImg(c.id)
              return (
                <Link key={c.id} to={`/catalog?cat=${c.slug}`} className="group flex flex-col items-center gap-2 text-center">
                  <div className="aspect-square w-full overflow-hidden rounded-2xl bg-brand-gray shadow-card transition group-hover:-translate-y-1 group-hover:shadow-lift">
                    {img ? <img src={img} alt="" loading="lazy" className="h-full w-full object-cover" />
                      : <span className="flex h-full items-center justify-center text-3xl font-extrabold text-neutral-300">{pick(c, 'name').charAt(0)}</span>}
                  </div>
                  <span className="text-xs font-semibold leading-4 md:text-sm">{pick(c, 'name')}</span>
                </Link>
              )
            })}
          </div>
        </section>
      )}

      {prods.loading && <div className="mt-10"><ProductSkeletons n={4} /></div>}
      {prods.error && <div className="mt-8"><ErrorBox msg={prods.error} /></div>}
      {!prods.loading && !prods.error && list.length === 0 && <Empty text={t('home.noProducts')} />}
      <Section title={t('home.recommended')} items={list.filter((p) => p.is_featured)} to="/catalog" />
      <Section title={t('home.new')} items={list.filter((p) => p.is_new)} to="/catalog" />
      <Section title={t('home.sale')} items={list.filter((p) => p.discount_price !== null)} to="/catalog?sale=1" />
    </div>
  )
}
