import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/app/account/profile'
import { requestProAccount } from '@/app/account/actions'
import { RECIPIENT_ROLES, ROLE_LABELS } from '@/lib/roles'
import {
  getProRequests,
  getSharedWithPro,
  computeMetrics,
  collectToReview,
  collectDeadlines,
  groupByClient,
} from '@/app/pro/data'
import {
  PageHeader,
  StatTile,
  Card,
  ProgressBar,
  Avatar,
  EmptyState,
  ButtonLink,
} from '@/app/pro/ui'

const TOP_CLIENTS = 5

export default async function ProPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/pro')

  const profile = await getProfile()

  // Pro space is reserved for APPROVED professional accounts. A client sees the
  // onboarding (request to become pro) or a pending-validation notice instead.
  // The layout provides the header + centered column, so we return only the card.
  if (!profile.isProfessional) {
    const pending = profile.proStatus === 'pending'
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center dark:border-slate-800 dark:bg-slate-900">
        {pending ? (
          <>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
              Demande en cours de validation
            </h1>
            <p className="mx-auto mt-3 max-w-md text-sm text-slate-500 dark:text-slate-400">
              Votre compte professionnel est en attente d&apos;approbation par un administrateur.
              Vous recevrez un email dès qu&apos;il sera activé.
            </p>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
              Espace professionnel
            </h1>
            <p className="mx-auto mt-3 max-w-md text-sm text-slate-500 dark:text-slate-400">
              Demandez des pièces à vos clients, suivez leurs dépôts et validez chaque document en
              un seul endroit. Créez votre compte professionnel — il sera activé après validation
              par un administrateur.
            </p>
            <form action={requestProAccount} className="mx-auto mt-6 flex max-w-sm flex-col gap-3 text-left">
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
                  required
                  maxLength={120}
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
                  defaultValue=""
                  className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                >
                  <option value="">— Choisir dans la liste —</option>
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
                  placeholder="Ou saisissez votre profession si absente de la liste"
                  className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                />
              </div>
              <button
                type="submit"
                className="mt-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500"
              >
                Créer un compte professionnel
              </button>
            </form>
          </>
        )}
      </div>
    )
  }

  // Approved pro dashboard. getProRequests / getSharedWithPro are request-cached
  // (React cache) and shared across every /pro/* page, so metrics agree everywhere.
  const [requests, sharedDocs] = await Promise.all([getProRequests(), getSharedWithPro()])
  const metrics = computeMetrics(requests)
  const toReview = collectToReview(requests)
  const deadlines = collectDeadlines(requests)
  const clients = groupByClient(requests).slice(0, TOP_CLIENTS)

  return (
    <div className="space-y-8">
      <PageHeader
        title="Tableau de bord"
        subtitle="Suivez vos clients et l'avancement de leurs dossiers."
        action={<ButtonLink href="/pro/nouvelle-demande">Nouvelle demande</ButtonLink>}
      />

      {/* Diagnostic layer */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <StatTile label="Clients actifs" value={metrics.activeClients} />
        <StatTile label="Dossiers en cours" value={metrics.openCount} />
        <StatTile label="Pièces à valider" value={metrics.toReviewCount} tone="amber" />
        <StatTile
          label="Taux de complétion"
          value={`${metrics.completionRate}%`}
          tone={metrics.completionRate === 100 ? 'emerald' : 'accent'}
        />
        <StatTile label="Retards" value={metrics.overdueCount} tone="red" />
      </div>

      {/* Pieces awaiting the pro's review */}
      {toReview.length > 0 && (
        <Card title="À valider" count={toReview.length}>
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {toReview.map((piece, i) => (
              <li
                key={`${piece.requestId}-${i}`}
                className="flex items-center justify-between gap-4 px-5 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">
                    {piece.label}
                  </p>
                  <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                    {piece.title} · {piece.client}
                  </p>
                </div>
                <ButtonLink href={`/pro/${piece.requestId}`} size="sm">
                  Examiner
                </ButtonLink>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Upcoming / overdue deadlines */}
      <Card title="Échéances à venir" count={deadlines.length}>
        {deadlines.length > 0 ? (
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {deadlines.map((d, i) => (
              <li key={`${d.requestId}-${i}`} className="px-5 py-3">
                <Link
                  href={`/pro/${d.requestId}`}
                  className="flex items-center justify-between gap-4"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-900 hover:text-indigo-600 dark:text-slate-100 dark:hover:text-indigo-400">
                      {d.label}
                    </p>
                    <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                      {d.title} · {d.client}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      d.overdue
                        ? 'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300'
                        : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                    }`}
                  >
                    {d.overdue ? 'En retard · ' : ''}
                    {new Date(d.due).toLocaleDateString('fr-FR')}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState>Aucune échéance à venir. Tout est à jour.</EmptyState>
        )}
      </Card>

      {/* Documents a client shared with this pro (collaboration on their vault) */}
      {sharedDocs.length > 0 && (
        <Card title="Partagé avec moi" count={sharedDocs.length}>
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {sharedDocs.map((doc) => (
              <li key={doc.id} className="flex items-center justify-between gap-4 px-5 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">
                    {doc.title}
                  </p>
                  <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                    {doc.sharer ? `Partagé par ${doc.sharer} · ` : ''}
                    {new Date(doc.created_at).toLocaleDateString('fr-FR')}
                  </p>
                </div>
                {doc.signedUrl && (
                  <a
                    href={doc.signedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900"
                  >
                    Ouvrir
                  </a>
                )}
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Clients overview */}
      {clients.length > 0 ? (
        <Card
          title="Clients"
          count={metrics.activeClients}
          action={
            <ButtonLink href="/pro/clients" size="sm">
              Voir tout
            </ButtonLink>
          }
        >
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {clients.map((client) => (
              <li key={client.email}>
                <Link
                  href="/pro/clients"
                  className="flex items-center gap-3 px-5 py-3.5 transition hover:bg-slate-50 dark:hover:bg-slate-800/40"
                >
                  <Avatar label={client.name || client.email} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">
                      {client.name || client.email}
                    </p>
                    <div className="mt-1.5 flex items-center gap-2">
                      <ProgressBar value={client.completionRate} total={100} />
                      <span className="shrink-0 text-xs font-medium tabular-nums text-slate-500 dark:text-slate-400">
                        {client.completionRate}%
                      </span>
                    </div>
                  </div>
                  {client.toReviewCount > 0 && (
                    <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-950/50 dark:text-amber-300">
                      {client.toReviewCount} à valider
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      ) : (
        <Card>
          <EmptyState
            cta={<ButtonLink href="/pro/nouvelle-demande">Créer une demande</ButtonLink>}
          >
            Aucune demande pour l&apos;instant. Créez une demande de pièces pour un client afin de
            suivre ses dépôts ici.
          </EmptyState>
        </Card>
      )}
    </div>
  )
}
