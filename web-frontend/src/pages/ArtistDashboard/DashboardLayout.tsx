import { NavLink, Outlet } from 'react-router-dom'
import {
  Squares2X2Icon,
  PhotoIcon,
  CloudArrowUpIcon,
  ViewColumnsIcon,
  UserCircleIcon,
  ChartBarIcon,
  SparklesIcon,
  VideoCameraIcon,
} from '@heroicons/react/24/outline'
import { useAuthStore } from '@/store/authStore'
import { ROUTES } from '@/utils/constants'
import { getInitials } from '@/utils/helpers'
import { useState } from 'react'
import Breadcrumb from '@/components/common/Breadcrumb'

const navItems = [
  { to: ROUTES.DASHBOARD,           label: 'Overview',           icon: Squares2X2Icon, end: true },
  { to: ROUTES.DASHBOARD_ARTWORKS,  label: 'My Artworks',        icon: PhotoIcon },
  { to: ROUTES.DASHBOARD_UPLOAD,    label: 'Upload New',          icon: CloudArrowUpIcon },
  { to: ROUTES.DASHBOARD_LAYOUT,    label: 'Layout Editor',       icon: ViewColumnsIcon },
  { to: '/dashboard/analytics',     label: 'Analytics',           icon: ChartBarIcon },
  { to: '/dashboard/studio-pro',    label: 'Gallery Studio Pro',  icon: SparklesIcon },
  { to: '/dashboard/start-live',    label: 'Start Live Auction',  icon: VideoCameraIcon },
  { to: ROUTES.DASHBOARD_PROFILE,   label: 'Profile',             icon: UserCircleIcon },
]

export default function DashboardLayout() {
  const { user } = useAuthStore()
  const [imageError, setImageError] = useState(false)

  const getImageUrl = (url: string | undefined) => {
    if (!url || url.includes('default-avatar')) return '/default-avatar.jpg'
    if (url.startsWith('http')) return url
    if (url.startsWith('/')) return `${import.meta.env.VITE_API_BASE_URL}${url}`
    return `${import.meta.env.VITE_API_BASE_URL}/${url}`
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-stone-50">
      {/* Sidebar */}
      <aside className="lg:w-64 lg:shrink-0 lg:sticky lg:top-16 lg:h-[calc(100vh-4rem)]
                        border-b lg:border-b-0 lg:border-r border-stone-200
                        bg-white overflow-x-auto lg:overflow-x-visible">
        <div className="flex lg:flex-col p-4 gap-1 lg:gap-1.5 min-w-max lg:min-w-0">

          {/* Artist identity — desktop only */}
          <div className="hidden lg:flex items-center gap-3 px-3 py-4 mb-4 border-b border-stone-100">
            {user?.profilePicUrl && !imageError ? (
              <img
                src={getImageUrl(user.profilePicUrl)}
                alt={user.displayName ?? 'Profile'}
                className="w-10 h-10 rounded-full object-cover ring-2 ring-gallery-200 shrink-0"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gallery-500 to-purple-600
                              flex items-center justify-center text-sm font-semibold text-white
                              ring-2 ring-gallery-200 shrink-0">
                {getInitials(user?.displayName || user?.email || 'Artist')}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-sm font-semibold text-stone-800 truncate">
                {user?.displayName ?? 'Artist'}
              </p>
              <p className="text-xs text-stone-500 truncate">{user?.galleryName}</p>
            </div>
          </div>

          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                [
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                  'whitespace-nowrap',
                  // Live Auction gets a special red tint
                  to === '/dashboard/start-live'
                    ? isActive
                      ? 'bg-red-50 text-red-700 border border-red-200 shadow-sm'
                      : 'text-red-600 hover:text-red-700 hover:bg-red-50'
                    : isActive
                      ? 'bg-gallery-50 text-gallery-700 border border-gallery-200 shadow-sm'
                      : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50',
                ].join(' ')
              }
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span>{label}</span>
              {to === '/dashboard/start-live' && (
                <span className="ml-auto text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-red-100 text-red-600">
                  LIVE
                </span>
              )}
            </NavLink>
          ))}

        </div>
      </aside>

      <main className="flex-1 min-w-0 p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <Breadcrumb />
          <div className="mt-4">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  )
}