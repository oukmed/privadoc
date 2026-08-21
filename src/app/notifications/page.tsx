import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AppHeader } from '@/app/app-header'
import { markAllNotificationsRead, markNotificationRead } from '@/app/notifications/actions'

export default async function NotificationsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: notifications } = await supabase
    .from('notifications')
    .select('id, title, body, read, created_at')
    .order('created_at', { ascending: false })
    .limit(100)

  const hasUnread = (notifications ?? []).some((n) => !n.read)

  return (
    <div className="flex flex-1 flex-col bg-slate-50 dark:bg-slate-950">
      <AppHeader />

      <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            Notifications
          </h1>
          {hasUnread && (
            <form action={markAllNotificationsRead}>
              <button
                type="submit"
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Tout marquer comme lu
              </button>
            </form>
          )}
        </div>

        {(notifications?.length ?? 0) === 0 ? (
          <div className="mt-8 overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
            <p className="px-4 py-10 text-center text-sm text-slate-500 dark:text-slate-400">
              Aucune notification.
            </p>
          </div>
        ) : (
          <ul className="mt-8 overflow-hidden rounded-xl border border-slate-200 bg-white divide-y divide-slate-200 dark:border-slate-800 dark:bg-slate-900 dark:divide-slate-800">
            {(notifications ?? []).map((n) => (
              <li
                key={n.id}
                className={`flex items-start justify-between gap-4 px-5 py-4 ${n.read ? '' : 'bg-indigo-50/60 dark:bg-indigo-950/30'}`}
              >
                <div className="min-w-0">
                  <p className="font-medium text-slate-800 dark:text-slate-200">{n.title}</p>
                  {n.body && <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{n.body}</p>}
                  <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                    {new Date(n.created_at).toLocaleString('fr-FR')}
                  </p>
                </div>
                {!n.read && (
                  <form action={markNotificationRead}>
                    <input type="hidden" name="id" value={n.id} />
                    <button
                      type="submit"
                      className="shrink-0 text-sm font-medium text-indigo-600 transition hover:text-indigo-500 dark:text-indigo-400"
                    >
                      Marquer comme lu
                    </button>
                  </form>
                )}
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  )
}
