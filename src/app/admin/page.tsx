import { redirect } from 'next/navigation'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { signout } from '@/app/auth/actions'
import { getProfile } from '@/app/account/profile'
import { ROLE_LABELS, type RecipientRole } from '@/lib/roles'
import { approvePro, rejectPro } from '@/app/admin/actions'
import { AdminAccounts, type ProItem, type ClientItem } from '@/app/admin/accounts'

const MONTHLY_PRICE_EUR = 35
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000

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
  client_name: string | null
  status: string
}

function professionLabel(profession: string | null): string {
  return profession ? (ROLE_LABELS[profession as RecipientRole] ?? profession) : '—'
}

/** Count profiles created within the last 30 days. Kept out of render (reads the clock). */
function countNewUsers(profiles: ProfileRow[]): number {
  const cutoff = Date.now() - THIRTY_DAYS_MS
  return profiles.filter((p) => new Date(p.created_at).getTime() >= cutoff).length
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

  // Service-role client: admin-only page; aggregating every pro's data would
  // otherwise be blocked by per-user RLS.
  const admin = createAdminClient()

  const [{ data: profilesData }, { data: requestsData }, { data: users }] = await Promise.all([
    admin
      .from('profiles')
      .select(
        'id, display_name, profession, pro_status, is_professional, is_admin, plan, subscription_status, created_at',
      )
      .order('created_at', { ascending: true }),
    admin.from('document_requests').select('professional_id, client_email, client_name, status'),
    admin.auth.admin.listUsers({ perPage: 1000 }),
  ])
  const profiles = (profilesData ?? []) as ProfileRow[]
  const requests = (requestsData ?? []) as RequestRow[]
  const emailById = new Map<string, string>()
  for (const u of users?.users ?? []) if (u.email) emailById.set(u.id, u.email)

  // Per-pro aggregates.
  const activeClientsByPro = new Map<string, Set<string>>() // open requests = billing basis
  const totalRequestsByPro = new Map<string, number>()
  // Per-client aggregates (keyed by lowercased email).
  const requestsByClientEmail = new Map<string, number>()
  const nameByClientEmail = new Map<string, string>()
  for (const r of requests) {
    totalRequestsByPro.set(r.professional_id, (totalRequestsByPro.get(r.professional_id) ?? 0) + 1)
    if (r.status === 'open') {
      const set = activeClientsByPro.get(r.professional_id) ?? new Set<string>()
      set.add(r.client_email.toLowerCase())
      activeClientsByPro.set(r.professional_id, set)
    }
    const key = r.client_email.toLowerCase()
    requestsByClientEmail.set(key, (requestsByClientEmail.get(key) ?? 0) + 1)
    if (r.client_name?.trim() && !nameByClientEmail.has(key)) {
      nameByClientEmail.set(key, r.client_name.trim())
    }
  }

  const pending = profiles.filter((p) => p.pro_status === 'pending' && !p.is_professional)

  const pros: ProItem[] = profiles
    .filter((p) => p.is_professional)
    .map((p) => ({
      id: p.id,
      name: p.display_name?.trim() || '',
      email: emailById.get(p.id) ?? p.id,
      profession: professionLabel(p.profession),
      activeClients: activeClientsByPro.get(p.id)?.size ?? 0,
      totalRequests: totalRequestsByPro.get(p.id) ?? 0,
      subscribed: p.subscription_status === 'active',
      createdAt: p.created_at,
    }))

  const clients: ClientItem[] = profiles
    .filter((p) => !p.is_professional && !p.is_admin)
    .map((p) => {
      const email = emailById.get(p.id) ?? p.id
      const key = email.toLowerCase()
      return {
        id: p.id,
        name: nameByClientEmail.get(key) ?? null,
        email,
        requestsReceived: requestsByClientEmail.get(key) ?? 0,
        createdAt: p.created_at,
      }
    })

  // Platform statistics.
  const totalUsers = users?.users.length ?? profiles.length
  const activeSubs = pros.filter((p) => p.subscribed).length
  const mrr = activeSubs * MONTHLY_PRICE_EUR
  const openRequests = requests.filter((r) => r.status === 'open').length
  const completedRequests = requests.filter((r) => r.status === 'completed').length
  const newUsers30d = countNewUsers(profiles)

  return (
    <div className="flex flex-1 flex-col bg-slate-50 dark:bg-slate-950">
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
          Vue d&apos;ensemble, comptes, validation des pros et gestion des abonnements.
        </p>

        {/* Statistics */}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <StatCard label="Utilisateurs" value={String(totalUsers)} />
          <StatCard label="Clients" value={String(clients.length)} />
          <StatCard label="Pros actifs" value={String(pros.length)} />
          <StatCard label="Abonnements" value={String(activeSubs)} />
          <StatCard label="Revenu / mois" value={`${mrr} €`} accent />
          <StatCard label="En attente" value={String(pending.length)} accent={pending.length > 0} />
          <StatCard label="Demandes" value={String(requests.length)} />
          <StatCard label="Dossiers en cours" value={String(openRequests)} />
          <StatCard label="Dossiers terminés" value={String(completedRequests)} />
          <StatCard label="Nouveaux (30j)" value={String(newUsers30d)} />
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

        {/* Searchable accounts (pros + clients) */}
        <AdminAccounts pros={pros} clients={clients} />
      </main>
    </div>
  )
}
