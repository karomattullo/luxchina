import { useEffect, useState, type ChangeEvent, type FormEvent, type ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { btn, ErrorBox, input, Loading } from '../components/ui'
import { useLang } from '../i18n'
import { fetchCategories, finalPrice, money } from '../lib/products'
import { supabase } from '../lib/supabase'
import { useLoad } from '../lib/useLoad'
import type { Product } from '../types/database'
import { adminProducts, removeImages, uploadImage } from './db'

function L({ label, children }: { label: string; children: ReactNode }) {
  return <label className="block text-sm"><span className="mb-1 block font-medium">{label}</span>{children}</label>
}

export function Products() {
  const { t, pick } = useLang()
  const [tick, setTick] = useState(0)
  const [q, setQ] = useState(''); const [type, setType] = useState(''); const [pub, setPub] = useState('')
  const [err, setErr] = useState('')
  const { data, loading, error } = useLoad(adminProducts, [tick])
  const items = (data ?? []).filter((p) =>
    (!q || (p.name_tj + ' ' + p.name_ru).toLowerCase().includes(q.toLowerCase())) &&
    (!type || p.product_type === type) && (!pub || String(p.is_published) === pub))
  const del = async (p: Product) => {
    if (!window.confirm(t('a.confirmDelete'))) return
    const { error: e } = await supabase.from('products').delete().eq('id', p.id)
    if (e) { setErr(e.message); return }
    await removeImages(p.images).catch(() => undefined); setTick(tick + 1)
  }
  return (
    <div>
      <div className="mb-4 grid gap-2 md:grid-cols-[1fr_160px_160px_auto]">
        <input className={input} placeholder={t('a.search')} value={q} onChange={(e) => setQ(e.target.value)} />
        <select className={input} value={type} onChange={(e) => setType(e.target.value)}>
          <option value="">{t('a.all')}</option><option value="in_stock">{t('availability.in_stock')}</option><option value="by_order">{t('availability.by_order')}</option></select>
        <select className={input} value={pub} onChange={(e) => setPub(e.target.value)}>
          <option value="">{t('a.all')}</option><option value="true">{t('a.published')}</option><option value="false">{t('a.hidden')}</option></select>
        <Link to="/admin/products/new" className={btn}>+ {t('a.add')}</Link>
      </div>
      {loading && <Loading />}{(error || err) && <ErrorBox msg={error ?? err} />}
      {!loading && !items.length && <p className="py-10 text-center text-neutral-500">{t('a.noProducts')}</p>}
      <ul className="divide-y rounded-2xl bg-white shadow-card">
        {items.map((p) => (
          <li key={p.id} className="flex items-center gap-3 p-3 text-sm">
            <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-brand-gray">{p.images[0] && <img src={p.images[0]} alt="" className="h-full w-full object-cover" />}</div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{pick(p, 'name')} {!p.is_published && <span className="text-xs text-neutral-400">({t('a.hidden')})</span>}</p>
              <p className="text-neutral-500">{money(finalPrice(p))} · {p.product_type === 'in_stock' ? `${t('availability.in_stock')}: ${p.stock_quantity}` : t('availability.by_order')}</p>
            </div>
            <Link to={`/admin/products/${p.id}`} className="text-brand-black underline">{t('a.edit')}</Link>
            <button type="button" onClick={() => del(p)} className="text-brand-red">{t('a.delete')}</button>
          </li>
        ))}
      </ul>
    </div>
  )
}

const empty = { name_tj: '', name_ru: '', description_tj: '', description_ru: '', price: '', discount_price: '', category_id: '',
  product_type: 'in_stock', stock_quantity: '0', sizes: '', colors: '', is_new: false, is_featured: false, is_published: true }
const list = (s: string) => s.split(',').map((x) => x.trim()).filter(Boolean)

export function ProductForm() {
  const { id } = useParams(); const nav = useNavigate(); const { t, pick } = useLang()
  const cats = useLoad(fetchCategories)
  const [f, setF] = useState(empty)
  const [images, setImages] = useState<string[]>([]); const [orig, setOrig] = useState<string[]>([])
  const [busy, setBusy] = useState(false); const [err, setErr] = useState(''); const [ready, setReady] = useState(!id)

  useEffect(() => {
    if (!id) return
    supabase.from('products').select('*').eq('id', id).maybeSingle().then(({ data, error }) => {
      if (error) setErr(error.message)
      if (data) {
        const p = data as Product
        setF({ name_tj: p.name_tj, name_ru: p.name_ru, description_tj: p.description_tj, description_ru: p.description_ru,
          price: String(p.price), discount_price: p.discount_price === null ? '' : String(p.discount_price),
          category_id: p.category_id ?? '', product_type: p.product_type, stock_quantity: String(p.stock_quantity),
          sizes: p.sizes.join(', '), colors: p.colors.join(', '), is_new: p.is_new, is_featured: p.is_featured, is_published: p.is_published })
        setImages(p.images); setOrig(p.images)
      }
      setReady(true)
    })
  }, [id])

  const txt = (k: keyof typeof empty) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value })
  const chk = (k: 'is_new' | 'is_featured' | 'is_published') => (e: ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.checked })

  const onFiles = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []); e.target.value = ''
    setBusy(true); setErr('')
    try { const urls: string[] = []; for (const file of files) urls.push(await uploadImage(file)); setImages((x) => [...x, ...urls]) }
    catch (ex) { setErr((ex as Error).message) }
    setBusy(false)
  }
  const submit = async (e: FormEvent) => {
    e.preventDefault(); setErr('')
    const price = Number(f.price); const disc = f.discount_price.trim() === '' ? null : Number(f.discount_price)
    const stock = Math.floor(Number(f.stock_quantity))
    if (!f.name_tj.trim() || !f.name_ru.trim() || f.price.trim() === '' || !(price >= 0) || !(stock >= 0) ||
      (disc !== null && !(disc >= 0 && disc < price))) { setErr(t('a.invalid')); return }
    setBusy(true)
    const payload = { name_tj: f.name_tj.trim(), name_ru: f.name_ru.trim(), description_tj: f.description_tj, description_ru: f.description_ru,
      price, discount_price: disc, category_id: f.category_id || null, product_type: f.product_type, stock_quantity: stock,
      sizes: list(f.sizes), colors: list(f.colors), images, is_new: f.is_new, is_featured: f.is_featured, is_published: f.is_published }
    const { error } = id ? await supabase.from('products').update(payload).eq('id', id) : await supabase.from('products').insert(payload)
    if (error) { setErr(error.message); setBusy(false); return }
    await removeImages(orig.filter((u) => !images.includes(u))).catch(() => undefined)
    nav('/admin/products')
  }
  if (!ready) return <Loading />
  return (
    <form onSubmit={submit} className="mx-auto max-w-2xl space-y-4 rounded-2xl bg-white p-5 shadow-card">
      <div className="grid gap-4 md:grid-cols-2">
        <L label={t('a.nameTj')}><input className={input} required value={f.name_tj} onChange={txt('name_tj')} /></L>
        <L label={t('a.nameRu')}><input className={input} required value={f.name_ru} onChange={txt('name_ru')} /></L>
        <L label={t('a.descTj')}><textarea className={input} rows={4} value={f.description_tj} onChange={txt('description_tj')} /></L>
        <L label={t('a.descRu')}><textarea className={input} rows={4} value={f.description_ru} onChange={txt('description_ru')} /></L>
        <L label={t('a.price')}><input className={input} required inputMode="decimal" value={f.price} onChange={txt('price')} /></L>
        <L label={t('a.discount')}><input className={input} inputMode="decimal" value={f.discount_price} onChange={txt('discount_price')} /></L>
        <L label={t('a.category')}><select className={input} value={f.category_id} onChange={txt('category_id')}>
          <option value="">{t('a.none')}</option>{cats.data?.map((c) => <option key={c.id} value={c.id}>{pick(c, 'name')}</option>)}</select></L>
        <L label={t('a.type')}><select className={input} value={f.product_type} onChange={txt('product_type')}>
          <option value="in_stock">{t('availability.in_stock')}</option><option value="by_order">{t('availability.by_order')}</option></select></L>
        {f.product_type === 'in_stock' && <L label={t('a.stock')}><input className={input} inputMode="numeric" value={f.stock_quantity} onChange={txt('stock_quantity')} /></L>}
        <L label={t('a.sizes')}><input className={input} placeholder="S, M, L, XL" value={f.sizes} onChange={txt('sizes')} /></L>
        <L label={t('a.colors')}><input className={input} placeholder="Black, Red" value={f.colors} onChange={txt('colors')} /></L>
      </div>
      <div>
        <p className="mb-2 text-sm font-medium">{t('a.images')}</p>
        <div className="flex flex-wrap gap-2">
          {images.map((u) => (
            <div key={u} className="relative h-20 w-20 overflow-hidden rounded-xl bg-brand-gray">
              <img src={u} alt="" className="h-full w-full object-cover" />
              <button type="button" aria-label="remove" onClick={() => setImages(images.filter((x) => x !== u))} className="absolute right-0.5 top-0.5 rounded-full bg-black/70 px-1.5 text-xs text-white">×</button>
            </div>
          ))}
        </div>
        <input className="mt-3 text-sm" type="file" multiple accept="image/jpeg,image/png,image/webp" onChange={onFiles} />
        {busy && <p className="mt-1 text-xs text-neutral-500">{t('a.uploading')}</p>}
      </div>
      <div className="flex flex-wrap gap-5 text-sm">
        <label><input type="checkbox" checked={f.is_new} onChange={chk('is_new')} /> {t('a.isNew')}</label>
        <label><input type="checkbox" checked={f.is_featured} onChange={chk('is_featured')} /> {t('a.featured')}</label>
        <label><input type="checkbox" checked={f.is_published} onChange={chk('is_published')} /> {t('a.published')}</label>
      </div>
      {err && <p className="rounded-xl bg-red-50 p-3 text-sm text-brand-red">{err}</p>}
      <div className="flex gap-3"><button disabled={busy} className={btn}>{busy ? t('a.saving') : t('a.save')}</button><Link to="/admin/products" className="px-4 py-3 text-sm">{t('a.back')}</Link></div>
    </form>
  )
}
