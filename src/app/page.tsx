import { Suspense } from 'react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { signout } from '@/app/auth/actions'
import { deleteDocument } from '@/app/documents/actions'
import { deleteFolder } from '@/app/folders/actions'
import { UploadForm } from '@/app/documents/upload-form'
import { NewFolderButton } from '@/app/documents/new-folder-button'
import { SearchSort } from '@/app/documents/search-sort'
import { ConfirmDialog } from '@/app/documents/confirm-dialog'
import { ShareButton } from '@/app/documents/share-button'

const BUCKET = process.env.NEXT_PUBLIC_STORAGE_BUCKET ?? 'documents'
const SIGNED_URL_TTL = 60 * 5 // 5 minutes

type SortKey = 'recent' | 'old' | 'az' | 'za'
const SORTS: Record<SortKey, { column: 'created_at' | 'title'; ascending: boolean }> = {
  recent: { column: 'created_at', ascending: false },
  old: { column: 'created_at', ascending: true },
  az: { column: 'title', ascending: true },
  za: { column: 'title', ascending: false },
}

interface Folder {
  id: string
  name: string
  parent_id: string | null
}

function param(value: string | string[] | undefined): string {
  return typeof value === 'string' ? value : ''
}

function formatBytes(bytes: number | null): string {
  if (!bytes) return '—'
  const units = ['B', 'KB', 'MB', 'GB']
  let value = bytes
  let unit = 0
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024
    unit++
  }
  return `${value.toFixed(value < 10 && unit > 0 ? 1 : 0)} ${units[unit]}`
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

