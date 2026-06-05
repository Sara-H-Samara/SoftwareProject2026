import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useEffect, useState } from 'react' 

// Layout & guards
import Navbar from '@/components/layout/Navbar'
import ProtectedRoute from '@/components/layout/ProtectedRoute'
import Breadcrumb from '@/components/common/Breadcrumb'

// Pages
import HomePage from '@/pages/HomePage'
import LoginPage from '@/pages/Auth/LoginPage'
import RegisterPage from '@/pages/Auth/RegisterPage'
import { ForgotPasswordPage, ResetPasswordPage } from '@/pages/Auth/PasswordPages'
import BrowseGalleriesPage from '@/pages/BrowseGalleriesPage'
import GalleryLandingPage from '@/pages/GalleryLandingPage'
import VirtualGalleryPage from '@/pages/VirtualGalleryPage'
import ArtworkDetailsPage from '@/pages/ArtworkDetailsPage'
import NotificationsPage from '@/pages/NotificationsPage'
import VisitorProfilePage from '@/pages/VisitorProfilePage'
import SearchPage from '@/pages/SearchPage'
import ActivityFeedPage from '@/pages/ActivityFeedPage'
import CartPage from '@/pages/CartPage'
import CheckoutPage from '@/pages/CheckoutPage'
import CheckoutSuccessPage from '@/pages/CheckoutSuccessPage'
import OrderHistoryPage from '@/pages/OrderHistoryPage'
import OrderDetailsPage from '@/pages/OrderDetailsPage'
import LeaderboardPage from '@/pages/LeaderboardPage'
import GalleryStudioProPage from '@/pages/ArtistDashboard/GalleryStudioProPage'
import LiveGalleryPage from '@/pages/LiveGalleryPage'

// Artist dashboard
import DashboardLayout from '@/pages/ArtistDashboard/DashboardLayout'
import DashboardOverviewPage from '@/pages/ArtistDashboard/DashboardOverviewPage'
import MyArtworksPage from '@/pages/ArtistDashboard/MyArtworksPage'
import UploadArtworkPage from '@/pages/ArtistDashboard/UploadArtworkPage'
import GalleryLayoutEditorPage from '@/pages/ArtistDashboard/GalleryLayoutEditorPage'
import ProfilePage from '@/pages/ArtistDashboard/ProfilePage'
import AnalyticsPage from '@/pages/ArtistDashboard/AnalyticsPage'

import { ROUTES } from '@/utils/constants'
import CollectionDetailsPage from './pages/CollectionDetailsPage'
import CollectionsPage from './pages/CollectionsPage'
import NotificationSettingsPage from './pages/NotificationSettingsPage'
import { useAutoAuth } from './hooks/useAutoAuth'
import StartLivePage from './pages/ArtistDashboard/StartLivePage'
import AvatarSetupPage from './pages/Auth/AvatarSetupPage'

function LoadingScreen() {
  return (
    <div className="fixed inset-0 bg-stone-50 flex items-center justify-center z-50">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-gallery-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-stone-500">Loading...</p>
      </div>
    </div>
  )
}

export default function App() {
  const { isLoading } = useAutoAuth()  
  const [isInitialLoad, setIsInitialLoad] = useState(true)

  useEffect(() => {
    if (!isLoading) {
      const timer = setTimeout(() => setIsInitialLoad(false), 500)
      return () => clearTimeout(timer)
    }
  }, [isLoading])

  if (isInitialLoad) return <LoadingScreen />

  return (
    <BrowserRouter
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#1a1a24', color: '#fff',
            border: '1px solid #2a2a3a', fontSize: '14px', borderRadius: '12px',
          },
          success: { iconTheme: { primary: '#8b5cf6', secondary: '#fff' } },
          error:   { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
        }}
      />

      <Routes>
        {/* ── Live auction — full-screen, no navbar ─────────────────────── */}
        <Route path="/live/join/:inviteCode" element={<LiveGalleryPage />} />
        <Route path="/live/join"             element={<LiveGalleryPage />} />

        {/* ── Standard layout ───────────────────────────────────────────── */}
        <Route element={<NavbarLayout />}>
          {/* Public */}
          <Route path={ROUTES.HOME}            element={<HomePage />} />
          <Route path={ROUTES.LOGIN}           element={<LoginPage />} />
          <Route path={ROUTES.REGISTER}        element={<RegisterPage />} />
          <Route path="/avatar-setup"          element={<AvatarSetupPage />} />
          <Route path={ROUTES.FORGOT_PASSWORD} element={<ForgotPasswordPage />} />
          <Route path={ROUTES.RESET_PASSWORD}  element={<ResetPasswordPage />} />
          <Route path={ROUTES.BROWSE_GALLERIES}element={<BrowseGalleriesPage />} />
          <Route path="/galleries/:artistId"   element={<GalleryLandingPage />} />
          <Route path="/artwork/:id"           element={<ArtworkDetailsPage />} />
          <Route path="/search"                element={<SearchPage />} />
          <Route path="/activity"              element={<ActivityFeedPage />} />

          {/* Protected */}
          <Route element={<ProtectedRoute />}>
            <Route path="/notifications"              element={<NotificationsPage />} />
            <Route path="/visitor/profile"            element={<VisitorProfilePage />} />
            <Route path="/cart"                       element={<CartPage />} />
            <Route path="/checkout"                   element={<CheckoutPage />} />
            <Route path="/checkout/success"           element={<CheckoutSuccessPage />} />
            <Route path="/orders"                     element={<OrderHistoryPage />} />
            <Route path="/orders/:id"                 element={<OrderDetailsPage />} />
            <Route path="/collections"                element={<CollectionsPage />} />
            <Route path="/collections/:id"            element={<CollectionDetailsPage />} />
            <Route path="/settings/notifications"     element={<NotificationSettingsPage />} />
            <Route path="/leaderboard"                element={<LeaderboardPage />} />
          </Route>

          {/* Artist-only */}
          <Route element={<ProtectedRoute requireArtist />}>
            <Route path="/dashboard" element={<DashboardLayout />}>
              <Route index                element={<DashboardOverviewPage />} />
              <Route path="artworks"      element={<MyArtworksPage />} />
              <Route path="upload"        element={<UploadArtworkPage />} />
              <Route path="layout"        element={<GalleryLayoutEditorPage />} />
              <Route path="profile"       element={<ProfilePage />} />
              <Route path="analytics"     element={<AnalyticsPage />} />
              <Route path="studio-pro"    element={<GalleryStudioProPage />} />
              <Route path="start-live"    element={<StartLivePage />} />
            </Route>
          </Route>

          {/* 3D gallery — public */}
          <Route path="/galleries/:artistId/3d" element={<VirtualGalleryPage />} />

          {/* 404 */}
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

function NavbarLayout() {
  const location = useLocation()
  const isAvatarSetupPage = location.pathname === '/avatar-setup'
  const isHomePage        = location.pathname === '/'
  return (
    <>
      {!isAvatarSetupPage && <Navbar />}
      <main className={`${!isAvatarSetupPage ? 'pt-16' : ''} min-h-screen bg-stone-50`}>
        {!isHomePage && !isAvatarSetupPage && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <Breadcrumb />
          </div>
        )}
        <Outlet />
      </main>
    </>
  )
}

function NotFoundPage() {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center gap-4 text-center px-4">
      <p className="text-8xl font-display font-bold text-gallery-900 select-none">404</p>
      <h1 className="text-2xl font-semibold text-stone-800">Page not found</h1>
      <p className="text-stone-500 text-sm max-w-xs">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <Navigate to={ROUTES.HOME} replace />
    </div>
  )
}