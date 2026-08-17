import { zipSync } from 'fflate'
import { createClient } from '@/lib/supabase/server'

const BUCKET = process.env.NEXT_PUBLIC_STORAGE_BUCKET ?? 'documents'
const MAX_FILES = 200
const MAX_TOTAL_BYTES = 200 * 1024 * 1024 // 200 MB — zipSync is in-memory

function jsonError(message: string, status: number): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

/** Sanitize a single path segment (folder name or filename). */
function sanitizeSegment(name: string): string {
  const base = name.replace(/[/\\]+/g, '_').trim()
  return base || 'document'
}

/** Ensure a unique zip entry path by inserting " (2)", " (3)", … before the extension. */
function uniquePath(path: string, used: Set<string>): string {
  if (!used.has(path)) {
    used.add(path)
    return path
  }
  const slash = path.lastIndexOf('/')
  const dir = slash >= 0 ? path.slice(0, slash + 1) : ''
  const file = slash >= 0 ? path.slice(slash + 1) : path
  const dot = file.lastIndexOf('.')
  const stem = dot > 0 ? file.slice(0, dot) : file
  const ext = dot > 0 ? file.slice(dot) : ''
  let counter = 2
  let candidate = `${dir}${stem} (${counter})${ext}`
  while (used.has(candidate)) {
    counter += 1
    candidate = `${dir}${stem} (${counter})${ext}`
  }
  used.add(candidate)
  return candidate
}

function parseStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.filter((v): v is string => typeof v === 'string' && v.length > 0)
}

interface FolderRow {
  id: string
  name: string
  parent_id: string | null
}

/** Map every selected folder (and its descendants) to its relative zip path. */
function collectFolderPaths(folders: FolderRow[], selected: string[]): Map<string, string> {
  const byId = new Map(folders.map((f) => [f.id, f]))
  const paths = new Map<string, string>()
  const walk = (id: string, prefix: string): void => {
    const folder = byId.get(id)
    if (!folder || paths.has(id)) return
    const path = prefix ? `${prefix}/${sanitizeSegment(folder.name)}` : sanitizeSegment(folder.name)
    paths.set(id, path)
    for (const child of folders) if (child.parent_id === id) walk(child.id, path)
  }
  for (const id of selected) walk(id, '')
  return paths
}

export async function POST(request: Request): Promise<Response> {
  let ids: string[] = []
  let folderIds: string[] = []
  try {
    const body = await request.json()
    ids = parseStringArray((body as { ids?: unknown }).ids)
    folderIds = parseStringArray((body as { folderIds?: unknown }).folderIds)
  } catch {
    return jsonError('Requête invalide.', 400)
  }
  if (ids.length === 0 && folderIds.length === 0) {
    return jsonError('Aucun élément sélectionné.', 400)
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return jsonError('Non autorisé.', 401)

  // { storage_path, zipPath } to fetch and archive. RLS returns only the caller's rows.
  const targets: { storagePath: string; zipPath: string }[] = []
  const usedPaths = new Set<string>()

  // Loose documents → at the archive root.
  if (ids.length > 0) {
    const { data, error } = await supabase.from('documents').select('title, storage_path').in('id', ids)
    if (error) return jsonError('Erreur lors de la récupération des documents.', 500)
    for (const doc of data ?? []) {
      targets.push({ storagePath: doc.storage_path, zipPath: uniquePath(sanitizeSegment(doc.title), usedPaths) })
    }
  }

  // Selected folders → their whole subtree, keeping the folder structure.
  if (folderIds.length > 0) {
    const { data: folders, error: fErr } = await supabase.from('folders').select('id, name, parent_id')
    if (fErr) return jsonError('Erreur lors de la récupération des dossiers.', 500)
    const folderPaths = collectFolderPaths(folders ?? [], folderIds)
    if (folderPaths.size > 0) {
      const { data: docs, error: dErr } = await supabase
        .from('documents')
        .select('title, storage_path, folder_id')
        .in('folder_id', [...folderPaths.keys()])
      if (dErr) return jsonError('Erreur lors de la récupération des documents.', 500)
      for (const doc of docs ?? []) {
        const prefix = doc.folder_id ? folderPaths.get(doc.folder_id) : undefined
        const base = prefix ? `${prefix}/${sanitizeSegment(doc.title)}` : sanitizeSegment(doc.title)
        targets.push({ storagePath: doc.storage_path, zipPath: uniquePath(base, usedPaths) })
      }
    }
  }

  if (targets.length === 0) return jsonError('Aucun document trouvé.', 404)
  if (targets.length > MAX_FILES) return jsonError(`Maximum ${MAX_FILES} fichiers par archive.`, 400)

  const entries: Record<string, Uint8Array> = {}
  let totalBytes = 0
  for (const target of targets) {
    const { data: blob } = await supabase.storage.from(BUCKET).download(target.storagePath)
    if (!blob) continue
    totalBytes += blob.size
    if (totalBytes > MAX_TOTAL_BYTES) {
      return jsonError('Sélection trop volumineuse (max 200 Mo). Réduis la sélection.', 413)
    }
    entries[target.zipPath] = new Uint8Array(await blob.arrayBuffer())
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
