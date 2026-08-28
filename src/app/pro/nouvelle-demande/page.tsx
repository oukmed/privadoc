import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/app/account/profile'
import { Card, PageHeader } from '@/app/pro/ui'
import { NewRequestForm } from '@/app/pro/nouvelle-demande/new-request-form'

export default async function NouvelleDemandePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/pro/nouvelle-demande')

  const profile = await getProfile()
  if (!profile.isProfessional) redirect('/pro')

  return (
    <div className="space-y-6">
      <PageHeader
        title="Nouvelle demande"
        subtitle="Demandez des pièces à un client — il recevra un email et une notification."
      />
      <Card>
        <NewRequestForm />
      </Card>
    </div>
  )
}
