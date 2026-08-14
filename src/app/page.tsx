import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { signout } from '@/app/auth/actions'
import { deleteDocument } from '@/app/documents/actions'
import { UploadForm } from '@/app/documents/upload-form'
import { ShareButton } from '@/app/documents/share-button'

const BUCKET = process.env.NEXT_PUBLIC_STORAGE_BUCKET ?? 'documents'
const SIGNED_URL_TTL = 60 * 5 // 5 minutes

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
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export default async function Home() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // The proxy already guards this route, but re-check close to the data.
  if (!user) redirect('/login')

  const { data: documents, error } = await supabase
    .from('documents')
    .select('id, title, storage_path, mime_type, size_bytes, created_at')
    .order('created_at', { ascending: false })

  // Batch-create short-lived signed URLs for the download links.
  const paths = (documents ?? []).map((d) => d.storage_path)
  const signedUrls = new Map<string, string>()
  if (paths.length > 0) {
    const { data: signed } = await supabase.storage.from(BUCKET).createSignedUrls(paths, SIGNED_URL_TTL)
    for (const entry of signed ?? []) {
      if (entry.signedUrl) signedUrls.set(entry.path ?? '', entry.signedUrl)
    }
  }

  return (
    <div className="flex flex-1 flex-col bg-slate-50 dark:bg-slate-950">
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4 dark:border-slate-800 dark:bg-slate-900">
        <span className="text-lg font-bold tracking-tight text-indigo-600 dark:text-indigo-400">
          PrivaDoc
        </span>
        <div className="flex items-center gap-4">
          <span className="hidden text-sm text-slate-500 sm:inline dark:text-slate-400">
            {user.email}
          </span>
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
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
          Mes documents
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Téléverse un fichier — il reste privé, visible uniquement par toi.
        </p>

        <div className="mt-6">
          <UploadForm />
        </div>

        {error ? (
          <div className="mt-8 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
            Impossible de charger les documents. As-tu bien exécuté la migration SQL ?
            <span className="mt-1 block font-mono text-xs opacity-80">{error.message}</span>
          </div>
        ) : documents && documents.length > 0 ? (
          <ul className="mt-8 divide-y divide-slate-200 overflow-hidden rounded-xl border border-slate-200 bg-white dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-900">
            {documents.map((doc) => {
              const url = signedUrls.get(doc.storage_path)
              return (
                <li key={doc.id} className="flex items-center justify-between gap-4 px-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">
                      {doc.title}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                      {formatBytes(doc.size_bytes)} · {formatDate(doc.created_at)}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    {url && (
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
                      >
                        Ouvrir
                      </a>
                    )}
                    <ShareButton documentId={doc.id} />
                    <form action={deleteDocument}>
                      <input type="hidden" name="id" value={doc.id} />
                      <button
                        type="submit"
                        className="text-sm font-medium text-slate-400 transition hover:text-red-600 dark:hover:text-red-400"
                      >
                        Supprimer
                      </button>
                    </form>
                  </div>
                </li>
              )
            })}
          </ul>
        ) : (
          <p className="mt-8 rounded-xl border border-slate-200 bg-white px-4 py-10 text-center text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
            Aucun document pour l’instant. Téléverse ton premier fichier ci-dessus.
          </p>
        )}
      </main>
    </div>
  )
}
