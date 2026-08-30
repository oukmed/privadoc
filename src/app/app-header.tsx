import Link from 'next/link'
import { Brand } from '@/app/brand'
import { signout } from '@/app/auth/actions'
import { NotificationsBell } from '@/app/notifications/notifications-bell'
import { MobileNav } from '@/app/mobile-nav'
import { navLinksFor } from '@/app/nav-links'
import { getProfile } from '@/app/account/profile'

/** Shared header for every authenticated (client/pro) page: brand, primary nav,
 * notifications, a mobile hamburger, and sign-out. The admin console uses its own
 * distinct dark shell. Nav links are filtered by role — professional accounts
 * skip the personal vault (see navLinksFor). */
export async function AppHeader() {
  const { isProfessional, proStatus } = await getProfile()
  const links = navLinksFor(isProfessional, proStatus)

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200/80 bg-white/80 px-6 py-3.5 backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-900/70">
      <Brand />
      <div className="flex items-center gap-4">
        <nav className="hidden items-center gap-4 sm:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-slate-600 transition hover:text-indigo-600 dark:text-slate-300 dark:hover:text-indigo-400"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <NotificationsBell />
        <MobileNav links={links} />
        <form action={signout}>
          <button
            type="submit"
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Se déconnecter
          </button>
        </form>
      </div>
    </header>
  )
}
