'use server'

import { revalidatePath } from 'next/cache'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { sendEmail, escapeHtml } from '@/lib/email'
import { RECIPIENT_ROLES, ROLE_LABELS, type RecipientRole } from '@/lib/roles'

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

function inviteEmailHtml(args: {
  inviterName: string
  inviterEmail: string
  role: RecipientRole
  url: string
  existing: boolean
  recipientEmail: string
}): string {
  const cta = args.existing ? 'Se connecter' : 'Créer mon compte'
  const hint = args.existing
    ? 'Connectez-vous avec cette adresse email pour retrouver les documents dans « Partagé avec moi ».'
    : 'Créez un compte avec cette adresse email — les documents apparaîtront automatiquement dans « Partagé avec moi ».'
  // Show the email in parentheses only when a distinct name is available.
  const inviterExtra =
    args.inviterName !== args.inviterEmail ? ` (${escapeHtml(args.inviterEmail)})` : ''
  return `
    <div style="font-family:system-ui,-apple-system,sans-serif;max-width:520px;margin:0 auto">
      <p style="font-size:18px;font-weight:600;color:#0f172a;margin:0 0 16px">Documents partagés avec vous</p>
      <p style="margin:0 0 8px;color:#334155;font-size:15px;line-height:1.6">
        <strong>${escapeHtml(args.inviterName)}</strong>${inviterExtra} vous a ajouté comme collaborateur
        (${escapeHtml(ROLE_LABELS[args.role])}) sur PrivaDoc.
      </p>
      <p style="margin:0 0 24px;color:#64748b;font-size:13px;line-height:1.6">Destinataire : ${escapeHtml(args.recipientEmail)}</p>
      <p style="margin:0 0 24px;color:#334155;font-size:15px;line-height:1.6">${hint}</p>
      <a href="${args.url}" style="display:inline-block;background:#4f46e5;color:#fff;text-decoration:none;font-weight:600;font-size:15px;padding:12px 24px;border-radius:8px">${cta}</a>
      <p style="margin:24px 0 0;color:#94a3b8;font-size:12px;word-break:break-all">${escapeHtml(args.url)}</p>
    </div>`
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
  // Grant deposit (write) permission on the shared FOLDERS when requested.
  const folderPermission = String(formData.get('canWrite') ?? '') === 'on' ? 'write' : 'read'

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

  // Link the invitee's account if it already exists — the signup trigger only
  // fires for accounts created AFTER the invite, so an already-registered user
  // would otherwise never be linked.
  // ponytail: listUsers is paginated (1000/page); fine at this scale.
  let linkedUserId = collaborator.user_id
  if (!linkedUserId) {
    const { data: list } = await createAdminClient().auth.admin.listUsers({ perPage: 1000 })
    const match = list?.users.find((u) => u.email?.toLowerCase() === email.toLowerCase())
    if (match) {
      linkedUserId = match.id
      await supabase
        .from('collaborators')
        .update({ user_id: match.id, accepted_at: new Date().toISOString() })
        .eq('id', collaborator.id)
    }
  }

  // Uniform key set on every row: PostgREST rejects a bulk insert whose objects
  // don't all share the same columns.
  const accessRows = [
    ...documentIds.map((id) => ({
      collaborator_id: collaborator.id,
      document_id: id,
      folder_id: null,
      expires_at: expiresAt,
      permission: 'read',
    })),
    ...folderIds.map((id) => ({
      collaborator_id: collaborator.id,
      document_id: null,
      folder_id: id,
      expires_at: expiresAt,
      permission: folderPermission,
    })),
  ]

  // RLS rejects any document/folder the caller does not own.
  const { error: accessError } = await supabase.from('collaborator_access').insert(accessRows)
  if (accessError) return { error: "Impossible d'accorder l'accès aux documents." }

  revalidatePath('/collaborators')

  // Notify the collaborator via our own (Gmail) mailer — the access is already
  // granted, so a delivery failure is surfaced but not fatal.
  const existing = Boolean(linkedUserId)
  // Prefill the invitee's email on the auth page; the login/signup pages also carry
  // it across their cross-link, so a wrong existing-guess is a one-click switch.
  const emailQuery = `?email=${encodeURIComponent(email)}`
  const target = existing ? `${APP_URL}/login${emailQuery}` : `${APP_URL}/signup${emailQuery}`

  // Prefer the inviter's saved name; otherwise accept one typed in the dialog and
  // persist it so it shows on future shares too. Fall back to their email.
  const { data: inviterProfile } = await supabase
    .from('profiles')
    .select('display_name')
    .eq('id', user.id)
    .maybeSingle()
  const inviterEmail = user.email ?? 'Un utilisateur'
  const savedName = inviterProfile?.display_name?.trim()
  const typedName = String(formData.get('inviterName') ?? '').trim().slice(0, 120)
  if (!savedName && typedName) {
    await supabase.from('profiles').upsert({ id: user.id, display_name: typedName })
  }
  const inviterName = savedName || typedName || inviterEmail

  const { error: emailError } = await sendEmail({
    to: email,
    subject: `${inviterName} vous partage des documents sur PrivaDoc`,
    html: inviteEmailHtml({
      inviterName,
      inviterEmail,
      role,
      url: target,
      existing,
      recipientEmail: email,
    }),
  })
  if (emailError) {
    return { error: `Accès accordé, mais l'email n'a pas pu être envoyé : ${emailError}` }
  }

  return { message: `Invitation envoyée à ${email}.` }
}

