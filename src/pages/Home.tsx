import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useLang } from '../i18n'
import { fetchCategories, fetchProducts } from '../lib/products'
import { useLoad } from '../lib/useLoad'
import ProductCard from '../components/ProductCard'
import { btn, Empty, ErrorBox, input, Loading } from '../components/ui'
import type { Product } from '../types/database'

function Row({ title, items }: { title: string; items: Product[] }) {
  if (!items.length) return null
  return (
    <section className="mt-12">
      <h2 className="mb-4 text-xl font-bold">{title}</h2>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">{items.slice(0, 8).map((p) => <ProductCard key={p.id} p={p} />)}</div>
    </section>
  )
}

export default function Home() {
  const { t, pick } = useLang()
  const nav = useNavigate()
  const [q, setQ] = useState('')
  const prods = useLoad(fetchProducts)
  const cats = useLoad(fetchCategories)
  const list = prods.data ?? []
  return (
    <div>
      <section className="rounded-2xl bg-brand-black px-6 py-12 text-white md:px-12 md:py-16">
        <h1 className="max-w-xl text-3xl font-bold leading-tight md:text-4xl">{t('home.heroTitle')}</h1>
        <p className="mt-3 max-w-lg text-neutral-300">{t('home.heroSub')}</p>
        <form className="mt-6 flex max-w-lg gap-2" onSubmit={(e) => { e.preventDefault(); nav(`/catalog?q=${encodeURIComponent(q)}`) }}>
          <input className={`${input} text-brand-black`} value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('nav.search')} />
          <button className={btn}>{t('home.shopNow')}</button>
        </form>
      </section>

      {cats.data && cats.data.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-4 text-xl font-bold">{t('home.categories')}</h2>
          <div className="flex flex-wrap gap-2">
            {cats.data.map((c) => (
              <Link key={c.id} to={`/catalog?cat=${c.slug}`} className="rounded-full border border-neutral-300 px-4 py-2 text-sm hover:border-brand-red hover:text-brand-red">{pick(c, 'name')}</Link>
            ))}
          </div>
        </section>
      )}

      {prods.loading && <Loading />}
      {prods.error && <div className="mt-8"><ErrorBox msg={prods.error} /></div>}
      {!prods.loading && !prods.error && list.length === 0 && <Empty text={t('home.noProducts')} />}
      <Row title={t('home.new')} items={list.filter((p) => p.is_new)} />
      <Row title={t('home.popular')} items={list.filter((p) => p.is_featured)} />
      <Row title={t('home.sale')} items={list.filter((p) => p.discount_price !== null)} />
    </div>
  )
}
