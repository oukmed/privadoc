'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { notify } from '@/lib/notify'
import { quotaError } from '@/lib/storage-quota'

interface SubmitPieceInput {
  itemId: string
  title: string
  storagePath: string
  mimeType: string
  sizeBytes: number
}

/**
 * Records a document the client uploaded for a request item, links it to the
 * item (status → 'submitted'), and notifies the professional. RLS guarantees the
 * item belongs to a request addressed to this client; the fetch below also gives
 * us the pro id + request title needed for the notification.
 */
export async function submitPiece(input: SubmitPieceInput): Promise<{ error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Session expirée, reconnecte-toi.' }

  // The object must live under the caller's own storage prefix.
  if (!input.storagePath.startsWith(`${user.id}/`)) return { error: 'Chemin invalide.' }

  const overQuota = await quotaError(supabase, input.sizeBytes)
  if (overQuota) {
    await supabase.storage
      .from(process.env.NEXT_PUBLIC_STORAGE_BUCKET ?? 'documents')
      .remove([input.storagePath])
    return { error: overQuota }
  }

  // Fetch the item joined to its request; !inner + client_id filter ensures the
  // request is addressed to this client (RLS enforces it too).
  const { data: item, error: itemError } = await supabase
    .from('request_items')
    .select('id, label, request_id, document_requests!inner(professional_id, title, client_id)')
    .eq('id', input.itemId)
    .eq('document_requests.client_id', user.id)
    .single()

  if (itemError || !item) return { error: 'Pièce introuvable ou accès refusé.' }

  const request = item.document_requests

  const { data: inserted, error: insertError } = await supabase
    .from('documents')
    .insert({
      owner_id: user.id,
      title: input.title.slice(0, 255),
      storage_path: input.storagePath,
      mime_type: input.mimeType,
      size_bytes: input.sizeBytes,
    })
    .select('id')
    .single()

  if (insertError || !inserted) {
    // Roll back the uploaded object so storage and the table stay consistent.
    await supabase.storage
      .from(process.env.NEXT_PUBLIC_STORAGE_BUCKET ?? 'documents')
      .remove([input.storagePath])
    return { error: 'Enregistrement du document impossible.' }
  }

  const { error: updateError } = await supabase
    .from('request_items')
    .update({ document_id: inserted.id, status: 'submitted' })
    .eq('id', input.itemId)

  if (updateError) return { error: 'Mise à jour de la pièce impossible.' }

  await notify({
    userId: request.professional_id,
    type: 'piece_submitted',
    title: `Pièce déposée : ${item.label}`,
    body: `Demande « ${request.title} »`,
    requestId: item.request_id,
  })

  revalidatePath('/requests')
  return {}
}
