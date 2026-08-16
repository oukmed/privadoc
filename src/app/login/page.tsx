import Link from 'next/link'
import { AuthForm } from '@/app/auth/auth-form'
import { login } from '@/app/auth/actions'

export const metadata = {
  title: 'Connexion · PrivaDoc',
}

export default function LoginPage() {
  return (
    <AuthForm
      title="Bon retour"
      subtitle="Connecte-toi pour accéder à tes documents."
      submitLabel="Se connecter"
      action={login}
      passwordAutoComplete="current-password"
      footer={
        <>
          Pas encore de compte ?{' '}
          <Link
            href="/signup"
            className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
          >
            Créer un compte
          </Link>
        </>
      }
    />
  )
}
