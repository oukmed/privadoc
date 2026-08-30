import { CONTAINER, SectionHead } from '@/app/landing/ui'
import { getT } from '@/lib/i18n/server'

/** Trust: reassurance for sensitive documents, split by vertical hairlines rather than cards. */
export async function Trust() {
  const t = await getT()
  const cells = [
    {
      label: (
        <>
          <span role="img" aria-label={t('landing.trust.euFlagAria')}>
            🇪🇺
          </span>{' '}
          {t('landing.trust.c1.label')}
        </>
      ),
      body: t('landing.trust.c1.body'),
    },
    { label: t('landing.trust.c2.label'), body: t('landing.trust.c2.body') },
    { label: t('landing.trust.c3.label'), body: t('landing.trust.c3.body') },
  ]

  return (
    <section aria-labelledby="trust-heading" className={`${CONTAINER} py-20 sm:py-28`}>
      <SectionHead
        index="04"
        eyebrow={t('landing.trust.eyebrow')}
        title={t('landing.trust.title')}
        headingId="trust-heading"
      />
      <div className="mt-12 grid divide-y divide-slate-200 sm:grid-cols-3 sm:divide-x sm:divide-y-0 dark:divide-slate-800">
        {cells.map((cell, index) => (
          <div key={index} className="py-6 sm:px-6 sm:first:pl-0 sm:last:pr-0">
            <h3 className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">{cell.label}</h3>
            <p className="mt-2 text-slate-600 dark:text-slate-300">{cell.body}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
