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

// Professional accounts run entirely on the /pro client-request workflow — they
// don't create or store personal folders, and "Mes demandes" (/requests) is the
// CLIENT inbox (requests addressed to you), which a pro is never on the receiving
// end of. All three stay out of a pro's nav; the /pro space has its own sidebar.
const PRO_HIDDEN_HREFS = new Set(['/', '/requests', '/collaborators'])

export function navLinksFor(isProfessional: boolean): NavLink[] {
  if (!isProfessional) return [...NAV_LINKS]
  return NAV_LINKS.filter((link) => !PRO_HIDDEN_HREFS.has(link.href))
}
