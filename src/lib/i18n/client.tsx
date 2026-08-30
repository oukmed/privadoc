'use client'

import { createContext, useContext, useEffect, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { DEFAULT_LOCALE, isLocale, translate, type Locale } from '@/lib/i18n/dictionaries'

type Dict = Record<string, string>

const I18nContext = createContext<{ locale: Locale; dict: Dict }>({
  locale: DEFAULT_LOCALE,
  dict: {},
})

/** Provides the request's locale + dictionary to client components. Set once in the
 * root layout from the server-resolved locale. */
export function I18nProvider({
  locale,
  dict,
  children,
}: {
  locale: Locale
  dict: Dict
  children: ReactNode
}) {
  return <I18nContext.Provider value={{ locale, dict }}>{children}</I18nContext.Provider>
}

/** Translator for client components, bound to the current locale. */
export function useT() {
  const { dict } = useContext(I18nContext)
  return (key: string, vars?: Record<string, string | number>) => translate(dict, key, vars)
}

export function useLocale(): Locale {
  return useContext(I18nContext).locale
}

/**
 * Refines the server-detected locale with the device language (navigator.language —
 * which mirrors the phone's setting). If it differs from what the server rendered and
 * is supported, persist a `locale` cookie and refresh so SSR re-renders in it. No-ops
 * once they match, so it runs at most once.
 */
export function LocaleSync({ locale }: { locale: Locale }) {
  const router = useRouter()
  useEffect(() => {
    const device = (navigator.languages?.[0] ?? navigator.language ?? '')
      .split('-')[0]
      .toLowerCase()
    if (!device || device === locale || !isLocale(device)) return
    document.cookie = `locale=${device}; path=/; max-age=31536000; samesite=lax`
    router.refresh()
  }, [locale, router])
  return null
}
