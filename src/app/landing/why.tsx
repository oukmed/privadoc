import type { ReactNode } from 'react'
import { CONTAINER, SectionHead } from '@/app/landing/ui'

type Arg = { title: string; body: string; icon: ReactNode }

const ARGS: Arg[] = [
  {
    title: 'Vous demandez, ils déposent',
    body: "Listez les pièces attendues une fois. Le client voit exactement ce qui reste à fournir, dépose, et c'est classé au bon endroit. Aucune consigne à répéter.",
    icon: (
      <>
        <path d="m3 7 2 2 3-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="m3 17 2 2 3-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M12 6h9M12 12h9M12 18h9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </>
    ),
  },
  {
    title: 'Pensé pour vos clients',
    body: "Pas de compte à créer, pas de permissions à gérer. Un lien, on dépose, terminé. Même le client le moins à l'aise avec l'informatique y arrive du premier coup.",
    icon: (
      <>
        <circle cx="9" cy="8" r="3" stroke="currentColor" strokeWidth="2" />
        <path d="M3.5 20a5.5 5.5 0 0 1 11 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M16 6a3 3 0 0 1 0 6M17.5 20a5.5 5.5 0 0 0-3-4.9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </>
    ),
  },
  {
    title: 'Vous gardez le contrôle',
    body: 'Un tableau de bord montre qui a répondu, qui est en retard et les échéances à venir. Notifications automatiques à chaque dépôt — plus besoin de surveiller un dossier à la main.',
    icon: (
      <>
        <rect x="3" y="3" width="7" height="9" rx="1.5" stroke="currentColor" strokeWidth="2" />
        <rect x="14" y="3" width="7" height="5" rx="1.5" stroke="currentColor" strokeWidth="2" />
        <rect x="14" y="12" width="7" height="9" rx="1.5" stroke="currentColor" strokeWidth="2" />
        <rect x="3" y="16" width="7" height="5" rx="1.5" stroke="currentColor" strokeWidth="2" />
      </>
    ),
  },
  {
    title: 'Confidentiel, hébergé en Europe',
    body: 'Liens de partage qui expirent, accès révocables, données stockées en Europe (RGPD). Vos documents ne servent ni à la publicité, ni à entraîner une IA.',
    icon: (
      <>
        <path d="M12 3 5 6v5c0 4.4 3 8.3 7 9.5 4-1.2 7-5.1 7-9.5V6l-7-3Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
        <path d="m9 12 2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </>
    ),
  },
]

/** "Why PrivaDoc" — four things Drive will never do. */
export function Why() {
  return (
    <section aria-labelledby="why-heading" className={`${CONTAINER} py-20 sm:py-28`}>
      <SectionHead
        eyebrow="Pourquoi PrivaDoc"
        title="Quatre choses que Drive ne fera jamais pour vous."
        headingId="why-heading"
      />
      <div className="mt-12 grid gap-5 sm:grid-cols-2">
        {ARGS.map((arg) => (
          <article
            key={arg.title}
            className="group rounded-2xl border border-slate-200 bg-white p-7 shadow-sm transition hover:-translate-y-1 hover:border-indigo-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-indigo-500/40"
          >
            <span className="mb-5 grid size-11 place-items-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400">
              <svg viewBox="0 0 24 24" fill="none" className="size-6" aria-hidden="true">
                {arg.icon}
              </svg>
            </span>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{arg.title}</h3>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{arg.body}</p>
          </article>
        ))}
      </div>
    </section>
  )
}
