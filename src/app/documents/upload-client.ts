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

export function safeContentType(type: string): string {
  return !type || DANGEROUS_CONTENT_TYPES.has(type.toLowerCase()) ? 'application/octet-stream' : type
}

export function fileExtension(name: string): string {
  const dot = name.lastIndexOf('.')
  if (dot <= 0) return ''
  const ext = name.slice(dot + 1).toLowerCase()
  return /^[a-z0-9]{1,12}$/.test(ext) ? `.${ext}` : ''
}

/**
 * Reads a Blob's real byte content. On Android, a file picked from Google
 * Drive "on demand" (not yet downloaded locally, or a native Google Doc)
 * can report `file.size === 0` even though its content is readable — the OS
 * only fetches it once something actually reads the bytes. Reading via
 * arrayBuffer() forces that fetch, so we trust the real byte length instead
 * of the (sometimes stale) `.size` property.
 */
async function readFileBytes(file: Blob): Promise<ArrayBuffer> {
  return file.arrayBuffer()
}

const EMPTY_FILE_ERROR =
  'Fichier vide. Depuis Google Drive, ouvre-le une fois pour le rendre disponible hors connexion, ou utilise « Scanner ».'

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
  if (!file) return { error: 'Fichier introuvable. Réessaie.' }

  let bytes: ArrayBuffer
  try {
    bytes = await readFileBytes(file)
  } catch {
    return { error: 'Fichier illisible. Réessaie, ou utilise « Scanner ».' }
  }
  if (bytes.byteLength === 0) return { error: EMPTY_FILE_ERROR }
  if (bytes.byteLength > MAX_FILE_BYTES) {
    return { error: 'Fichier trop volumineux (max 20 Mo).' }
  }

  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Session expirée, reconnecte-toi.' }

  const contentType = safeContentType(file.type)
  const path = `${user.id}/${crypto.randomUUID()}${fileExtension(fileName)}`
  const blob = new Blob([bytes], { type: contentType })

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, blob, { contentType, upsert: false })
  if (uploadError) return { error: 'Le téléversement a échoué : ' + uploadError.message }

  return registerDocument({
    title: fileName,
    storagePath: path,
    mimeType: contentType,
    sizeBytes: bytes.byteLength,
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
    try {
      const bytes = await readFileBytes(file)
      if (bytes.byteLength === 0) firstError ??= `${file.name} : fichier vide.`
      else if (bytes.byteLength > MAX_FILE_BYTES) firstError ??= `${file.name} : trop volumineux (max 20 Mo).`
      else {
        const contentType = safeContentType(file.type)
        const path = `${user.id}/${crypto.randomUUID()}${fileExtension(file.name)}`
        const blob = new Blob([bytes], { type: contentType })
        const { error } = await supabase.storage
          .from(BUCKET)
          .upload(path, blob, { contentType, upsert: false })
        if (error) firstError ??= `${file.name} : ${error.message}`
        else
          items.push({
            title: file.name,
            storagePath: path,
            mimeType: contentType,
            sizeBytes: bytes.byteLength,
            folderId,
          })
      }
    } catch {
      firstError ??= `${file.name} : fichier illisible.`
    }
    onProgress?.(i + 1, files.length)
  }

  if (items.length === 0) return { added: 0, error: firstError ?? 'Aucun fichier valide.' }

  const result = await registerDocuments(items)
  if (result.error) return { added: 0, error: result.error }
  return { added: result.added, error: firstError }
}
