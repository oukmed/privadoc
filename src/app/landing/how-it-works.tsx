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
      <ol className="relative mt-14 before:absolute before:top-10 before:bottom-10 before:left-6 before:w-px before:bg-linear-to-b before:from-indigo-300 before:to-slate-200 sm:before:left-7 dark:before:from-indigo-800 dark:before:to-slate-800">
        {STEPS.map((step, index) => (
          <li key={step.title} className="grid grid-cols-[auto_1fr] items-start gap-5 sm:gap-8">
            <span className="relative z-10 grid size-12 place-items-center rounded-full bg-indigo-50 font-serif text-2xl text-indigo-600 tabular-nums ring-1 ring-indigo-100 sm:size-14 sm:text-3xl dark:bg-indigo-950/60 dark:text-indigo-300 dark:ring-indigo-900">
              {index + 1}
            </span>
            <div className="border-b border-slate-200/70 pb-8 pt-2 last:border-0 sm:pt-2.5 dark:border-slate-800/80">
              <h3 className="font-serif text-xl font-semibold text-slate-900 sm:text-2xl dark:text-white">
                {step.title}
              </h3>
              <p className="mt-2 max-w-xl leading-relaxed text-slate-600 dark:text-slate-300">{step.body}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
}
