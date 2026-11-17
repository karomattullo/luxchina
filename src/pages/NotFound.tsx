import { Link } from 'react-router-dom'
import { useLang } from '../i18n'

export default function NotFound() {
  const { t } = useLang()
  return (
    <section className="py-16 text-center">
      <h1 className="text-2xl font-bold">{t('common.notFound')}</h1>
      <Link to="/" className="mt-6 inline-block rounded-full bg-brand-red px-6 py-2 text-sm font-semibold text-white">
        {t('common.backHome')}
      </Link>
    </section>
  )
}
