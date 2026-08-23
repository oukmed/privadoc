import type { ReactNode } from 'react'

/** Container width used by every landing section. */
export const CONTAINER = 'mx-auto w-full max-w-6xl px-6'

/** Reused CTA button styles (kept in one place so header/hero/final-cta match). */
export const BTN_PRIMARY =
  'inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:focus-visible:outline-indigo-400'

export const BTN_SECONDARY =
  'inline-flex items-center gap-2 rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-indigo-600 hover:text-indigo-600 dark:border-slate-700 dark:text-slate-200 dark:hover:border-indigo-400 dark:hover:text-indigo-400'

/** Uppercase overline with a leading rule. */
export function Eyebrow({ children, centered = false }: { children: ReactNode; centered?: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-indigo-600 dark:text-indigo-400${
        centered ? ' justify-center' : ''
      }`}
    >
      <span className="h-px w-5 bg-indigo-600 dark:bg-indigo-400" aria-hidden="true" />
      {children}
    </span>
  )
}

/** Section eyebrow + H2 (+ optional subtitle). `headingId` labels the section landmark. */
export function SectionHead({
  eyebrow,
  title,
  headingId,
  subtitle,
  centered = false,
}: {
  eyebrow: string
  title: ReactNode
  headingId: string
  subtitle?: ReactNode
  centered?: boolean
}) {
  return (
    <div className={centered ? 'mx-auto max-w-2xl text-center' : 'max-w-3xl'}>
      <Eyebrow centered={centered}>{eyebrow}</Eyebrow>
      <h2
        id={headingId}
        className="mt-4 text-3xl font-bold tracking-tight text-balance text-slate-900 sm:text-4xl dark:text-white"
      >
        {title}
      </h2>
      {subtitle ? (
        <p className={`mt-4 text-lg text-slate-600 dark:text-slate-300${centered ? ' mx-auto max-w-md' : ''}`}>
          {subtitle}
        </p>
      ) : null}
    </div>
  )
}

/** Decorative check glyph (info is carried by adjacent text). */
export function CheckIcon({ className = 'size-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="m5 13 4 4L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/** Decorative right arrow for primary CTAs. */
export function ArrowIcon({ className = 'size-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="m13 6 6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
