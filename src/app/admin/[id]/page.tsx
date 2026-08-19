import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { signout } from '@/app/auth/actions'
import { getProfile } from '@/app/account/profile'
import { ROLE_LABELS, type RecipientRole } from '@/lib/roles'
import { activateSubscription, deactivateSubscription, revokePro } from '@/app/admin/actions'

const FREE_CLIENT_LIMIT = 5

const REQUEST_STATUS: Record<string, { label: string; className: string }> = {
  open: { label: 'En cours', className: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300' },
  completed: {
    label: 'Terminée',
    className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300',
  },
  archived: { label: 'Archivée', className: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400' },
}

interface RequestRow {
  id: string
  title: string
  client_email: string
  client_name: string | null
  status: string
  created_at: string
  request_items: { status: string }[]
}

function professionLabel(profession: string | null): string {
  return profession ? (ROLE_LABELS[profession as RecipientRole] ?? profession) : '—'
}

export default async function AdminProDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/admin')

  const profile = await getProfile()
  if (!profile.isAdmin) redirect('/')

  const admin = createAdminClient()

  const [{ data: target }, { data: requestsData }, { data: authUser }] = await Promise.all([
    admin
      .from('profiles')
      .select('id, display_name, profession, is_professional, plan, subscription_status, created_at')
      .eq('id', id)
      .maybeSingle(),
    admin
      .from('document_requests')
      .select('id, title, client_email, client_name, status, created_at, request_items(status)')
      .eq('professional_id', id)
      .order('created_at', { ascending: false }),
    admin.auth.admin.getUserById(id),
  ])

  if (!target) notFound()

  const email = authUser?.user?.email ?? id
  const requests = (requestsData ?? []) as RequestRow[]
  const subscribed = target.subscription_status === 'active'
  const activeClients = new Set(
    requests.filter((r) => r.status === 'open').map((r) => r.client_email.toLowerCase()),
  ).size

  return (
    <div className="flex flex-1 flex-col bg-slate-50 dark:bg-slate-950">
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-800 bg-slate-900 px-6 py-3.5">
        <Link href="/admin" className="flex items-center gap-2.5">
          <span className="flex size-8 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">
            P
          </span>
          <div className="leading-tight">
            <p className="text-sm font-semibold text-white">PrivaDoc</p>
            <p className="text-xs font-medium text-indigo-300">Console d&apos;administration</p>
          </div>
        </Link>
        <form action={signout}>
          <button
            type="submit"
            className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm font-medium text-slate-200 transition hover:bg-slate-800"
          >
            Se déconnecter
          </button>
        </form>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
        <nav aria-label="Fil d'Ariane" className="flex items-center gap-1 text-sm">
          <Link href="/admin" className="font-medium text-slate-500 hover:text-indigo-600 dark:text-slate-400">
            Console
          </Link>
          <span className="text-slate-300 dark:text-slate-600">/</span>
          <span className="text-slate-500 dark:text-slate-400">Professionnel</span>
        </nav>

        {/* Profile card */}
        <div className="mt-3 rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
                {target.display_name?.trim() || 'Sans nom'}
              </h1>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {email} · {professionLabel(target.profession)}
              </p>
              <p className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  {activeClients}/{FREE_CLIENT_LIMIT} clients actifs
                </span>
                <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  {requests.length} demande{requests.length > 1 ? 's' : ''}
                </span>
                <span
                  className={
                    subscribed
                      ? 'inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 font-medium text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                      : 'inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                  }
                >
                  {subscribed ? 'Abonnement actif' : 'Gratuit'}
                </span>
                <span className="text-slate-400 dark:text-slate-500">
                  Membre depuis le {new Date(target.created_at).toLocaleDateString('fr-FR')}
                </span>
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <form action={subscribed ? deactivateSubscription : activateSubscription}>
                <input type="hidden" name="profileId" value={target.id} />
                <button
                  type="submit"
                  className={
                    subscribed
                      ? 'rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800'
                      : 'rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500'
                  }
                >
                  {subscribed ? "Désactiver l'abonnement" : "Valider l'abonnement"}
                </button>
              </form>
              <form action={revokePro}>
                <input type="hidden" name="profileId" value={target.id} />
                <button
                  type="submit"
                  className="rounded-lg border border-red-300 px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/40"
                >
                  Rétrograder en client
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Requests */}
        <h2 className="mt-8 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Demandes de pièces ({requests.length})
        </h2>
        {requests.length === 0 ? (
          <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
            <p className="px-4 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
              Aucune demande.
            </p>
          </div>
        ) : (
          <ul className="mt-3 flex flex-col gap-3">
            {requests.map((r) => {
              const total = r.request_items.length
              const validated = r.request_items.filter((i) => i.status === 'validated').length
              const badge = REQUEST_STATUS[r.status] ?? REQUEST_STATUS.open
              return (
                <li
                  key={r.id}
                  className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-slate-900 dark:text-slate-100">{r.title}</p>
                    <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
                      {r.client_name?.trim() || r.client_email}
                      {r.client_name?.trim() ? ` · ${r.client_email}` : ''}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">
                      Créée le {new Date(r.created_at).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {validated}/{total} validées
                    </span>
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${badge.className}`}
                    >
                      {badge.label}
                    </span>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </main>
    </div>
  )
}
