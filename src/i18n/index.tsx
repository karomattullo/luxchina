import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { dictionaries, type DictKey, type Lang } from './dict'

const STORAGE_KEY = 'luxchina.lang'

interface LangContextValue {
  lang: Lang
  setLang: (l: Lang) => void
  t: (key: DictKey) => string
  /** Pick the TJ or RU column of a bilingual DB row: pick(product, 'name') */
  pick: <K extends string>(row: Record<`${K}_tj` | `${K}_ru`, string>, field: K) => string
}

const LangContext = createContext<LangContextValue | null>(null)

function readStoredLang(): Lang {
  try {
    const v = localStorage.getItem(STORAGE_KEY)
    return v === 'ru' || v === 'tj' ? v : 'tj' // Tajik is the primary language
  } catch {
    return 'tj'
  }
}

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(readStoredLang)

  const setLang = useCallback((l: Lang) => {
    setLangState(l)
    try { localStorage.setItem(STORAGE_KEY, l) } catch { /* storage unavailable */ }
  }, [])

  useEffect(() => { document.documentElement.lang = lang === 'tj' ? 'tg' : 'ru' }, [lang])

  const value = useMemo<LangContextValue>(() => ({
    lang,
    setLang,
    t: (key) => dictionaries[lang][key],
    pick: (row, field) => row[`${field}_${lang}` as keyof typeof row],
  }), [lang, setLang])

  return <LangContext.Provider value={value}>{children}</LangContext.Provider>
}

export function useLang(): LangContextValue {
  const ctx = useContext(LangContext)
  if (!ctx) throw new Error('useLang must be used inside <LangProvider>')
  return ctx
}
