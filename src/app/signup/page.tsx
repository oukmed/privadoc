import Link from 'next/link'
import { AuthForm } from '@/app/auth/auth-form'
import { signup } from '@/app/auth/actions'
import { getT } from '@/lib/i18n/server'

export const metadata = {
  title: 'Créer un compte · PrivaDoc',
}

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[]; email?: string | string[] }>
}) {
  const sp = await searchParams
  const next = typeof sp.next === 'string' ? sp.next : undefined
  const email = typeof sp.email === 'string' ? sp.email : undefined
  const params = new URLSearchParams()
  if (next) params.set('next', next)
  if (email) params.set('email', email)
  const query = params.toString()
  const loginHref = query ? `/login?${query}` : '/login'
  const t = await getT()
  return (
    <AuthForm
      title={t('auth.signup.title')}
      subtitle={t('auth.signup.subtitle')}
      submitLabel={t('auth.signup.submit')}
      action={signup}
      passwordAutoComplete="new-password"
      showName
      next={next}
      defaultEmail={email}
      footer={
        <>
          {t('auth.haveAccount')}{' '}
          <Link
            href={loginHref}
            className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
          >
            {t('auth.toLogin')}
          </Link>
        </>
      }
    />
  )
}
