import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Brand } from '@/app/brand'
import { signout } from '@/app/auth/actions'
import { getProfile } from '@/app/account/profile'
import { CreateRequestDialog } from '@/app/pro/create-request-dialog'
import { deleteRequest } from '@/app/pro/actions'

interface RequestRow {
  id: string
  title: string
  status: string
  client_email: string
  request_items: { status: string }[]
}

const STATUS_LABELS: Record<string, string> = {
  open: 'En cours',
  completed: 'Terminée',
  archived: 'Archivée',
}

function ProHeader({ email }: { email: string | undefined }) {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200/80 bg-white/80 px-6 py-3.5 backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-900/70">
      <Brand />
      <div className="flex items-center gap-4">
        <Link
          href="/"
          className="text-sm font-medium text-slate-600 transition hover:text-indigo-600 dark:text-slate-300 dark:hover:text-indigo-400"
        >
          Mes documents
        </Link>
        <span className="hidden text-sm text-slate-500 sm:inline dark:text-slate-400">{email}</span>
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
  )
}

export default async function ProPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const profile = await getProfile()

  if (!profile.isProfessional) {
    return (
      <div className="flex flex-1 flex-col bg-slate-50 dark:bg-slate-950">
        <ProHeader email={user.email} />
        <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-16">
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-center dark:border-slate-800 dark:bg-slate-900">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
              Espace professionnel
            </h1>
            <p className="mx-auto mt-3 max-w-md text-sm text-slate-500 dark:text-slate-400">
              Demandez des pièces à vos clients, suivez leurs dépôts et validez chaque document en un
              seul endroit. Activez le compte professionnel pour commencer.
            </p>
            <Link
              href="/account"
              className="mt-6 inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500"
            >
              Activer le compte professionnel
            </Link>
          </div>
        </main>
      </div>
    )
  }

  const { data: requestsData } = await supabase
    .from('document_requests')
    .select('id, title, status, client_email, request_items(status)')
    .order('created_at', { ascending: false })
  const requests = (requestsData ?? []) as RequestRow[]

  const clients = [...new Set(requests.map((r) => r.client_email.toLowerCase()))]

  // Group requests by client email, preserving the recency order above.
  const byClient = new Map<string, RequestRow[]>()
  for (const request of requests) {
    const key = request.client_email
    const list = byClient.get(key) ?? []
    list.push(request)
    byClient.set(key, list)
  }

  return (
    <div className="flex flex-1 flex-col bg-slate-50 dark:bg-slate-950">
      <ProHeader email={user.email} />
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
          <div className="mt-8 flex flex-col gap-8">
            {[...byClient.entries()].map(([clientEmail, clientRequests]) => (
              <section key={clientEmail}>
                <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  {clientEmail}
                </h2>
                <ul className="mt-3 flex flex-col gap-3">
                  {clientRequests.map((request) => {
                    const total = request.request_items.length
                    const validated = request.request_items.filter(
                      (i) => i.status === 'validated',
                    ).length
                    return (
                      <li
                        key={request.id}
                        className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
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
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
