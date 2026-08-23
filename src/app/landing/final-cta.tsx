import Link from 'next/link'
import { ArrowIcon, BTN_PRIMARY, BTN_SECONDARY, CONTAINER, Eyebrow } from '@/app/landing/ui'

/** Closing call to action. */
export function FinalCta() {
  return (
    <section id="essayer" aria-labelledby="essayer-heading" className={`${CONTAINER} py-20 sm:py-28`}>
      <div className="mx-auto max-w-2xl text-center">
        <Eyebrow centered>Prêt à essayer</Eyebrow>
        <h2
          id="essayer-heading"
          className="mt-4 text-3xl font-bold tracking-tight text-balance text-slate-900 sm:text-4xl dark:text-white"
        >
          Le prochain dossier se remplit tout seul.
        </h2>
        <p className="mx-auto mt-4 max-w-md text-lg text-slate-600 dark:text-slate-300">
          Créez votre première demande de pièces en quelques minutes. Gratuit pour démarrer, sans
          carte bancaire.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link href="/signup" className={BTN_PRIMARY}>
            Créer un compte gratuit
            <ArrowIcon />
          </Link>
          <Link href="/login" className={BTN_SECONDARY}>
            Se connecter
          </Link>
        </div>
      </div>
    </section>
  )
}
