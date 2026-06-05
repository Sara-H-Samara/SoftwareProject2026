import { Link, NavLink } from 'react-router-dom'
import { Menu, Transition } from '@headlessui/react'
import { Fragment, useState, useEffect } from 'react'
import { ShoppingCartIcon } from '@heroicons/react/24/outline'
import { useCartStore } from '@/store/cartStore'
import {
  UserCircleIcon,
  Squares2X2Icon,
  PhotoIcon,
  ArrowRightStartOnRectangleIcon,
  ChevronDownIcon,
  MagnifyingGlassIcon,
  HomeIcon,
} from '@heroicons/react/24/outline'
import { useAuthStore } from '@/store/authStore'
import { useLogout } from '@/hooks/useAuth'
import { ROUTES, APP_NAME } from '@/utils/constants'
import { getInitials } from '@/utils/helpers'
import Button from '@/components/common/Button'
import NotificationsDropdown from '@/components/notifications/NotificationsDropdown'


export default function Navbar() {
  const { isAuthenticated, user, isArtist } = useAuthStore()
  const logout = useLogout()
  const [imageError, setImageError] = useState(false)
  const cartCount = useCartStore((state) => state.totalItems)

  useEffect(() => {
    setImageError(false)
  }, [user])

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `text-sm font-medium transition-all duration-200 px-3 py-1.5 rounded-lg ${
      isActive
        ? 'text-gallery-600 bg-gallery-50'
        : 'text-stone-500 hover:text-stone-900 hover:bg-stone-50'
    }`

  const getImageUrl = (url: string | undefined) => {
    if (!url || url.includes('default-avatar') || url.includes('yourstorage.blob.core.windows.net')) {
      return '/default-avatar.jpg'
    }
    if (url.startsWith('http')) return url
    if (url.startsWith('/')) return `${import.meta.env.VITE_API_BASE_URL}${url}`
    return `${import.meta.env.VITE_API_BASE_URL}/${url}`
  }

  return (
    <header className="fixed top-0 inset-x-0 z-50 bg-white/90 backdrop-blur-md border-b border-stone-200 shadow-sm">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link
          to={ROUTES.HOME}
          className="flex items-center gap-2.5 group focus:outline-none rounded-lg transition-all"
        >
          <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-gradient-to-br from-gallery-500 to-purple-600 shadow-md group-hover:shadow-lg transition-all">
            <span className="text-white font-bold text-sm">V</span>
          </div>
          <span className="font-semibold text-stone-800 hidden sm:block text-lg tracking-tight">
            {APP_NAME}
          </span>
        </Link>

        {/* Navigation Links - Only show for authenticated users or public pages */}
        <div className="flex items-center gap-0.5">
          <NavLink to={ROUTES.HOME} className={navLinkClass}>
            <HomeIcon className="w-4 h-4 sm:hidden" />
            <span className="hidden sm:inline">Home</span>
          </NavLink>

           <NavLink 
            to="/live" 
            className={({ isActive }) => 
              `relative ${navLinkClass({ isActive })}` 
            }
          >
        
          </NavLink>

          <NavLink to={ROUTES.BROWSE_GALLERIES} className={navLinkClass}>
            <span>Galleries</span>
          </NavLink>
          <NavLink to="/search" className={navLinkClass}>
            <MagnifyingGlassIcon className="w-4 h-4 sm:hidden" />
            <span className="hidden sm:inline">Search</span>
          </NavLink>
          <NavLink to="/activity" className={navLinkClass}>
            <span>Activity</span>
          </NavLink>
          {/* ✅ Only show Studio link if user is authenticated AND is an artist */}
          {isAuthenticated && isArtist && (
            <NavLink to={ROUTES.DASHBOARD} className={navLinkClass}>
              <span>Studio</span>
            </NavLink>
          )}
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center gap-1">
          {/* ✅ Only show notifications dropdown for authenticated users */}
          {isAuthenticated && <NotificationsDropdown />}
          
          {/* Cart Button - Show for all users, but will redirect to login if not authenticated */}
          <Link
            to="/cart"
            className="relative p-2 rounded-full text-stone-500 hover:text-gallery-600 hover:bg-stone-50 transition-all"
            aria-label="Shopping cart"
          >
            <ShoppingCartIcon className="w-5 h-5" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-gallery-600 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-sm">
                {cartCount > 99 ? '99+' : cartCount}
              </span>
            )}
          </Link>

          {/* Auth Section */}
          {!isAuthenticated ? (
            <div className="flex items-center gap-2 ml-1">
              <Link to={ROUTES.LOGIN}>
                <Button variant="ghost" size="sm" className="rounded-full text-stone-600 hover:text-stone-900">
                  Sign in
                </Button>
              </Link>
              <Link to={ROUTES.REGISTER}>
                <Button size="sm" className="rounded-full bg-gradient-to-r from-gallery-500 to-purple-600 text-white shadow-sm hover:shadow-md transition-all">
                  Get started
                </Button>
              </Link>
            </div>
          ) : (
            <Menu as="div" className="relative ml-1">
              <Menu.Button className="flex items-center gap-2 px-2 py-1.5 rounded-full hover:bg-stone-100 transition-all focus:outline-none focus:ring-2 focus:ring-gallery-500">
                {user?.profilePicUrl && !imageError ? (
                  <img
                    src={getImageUrl(user.profilePicUrl)}
                    alt={user.displayName ?? 'Profile'}
                    className="w-8 h-8 rounded-full object-cover object-center ring-2 ring-gallery-200"
                    onError={() => setImageError(true)}
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gallery-400 to-purple-500 flex items-center justify-center text-xs font-bold text-white shadow-sm">
                    {getInitials(user?.displayName || user?.email || 'U')}
                  </div>
                )}
                <span className="text-sm font-medium text-stone-700 hidden md:block max-w-[100px] truncate">
                  {user?.displayName ?? user?.email?.split('@')[0]}
                </span>
                <ChevronDownIcon className="h-3.5 w-3.5 text-stone-400" />
              </Menu.Button>

              <Transition
                as={Fragment}
                enter="transition ease-out duration-150"
                enterFrom="opacity-0 translate-y-1"
                enterTo="opacity-100 translate-y-0"
                leave="transition ease-in duration-100"
                leaveFrom="opacity-100 translate-y-0"
                leaveTo="opacity-0 translate-y-1"
              >
                <Menu.Items className="absolute right-0 mt-2 w-64 bg-white rounded-2xl border border-stone-200 shadow-xl py-1 focus:outline-none overflow-hidden">
                  <div className="px-4 py-3 border-b border-stone-100">
                    <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider">
                      Signed in as
                    </p>
                    <p className="text-sm font-semibold text-stone-800 truncate mt-0.5">
                      {user?.displayName || user?.email}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-gallery-100 text-gallery-700 border border-gallery-200">
                        {user?.userType === 'Artist' ? '🎨 Artist' : '👤 Visitor'}
                      </span>
                    </div>
                  </div>

                  <div className="py-1">
                    {isArtist && (
                      <>
                        <DropdownItem to={ROUTES.DASHBOARD} icon={<Squares2X2Icon className="h-4 w-4" />}>
                          Dashboard
                        </DropdownItem>
                        <DropdownItem to={ROUTES.DASHBOARD_ARTWORKS} icon={<PhotoIcon className="h-4 w-4" />}>
                          My Artworks
                        </DropdownItem>
                      </>
                    )}
                    <DropdownItem 
                      to={isArtist ? ROUTES.DASHBOARD_PROFILE : '/visitor/profile'} 
                      icon={<UserCircleIcon className="h-4 w-4" />}
                    >
                      My Profile
                    </DropdownItem>
                    <DropdownItem to="/orders" icon={<ShoppingCartIcon className="h-4 w-4" />}>
                      Order History
                    </DropdownItem>
                  </div>

                  <div className="border-t border-stone-100 mt-1 pt-1">
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          onClick={() => logout()}
                          className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-red-600 transition-colors ${
                            active ? 'bg-red-50' : ''
                          }`}
                        >
                          <ArrowRightStartOnRectangleIcon className="h-4 w-4" />
                          Sign out
                        </button>
                      )}
                    </Menu.Item>
                  </div>
                </Menu.Items>
              </Transition>
            </Menu>
          )}
        </div>
      </nav>
    </header>
  )
}

function DropdownItem({
  to,
  icon,
  children,
}: {
  to: string
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <Menu.Item>
      {({ active }) => (
        <Link
          to={to}
          className={`flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium transition-colors ${
            active ? 'bg-stone-50 text-gallery-600' : 'text-stone-600'
          }`}
        >
          <span className={`${active ? 'text-gallery-500' : 'text-stone-400'}`}>{icon}</span>
          {children}
        </Link>
      )}
    </Menu.Item>
  )
}