import { Brand } from '@/app/brand'
import { CONTAINER } from '@/app/landing/ui'

/** Public footer: brand + baseline + Europe/RGPD line. */
export function LandingFooter() {
  return (
    <footer className="border-t border-slate-200 py-10 text-center text-sm text-slate-500 dark:border-slate-800 dark:text-slate-400">
      <div className={CONTAINER}>
        <div className="flex justify-center">
          <Brand size="sm" />
        </div>
        <p className="mt-4">PrivaDoc — la collecte de documents pensée pour les professionnels.</p>
        <p className="mt-1">Hébergé en Europe · Confidentiel · RGPD</p>
      </div>
    </footer>
  )
}
