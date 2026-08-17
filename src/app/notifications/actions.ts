'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

/** Marks a single notification read. RLS scopes the update to the caller. */
export async function markNotificationRead(formData: FormData): Promise<void> {
  const id = String(formData.get('id') ?? '')
  if (!id) return

  const supabase = await createClient()
  await supabase.from('notifications').update({ read: true }).eq('id', id)

  revalidatePath('/')
  revalidatePath('/notifications')
}

/** Marks every notification of the current user read. */
export async function markAllNotificationsRead(): Promise<void> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return

  await supabase.from('notifications').update({ read: true }).eq('user_id', user.id).eq('read', false)

  revalidatePath('/')
  revalidatePath('/notifications')
}
