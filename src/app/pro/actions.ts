'use server'

import { revalidatePath } from 'next/cache'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { notify } from '@/lib/notify'
import { sendEmail } from '@/lib/email'
import { ROLE_LABELS, type RecipientRole } from '@/lib/roles'

function professionLabel(profession: string | null): string | null {
  return profession ? (ROLE_LABELS[profession as RecipientRole] ?? null) : null
}

/** "Maître Dupont (Avocat)" — a human sender identity from name + profession. */
function senderIdentity(name: string, profession: string | null): string {
  const label = professionLabel(profession)
  return label ? `${name} (${label})` : name
}

export type RequestState = { error?: string; message?: string } | undefined

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? ''

function requestEmailHtml(args: {
  sender: string
  title: string
  items: { label: string; dueDate: string }[]
  url: string
  existing: boolean
}): string {
  const list = args.items
    .map((i) => `<li>${i.label}${i.dueDate ? ` — avant le ${i.dueDate}` : ''}</li>`)
    .join('')
  const cta = args.existing
    ? 'Connectez-vous pour déposer vos documents :'
    : 'Créez votre compte gratuit pour déposer vos documents :'
  return `
    <div style="font-family:system-ui,sans-serif;max-width:520px;margin:auto;color:#1e293b">
      <h2 style="color:#4f46e5">Nouvelle demande de pièces</h2>
      <p><strong>${args.sender}</strong> vous demande les pièces suivantes sur PrivaDoc :</p>
      <p style="font-weight:600">${args.title}</p>
      <ul>${list}</ul>
      <p>${cta}</p>
      <p><a href="${args.url}" style="display:inline-block;background:#4f46e5;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none">Accéder à PrivaDoc</a></p>
    </div>`
}

/** Resolve an existing account id by email (paginated; fine at this scale). */
async function findUserIdByEmail(email: string): Promise<string | null> {
  const { data } = await createAdminClient().auth.admin.listUsers({ perPage: 1000 })
  const match = data?.users.find((u) => u.email?.toLowerCase() === email.toLowerCase())
  return match?.id ?? null
}

/**
 * A pro creates a "demande de pièces": a titled request for a client, with a
 * list of expected items (label + optional deadline). Notifies the client when
 * their account already exists.
 */
export async function createRequest(
  _prevState: RequestState,
  formData: FormData,
): Promise<RequestState> {
  const title = String(formData.get('title') ?? '').trim()
  const clientEmail = String(formData.get('clientEmail') ?? '').trim()
  if (!title) return { error: 'Donne un titre à la demande.' }
  if (!EMAIL_RE.test(clientEmail)) return { error: 'Adresse email du client invalide.' }

  const labels = formData.getAll('label').map(String)
  const dueDates = formData.getAll('dueDate').map(String)
  const items = labels
    .map((label, index) => ({ label: label.trim(), dueDate: (dueDates[index] ?? '').trim() }))
    .filter((item) => item.label.length > 0)
  if (items.length === 0) return { error: 'Ajoute au moins une pièce à fournir.' }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Session expirée, reconnecte-toi.' }

  const clientId = await findUserIdByEmail(clientEmail)

  // Pro identity to snapshot onto the request (the client cannot read the pro's
  // profile row) and to show as the sender.
  const { data: proProfile } = await supabase
    .from('profiles')
    .select('display_name, profession, is_professional')
    .eq('id', user.id)
    .maybeSingle()
  if (!proProfile?.is_professional) {
    return { error: "Votre compte professionnel n'est pas encore activé." }
  }
  const proName = proProfile?.display_name?.trim() || user.email || 'Un professionnel'
  const proProfession = proProfile?.profession ?? null

  const { data: request, error: requestError } = await supabase
    .from('document_requests')
    .insert({
      professional_id: user.id,
      client_email: clientEmail,
      title,
      client_id: clientId,
      professional_name: proName,
      professional_profession: proProfession,
    })
    .select('id')
    .single()
  if (requestError || !request) return { error: 'Impossible de créer la demande.' }

  const rows = items.map((item, index) => ({
    request_id: request.id,
    label: item.label,
    due_date: item.dueDate || null,
    position: index,
  }))
  const { error: itemsError } = await supabase.from('request_items').insert(rows)
  if (itemsError) {
    await supabase.from('document_requests').delete().eq('id', request.id)
    return { error: 'Impossible d’enregistrer les pièces demandées.' }
  }

  if (clientId) {
    await notify({
      userId: clientId,
      type: 'request_created',
      title: `Nouvelle demande : ${title}`,
      body: `Demandé par ${senderIdentity(proName, proProfession)}`,
      requestId: request.id,
    })
  }

  revalidatePath('/pro')

  // Email the client so they learn about the request even without an account.
  const sender = senderIdentity(proName, proProfession)
  const { error: emailError } = await sendEmail({
    to: clientEmail,
    subject: `${sender} vous demande des pièces sur PrivaDoc`,
    html: requestEmailHtml({
      sender,
      title,
      items,
      url: `${APP_URL}/${clientId ? 'login' : 'signup'}?next=%2Frequests`,
      existing: Boolean(clientId),
    }),
  })
  if (emailError) {
    return { message: `Demande créée, mais l’email n’a pas pu être envoyé : ${emailError}` }
  }

  return { message: 'Demande créée et email envoyé au client.' }
}

/**
 * Validate or reject a submitted piece with an optional comment, and notify the
 * client. RLS restricts the update to items belonging to the caller's requests.
 */
export async function reviewItem(formData: FormData): Promise<void> {
  const itemId = String(formData.get('itemId') ?? '').trim()
  const decision = String(formData.get('decision') ?? '').trim()
  const comment = String(formData.get('comment') ?? '').trim() || null
  if (!itemId || (decision !== 'validated' && decision !== 'rejected')) return

  const supabase = await createClient()
  const { data: item } = await supabase
    .from('request_items')
    .update({ status: decision, comment })
    .eq('id', itemId)
    .select('request_id, label')
    .single()
  if (!item) return

  const { data: request } = await supabase
    .from('document_requests')
    .select('client_id, title')
    .eq('id', item.request_id)
    .single()

  if (request?.client_id) {
    const validated = decision === 'validated'
    await notify({
      userId: request.client_id,
      type: validated ? 'piece_validated' : 'piece_rejected',
      title: validated ? `Pièce validée : ${item.label}` : `Pièce refusée : ${item.label}`,
      body: comment ?? undefined,
      requestId: item.request_id,
    })
  }

  revalidatePath(`/pro/${item.request_id}`)
}

/** Delete a request (RLS: pro-only). Items cascade. */
export async function deleteRequest(formData: FormData): Promise<void> {
  const id = String(formData.get('id') ?? '').trim()
  if (!id) return

  const supabase = await createClient()
  await supabase.from('document_requests').delete().eq('id', id)

  revalidatePath('/pro')
}
