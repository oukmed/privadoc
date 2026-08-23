import { CONTAINER, Eyebrow, WarmBand } from '@/app/landing/ui'

/** Pain: pure typography on a warm band — make the mess felt before the fix. */
export function Pain() {
  return (
    <WarmBand>
      <section aria-labelledby="pain-heading" className={`${CONTAINER} py-20 sm:py-28`}>
        <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <Eyebrow>
              <span aria-hidden="true">01 — </span>Le vrai problème
            </Eyebrow>
            <h2
              id="pain-heading"
              className="mt-4 font-serif text-3xl font-semibold tracking-tight text-balance text-slate-900 sm:text-4xl dark:text-white"
            >
              Le dossier n&apos;attend pas. Les pièces, si.
            </h2>
          </div>
          <div>
            <blockquote className="border-l-2 border-indigo-600 pl-6 font-serif text-2xl italic leading-snug text-balance text-slate-800 sm:text-3xl dark:border-indigo-400 dark:text-slate-100">
              «&nbsp;Vous pouvez me renvoyer le justificatif&nbsp;? Celui d&apos;avant était
              illisible.&nbsp;»
            </blockquote>
            <p className="mt-6 text-lg text-slate-600 dark:text-slate-300">
              Un mail pour réclamer l&apos;avis d&apos;imposition. Un rappel trois jours plus tard.
              Un scan flou, un fichier nommé «&nbsp;document (2)&nbsp;», un RIB qui n&apos;arrive
              jamais. Pendant ce temps l&apos;échéance approche — et c&apos;est encore vous qui
              relancez.
            </p>
            <p className="mt-6 text-lg font-medium text-slate-900 dark:text-white">
              Collecter des pièces n&apos;est pas un problème de stockage. C&apos;est un problème de
              suivi.
            </p>
          </div>
        </div>
      </section>
    </WarmBand>
  )
}
