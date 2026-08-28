'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'

// Navigation for the private client platform. Vertical rail on desktop, a
// horizontal scrollable strip on mobile. Highlights the active section.

interface ClientNavItem {
  href: string
  label: string
  icon: ReactNode
}

const ICON = {
  dashboard: <path d="M3 3h7v7H3V3Zm11 0h7v4h-7V3ZM14 10h7v11h-7V10ZM3 14h7v7H3v-7Z" />,
  documents: <path d="M5 3h9l5 5v13H5V3Zm9 0v5h5M8.5 13h7M8.5 17h7" />,
  requests: <path d="M4 5h16M4 12h16M4 19h10M18.5 17l2 2 3-4" />,
  collaborators: (
    <path d="M16 20v-1a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v1M9.5 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM21 20v-1a4 4 0 0 0-3-3.87M16.5 4.13a4 4 0 0 1 0 7.75" />
  ),
  account: (
    <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM5 20v-1a5 5 0 0 1 5-5h4a5 5 0 0 1 5 5v1" />
  ),
}

const ITEMS: ClientNavItem[] = [
  { href: '/tableau-de-bord', label: 'Tableau de bord', icon: ICON.dashboard },
  { href: '/', label: 'Mes documents', icon: ICON.documents },
  { href: '/requests', label: 'Mes demandes', icon: ICON.requests },
  { href: '/collaborators', label: 'Collaborateurs', icon: ICON.collaborators },
  { href: '/account', label: 'Compte', icon: ICON.account },
]

function isActive(pathname: string, href: string): boolean {
  return href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`)
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

export function ClientNav() {
  const pathname = usePathname()

  return (
    <nav aria-label="Navigation">
      {/* Desktop rail */}
      <ul className="hidden gap-1 md:flex md:flex-col">
        {ITEMS.map((item) => {
          const active = isActive(pathname, item.href)
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition ${
                  active
                    ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-slate-100'
                }`}
              >
                <ItemIcon>{item.icon}</ItemIcon>
                {item.label}
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
                className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-medium transition ${
                  active
                    ? 'border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-900 dark:bg-indigo-950/50 dark:text-indigo-300'
                    : 'border-slate-200 text-slate-600 dark:border-slate-800 dark:text-slate-400'
                }`}
              >
                <ItemIcon>{item.icon}</ItemIcon>
                {item.label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
