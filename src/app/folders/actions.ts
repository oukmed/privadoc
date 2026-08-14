'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export type FolderState =
  | {
      error?: string
      message?: string
    }
  | undefined

const NAME_MAX = 100

function cleanName(raw: FormDataEntryValue | null): string {
  return String(raw ?? '').trim()
}

export async function createFolder(_prevState: FolderState, formData: FormData): Promise<FolderState> {
  const name = cleanName(formData.get('name'))
  if (name.length < 1 || name.length > NAME_MAX) {
    return { error: 'Nom de dossier invalide (1 à 100 caractères).' }
  }

  const parentId = String(formData.get('parentId') ?? '').trim()

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Session expirée, reconnecte-toi.' }

  // user_id set explicitly so it matches the WITH CHECK; RLS also rejects a
  // parent folder the caller does not own.
  const { error } = await supabase.from('folders').insert({
    name,
    user_id: user.id,
    ...(parentId ? { parent_id: parentId } : {}),
  })

  if (error) return { error: 'Impossible de créer le dossier.' }

  revalidatePath('/')
  return { message: 'Dossier créé.' }
}

export async function renameFolder(formData: FormData): Promise<void> {
  const id = String(formData.get('id') ?? '').trim()
  const name = cleanName(formData.get('name'))
  if (!id || name.length < 1 || name.length > NAME_MAX) return

  const supabase = await createClient()
  // RLS guarantees a user can only update their own folders.
  await supabase.from('folders').update({ name }).eq('id', id)

  revalidatePath('/')
}

export async function deleteFolder(formData: FormData): Promise<void> {
  const id = String(formData.get('id') ?? '').trim()
  if (!id) return

  const supabase = await createClient()
  // RLS guarantees a user can only delete their own folders. Child folders
  // cascade; documents' folder_id is set null by the FK.
  await supabase.from('folders').delete().eq('id', id)

  revalidatePath('/')
}
