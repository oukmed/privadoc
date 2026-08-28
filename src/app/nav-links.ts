/**
 * Primary navigation links, in a neutral (non-'use client') module so both the
 * server header (AppHeader) and the client menu (MobileNav) can import them.
 */
export const NAV_LINKS = [
  { href: '/', label: 'Mes documents' },
  { href: '/pro', label: 'Espace pro' },
  { href: '/requests', label: 'Mes demandes' },
  { href: '/collaborators', label: 'Collaborateurs' },
  { href: '/account', label: 'Compte' },
] as const

export type NavLink = (typeof NAV_LINKS)[number]

// Each role gets its own platform. A pro runs entirely on /pro (its own sidebar),
// so the personal vault, its sharing, and the CLIENT inbox (/requests) stay out
// of a pro's nav. A private client, conversely, never sees the pro space — their
// platform is the vault + sharing + their request inbox.
const PRO_HIDDEN_HREFS = new Set(['/', '/requests', '/collaborators'])
const CLIENT_HIDDEN_HREFS = new Set(['/pro'])

export function navLinksFor(isProfessional: boolean): NavLink[] {
  const hidden = isProfessional ? PRO_HIDDEN_HREFS : CLIENT_HIDDEN_HREFS
  return NAV_LINKS.filter((link) => !hidden.has(link.href))
}
