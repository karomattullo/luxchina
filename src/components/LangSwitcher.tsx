import { useLang } from '../i18n'
import type { Lang } from '../i18n/dict'

const OPTIONS: { code: Lang; label: string }[] = [
  { code: 'tj', label: 'TJ' },
  { code: 'ru', label: 'RU' },
]

export default function LangSwitcher() {
  const { lang, setLang } = useLang()
  return (
    <div className="inline-flex rounded-full border border-neutral-300 p-0.5 text-xs font-semibold" role="group" aria-label="Language">
      {OPTIONS.map(({ code, label }) => (
        <button
          key={code}
          type="button"
          onClick={() => setLang(code)}
          aria-pressed={lang === code}
          className={`rounded-full px-3 py-1 transition-colors ${
            lang === code ? 'bg-brand-black text-white' : 'text-neutral-600 hover:text-brand-black'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