export async function resendInvite(formData: FormData): Promise<void> {
  const collaboratorId = String(formData.get('collaboratorId') ?? '').trim()
  if (!collaboratorId) return

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return

  // RLS scopes this to the owner's own collaborators. Skip anyone who already joined.
  const { data: collaborator } = await supabase
    .from('collaborators')
    .select('email, role, user_id, accepted_at')
    .eq('id', collaboratorId)
    .maybeSingle()
  if (!collaborator || collaborator.accepted_at) return

  const existing = Boolean(collaborator.user_id)
  const emailQuery = `?email=${encodeURIComponent(collaborator.email)}`
  const target = existing ? `${APP_URL}/login${emailQuery}` : `${APP_URL}/signup${emailQuery}`

  const { data: inviterProfile } = await supabase
    .from('profiles')
    .select('display_name')
    .eq('id', user.id)
    .maybeSingle()
  const inviterEmail = user.email ?? 'Un utilisateur'
  const inviterName = inviterProfile?.display_name?.trim() || inviterEmail

  await sendEmail({
    to: collaborator.email,
    subject: `${inviterName} vous partage des documents sur PrivaDoc`,
    html: inviteEmailHtml({
      inviterName,
      inviterEmail,
      role: parseRole(collaborator.role),
      url: target,
      existing,
      recipientEmail: collaborator.email,
    }),
  })

  revalidatePath('/collaborators')
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

const BUCKET = process.env.NEXT_PUBLIC_STORAGE_BUCKET ?? 'documents'
const MAX_FILE_BYTES = 20 * 1024 * 1024
const DANGEROUS_TYPES = new Set([
  'text/html',
  'application/xhtml+xml',
  'image/svg+xml',
  'application/xml',
  'text/xml',
])

function safeContentType(type: string): string {
  return !type || DANGEROUS_TYPES.has(type.toLowerCase()) ? 'application/octet-stream' : type
}

function fileExtension(name: string): string {
  const dot = name.lastIndexOf('.')
  if (dot <= 0) return ''
  const ext = name.slice(dot + 1).toLowerCase()
  return /^[a-z0-9]{1,12}$/.test(ext) ? `.${ext}` : ''
}

/**
 * A collaborator sends a document back to an owner. RLS is the gate: the storage
 * + documents INSERT policies only allow it for an active collaborator (folder
 * deposit requires write access; folderId omitted = the owner's inbox).
 */
export async function uploadForOwner(
  _prevState: CollaboratorState,
  formData: FormData,
): Promise<CollaboratorState> {
  const ownerId = String(formData.get('ownerId') ?? '').trim()
  const folderId = String(formData.get('folderId') ?? '').trim() || null
  const file = formData.get('file')

  if (!ownerId) return { error: 'Destinataire manquant.' }
  if (!(file instanceof File) || file.size === 0) return { error: 'Choisis un fichier à envoyer.' }
  if (file.size > MAX_FILE_BYTES) return { error: 'Fichier trop volumineux (max 20 Mo).' }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Session expirée, reconnecte-toi.' }

  const contentType = safeContentType(file.type)
  const path = `${ownerId}/${crypto.randomUUID()}${fileExtension(file.name)}`

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { contentType, upsert: false })
  if (uploadError) return { error: "L'envoi a échoué (accès refusé ?)." }

  const { error: insertError } = await supabase.from('documents').insert({
    owner_id: ownerId,
    uploaded_by: user.id,
    title: file.name,
    storage_path: path,
    mime_type: contentType,
    size_bytes: file.size,
    ...(folderId ? { folder_id: folderId } : {}),
  })
  if (insertError) {
    await supabase.storage.from(BUCKET).remove([path])
    return { error: "L'envoi a échoué (accès refusé ?)." }
  }

  revalidatePath('/')
  return { message: 'Document envoyé.' }
}
