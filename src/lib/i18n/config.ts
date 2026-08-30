// Locale primitives, kept dependency-free so both server and client (and every
// namespace dictionary file) can import them without cycles.

export const LOCALES = ['fr', 'es', 'en', 'de'] as const
export type Locale = (typeof LOCALES)[number]
export const DEFAULT_LOCALE: Locale = 'fr'

/** One flat key → string map for a single locale. */
export type Dict = Record<string, string>
/** A namespace bundle: the same keys translated across every locale. */
export type LocaleDict = Record<Locale, Dict>

export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value)
}

/** Pick the best supported locale from an Accept-Language header, else the default. */
export function pickLocale(acceptLanguage: string | null | undefined): Locale {
  if (!acceptLanguage) return DEFAULT_LOCALE
  for (const part of acceptLanguage.split(',')) {
    const base = part.trim().split(';')[0].split('-')[0].toLowerCase()
    if (isLocale(base)) return base
  }
  return DEFAULT_LOCALE
}
