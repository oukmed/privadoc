import Link from 'next/link'
import { AuthForm } from '@/app/auth/auth-form'
import { login } from '@/app/auth/actions'

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
  return (
    <AuthForm
      title="Bon retour"
      subtitle="Connecte-toi pour accéder à tes documents."
      submitLabel="Se connecter"
      action={login}
      passwordAutoComplete="current-password"
      next={next}
      defaultEmail={email}
      forgotHref="/forgot-password"
      footer={
        <>
          Pas encore de compte ?{' '}
          <Link
            href={signupHref}
            className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
          >
            Créer un compte
          </Link>
        </>
      }
    />
  )
}
