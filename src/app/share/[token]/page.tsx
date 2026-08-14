import { createAdminClient } from '@/lib/supabase/server'
import { ReplaceForm } from './replace-form'

const BUCKET = process.env.NEXT_PUBLIC_STORAGE_BUCKET ?? 'documents'
const SIGNED_URL_TTL = 60 * 10 // 10 minutes

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

function isExpired(expiresAt: string | null): boolean {
  return expiresAt !== null && new Date(expiresAt).getTime() < Date.now()
}

function Invalid() {
  return (
    <p className="rounded-xl border border-slate-200 bg-white px-6 py-12 text-center text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
      Lien invalide ou expiré.
    </p>
  )
}

export default async function SharePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const supabase = createAdminClient()

  const { data: share } = await supabase
    .from('shares')
    .select('expires_at, document_id, permission')
    .eq('token', token)
    .maybeSingle()

  const shell = (children: React.ReactNode) => (
    <div className="flex min-h-screen flex-col bg-slate-50 dark:bg-slate-950">
      <header className="border-b border-slate-200 bg-white px-6 py-4 dark:border-slate-800 dark:bg-slate-900">
        <span className="text-lg font-bold tracking-tight text-indigo-600 dark:text-indigo-400">
          PrivaDoc
        </span>
      </header>
      <main className="mx-auto w-full max-w-md flex-1 px-6 py-16">{children}</main>
    </div>
  )

  if (!share || isExpired(share.expires_at)) return shell(<Invalid />)

  const { data: document } = await supabase
    .from('documents')
    .select('title, storage_path, size_bytes, created_at')
    .eq('id', share.document_id)
    .maybeSingle()

  if (!document) return shell(<Invalid />)

  const { data: signed } = await supabase.storage
    .from(BUCKET)
    // `download: true` forces Content-Disposition: attachment so a shared file is
    // never served inline (defense-in-depth against active-content/XSS).
    .createSignedUrl(document.storage_path, SIGNED_URL_TTL, { download: true })

  if (!signed?.signedUrl) return shell(<Invalid />)

  const canWrite = share.permission === 'write'

  return shell(
    <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">
        Document partagé
      </p>
      <h1 className="mt-2 break-words text-xl font-semibold text-slate-900 dark:text-slate-50">
        {document.title}
      </h1>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        {formatBytes(document.size_bytes)} · {formatDate(document.created_at)}
      </p>
      <span
        className={`mt-3 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
          canWrite
            ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300'
            : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
        }`}
      >
        {canWrite ? 'Modification autorisée' : 'Lecture seule'}
      </span>
      <a
        href={signed.signedUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-6 inline-flex w-full items-center justify-center rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500"
      >
        Ouvrir / Télécharger
      </a>
      {canWrite && <ReplaceForm token={token} />}
    </div>,
  )
}
