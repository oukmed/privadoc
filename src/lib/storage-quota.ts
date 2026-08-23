import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/types/database'

type Client = SupabaseClient<Database>

const GB = 1024 * 1024 * 1024
export const FREE_STORAGE_BYTES = 1 * GB
export const PRO_STORAGE_BYTES = 25 * GB

/** Storage allowance for an account, based on its subscription. */
export function quotaForSubscription(status: string | null | undefined): number {
  return status === 'active' ? PRO_STORAGE_BYTES : FREE_STORAGE_BYTES
}

export function formatBytes(bytes: number): string {
  if (bytes >= GB) return `${(bytes / GB).toFixed(bytes % GB === 0 ? 0 : 1)} Go`
  const mb = bytes / (1024 * 1024)
  return `${mb.toFixed(mb >= 10 || mb % 1 === 0 ? 0 : 1)} Mo`
}

/** Current usage + quota for the signed-in user. */
export async function storageStatus(supabase: Client): Promise<{ used: number; quota: number }> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const [{ data: used }, profileRes] = await Promise.all([
    supabase.rpc('storage_used'),
    user
      ? supabase.from('profiles').select('subscription_status').eq('id', user.id).maybeSingle()
      : Promise.resolve({ data: null }),
  ])
  const status = (profileRes.data as { subscription_status?: string | null } | null)?.subscription_status
  return { used: Number(used ?? 0), quota: quotaForSubscription(status) }
}

/** Returns an error message if adding `incomingBytes` would exceed the quota, else null. */
export async function quotaError(supabase: Client, incomingBytes: number): Promise<string | null> {
  const { used, quota } = await storageStatus(supabase)
  if (used + incomingBytes > quota) {
    const free = Math.max(0, quota - used)
    return `Espace de stockage insuffisant : il reste ${formatBytes(free)} sur ${formatBytes(quota)}. Supprime des fichiers ou passe à un abonnement supérieur.`
  }
  return null
}
