import 'server-only'
import { createClient } from '@/lib/supabase/server'

export interface Profile {
  isProfessional: boolean
  plan: string
  displayName: string | null
  profession: string | null
  /** null | 'pending' | 'approved' | 'rejected' — approval state of a pro request. */
  proStatus: string | null
  isAdmin: boolean
}

const DEFAULT_PROFILE: Profile = {
  isProfessional: false,
  plan: 'free',
  displayName: null,
  profession: null,
  proStatus: null,
  isAdmin: false,
}

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
    .select('is_professional, plan, display_name, profession, pro_status, is_admin')
    .eq('id', user.id)
    .maybeSingle()

  if (data)
    return {
      isProfessional: data.is_professional,
      plan: data.plan,
      displayName: data.display_name,
      profession: data.profession,
      proStatus: data.pro_status,
      isAdmin: data.is_admin,
    }

  // First visit: create the row (RLS WITH CHECK requires id = auth.uid()).
  await supabase.from('profiles').upsert({ id: user.id })
  return DEFAULT_PROFILE
}
