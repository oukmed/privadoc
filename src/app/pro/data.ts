import 'server-only'
import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import { resolveDisplayNames } from '@/lib/names'

// Shared data + metrics for the professional space. Every /pro/* page reads from
// here so the queries run once per request (React cache()) and the dashboard,
// the requests list, and the clients list all agree on the same numbers.

const BUCKET = process.env.NEXT_PUBLIC_STORAGE_BUCKET ?? 'documents'
const SIGNED_URL_TTL = 60 * 60 // 1 hour
const SOON_MS = 14 * 24 * 60 * 60 * 1000 // "upcoming" deadline window

export type ItemStatus = 'pending' | 'submitted' | 'validated' | 'rejected'

export interface ProRequestItem {
  id: string
  label: string
  status: string
  due_date: string | null
  document_id: string | null
}

export interface ProRequest {
  id: string
  title: string
  status: string
  client_email: string
  client_name: string | null
  created_at: string
  request_items: ProRequestItem[]
}

/** All document requests created by the signed-in pro, newest first. RLS scopes
 * the rows to the caller. Cached per request. */
export const getProRequests = cache(async (): Promise<ProRequest[]> => {
  const supabase = await createClient()
  const { data } = await supabase
    .from('document_requests')
    .select(
      'id, title, status, client_email, client_name, created_at, request_items(id, label, status, due_date, document_id)',
    )
    .order('created_at', { ascending: false })
  return (data ?? []) as ProRequest[]
})

export interface SharedDoc {
  id: string
  title: string
  storage_path: string
  created_at: string
  owner_id: string
  signedUrl?: string
  sharer?: string
}

/** Documents a client shared with the pro through the collaborator system — the
 * pro's "Partagé avec moi". Excludes client-uploaded request pieces (those belong
 * to the request workflow). Includes a signed URL + the sharer's name. Cached. */
export const getSharedWithPro = cache(async (): Promise<SharedDoc[]> => {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return []

  const [{ data: sharedData }, requests] = await Promise.all([
    supabase
      .from('documents')
      .select('id, title, storage_path, created_at, owner_id')
      .neq('owner_id', user.id)
      .order('created_at', { ascending: false }),
    getProRequests(),
  ])

  const requestDocIds = new Set(
    requests.flatMap((r) => r.request_items.map((it) => it.document_id).filter(Boolean)),
  )
  const shared = ((sharedData ?? []) as SharedDoc[]).filter((d) => !requestDocIds.has(d.id))

  const signedUrls = new Map<string, string>()
  const paths = shared.map((d) => d.storage_path)
  if (paths.length > 0) {
    const { data: signed } = await supabase.storage.from(BUCKET).createSignedUrls(paths, SIGNED_URL_TTL)
    for (const entry of signed ?? []) {
      if (entry.signedUrl) signedUrls.set(entry.path ?? '', entry.signedUrl)
    }
  }
  const names = await resolveDisplayNames(shared.map((d) => d.owner_id))

  return shared.map((d) => ({
    ...d,
    signedUrl: signedUrls.get(d.storage_path),
    sharer: names.get(d.owner_id),
  }))
})

// ─────────────────────────── pure derivations ───────────────────────────
// Kept out of components (they read the clock) and shared so every page counts
// the same way.

/** The client's display label for a request (name if set, else email). */
export function clientLabel(request: ProRequest): string {
  return request.client_name?.trim() || request.client_email
}

export interface ProMetrics {
  activeClients: number
  openCount: number
  completedCount: number
  toReviewCount: number
  totalItems: number
  validatedItems: number
  /** % of all requested pieces that are validated (0–100). */
  completionRate: number
  overdueCount: number
}