function buildBreadcrumbs(folders: Folder[], currentId: string | null): Folder[] {
  const byId = new Map(folders.map((f) => [f.id, f]))
  const chain: Folder[] = []
  let cursor = currentId
  while (cursor) {
    const folder = byId.get(cursor)
    if (!folder) break
    chain.unshift(folder)
    cursor = folder.parent_id
  }
  return chain
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[]; sort?: string | string[]; folder?: string | string[] }>
}) {
  const sp = await searchParams
  const query = param(sp.q).trim()
  const sortKey: SortKey = (['recent', 'old', 'az', 'za'] as const).includes(param(sp.sort) as SortKey)
    ? (param(sp.sort) as SortKey)
    : 'recent'
  const currentFolderId = param(sp.folder) || null

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: allFolders, error: foldersError } = await supabase
    .from('folders')
    .select('id, name, parent_id')
    .order('name', { ascending: true })

  let documentsQuery = supabase
    .from('documents')
    .select('id, title, storage_path, size_bytes, created_at')
  documentsQuery = currentFolderId
    ? documentsQuery.eq('folder_id', currentFolderId)
    : documentsQuery.is('folder_id', null)
  if (query) documentsQuery = documentsQuery.ilike('title', `%${query}%`)
  const { data: documents, error: documentsError } = await documentsQuery.order(SORTS[sortKey].column, {
    ascending: SORTS[sortKey].ascending,
  })

  const folders: Folder[] = allFolders ?? []
  const subfolders = folders.filter((f) => (f.parent_id ?? null) === currentFolderId)
  const breadcrumbs = buildBreadcrumbs(folders, currentFolderId)

  // Batch-create short-lived signed URLs for the download links.
  const paths = (documents ?? []).map((d) => d.storage_path)
  const signedUrls = new Map<string, string>()
  if (paths.length > 0) {
    const { data: signed } = await supabase.storage.from(BUCKET).createSignedUrls(paths, SIGNED_URL_TTL)
    for (const entry of signed ?? []) {
      if (entry.signedUrl) signedUrls.set(entry.path ?? '', entry.signedUrl)
    }
  }

  const hasError = foldersError || documentsError

  return (
    <div className="flex flex-1 flex-col bg-slate-50 dark:bg-slate-950">
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4 dark:border-slate-800 dark:bg-slate-900">
        <span className="text-lg font-bold tracking-tight text-indigo-600 dark:text-indigo-400">
          PrivaDoc
        </span>
        <div className="flex items-center gap-4">
          <span className="hidden text-sm text-slate-500 sm:inline dark:text-slate-400">{user.email}</span>
          <form action={signout}>
            <button
              type="submit"
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Se déconnecter
            </button>
          </form>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
        {/* Breadcrumbs */}
        <nav aria-label="Fil d'Ariane" className="flex flex-wrap items-center gap-1 text-sm">
          <Link href="/" className="font-medium text-slate-500 hover:text-indigo-600 dark:text-slate-400">
            Mes documents
          </Link>
          {breadcrumbs.map((crumb) => (
            <span key={crumb.id} className="flex items-center gap-1">
              <span className="text-slate-300 dark:text-slate-600">/</span>
              <Link
                href={`/?folder=${crumb.id}`}
                className="font-medium text-slate-500 hover:text-indigo-600 dark:text-slate-400"
              >
                {crumb.name}
              </Link>
            </span>
          ))}
        </nav>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
            {breadcrumbs.at(-1)?.name ?? 'Mes documents'}
          </h1>
          <NewFolderButton parentId={currentFolderId ?? undefined} />
        </div>

        <div className="mt-6">
          <UploadForm folderId={currentFolderId ?? undefined} />
        </div>

        <div className="mt-6">
          <Suspense fallback={null}>
            <SearchSort />
          </Suspense>
        </div>

        {hasError ? (
          <div className="mt-8 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
            Impossible de charger les données. As-tu exécuté la dernière migration SQL (dossiers) ?
            <span className="mt-1 block font-mono text-xs opacity-80">
              {(foldersError ?? documentsError)?.message}
            </span>
          </div>
        ) : (
          <div className="mt-8 overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
            {subfolders.length === 0 && (documents?.length ?? 0) === 0 ? (
              <p className="px-4 py-10 text-center text-sm text-slate-500 dark:text-slate-400">
                {query ? 'Aucun résultat.' : 'Ce dossier est vide. Téléverse un fichier ou crée un dossier.'}
              </p>
            ) : (
              <ul className="divide-y divide-slate-200 dark:divide-slate-800">
                {subfolders.map((folder) => (
                  <li key={folder.id} className="flex items-center justify-between gap-4 px-4 py-3">
                    <Link
                      href={`/?folder=${folder.id}`}
                      className="flex min-w-0 items-center gap-2 text-sm font-medium text-slate-900 hover:text-indigo-600 dark:text-slate-100 dark:hover:text-indigo-400"
                    >
                      <svg aria-hidden="true" viewBox="0 0 20 20" fill="currentColor" className="size-4 shrink-0 text-indigo-500">
                        <path d="M3 6a2 2 0 0 1 2-2h3l2 2h5a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6Z" />
                      </svg>
                      <span className="truncate">{folder.name}</span>
                    </Link>
                    <ConfirmDialog
                      triggerLabel="Supprimer"
                      title="Supprimer le dossier"
                      description="Le dossier et ses sous-dossiers seront supprimés. Les documents qu'il contient ne seront pas supprimés mais déplacés à la racine."
                      confirmLabel="Supprimer"
                      action={deleteFolder}
                      hiddenFields={{ id: folder.id }}
                      destructive
                    />
                  </li>
                ))}

                {(documents ?? []).map((doc) => {
                  const url = signedUrls.get(doc.storage_path)
                  return (
                    <li key={doc.id} className="flex items-center justify-between gap-4 px-4 py-3">
                      <div className="min-w-0">
                        {url ? (
                          <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="truncate text-sm font-medium text-slate-900 hover:text-indigo-600 dark:text-slate-100 dark:hover:text-indigo-400"
                          >
                            {doc.title}
                          </a>
                        ) : (
                          <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">
                            {doc.title}
                          </p>
                        )}
                        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                          {formatBytes(doc.size_bytes)} · {formatDate(doc.created_at)}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-3">
                        <ShareButton documentId={doc.id} />
                        <ConfirmDialog
                          triggerLabel="Supprimer"
                          title="Supprimer le document"
                          description="Cette action est définitive. Le fichier sera retiré de ton espace de stockage."
                          confirmLabel="Supprimer"
                          action={deleteDocument}
                          hiddenFields={{ id: doc.id }}
                          destructive
                        />
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
