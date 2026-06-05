import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline'
import { useLogin } from '@/hooks/useAuth'
import { ROUTES, APP_NAME } from '@/utils/constants'
import Button from '@/components/common/Button'
import Input from '@/components/common/Input'
import { AuthLayout } from './AuthLayout'
import { useAuthStore } from '@/store/authStore'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { mutate: login, isPending } = useLogin()
  const { isAuthenticated } = useAuthStore()
  const location = useLocation()
  const navigate = useNavigate()

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || ROUTES.HOME

  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true })
    }
  }, [isAuthenticated, navigate, from])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!email || !password) {
      setError('Please fill in all fields')
      return
    }

    login(
      { email, password },
      {
        onSuccess: () => {
          navigate(from, { replace: true })
        },
        onError: (err: { response?: { data?: { error?: string } }; message?: string }) => {
          const message = err?.response?.data?.error || err?.message || 'Invalid email or password'
          setError(message)
        },
      }
    )
  }

  return (
    <AuthLayout
      title="Welcome back"
      subtitle={`Sign in to your ${APP_NAME} account`}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        {from && from !== ROUTES.HOME && (
          <div className="bg-gallery-50 border border-gallery-200 rounded-lg px-3 py-2">
            <p className="text-xs text-gallery-700">Please sign in to continue</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            <p className="text-xs text-red-600">{error}</p>
          </div>
        )}

        <Input
          label="Email"
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="you@example.com"
          autoComplete="email"
          required
          disabled={isPending}
        />

        <Input
          label="Password"
          type={showPassword ? 'text' : 'password'}
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="Your password"
          autoComplete="current-password"
          required
          disabled={isPending}
          rightElement={
            <button
              type="button"
              onClick={() => setShowPassword(v => !v)}
              className="text-stone-400 hover:text-stone-600 transition-colors"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
            </button>
          }
        />

        <div className="flex justify-end">
          <Link
            to={ROUTES.FORGOT_PASSWORD}
            className="text-xs text-gallery-600 hover:text-gallery-700 transition-colors"
          >
            Forgot password?
          </Link>
        </div>

        <Button type="submit" fullWidth isLoading={isPending} className="mt-1">
          {isPending ? 'Signing in...' : 'Sign in'}
        </Button>
      </form>

      <p className="text-sm text-stone-500 text-center mt-6">
        No account yet?{' '}
        <Link to={ROUTES.REGISTER} className="text-gallery-600 hover:text-gallery-700 transition-colors font-medium">
          Create one free
        </Link>
      </p>
    </AuthLayout>
  )
}