'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { RECIPIENT_ROLES, type RecipientRole } from '@/lib/roles'

/**
 * A client requests a professional account. This only marks the request as
 * pending — an admin must approve it before is_professional becomes true.
 * RLS WITH CHECK requires id = auth.uid().
 */
export async function requestProAccount(): Promise<void> {
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

  await supabase
    .from('profiles')
    .upsert({ id: user.id, account_type: 'pro', pro_status: 'pending' })

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
  const rawProfession = String(formData.get('profession') ?? '').trim()
  const profession = RECIPIENT_ROLES.includes(rawProfession as RecipientRole) ? rawProfession : null

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return

  await supabase.from('profiles').upsert({ id: user.id, display_name: displayName, profession })

  revalidatePath('/account')
}
