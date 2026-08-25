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

/** Otsu's method: the luminance threshold that best splits a histogram into two classes. */
function otsuThreshold(hist: number[], total: number): number {
  let sum = 0
  for (let i = 0; i < 256; i++) sum += i * hist[i]
  let sumB = 0
  let weightB = 0
  let best = 0
  let bestVariance = 0
  for (let i = 0; i < 256; i++) {
    weightB += hist[i]
    if (weightB === 0) continue
    const weightF = total - weightB
    if (weightF === 0) break
    sumB += i * hist[i]
    const meanB = sumB / weightB
    const meanF = (sum - sumB) / weightF
    const variance = weightB * weightF * (meanB - meanF) * (meanB - meanF)
    if (variance > bestVariance) {
      bestVariance = variance
      best = i
    }
  }
  return best
}

/**
 * Guesses the document's 4 corners so the adjustment screen opens already roughly
 * aligned instead of a blind inset box. Downscaled grayscale + Otsu threshold segments
 * "document" from "background", assuming the document was framed near the center of the
 * photo; the 4 corners are then the mask's extreme points along x+y and x-y (a cheap,
 * dependency-free stand-in for a full contour fit). Returns null when the guess looks
 * unreliable, so the caller can fall back to a plain inset box.
 */
function detectDocumentCorners(img: HTMLImageElement): Corners | null {
  const maxSide = 400
  const scale = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight))
  const dw = Math.max(1, Math.round(img.naturalWidth * scale))
  const dh = Math.max(1, Math.round(img.naturalHeight * scale))

  const canvas = document.createElement('canvas')
  canvas.width = dw
  canvas.height = dh
  const ctx = canvas.getContext('2d')
  if (!ctx) return null
  ctx.drawImage(img, 0, 0, dw, dh)
  const { data } = ctx.getImageData(0, 0, dw, dh)

  const gray = new Uint8ClampedArray(dw * dh)
  const hist = new Array(256).fill(0) as number[]
  for (let i = 0; i < dw * dh; i++) {
    const l = 0.299 * data[i * 4] + 0.587 * data[i * 4 + 1] + 0.114 * data[i * 4 + 2]
    gray[i] = l
    hist[Math.round(l)]++
  }
  const threshold = otsuThreshold(hist, dw * dh)

  // Assume the document sits near the frame's center; whichever side of the threshold
  // dominates that central patch is the "document" class.
  const cx0 = Math.floor(dw * 0.3)
  const cx1 = Math.ceil(dw * 0.7)
  const cy0 = Math.floor(dh * 0.3)
  const cy1 = Math.ceil(dh * 0.7)
  let aboveInCenter = 0
  let belowInCenter = 0
  for (let y = cy0; y < cy1; y++) {
    for (let x = cx0; x < cx1; x++) {
      if (gray[y * dw + x] > threshold) aboveInCenter++
      else belowInCenter++
    }
  }
  const documentIsAbove = aboveInCenter >= belowInCenter

  let minSum = Infinity
  let maxSum = -Infinity
  let minDiff = Infinity
  let maxDiff = -Infinity
  let tl: Point | null = null
  let tr: Point | null = null
  let br: Point | null = null
  let bl: Point | null = null
  let count = 0
  for (let y = 0; y < dh; y++) {
    for (let x = 0; x < dw; x++) {
      const isDoc = documentIsAbove ? gray[y * dw + x] > threshold : gray[y * dw + x] <= threshold
      if (!isDoc) continue
      count++
      const s = x + y
      const d = x - y
      if (s < minSum) {
        minSum = s
        tl = { x, y }
      }
      if (s > maxSum) {
        maxSum = s
        br = { x, y }
      }
      if (d > maxDiff) {
        maxDiff = d
        tr = { x, y }
      }
      if (d < minDiff) {
        minDiff = d
        bl = { x, y }
      }
    }
  }

  const area = count / (dw * dh)
  if (!tl || !tr || !br || !bl || area < 0.12 || area > 0.96) return null

  const margin = 0.015
  const toNorm = (p: Point): Point => ({
    x: Math.min(Math.max(p.x / dw + (p.x < dw / 2 ? -margin : margin), 0), 1),
    y: Math.min(Math.max(p.y / dh + (p.y < dh / 2 ? -margin : margin), 0), 1),
  })
  return [toNorm(tl), toNorm(tr), toNorm(br), toNorm(bl)]
}

