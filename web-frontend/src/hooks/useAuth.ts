import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { authApi } from '@/api/auth.api'
import { useAuthStore } from '@/store/authStore'
import { useCartStore } from '@/store/cartStore'
import { getApiErrorMessage } from '@/utils/helpers'
import { ROUTES } from '@/utils/constants'
import type { LoginRequest, RegisterRequest, UpdateProfileRequest } from '@/types'

// ── Query Keys ────────────────────────────────────────────────────────────────
export const authKeys = {
  profile: ['auth', 'profile'] as const,
}

// ── Login ─────────────────────────────────────────────────────────────────────
export function useLogin() {
  const { setAuth } = useAuthStore()
  const navigate = useNavigate()

  return useMutation({
    mutationFn: (data: LoginRequest) => authApi.login(data),
    onSuccess: (response) => {
      setAuth(response.user, response.accessToken, response.refreshToken)
      
      const syncCart = useCartStore.getState().syncWithUser
      syncCart()
      
      toast.success(`Welcome back, ${response.user.displayName ?? response.user.email}!`)
      
      if (response.user.userType === 'Artist') {
        navigate(ROUTES.DASHBOARD, { replace: true })
      } else {
        navigate(ROUTES.BROWSE_GALLERIES, { replace: true })
      }
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, 'Invalid email or password.'))
    },
  })
}

// ── Register ──────────────────────────────────────────────────────────────────
export function useRegister() {
  const { setAuth } = useAuthStore()
  const navigate = useNavigate()

  return useMutation({
    mutationFn: (data: RegisterRequest) => authApi.register(data),
    onSuccess: (response) => {
      setAuth(response.user, response.accessToken, response.refreshToken)
      toast.success('Account created! Welcome to Virtual Art Gallery.')
      
      if (response.user.userType === 'Artist') {
        navigate(ROUTES.DASHBOARD, { replace: true })
      } else {
        navigate(ROUTES.BROWSE_GALLERIES, { replace: true })
      }
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, 'Registration failed. Please try again.'))
    },
  })
}

// ── Profile ───────────────────────────────────────────────────────────────────
export function useProfile() {
  const { isAuthenticated } = useAuthStore()

  return useQuery({
    queryKey: authKeys.profile,
    queryFn: authApi.getProfile,
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 10,
    retry: false,
  })
}

export function useUpdateProfile() {
  const { updateUser } = useAuthStore()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: UpdateProfileRequest) => authApi.updateProfile(data),
    onSuccess: (updatedUser) => {
      updateUser(updatedUser)
      queryClient.setQueryData(authKeys.profile, updatedUser)
      toast.success('Profile updated.')
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, 'Failed to update profile.'))
    },
  })
}

export function useUpdateProfilePicture() {
  const { updateUser } = useAuthStore()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (file: File) => authApi.updateProfilePicture(file),
    onSuccess: (updatedUser) => {
      updateUser(updatedUser)
      queryClient.setQueryData(authKeys.profile, updatedUser)
      toast.success('Profile picture updated.')
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, 'Failed to upload picture.'))
    },
  })
}

// ── Logout ────────────────────────────────────────────────────────────────────
export function useLogout() {
  const { clearAuth } = useAuthStore()
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  return () => {
    clearAuth()
    queryClient.clear()
    localStorage.removeItem('auth-storage')
    localStorage.removeItem('cart-storage')
    navigate(ROUTES.HOME, { replace: true })
    toast.success('Signed out.')
  }
}

// ── Forgot / Reset Password ───────────────────────────────────────────────────
export function useForgotPassword() {
  return useMutation({
    mutationFn: (email: string) => authApi.forgotPassword(email),
    onSuccess: () => {
      toast.success('If that email exists, a reset link has been sent.')
    },
    onError: () => {
      toast.success('If that email exists, a reset link has been sent.')
    },
  })
}

export function useResetPassword() {
  const navigate = useNavigate()

  return useMutation({
    mutationFn: ({ email, token, newPassword }: { email: string; token: string; newPassword: string }) =>
      authApi.resetPassword(email, token, newPassword),
    onSuccess: () => {
      toast.success('Password reset! Please sign in.')
      navigate(ROUTES.LOGIN, { replace: true })
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, 'Reset failed. The link may have expired.'))
    },
  })
}