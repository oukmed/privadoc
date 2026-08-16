'use server'

import { revalidatePath } from 'next/cache'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { RECIPIENT_ROLES, type RecipientRole } from '@/lib/roles'

export type CollaboratorState = { error?: string; message?: string } | undefined

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? ''
const DAY_MS = 24 * 60 * 60 * 1000
const INVITE_RATE_LIMIT_PER_HOUR = 20

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

type Expiry = 'never' | '30d' | '90d' | '365d'
const EXPIRY_DAYS: Record<Exclude<Expiry, 'never'>, number> = { '30d': 30, '90d': 90, '365d': 365 }

function parseExpiry(value: string): Expiry {
  return value === '30d' || value === '90d' || value === '365d' ? value : 'never'
}

function expiresAtFor(expiry: Expiry): string | null {
  if (expiry === 'never') return null
  return new Date(Date.now() + EXPIRY_DAYS[expiry] * DAY_MS).toISOString()
}

function parseRole(value: string): RecipientRole {
  return (RECIPIENT_ROLES as readonly string[]).includes(value) ? (value as RecipientRole) : 'autre'
}

export async function inviteCollaborator(
  _prevState: CollaboratorState,
  formData: FormData,
): Promise<CollaboratorState> {
  const email = String(formData.get('email') ?? '').trim()
  if (!EMAIL_RE.test(email)) return { error: 'Adresse email invalide.' }

  const role = parseRole(String(formData.get('role') ?? ''))
  const expiry = parseExpiry(String(formData.get('expiry') ?? ''))
  const expiresAt = expiresAtFor(expiry)

  const documentIds = [...new Set(formData.getAll('documentIds').map(String).filter(Boolean))]
  const folderIds = [...new Set(formData.getAll('folderIds').map(String).filter(Boolean))]
  if (documentIds.length === 0 && folderIds.length === 0) {
    return { error: 'Sélectionne au moins un document ou un dossier.' }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Session expirée, reconnecte-toi.' }

  // Rate limit: cap invitations per user per hour. Counted in the DB (RLS-scoped
  // to the owner), so it survives restarts.
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
  const { count } = await supabase
    .from('collaborators')
    .select('id', { count: 'exact', head: true })
    .gte('created_at', oneHourAgo)
  if ((count ?? 0) >= INVITE_RATE_LIMIT_PER_HOUR) {
    return { error: 'Limite d’invitations atteinte (réessaie dans une heure).' }
  }

  // Upsert the collaborator (owner_id set explicitly for the WITH CHECK). A repeat
  // invite to the same email just updates the role.
  const { data: collaborator, error: upsertError } = await supabase
    .from('collaborators')
    .upsert({ owner_id: user.id, email, role }, { onConflict: 'owner_id,email' })
    .select('id, user_id')
    .single()

  if (upsertError || !collaborator) return { error: "Impossible d'enregistrer le collaborateur." }

  // Send the auth invite only when the email has no account yet. An
  // "already registered" response is soft-handled: the access rows still apply.
  if (!collaborator.user_id) {
    const { error: inviteError } = await createAdminClient().auth.admin.inviteUserByEmail(email, {
      redirectTo: `${APP_URL}/login`,
    })
    if (inviteError && !/already/i.test(inviteError.message)) {
      return { error: "L'invitation n'a pas pu être envoyée." }
    }
  }

  const accessRows = [
    ...documentIds.map((id) => ({
      collaborator_id: collaborator.id,
      document_id: id,
      expires_at: expiresAt,
    })),
    ...folderIds.map((id) => ({
      collaborator_id: collaborator.id,
      folder_id: id,
      expires_at: expiresAt,
    })),
  ]

  // RLS rejects any document/folder the caller does not own.
  const { error: accessError } = await supabase.from('collaborator_access').insert(accessRows)
  if (accessError) return { error: "Impossible d'accorder l'accès aux documents." }

  revalidatePath('/collaborators')
  return { message: `Invitation envoyée à ${email}.` }
}

export async function revokeAccess(formData: FormData): Promise<void> {
  const accessId = String(formData.get('accessId') ?? '').trim()
  if (!accessId) return

  const supabase = await createClient()
  // RLS restricts deletion to access rows owned by the caller.
  await supabase.from('collaborator_access').delete().eq('id', accessId)

  revalidatePath('/collaborators')
}

export async function removeCollaborator(formData: FormData): Promise<void> {
  const collaboratorId = String(formData.get('collaboratorId') ?? '').trim()
  if (!collaboratorId) return

  const supabase = await createClient()
  // RLS restricts deletion to the owner; access rows cascade.
  await supabase.from('collaborators').delete().eq('id', collaboratorId)

  revalidatePath('/collaborators')
}
