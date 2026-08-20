'use server'

import { revalidatePath } from 'next/cache'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { sendEmail, escapeHtml } from '@/lib/email'

export type ShareState =
  | {
      error?: string
      message?: string
      url?: string
    }
  | undefined

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? ''
const BUCKET = process.env.NEXT_PUBLIC_STORAGE_BUCKET ?? 'documents'
const MAX_FILE_BYTES = 20 * 1024 * 1024 // 20 MB
const DAY_MS = 24 * 60 * 60 * 1000
const EMAIL_RATE_LIMIT_PER_HOUR = 20

type Expiry = '24h' | '7d' | '30d' | 'never'
type Permission = 'read' | 'write'
type AuthedClient = Awaited<ReturnType<typeof createClient>>
type AdminClient = ReturnType<typeof createAdminClient>

const EXPIRY_DAYS: Record<Exclude<Expiry, 'never'>, number> = { '24h': 1, '7d': 7, '30d': 30 }
const PERMISSIONS: readonly Permission[] = ['read', 'write']

const RECIPIENT_ROLES = [
  'avocat',
  'comptable',
  'banque',
  'notaire',
  'administration',
  'autre',
] as const
type RecipientRole = (typeof RECIPIENT_ROLES)[number]

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const EXPIRY_LABELS: Record<Expiry, string> = {
  '24h': 'Ce lien expire dans 24 heures.',
  '7d': 'Ce lien expire dans 7 jours.',
  '30d': 'Ce lien expire dans 30 jours.',
  never: "Ce lien n'expire pas.",
}

// Content types a browser may execute inline (stored-XSS risk via a shared file),
// coerced to a generic binary type so signed URLs never serve active content.
const DANGEROUS_CONTENT_TYPES = new Set([
  'text/html',
  'application/xhtml+xml',
  'image/svg+xml',
  'application/xml',
  'text/xml',
])

function safeContentType(type: string): string {
  return !type || DANGEROUS_CONTENT_TYPES.has(type.toLowerCase()) ? 'application/octet-stream' : type
}

function parseExpiry(value: string): Expiry {
  return value === '24h' || value === '30d' || value === 'never' || value === '7d' ? value : '7d'
}

function parsePermission(value: string): Permission {
  return (PERMISSIONS as readonly string[]).includes(value) ? (value as Permission) : 'read'
}

function parseRecipientRole(value: string): RecipientRole {
  return (RECIPIENT_ROLES as readonly string[]).includes(value) ? (value as RecipientRole) : 'autre'
}

function expiresAtFor(expiry: Expiry): string | null {
  if (expiry === 'never') return null
  return new Date(Date.now() + EXPIRY_DAYS[expiry] * DAY_MS).toISOString()
}

function isExpired(expiresAt: string | null): boolean {
  return expiresAt !== null && new Date(expiresAt).getTime() < Date.now()
}

interface ShareInput {
  documentIds: string[]
  expiry: Expiry
  permission: Permission
  recipientEmail?: string | null
  recipientRole?: RecipientRole | null
}

interface CreatedShare {
  token: string
  url: string
}

/** Returns the subset of ids that exist and are owned by the caller. */
async function ownedDocumentIds(
  supabase: AuthedClient,
  userId: string,
  ids: string[],
): Promise<string[]> {
  const unique = [...new Set(ids.filter(Boolean))]
  if (unique.length === 0) return []
  const { data } = await supabase
    .from('documents')
    .select('id')
    .eq('owner_id', userId)
    .in('id', unique)
  return (data ?? []).map((row) => row.id)
}

/** Inserts a multi-document share row + its junction rows, rolling back on failure. */
async function createMultiDocShare(
  supabase: AuthedClient,
  userId: string,
  input: ShareInput,
): Promise<{ share?: CreatedShare; error?: string }> {
  const ids = await ownedDocumentIds(supabase, userId, input.documentIds)
  if (ids.length === 0) return { error: 'Aucun document valide sélectionné.' }

  const { data: share, error } = await supabase
    .from('shares')
    .insert({
      document_id: null,
      created_by: userId,
      expires_at: expiresAtFor(input.expiry),
      permission: input.permission,
      recipient_email: input.recipientEmail ?? null,
      recipient_role: input.recipientRole ?? null,
    })
    .select('id, token')
    .single()

  if (error || !share) return { error: 'Impossible de créer le lien de partage.' }

  const rows = ids.map((id) => ({ share_id: share.id, document_id: id }))
  const { error: junctionError } = await supabase.from('share_documents').insert(rows)
  if (junctionError) {
    await supabase.from('shares').delete().eq('id', share.id)
    return { error: 'Impossible de créer le lien de partage.' }
  }

  return { share: { token: share.token, url: `${APP_URL}/share/${share.token}` } }
}

