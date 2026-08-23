import { CheckIcon, CONTAINER, SectionHead } from '@/app/landing/ui'

type Row = {
  criterion: string
  privadoc: string
  privadocNote?: string
  drive: string
  driveNote?: string
}

const ROWS: Row[] = [
  { criterion: 'Liste des pièces à fournir', privadoc: 'Intégrée', privadocNote: 'Le client voit ce qui reste', drive: '—', driveNote: 'Dossier vide à expliquer' },
  { criterion: "Suivi de l'avancement", privadoc: 'Tableau de bord', privadocNote: 'Reçu / en attente / en retard', drive: '—', driveNote: 'Vérification manuelle' },
  { criterion: 'Notifications de dépôt', privadoc: 'Automatiques', drive: '—', driveNote: 'Aucune alerte métier' },
  { criterion: 'Simplicité pour le client', privadoc: 'Un lien, on dépose', drive: 'Compte + permissions' },
  { criterion: 'Partages qui expirent', privadoc: 'Par défaut', drive: 'Limité' },
  { criterion: 'Hébergement des données', privadoc: 'Europe (RGPD)', drive: 'Hors UE possible' },
  { criterion: 'Exploitation publicitaire', privadoc: 'Jamais', drive: 'Écosystème publicitaire' },
]

/** Point-by-point comparison as a real semantic table. */
export function Comparison() {
  return (
    <section id="comparatif" aria-labelledby="comparatif-heading" className={`${CONTAINER} py-20 sm:py-28`}>
      <SectionHead
        eyebrow="Le comparatif"
        title="Le même dossier, deux façons de travailler."
        headingId="comparatif-heading"
        subtitle="Google Drive est un excellent disque dur. Mais collecter des pièces auprès de clients n'est pas du stockage — c'est un métier."
      />
      <div
        role="region"
        aria-label="Comparatif"
        tabIndex={0}
        className="mt-12 overflow-x-auto rounded-2xl border border-slate-200 shadow-sm dark:border-slate-800"
      >
        <table className="w-full min-w-[640px] border-collapse text-left">
          <caption className="sr-only">Comparaison PrivaDoc vs Google Drive</caption>
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800">
              <th scope="col" className="px-5 py-4 text-base font-semibold" />
              <th
                scope="col"
                className="bg-indigo-50/50 px-5 py-4 text-base font-semibold text-indigo-600 dark:bg-indigo-950/20 dark:text-indigo-400"
              >
                PrivaDoc
              </th>
              <th scope="col" className="px-5 py-4 text-base font-semibold text-slate-500">
                Google Drive
              </th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row, index) => (
              <tr
                key={row.criterion}
                className={index < ROWS.length - 1 ? 'border-b border-slate-200 dark:border-slate-800' : ''}
              >
                <th scope="row" className="w-[34%] px-5 py-4 font-semibold text-slate-900 dark:text-white">
                  {row.criterion}
                </th>
                <td className="bg-indigo-50/50 px-5 py-4 dark:bg-indigo-950/20">
                  <span className="inline-flex items-center gap-2 font-semibold text-emerald-700 dark:text-emerald-400">
                    <CheckIcon />
                    {row.privadoc}
                  </span>
                  {row.privadocNote ? (
                    <span className="mt-0.5 block text-sm font-normal text-slate-500">{row.privadocNote}</span>
                  ) : null}
                </td>
                <td className="px-5 py-4 text-slate-600 dark:text-slate-400">
                  {row.drive}
                  {row.driveNote ? (
                    <span className="mt-0.5 block text-sm text-slate-500">{row.driveNote}</span>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
