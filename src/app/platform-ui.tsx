'use client'

import Link from 'next/link'
import type { ReactNode } from 'react'
import { useT } from '@/lib/i18n/client'

// Shared presentational primitives for the authenticated platform (both the
// professional space and the private client space). Composing these keeps every
// surface one system (Linear/Stripe-style: crisp surfaces, restrained indigo
// accent, clear hierarchy, designed states). All are server-safe (no hooks).

/** Page title + optional subtitle and right-aligned action slot. */
export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string
  subtitle?: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}

/** A single KPI / stat tile. `tone` accents the value (e.g. amber for work due). */
export function StatTile({
  label,
  value,
  hint,
  tone = 'neutral',
}: {
  label: string
  value: ReactNode
  hint?: string
  tone?: 'neutral' | 'accent' | 'amber' | 'emerald' | 'red'
}) {
  const toneClass =
    tone === 'accent'
      ? 'text-indigo-600 dark:text-indigo-400'
      : tone === 'amber'
        ? 'text-amber-600 dark:text-amber-400'
        : tone === 'emerald'
          ? 'text-emerald-600 dark:text-emerald-400'
          : tone === 'red'
            ? 'text-red-600 dark:text-red-400'
            : 'text-slate-900 dark:text-slate-50'
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">
        {label}
      </p>
      <p className={`mt-1.5 text-2xl font-bold tracking-tight ${toneClass}`}>{value}</p>
      {hint && <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">{hint}</p>}
    </div>
  )
}

/** A titled surface card. Use for every discrete block on a page. */
export function Card({
  title,
  count,
  action,
  children,
  className = '',
}: {
  title?: string
  count?: number
  action?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <section
      className={`overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 ${className}`}
    >
      {(title || action) && (
        <header className="flex items-center justify-between gap-3 border-b border-slate-200 px-5 py-3.5 dark:border-slate-800">
          {title && (
            <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
              {title}
              {typeof count === 'number' && (
                <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                  {count}
                </span>
              )}
            </h2>
          )}
          {action}
        </header>
      )}
      {children}
    </section>
  )
}

const ITEM_STATUS_CLASS: Record<string, string> = {
  pending: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
  submitted: 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300',
  validated: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300',
  rejected: 'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300',
}
const REQUEST_STATUS_CLASS: Record<string, string> = {
  open: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300',
  completed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300',
  archived: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
}
const FALLBACK_CLASS = 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'

/** Status pill. `kind` picks the request vs. piece vocabulary. Client component
 * (uses useT) so it can be rendered from server components across the platform. */
export function StatusBadge({ status, kind = 'item' }: { status: string; kind?: 'item' | 'request' }) {
  const t = useT()
  const classMap = kind === 'request' ? REQUEST_STATUS_CLASS : ITEM_STATUS_CLASS
  const className = classMap[status] ?? FALLBACK_CLASS
  const label = classMap[status] ? t(`pro.status.${kind}.${status}`) : status
  return (
    <span className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${className}`}>
      {label}
    </span>
  )
}

/** Thin progress bar. Emerald at 100%, indigo otherwise. */
export function ProgressBar({ value, total }: { value: number; total: number }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
      <div
        className={`h-full rounded-full transition-all ${pct === 100 ? 'bg-emerald-500' : 'bg-indigo-500'}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

/** A round monogram avatar from a name or email. */
export function Avatar({ label }: { label: string }) {
  return (
    <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
      {label.charAt(0).toUpperCase()}
    </span>
  )
}

/** Empty-state placeholder inside a Card body. */
export function EmptyState({ children, cta }: { children: ReactNode; cta?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-4 px-6 py-12 text-center">
      <p className="max-w-sm text-sm text-slate-500 dark:text-slate-400">{children}</p>
      {cta}
    </div>
  )
}

/** Primary indigo action, rendered as a link. */
export function ButtonLink({
  href,
  children,
  size = 'md',
}: {
  href: string
  children: ReactNode
  size?: 'sm' | 'md'
}) {
  const sizeClass = size === 'sm' ? 'px-3 py-1.5 text-sm' : 'px-5 py-2.5 text-sm'
  return (
    <Link
      href={href}
      className={`inline-flex items-center justify-center gap-1.5 rounded-lg bg-indigo-600 font-semibold text-white shadow-sm transition hover:bg-indigo-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 ${sizeClass}`}
    >
      {children}
    </Link>
  )
}