function shareEmailHtml(args: { sender: string; message: string; url: string; expiry: Expiry }): string {
  const messageBlock = args.message.trim()
    ? `<p style="white-space:pre-wrap;margin:0 0 24px;color:#334155;font-size:15px;line-height:1.6">${escapeHtml(args.message)}</p>`
    : ''
  return `<div style="font-family:system-ui,-apple-system,Segoe UI,sans-serif;max-width:520px;margin:0 auto;padding:24px">
    <p style="font-size:18px;font-weight:600;color:#0f172a;margin:0 0 8px">Documents partagés avec vous</p>
    <p style="margin:0 0 16px;color:#334155;font-size:15px">Partagé par <strong>${escapeHtml(args.sender)}</strong></p>
    ${messageBlock}
    <a href="${args.url}" style="display:inline-block;background:#4f46e5;color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;padding:12px 24px;border-radius:8px">Voir les documents</a>
    <p style="margin:24px 0 0;color:#64748b;font-size:13px">${EXPIRY_LABELS[args.expiry]}</p>
    <p style="margin:8px 0 0;color:#94a3b8;font-size:12px;word-break:break-all">${escapeHtml(args.url)}</p>
  </div>`
}

/**
 * Single-document share link (legacy). Kept for the current share button UI.
 */
export async function createShare(_prevState: ShareState, formData: FormData): Promise<ShareState> {
  const documentId = String(formData.get('documentId') ?? '')
  if (!documentId) return { error: 'Document introuvable.' }

  const expiry = parseExpiry(String(formData.get('expiry') ?? ''))
  const permission = parsePermission(String(formData.get('permission') ?? ''))

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Session expirée, reconnecte-toi.' }

  // RLS enforces that the caller owns the referenced document.
  const { data, error } = await supabase
    .from('shares')
    .insert({ document_id: documentId, created_by: user.id, expires_at: expiresAtFor(expiry), permission })
    .select('token')
    .single()

  if (error || !data) return { error: 'Impossible de créer le lien de partage.' }

  revalidatePath('/')
  return { url: `${APP_URL}/share/${data.token}` }
}

/**
 * Multi-document share link. Reads `documentIds` (repeated field), builds one
 * share row + junction rows and returns the public URL.
 */
export async function createShareLink(
  _prevState: ShareState,
  formData: FormData,
): Promise<ShareState> {
  const documentIds = formData.getAll('documentIds').map(String)
  const expiry = parseExpiry(String(formData.get('expiry') ?? ''))
  const permission = parsePermission(String(formData.get('permission') ?? ''))

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Session expirée, reconnecte-toi.' }

  const { share, error } = await createMultiDocShare(supabase, user.id, {
    documentIds,
    expiry,
    permission,
  })
  if (!share) return { error: error ?? 'Impossible de créer le lien de partage.' }

  revalidatePath('/')
  return { url: share.url }
}

/**
 * Multi-document share sent by email to an external recipient (read-only).
 * The share is always created; an email-delivery failure is surfaced but does
 * not discard the share.
 */
