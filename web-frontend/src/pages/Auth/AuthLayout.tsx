import { Link } from 'react-router-dom'
import { APP_NAME, ROUTES } from '@/utils/constants'

export function AuthLayout({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle: string
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-16 bg-stone-50">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <Link
          to={ROUTES.HOME}
          className="flex items-center justify-center gap-2 mb-8 focus:outline-none"
        >
          <div className="w-9 h-9 rounded-xl flex items-center justify-center
                          bg-gradient-to-br from-gallery-500 to-purple-600 shadow-md">
            <span className="text-white font-bold text-sm">V</span>
          </div>
          <span className="font-semibold text-stone-800 text-lg tracking-tight">
            {APP_NAME}
          </span>
        </Link>

        <div className="bg-white border border-stone-100 rounded-2xl p-7 shadow-sm">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-stone-800">{title}</h1>
            <p className="text-sm text-stone-500 mt-1">{subtitle}</p>
          </div>
          {children}
        </div>
      </div>
    </div>
  )
}