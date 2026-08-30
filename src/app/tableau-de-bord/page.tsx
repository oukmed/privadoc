import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/app/account/profile'
import { ClientShell } from '@/app/client-shell'
import { formatBytes } from '@/lib/storage-quota'
import { getT } from '@/lib/i18n/server'
import { PageHeader, StatTile, Card, EmptyState, ButtonLink } from '@/app/platform-ui'

interface OwnedDoc {
  id: string
  title: string
  size_bytes: number | null
  created_at: string
}

const RECENT_LIMIT = 6

/** Private client home: an at-a-glance overview of the personal vault. Pros and
 * admins have their own spaces and are redirected there. */
export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/tableau-de-bord')

  const profile = await getProfile()
  if (profile.isAdmin) redirect('/admin')
  // Pros — approved or still pending admin validation — belong on /pro.
  if (profile.isProfessional || profile.proStatus === 'pending') redirect('/pro')

  const t = await getT()

  const [ownedRes, sharedRes, collabRes, requestsRes] = await Promise.all([
    supabase
      .from('documents')
      .select('id, title, size_bytes, created_at')
      .eq('owner_id', user.id)
      .order('created_at', { ascending: false }),
    supabase.from('documents').select('id', { count: 'exact', head: true }).neq('owner_id', user.id),
    supabase.from('collaborators').select('id', { count: 'exact', head: true }).eq('owner_id', user.id),
    supabase.from('document_requests').select('id, status').eq('client_id', user.id),
  ])

  const owned = (ownedRes.data ?? []) as OwnedDoc[]
  const storageUsed = owned.reduce((sum, d) => sum + (d.size_bytes ?? 0), 0)
  const sharedCount = sharedRes.count ?? 0
  const collabCount = collabRes.count ?? 0
  const pendingRequests = (requestsRes.data ?? []).filter((r) => r.status === 'open').length

  const recent = owned.slice(0, RECENT_LIMIT)
  const name = profile.displayName?.trim()
  const greeting = name
    ? t('vault.dashboard.greeting', { name })
    : t('vault.dashboard.greetingPlain')

  return (
    <ClientShell>
      <div className="space-y-8">
        <PageHeader
          title={t('vault.dashboard.title')}
          subtitle={t('vault.dashboard.subtitle', { greeting })}
          action={<ButtonLink href="/">{t('vault.dashboard.myDocuments')}</ButtonLink>}
        />

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <StatTile label={t('vault.dashboard.statDocuments')} value={owned.length} />
          <StatTile label={t('vault.dashboard.statStorage')} value={formatBytes(storageUsed)} />
          <StatTile label={t('vault.dashboard.statShared')} value={sharedCount} tone="accent" />
          <StatTile
            label={t('vault.dashboard.statPending')}
            value={pendingRequests}
            tone={pendingRequests > 0 ? 'amber' : 'neutral'}
          />
          <StatTile label={t('vault.dashboard.statCollaborators')} value={collabCount} />
        </div>

        <Card
          title={t('vault.dashboard.recentTitle')}
          count={owned.length}
          action={
            <ButtonLink href="/" size="sm">
              {t('vault.dashboard.seeAll')}
            </ButtonLink>
          }
        >
          {recent.length === 0 ? (
            <EmptyState cta={<ButtonLink href="/">{t('vault.dashboard.addDocument')}</ButtonLink>}>
              {t('vault.dashboard.emptyRecent')}
            </EmptyState>
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {recent.map((doc) => (
                <li key={doc.id} className="flex items-center justify-between gap-4 px-5 py-3">
                  <p className="min-w-0 truncate text-sm font-medium text-slate-900 dark:text-slate-100">
                    {doc.title}
                  </p>
                  <p className="shrink-0 text-xs text-slate-500 dark:text-slate-400">
                    {formatBytes(doc.size_bytes ?? 0)} · {new Date(doc.created_at).toLocaleDateString('fr-FR')}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {(sharedCount > 0 || pendingRequests > 0) && (
          <div className="grid gap-4 sm:grid-cols-2">
            {sharedCount > 0 && (
              <Card title={t('vault.dashboard.sharedTitle')}>
                <div className="flex items-center justify-between gap-4 px-5 py-4">
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    {t(
                      sharedCount > 1
                        ? 'vault.dashboard.sharedBody.other'
                        : 'vault.dashboard.sharedBody.one',
                      { count: sharedCount },
                    )}
                  </p>
                  <ButtonLink href="/" size="sm">
                    {t('vault.dashboard.consult')}
                  </ButtonLink>
                </div>
              </Card>
            )}
            {pendingRequests > 0 && (
              <Card title={t('vault.dashboard.requestsTitle')}>
                <div className="flex items-center justify-between gap-4 px-5 py-4">
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    {t(
                      pendingRequests > 1
                        ? 'vault.dashboard.requestsBody.other'
                        : 'vault.dashboard.requestsBody.one',
                      { count: pendingRequests },
                    )}
                  </p>
                  <ButtonLink href="/requests" size="sm">
                    {t('vault.dashboard.reply')}
                  </ButtonLink>
                </div>
              </Card>
            )}
          </div>
        )}
      </div>
    </ClientShell>
  )
}
