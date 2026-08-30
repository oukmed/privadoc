import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AppHeader } from '@/app/app-header'
import { getProfile } from '@/app/account/profile'
import { updateProProfile } from '@/app/account/actions'
import { RECIPIENT_ROLES, ROLE_LABELS, type RecipientRole } from '@/lib/roles'
import { storageStatus, formatBytes } from '@/lib/storage-quota'
import { getT } from '@/lib/i18n/server'

export default async function AccountPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const profile = await getProfile()
  const t = await getT()

  const { used, quota } = await storageStatus(supabase)
  const usedPct = Math.min(100, Math.round((used / quota) * 100))

  // Split a saved profession into "known role" (select) vs free text (custom input).
  const isKnownProfession =
    !!profile.profession && RECIPIENT_ROLES.includes(profile.profession as RecipientRole)
  const professionSelectValue = isKnownProfession ? (profile.profession as string) : ''
  const customProfessionValue = !isKnownProfession ? (profile.profession ?? '') : ''

  // Distinct clients across the pro's requests (RLS: professional_id = auth.uid()).
  let activeClients = 0
  if (profile.isProfessional) {
    const { data: requests } = await supabase
      .from('document_requests')
      .select('client_email')
      .eq('status', 'open')
    activeClients = new Set((requests ?? []).map((r) => r.client_email.toLowerCase())).size
  }

  return (
    <div className="flex flex-1 flex-col bg-slate-50 dark:bg-slate-950">
      <AppHeader />

      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
          {t('inbox.account.title')}
        </h1>

        <section className="mt-8 rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
                {t('inbox.account.accountType')}
              </h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {t('inbox.account.currentStatus')}{' '}
                <span
                  className={
                    profile.isProfessional
                      ? 'font-medium text-indigo-600 dark:text-indigo-400'
                      : 'font-medium text-slate-700 dark:text-slate-200'
                  }
                >
                  {profile.isProfessional
                    ? t('inbox.account.statusPro')
                    : profile.proStatus === 'pending'
                      ? t('inbox.account.statusPending')
                      : t('inbox.account.statusPrivate')}
                </span>
              </p>
            </div>
            {!profile.isProfessional && profile.proStatus !== 'pending' && (
              <Link
                href="/pro"
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500"
              >
                {t('inbox.account.becomePro')}
              </Link>
            )}
          </div>

          {!profile.isProfessional && profile.proStatus === 'pending' && (
            <p className="mt-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
              {t('inbox.account.pendingNotice')}
            </p>
          )}

          <div className="mt-6 border-t border-slate-200 pt-6 dark:border-slate-800">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                {t('inbox.account.storage')}
              </h3>
              <span className="text-sm text-slate-500 dark:text-slate-400">
                {t('inbox.account.storageUsage', {
                  used: formatBytes(used),
                  quota: formatBytes(quota),
                })}
              </span>
            </div>
            <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
              <div
                className={`h-full rounded-full ${usedPct >= 90 ? 'bg-red-500' : 'bg-indigo-600'}`}
                style={{ width: `${usedPct}%` }}
              />
            </div>
            {!profile.isProfessional && (
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                {t('inbox.account.moreSpace')}
              </p>
            )}
          </div>

          <div className="mt-6 border-t border-slate-200 pt-6 dark:border-slate-800">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                {t('inbox.account.yourName')}
              </h3>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {t('inbox.account.nameHint')}
              </p>
              <form action={updateProProfile} className="mt-4 flex flex-col gap-4">
                <div>
                  <label
                    htmlFor="displayName"
                    className="block text-sm font-medium text-slate-700 dark:text-slate-300"
                  >
                    {t('inbox.account.nameOrFirm')}
                  </label>
                  <input
                    id="displayName"
                    name="displayName"
                    type="text"
                    maxLength={120}
                    defaultValue={profile.displayName ?? ''}
                    placeholder={t('inbox.account.namePlaceholder')}
                    className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                  />
                </div>
                {profile.isProfessional && (
                  <div>
                    <label
                      htmlFor="profession"
                      className="block text-sm font-medium text-slate-700 dark:text-slate-300"
                    >
                      {t('inbox.account.profession')}
                    </label>
                    <select
                      id="profession"
                      name="profession"
                      defaultValue={professionSelectValue}
                      className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                    >
                      <option value="">{t('inbox.account.chooseFromList')}</option>
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
                      defaultValue={customProfessionValue}
                      placeholder={t('inbox.account.customProfessionPlaceholder')}
                      className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                    />
                  </div>
                )}
                <button
                  type="submit"
                  className="self-start rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500"
                >
                  {t('inbox.account.save')}
                </button>
              </form>
          </div>

          {profile.isProfessional && (
            <div className="mt-6 border-t border-slate-200 pt-6 dark:border-slate-800">
              <div className="flex flex-wrap items-baseline gap-2">
                <span className="text-2xl font-bold text-slate-900 dark:text-slate-50">
                  {activeClients}
                </span>
                <span className="text-sm text-slate-500 dark:text-slate-400">
                  {activeClients <= 1
                    ? t('inbox.account.clientActive')
                    : t('inbox.account.clientsActive')}
                </span>
              </div>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                {t('inbox.account.pricingNote')}
              </p>
              <Link
                href="/pro"
                className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 transition hover:text-indigo-500 dark:text-indigo-400"
              >
                {t('inbox.account.openProSpace')}
              </Link>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
