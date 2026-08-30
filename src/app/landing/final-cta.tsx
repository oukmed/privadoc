import Link from 'next/link'
import { ArrowIcon, BTN_PRIMARY_INVERT, BTN_SECONDARY_ON_DARK, CONTAINER } from '@/app/landing/ui'
import { getT } from '@/lib/i18n/server'

/** Closing call to action: the one deliberately centered full-stop, on a dark slate band. */
export async function FinalCta() {
  const t = await getT()
  return (
    <section id="essayer" aria-labelledby="essayer-heading" className={`${CONTAINER} py-24`}>
      <div className="rounded-3xl bg-slate-900 px-8 py-16 text-center dark:ring-1 dark:ring-slate-800">
        <h2
          id="essayer-heading"
          className="mx-auto max-w-2xl font-serif text-3xl font-semibold tracking-tight text-balance text-white sm:text-5xl"
        >
          {t('landing.finalCta.title')}
        </h2>
        <p className="mx-auto mt-5 max-w-md text-slate-300">{t('landing.finalCta.body')}</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/signup" className={BTN_PRIMARY_INVERT}>
            {t('landing.cta.createFree')}
            <ArrowIcon />
          </Link>
          <Link href="/login" className={BTN_SECONDARY_ON_DARK}>
            {t('landing.nav.login')}
          </Link>
        </div>
      </div>
    </section>
  )
}
