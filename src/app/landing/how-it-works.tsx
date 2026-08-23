import { CONTAINER, SectionHead } from '@/app/landing/ui'

type Step = { title: string; body: string }

const STEPS: Step[] = [
  {
    title: 'Vous listez ce dont vous avez besoin',
    body: "Créez une demande et cochez les pièces attendues — pièce d'identité, avis d'imposition, RIB… Une seule fois, pour tout le dossier.",
  },
  {
    title: 'Votre client dépose en un lien',
    body: 'Il reçoit un lien unique. Aucun compte à créer, aucun mot de passe. Il voit ce qui reste à fournir et dépose depuis son téléphone ou son ordinateur.',
  },
  {
    title: 'Vous êtes prévenu, tout est classé',
    body: 'À chaque dépôt, une notification. Chaque pièce arrive au bon endroit, nommée et rangée. Vous suivez l’avancement de tous vos dossiers depuis un tableau de bord.',
  },
]

/** How it works: a numbered vertical editorial list joined by a hairline — not cards. */
export function HowItWorks() {
  return (
    <section
      id="fonctionnement"
      aria-labelledby="fonctionnement-heading"
      className={`${CONTAINER} py-20 sm:py-28`}
    >
      <SectionHead
        index="02"
        eyebrow="Comment ça marche"
        title="Trois étapes. Ensuite, vous n'y pensez plus."
        headingId="fonctionnement-heading"
      />
      <ol className="relative mt-12 before:absolute before:left-[27px] before:top-6 before:bottom-6 before:w-px before:bg-slate-200 dark:before:bg-slate-800">
        {STEPS.map((step, index) => (
          <li
            key={step.title}
            className="grid grid-cols-[auto_1fr] items-start gap-5 border-b border-slate-200/70 py-6 last:border-0 dark:border-slate-800"
          >
            <span className="relative z-10 grid size-14 place-items-center rounded-full border border-slate-200 bg-white font-serif text-3xl text-indigo-600 tabular-nums dark:border-slate-800 dark:bg-slate-950 dark:text-indigo-400">
              {index + 1}
            </span>
            <div className="pt-1.5">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{step.title}</h3>
              <p className="mt-2 text-slate-600 dark:text-slate-300">{step.body}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
}
