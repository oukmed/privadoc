import { createClient } from '@/lib/supabase/client'
import { registerDocument } from '@/app/documents/actions'

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
