import type { ReactNode } from 'react'
import { LandingHeader } from '@/app/landing/landing-header'
import { LandingFooter } from '@/app/landing/landing-footer'
import { Eyebrow } from '@/app/landing/ui'

interface LegalShellProps {
  eyebrow: string
  title: string
  /** Human date, e.g. "23 août 2026". */
  updated: string
  children: ReactNode
}

/**
 * Shared chrome for the public legal pages (confidentialité, mentions légales):
 * the landing header/footer + a reading-width prose column. Descendant elements
 * are styled via arbitrary variants so each page can write plain semantic HTML.
 */
export function LegalShell({ eyebrow, title, updated, children }: LegalShellProps) {
  return (
    <div className="flex flex-1 flex-col">
      <LandingHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-16">
        <Eyebrow>{eyebrow}</Eyebrow>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
          {title}
        </h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Dernière mise à jour : {updated}</p>
        <div className="mt-10 space-y-5 leading-relaxed text-slate-600 dark:text-slate-300 [&_a]:font-medium [&_a]:text-indigo-600 [&_a]:underline dark:[&_a]:text-indigo-400 [&_h2]:mt-10 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:tracking-tight [&_h2]:text-slate-900 dark:[&_h2]:text-white [&_li]:leading-relaxed [&_strong]:font-semibold [&_strong]:text-slate-900 dark:[&_strong]:text-slate-100 [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-6">
          {children}
        </div>
      </main>
      <LandingFooter />
    </div>
  )
}
