import { redirect } from 'next/navigation'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { signout } from '@/app/auth/actions'
import { getProfile } from '@/app/account/profile'
import { ROLE_LABELS, type RecipientRole } from '@/lib/roles'
import {
  approvePro,
  rejectPro,
  activateSubscription,
  deactivateSubscription,
} from '@/app/admin/actions'

// Free tier: up to this many active clients; beyond it a paid subscription is required.
const FREE_CLIENT_LIMIT = 5
const MONTHLY_PRICE_EUR = 35

interface ProfileRow {
  id: string
  display_name: string | null
  profession: string | null
  pro_status: string | null
  is_professional: boolean
  is_admin: boolean
  plan: string
  subscription_status: string | null
  created_at: string
}

interface RequestRow {
  professional_id: string
  client_email: string
  status: string
}

function professionLabel(profession: string | null): string {
  return profession ? (ROLE_LABELS[profession as RecipientRole] ?? profession) : '—'
}

function StatCard({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">
        {label}
      </p>
      <p
        className={`mt-1 text-2xl font-bold tracking-tight ${
          accent ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-900 dark:text-slate-50'
        }`}
      >
        {value}
      </p>
    </div>
  )
}

export default async function AdminPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/admin')

  const profile = await getProfile()
  if (!profile.isAdmin) redirect('/')

  // Service-role client: this page is admin-only, and aggregating every pro's
  // clients would otherwise be blocked by per-user RLS.
  const admin = createAdminClient()

  const { data: profilesData } = await admin
    .from('profiles')
    .select(
      'id, display_name, profession, pro_status, is_professional, is_admin, plan, subscription_status, created_at',
    )
    .order('created_at', { ascending: true })
  const profiles = (profilesData ?? []) as ProfileRow[]

  const { data: requestsData } = await admin
    .from('document_requests')
    .select('professional_id, client_email, status')
  const requests = (requestsData ?? []) as RequestRow[]

  const { data: users } = await admin.auth.admin.listUsers({ perPage: 1000 })
  const emailById = new Map<string, string>()
  for (const u of users?.users ?? []) if (u.email) emailById.set(u.id, u.email)

  // Distinct ACTIVE clients per professional (open requests only — the billing basis).
  const clientsByPro = new Map<string, Set<string>>()
  for (const r of requests) {
    if (r.status !== 'open') continue
    const set = clientsByPro.get(r.professional_id) ?? new Set<string>()
    set.add(r.client_email.toLowerCase())
    clientsByPro.set(r.professional_id, set)
  }
  const clientCount = (id: string): number => clientsByPro.get(id)?.size ?? 0

  const pending = profiles.filter((p) => p.pro_status === 'pending' && !p.is_professional)
  const pros = profiles.filter((p) => p.is_professional)

  // Platform statistics.
  const totalUsers = users?.users.length ?? profiles.length
  const activeSubs = pros.filter((p) => p.subscription_status === 'active').length
  const mrr = activeSubs * MONTHLY_PRICE_EUR
  const adminCount = profiles.filter((p) => p.is_admin).length
  const clientAccounts = Math.max(0, totalUsers - pros.length - adminCount)

  return (
    <div className="flex flex-1 flex-col bg-slate-50 dark:bg-slate-950">
      {/* Distinct admin console shell — not the client/pro header. */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-800 bg-slate-900 px-6 py-3.5">
        <div className="flex items-center gap-2.5">
          <span className="flex size-8 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">
            P
          </span>
          <div className="leading-tight">
            <p className="text-sm font-semibold text-white">PrivaDoc</p>
            <p className="text-xs font-medium text-indigo-300">Console d&apos;administration</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="hidden text-sm text-slate-400 sm:inline">{user.email}</span>
          <form action={signout}>
            <button
              type="submit"
              className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm font-medium text-slate-200 transition hover:bg-slate-800"
            >
              Se déconnecter
            </button>
          </form>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
          Tableau de bord plateforme
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Vue d&apos;ensemble, validation des comptes professionnels et gestion des abonnements.
        </p>

        {/* Statistics */}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <StatCard label="Utilisateurs" value={String(totalUsers)} />
          <StatCard label="Clients" value={String(clientAccounts)} />
          <StatCard label="Pros actifs" value={String(pros.length)} />
          <StatCard label="En attente" value={String(pending.length)} accent={pending.length > 0} />
          <StatCard label="Abonnements" value={String(activeSubs)} />
          <StatCard label="Revenu / mois" value={`${mrr} €`} accent />
        </div>

        {/* Pending pro requests */}
        <section className="mt-10">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Demandes en attente ({pending.length})
          </h2>
          {pending.length === 0 ? (
            <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
              <p className="px-4 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                Aucune demande en attente.
              </p>
            </div>
          ) : (
            <ul className="mt-3 flex flex-col gap-3">
              {pending.map((row) => (
                <li
                  key={row.id}
                  className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-slate-900 dark:text-slate-100">
                      {row.display_name?.trim() || emailById.get(row.id) || 'Sans nom'}
                    </p>
                    <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
                      {emailById.get(row.id) ?? row.id} · {professionLabel(row.profession)}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">
                      Demandé le {new Date(row.created_at).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <form action={approvePro}>
                      <input type="hidden" name="profileId" value={row.id} />
                      <button
                        type="submit"
                        className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500"
                      >
                        Approuver
                      </button>
                    </form>
                    <form action={rejectPro}>
                      <input type="hidden" name="profileId" value={row.id} />
                      <button
                        type="submit"
                        className="rounded-lg border border-red-300 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/40"
                      >
                        Refuser
                      </button>
                    </form>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Active professionals + subscriptions */}
        <section className="mt-10">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Comptes professionnels ({pros.length})
          </h2>
          {pros.length === 0 ? (
            <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
              <p className="px-4 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                Aucun compte professionnel actif.
              </p>
            </div>
          ) : (
            <ul className="mt-3 flex flex-col gap-3">
              {pros.map((row) => {
                const count = clientCount(row.id)
                const subscribed = row.subscription_status === 'active'
                const overLimit = count > FREE_CLIENT_LIMIT
                const needsPayment = overLimit && !subscribed
                return (
                  <li
                    key={row.id}
                    className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-slate-900 dark:text-slate-100">
                        {row.display_name?.trim() || emailById.get(row.id) || 'Sans nom'}
                      </p>
                      <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
                        {emailById.get(row.id) ?? row.id} · {professionLabel(row.profession)}
                      </p>
                      <p className="mt-1.5 flex flex-wrap items-center gap-2 text-xs">
                        <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                          {count}/{FREE_CLIENT_LIMIT} clients
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
                        {needsPayment && (
                          <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 font-medium text-amber-700 dark:bg-amber-950/50 dark:text-amber-300">
                            Abonnement requis ({MONTHLY_PRICE_EUR} €/mois)
                          </span>
                        )}
                      </p>
                    </div>
                    <form action={subscribed ? deactivateSubscription : activateSubscription}>
                      <input type="hidden" name="profileId" value={row.id} />
                      <button
                        type="submit"
                        className={
                          subscribed
                            ? 'rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800'
                            : 'rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500'
                        }
                      >
                        {subscribed ? "Désactiver l'abonnement" : "Valider l'abonnement"}
                      </button>
                    </form>
                  </li>
                )
              })}
            </ul>
          )}
        </section>
      </main>
    </div>
  )
}