interface ScanResult {
  blob: Blob
  width: number
  height: number
}

/** Perspective-corrects the quad the user picked into a flat rectangle, optionally applying a document (B&W, high-contrast) look. */
async function processScan(photoUrl: string, corners: Corners, enhance: boolean): Promise<ScanResult> {
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

  const blob = await new Promise<Blob>((resolve, reject) => {
    outCanvas.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob failed'))), 'image/jpeg', 0.92)
  })
  return { blob, width: W, height: H }
}

/** Minimal single-page PDF wrapping one JPEG as a DCTDecode image XObject — no library needed. */
class PdfBuilder {
  private chunks: (Uint8Array | string)[] = []
  private length = 0
  private offsets: number[] = []

  private push(part: Uint8Array | string): void {
    this.chunks.push(part)
    this.length += typeof part === 'string' ? part.length : part.length
  }

  /** Every PDF must start with this — without it, no reader recognizes the file. */
  writeHeader(): void {
    this.push('%PDF-1.4\n')
  }

  addObject(num: number, parts: (Uint8Array | string)[]): void {
    this.offsets[num] = this.length
    this.push(`${num} 0 obj\n`)
    for (const part of parts) this.push(part)
    this.push('\nendobj\n')
  }

  build(rootObjectCount: number): Uint8Array<ArrayBuffer> {
    const xrefOffset = this.length
    let xref = `xref\n0 ${rootObjectCount}\n0000000000 65535 f \n`
    for (let i = 1; i < rootObjectCount; i++) {
      xref += `${String(this.offsets[i]).padStart(10, '0')} 00000 n \n`
    }
    this.push(xref)
    this.push(`trailer\n<< /Size ${rootObjectCount} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`)

    const encoder = new TextEncoder()
    const bytes = this.chunks.map((c) => (typeof c === 'string' ? encoder.encode(c) : c))
    const total = new Uint8Array(bytes.reduce((n, b) => n + b.length, 0))
    let offset = 0
    for (const b of bytes) {
      total.set(b, offset)
      offset += b.length
    }
    return total
  }
}

async function jpegToPdf(jpegBlob: Blob, width: number, height: number): Promise<Blob> {
  const jpegBytes = new Uint8Array(await jpegBlob.arrayBuffer())
  const b = new PdfBuilder()
  b.writeHeader()
  b.addObject(1, ['<< /Type /Catalog /Pages 2 0 R >>'])
  b.addObject(2, ['<< /Type /Pages /Kids [3 0 R] /Count 1 >>'])
  b.addObject(3, [
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${width} ${height}] /Resources << /XObject << /Im0 5 0 R >> >> /Contents 4 0 R >>`,
  ])
  const content = `q ${width} 0 0 ${height} 0 0 cm /Im0 Do Q`
  b.addObject(4, [`<< /Length ${content.length} >>\nstream\n${content}\nendstream`])
  b.addObject(5, [
    `<< /Type /XObject /Subtype /Image /Width ${width} /Height ${height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpegBytes.length} >>\nstream\n`,
    jpegBytes,
    '\nendstream',
  ])
  return new Blob([b.build(6)], { type: 'application/pdf' })
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

  useEffect(() => {
    if (!photoUrl) return
    let cancelled = false
    loadImage(photoUrl)
      .then((img) => {
        if (cancelled) return
        const detected = detectDocumentCorners(img)
        if (detected) setCorners(detected)
      })
      .catch(() => {
        // Detection is best-effort; the default inset box stays as-is.
      })
    return () => {
      cancelled = true
    }
  }, [photoUrl])

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
      const { blob, width, height } = await processScan(photoUrl, corners, enhance)
      const pdfBlob = await jpegToPdf(blob, width, height)
      onCapture(new File([pdfBlob], `scan-${Date.now()}.pdf`, { type: 'application/pdf' }))
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
                className="absolute size-8 -translate-x-1/2 -translate-y-1/2 touch-none rounded-full border-2 border-white bg-indigo-600 shadow-lg transition-[left,top] duration-300"
                style={{ left: `${c.x * 100}%`, top: `${c.y * 100}%` }}
              />
            ))}
          </div>

          <p className="mx-auto max-w-md text-center text-xs text-white/70">
            Les coins sont détectés automatiquement — ajuste-les si besoin.
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
