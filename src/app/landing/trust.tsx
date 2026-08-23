import type { ReactNode } from 'react'
import { CONTAINER } from '@/app/landing/ui'

type Stat = { key: ReactNode; value: string }

const STATS: Stat[] = [
  {
    key: (
      <>
        <span role="img" aria-label="Union européenne">
          🇪🇺
        </span>{' '}
        Europe
      </>
    ),
    value: 'Données hébergées en Europe, conformes au RGPD — pas de transfert hors UE.',
  },
  {
    key: '0 pub',
    value: "Vos documents ne sont jamais analysés à des fins publicitaires ou d'entraînement d'IA.",
  },
  {
    key: '1 lien',
    value: "C'est tout ce que votre client reçoit. Aucun logiciel, aucun compte compliqué.",
  },
]

/** Compact 3-up trust signals. */
export function Trust() {
  return (
    <section aria-label="Confiance" className={`${CONTAINER} py-20 sm:py-28`}>
      <div className="grid gap-5 sm:grid-cols-3">
        {STATS.map((stat, index) => (
          <div
            key={index}
            className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900"
          >
            <p className="text-2xl font-bold tracking-tight text-indigo-600 dark:text-indigo-400">{stat.key}</p>
            <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-300">{stat.value}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
