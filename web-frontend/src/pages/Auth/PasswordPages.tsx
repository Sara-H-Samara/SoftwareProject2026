import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { CheckCircleIcon } from '@heroicons/react/24/outline'
import { useForgotPassword, useResetPassword } from '@/hooks/useAuth'
import { ROUTES } from '@/utils/constants'
import Button from '@/components/common/Button'
import Input from '@/components/common/Input'
import { AuthLayout } from './AuthLayout'

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const { mutate: forgotPassword, isPending } = useForgotPassword()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    forgotPassword(email, { onSuccess: () => setSubmitted(true) })
  }

  return (
    <AuthLayout title="Reset your password" subtitle="We'll email you a link to reset it.">
      {submitted ? (
        <div className="flex flex-col items-center gap-4 py-4 text-center">
          <CheckCircleIcon className="h-12 w-12 text-gallery-500" />
          <p className="text-sm text-stone-600">
            If an account with <strong className="text-stone-800">{email}</strong> exists,
            a reset link has been sent. Check your inbox.
          </p>
          <Link to={ROUTES.LOGIN}>
            <Button variant="secondary" size="sm">Back to sign in</Button>
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
          <Input
            label="Email address"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            required
          />
          <Button type="submit" fullWidth isLoading={isPending}>
            Send reset link
          </Button>
          <Link to={ROUTES.LOGIN} className="text-sm text-center text-stone-500 hover:text-stone-700 transition-colors">
            ← Back to sign in
          </Link>
        </form>
      )}
    </AuthLayout>
  )
}

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const email = searchParams.get('email') ?? ''
  const token = searchParams.get('token') ?? ''
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [mismatch, setMismatch] = useState(false)
  const { mutate: resetPassword, isPending } = useResetPassword()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirm) {
      setMismatch(true)
      return
    }
    setMismatch(false)
    resetPassword({ email, token, newPassword: password })
  }

  if (!email || !token) {
    return (
      <AuthLayout title="Invalid link" subtitle="This reset link is missing required parameters.">
        <Link to={ROUTES.FORGOT_PASSWORD}>
          <Button fullWidth variant="secondary">Request a new link</Button>
        </Link>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout title="Choose a new password" subtitle="Make it strong — at least 8 characters.">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <Input
          label="New password"
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="Min. 8 characters"
          autoComplete="new-password"
          required
        />
        <Input
          label="Confirm password"
          type="password"
          value={confirm}
          onChange={e => setConfirm(e.target.value)}
          placeholder="Repeat your password"
          autoComplete="new-password"
          required
          error={mismatch ? 'Passwords do not match.' : undefined}
        />
        <Button type="submit" fullWidth isLoading={isPending}>
          Reset password
        </Button>
      </form>
    </AuthLayout>
  )
}