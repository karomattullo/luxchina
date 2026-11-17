import { useState, type ChangeEvent } from 'react'
import { btn, ErrorBox, input, Loading } from '../components/ui'
import { useLang } from '../i18n'
import { fetchCategories } from '../lib/products'
import { supabase } from '../lib/supabase'
import { useLoad } from '../lib/useLoad'
import type { Category } from '../types/database'

const blank = { slug: '', name_tj: '', name_ru: '', sort_order: '0' }

function Row({ c, onDone, onErr }: { c?: Category; onDone: () => void; onErr: (m: string) => void }) {
  const { t } = useLang()
  const [f, setF] = useState(c ? { slug: c.slug, name_tj: c.name_tj, name_ru: c.name_ru, sort_order: String(c.sort_order) } : blank)
  const up = (k: keyof typeof f) => (e: ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value })
  const save = async () => {
    const payload = { slug: f.slug.trim().toLowerCase(), name_tj: f.name_tj.trim(), name_ru: f.name_ru.trim(), sort_order: Math.floor(Number(f.sort_order)) || 0 }
    if (!/^[a-z0-9-]+$/.test(payload.slug) || !payload.name_tj || !payload.name_ru) { onErr(t('a.invalid')); return }
    const { error } = c ? await supabase.from('categories').update(payload).eq('id', c.id) : await supabase.from('categories').insert(payload)
    if (error) onErr(error.message); else { if (!c) setF(blank); onErr(''); onDone() }
  }
  const del = async () => {
    if (!c || !window.confirm(t('a.confirmDelete'))) return
    const { error } = await supabase.from('categories').delete().eq('id', c.id)
    if (error) onErr(error.message); else onDone()
  }
  return (
    <div className="grid gap-2 p-3 md:grid-cols-[140px_1fr_1fr_70px_auto]">
      <input className={input} placeholder={t('a.slug')} value={f.slug} onChange={up('slug')} />
      <input className={input} placeholder={t('a.nameTj')} value={f.name_tj} onChange={up('name_tj')} />
      <input className={input} placeholder={t('a.nameRu')} value={f.name_ru} onChange={up('name_ru')} />
      <input className={input} placeholder={t('a.sort')} inputMode="numeric" value={f.sort_order} onChange={up('sort_order')} />
      <div className="flex items-center gap-3 text-sm">
        <button type="button" onClick={save} className={c ? 'underline' : btn}>{c ? t('a.save') : `+ ${t('a.add')}`}</button>
        {c && <button type="button" onClick={del} className="text-brand-red">{t('a.delete')}</button>}
      </div>
    </div>
  )
}

export default function CategoriesAdmin() {
  const [tick, setTick] = useState(0); const [err, setErr] = useState('')
  const { data, loading, error } = useLoad(fetchCategories, [tick])
  if (loading && !data) return <Loading />
  return (
    <div>
      {(error || err) && <div className="mb-3"><ErrorBox msg={error ?? err} /></div>}
      <div className="divide-y rounded-xl bg-white shadow-sm">
        {data?.map((c) => <Row key={c.id + c.slug} c={c} onDone={() => setTick(tick + 1)} onErr={setErr} />)}
        <Row onDone={() => setTick(tick + 1)} onErr={setErr} />
      </div>
    </div>
  )
}
