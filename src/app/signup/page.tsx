import Link from 'next/link'
import { AuthForm } from '@/app/auth/auth-form'
import { signup } from '@/app/auth/actions'

export const metadata = {
  title: 'Create account · PrivaDoc',
}

export default function SignupPage() {
  return (
    <AuthForm
      title="Create your account"
      subtitle="Start storing documents privately."
      submitLabel="Create account"
      action={signup}
      passwordAutoComplete="new-password"
      footer={
        <>
          Already have an account?{' '}
          <Link
            href="/login"
            className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
          >
            Sign in
          </Link>
        </>
      }
    />
  )
}
