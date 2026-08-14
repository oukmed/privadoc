import Link from 'next/link'
import { AuthForm } from '@/app/auth/auth-form'
import { login } from '@/app/auth/actions'

export const metadata = {
  title: 'Sign in · PrivaDoc',
}

export default function LoginPage() {
  return (
    <AuthForm
      title="Welcome back"
      subtitle="Sign in to access your documents."
      submitLabel="Sign in"
      action={login}
      passwordAutoComplete="current-password"
      footer={
        <>
          Don&apos;t have an account?{' '}
          <Link
            href="/signup"
            className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
          >
            Create one
          </Link>
        </>
      }
    />
  )
}
