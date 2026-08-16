import Link from 'next/link'
import { AuthForm } from '@/app/auth/auth-form'
import { signup } from '@/app/auth/actions'

export const metadata = {
  title: 'Créer un compte · PrivaDoc',
}

export default function SignupPage() {
  return (
    <AuthForm
      title="Créer ton compte"
      subtitle="Commence à stocker tes documents en privé."
      submitLabel="Créer le compte"
      action={signup}
      passwordAutoComplete="new-password"
      footer={
        <>
          Déjà un compte ?{' '}
          <Link
            href="/login"
            className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
          >
            Se connecter
          </Link>
        </>
      }
    />
  )
}
