'use client'

import { useEffect, useState } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const DISMISS_KEY = 'pwa-install-dismissed'

/** In-app prompt to install the PWA: native prompt on Android, manual hint on iOS. */
export function InstallBanner() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null)
  const [iosHint, setIosHint] = useState(false)
  const [show, setShow] = useState(false)

  useEffect(() => {
    // Already installed → nothing to do.
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true
    if (standalone) return

    try {
      if (localStorage.getItem(DISMISS_KEY) === '1') return
    } catch {
      // ignore unavailable storage
    }

    const onPrompt = (event: Event) => {
      event.preventDefault()
      setDeferred(event as BeforeInstallPromptEvent)
      setShow(true)
    }
    window.addEventListener('beforeinstallprompt', onPrompt as EventListener)

    // iOS Safari never fires beforeinstallprompt → show the manual hint instead.
    const ua = window.navigator.userAgent
    const isIOS = /iphone|ipad|ipod/i.test(ua)
    const isSafari = /safari/i.test(ua) && !/crios|fxios|edgios/i.test(ua)
    if (isIOS && isSafari) {
      // Defer out of the effect body (lint: no synchronous setState in effect).
      queueMicrotask(() => {
        setIosHint(true)
        setShow(true)
      })
    }

    return () => window.removeEventListener('beforeinstallprompt', onPrompt as EventListener)
  }, [])

  function dismiss() {
    setShow(false)
    try {
      localStorage.setItem(DISMISS_KEY, '1')
    } catch {
      // ignore
    }
  }

  async function install() {
    if (!deferred) return
    await deferred.prompt()
    await deferred.userChoice.catch(() => undefined)
    setDeferred(null)
    setShow(false)
  }

  if (!show) return null

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 flex justify-center px-4 pb-4">
      <div className="flex w-full max-w-md items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-xl shadow-slate-900/10 dark:border-slate-700 dark:bg-slate-900">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">
          P
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Installer PrivaDoc
          </p>
          {iosHint ? (
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              Appuie sur <span className="font-medium">Partager</span> puis «&nbsp;Sur l&apos;écran
              d&apos;accueil&nbsp;».
            </p>
          ) : (
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              Accès rapide, plein écran, comme une vraie application.
            </p>
          )}
        </div>
        {!iosHint && deferred && (
          <button
            type="button"
            onClick={install}
            className="shrink-0 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500"
          >
            Installer
          </button>
        )}
        <button
          type="button"
          onClick={dismiss}
          aria-label="Fermer"
          className="shrink-0 rounded-md p-1 text-slate-400 transition hover:text-slate-600 dark:hover:text-slate-200"
        >
          <svg viewBox="0 0 24 24" fill="none" className="size-5" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      </div>
    </div>
  )
}
