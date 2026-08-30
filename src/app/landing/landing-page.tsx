import { getT } from '@/lib/i18n/server'
import { LandingHeader } from '@/app/landing/landing-header'
import { Hero } from '@/app/landing/hero'
import { Pain } from '@/app/landing/pain'
import { HowItWorks } from '@/app/landing/how-it-works'
import { Benefits } from '@/app/landing/benefits'
import { Trust } from '@/app/landing/trust'
import { Comparison } from '@/app/landing/comparison'
import { FinalCta } from '@/app/landing/final-cta'
import { LandingFooter } from '@/app/landing/landing-footer'

/** Public homepage shown to visitors who are not signed in. */
export async function LandingPage() {
  const t = await getT()
  return (
    <div className="flex flex-1 flex-col bg-slate-50 dark:bg-slate-950">
      <a
        href="#contenu"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-indigo-700 focus:shadow dark:focus:bg-slate-900 dark:focus:text-indigo-300"
      >
        {t('landing.skipToContent')}
      </a>
      <LandingHeader />
      <main id="contenu" tabIndex={-1}>
        <Hero />
        <Pain />
        <HowItWorks />
        <Benefits />
        <Trust />
        <Comparison />
        <FinalCta />
      </main>
      <LandingFooter />
    </div>
  )
}
