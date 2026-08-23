import Link from 'next/link'
import { ArrowIcon, BTN_PRIMARY_INVERT, BTN_SECONDARY_ON_DARK, CONTAINER } from '@/app/landing/ui'

/** Closing call to action: the one deliberately centered full-stop, on a dark slate band. */
export function FinalCta() {
  return (
    <section id="essayer" aria-labelledby="essayer-heading" className={`${CONTAINER} py-24`}>
      <div className="rounded-3xl bg-slate-900 px-8 py-16 text-center dark:ring-1 dark:ring-slate-800">
        <h2
          id="essayer-heading"
          className="mx-auto max-w-2xl font-serif text-3xl font-semibold tracking-tight text-balance text-white sm:text-5xl"
        >
          Votre prochain dossier peut commencer maintenant.
        </h2>
        <p className="mx-auto mt-5 max-w-md text-slate-300">
          Créez votre première demande de pièces en quelques minutes. Gratuit pour démarrer, sans
          carte bancaire.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/signup" className={BTN_PRIMARY_INVERT}>
            Créer un compte gratuit
            <ArrowIcon />
          </Link>
          <Link href="/login" className={BTN_SECONDARY_ON_DARK}>
            Se connecter
          </Link>
        </div>
      </div>
    </section>
  )
}
