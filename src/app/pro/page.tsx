import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AppHeader } from '@/app/app-header'
import { getProfile } from '@/app/account/profile'
import { requestProAccount } from '@/app/account/actions'
import { RECIPIENT_ROLES, ROLE_LABELS } from '@/lib/roles'
import { CreateRequestDialog } from '@/app/pro/create-request-dialog'
import { deleteRequest } from '@/app/pro/actions'

interface RequestRow {
  id: string
  title: string
  status: string
  client_email: string
  client_name: string | null
  request_items: { status: string }[]
}

const STATUS_LABELS: Record<string, string> = {
  open: 'En cours',
  completed: 'Terminée',
  archived: 'Archivée',
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

  const { data: requestsData } = await supabase
    .from('document_requests')
    .select('id, title, status, client_email, client_name, request_items(status)')
    .order('created_at', { ascending: false })
  const requests = (requestsData ?? []) as RequestRow[]

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

  return (
    <div className="flex flex-1 flex-col bg-slate-50 dark:bg-slate-950">
      <AppHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            Espace pro
          </h1>
          <CreateRequestDialog />
        </div>

        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          {clients.length} {clients.length <= 1 ? 'client actif' : 'clients actifs'}
        </p>

        {requests.length === 0 ? (
          <div className="mt-8 overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
            <p className="px-4 py-10 text-center text-sm text-slate-500 dark:text-slate-400">
              Aucune demande pour l&apos;instant. Créez une demande de pièces pour un client.
            </p>
          </div>
        ) : (
          <div className="mt-8 flex flex-col gap-6">
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
                    return (
                      <li
                        key={request.id}
                        className="flex items-center justify-between gap-4 px-5 py-4"
                      >
                        <Link href={`/pro/${request.id}`} className="min-w-0 flex-1">
                          <p className="truncate font-medium text-slate-900 hover:text-indigo-600 dark:text-slate-100 dark:hover:text-indigo-400">
                            {request.title}
                          </p>
                          <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                            <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                              {STATUS_LABELS[request.status] ?? request.status}
                            </span>
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
                      </li>
                    )
                  })}
                </ul>
              </section>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
