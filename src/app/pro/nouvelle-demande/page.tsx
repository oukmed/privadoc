import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/app/account/profile'
import { getT } from '@/lib/i18n/server'
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

  const t = await getT()

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('pro.common.newRequest')}
        subtitle={t('pro.newRequestPage.subtitle')}
      />
      <Card>
        <NewRequestForm />
      </Card>
    </div>
  )
}
