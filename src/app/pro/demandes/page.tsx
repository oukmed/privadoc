import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/app/account/profile'
import { getProRequests, requestProgress, clientLabel } from '@/app/pro/data'
import { deleteRequest } from '@/app/pro/actions'
import {
  PageHeader,
  Card,
  StatusBadge,
  ProgressBar,
  EmptyState,
  ButtonLink,
} from '@/app/pro/ui'

// "Suivi des demandes" — every request the pro has created, filterable by
// status, to track each dossier's progress. Composes the shared /pro primitives.

const FILTERS = [
  { key: 'open', label: 'En cours' },
  { key: 'completed', label: 'Terminées' },
  { key: 'archived', label: 'Archivées' },
  { key: 'all', label: 'Toutes' },
] as const

type FilterKey = (typeof FILTERS)[number]['key']

function isFilterKey(value: string): value is FilterKey {
  return FILTERS.some((f) => f.key === value)
}

export default async function DemandesPage({
  searchParams,
}: {
  searchParams: Promise<{ statut?: string | string[] }>
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/pro/demandes')

  const profile = await getProfile()
  if (!profile.isProfessional) redirect('/pro')

  const sp = await searchParams
  const raw = typeof sp.statut === 'string' ? sp.statut : ''
  const active: FilterKey = isFilterKey(raw) ? raw : 'open'

  const requests = await getProRequests()
  const filtered = active === 'all' ? requests : requests.filter((r) => r.status === active)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Demandes"
        subtitle="Suivez l'avancement de chaque dossier."
        action={
          <ButtonLink href="/pro/nouvelle-demande">Nouvelle demande</ButtonLink>
        }
      />

      {/* Status filter — pill toggles that set ?statut= */}
      <nav aria-label="Filtrer par statut" className="flex flex-wrap gap-1.5">
        {FILTERS.map((f) => {
          const isActive = f.key === active
          return (
            <Link
              key={f.key}
              href={f.key === 'open' ? '/pro/demandes' : `/pro/demandes?statut=${f.key}`}
              aria-current={isActive ? 'page' : undefined}
              className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-950 ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'border border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
              }`}
            >
              {f.label}
            </Link>
          )
        })}
      </nav>

      {filtered.length === 0 ? (
        <Card>
          <EmptyState
            cta={<ButtonLink href="/pro/nouvelle-demande">Nouvelle demande</ButtonLink>}
          >
            {active === 'all'
              ? "Aucune demande pour l'instant. Créez une demande de pièces pour un client."
              : 'Aucune demande avec ce statut.'}
          </EmptyState>
        </Card>
      ) : (
        <Card title="Demandes" count={filtered.length}>
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {filtered.map((request) => {
              const progress = requestProgress(request)
              return (
                <li
                  key={request.id}
                  className="px-5 py-4 transition hover:bg-slate-50 dark:hover:bg-slate-800/40"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <Link
                          href={`/pro/${request.id}`}
                          className="truncate font-medium text-slate-900 hover:text-indigo-600 dark:text-slate-100 dark:hover:text-indigo-400"
                        >
                          {request.title}
                        </Link>
                        <StatusBadge status={request.status} kind="request" />
                      </div>
                      <p className="mt-1 truncate text-xs text-slate-500 dark:text-slate-400">
                        {clientLabel(request)} ·{' '}
                        {new Date(request.created_at).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                    <form action={deleteRequest}>
                      <input type="hidden" name="id" value={request.id} />
                      <button
                        type="submit"
                        className="shrink-0 text-sm font-medium text-red-600 transition hover:text-red-500 dark:text-red-400"
                      >
                        Supprimer
                      </button>
                    </form>
                  </div>

                  <div className="mt-3">
                    <ProgressBar value={progress.validated} total={progress.total} />
                    <p className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <span>
                        {progress.validated}/{progress.total} validées
                      </span>
                      {progress.submitted > 0 && (
                        <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 font-medium text-amber-700 dark:bg-amber-950/50 dark:text-amber-300">
                          {progress.submitted} à valider
                        </span>
                      )}
                    </p>
                  </div>
                </li>
              )
            })}
          </ul>
        </Card>
      )}
    </div>
  )
}
