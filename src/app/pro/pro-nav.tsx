'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'
import { useT } from '@/lib/i18n/client'

// Navigation for the professional space. Vertical rail on desktop, horizontal
// scrollable strip on mobile. Highlights the active section.

interface ProNavItem {
  href: string
  label: string
  icon: ReactNode
  primary?: boolean
}

const ICON = {
  dashboard: (
    <path d="M3 3h7v7H3V3Zm11 0h7v4h-7V3ZM14 10h7v11h-7V10ZM3 14h7v7H3v-7Z" />
  ),
  requests: (
    <path d="M5 3h9l5 5v13H5V3Zm9 0v5h5M8.5 13h7M8.5 17h7" />
  ),
  clients: (
    <path d="M16 20v-1a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v1M9.5 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM21 20v-1a4 4 0 0 0-3-3.87M16.5 4.13a4 4 0 0 1 0 7.75" />
  ),
  add: <path d="M12 5v14M5 12h14" />,
}

const ITEMS: ProNavItem[] = [
  { href: '/pro', label: 'nav.dashboard', icon: ICON.dashboard },
  { href: '/pro/demandes', label: 'nav.requests', icon: ICON.requests },
  { href: '/pro/clients', label: 'nav.clients', icon: ICON.clients },
  { href: '/pro/nouvelle-demande', label: 'nav.newRequest', icon: ICON.add, primary: true },
]

function isActive(pathname: string, href: string): boolean {
  return href === '/pro' ? pathname === '/pro' : pathname === href || pathname.startsWith(`${href}/`)
}

function ItemIcon({ children }: { children: ReactNode }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-[18px] shrink-0"
    >
      {children}
    </svg>
  )
}

export function ProNav() {
  const pathname = usePathname()
  const t = useT()

  return (
    <nav aria-label={t('nav.proLabel')}>
      {/* Desktop rail */}
      <ul className="hidden gap-1 md:flex md:flex-col">
        {ITEMS.map((item) => {
          const active = isActive(pathname, item.href)
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={
                  item.primary
                    ? 'mt-2 flex items-center gap-2.5 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-950'
                    : `flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition ${
                        active
                          ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-slate-100'
                      }`
                }
              >
                <ItemIcon>{item.icon}</ItemIcon>
                {t(item.label)}
              </Link>
            </li>
          )
        })}
      </ul>

      {/* Mobile strip */}
      <ul className="flex gap-2 overflow-x-auto pb-1 md:hidden">
        {ITEMS.map((item) => {
          const active = isActive(pathname, item.href)
          return (
            <li key={item.href} className="shrink-0">
              <Link
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={
                  item.primary
                    ? 'flex items-center gap-2 rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white'
                    : `flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-medium transition ${
                        active
                          ? 'border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-900 dark:bg-indigo-950/50 dark:text-indigo-300'
                          : 'border-slate-200 text-slate-600 dark:border-slate-800 dark:text-slate-400'
                      }`
                }
              >
                <ItemIcon>{item.icon}</ItemIcon>
                {t(item.label)}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
