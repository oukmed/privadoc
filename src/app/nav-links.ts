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
