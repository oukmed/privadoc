import { LandingHeader } from '@/app/landing/landing-header'
import { Hero } from '@/app/landing/hero'
import { Thesis } from '@/app/landing/thesis'
import { Why } from '@/app/landing/why'
import { Comparison } from '@/app/landing/comparison'
import { Trust } from '@/app/landing/trust'
import { FinalCta } from '@/app/landing/final-cta'
import { LandingFooter } from '@/app/landing/landing-footer'

/** Public homepage shown to visitors who are not signed in. */
export function LandingPage() {
  return (
    <div className="flex flex-1 flex-col bg-slate-50 dark:bg-slate-950">
      <LandingHeader />
      <main>
        <Hero />
        <Thesis />
        <Why />
        <Comparison />
        <Trust />
        <FinalCta />
      </main>
      <LandingFooter />
    </div>
  )
}
