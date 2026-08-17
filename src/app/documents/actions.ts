'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export type UploadState =
  | {
      error?: string
      message?: string
    }
  | undefined

const BUCKET = process.env.NEXT_PUBLIC_STORAGE_BUCKET ?? 'documents'
const MAX_FILE_BYTES = 20 * 1024 * 1024 // 20 MB

// Content types a browser may execute inline (stored-XSS risk via a shared file).
// These are coerced to a generic binary type so signed URLs never serve active content.
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

/** Extract a short, alphanumeric extension only — never path separators or `..`. */
function fileExtension(name: string): string {
  const dot = name.lastIndexOf('.')
  if (dot <= 0) return ''
  const ext = name.slice(dot + 1).toLowerCase()
  return /^[a-z0-9]{1,12}$/.test(ext) ? `.${ext}` : ''
}

export async function uploadDocument(_prevState: UploadState, formData: FormData): Promise<UploadState> {
  const file = formData.get('file')

  if (!(file instanceof File) || file.size === 0) {
    return { error: 'Choisis un fichier à téléverser.' }
  }
  if (file.size > MAX_FILE_BYTES) {
    return { error: 'Fichier trop volumineux (max 20 Mo).' }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Session expirée, reconnecte-toi.' }

  const contentType = safeContentType(file.type)
  const path = `${user.id}/${crypto.randomUUID()}${fileExtension(file.name)}`

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { contentType, upsert: false })
  if (uploadError) return { error: uploadError.message }

  // Optional target folder — RLS rejects a folder the caller does not own.
  const folderId = String(formData.get('folderId') ?? '').trim()

  const { error: insertError } = await supabase.from('documents').insert({
    owner_id: user.id,
    title: file.name,
    storage_path: path,
    mime_type: contentType,
    size_bytes: file.size,
    ...(folderId ? { folder_id: folderId } : {}),
  })

  if (insertError) {
    // Roll back the uploaded object so storage and the table stay consistent.
    await supabase.storage.from(BUCKET).remove([path])
    return { error: insertError.message }
  }

  revalidatePath('/')
  return { message: 'Document ajouté.' }
}

/**
 * Registers a documents row after the BROWSER uploaded the file straight to
 * Supabase Storage (bypasses the Vercel function size/timeout limits). The file
 * never transits the server here — only its metadata.
 */
export async function registerDocument(input: {
  title: string
  storagePath: string
  mimeType: string
  sizeBytes: number
  folderId?: string | null
}): Promise<{ error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Session expirée, reconnecte-toi.' }

  // The object must live under the caller's own folder prefix.
  if (!input.storagePath.startsWith(`${user.id}/`)) return { error: 'Chemin invalide.' }

  const { error } = await supabase.from('documents').insert({
    owner_id: user.id,
    title: input.title.slice(0, 255),
    storage_path: input.storagePath,
    mime_type: input.mimeType,
    size_bytes: input.sizeBytes,
    ...(input.folderId ? { folder_id: input.folderId } : {}),
  })

  if (error) {
    // Roll back the uploaded object so storage and the table stay consistent.
    await supabase.storage.from(BUCKET).remove([input.storagePath])
    return { error: error.message }
  }

  revalidatePath('/')
  return {}
}

/**
 * Batch version: records many documents in ONE server action / ONE insert.
 * Avoids firing many rapid authenticated actions (refresh-token rotation races)
 * that can make auth.uid() briefly null and trip RLS.
 */
export async function registerDocuments(
  inputs: {
    title: string
    storagePath: string
    mimeType: string
    sizeBytes: number
    folderId?: string | null
  }[],
): Promise<{ error?: string; added: number }> {
  if (inputs.length === 0) return { added: 0 }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Session expirée, reconnecte-toi.', added: 0 }

  // Uniform key set on every row (PostgREST bulk-insert requirement).
  const rows = inputs
    .filter((i) => i.storagePath.startsWith(`${user.id}/`))
    .map((i) => ({
      owner_id: user.id,
      title: i.title.slice(0, 255),
      storage_path: i.storagePath,
      mime_type: i.mimeType,
      size_bytes: i.sizeBytes,
      folder_id: i.folderId ?? null,
    }))
  if (rows.length === 0) return { error: 'Chemin invalide.', added: 0 }

  const { error } = await supabase.from('documents').insert(rows)
  if (error) {
    await supabase.storage.from(BUCKET).remove(rows.map((r) => r.storage_path))
    return { error: error.message, added: 0 }
  }

  revalidatePath('/')
  return { added: rows.length }
}

export async function deleteSelection(formData: FormData): Promise<void> {
  const documentIds = formData.getAll('documentIds').map(String).filter(Boolean)
  const folderIds = formData.getAll('folderIds').map(String).filter(Boolean)
  if (documentIds.length === 0 && folderIds.length === 0) return

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return

  if (documentIds.length > 0) {
    // Delete only the caller's rows; re-derive storage paths from the deleted
    // rows rather than trusting any client-supplied path.
    const { data: deleted } = await supabase
      .from('documents')
      .delete()
      .in('id', documentIds)
      .eq('owner_id', user.id)
      .select('storage_path')

    const paths = (deleted ?? []).map((row) => row.storage_path).filter(Boolean)
    if (paths.length > 0) {
      await supabase.storage.from(BUCKET).remove(paths)
    }
  }

  if (folderIds.length > 0) {
    // RLS restricts deletion to the caller's folders; children cascade and
    // documents' folder_id is set null by the FK.
    await supabase.from('folders').delete().in('id', folderIds)
  }

  revalidatePath('/')
}

export async function deleteDocument(formData: FormData): Promise<void> {
  const id = String(formData.get('id') ?? '')
  if (!id) return

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return

  // Delete only if the row belongs to the caller, and read back the real
  // storage path from the deleted row instead of trusting any client value.
  const { data: deleted } = await supabase
    .from('documents')
    .delete()
    .eq('id', id)
    .eq('owner_id', user.id)
    .select('storage_path')
    .single()

  if (deleted?.storage_path) {
    await supabase.storage.from(BUCKET).remove([deleted.storage_path])
  }

  revalidatePath('/')
}

export async function renameDocument(formData: FormData): Promise<void> {
  const id = String(formData.get('id') ?? '')
  const title = String(formData.get('name') ?? '').trim()
  if (!id || title.length < 1 || title.length > 255) return

  const supabase = await createClient()
  // RLS restricts the update to the caller's own document.
  await supabase.from('documents').update({ title }).eq('id', id)

  revalidatePath('/')
}
