import { createAdminClient } from '@/lib/supabase/server'
import { ReplaceForm } from './replace-form'
import { Brand } from '@/app/brand'

const BUCKET = process.env.NEXT_PUBLIC_STORAGE_BUCKET ?? 'documents'
const SIGNED_URL_TTL = 60 * 10 // 10 minutes

type AdminClient = ReturnType<typeof createAdminClient>

interface SharedDocument {
  id: string
  title: string
  storage_path: string
  size_bytes: number | null
  created_at: string
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
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function isExpired(expiresAt: string | null): boolean {
  return expiresAt !== null && new Date(expiresAt).getTime() < Date.now()
}

/** Document ids attached to a share: junction rows, or the legacy single column. */
async function collectDocumentIds(
  supabase: AdminClient,
  share: { id: string; document_id: string | null },
): Promise<string[]> {
  const { data } = await supabase
    .from('share_documents')
    .select('document_id')
    .eq('share_id', share.id)
  const ids = (data ?? []).map((row) => row.document_id)
  if (ids.length > 0) return ids
  return share.document_id ? [share.document_id] : []
}

function Invalid() {
  return (
    <p className="rounded-xl border border-slate-200 bg-white px-6 py-12 text-center text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
      Lien invalide ou expiré.
    </p>
  )
}

function DocumentCard({
  doc,
  downloadUrl,
  token,
  canWrite,
}: {
  doc: SharedDocument
  downloadUrl: string | null
  token: string
  canWrite: boolean
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <h2 className="break-words text-base font-semibold text-slate-900 dark:text-slate-50">
        {doc.title}
      </h2>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        {formatBytes(doc.size_bytes)} · {formatDate(doc.created_at)}
      </p>
      {downloadUrl ? (
        <div className="mt-4">
          <a
            href={downloadUrl}
            className="inline-flex w-full items-center justify-center rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500"
          >
            Télécharger le document
          </a>
        </div>
      ) : (
        <p className="mt-4 text-sm text-red-600 dark:text-red-400">Fichier indisponible.</p>
      )}
      {canWrite && <ReplaceForm token={token} documentId={doc.id} />}
    </div>
  )
}

export default async function SharePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const supabase = createAdminClient()

  const { data: share } = await supabase
    .from('shares')
    .select('id, expires_at, document_id, permission')
    .eq('token', token)
    .maybeSingle()

  const shell = (children: React.ReactNode) => (
    <div className="flex min-h-screen flex-col bg-slate-50 dark:bg-slate-950">
      <header className="border-b border-slate-200 bg-white px-6 py-4 dark:border-slate-800 dark:bg-slate-900">
        <Brand />
      </header>
      <main className="mx-auto w-full max-w-lg flex-1 px-6 py-16">{children}</main>
    </div>
  )

  if (!share || isExpired(share.expires_at)) return shell(<Invalid />)

  const documentIds = await collectDocumentIds(supabase, share)
  if (documentIds.length === 0) return shell(<Invalid />)

  const { data: documents } = await supabase
    .from('documents')
    .select('id, title, storage_path, size_bytes, created_at')
    .in('id', documentIds)

  if (!documents || documents.length === 0) return shell(<Invalid />)

  const canWrite = share.permission === 'write'
  const items = await Promise.all(
    documents.map(async (doc) => {
      // Always force an attachment download — never render a user-uploaded file
      // inline. A file's stored content-type is attacker-controllable (it can be
      // uploaded straight to Storage as text/html or image/svg+xml), so serving it
      // inline would let it execute in the recipient's browser. Attachment neutralises
      // that regardless of the stored type.
      const { data: download } = await supabase.storage
        .from(BUCKET)
        .createSignedUrl(doc.storage_path, SIGNED_URL_TTL, { download: true })
      return { doc, downloadUrl: download?.signedUrl ?? null }
    }),
  )

  return shell(
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
          {items.length > 1 ? `${items.length} documents partagés` : 'Document partagé'}
        </p>
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
            canWrite
              ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300'
              : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
          }`}
        >
          {canWrite ? 'Modification autorisée' : 'Lecture seule'}
        </span>
      </div>
      {items.map(({ doc, downloadUrl }) => (
        <DocumentCard
          key={doc.id}
          doc={doc}
          downloadUrl={downloadUrl}
          token={token}
          canWrite={canWrite}
        />
      ))}
    </div>,
  )
}
