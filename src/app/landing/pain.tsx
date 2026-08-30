import { CONTAINER, Eyebrow, WarmBand } from '@/app/landing/ui'
import { getT } from '@/lib/i18n/server'

/** Pain: pure typography on a warm band — make the mess felt before the fix. */
export async function Pain() {
  const t = await getT()
  return (
    <WarmBand>
      <section aria-labelledby="pain-heading" className={`${CONTAINER} py-20 sm:py-28`}>
        <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <Eyebrow>
              <span aria-hidden="true">01 — </span>
              {t('landing.pain.eyebrow')}
            </Eyebrow>
            <h2
              id="pain-heading"
              className="mt-4 font-serif text-3xl font-semibold tracking-tight text-balance text-slate-900 sm:text-4xl dark:text-white"
            >
              {t('landing.pain.title')}
            </h2>
          </div>
          <div>
            <blockquote className="border-l-2 border-indigo-600 pl-6 font-serif text-2xl italic leading-snug text-balance text-slate-800 sm:text-3xl dark:border-indigo-400 dark:text-slate-100">
              {t('landing.pain.quote')}
            </blockquote>
            <p className="mt-6 text-lg text-slate-600 dark:text-slate-300">{t('landing.pain.body1')}</p>
            <p className="mt-6 text-lg font-medium text-slate-900 dark:text-white">
              {t('landing.pain.body2')}
            </p>
          </div>
        </div>
      </section>
    </WarmBand>
  )
}
