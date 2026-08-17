import 'server-only'
import { createClient } from '@/lib/supabase/server'

export interface Profile {
  isProfessional: boolean
  plan: string
}

const DEFAULT_PROFILE: Profile = { isProfessional: false, plan: 'free' }

/**
 * The caller's profile flags. Creates a default row on first access so every
 * signed-in user has a profile. Returns sane defaults when unauthenticated.
 */
export async function getProfile(): Promise<Profile> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return DEFAULT_PROFILE

  const { data } = await supabase
    .from('profiles')
    .select('is_professional, plan')
    .eq('id', user.id)
    .maybeSingle()

  if (data) return { isProfessional: data.is_professional, plan: data.plan }

  // First visit: create the row (RLS WITH CHECK requires id = auth.uid()).
  await supabase.from('profiles').upsert({ id: user.id })
  return DEFAULT_PROFILE
}
