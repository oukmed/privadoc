import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AppHeader } from '@/app/app-header'
import { getProfile } from '@/app/account/profile'
import { requestProAccount } from '@/app/account/actions'
import { RECIPIENT_ROLES, ROLE_LABELS } from '@/lib/roles'
import { CreateRequestDialog } from '@/app/pro/create-request-dialog'
import { deleteRequest } from '@/app/pro/actions'
import { resolveDisplayNames } from '@/lib/names'

const BUCKET = process.env.NEXT_PUBLIC_STORAGE_BUCKET ?? 'documents'
const SIGNED_URL_TTL = 60 * 60 // 1 hour

interface SharedDoc {
  id: string
  title: string
  storage_path: string
  created_at: string
  owner_id: string
}

interface RequestItem {
  id: string
  label: string
  status: string
  due_date: string | null
  document_id: string | null
}

interface RequestRow {
  id: string
  title: string
  status: string
  client_email: string
  client_name: string | null
  request_items: RequestItem[]
}

const STATUS_LABELS: Record<string, string> = {
  open: 'En cours',
  completed: 'Terminée',
  archived: 'Archivée',
}

const SOON_MS = 14 * 24 * 60 * 60 * 1000

interface Deadline {
  requestId: string
  title: string
  client: string
  label: string
  due: string
  overdue: boolean
}

/** Upcoming (≤14 days) or overdue deadlines for pieces not yet submitted/validated.
 * Kept out of render (reads the clock). */
function collectDeadlines(requests: RequestRow[]): Deadline[] {
  const now = Date.now()
  const out: Deadline[] = []
  for (const r of requests) {
    if (r.status !== 'open') continue
    const client = r.client_name?.trim() || r.client_email
    for (const it of r.request_items) {
      if (!it.due_date || it.status === 'validated' || it.status === 'submitted') continue
      const t = new Date(it.due_date).getTime()
      if (t - now <= SOON_MS) {
        out.push({ requestId: r.id, title: r.title, client, label: it.label, due: it.due_date, overdue: t < now })
      }
    }
  }
  return out.sort((a, b) => a.due.localeCompare(b.due))
}

function Kpi({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">
        {label}
      </p>
      <p
        className={`mt-1 text-2xl font-bold tracking-tight ${
          accent && value > 0
            ? 'text-indigo-600 dark:text-indigo-400'
            : 'text-slate-900 dark:text-slate-50'
        }`}
      >
        {value}
      </p>
    </div>
  )
}

