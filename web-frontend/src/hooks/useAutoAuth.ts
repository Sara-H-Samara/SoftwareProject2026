// src/hooks/useAutoAuth.ts
import { useEffect, useState } from 'react'
import { silentLogin } from '@/services/authService'
import { useAuthStore } from '@/store/authStore'

export const useAutoAuth = () => {
  const [isLoading, setIsLoading] = useState(true)
  const { isAuthenticated, accessToken, logout } = useAuthStore()

  useEffect(() => {
    let isMounted = true

    const run = async () => {
      try {
        if (accessToken) {
          try {
            const payload = JSON.parse(atob(accessToken.split('.')[1]))
            const expiryTime = payload.exp * 1000
            if (Date.now() >= expiryTime) {
              logout()
              if (isMounted) setIsLoading(false)
              return
            }
          } catch {
            logout()
            if (isMounted) setIsLoading(false)
            return
          }
        }

        if (accessToken && !isAuthenticated) {
          await silentLogin()
        }
      } catch (error) {
        console.error('Auto auth error:', error)
        logout()
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    run()

    return () => {
      isMounted = false
    }
  }, [accessToken, isAuthenticated, logout])

  return { isLoading }
}