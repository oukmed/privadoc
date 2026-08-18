'use server'

import { revalidatePath } from 'next/cache'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { RECIPIENT_ROLES, ROLE_LABELS, type RecipientRole } from '@/lib/roles'
import { sendEmail } from '@/lib/email'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? ''

/** Escape user-controlled values before interpolating them into email HTML. */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/**
 * Profession is either a known role key OR a free-text value the user typed when
 * their profession isn't in the list. A non-empty custom field wins.
 */
function resolveProfession(formData: FormData): string | null {
  const custom = String(formData.get('customProfession') ?? '').trim().slice(0, 60)
  if (custom) return custom
  const raw = String(formData.get('profession') ?? '').trim()
  return RECIPIENT_ROLES.includes(raw as RecipientRole) ? raw : null
}

function proRequestEmailHtml(who: string, email: string): string {
  return `
    <div style="font-family:system-ui,sans-serif;max-width:520px;margin:auto;color:#1e293b">
      <h2 style="color:#4f46e5">Nouvelle demande de compte professionnel</h2>
      <p><strong>${escapeHtml(who)}</strong> souhaite créer un compte professionnel sur PrivaDoc.</p>
      <p style="color:#64748b">Email : ${escapeHtml(email)}</p>
      <p><a href="${APP_URL}/admin" style="display:inline-block;background:#4f46e5;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none">Valider dans la console d'administration</a></p>
    </div>`
}

/** Email every super-admin that a new pro account is awaiting validation. */
async function notifyAdminsOfProRequest(
  email: string,
  displayName: string | null,
  profession: string | null,
): Promise<void> {
  const label = profession ? (ROLE_LABELS[profession as RecipientRole] ?? profession) : null
  const who = displayName ? `${displayName}${label ? ` (${label})` : ''}` : email

  const adminDb = createAdminClient()
  const { data: admins } = await adminDb.from('profiles').select('id').eq('is_admin', true)
  for (const a of admins ?? []) {
    const { data } = await adminDb.auth.admin.getUserById(a.id)
    const adminEmail = data?.user?.email
    if (adminEmail) {
      await sendEmail({
        to: adminEmail,
        subject: 'Nouvelle demande de compte professionnel — PrivaDoc',
        html: proRequestEmailHtml(who, email),
      })
    }
  }
}

/**
 * A client requests a professional account. This only marks the request as
 * pending — an admin must approve it before is_professional becomes true.
 * RLS WITH CHECK requires id = auth.uid().
 */
export async function requestProAccount(formData: FormData): Promise<void> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return

  // Don't clobber an already-approved pro.
  const { data: current } = await supabase
    .from('profiles')
    .select('is_professional, pro_status')
    .eq('id', user.id)
    .maybeSingle()
  if (current?.is_professional || current?.pro_status === 'pending') return

  // Collect identity up front so the admin knows who is requesting.
  const displayName = String(formData.get('displayName') ?? '').trim().slice(0, 120) || null
  const profession = resolveProfession(formData)

  await supabase
    .from('profiles')
    .upsert({
      id: user.id,
      account_type: 'pro',
      pro_status: 'pending',
      display_name: displayName,
      profession,
    })

  await notifyAdminsOfProRequest(user.email ?? 'Un utilisateur', displayName, profession)

  revalidatePath('/pro')
  revalidatePath('/account')
}

/**
 * Save the pro's public identity (name/firm + profession) shown to clients in
 * request emails and their requests page. Profession is validated against the
 * known role list; anything else is stored as null.
 */
export async function updateProProfile(formData: FormData): Promise<void> {
  const displayName = String(formData.get('displayName') ?? '').trim().slice(0, 120) || null
  const profession = resolveProfession(formData)

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return

  await supabase.from('profiles').upsert({ id: user.id, display_name: displayName, profession })

  revalidatePath('/account')
}
