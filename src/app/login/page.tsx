import Link from 'next/link'
import { AuthForm } from '@/app/auth/auth-form'
import { login } from '@/app/auth/actions'
import { getT } from '@/lib/i18n/server'

export const metadata = {
  title: 'Connexion · PrivaDoc',
}

export default async function LoginPage({
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
  const signupHref = query ? `/signup?${query}` : '/signup'
  const t = await getT()
  return (
    <AuthForm
      title={t('auth.login.title')}
      subtitle={t('auth.login.subtitle')}
      submitLabel={t('auth.login.submit')}
      action={login}
      passwordAutoComplete="current-password"
      next={next}
      defaultEmail={email}
      forgotHref="/forgot-password"
      footer={
        <>
          {t('auth.noAccount')}{' '}
          <Link
            href={signupHref}
            className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
          >
            {t('auth.toSignup')}
          </Link>
        </>
      }
    />
  )
}
