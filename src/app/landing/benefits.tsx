import Link from 'next/link'
import { ArrowIcon, BTN_PRIMARY_INVERT, CONTAINER, SectionHead, WarmBand } from '@/app/landing/ui'

const TILE =
  'rounded-2xl border border-slate-200 bg-white p-7 transition hover:-translate-y-0.5 hover:border-indigo-300 dark:border-slate-800 dark:bg-slate-950 dark:hover:border-indigo-500/40'

/** Benefits: the payoff of having an account, laid out as an uneven bento — not a uniform grid. */
export function Benefits() {
  return (
    <WarmBand>
      <section aria-labelledby="benefits-heading" className={`${CONTAINER} py-20 sm:py-28`}>
        <SectionHead
          index="03"
          eyebrow="Ce que vous y gagnez"
          title="Ouvrez un compte, et le prochain dossier se remplit presque tout seul."
          headingId="benefits-heading"
        />

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <article className={`${TILE} lg:col-span-2`}>
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white">Fini les relances</h3>
            <p className="mt-2 text-slate-600 dark:text-slate-300">
              Le client voit en permanence ce qui manque, et les rappels partent automatiquement.
              Vous arrêtez de jouer les gardiens.
            </p>
          </article>

          <article className={TILE}>
            <h3 className="font-semibold text-slate-900 dark:text-white">
              Tous vos dossiers en un coup d&apos;œil
            </h3>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              Qui a répondu, qui est en retard, quelles échéances arrivent. Un seul tableau de bord.
            </p>
          </article>

          <article className={TILE}>
            <h3 className="font-semibold text-slate-900 dark:text-white">
              Pensé pour des clients pas informaticiens
            </h3>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              Un lien, on dépose, terminé. Même le client le moins à l&apos;aise y arrive du premier
              coup.
            </p>
          </article>

          <article className={TILE}>
            <h3 className="font-semibold text-slate-900 dark:text-white">Chaque pièce à sa place</h3>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              Renommage, classement, historique. Le dossier est prêt quand vous en avez besoin.
            </p>
          </article>

          <article className="flex flex-col justify-between rounded-2xl bg-indigo-600 p-7 text-white lg:col-span-2">
            <div>
              <h3 className="text-xl font-semibold">Gratuit pour démarrer.</h3>
              <p className="mt-2 text-indigo-100">
                Créez votre première demande en quelques minutes, sans carte bancaire.
              </p>
            </div>
            <div className="mt-6">
              <Link href="/signup" className={BTN_PRIMARY_INVERT}>
                Créer un compte gratuit
                <ArrowIcon className="size-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
          </article>
        </div>
      </section>
    </WarmBand>
  )
}
