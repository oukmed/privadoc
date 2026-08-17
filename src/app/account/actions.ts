'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { RECIPIENT_ROLES, type RecipientRole } from '@/lib/roles'

/**
 * Toggle the caller's professional status. Reads the `professional` field
 * (checkbox 'on' / absent). RLS WITH CHECK requires id = auth.uid().
 */
export async function setProfessional(formData: FormData): Promise<void> {
  const isProfessional = String(formData.get('professional') ?? '') === 'on'

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return

  await supabase.from('profiles').upsert({ id: user.id, is_professional: isProfessional })

  revalidatePath('/account')
  revalidatePath('/')
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
