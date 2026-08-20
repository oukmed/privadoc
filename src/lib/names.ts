import 'server-only'
import { createAdminClient } from '@/lib/supabase/server'

/**
 * Resolve display names for a set of user ids. SERVER-ONLY.
 *
 * Uses the service-role client because a user cannot read another user's profile
 * under RLS (owner-only). Returns a Map of id → non-empty display name; ids
 * without a name are simply absent so callers fall back to the email.
 */
export async function resolveDisplayNames(
  userIds: (string | null | undefined)[],
): Promise<Map<string, string>> {
  const ids = [...new Set(userIds.filter((id): id is string => Boolean(id)))]
  const map = new Map<string, string>()
  if (ids.length === 0) return map

  const { data } = await createAdminClient()
    .from('profiles')
    .select('id, display_name')
    .in('id', ids)
  for (const row of data ?? []) {
    const name = row.display_name?.trim()
    if (name) map.set(row.id, name)
  }
  return map
}
