import api from './axiosInstance'
import type { Avatar, UpdateAvatarRequest } from '@/types'

export const avatarApi = {
  getMine: () =>
    api.get<Avatar>('/api/avatars/me').then(r => r.data),

  upsertMine: (data: UpdateAvatarRequest) =>
    api.put<Avatar>('/api/avatars/me', data).then(r => r.data),

  getByUser: (userId: string) =>
    api.get<Avatar>(`/api/avatars/user/${userId}`).then(r => r.data),
}
