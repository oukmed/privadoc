import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ClientShell } from '@/app/client-shell'
import { getProfile } from '@/app/account/profile'
import { SubmitPiece } from '@/app/requests/submit-piece'
import { ROLE_LABELS, type RecipientRole } from '@/lib/roles'
import { getT } from '@/lib/i18n/server'

type Translate = (key: string, vars?: Record<string, string | number>) => string

function senderLabel(name: string | null, profession: string | null): string | null {
  if (!name) return null
  const role = profession ? (ROLE_LABELS[profession as RecipientRole] ?? profession) : null
  return role ? `${name} · ${role}` : name
}

const BUCKET = process.env.NEXT_PUBLIC_STORAGE_BUCKET ?? 'documents'
const SIGNED_URL_TTL = 60 * 5 // 5 minutes

type ItemStatus = 'pending' | 'submitted' | 'validated' | 'rejected'

const STATUS_BADGE_CLASS: Record<ItemStatus, string> = {
  pending: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
  submitted: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300',
  validated: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300',
  rejected: 'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300',
}

const STATUS_LABEL_KEY: Record<ItemStatus, string> = {
  pending: 'inbox.requests.status.pending',
  submitted: 'inbox.requests.status.submitted',
  validated: 'inbox.requests.status.validated',
  rejected: 'inbox.requests.status.rejected',
}

function badgeFor(status: string, t: Translate): { label: string; className: string } {
  const key: ItemStatus = status in STATUS_BADGE_CLASS ? (status as ItemStatus) : 'pending'
  return { label: t(STATUS_LABEL_KEY[key]), className: STATUS_BADGE_CLASS[key] }
}

interface RequestItemRow {
  id: string
  label: string
  due_date: string | null
  status: string
  comment: string | null
  document_id: string | null
  position: number
}

export default async function RequestsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // /requests is the private client inbox — pros (and pros awaiting approval)
  // belong on /pro, not here.
  const profile = await getProfile()
  if (profile.isProfessional || profile.proStatus === 'pending') redirect('/pro')

  const t = await getT()

  const { data: requests, error } = await supabase
    .from('document_requests')
    .select(
      'id, title, status, created_at, professional_name, professional_profession, request_items(id, label, due_date, status, comment, document_id, position)',
    )
    .eq('client_id', user.id)
    .order('created_at', { ascending: false })

  // Signed URLs for every attached document (the client owns them; RLS returns them).
  const documentIds = (requests ?? [])
    .flatMap((r) => (r.request_items as RequestItemRow[]) ?? [])
    .map((i) => i.document_id)
    .filter((id): id is string => Boolean(id))

  const signedUrlByDocId = new Map<string, string>()
  if (documentIds.length > 0) {
    const { data: docs } = await supabase
      .from('documents')
      .select('id, storage_path')
      .in('id', documentIds)
    const pathByDocId = new Map((docs ?? []).map((d) => [d.id, d.storage_path]))
    const paths = [...pathByDocId.values()]
    if (paths.length > 0) {
      const { data: signed } = await supabase.storage.from(BUCKET).createSignedUrls(paths, SIGNED_URL_TTL)
      const urlByPath = new Map<string, string>()
      for (const entry of signed ?? []) {
        if (entry.signedUrl) urlByPath.set(entry.path ?? '', entry.signedUrl)
      }
      for (const [docId, path] of pathByDocId) {
        const url = urlByPath.get(path)
        if (url) signedUrlByDocId.set(docId, url)
      }
    }
  }

  return (
    <ClientShell>
      <div className="mx-auto w-full max-w-3xl">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
          {t('inbox.requests.title')}
        </h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          {t('inbox.requests.subtitle')}
        </p>

        {error ? (
          <div className="mt-8 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
            {t('inbox.requests.loadError')}
            <span className="mt-1 block font-mono text-xs opacity-80">{error.message}</span>
          </div>
        ) : (requests?.length ?? 0) === 0 ? (
          <div className="mt-8 overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
            <p className="px-4 py-10 text-center text-sm text-slate-500 dark:text-slate-400">
              {t('inbox.requests.empty')}
            </p>
          </div>
        ) : (
          <div className="mt-8 space-y-6">
            {(requests ?? []).map((request) => {
              const items = [...((request.request_items as RequestItemRow[]) ?? [])].sort(
                (a, b) => a.position - b.position,
              )
              return (
                <section
                  key={request.id}
                  className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
                >
                  <header className="border-b border-slate-200 px-5 py-4 dark:border-slate-800">
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
                      {request.title}
                    </h2>
                    {senderLabel(request.professional_name, request.professional_profession) && (
                      <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
                        {t('inbox.requests.requestedBy')}{' '}
                        <span className="font-medium text-slate-700 dark:text-slate-300">
                          {senderLabel(request.professional_name, request.professional_profession)}
                        </span>
                      </p>
                    )}
                  </header>
                  <ul className="divide-y divide-slate-200 dark:divide-slate-800">
                    {items.map((item) => {
                      const badge = badgeFor(item.status, t)
                      const canSubmit = item.status === 'pending' || item.status === 'rejected'
                      const signedUrl = item.document_id
                        ? signedUrlByDocId.get(item.document_id)
                        : undefined
                      return (
                        <li key={item.id} className="px-5 py-4">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="font-medium text-slate-800 dark:text-slate-200">{item.label}</p>
                              {item.due_date && (
                                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                                  {t('inbox.requests.dueBy', {
                                    date: new Date(item.due_date).toLocaleDateString('fr-FR'),
                                  })}
                                </p>
                              )}
                            </div>
                            <span
                              className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${badge.className}`}
                            >
                              {badge.label}
                            </span>
                          </div>

                          {item.status === 'rejected' && item.comment && (
                            <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
                              {item.comment}
                            </p>
                          )}

                          {signedUrl && (
                            <a
                              href={signedUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 transition hover:text-indigo-500 dark:text-indigo-400"
                            >
                              <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="size-4">
                                <path
                                  d="M12.5 3.5H16.5V7.5M16.5 3.5 9 11M8 4.5H5A1.5 1.5 0 0 0 3.5 6v9A1.5 1.5 0 0 0 5 16.5h9A1.5 1.5 0 0 0 15.5 15v-3"
                                  stroke="currentColor"
                                  strokeWidth="1.5"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                              {t('inbox.requests.openDocument')}
                            </a>
                          )}

                          {canSubmit && <SubmitPiece item={{ id: item.id, label: item.label }} />}
                        </li>
                      )
                    })}
                  </ul>
                </section>
              )
            })}
          </div>
        )}
      </div>
    </ClientShell>
  )
}
