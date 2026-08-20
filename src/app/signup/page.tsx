import Link from 'next/link'
import { AuthForm } from '@/app/auth/auth-form'
import { signup } from '@/app/auth/actions'

export const metadata = {
  title: 'Créer un compte · PrivaDoc',
}

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>
}) {
  const nextParam = (await searchParams).next
  const next = typeof nextParam === 'string' ? nextParam : undefined
  const loginHref = next ? `/login?next=${encodeURIComponent(next)}` : '/login'
  return (
    <AuthForm
      title="Créer ton compte"
      subtitle="Commence à stocker tes documents en privé."
      submitLabel="Créer le compte"
      action={signup}
      passwordAutoComplete="new-password"
      next={next}
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
