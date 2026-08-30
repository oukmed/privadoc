import { CONTAINER, SectionHead } from '@/app/landing/ui'
import { getT } from '@/lib/i18n/server'

const STEP_KEYS = [
  { title: 'landing.how.step1.title', body: 'landing.how.step1.body' },
  { title: 'landing.how.step2.title', body: 'landing.how.step2.body' },
  { title: 'landing.how.step3.title', body: 'landing.how.step3.body' },
] as const

/** How it works: a numbered vertical editorial list joined by a hairline — not cards. */
export async function HowItWorks() {
  const t = await getT()
  const steps = STEP_KEYS.map(({ title, body }) => ({ title: t(title), body: t(body) }))

  return (
    <section
      id="fonctionnement"
      aria-labelledby="fonctionnement-heading"
      className={`${CONTAINER} py-20 sm:py-28`}
    >
      <SectionHead
        index="02"
        eyebrow={t('landing.how.eyebrow')}
        title={t('landing.how.title')}
        headingId="fonctionnement-heading"
      />
      <ol className="relative mt-14 before:absolute before:top-10 before:bottom-10 before:left-6 before:w-px before:bg-linear-to-b before:from-indigo-300 before:to-slate-200 sm:before:left-7 dark:before:from-indigo-800 dark:before:to-slate-800">
        {steps.map((step, index) => (
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
