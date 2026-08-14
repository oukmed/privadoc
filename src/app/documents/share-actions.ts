'use server'

import { revalidatePath } from 'next/cache'
import { createClient, createAdminClient } from '@/lib/supabase/server'

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

type Expiry = '24h' | '7d' | '30d' | 'never'
type Permission = 'read' | 'write'

const EXPIRY_DAYS: Record<Exclude<Expiry, 'never'>, number> = { '24h': 1, '7d': 7, '30d': 30 }
const PERMISSIONS: readonly Permission[] = ['read', 'write']

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

function expiresAtFor(expiry: Expiry): string | null {
  if (expiry === 'never') return null
  return new Date(Date.now() + EXPIRY_DAYS[expiry] * DAY_MS).toISOString()
}

function isExpired(expiresAt: string | null): boolean {
  return expiresAt !== null && new Date(expiresAt).getTime() < Date.now()
}

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
    .insert({
      document_id: documentId,
      created_by: user.id,
      expires_at: expiresAtFor(expiry),
      permission,
    })
    .select('token')
    .single()

  if (error || !data) return { error: 'Impossible de créer le lien de partage.' }

  revalidatePath('/')
  return { url: `${APP_URL}/share/${data.token}` }
}

export async function revokeShare(formData: FormData): Promise<void> {
  const documentId = String(formData.get('documentId') ?? '')
  if (!documentId) return

  const supabase = await createClient()
  // RLS guarantees a user can only delete shares they created.
  await supabase.from('shares').delete().eq('document_id', documentId)

  revalidatePath('/')
}

/**
 * Public (no auth): a recipient of a write-permission share uploads a new
 * version of the shared document. The share token is the only credential.
 */
export async function replaceSharedDocument(
  _prevState: ShareState,
  formData: FormData,
): Promise<ShareState> {
  const token = String(formData.get('token') ?? '')
  if (!token) return { error: 'Lien invalide.' }

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
    .select('permission, expires_at, document_id')
    .eq('token', token)
    .maybeSingle()

  if (!share || isExpired(share.expires_at)) return { error: 'Lien invalide ou expiré.' }
  if (share.permission !== 'write') return { error: 'Ce lien est en lecture seule.' }

  const { data: document } = await supabase
    .from('documents')
    .select('storage_path')
    .eq('id', share.document_id)
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
    .eq('id', share.document_id)

  if (updateError) return { error: 'Le document n’a pas pu être mis à jour.' }

  return { message: 'Nouvelle version enregistrée.' }
}
