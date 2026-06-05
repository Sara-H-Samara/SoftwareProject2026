// src/api/avatar.api.ts
import api from './axiosInstance'
import type { Avatar, UpdateAvatarRequest } from '@/types/avatar'

export const avatarApi = {
  getMine: () =>
    api.get<Avatar>('/api/avatars/me').then(r => r.data),

  upsertMine: (data: UpdateAvatarRequest) =>
    api.put<Avatar>('/api/avatars/me', data).then(r => r.data),

  getByUser: (userId: string) =>
    api.get<Avatar>(`/api/avatars/user/${userId}`).then(r => r.data),
}