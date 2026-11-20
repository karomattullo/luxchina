import { Link } from 'react-router-dom'
import { btn } from '../components/ui'
import { useLang } from '../i18n'

export default function NotFound() {
  const { t } = useLang()
  return (
    <section className="animate-fade-up py-16 text-center">
      <p className="text-7xl font-extrabold text-brand-red">404</p>
      <h1 className="mt-2 text-xl font-bold">{t('common.notFound')}</h1>
      <Link to="/" className={`${btn} mt-6`}>{t('common.backHome')}</Link>
    </section>
  )
}
