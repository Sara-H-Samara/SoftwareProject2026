import api from './axiosInstance'
import type {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  UpdateProfileRequest,
  UserProfile,
} from '@/types'

export const authApi = {
  register: (data: RegisterRequest) =>
    api.post<AuthResponse>('/api/auth/register', data).then(r => r.data),

  login: (data: LoginRequest) =>
    api.post<AuthResponse>('/api/auth/login', data).then(r => r.data),

  refreshToken: (accessToken: string, refreshToken: string) =>
    api.post<AuthResponse>('/api/auth/refresh-token', { accessToken, refreshToken }).then(r => r.data),

  getProfile: () =>
    api.get<UserProfile>('/api/auth/profile').then(r => r.data),

  updateProfile: (data: UpdateProfileRequest) =>
    api.put<UserProfile>('/api/auth/profile', data).then(r => r.data),

  updateProfilePicture: (file: File) => {
    const form = new FormData()
    form.append('file', file)
    return api.post<UserProfile>('/api/auth/profile/picture', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(r => r.data)
  },

  forgotPassword: (email: string) =>
    api.post('/api/auth/forgot-password', { email }),

  resetPassword: (email: string, token: string, newPassword: string) =>
    api.post('/api/auth/reset-password', { email, token, newPassword }),
}
