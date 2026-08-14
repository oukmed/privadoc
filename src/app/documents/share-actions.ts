'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export type ShareState =
  | {
      error?: string
      url?: string
    }
  | undefined

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? ''
const DAY_MS = 24 * 60 * 60 * 1000

function expiresAt(days: number): string | null {
  if (!Number.isFinite(days) || days <= 0) return null
  return new Date(Date.now() + days * DAY_MS).toISOString()
}

export async function createShare(_prevState: ShareState, formData: FormData): Promise<ShareState> {
  const documentId = String(formData.get('documentId') ?? '')
  if (!documentId) return { error: 'Document introuvable.' }

  const days = Number(formData.get('expiresInDays') ?? '')

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Session expirée, reconnecte-toi.' }

  // RLS enforces that the caller owns the referenced document.
  const { data, error } = await supabase
    .from('shares')
    .insert({
      document_id: documentId,
      created_by: user.id,
      expires_at: expiresAt(days),
    })
    .select('token')
    .single()

  if (error || !data) return { error: 'Impossible de créer le lien de partage.' }

  revalidatePath('/')
  return { url: `${APP_URL}/share/${data.token}` }
}

export async function revokeShare(formData: FormData): Promise<void> {
  const documentId = String(formData.get('documentId') ?? '')
  if (!documentId) return

  const supabase = await createClient()
  // RLS guarantees a user can only delete shares they created.
  await supabase.from('shares').delete().eq('document_id', documentId)

  revalidatePath('/')
}
