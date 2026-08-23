import { CONTAINER, SectionHead, WarmBand } from '@/app/landing/ui'

type Row = { criterion: string; privadoc: string; drive: string }

const ROWS: Row[] = [
  { criterion: 'Liste des pièces à fournir', privadoc: 'Intégrée', drive: '—' },
  { criterion: "Suivi de l'avancement", privadoc: 'Tableau de bord', drive: 'Vérification manuelle' },
  { criterion: 'Notifications de dépôt', privadoc: 'Automatiques', drive: 'Aucune' },
  { criterion: 'Simplicité côté client', privadoc: 'Un lien, on dépose', drive: 'Compte + permissions' },
  { criterion: 'Hébergement & confidentialité', privadoc: 'Europe · sans pub', drive: 'Hors UE possible' },
]

/** Comparison, demoted to compact monochrome evidence: a real semantic table, 5 rows. */
export function Comparison() {
  return (
    <WarmBand>
      <section id="comparatif" aria-labelledby="comparatif-heading" className={`${CONTAINER} py-20 sm:py-28`}>
        <SectionHead
          index="05"
          eyebrow="Et par rapport à un simple Drive ?"
          title="Un Drive stocke. PrivaDoc collecte."
          headingId="comparatif-heading"
          subtitle="Google Drive est un excellent disque dur. Mais réclamer des pièces à des clients, ce n'est pas du stockage."
        />
        <div
          role="region"
          aria-label="Comparatif PrivaDoc et Google Drive"
          tabIndex={0}
          className="mt-10 overflow-x-auto rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950"
        >
          <table className="w-full min-w-140 border-collapse text-left">
            <caption className="sr-only">Comparaison PrivaDoc vs Google Drive</caption>
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800">
                <th scope="col" className="px-5 py-3.5 text-sm font-semibold" />
                <th
                  scope="col"
                  className="border-l-2 border-indigo-600 px-5 py-3.5 text-sm font-semibold text-slate-900 dark:text-white"
                >
                  PrivaDoc
                </th>
                <th scope="col" className="px-5 py-3.5 text-sm font-semibold text-slate-500 dark:text-slate-400">
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
                  <th scope="row" className="w-[38%] px-5 py-3.5 font-medium text-slate-900 dark:text-white">
                    {row.criterion}
                  </th>
                  <td className="border-l-2 border-indigo-600 px-5 py-3.5 font-medium text-slate-800 dark:text-slate-100">
                    {row.privadoc}
                  </td>
                  <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400">
                    {row.drive === '—' ? (
                      <>
                        <span aria-hidden="true">—</span>
                        <span className="sr-only">Non</span>
                      </>
                    ) : (
                      row.drive
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </WarmBand>
  )
}
