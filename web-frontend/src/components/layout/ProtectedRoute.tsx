import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { ROUTES } from '@/utils/constants'
import { useEffect, useState } from 'react'

interface ProtectedRouteProps {
  requireArtist?: boolean
}

export default function ProtectedRoute({ requireArtist = false }: ProtectedRouteProps) {
  const { isAuthenticated, isArtist } = useAuthStore()
  const location = useLocation()
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      await new Promise(resolve => setTimeout(resolve, 100))
      setIsChecking(false)
    }
    checkAuth()
  }, [])

  if (isChecking) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-8 h-8 border-2 border-gallery-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }


  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />
  }

  if (requireArtist && !isArtist) {
    return <Navigate to={ROUTES.BROWSE_GALLERIES} replace />
  }

  return <Outlet />
}