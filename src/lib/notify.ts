import 'server-only'
import { createAdminClient } from '@/lib/supabase/server'

interface NotifyInput {
  userId: string
  type: string
  title: string
  body?: string
  requestId?: string
}

/**
 * Insert an in-app notification for a user. SERVER-ONLY.
 *
 * Uses the service-role client because `notifications` has no INSERT policy —
 * a normal session must not be able to write to another user's inbox.
 * Best-effort: failures are logged (without sensitive data) and swallowed so a
 * failed notification never breaks the action that triggered it.
 */
export async function notify(input: NotifyInput): Promise<void> {
  try {
    const supabase = createAdminClient()
    const { error } = await supabase.from('notifications').insert({
      user_id: input.userId,
      type: input.type,
      title: input.title,
      body: input.body ?? null,
      request_id: input.requestId ?? null,
    })
    if (error) {
      console.error('notify: insert failed', { type: input.type, code: error.code })
    }
  } catch (error: unknown) {
    console.error('notify: unexpected failure', {
      type: input.type,
      message: error instanceof Error ? error.message : 'unknown',
    })
  }
}
