'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

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
