/**
 * Recipient roles for external collaborators (and email shares).
 * Single source of truth reused by the invite dialog and the collaborators page.
 */
export const RECIPIENT_ROLES = [
  'avocat',
  'comptable',
  'banque',
  'notaire',
  'administration',
  'autre',
  'consulat',
  'traducteur',
] as const

export type RecipientRole = (typeof RECIPIENT_ROLES)[number]

export const ROLE_LABELS: Record<RecipientRole, string> = {
  avocat: 'Avocat',
  comptable: 'Comptable',
  banque: 'Banque',
  notaire: 'Notaire',
  administration: 'Administration',
  autre: 'Autre',
  consulat: 'Consulat',
  traducteur: 'Traducteur assermenté',
}
