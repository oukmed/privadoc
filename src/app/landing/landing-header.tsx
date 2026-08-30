import Link from 'next/link'
import { Brand } from '@/app/brand'
import { BTN_PRIMARY, BTN_SECONDARY } from '@/app/landing/ui'
import { getT } from '@/lib/i18n/server'

/** Public header — same sticky/blur shell as AppHeader, but with sign-in / sign-up
 * CTAs instead of the authenticated nav. */
export async function LandingHeader() {
  const t = await getT()
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-slate-200/80 bg-white/80 px-4 py-3.5 backdrop-blur-md sm:px-6 dark:border-slate-800/80 dark:bg-slate-900/70">
      <Link href="/" aria-label={t('landing.header.homeAria')} className="shrink-0">
        <Brand />
      </Link>
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Mobile: compact text link (visibility toggled on the element itself,
            which has no competing display utility). */}
        <Link
          href="/login"
          className="whitespace-nowrap px-1 text-sm font-semibold text-slate-600 transition hover:text-indigo-600 sm:hidden dark:text-slate-300 dark:hover:text-indigo-400"
        >
          {t('landing.nav.login')}
        </Link>
        {/* Desktop: full button. The show/hide lives on the wrapper so it never
            fights BTN_SECONDARY's own `inline-flex`. */}
        <div className="hidden sm:block">
          <Link href="/login" className={BTN_SECONDARY}>
            {t('landing.nav.login')}
          </Link>
        </div>
        <Link href="/signup" className={`${BTN_PRIMARY} px-3 sm:px-5`}>
          {t('landing.nav.signup')}
        </Link>
      </div>
    </header>
  )
}
