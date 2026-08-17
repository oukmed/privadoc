import { createClient } from '@/lib/supabase/client'
import { registerDocument, registerDocuments } from '@/app/documents/actions'

const BUCKET = process.env.NEXT_PUBLIC_STORAGE_BUCKET ?? 'documents'
const MAX_FILE_BYTES = 20 * 1024 * 1024 // 20 MB

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

function fileExtension(name: string): string {
  const dot = name.lastIndexOf('.')
  if (dot <= 0) return ''
  const ext = name.slice(dot + 1).toLowerCase()
  return /^[a-z0-9]{1,12}$/.test(ext) ? `.${ext}` : ''
}

/**
 * Uploads a Blob straight from the browser to Supabase Storage (owner folder,
 * RLS-enforced), then records the documents row. Used by the file picker and the
 * scanner. Returns a French error, or {} on success.
 */
export async function uploadDocumentFile(
  file: Blob,
  fileName: string,
  folderId?: string,
): Promise<{ error?: string }> {
  if (!file || file.size === 0) {
    return {
      error:
        'Fichier vide ou introuvable. Depuis Google Drive, télécharge-le d’abord sur le téléphone, ou utilise « Scanner ».',
    }
  }
  if (file.size > MAX_FILE_BYTES) {
    return { error: 'Fichier trop volumineux (max 20 Mo).' }
  }

  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Session expirée, reconnecte-toi.' }

  const contentType = safeContentType(file.type)
  const path = `${user.id}/${crypto.randomUUID()}${fileExtension(fileName)}`

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { contentType, upsert: false })
  if (uploadError) return { error: 'Le téléversement a échoué : ' + uploadError.message }

  return registerDocument({
    title: fileName,
    storagePath: path,
    mimeType: contentType,
    sizeBytes: file.size,
    folderId,
  })
}

/**
 * Upload many files: push each to Storage from the browser, then record ALL
 * rows in a single server action (one auth round-trip). Returns how many were
 * added and the first error (if any).
 */
export async function uploadDocumentFiles(
  files: File[],
  folderId: string | undefined,
  onProgress?: (done: number, total: number) => void,
): Promise<{ added: number; error?: string }> {
  if (files.length === 0) return { added: 0 }

  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { added: 0, error: 'Session expirée, reconnecte-toi.' }

  const items: {
    title: string
    storagePath: string
    mimeType: string
    sizeBytes: number
    folderId?: string | null
  }[] = []
  let firstError: string | undefined

  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    if (file.size === 0) firstError ??= `${file.name} : fichier vide ou introuvable.`
    else if (file.size > MAX_FILE_BYTES) firstError ??= `${file.name} : trop volumineux (max 20 Mo).`
    else {
      const contentType = safeContentType(file.type)
      const path = `${user.id}/${crypto.randomUUID()}${fileExtension(file.name)}`
      const { error } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, { contentType, upsert: false })
      if (error) firstError ??= `${file.name} : ${error.message}`
      else
        items.push({
          title: file.name,
          storagePath: path,
          mimeType: contentType,
          sizeBytes: file.size,
          folderId,
        })
    }
    onProgress?.(i + 1, files.length)
  }

  if (items.length === 0) return { added: 0, error: firstError ?? 'Aucun fichier valide.' }

  const result = await registerDocuments(items)
  if (result.error) return { added: 0, error: result.error }
  return { added: result.added, error: firstError }
}
