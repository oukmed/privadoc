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

  const { error: insertError } = await supabase.from('documents').insert({
    owner_id: user.id,
    title: file.name,
    storage_path: path,
    mime_type: contentType,
    size_bytes: file.size,
  })

  if (insertError) {
    // Roll back the uploaded object so storage and the table stay consistent.
    await supabase.storage.from(BUCKET).remove([path])
    return { error: insertError.message }
  }

  revalidatePath('/')
  return { message: 'Document ajouté.' }
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
