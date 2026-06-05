import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { UserProfile } from '@/types'

interface AuthState {
  user: UserProfile | null
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  isArtist: boolean
  tokenExpiryTimer: ReturnType<typeof setTimeout> | null

  setAuth: (user: UserProfile, accessToken: string, refreshToken: string) => void
  updateUser: (user: UserProfile) => void
  updateTokens: (accessToken: string, refreshToken: string) => void
  clearAuth: () => void
  logout: () => void
  scheduleTokenExpiryCheck: () => void
}

const isTokenExpired = (token: string): boolean => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return Date.now() >= payload.exp * 1000
  } catch {
    return true
  }
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isArtist: false,
      tokenExpiryTimer: null,

      setAuth: (user, accessToken, refreshToken) => {
        const oldTimer = get().tokenExpiryTimer
        if (oldTimer) clearTimeout(oldTimer)
        set({ user, accessToken, refreshToken, isAuthenticated: true, isArtist: user.userType === 'Artist' })
        get().scheduleTokenExpiryCheck()
      },

      updateUser: (user) => {
        set({ user, isArtist: user.userType === 'Artist' })
      },

      updateTokens: (accessToken, refreshToken) => {
        const oldTimer = get().tokenExpiryTimer
        if (oldTimer) clearTimeout(oldTimer)
        set({ accessToken, refreshToken, isAuthenticated: true })
        get().scheduleTokenExpiryCheck()
      },

      clearAuth: () => {
        const timer = get().tokenExpiryTimer
        if (timer) clearTimeout(timer)
        set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false, isArtist: false, tokenExpiryTimer: null })
      },

      logout: () => {
        const timer = get().tokenExpiryTimer
        if (timer) clearTimeout(timer)
        set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false, isArtist: false, tokenExpiryTimer: null })
      },

      scheduleTokenExpiryCheck: () => {
        const { accessToken } = get()
        if (!accessToken) return
        try {
          const payload = JSON.parse(atob(accessToken.split('.')[1]))
          const timeUntilExpiry = payload.exp * 1000 - Date.now()
          if (timeUntilExpiry <= 0) { get().logout(); return }
          const timer = setTimeout(() => {
            if (isTokenExpired(get().accessToken ?? '')) get().logout()
          }, timeUntilExpiry - 1000)
          set({ tokenExpiryTimer: timer })
        } catch {
          
        }
      },
    }),
    {
      name: 'auth-storage',

      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
        isArtist: state.isArtist,
      }),
    }
  )
)