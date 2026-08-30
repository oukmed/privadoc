import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ClientShell } from '@/app/client-shell'
import { InviteDialog } from '@/app/collaborators/invite-dialog'
import { revokeAccess, resendInvite, removeCollaborator } from '@/app/collaborators/actions'
import { CollabActionButton } from '@/app/collaborators/resend-button'
import { ROLE_LABELS, type RecipientRole } from '@/lib/roles'
import { resolveDisplayNames } from '@/lib/names'
import { getProfile } from '@/app/account/profile'

interface AccessRow {
  id: string
  collaborator_id: string
  document_id: string | null
  folder_id: string | null
  expires_at: string | null
  documents: { title: string } | null
  folders: { name: string } | null
}

function roleLabel(role: string): string {
  return ROLE_LABELS[role as RecipientRole] ?? ROLE_LABELS.autre
}

function expiryHint(expiresAt: string | null): string | null {
  if (!expiresAt) return null
  return `expire le ${new Date(expiresAt).toLocaleDateString('fr-FR')}`
}

export default async function CollaboratorsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Collaborators is a personal-vault surface. Professional accounts run entirely
  // on /pro and never share personal folders, so they never land here.
  const { displayName, isProfessional, proStatus } = await getProfile()
  if (isProfessional || proStatus === 'pending') redirect('/pro')

  const [{ data: collaborators }, { data: access }, { data: documents }, { data: folders }] =
    await Promise.all([
      supabase
        .from('collaborators')
        .select('id, email, role, user_id, owner_id, accepted_at')
        .order('created_at', { ascending: false }),
      supabase
        .from('collaborator_access')
        .select('id, collaborator_id, document_id, folder_id, expires_at, documents(title), folders(name)'),
      supabase.from('documents').select('id, title').eq('owner_id', user.id),
      supabase.from('folders').select('id, name'),
    ])

  const accessByCollaborator = new Map<string, AccessRow[]>()
  for (const row of (access ?? []) as AccessRow[]) {
    const list = accessByCollaborator.get(row.collaborator_id) ?? []
    list.push(row)
    accessByCollaborator.set(row.collaborator_id, list)
  }

  // Names for both sides: the invitee (own rows) and the owner (rows shared WITH
  // the current user). RLS blocks reading other users' profiles, so this resolves
  // via the service-role helper.
  const rows = collaborators ?? []
  const nameByUserId = await resolveDisplayNames([
    ...rows.map((c) => c.user_id),
    ...rows.map((c) => c.owner_id),
  ])

  return (
    <ClientShell>
      <div className="mx-auto w-full max-w-3xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            Collaborateurs
          </h1>
          <InviteDialog
            documents={(documents ?? []).map((d) => ({ id: d.id, title: d.title }))}
            folders={(folders ?? []).map((f) => ({ id: f.id, name: f.name }))}
            needsName={!displayName}
          />
        </div>

        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Accorde un accès permanent en lecture seule à un tiers (avocat, comptable, banque…) sur
          les documents et dossiers de ton choix.
        </p>

        {rows.length === 0 ? (
          <div className="mt-8 overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
            <p className="px-4 py-10 text-center text-sm text-slate-500 dark:text-slate-400">
              Aucun collaborateur pour l&apos;instant.
            </p>
          </div>
        ) : (
          <ul className="mt-8 flex flex-col gap-4">
            {rows.map((collaborator) => {
              const grants = accessByCollaborator.get(collaborator.id) ?? []
              // A row is "received" when the current user is the invitee, not the owner.
              const isReceived = collaborator.owner_id === user.id ? false : collaborator.user_id === user.id
              const invitedName = collaborator.user_id ? nameByUserId.get(collaborator.user_id) : undefined
              const ownerName = nameByUserId.get(collaborator.owner_id)
              const name = isReceived ? ownerName : invitedName
              return (
                <li
                  key={collaborator.id}
                  className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate font-medium text-slate-900 dark:text-slate-100">
                          {isReceived ? name || 'Partagé avec vous' : name || collaborator.email}
                        </p>
                        <span className="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300">
                          {roleLabel(collaborator.role)}
                        </span>
                        {isReceived ? (
                          <span className="inline-flex items-center rounded-full bg-violet-50 px-2.5 py-0.5 text-xs font-medium text-violet-700 dark:bg-violet-950/50 dark:text-violet-300">
                            Partagé avec vous
                          </span>
                        ) : (
                          <span
                            className={
                              collaborator.accepted_at
                                ? 'inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                                : 'inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                            }
                          >
                            {collaborator.accepted_at ? 'Actif' : 'Invité'}
                          </span>
                        )}
                      </div>
                      {!isReceived && name && (
                        <p className="mt-0.5 truncate text-sm text-slate-500 dark:text-slate-400">
                          {collaborator.email}
                        </p>
                      )}
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      {!isReceived && (
                        <CollabActionButton
                          action={resendInvite}
                          collaboratorId={collaborator.id}
                          label="Relancer"
                          tone="indigo"
                        />
                      )}
                      <CollabActionButton
                        action={removeCollaborator}
                        collaboratorId={collaborator.id}
                        label={isReceived ? 'Quitter' : 'Retirer'}
                        tone="red"
                      />
                    </div>
                  </div>

                  {grants.length > 0 && (
                    <ul className="mt-4 flex flex-wrap gap-2">
                      {grants.map((grant) => {
                        const label = grant.folders?.name ?? grant.documents?.title ?? 'Élément supprimé'
                        const hint = expiryHint(grant.expires_at)
                        return (
                          <li
                            key={grant.id}
                            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 py-1 pl-2.5 pr-1.5 text-sm dark:border-slate-700 dark:bg-slate-800"
                          >
                            <span className="text-slate-700 dark:text-slate-200">{label}</span>
                            {hint && (
                              <span className="text-xs text-slate-400 dark:text-slate-500">
                                {hint}
                              </span>
                            )}
                            {!isReceived && (
                              <form action={revokeAccess}>
                                <input type="hidden" name="accessId" value={grant.id} />
                                <button
                                  type="submit"
                                  aria-label={`Révoquer l'accès à ${label}`}
                                  className="rounded p-0.5 text-slate-400 transition hover:text-red-600 dark:hover:text-red-400"
                                >
                                  <svg
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    className="size-4"
                                    aria-hidden="true"
                                  >
                                    <path
                                      d="M6 6l12 12M18 6L6 18"
                                      stroke="currentColor"
                                      strokeWidth="2"
                                      strokeLinecap="round"
                                    />
                                  </svg>
                                </button>
                              </form>
                            )}
                          </li>
                        )
                      })}
                    </ul>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </ClientShell>
  )
}
