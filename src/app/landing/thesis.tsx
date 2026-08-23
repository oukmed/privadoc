import { CONTAINER } from '@/app/landing/ui'

/** Dark full-width strip that crystallises the difference. */
export function Thesis() {
  return (
    <section aria-label="Notre thèse" className={`${CONTAINER} py-20 sm:py-28`}>
      <div className="rounded-3xl bg-slate-900 px-8 py-12 sm:px-12 sm:py-16 dark:ring-1 dark:ring-slate-800">
        <p className="max-w-3xl text-2xl font-medium leading-snug text-balance text-slate-100 sm:text-3xl">
          Un espace de stockage attend que le fichier arrive. PrivaDoc{' '}
          <span className="font-semibold text-indigo-400">va le chercher</span> — pièce par pièce,
          client par client.
        </p>
        <p className="mt-5 text-sm text-slate-400">
          C&apos;est la différence entre un disque dur en ligne et un vrai outil de travail.
        </p>
      </div>
    </section>
  )
}
