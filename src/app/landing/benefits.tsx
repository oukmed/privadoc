import Link from 'next/link'
import { ArrowIcon, BTN_PRIMARY_INVERT, CONTAINER, SectionHead, WarmBand } from '@/app/landing/ui'
import { getT } from '@/lib/i18n/server'

const TILE =
  'rounded-2xl border border-slate-200 bg-white p-7 transition hover:-translate-y-0.5 hover:border-indigo-300 dark:border-slate-800 dark:bg-slate-950 dark:hover:border-indigo-500/40'

/** Benefits: the payoff of having an account, laid out as an uneven bento — not a uniform grid. */
export async function Benefits() {
  const t = await getT()
  return (
    <WarmBand>
      <section aria-labelledby="benefits-heading" className={`${CONTAINER} py-20 sm:py-28`}>
        <SectionHead
          index="03"
          eyebrow={t('landing.benefits.eyebrow')}
          title={t('landing.benefits.title')}
          headingId="benefits-heading"
        />

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <article className={`${TILE} lg:col-span-2`}>
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
              {t('landing.benefits.t1.title')}
            </h3>
            <p className="mt-2 text-slate-600 dark:text-slate-300">{t('landing.benefits.t1.body')}</p>
          </article>

          <article className={TILE}>
            <h3 className="font-semibold text-slate-900 dark:text-white">
              {t('landing.benefits.t2.title')}
            </h3>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              {t('landing.benefits.t2.body')}
            </p>
          </article>

          <article className={TILE}>
            <h3 className="font-semibold text-slate-900 dark:text-white">
              {t('landing.benefits.t3.title')}
            </h3>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              {t('landing.benefits.t3.body')}
            </p>
          </article>

          <article className={TILE}>
            <h3 className="font-semibold text-slate-900 dark:text-white">
              {t('landing.benefits.t4.title')}
            </h3>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              {t('landing.benefits.t4.body')}
            </p>
          </article>

          <article className="flex flex-col justify-between rounded-2xl bg-indigo-600 p-7 text-white lg:col-span-2">
            <div>
              <h3 className="text-xl font-semibold">{t('landing.benefits.free.title')}</h3>
              <p className="mt-2 text-indigo-100">{t('landing.benefits.free.body')}</p>
            </div>
            <div className="mt-6">
              <Link href="/signup" className={BTN_PRIMARY_INVERT}>
                {t('landing.cta.createFree')}
                <ArrowIcon className="size-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
          </article>
        </div>
      </section>
    </WarmBand>
  )
}
