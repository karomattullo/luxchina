import { Link } from 'react-router-dom'
import { useLang } from '../i18n'

export const btn = 'inline-block rounded-full bg-brand-red px-6 py-3 text-center text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50'
export const btnDark = 'inline-block rounded-full bg-brand-black px-6 py-3 text-center text-sm font-semibold text-white transition-opacity hover:opacity-90'
export const input = 'w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-brand-black'

export function Loading() {
  const { t } = useLang()
  return <p className="py-16 text-center text-neutral-500">{t('common.loading')}</p>
}
export function ErrorBox({ msg }: { msg: string }) {
  const { t } = useLang()
  return <p className="rounded-lg bg-red-50 p-4 text-sm text-brand-red">{t('common.error')}: {msg}</p>
}
export function Empty({ text, to, cta }: { text: string; to?: string; cta?: string }) {
  return (
    <div className="py-16 text-center">
      <p className="text-neutral-500">{text}</p>
      {to && cta && <Link to={to} className={`${btn} mt-6`}>{cta}</Link>}
    </div>
  )
}
