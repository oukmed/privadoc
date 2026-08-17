'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { jsPDF } from 'jspdf'
import { uploadDocumentFile } from '@/app/documents/upload-client'

interface ScanButtonProps {
  folderId?: string
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('image failed'))
    img.src = src
  })
}

/** Build a single A4 PDF, one captured page per PDF page (fit + centered). */
async function pagesToPdf(dataUrls: string[]): Promise<Blob> {
  const pdf = new jsPDF({ unit: 'pt', format: 'a4' })
  const pageW = pdf.internal.pageSize.getWidth()
  const pageH = pdf.internal.pageSize.getHeight()
  const margin = 24

  for (let i = 0; i < dataUrls.length; i++) {
    const img = await loadImage(dataUrls[i])
    const ratio = Math.min((pageW - margin * 2) / img.width, (pageH - margin * 2) / img.height)
    const w = img.width * ratio
    const h = img.height * ratio
    if (i > 0) pdf.addPage()
    pdf.addImage(dataUrls[i], 'JPEG', (pageW - w) / 2, (pageH - h) / 2, w, h)
  }

  return pdf.output('blob')
}

export function ScanButton({ folderId }: ScanButtonProps) {
  const router = useRouter()
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [open, setOpen] = useState(false)
  const [pages, setPages] = useState<string[]>([])
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  // Start/stop the live camera with the modal.
  useEffect(() => {
    if (!open) return
    let active = true
    navigator.mediaDevices
      ?.getUserMedia({ video: { facingMode: 'environment' }, audio: false })
      .then((stream) => {
        if (!active) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }
        streamRef.current = stream
        if (videoRef.current) videoRef.current.srcObject = stream
      })
      .catch(() => setError("Accès à la caméra refusé ou indisponible sur cet appareil."))
    return () => {
      active = false
      streamRef.current?.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
  }, [open])

  function openScanner(): void {
    setError(null)
    setMessage(null)
    setPages([])
    setOpen(true)
  }

  function closeScanner(): void {
    setOpen(false)
    setPages([])
  }

  function capture(): void {
    const video = videoRef.current
    if (!video || !video.videoWidth) return
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.drawImage(video, 0, 0)
    setPages((prev) => [...prev, canvas.toDataURL('image/jpeg', 0.9)])
  }

  async function createPdf(): Promise<void> {
    if (pages.length === 0) return
    setPending(true)
    setError(null)
    try {
      const pdf = await pagesToPdf(pages)
      const name = `Scan ${new Date().toISOString().slice(0, 10)}.pdf`
      const result = await uploadDocumentFile(pdf, name, folderId)
      if (result?.error) {
        setError(result.error)
        return
      }
      setMessage(`Scan ajouté (${pages.length} page${pages.length > 1 ? 's' : ''}).`)
      closeScanner()
      router.refresh()
    } catch {
      setError('Le scan a échoué. Réessaie.')
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Ouvre l’appareil photo et scanne page par page → un seul PDF.
        </p>
        <button
          type="button"
          onClick={openScanner}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-100 dark:border-indigo-900 dark:bg-indigo-950/40 dark:text-indigo-300"
        >
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="size-4">
            <path
              d="M4 8V6a2 2 0 0 1 2-2h2M16 4h2a2 2 0 0 1 2 2v2M20 16v2a2 2 0 0 1-2 2h-2M8 20H6a2 2 0 0 1-2-2v-2"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
            />
            <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.7" />
          </svg>
          Scanner un document
        </button>
      </div>

      {message && (
        <p role="status" className="mt-3 text-sm text-emerald-600 dark:text-emerald-400">
          {message}
        </p>
      )}
      {!open && error && (
        <p role="alert" className="mt-3 text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex flex-col bg-black">
          <div className="flex items-center justify-between px-4 py-3 text-white">
            <span className="text-sm font-medium">
              {pages.length > 0 ? `${pages.length} page${pages.length > 1 ? 's' : ''}` : 'Cadre le document'}
            </span>
            <button type="button" onClick={closeScanner} aria-label="Fermer" className="rounded-md p-1">
              <svg viewBox="0 0 24 24" fill="none" className="size-6" aria-hidden="true">
                <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          <div className="relative flex-1 overflow-hidden">
            <video ref={videoRef} autoPlay playsInline muted className="h-full w-full object-contain" />
            {error && (
              <p className="absolute inset-x-0 top-1/2 px-6 text-center text-sm text-red-300">{error}</p>
            )}
          </div>

          {pages.length > 0 && (
            <div className="flex gap-2 overflow-x-auto bg-black/60 px-4 py-2">
              {pages.map((src, i) => (
                <div key={i} className="relative shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt={`Page ${i + 1}`} className="size-14 rounded border border-white/20 object-cover" />
                  <button
                    type="button"
                    onClick={() => setPages((prev) => prev.filter((_, j) => j !== i))}
                    aria-label={`Retirer la page ${i + 1}`}
                    className="absolute -right-1 -top-1 grid size-5 place-items-center rounded-full bg-white text-slate-900"
                  >
                    <svg viewBox="0 0 24 24" fill="none" className="size-3" aria-hidden="true">
                      <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between gap-4 px-6 py-5">
            <button
              type="button"
              onClick={closeScanner}
              className="text-sm font-medium text-white/80"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={capture}
              aria-label="Capturer la page"
              className="grid size-16 place-items-center rounded-full border-4 border-white/40 bg-white active:scale-95"
            >
              <span className="size-12 rounded-full bg-white" />
            </button>
            <button
              type="button"
              onClick={createPdf}
              disabled={pending || pages.length === 0}
              className="text-sm font-semibold text-indigo-300 disabled:opacity-40"
            >
              {pending ? 'PDF…' : `Terminer${pages.length > 0 ? ` (${pages.length})` : ''}`}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