export function computeMetrics(requests: ProRequest[], now: number = Date.now()): ProMetrics {
  const activeClients = new Set(
    requests.filter((r) => r.status === 'open').map((r) => r.client_email.toLowerCase()),
  ).size
  const openCount = requests.filter((r) => r.status === 'open').length
  const completedCount = requests.filter((r) => r.status === 'completed').length

  let totalItems = 0
  let validatedItems = 0
  let toReviewCount = 0
  let overdueCount = 0
  for (const r of requests) {
    for (const it of r.request_items) {
      totalItems += 1
      if (it.status === 'validated') validatedItems += 1
      if (it.status === 'submitted') toReviewCount += 1
      const pending = it.status !== 'validated' && it.status !== 'submitted'
      if (pending && it.due_date && new Date(it.due_date).getTime() < now) overdueCount += 1
    }
  }
  const completionRate = totalItems > 0 ? Math.round((validatedItems / totalItems) * 100) : 0

  return {
    activeClients,
    openCount,
    completedCount,
    toReviewCount,
    totalItems,
    validatedItems,
    completionRate,
    overdueCount,
  }
}

export interface ReviewPiece {
  requestId: string
  title: string
  client: string
  label: string
}

/** Pieces a client has submitted and the pro still needs to validate/reject. */
export function collectToReview(requests: ProRequest[]): ReviewPiece[] {
  return requests.flatMap((r) =>
    r.request_items
      .filter((it) => it.status === 'submitted')
      .map((it) => ({ requestId: r.id, title: r.title, client: clientLabel(r), label: it.label })),
  )
}

export interface Deadline {
  requestId: string
  title: string
  client: string
  label: string
  due: string
  overdue: boolean
}

/** Upcoming (≤14 days) or overdue deadlines for pieces not yet submitted/validated,
 * soonest first. */
export function collectDeadlines(requests: ProRequest[], now: number = Date.now()): Deadline[] {
  const out: Deadline[] = []
  for (const r of requests) {
    if (r.status !== 'open') continue
    const client = clientLabel(r)
    for (const it of r.request_items) {
      if (!it.due_date || it.status === 'validated' || it.status === 'submitted') continue
      const t = new Date(it.due_date).getTime()
      if (t - now <= SOON_MS) {
        out.push({ requestId: r.id, title: r.title, client, label: it.label, due: it.due_date, overdue: t < now })
      }
    }
  }
  return out.sort((a, b) => a.due.localeCompare(b.due))
}

export interface RequestProgress {
  total: number
  validated: number
  submitted: number
  /** % validated (0–100). */
  pct: number
}

export function requestProgress(request: ProRequest): RequestProgress {
  const total = request.request_items.length
  const validated = request.request_items.filter((i) => i.status === 'validated').length
  const submitted = request.request_items.filter((i) => i.status === 'submitted').length
  const pct = total > 0 ? Math.round((validated / total) * 100) : 0
  return { total, validated, submitted, pct }
}

export interface ClientGroup {
  email: string
  name: string | null
  requests: ProRequest[]
  openCount: number
  toReviewCount: number
  /** % validated across all this client's pieces (0–100). */
  completionRate: number
}

/** Group requests by client email (recency order preserved), with per-client
 * roll-ups. Used by the clients list and the dashboard. */
export function groupByClient(requests: ProRequest[]): ClientGroup[] {
  const order: string[] = []
  const byEmail = new Map<string, ProRequest[]>()
  const nameByEmail = new Map<string, string>()
  for (const r of requests) {
    const key = r.client_email
    if (!byEmail.has(key)) {
      byEmail.set(key, [])
      order.push(key)
    }
    byEmail.get(key)!.push(r)
    if (r.client_name?.trim() && !nameByEmail.has(key)) nameByEmail.set(key, r.client_name.trim())
  }

  return order.map((email) => {
    const group = byEmail.get(email) ?? []
    let total = 0
    let validated = 0
    let toReview = 0
    let open = 0
    for (const r of group) {
      if (r.status === 'open') open += 1
      for (const it of r.request_items) {
        total += 1
        if (it.status === 'validated') validated += 1
        if (it.status === 'submitted') toReview += 1
      }
    }
    return {
      email,
      name: nameByEmail.get(email) ?? null,
      requests: group,
      openCount: open,
      toReviewCount: toReview,
      completionRate: total > 0 ? Math.round((validated / total) * 100) : 0,
    }
  })
}
