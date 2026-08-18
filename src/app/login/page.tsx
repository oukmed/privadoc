import Link from 'next/link'
import { AuthForm } from '@/app/auth/auth-form'
import { login } from '@/app/auth/actions'

export const metadata = {
  title: 'Connexion · PrivaDoc',
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>
}) {
  const nextParam = (await searchParams).next
  const next = typeof nextParam === 'string' ? nextParam : undefined
  const signupHref = next ? `/signup?next=${encodeURIComponent(next)}` : '/signup'
  return (
    <AuthForm
      title="Bon retour"
      subtitle="Connecte-toi pour accéder à tes documents."
      submitLabel="Se connecter"
      action={login}
      passwordAutoComplete="current-password"
      next={next}
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
