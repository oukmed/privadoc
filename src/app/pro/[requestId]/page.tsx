import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Brand } from '@/app/brand'
import { signout } from '@/app/auth/actions'
import { reviewItem } from '@/app/pro/actions'

const BUCKET = process.env.NEXT_PUBLIC_STORAGE_BUCKET ?? 'documents'
const SIGNED_URL_TTL = 600 // 10 minutes

interface Item {
  id: string
  label: string
  due_date: string | null
  status: string
  comment: string | null
  document_id: string | null
  position: number
}

const STATUS: Record<string, { label: string; className: string }> = {
  pending: {
    label: 'En attente',
    className: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
  },
  submitted: {
    label: 'Reçue',
    className: 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300',
  },
  validated: {
    label: 'Validée',
    className: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300',
  },
  rejected: {
    label: 'Refusée',
    className: 'bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-300',
  },
}

export default async function RequestDetailPage({
  params,
}: {
  params: Promise<{ requestId: string }>
}) {
  const { requestId } = await params

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // RLS restricts this to the pro's own requests.
  const { data: request } = await supabase
    .from('document_requests')
    .select('id, title, client_email, status')
    .eq('id', requestId)
    .maybeSingle()
  if (!request) notFound()

  const { data: itemsData } = await supabase
    .from('request_items')
    .select('id, label, due_date, status, comment, document_id, position')
    .eq('request_id', requestId)
    .order('position', { ascending: true })
  const items = (itemsData ?? []) as Item[]

  // Batch-resolve signed URLs for attached documents.
  const documentIds = items.map((i) => i.document_id).filter((id): id is string => Boolean(id))
  const signedUrls = new Map<string, string>()
  if (documentIds.length > 0) {
    const { data: docs } = await supabase
      .from('documents')
      .select('id, storage_path')
      .in('id', documentIds)
    for (const doc of docs ?? []) {
      const { data: signed } = await supabase.storage
        .from(BUCKET)
        .createSignedUrl(doc.storage_path, SIGNED_URL_TTL)
      if (signed?.signedUrl) signedUrls.set(doc.id, signed.signedUrl)
    }
  }

  return (
    <div className="flex flex-1 flex-col bg-slate-50 dark:bg-slate-950">
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200/80 bg-white/80 px-6 py-3.5 backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-900/70">
        <Brand />
        <div className="flex items-center gap-4">
          <Link
            href="/pro"
            className="text-sm font-medium text-slate-600 transition hover:text-indigo-600 dark:text-slate-300 dark:hover:text-indigo-400"
          >
            Espace pro
          </Link>
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
        <nav aria-label="Fil d'Ariane" className="flex flex-wrap items-center gap-1 text-sm">
          <Link href="/pro" className="font-medium text-slate-500 hover:text-indigo-600 dark:text-slate-400">
            Espace pro
          </Link>
          <span className="text-slate-300 dark:text-slate-600">/</span>
          <span className="text-slate-500 dark:text-slate-400">{request.client_email}</span>
        </nav>

        <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
          {request.title}
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Client : {request.client_email}
        </p>

        <ul className="mt-8 flex flex-col gap-4">
          {items.map((item) => {
            const badge = STATUS[item.status] ?? STATUS.pending
            const signedUrl = item.document_id ? signedUrls.get(item.document_id) : undefined
            return (
              <li
                key={item.id}
                className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-slate-900 dark:text-slate-100">{item.label}</p>
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${badge.className}`}
                      >
                        {badge.label}
                      </span>
                    </div>
                    {item.due_date && (
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        Échéance : {new Date(item.due_date).toLocaleDateString('fr-FR')}
                      </p>
                    )}
                    {item.comment && (
                      <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                        Commentaire : {item.comment}
                      </p>
                    )}
                  </div>
                  {signedUrl && (
                    <a
                      href={signedUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                    >
                      Ouvrir
                    </a>
                  )}
                </div>

                {item.document_id ? (
                  <form action={reviewItem} className="mt-4 flex flex-col gap-2">
                    <input type="hidden" name="itemId" value={item.id} />
                    <textarea
                      name="comment"
                      rows={2}
                      defaultValue={item.comment ?? ''}
                      placeholder="Commentaire (optionnel)"
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                    />
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        name="decision"
                        value="validated"
                        className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500"
                      >
                        Valider
                      </button>
                      <button
                        type="submit"
                        name="decision"
                        value="rejected"
                        className="rounded-lg border border-red-300 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/40"
                      >
                        Refuser
                      </button>
                    </div>
                  </form>
                ) : (
                  <p className="mt-3 text-sm text-slate-400 dark:text-slate-500">
                    En attente du dépôt par le client.
                  </p>
                )}
              </li>
            )
          })}
        </ul>
      </main>
    </div>
  )
}
