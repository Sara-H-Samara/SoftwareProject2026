import axios from 'axios'
import { API_BASE_URL } from '@/utils/constants'
import { refreshTokenRequest } from '@/services/authService'
import { useAuthStore } from '@/store/authStore'

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
})

const isPublicEndpoint = (url?: string): boolean => {
  if (!url) return false
  const publicEndpoints = [
    '/api/auth/login',
    '/api/auth/register',
    '/api/auth/refresh-token',
    '/api/galleries',
    '/api/artworks/search',
  ]
  return publicEndpoints.some(endpoint => url.includes(endpoint))
}

axiosInstance.interceptors.request.use(
  (config) => {
    if (isPublicEndpoint(config.url)) return config
    const { accessToken } = useAuthStore.getState()
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

let isRefreshing = false
let failedQueue: Array<{ resolve: (token: string) => void; reject: (error: unknown) => void }> = []

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error)
    else resolve(token!)
  })
  failedQueue = []
}

axiosInstance.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config

    if (originalRequest._retry || originalRequest.url?.includes('/api/auth/refresh-token')) {
      return Promise.reject(error)
    }

    if (error.response?.status === 401) {
      originalRequest._retry = true

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`
            return axiosInstance(originalRequest)
          })
          .catch((err) => Promise.reject(err))
      }

      isRefreshing = true

      try {
        const { accessToken, refreshToken } = useAuthStore.getState()

        if (!accessToken || !refreshToken) {
          throw new Error('No tokens available')
        }

        const data = await refreshTokenRequest(accessToken, refreshToken)
        useAuthStore.getState().updateTokens(data.accessToken, data.refreshToken)
        processQueue(null, data.accessToken)

        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`
        return axiosInstance(originalRequest)

      } catch (refreshError) {
        processQueue(refreshError, null)
        useAuthStore.getState().logout()
        return Promise.reject(refreshError)

      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)

export default axiosInstance