import Link from 'next/link'
import { AuthForm } from '@/app/auth/auth-form'
import { signup } from '@/app/auth/actions'

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
  return (
    <AuthForm
      title="Créer ton compte"
      subtitle="Commence à stocker tes documents en privé."
      submitLabel="Créer le compte"
      action={signup}
      passwordAutoComplete="new-password"
      showName
      next={next}
      defaultEmail={email}
      footer={
        <>
          Déjà un compte ?{' '}
          <Link
            href={loginHref}
            className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
          >
            Se connecter
          </Link>
        </>
      }
    />
  )
}
