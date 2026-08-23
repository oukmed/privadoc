import type { ReactNode } from 'react'
import { CONTAINER, SectionHead } from '@/app/landing/ui'

type Cell = { label: ReactNode; body: string }

const CELLS: Cell[] = [
  {
    label: (
      <>
        <span role="img" aria-label="Union européenne">
          🇪🇺
        </span>{' '}
        Hébergé en Europe
      </>
    ),
    body: 'Vos données restent dans l’Union européenne, conformément au RGPD. Aucun transfert hors UE.',
  },
  {
    label: 'Chiffré et sous contrôle',
    body: 'Liens de partage qui expirent, accès révocables à tout moment. Vous décidez qui voit quoi, et jusqu’à quand.',
  },
  {
    label: 'Jamais exploité',
    body: 'Vos documents ne servent ni à la publicité, ni à entraîner une IA. Zéro pub.',
  },
]

/** Trust: reassurance for sensitive documents, split by vertical hairlines rather than cards. */
export function Trust() {
  return (
    <section aria-labelledby="trust-heading" className={`${CONTAINER} py-20 sm:py-28`}>
      <SectionHead
        index="04"
        eyebrow="Confidentialité"
        title="Des documents sensibles méritent mieux qu'un dossier partagé."
        headingId="trust-heading"
      />
      <div className="mt-12 grid divide-y divide-slate-200 sm:grid-cols-3 sm:divide-x sm:divide-y-0 dark:divide-slate-800">
        {CELLS.map((cell, index) => (
          <div key={index} className="py-6 sm:px-6 sm:first:pl-0 sm:last:pr-0">
            <h3 className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">{cell.label}</h3>
            <p className="mt-2 text-slate-600 dark:text-slate-300">{cell.body}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
