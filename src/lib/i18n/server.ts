import 'server-only'
import { cache } from 'react'
import { cookies, headers } from 'next/headers'
import {
  getDictionary,
  isLocale,
  pickLocale,
  translate,
  type Locale,
} from '@/lib/i18n/dictionaries'

/** The request's locale: an explicit `locale` cookie wins, else the browser's
 * Accept-Language header, else the default (fr). Cached per request. */
export const getLocale = cache(async (): Promise<Locale> => {
  const cookieStore = await cookies()
  const fromCookie = cookieStore.get('locale')?.value
  if (fromCookie && isLocale(fromCookie)) return fromCookie
  const requestHeaders = await headers()
  return pickLocale(requestHeaders.get('accept-language'))
})

/** A translator bound to the request's locale, for server components/pages. */
export async function getT() {
  const dict = getDictionary(await getLocale())
  return (key: string, vars?: Record<string, string | number>) => translate(dict, key, vars)
}
