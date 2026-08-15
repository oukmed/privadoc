import { zipSync } from 'fflate'
import { createClient } from '@/lib/supabase/server'

const BUCKET = process.env.NEXT_PUBLIC_STORAGE_BUCKET ?? 'documents'
const MAX_FILES = 50
const MAX_TOTAL_BYTES = 200 * 1024 * 1024 // 200 MB — zipSync is in-memory

function jsonError(message: string, status: number): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

/** Strip path separators so an archive entry can never escape its folder. */
function sanitizeName(name: string): string {
  const base = name.replace(/[/\\]+/g, '_').trim()
  return base || 'document'
}

/** Ensure a unique entry name by inserting " (2)", " (3)", … before the extension. */
function uniqueName(name: string, used: Set<string>): string {
  if (!used.has(name)) {
    used.add(name)
    return name
  }
  const dot = name.lastIndexOf('.')
  const stem = dot > 0 ? name.slice(0, dot) : name
  const ext = dot > 0 ? name.slice(dot) : ''
  let counter = 2
  let candidate = `${stem} (${counter})${ext}`
  while (used.has(candidate)) {
    counter += 1
    candidate = `${stem} (${counter})${ext}`
  }
  used.add(candidate)
  return candidate
}

function parseIds(body: unknown): string[] | null {
  if (typeof body !== 'object' || body === null) return null
  const ids = (body as { ids?: unknown }).ids
  if (!Array.isArray(ids) || ids.length === 0) return null
  if (!ids.every((id): id is string => typeof id === 'string' && id.length > 0)) return null
  return ids
}

export async function POST(request: Request): Promise<Response> {
  let ids: string[] | null
  try {
    ids = parseIds(await request.json())
  } catch {
    return jsonError('Requête invalide.', 400)
  }
  if (!ids) return jsonError('Aucun document sélectionné.', 400)
  if (ids.length > MAX_FILES) return jsonError(`Maximum ${MAX_FILES} fichiers par archive.`, 400)

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return jsonError('Non autorisé.', 401)

  // RLS returns only the caller's documents.
  const { data: documents, error } = await supabase
    .from('documents')
    .select('title, storage_path')
    .in('id', ids)
  if (error) return jsonError('Erreur lors de la récupération des documents.', 500)
  if (!documents || documents.length === 0) return jsonError('Aucun document trouvé.', 404)

  const used = new Set<string>()
  const entries: Record<string, Uint8Array> = {}
  let totalBytes = 0
  for (const doc of documents) {
    const { data: blob } = await supabase.storage.from(BUCKET).download(doc.storage_path)
    if (!blob) continue
    totalBytes += blob.size
    if (totalBytes > MAX_TOTAL_BYTES) {
      return jsonError('Sélection trop volumineuse (max 200 Mo). Réduis la sélection.', 413)
    }
    const bytes = new Uint8Array(await blob.arrayBuffer())
    entries[uniqueName(sanitizeName(doc.title), used)] = bytes
  }

  if (Object.keys(entries).length === 0) {
    return jsonError('Aucun document téléchargeable.', 502)
  }

  const zipData = zipSync(entries, { level: 6 })
  const today = new Date().toISOString().slice(0, 10)
  return new Response(zipData, {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="privadoc-${today}.zip"`,
    },
  })
}