function ProgressBar({ value, total }: { value: number; total: number }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
      <div
        className={`h-full rounded-full ${pct === 100 ? 'bg-emerald-500' : 'bg-indigo-500'}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}


export default async function ProPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/pro')

  const profile = await getProfile()

  // Pro space is reserved for APPROVED professional accounts. A client sees the
  // onboarding (request to become pro) or a pending-validation notice instead.
  if (!profile.isProfessional) {
    const pending = profile.proStatus === 'pending'
    return (
      <div className="flex flex-1 flex-col bg-slate-50 dark:bg-slate-950">
        <AppHeader />
        <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-16">
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-center dark:border-slate-800 dark:bg-slate-900">
            {pending ? (
              <>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
                  Demande en cours de validation
                </h1>
                <p className="mx-auto mt-3 max-w-md text-sm text-slate-500 dark:text-slate-400">
                  Votre compte professionnel est en attente d&apos;approbation par un administrateur.
                  Vous recevrez un email dès qu&apos;il sera activé.
                </p>
              </>
            ) : (
              <>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
                  Espace professionnel
                </h1>
                <p className="mx-auto mt-3 max-w-md text-sm text-slate-500 dark:text-slate-400">
                  Demandez des pièces à vos clients, suivez leurs dépôts et validez chaque document en
                  un seul endroit. Créez votre compte professionnel — il sera activé après validation
                  par un administrateur.
                </p>
                <form action={requestProAccount} className="mx-auto mt-6 flex max-w-sm flex-col gap-3 text-left">
                  <div>
                    <label
                      htmlFor="displayName"
                      className="block text-sm font-medium text-slate-700 dark:text-slate-300"
                    >
                      Nom ou cabinet
                    </label>
                    <input
                      id="displayName"
                      name="displayName"
                      type="text"
                      required
                      maxLength={120}
                      placeholder="Maître Dupont — Cabinet Dupont & Associés"
                      className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="profession"
                      className="block text-sm font-medium text-slate-700 dark:text-slate-300"
                    >
                      Profession
                    </label>
                    <select
                      id="profession"
                      name="profession"
                      defaultValue=""
                      className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                    >
                      <option value="">— Choisir dans la liste —</option>
                      {RECIPIENT_ROLES.map((role) => (
                        <option key={role} value={role}>
                          {ROLE_LABELS[role]}
                        </option>
                      ))}
                    </select>
                    <input
                      name="customProfession"
                      type="text"
                      maxLength={60}
                      placeholder="Ou saisissez votre profession si absente de la liste"
                      className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                    />
                  </div>
                  <button
                    type="submit"
                    className="mt-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500"
                  >
                    Créer un compte professionnel
                  </button>
                </form>
              </>
            )}
          </div>
        </main>
      </div>
    )
  }

  // A pro can also be a collaborator on a client's personal vault (e.g. an
  // accountant a client shares documents with). Those incoming shares live on /
  // for private users, but a pro is redirected here — so surface them below.
  const [{ data: requestsData }, { data: sharedDocsData }] = await Promise.all([
    supabase
      .from('document_requests')
      .select('id, title, status, client_email, client_name, request_items(id, label, status, due_date, document_id)')
      .order('created_at', { ascending: false }),
    supabase
      .from('documents')
      .select('id, title, storage_path, created_at, owner_id')
      .neq('owner_id', user.id)
      .order('created_at', { ascending: false }),
  ])
  const requests = (requestsData ?? []) as RequestRow[]

  // The pro can also read client-uploaded pieces attached to their own requests
  // (documents_select_via_request RLS) — those belong to the request workflow, not
  // here. Keep only documents shared via the collaborator system.
  const requestDocIds = new Set(
    requests.flatMap((r) => r.request_items.map((it) => it.document_id).filter(Boolean)),
  )
  const sharedDocs = ((sharedDocsData ?? []) as SharedDoc[]).filter((d) => !requestDocIds.has(d.id))

  // Short-lived signed download URLs + the sharer's display name for each doc.
  const signedUrls = new Map<string, string>()
  const sharedPaths = sharedDocs.map((d) => d.storage_path)
  if (sharedPaths.length > 0) {
    const { data: signed } = await supabase.storage.from(BUCKET).createSignedUrls(sharedPaths, SIGNED_URL_TTL)
    for (const entry of signed ?? []) {
      if (entry.signedUrl) signedUrls.set(entry.path ?? '', entry.signedUrl)
    }
  }
  const sharerNames = await resolveDisplayNames(sharedDocs.map((d) => d.owner_id))

  const clients = [
    ...new Set(
      requests.filter((r) => r.status === 'open').map((r) => r.client_email.toLowerCase()),
    ),
  ]

  // Group requests by client email, preserving the recency order above, and keep
  // the most recent non-empty name for each client.
  const byClient = new Map<string, RequestRow[]>()
  const nameByEmail = new Map<string, string>()
  for (const request of requests) {
    const key = request.client_email
    const list = byClient.get(key) ?? []
    list.push(request)
    byClient.set(key, list)
    if (request.client_name?.trim() && !nameByEmail.has(key)) {
      nameByEmail.set(key, request.client_name.trim())
    }
  }

  // Dashboard metrics + work lists.
  const openCount = requests.filter((r) => r.status === 'open').length
  const completedCount = requests.filter((r) => r.status === 'completed').length
  const toReview = requests.flatMap((r) =>
    r.request_items
      .filter((it) => it.status === 'submitted')
      .map((it) => ({
        requestId: r.id,
        title: r.title,
        client: r.client_name?.trim() || r.client_email,
        label: it.label,
      })),
  )
  const deadlines = collectDeadlines(requests)

  return (
    <div className="flex flex-1 flex-col bg-slate-50 dark:bg-slate-950">
      <AppHeader />
      <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
              Espace pro
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Suivez vos clients et l&apos;avancement de leurs dossiers.
            </p>
          </div>
          <CreateRequestDialog />
        </div>

        {/* KPIs */}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Kpi label="Clients actifs" value={clients.length} />
          <Kpi label="Dossiers en cours" value={openCount} />
          <Kpi label="Pièces à valider" value={toReview.length} accent />
          <Kpi label="Dossiers terminés" value={completedCount} />
        </div>

        {/* Documents a client has shared with this pro (collaboration on their vault) */}
        {sharedDocs.length > 0 && (
          <section className="mt-8">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Partagé avec moi ({sharedDocs.length})
            </h2>
            <ul className="mt-3 overflow-hidden rounded-xl border border-slate-200 bg-white divide-y divide-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:divide-slate-800">
              {sharedDocs.map((doc) => {
                const url = signedUrls.get(doc.storage_path)
                const sharer = sharerNames.get(doc.owner_id)
                return (
                  <li key={doc.id} className="flex items-center justify-between gap-4 px-5 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">
                        {doc.title}
                      </p>
                      <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                        {sharer ? `Partagé par ${sharer} · ` : ''}
                        {new Date(doc.created_at).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                    {url && (
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-indigo-500"
                      >
                        Ouvrir
                      </a>
                    )}
                  </li>
                )
              })}
            </ul>
          </section>
        )}

        {requests.length === 0 ? (
          <div className="mt-8 overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
            <p className="px-4 py-10 text-center text-sm text-slate-500 dark:text-slate-400">
              Aucune demande pour l&apos;instant. Créez une demande de pièces pour un client.
            </p>
          </div>
        ) : (
          <>
            {/* Pieces awaiting the pro's review */}
            {toReview.length > 0 && (
              <section className="mt-8">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  À valider ({toReview.length})
                </h2>
                <ul className="mt-3 overflow-hidden rounded-xl border border-amber-200 bg-amber-50/60 divide-y divide-amber-100 dark:border-amber-900/60 dark:bg-amber-950/20 dark:divide-amber-900/40">
                  {toReview.map((t, i) => (
                    <li key={`${t.requestId}-${i}`} className="flex items-center justify-between gap-4 px-5 py-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">
                          {t.label}
                        </p>
                        <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                          {t.title} · {t.client}
                        </p>
                      </div>
                      <Link
                        href={`/pro/${t.requestId}`}
                        className="shrink-0 rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-indigo-500"
                      >
                        Examiner
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Upcoming / overdue deadlines */}
            {deadlines.length > 0 && (
              <section className="mt-8">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Échéances à venir
                </h2>
                <ul className="mt-3 overflow-hidden rounded-xl border border-slate-200 bg-white divide-y divide-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:divide-slate-800">
                  {deadlines.map((d, i) => (
                    <li key={`${d.requestId}-${i}`} className="flex items-center justify-between gap-4 px-5 py-3">
                      <Link href={`/pro/${d.requestId}`} className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-900 hover:text-indigo-600 dark:text-slate-100 dark:hover:text-indigo-400">
                          {d.label}
                        </p>
                        <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                          {d.title} · {d.client}
                        </p>
                      </Link>
                      <span
                        className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          d.overdue
                            ? 'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300'
                            : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                        }`}
                      >
                        {d.overdue ? 'En retard · ' : ''}
                        {new Date(d.due).toLocaleDateString('fr-FR')}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Clients + progress */}
            <section className="mt-8">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Clients ({byClient.size})
              </h2>
              <div className="mt-3 flex flex-col gap-6">
                {[...byClient.entries()].map(([clientEmail, clientRequests]) => {
                  const clientName = nameByEmail.get(clientEmail)
                  return (
                    <section
                      key={clientEmail}
                      className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900"
                    >
                      <header className="flex items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-5 py-3 dark:border-slate-800 dark:bg-slate-800/40">
                        <div className="flex min-w-0 items-center gap-2.5">
                          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
                            {(clientName || clientEmail).charAt(0).toUpperCase()}
                          </span>
                          <div className="min-w-0">
                            <span className="block truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
                              {clientName || clientEmail}
                            </span>
                            {clientName && (
                              <span className="block truncate text-xs text-slate-500 dark:text-slate-400">
                                {clientEmail}
                              </span>
                            )}
                          </div>
                        </div>
                        <span className="shrink-0 rounded-full bg-slate-200 px-2.5 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                          {clientRequests.length} {clientRequests.length > 1 ? 'demandes' : 'demande'}
                        </span>
                      </header>
                      <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                        {clientRequests.map((request) => {
                          const total = request.request_items.length
                          const validated = request.request_items.filter(
                            (i) => i.status === 'validated',
                          ).length
                          const submitted = request.request_items.filter(
                            (i) => i.status === 'submitted',
                          ).length
                          return (
                            <li key={request.id} className="px-5 py-4">
                              <div className="flex items-center justify-between gap-4">
                                <Link href={`/pro/${request.id}`} className="min-w-0 flex-1">
                                  <p className="truncate font-medium text-slate-900 hover:text-indigo-600 dark:text-slate-100 dark:hover:text-indigo-400">
                                    {request.title}
                                  </p>
                                  <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                                    <span
                                      className={`inline-flex items-center rounded-full px-2 py-0.5 font-medium ${
                                        request.status === 'completed'
                                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                                          : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                                      }`}
                                    >
                                      {STATUS_LABELS[request.status] ?? request.status}
                                    </span>
                                    {submitted > 0 && (
                                      <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 font-medium text-amber-700 dark:bg-amber-950/50 dark:text-amber-300">
                                        {submitted} à valider
                                      </span>
                                    )}
                                    <span>
                                      {validated}/{total} validées
                                    </span>
                                  </p>
                                </Link>
                                <form action={deleteRequest}>
                                  <input type="hidden" name="id" value={request.id} />
                                  <button
                                    type="submit"
                                    className="shrink-0 text-sm font-medium text-red-600 transition hover:text-red-500 dark:text-red-400"
                                  >
                                    Supprimer
                                  </button>
                                </form>
                              </div>
                              <div className="mt-2.5">
                                <ProgressBar value={validated} total={total} />
                              </div>
                            </li>
                          )
                        })}
                      </ul>
                    </section>
                  )
                })}
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  )
}
