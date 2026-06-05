import { Link } from 'react-router-dom'
import {
  CloudArrowUpIcon,
  ViewColumnsIcon,
  PhotoIcon,
  EyeIcon,
  CubeIcon,
  ArrowRightIcon,
  VideoCameraIcon,
} from '@heroicons/react/24/outline'
import { useAuthStore } from '@/store/authStore'
import { useMyArtworks } from '@/hooks/useArtworks'
import { ROUTES } from '@/utils/constants'
import { Spinner } from '@/components/common/Spinner'
import type { Artwork } from '@/types'

export default function DashboardOverviewPage() {
  const { user, isAuthenticated } = useAuthStore()
  const { data: artworks, isLoading } = useMyArtworks()

  const publishedCount = artworks?.filter((a: Artwork) => a.isPublished).length ?? 0
  const draftCount = (artworks?.length ?? 0) - publishedCount

  const stats = [
    { label: 'Total artworks', value: artworks?.length ?? 0, icon: <PhotoIcon className="h-5 w-5" />, color: 'text-gallery-600' },
    { label: 'Published', value: publishedCount, icon: <EyeIcon className="h-5 w-5" />, color: 'text-emerald-600' },
    { label: 'Drafts', value: draftCount, icon: <CubeIcon className="h-5 w-5" />, color: 'text-amber-600' },
  ]

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <p className="text-stone-500 mb-4">Please sign in to access your dashboard</p>
        <Link to="/login" className="text-gallery-600 hover:text-gallery-700">
          Sign in →
        </Link>
      </div>
    )
  }

  const quickActions = [
    {
      to: user ? `/dashboard/start-live` : '#',
      label: 'Go Live',
      description: 'Start a live session for your visitors',
      icon: <VideoCameraIcon className="h-6 w-6" />,
      primary: true,
    },
    {
      to: ROUTES.DASHBOARD_UPLOAD,
      label: 'Upload artwork',
      description: 'Add a new piece to your collection',
      icon: <CloudArrowUpIcon className="h-6 w-6" />,
      primary: false,
    },
    {
      to: ROUTES.DASHBOARD_LAYOUT,
      label: 'Edit gallery layout',
      description: 'Arrange your artworks in 3D space',
      icon: <ViewColumnsIcon className="h-6 w-6" />,
      primary: false,
    },
    {
      to: user ? ROUTES.VIRTUAL_GALLERY(user.id) : ROUTES.BROWSE_GALLERIES,
      label: 'Preview your gallery',
      description: 'See it as visitors will',
      icon: <CubeIcon className="h-6 w-6" />,
      primary: false,
    },
  ]

  return (
    <div className="space-y-8">
      {/* Welcome heading */}
      <div className="bg-white rounded-2xl p-6 border border-stone-100 shadow-sm">
        <h1 className="text-2xl font-bold text-stone-800">
          Welcome back{user?.displayName ? `, ${user.displayName}` : ''}
        </h1>
        <p className="text-stone-500 mt-1 text-sm">
          {user?.galleryName
            ? `Managing "${user.galleryName}"`
            : 'Set your gallery name in Profile settings to personalize your space'}
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        {stats.map(stat => (
          <div key={stat.label} className="bg-white border border-stone-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className={`${stat.color} mb-3`}>{stat.icon}</div>
            {isLoading ? (
              <Spinner size="sm" />
            ) : (
              <p className="text-2xl font-bold text-stone-800 tabular-nums">{stat.value}</p>
            )}
            <p className="text-xs text-stone-500 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="text-sm font-semibold text-stone-500 uppercase tracking-wider mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map(action => (
            <Link
              key={action.to}
              to={action.to}
              className={[
                'bg-white border rounded-2xl p-5 flex flex-col gap-3 group transition-all duration-200',
                'hover:-translate-y-0.5 hover:shadow-lg',
                action.primary
                  ? 'border-gallery-300 hover:border-gallery-400'
                  : 'border-stone-100 hover:border-stone-200',
              ].join(' ')}
            >
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center transition-colors
                ${action.primary
                  ? 'bg-gradient-to-br from-gallery-500 to-purple-600 text-white group-hover:shadow-md'
                  : 'bg-stone-100 text-gallery-600 group-hover:bg-stone-200'
                }`}>
                {action.icon}
              </div>
              <div>
                <p className="font-semibold text-stone-800 group-hover:text-gallery-700 transition-colors">
                  {action.label}
                </p>
                <p className="text-xs text-stone-500 mt-0.5">{action.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent artworks preview */}
      {!isLoading && artworks && artworks.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-stone-500 uppercase tracking-wider">
              Recent Artworks
            </h2>
            <Link to={ROUTES.DASHBOARD_ARTWORKS} className="text-xs text-gallery-600 hover:text-gallery-700 font-medium flex items-center gap-1">
              View all
              <ArrowRightIcon className="w-3 h-3" />
            </Link>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
            {artworks.slice(0, 5).map((aw: Artwork) => (
              <Link
                key={aw.id}
                to={`/artwork/${aw.id}`}
                className="relative group aspect-square rounded-xl overflow-hidden bg-stone-100 border border-stone-100 hover:shadow-md transition-all"
              >
                <img
                  src={aw.imageUrl}
                  alt={aw.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/default-artwork.jpg'
                  }}
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors" />
                {!aw.isPublished && (
                  <span className="absolute bottom-2 left-2 px-1.5 py-0.5 rounded-md text-[10px] font-medium
                                   bg-amber-100 text-amber-700 border border-amber-200">
                    Draft
                  </span>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}