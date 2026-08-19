'use server'

import { revalidatePath } from 'next/cache'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/email'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? ''

/** Returns the caller only if they are a super-admin, else null. */
async function requireAdmin(supabase: Awaited<ReturnType<typeof createClient>>) {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase.from('profiles').select('is_admin').eq('id', user.id).maybeSingle()
  return data?.is_admin ? user : null
}

function approvedEmailHtml(): string {
  return `
    <div style="font-family:system-ui,sans-serif;max-width:520px;margin:auto;color:#1e293b">
      <h2 style="color:#4f46e5">Compte professionnel activé</h2>
      <p>Votre compte professionnel PrivaDoc a été validé. Vous pouvez maintenant créer des demandes de pièces à vos clients.</p>
      <p><a href="${APP_URL}/pro" style="display:inline-block;background:#4f46e5;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none">Ouvrir l'espace pro</a></p>
    </div>`
}

/** Approve a pending pro request: activate the account and email the pro. */
export async function approvePro(formData: FormData): Promise<void> {
  const profileId = String(formData.get('profileId') ?? '').trim()
  if (!profileId) return

  const supabase = await createClient()
  if (!(await requireAdmin(supabase))) return

  // Admin RLS policy allows updating any profile.
  const { error } = await supabase
    .from('profiles')
    .update({ is_professional: true, account_type: 'pro', pro_status: 'approved' })
    .eq('id', profileId)
  if (error) return

  const { data } = await createAdminClient().auth.admin.getUserById(profileId)
  const email = data?.user?.email
  if (email) {
    await sendEmail({
      to: email,
      subject: 'Votre compte professionnel PrivaDoc est activé',
      html: approvedEmailHtml(),
    })
  }

  revalidatePath('/admin')
}

/** Reject a pending pro request. The account reverts to a private client. */
export async function rejectPro(formData: FormData): Promise<void> {
  const profileId = String(formData.get('profileId') ?? '').trim()
  if (!profileId) return

  const supabase = await createClient()
  if (!(await requireAdmin(supabase))) return

  await supabase
    .from('profiles')
    .update({ is_professional: false, account_type: 'private', pro_status: 'rejected' })
    .eq('id', profileId)

  revalidatePath('/admin')
}

/**
 * Manually validate a pro's paid subscription (beyond the free client tier).
 * ponytail: manual admin gate until Stripe is wired — plan/subscription_status
 * are the placeholders the billing integration will later drive automatically.
 */
export async function activateSubscription(formData: FormData): Promise<void> {
  const profileId = String(formData.get('profileId') ?? '').trim()
  if (!profileId) return

  const supabase = await createClient()
  if (!(await requireAdmin(supabase))) return

  await supabase
    .from('profiles')
    .update({ plan: 'pro', subscription_status: 'active' })
    .eq('id', profileId)

  revalidatePath('/admin')
}

/** Revoke a pro's paid subscription (back to the free tier). */
export async function deactivateSubscription(formData: FormData): Promise<void> {
  const profileId = String(formData.get('profileId') ?? '').trim()
  if (!profileId) return

  const supabase = await createClient()
  if (!(await requireAdmin(supabase))) return

  await supabase
    .from('profiles')
    .update({ plan: 'free', subscription_status: 'inactive' })
    .eq('id', profileId)

  revalidatePath('/admin')
}

/** Revoke a professional account entirely — the user becomes a private client. */
export async function revokePro(formData: FormData): Promise<void> {
  const profileId = String(formData.get('profileId') ?? '').trim()
  if (!profileId) return

  const supabase = await createClient()
  if (!(await requireAdmin(supabase))) return

  await supabase
    .from('profiles')
    .update({
      is_professional: false,
      account_type: 'private',
      pro_status: null,
      plan: 'free',
      subscription_status: 'inactive',
    })
    .eq('id', profileId)

  revalidatePath('/admin')
}
