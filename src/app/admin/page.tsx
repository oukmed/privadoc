import { redirect } from 'next/navigation'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { Brand } from '@/app/brand'
import { signout } from '@/app/auth/actions'
import { getProfile } from '@/app/account/profile'
import { ROLE_LABELS, type RecipientRole } from '@/lib/roles'
import { approvePro, rejectPro } from '@/app/admin/actions'

interface PendingRow {
  id: string
  display_name: string | null
  profession: string | null
  created_at: string
}

function professionLabel(profession: string | null): string {
  return profession ? (ROLE_LABELS[profession as RecipientRole] ?? profession) : '—'
}

export default async function AdminPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/admin')

  const profile = await getProfile()
  if (!profile.isAdmin) redirect('/')

  // Admin RLS lets the admin read every profile.
  const { data: pendingData } = await supabase
    .from('profiles')
    .select('id, display_name, profession, created_at')
    .eq('pro_status', 'pending')
    .order('created_at', { ascending: true })
  const pending = (pendingData ?? []) as PendingRow[]

  // Emails live in auth.users — resolve them with the service-role client.
  const emailById = new Map<string, string>()
  if (pending.length > 0) {
    const { data: users } = await createAdminClient().auth.admin.listUsers({ perPage: 1000 })
    for (const u of users?.users ?? []) if (u.email) emailById.set(u.id, u.email)
  }

  return (
    <div className="flex flex-1 flex-col bg-slate-50 dark:bg-slate-950">
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200/80 bg-white/80 px-6 py-3.5 backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-900/70">
        <Brand />
        <div className="flex items-center gap-4">
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
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
          Administration
        </h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Demandes de comptes professionnels en attente de validation.
        </p>

        {pending.length === 0 ? (
          <div className="mt-8 overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
            <p className="px-4 py-10 text-center text-sm text-slate-500 dark:text-slate-400">
              Aucune demande en attente.
            </p>
          </div>
        ) : (
          <ul className="mt-8 flex flex-col gap-3">
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
      </main>
    </div>
  )
}
