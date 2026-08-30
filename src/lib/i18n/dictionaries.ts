// Runtime dictionary: merges every namespace file into one flat map per locale.
// Server code uses getT() (./server), client components use useT() (./client).
// To add a surface: create ./dictionaries/<surface>.ts exporting a LocaleDict, then
// import it and add it to NAMESPACES below. Dynamic user content is NOT translated.

export * from '@/lib/i18n/config'
import { DEFAULT_LOCALE, LOCALES, type Dict, type Locale, type LocaleDict } from '@/lib/i18n/config'
import { auth } from '@/lib/i18n/dictionaries/auth'
import { nav } from '@/lib/i18n/dictionaries/nav'
import { landing } from '@/lib/i18n/dictionaries/landing'
import { vault } from '@/lib/i18n/dictionaries/vault'
import { inbox } from '@/lib/i18n/dictionaries/inbox'
import { pro } from '@/lib/i18n/dictionaries/pro'

// Every translated surface. Order is irrelevant; keys must be globally unique.
const NAMESPACES: LocaleDict[] = [auth, nav, landing, vault, inbox, pro]

function mergeNamespaces(namespaces: LocaleDict[]): Record<Locale, Dict> {
  const out = Object.fromEntries(LOCALES.map((l) => [l, {}])) as Record<Locale, Dict>
  for (const ns of namespaces) {
    for (const locale of LOCALES) Object.assign(out[locale], ns[locale])
  }
  return out
}

const DICTIONARIES = mergeNamespaces(NAMESPACES)

export function getDictionary(locale: Locale): Dict {
  return DICTIONARIES[locale] ?? DICTIONARIES[DEFAULT_LOCALE]
}

/** Look up a key, falling back to French then the raw key. Supports {var} interpolation. */
export function translate(dict: Dict, key: string, vars?: Record<string, string | number>): string {
  let text = dict[key] ?? DICTIONARIES[DEFAULT_LOCALE][key] ?? key
  if (vars) {
    for (const [name, value] of Object.entries(vars)) {
      text = text.replaceAll(`{${name}}`, String(value))
    }
  }
  return text
}
