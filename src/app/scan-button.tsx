'use client'

import { useEffect, useState, type ChangeEvent } from 'react'

function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const mobile = /android|iphone|ipad|ipod/i.test(window.navigator.userAgent)
    // Defer out of the effect body (lint: no synchronous setState in effect).
    queueMicrotask(() => setIsMobile(mobile))
  }, [])
  return isMobile
}

interface ScanButtonProps {
  /** Called with the photo captured from the camera. */
  onCapture: (file: File) => void
  disabled?: boolean
}

/**
 * Opens the device camera directly (skips the gallery) via <input capture>,
 * so a document can be photographed and uploaded like a scan. Hidden on
 * desktop, where there is no camera to capture from.
 */
export function ScanButton({ onCapture, disabled }: ScanButtonProps) {
  const isMobile = useIsMobile()
  if (!isMobile) return null

  function handleChange(event: ChangeEvent<HTMLInputElement>): void {
    const file = event.target.files?.[0]
    if (file) onCapture(file)
    event.target.value = ''
  }

  return (
    <label className="inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="size-4">
        <path
          d="M4 8V6a2 2 0 0 1 2-2h2M4 16v2a2 2 0 0 0 2 2h2M20 8V6a2 2 0 0 0-2-2h-2M20 16v2a2 2 0 0 1-2 2h-2"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
      </svg>
      Scanner
      <input
        type="file"
        accept="image/*"
        capture="environment"
        disabled={disabled}
        onChange={handleChange}
        className="sr-only"
      />
    </label>
  )
}
