import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Brand } from '@/app/brand'
import { signout } from '@/app/auth/actions'
import { getProfile } from '@/app/account/profile'
import { requestProAccount, updateProProfile } from '@/app/account/actions'
import { RECIPIENT_ROLES, ROLE_LABELS } from '@/lib/roles'

export default async function AccountPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const profile = await getProfile()

  // Distinct clients across the pro's requests (RLS: professional_id = auth.uid()).
  let activeClients = 0
  if (profile.isProfessional) {
    const { data: requests } = await supabase.from('document_requests').select('client_email')
    activeClients = new Set((requests ?? []).map((r) => r.client_email.toLowerCase())).size
  }

  return (
    <div className="flex flex-1 flex-col bg-slate-50 dark:bg-slate-950">
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200/80 bg-white/80 px-6 py-3.5 backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-900/70">
        <Brand />
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="text-sm font-medium text-slate-600 transition hover:text-indigo-600 dark:text-slate-300 dark:hover:text-indigo-400"
          >
            Mes documents
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
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">Mon compte</h1>

        <section className="mt-8 rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">Type de compte</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Statut actuel :{' '}
                <span
                  className={
                    profile.isProfessional
                      ? 'font-medium text-indigo-600 dark:text-indigo-400'
                      : 'font-medium text-slate-700 dark:text-slate-200'
                  }
                >
                  {profile.isProfessional
                    ? 'Professionnel'
                    : profile.proStatus === 'pending'
                      ? 'Demande professionnelle en attente'
                      : 'Privé (client)'}
                </span>
              </p>
            </div>
            {!profile.isProfessional && profile.proStatus !== 'pending' && (
              <form action={requestProAccount}>
                <button
                  type="submit"
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500"
                >
                  Demander un compte professionnel
                </button>
              </form>
            )}
          </div>

          {!profile.isProfessional && profile.proStatus === 'pending' && (
            <p className="mt-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
              Votre demande de compte professionnel est en cours de validation par un administrateur.
              Vous recevrez un email dès qu&apos;elle sera approuvée.
            </p>
          )}

          {profile.isProfessional && (
            <div className="mt-6 border-t border-slate-200 pt-6 dark:border-slate-800">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                Votre identité (visible par vos clients)
              </h3>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Ce nom et cette profession apparaissent dans les emails et l&apos;espace de vos clients.
              </p>
              <form action={updateProProfile} className="mt-4 flex flex-col gap-4">
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
                    maxLength={120}
                    defaultValue={profile.displayName ?? ''}
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
                    defaultValue={profile.profession ?? ''}
                    className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                  >
                    <option value="">— Non précisée —</option>
                    {RECIPIENT_ROLES.map((role) => (
                      <option key={role} value={role}>
                        {ROLE_LABELS[role]}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  type="submit"
                  className="self-start rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500"
                >
                  Enregistrer
                </button>
              </form>
            </div>
          )}

          {profile.isProfessional && (
            <div className="mt-6 border-t border-slate-200 pt-6 dark:border-slate-800">
              <div className="flex flex-wrap items-baseline gap-2">
                <span className="text-2xl font-bold text-slate-900 dark:text-slate-50">
                  {activeClients}
                </span>
                <span className="text-sm text-slate-500 dark:text-slate-400">
                  {activeClients <= 1 ? 'client actif' : 'clients actifs'}
                </span>
              </div>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                Gratuit jusqu&apos;à 5 clients actifs, puis 35 €/mois.
              </p>
              <Link
                href="/pro"
                className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 transition hover:text-indigo-500 dark:text-indigo-400"
              >
                Ouvrir l&apos;espace pro →
              </Link>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
