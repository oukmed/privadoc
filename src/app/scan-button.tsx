'use client'

import { useEffect, useRef, useState, type ChangeEvent, type PointerEvent as ReactPointerEvent } from 'react'

function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const mobile = /android|iphone|ipad|ipod/i.test(window.navigator.userAgent)
    // Defer out of the effect body (lint: no synchronous setState in effect).
    queueMicrotask(() => setIsMobile(mobile))
  }, [])
  return isMobile
}

interface Point {
  x: number
  y: number
}

/** TL, TR, BR, BL, normalized 0..1 — identical in display space and natural image space. */
type Corners = [Point, Point, Point, Point]

const DEFAULT_CORNERS: Corners = [
  { x: 0.1, y: 0.1 },
  { x: 0.9, y: 0.1 },
  { x: 0.9, y: 0.9 },
  { x: 0.1, y: 0.9 },
]

const OUTPUT_MAX_SIDE = 1400

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('image load failed'))
    img.src = src
  })
}

/**
 * Heckbert's closed-form projective mapping from the unit square (0,0)-(1,0)-(1,1)-(0,1)
 * to an arbitrary quadrilateral. Used here to warp a hand-picked document quad back to a
 * flat rectangle: for every rectangle pixel we ask "where does this come from in the
 * source photo?" and bilinear-sample that source point — a perspective "un-warp".
 */
function squareToQuad(p0: Point, p1: Point, p2: Point, p3: Point) {
  const dx1 = p1.x - p2.x
  const dx2 = p3.x - p2.x
  const dx3 = p0.x - p1.x + p2.x - p3.x
  const dy1 = p1.y - p2.y
  const dy2 = p3.y - p2.y
  const dy3 = p0.y - p1.y + p2.y - p3.y

  const det = dx1 * dy2 - dx2 * dy1
  const g = Math.abs(det) < 1e-9 ? 0 : (dx3 * dy2 - dx2 * dy3) / det
  const h = Math.abs(det) < 1e-9 ? 0 : (dx1 * dy3 - dx3 * dy1) / det
  const a = p1.x - p0.x + g * p1.x
  const b = p3.x - p0.x + h * p3.x
  const c = p0.x
  const d = p1.y - p0.y + g * p1.y
  const e = p3.y - p0.y + h * p3.y
  const f = p0.y

  return (u: number, v: number): Point => {
    const w = g * u + h * v + 1
    return { x: (a * u + b * v + c) / w, y: (d * u + e * v + f) / w }
  }
}

function clamp255(v: number): number {
  return v < 0 ? 0 : v > 255 ? 255 : v
}

function bilinearSample(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  x: number,
  y: number,
): [number, number, number, number] {
  const x0 = Math.min(Math.max(Math.floor(x), 0), width - 1)
  const y0 = Math.min(Math.max(Math.floor(y), 0), height - 1)
  const x1 = Math.min(x0 + 1, width - 1)
  const y1 = Math.min(y0 + 1, height - 1)
  const fx = x - x0
  const fy = y - y0
  const i00 = (y0 * width + x0) * 4
  const i10 = (y0 * width + x1) * 4
  const i01 = (y1 * width + x0) * 4
  const i11 = (y1 * width + x1) * 4
  const lerp = (a: number, b: number, t: number) => a + (b - a) * t
  const out: [number, number, number, number] = [0, 0, 0, 0]
  for (let c = 0; c < 4; c++) {
    const top = lerp(data[i00 + c], data[i10 + c], fx)
    const bottom = lerp(data[i01 + c], data[i11 + c], fx)
    out[c] = lerp(top, bottom, fy)
  }
  return out
}

/** Perspective-corrects the quad the user picked into a flat rectangle, optionally applying a document (B&W, high-contrast) look. */
async function processScan(photoUrl: string, corners: Corners, enhance: boolean): Promise<Blob> {
  const img = await loadImage(photoUrl)
  const sw = img.naturalWidth
  const sh = img.naturalHeight

  const srcCanvas = document.createElement('canvas')
  srcCanvas.width = sw
  srcCanvas.height = sh
  const srcCtx = srcCanvas.getContext('2d')
  if (!srcCtx) throw new Error('2D context unavailable')
  srcCtx.drawImage(img, 0, 0)
  const srcData = srcCtx.getImageData(0, 0, sw, sh)

  const p = corners.map((pt) => ({ x: pt.x * sw, y: pt.y * sh })) as Corners
  const edgeLen = (a: Point, b: Point) => Math.hypot(b.x - a.x, b.y - a.y)
  const outW = Math.max(edgeLen(p[0], p[1]), edgeLen(p[3], p[2]))
  const outH = Math.max(edgeLen(p[0], p[3]), edgeLen(p[1], p[2]))
  const scale = Math.min(1, OUTPUT_MAX_SIDE / Math.max(outW, outH))
  const W = Math.max(1, Math.round(outW * scale))
  const H = Math.max(1, Math.round(outH * scale))

  const mapUV = squareToQuad(p[0], p[1], p[2], p[3])

  const outCanvas = document.createElement('canvas')
  outCanvas.width = W
  outCanvas.height = H
  const outCtx = outCanvas.getContext('2d')
  if (!outCtx) throw new Error('2D context unavailable')
  const outData = outCtx.createImageData(W, H)

  for (let py = 0; py < H; py++) {
    const v = py / H
    for (let px = 0; px < W; px++) {
      const u = px / W
      const { x, y } = mapUV(u, v)
      const [r, g, b, a] = bilinearSample(srcData.data, sw, sh, x, y)
      const di = (py * W + px) * 4
      if (enhance) {
        const gray = 0.299 * r + 0.587 * g + 0.114 * b
        const contrasted = clamp255((gray - 128) * 1.35 + 128 + 18)
        outData.data[di] = contrasted
        outData.data[di + 1] = contrasted
        outData.data[di + 2] = contrasted
      } else {
        outData.data[di] = r
        outData.data[di + 1] = g
        outData.data[di + 2] = b
      }
      outData.data[di + 3] = a
    }
  }
  outCtx.putImageData(outData, 0, 0)

  return new Promise((resolve, reject) => {
    outCanvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('toBlob failed'))), 'image/jpeg', 0.92)
  })
}

