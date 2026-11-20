import { Link } from 'react-router-dom'
import { useLang } from '../i18n'

export const btn = 'inline-flex items-center justify-center rounded-full bg-brand-red px-6 py-3 text-center text-sm font-semibold text-white shadow-sm transition hover:brightness-110 active:scale-[.98] disabled:opacity-50'
export const btnDark = 'inline-flex items-center justify-center rounded-full bg-brand-black px-6 py-3 text-center text-sm font-semibold text-white transition hover:opacity-90 active:scale-[.98] disabled:opacity-50'
export const input = 'w-full rounded-xl border border-neutral-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-brand-black focus:ring-2 focus:ring-black/5'

export function Loading() {
  const { t } = useLang()
  return <p className="py-16 text-center text-neutral-500">{t('common.loading')}</p>
}
export function ErrorBox({ msg }: { msg: string }) {
  const { t } = useLang()
  return <p className="rounded-xl bg-red-50 p-4 text-sm text-brand-red">{t('common.error')}: {msg}</p>
}
export function Empty({ text, to, cta }: { text: string; to?: string; cta?: string }) {
  return (
    <div className="mx-auto max-w-sm animate-fade-up py-16 text-center">
      <img src="/logo.png" alt="" className="mx-auto mb-4 h-20 w-20 rounded-2xl object-contain opacity-70" />
      <p className="text-neutral-500">{text}</p>
      {to && cta && <Link to={to} className={`${btn} mt-6`}>{cta}</Link>}
    </div>
  )
}
export function ProductSkeletons({ n = 8 }: { n?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-5">
      {Array.from({ length: n }, (_, i) => (
        <div key={i} className="animate-pulse">
          <div className="aspect-[4/5] rounded-2xl bg-neutral-100" />
          <div className="mt-3 h-3 w-3/4 rounded bg-neutral-100" /><div className="mt-2 h-3 w-1/2 rounded bg-neutral-100" />
        </div>
      ))}
    </div>
  )
}