export async function sendShareEmail(
  _prevState: ShareState,
  formData: FormData,
): Promise<ShareState> {
  const documentIds = formData.getAll('documentIds').map(String)
  const expiry = parseExpiry(String(formData.get('expiry') ?? ''))
  const recipientEmail = String(formData.get('recipientEmail') ?? '').trim()
  const recipientRole = parseRecipientRole(String(formData.get('recipientRole') ?? ''))
  const subject = String(formData.get('subject') ?? '').trim()
  const message = String(formData.get('message') ?? '')

  if (!EMAIL_RE.test(recipientEmail)) return { error: 'Adresse email invalide.' }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Session expirée, reconnecte-toi.' }

  // Rate limit: cap outgoing share emails per user per hour to prevent abuse of
  // the sending account. Counted in the DB (RLS-scoped), so it survives restarts.
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
  const { count } = await supabase
    .from('shares')
    .select('id', { count: 'exact', head: true })
    .not('recipient_email', 'is', null)
    .gte('created_at', oneHourAgo)
  if ((count ?? 0) >= EMAIL_RATE_LIMIT_PER_HOUR) {
    return { error: 'Limite d’envoi atteinte (réessaie dans une heure).' }
  }

  const { share, error } = await createMultiDocShare(supabase, user.id, {
    documentIds,
    expiry,
    permission: 'read',
    recipientEmail,
    recipientRole,
  })
  if (!share) return { error: error ?? 'Impossible de créer le lien de partage.' }

  revalidatePath('/')

  // Sender identity: saved name, else a name typed in the dialog (persisted for
  // next time), else the email.
  const { data: senderProfile } = await supabase
    .from('profiles')
    .select('display_name')
    .eq('id', user.id)
    .maybeSingle()
  const senderEmail = user.email ?? 'Un utilisateur'
  const savedName = senderProfile?.display_name?.trim()
  const typedName = String(formData.get('senderName') ?? '').trim().slice(0, 120)
  if (!savedName && typedName) {
    await supabase.from('profiles').upsert({ id: user.id, display_name: typedName })
  }
  const sender = savedName || typedName || senderEmail

  const { error: emailError } = await sendEmail({
    to: recipientEmail,
    subject: subject || 'Documents partagés via PrivaDoc',
    html: shareEmailHtml({ sender, message, url: share.url, expiry }),
  })
  if (emailError) return { error: emailError }

  return { message: `Email envoyé à ${recipientEmail}.` }
}

export async function revokeShare(formData: FormData): Promise<void> {
  const shareId = String(formData.get('shareId') ?? '')
  const documentId = String(formData.get('documentId') ?? '')

  const supabase = await createClient()
  // RLS guarantees a user can only delete shares they created.
  if (shareId) {
    await supabase.from('shares').delete().eq('id', shareId)
  } else if (documentId) {
    await supabase.from('shares').delete().eq('document_id', documentId)
  } else {
    return
  }

  revalidatePath('/')
}

/** True when `documentId` is attached to the share (junction row or legacy column). */
async function shareIncludesDocument(
  supabase: AdminClient,
  share: { id: string; document_id: string | null },
  documentId: string,
): Promise<boolean> {
  if (share.document_id === documentId) return true
  const { data } = await supabase
    .from('share_documents')
    .select('document_id')
    .eq('share_id', share.id)
    .eq('document_id', documentId)
    .maybeSingle()
  return Boolean(data)
}

/**
 * Public (no auth): a recipient of a write-permission share uploads a new
 * version of one shared document. The share token is the only credential.
 */
export async function replaceSharedDocument(
  _prevState: ShareState,
  formData: FormData,
): Promise<ShareState> {
  const token = String(formData.get('token') ?? '')
  const documentId = String(formData.get('documentId') ?? '')
  if (!token || !documentId) return { error: 'Lien invalide.' }

  const file = formData.get('file')
  if (!(file instanceof File) || file.size === 0) {
    return { error: 'Choisis un fichier à téléverser.' }
  }
  if (file.size > MAX_FILE_BYTES) {
    return { error: 'Fichier trop volumineux (max 20 Mo).' }
  }

  const supabase = createAdminClient()

  const { data: share } = await supabase
    .from('shares')
    .select('id, permission, expires_at, document_id')
    .eq('token', token)
    .maybeSingle()

  if (!share || isExpired(share.expires_at)) return { error: 'Lien invalide ou expiré.' }
  if (share.permission !== 'write') return { error: 'Ce lien est en lecture seule.' }
  if (!(await shareIncludesDocument(supabase, share, documentId))) {
    return { error: 'Document introuvable.' }
  }

  const { data: document } = await supabase
    .from('documents')
    .select('storage_path')
    .eq('id', documentId)
    .maybeSingle()

  if (!document) return { error: 'Document introuvable.' }

  const contentType = safeContentType(file.type)
  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(document.storage_path, file, { contentType, upsert: true })
  if (uploadError) return { error: 'Le téléversement a échoué.' }

  const { error: updateError } = await supabase
    .from('documents')
    .update({
      size_bytes: file.size,
      mime_type: contentType,
      updated_at: new Date().toISOString(),
    })
    .eq('id', documentId)

  if (updateError) return { error: 'Le document n’a pas pu être mis à jour.' }

  return { message: 'Nouvelle version enregistrée.' }
}
