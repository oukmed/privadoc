import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/app/account/profile'
import { getProRequests, groupByClient, requestProgress } from '@/app/pro/data'
import {
  PageHeader,
  Card,
  StatusBadge,
  ProgressBar,
  Avatar,
  EmptyState,
  ButtonLink,
} from '@/app/pro/ui'

export default async function ClientsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/pro/clients')

  const profile = await getProfile()
  if (!profile.isProfessional) redirect('/pro')

  const groups = groupByClient(await getProRequests())

  return (
    <div className="space-y-6">
      <PageHeader
        title="Clients"
        subtitle="Vos clients et l'avancement de leurs dossiers."
        action={<ButtonLink href="/pro/nouvelle-demande">Nouvelle demande</ButtonLink>}
      />

      {groups.length === 0 ? (
        <Card>
          <EmptyState
            cta={<ButtonLink href="/pro/nouvelle-demande">Nouvelle demande</ButtonLink>}
          >
            Aucun client pour l&apos;instant. Créez une première demande pour ajouter un client.
          </EmptyState>
        </Card>
      ) : (
        <div className="flex flex-col gap-5">
          {groups.map((group) => {
            const label = group.name || group.email
            return (
              <Card key={group.email}>
                <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 px-5 py-4 dark:border-slate-800">
                  <div className="flex min-w-0 items-center gap-3">
                    <Avatar label={label} />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {label}
                      </p>
                      <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                        {group.email}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-1 items-center justify-end gap-4">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-medium text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300">
                        {group.openCount} en cours
                      </span>
                      {group.toReviewCount > 0 && (
                        <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-950/50 dark:text-amber-300">
                          {group.toReviewCount} à valider
                        </span>
                      )}
                    </div>
                    <div className="w-32 shrink-0">
                      <ProgressBar value={group.completionRate} total={100} />
                      <p className="mt-1 text-right text-xs font-medium text-slate-500 dark:text-slate-400">
                        {group.completionRate}%
                      </p>
                    </div>
                  </div>
                </header>

                <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                  {group.requests.map((request) => {
                    const { total, validated } = requestProgress(request)
                    return (
                      <li key={request.id}>
                        <Link
                          href={`/pro/${request.id}`}
                          className="flex items-center justify-between gap-4 px-5 py-3.5 transition hover:bg-slate-50 dark:hover:bg-slate-800/40"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">
                              {request.title}
                            </p>
                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                              {validated}/{total} validées
                            </p>
                          </div>
                          <StatusBadge status={request.status} kind="request" />
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