interface ScanButtonProps {
  /** Called with the final, perspective-corrected scan. */
  onCapture: (file: File) => void
  disabled?: boolean
}

/**
 * Opens the device camera directly (skips the gallery) via <input capture>, then lets
 * the user align the document's 4 corners before warping the photo flat and applying a
 * document look — a real scan, not just a picture. Hidden on desktop, where there is no
 * camera to capture from.
 */
export function ScanButton({ onCapture, disabled }: ScanButtonProps) {
  const isMobile = useIsMobile()
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [corners, setCorners] = useState<Corners>(DEFAULT_CORNERS)
  const [enhance, setEnhance] = useState(true)
  const [processing, setProcessing] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const draggingIndex = useRef<number | null>(null)

  if (!isMobile) return null

  function handleChange(event: ChangeEvent<HTMLInputElement>): void {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setCorners(DEFAULT_CORNERS)
    setPhotoUrl(URL.createObjectURL(file))
  }

  function closeAdjust(): void {
    if (photoUrl) URL.revokeObjectURL(photoUrl)
    setPhotoUrl(null)
  }

  function pointFromEvent(e: ReactPointerEvent): Point {
    const rect = containerRef.current!.getBoundingClientRect()
    return {
      x: Math.min(Math.max((e.clientX - rect.left) / rect.width, 0), 1),
      y: Math.min(Math.max((e.clientY - rect.top) / rect.height, 0), 1),
    }
  }

  function handlePointerDown(index: number) {
    return (e: ReactPointerEvent) => {
      e.preventDefault()
      draggingIndex.current = index
      ;(e.target as Element).setPointerCapture(e.pointerId)
    }
  }

  function handlePointerMove(e: ReactPointerEvent): void {
    if (draggingIndex.current === null) return
    const point = pointFromEvent(e)
    setCorners((prev) => {
      const next = [...prev] as Corners
      next[draggingIndex.current!] = point
      return next
    })
  }

  function handlePointerUp(): void {
    draggingIndex.current = null
  }

  async function confirm(): Promise<void> {
    if (!photoUrl) return
    setProcessing(true)
    try {
      const blob = await processScan(photoUrl, corners, enhance)
      onCapture(new File([blob], `scan-${Date.now()}.jpg`, { type: 'image/jpeg' }))
      closeAdjust()
    } catch {
      // Leave the user on the adjustment screen so they can retry.
    } finally {
      setProcessing(false)
    }
  }

  return (
    <>
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

      {photoUrl && (
        <div className="fixed inset-0 z-50 flex flex-col justify-center gap-4 bg-black/90 p-4">
          <div
            ref={containerRef}
            className="relative mx-auto w-full max-w-md touch-none select-none"
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- object URL, not a static/remote asset Next can optimize */}
            <img src={photoUrl} alt="" className="block w-full" draggable={false} />
            <svg
              className="pointer-events-none absolute inset-0 h-full w-full"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
            >
              <polygon
                points={corners.map((c) => `${c.x * 100},${c.y * 100}`).join(' ')}
                fill="rgba(99,102,241,0.25)"
                stroke="rgb(99,102,241)"
                strokeWidth="0.6"
                vectorEffect="non-scaling-stroke"
              />
            </svg>
            {corners.map((c, i) => (
              <button
                key={i}
                type="button"
                onPointerDown={handlePointerDown(i)}
                aria-label={`Coin ${i + 1}`}
                className="absolute size-8 -translate-x-1/2 -translate-y-1/2 touch-none rounded-full border-2 border-white bg-indigo-600 shadow-lg"
                style={{ left: `${c.x * 100}%`, top: `${c.y * 100}%` }}
              />
            ))}
          </div>

          <p className="mx-auto max-w-md text-center text-xs text-white/70">
            Ajuste les 4 coins sur les bords du document.
          </p>

          <label className="mx-auto flex w-full max-w-md items-center justify-center gap-2 text-sm text-white/90">
            <input type="checkbox" checked={enhance} onChange={(e) => setEnhance(e.target.checked)} />
            Rendu document (noir &amp; blanc contrasté)
          </label>

          <div className="mx-auto flex w-full max-w-md gap-3">
            <button
              type="button"
              onClick={closeAdjust}
              disabled={processing}
              className="flex-1 rounded-lg border border-white/30 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
            >
              Reprendre
            </button>
            <button
              type="button"
              onClick={confirm}
              disabled={processing}
              className="flex-1 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {processing ? 'Traitement…' : 'Valider'}
            </button>
          </div>
        </div>
      )}
    </>
  )
}
