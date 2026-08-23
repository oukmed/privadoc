import Link from 'next/link'
import { Brand } from '@/app/brand'
import { CONTAINER } from '@/app/landing/ui'

/** Public footer: brand + baseline + legal links + Europe/RGPD line. */
export function LandingFooter() {
  return (
    <footer className="border-t border-slate-200 py-10 text-center text-sm text-slate-500 dark:border-slate-800 dark:text-slate-400">
      <div className={CONTAINER}>
        <div className="flex justify-center">
          <Brand size="sm" />
        </div>
        <p className="mt-4">PrivaDoc — la collecte de documents pensée pour les professionnels.</p>
        <nav className="mt-4 flex flex-wrap justify-center gap-x-5 gap-y-2" aria-label="Liens légaux">
          <Link
            href="/confidentialite"
            className="font-medium transition hover:text-indigo-600 dark:hover:text-indigo-400"
          >
            Confidentialité
          </Link>
          <Link
            href="/mentions-legales"
            className="font-medium transition hover:text-indigo-600 dark:hover:text-indigo-400"
          >
            Mentions légales
          </Link>
        </nav>
        <p className="mt-4">Hébergé en Europe · Conforme au RGPD</p>
      </div>
    </footer>
  )
}
