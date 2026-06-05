// src/services/authService.ts
import axios from 'axios'
import { API_BASE_URL } from '@/utils/constants'
import { useAuthStore } from '@/store/authStore'

// refresh
export const refreshTokenRequest = async (
  accessToken: string,
  refreshToken: string
) => {
  const res = await axios.post(`${API_BASE_URL}/api/auth/refresh-token`, {
    accessToken,
    refreshToken,
  })
  return res.data
}

export const silentLogin = async () => {
  try {
    const { accessToken, refreshToken, setAuth } = useAuthStore.getState()

    if (!accessToken || !refreshToken) {
      console.log('No tokens found, skipping silent login')
      return null
    }

    const data = await refreshTokenRequest(accessToken, refreshToken)

    setAuth(data.user, data.accessToken, data.refreshToken)

    return data
  } catch (err) {
    console.error('Silent login failed:', err)
    
    const error = err as any
    if (error.response?.status === 401) {
      useAuthStore.getState().logout()
      window.location.href = '/login?session=expired'
    }
    
    return null
  }
}