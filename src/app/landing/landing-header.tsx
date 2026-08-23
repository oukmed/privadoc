import Link from 'next/link'
import { Brand } from '@/app/brand'
import { BTN_PRIMARY, BTN_SECONDARY } from '@/app/landing/ui'

/** Public header — same sticky/blur shell as AppHeader, but with sign-in / sign-up
 * CTAs instead of the authenticated nav. */
export function LandingHeader() {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200/80 bg-white/80 px-6 py-3.5 backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-900/70">
      <Link href="/" aria-label="PrivaDoc, accueil">
        <Brand />
      </Link>
      <div className="flex items-center gap-2 sm:gap-3">
        <Link href="/login" className={`${BTN_SECONDARY} px-3 sm:px-5`}>
          Se connecter
        </Link>
        <Link href="/signup" className={`${BTN_PRIMARY} px-3 sm:px-5`}>
          Créer un compte
        </Link>
      </div>
    </header>
  )
}
