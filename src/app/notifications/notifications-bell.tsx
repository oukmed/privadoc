'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { markAllNotificationsRead } from '@/app/notifications/actions'

interface NotificationRow {
  id: string
  type: string
  title: string
  body: string | null
  read: boolean
  created_at: string
}

function shortDate(iso: string): string {
  const then = new Date(iso).getTime()
  const diffMin = Math.round((Date.now() - then) / 60000)
  if (diffMin < 1) return "à l'instant"
  if (diffMin < 60) return `il y a ${diffMin} min`
  const diffH = Math.round(diffMin / 60)
  if (diffH < 24) return `il y a ${diffH} h`
  return new Date(iso).toLocaleDateString('fr-FR')
}

export function NotificationsBell() {
  const [notifications, setNotifications] = useState<NotificationRow[]>([])
  const [open, setOpen] = useState(false)
  const [coords, setCoords] = useState<{ top: number; right: number }>({ top: 56, right: 16 })
  const buttonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    let active = true
    const supabase = createClient()
    supabase
      .from('notifications')
      .select('id, type, title, body, read, created_at')
      .order('created_at', { ascending: false })
      .limit(20)
      .then(({ data }) => {
        if (active && data) setNotifications(data)
      })
    return () => {
      active = false
    }
  }, [])

  // Close on Escape while the dropdown is open.
  useEffect(() => {
    if (!open) return
    function onKey(event: KeyboardEvent): void {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  const unread = notifications.filter((n) => !n.read).length

  function toggle(): void {
    const rect = buttonRef.current?.getBoundingClientRect()
    if (rect) setCoords({ top: rect.bottom + 8, right: window.innerWidth - rect.right })
    setOpen((prev) => !prev)
  }

  async function handleMarkAll(): Promise<void> {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    await markAllNotificationsRead()
  }

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={toggle}
        aria-label={`Notifications${unread > 0 ? ` (${unread} non lues)` : ''}`}
        aria-expanded={open}
        className="relative inline-flex size-9 items-center justify-center rounded-lg text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="size-5">
          <path
            d="M6 9a6 6 0 0 1 12 0c0 4.5 1.5 6 1.5 6h-15S6 13.5 6 9Z"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
          <path d="M10 19a2 2 0 0 0 4 0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 grid min-w-4 place-items-center rounded-full bg-indigo-600 px-1 text-[10px] font-bold leading-4 text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          {/* Click-away layer; the panel uses fixed positioning to escape header overflow. */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden="true" />
          <div
            role="dialog"
            aria-label="Notifications"
            style={{ top: coords.top, right: coords.right }}
            className="fixed z-50 w-80 max-w-[calc(100vw-1rem)] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl shadow-slate-900/10 dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800">
              <span className="text-sm font-semibold text-slate-900 dark:text-slate-50">Notifications</span>
              {unread > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAll}
                  className="text-xs font-medium text-indigo-600 transition hover:text-indigo-500 dark:text-indigo-400"
                >
                  Tout marquer comme lu
                </button>
              )}
            </div>

            {notifications.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                Aucune notification.
              </p>
            ) : (
              <ul className="max-h-96 divide-y divide-slate-200 overflow-y-auto dark:divide-slate-800">
                {notifications.map((n) => (
                  <li
                    key={n.id}
                    className={`px-4 py-3 ${n.read ? '' : 'bg-indigo-50/60 dark:bg-indigo-950/30'}`}
                  >
                    <div className="flex items-start gap-2">
                      {!n.read && (
                        <span
                          aria-hidden="true"
                          className="mt-1.5 size-2 shrink-0 rounded-full bg-indigo-600"
                        />
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{n.title}</p>
                        {n.body && (
                          <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{n.body}</p>
                        )}
                        <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                          {shortDate(n.created_at)}
                        </p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </>
  )
}
