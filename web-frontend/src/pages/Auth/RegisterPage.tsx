// web-frontend/src/pages/Auth/RegisterPage.tsx
import { useState} from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { EyeIcon, EyeSlashIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline'
import { useRegister } from '@/hooks/useAuth'
import { ROUTES } from '@/utils/constants'
import type { UserType } from '@/types'
import Button from '@/components/common/Button'
import Input from '@/components/common/Input'
import { AuthLayout } from './AuthLayout'

function checkPasswordStrength(password: string): {
  score: number
  label: string
  color: string
  requirements: { met: boolean; text: string }[]
} {
  const requirements = [
    { met: password.length >= 8, text: 'At least 8 characters' },
    { met: /[A-Z]/.test(password), text: 'One uppercase letter (A-Z)' },
    { met: /[a-z]/.test(password), text: 'One lowercase letter (a-z)' },
    { met: /[0-9]/.test(password), text: 'One number (0-9)' },
    { met: /[^A-Za-z0-9]/.test(password), text: 'One special character (!@#$%^&*)' },
  ]

  const metCount = requirements.filter(r => r.met).length
  
  let label = 'Weak'
  let color = 'bg-red-500'
  if (metCount >= 4) { label = 'Strong'; color = 'bg-green-500' }
  else if (metCount >= 3) { label = 'Good'; color = 'bg-yellow-500' }
  else if (metCount >= 2) { label = 'Weak'; color = 'bg-orange-500' }
  
  return { score: metCount, label, color, requirements }
}

export default function RegisterPage() {
  const [form, setForm] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    displayName: '',
    userType: 'Visitor' as UserType,
    galleryName: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [touched, setTouched] = useState({
    email: false,
    password: false,
    confirmPassword: false,
    displayName: false,
    galleryName: false,
  })
  
  const { mutate: register, isPending } = useRegister()
  const navigate = useNavigate()
  const passwordStrength = checkPasswordStrength(form.password)
  const passwordsMatch = form.password === form.confirmPassword
  const isPasswordValid = passwordStrength.score >= 3 // Strong or Good
  
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)
  
  const isFormValid = 
    isEmailValid &&
    isPasswordValid &&
    passwordsMatch &&
    form.password.length > 0 &&
    form.displayName.trim().length > 0 &&
    (form.userType !== 'Artist' || form.galleryName.trim().length > 0)

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [key]: e.target.value }))

  const handleBlur = (field: keyof typeof touched) => () => {
    setTouched(prev => ({ ...prev, [field]: true }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    setTouched({
      email: true,
      password: true,
      confirmPassword: true,
      displayName: true,
      galleryName: true,
    })
    
    if (!isFormValid) return
    
    register({
      email: form.email,
      password: form.password,
      displayName: form.displayName,
      userType: form.userType,
      galleryName: form.userType === 'Artist' ? form.galleryName : undefined,
    }, {
      onSuccess: () => {
        navigate(ROUTES.DASHBOARD)
      },
    })
  }

  const getFieldError = (field: keyof typeof touched): string | undefined => {
    if (!touched[field]) return undefined
    
    switch (field) {
      case 'email':
        if (!form.email) return 'Email is required'
        if (!isEmailValid) return 'Please enter a valid email address'
        return undefined
      case 'password':
        if (!form.password) return 'Password is required'
        if (!isPasswordValid) return 'Password does not meet requirements'
        return undefined
      case 'confirmPassword':
        if (!form.confirmPassword) return 'Please confirm your password'
        if (!passwordsMatch) return 'Passwords do not match'
        return undefined
      case 'displayName':
        if (!form.displayName) return 'Display name is required'
        if (form.displayName.length < 2) return 'Display name must be at least 2 characters'
        return undefined
      case 'galleryName':
        if (form.userType === 'Artist' && !form.galleryName) return 'Gallery name is required for artists'
        return undefined
      default:
        return undefined
    }
  }

  return (
    <AuthLayout title="Create your account" subtitle="Join Virtual Art Gallery — free forever for students.">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        {/* User Type Selection */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-stone-700">I am a…</label>
          <div className="grid grid-cols-2 gap-2">
            {(['Artist', 'Visitor'] as UserType[]).map(type => (
              <button
                key={type}
                type="button"
                onClick={() => setForm(prev => ({ ...prev, userType: type }))}
                className={[
                  'px-4 py-2.5 rounded-xl text-sm font-medium border transition-all',
                  form.userType === type
                    ? 'bg-gallery-500 border-gallery-500 text-white shadow-sm'
                    : 'bg-white border-stone-200 text-stone-600 hover:border-gallery-300 hover:bg-gallery-50',
                ].join(' ')}
              >
                {type === 'Artist' ? '🎨 Artist' : '👁 Visitor'}
              </button>
            ))}
          </div>
        </div>

        {/* Display Name */}
        <div>
          <Input
            label="Display name"
            type="text"
            value={form.displayName}
            onChange={set('displayName')}
            onBlur={handleBlur('displayName')}
            placeholder="Your public name"
            autoComplete="name"
            required
            error={getFieldError('displayName')}
          />
          <p className="text-xs text-stone-400 mt-1">
            This is how you'll appear to other users
          </p>
        </div>

        {/* Gallery Name (only for Artists) */}
        {form.userType === 'Artist' && (
          <div>
            <Input
              label="Gallery name"
              type="text"
              value={form.galleryName}
              onChange={set('galleryName')}
              onBlur={handleBlur('galleryName')}
              placeholder="e.g., Jane's Modern Space"
              hint="This is what visitors will see when browsing."
              required
              error={getFieldError('galleryName')}
            />
          </div>
        )}

        {/* Email */}
        <div>
          <Input
            label="Email"
            type="email"
            value={form.email}
            onChange={set('email')}
            onBlur={handleBlur('email')}
            placeholder="you@example.com"
            autoComplete="email"
            required
            error={getFieldError('email')}
          />
          {touched.email && isEmailValid && form.email && (
            <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
              <CheckCircleIcon className="w-3 h-3" /> Valid email address
            </p>
          )}
        </div>

        {/* Password with strength indicator */}
        <div>
          <Input
            label="Password"
            type={showPassword ? 'text' : 'password'}
            value={form.password}
            onChange={set('password')}
            onBlur={handleBlur('password')}
            placeholder="Create a strong password"
            autoComplete="new-password"
            required
            error={getFieldError('password')}
            rightElement={
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                className="text-stone-400 hover:text-stone-600 transition-colors"
                aria-label={showPassword ? 'Hide' : 'Show'}
              >
                {showPassword ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
              </button>
            }
          />
          
          {/* ✅ Password strength indicator */}
          {form.password && (
            <div className="mt-2 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex-1 h-1.5 bg-stone-200 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${passwordStrength.color} transition-all duration-300`}
                    style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                  />
                </div>
                <span className={`text-xs font-medium ml-2 ${
                  passwordStrength.label === 'Strong' ? 'text-green-600' :
                  passwordStrength.label === 'Good' ? 'text-yellow-600' : 'text-red-500'
                }`}>
                  {passwordStrength.label}
                </span>
              </div>
              
              <div className="space-y-1">
                {passwordStrength.requirements.map((req, i) => (
                  <div key={i} className="flex items-center gap-1.5 text-xs">
                    {req.met ? (
                      <CheckCircleIcon className="w-3 h-3 text-green-500" />
                    ) : (
                      <XCircleIcon className="w-3 h-3 text-stone-300" />
                    )}
                    <span className={req.met ? 'text-green-600' : 'text-stone-400'}>
                      {req.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Confirm Password */}
        <div>
          <Input
            label="Confirm password"
            type={showConfirmPassword ? 'text' : 'password'}
            value={form.confirmPassword}
            onChange={set('confirmPassword')}
            onBlur={handleBlur('confirmPassword')}
            placeholder="Repeat your password"
            autoComplete="new-password"
            required
            error={getFieldError('confirmPassword')}
            rightElement={
              <button
                type="button"
                onClick={() => setShowConfirmPassword(v => !v)}
                className="text-stone-400 hover:text-stone-600 transition-colors"
                aria-label={showConfirmPassword ? 'Hide' : 'Show'}
              >
                {showConfirmPassword ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
              </button>
            }
          />
          
          {/* ✅ Match indicator */}
          {touched.confirmPassword && form.confirmPassword && (
            <p className={`text-xs mt-1 flex items-center gap-1 ${
              passwordsMatch ? 'text-green-600' : 'text-red-500'
            }`}>
              {passwordsMatch ? (
                <><CheckCircleIcon className="w-3 h-3" /> Passwords match</>
              ) : (
                <><XCircleIcon className="w-3 h-3" /> Passwords do not match</>
              )}
            </p>
          )}
        </div>

        {/* Terms & Conditions */}
        <div className="flex items-start gap-2 mt-1">
          <input
            type="checkbox"
            id="terms"
            required
            className="mt-0.5 w-4 h-4 rounded border-stone-300 text-gallery-600 focus:ring-gallery-500"
          />
          <label htmlFor="terms" className="text-xs text-stone-500">
            I agree to the{' '}
            <Link to="/terms" className="text-gallery-600 hover:text-gallery-700">Terms of Service</Link>
            {' '}and{' '}
            <Link to="/privacy" className="text-gallery-600 hover:text-gallery-700">Privacy Policy</Link>
          </label>
        </div>

        {/* Submit Button */}
        <Button 
          type="submit" 
          fullWidth 
          isLoading={isPending}
          disabled={!isFormValid}
          className="mt-2"
        >
          Create account
        </Button>

        <p className="text-xs text-stone-400 text-center">
          By registering you agree to our Terms of Service and Privacy Policy.
        </p>
      </form>

      <p className="text-sm text-stone-500 text-center mt-6">
        Already have an account?{' '}
        <Link to={ROUTES.LOGIN} className="text-gallery-600 hover:text-gallery-700 font-medium transition-colors">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  )
}