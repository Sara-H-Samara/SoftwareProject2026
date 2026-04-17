import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import Toast from 'react-native-toast-message'
import { getApiErrorMessage } from '@/utils/helpers'
import { useAuthStore } from '@/store/authStore'
import type { CreateArtworkRequest, UpdateArtworkRequest, UpdateArtworkPositionRequest } from '@/types'

// Helper to get API base URL from Expo environment variables
const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:3000'

// ── Query Keys ────────────────────────────────────────────────────────────────
export const artworkKeys = {
  all: ['artworks'] as const,
  mine: () => [...artworkKeys.all, 'mine'] as const,
  detail: (id: string) => [...artworkKeys.all, 'detail', id] as const,
}

// ── Queries ───────────────────────────────────────────────────────────────────

/** All artworks owned by the currently authenticated artist. */
export function useMyArtworks() {
  const { accessToken } = useAuthStore()
  
  return useQuery({
    queryKey: artworkKeys.mine(),
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/api/artworks/my`, {
        headers: {
          'Authorization': accessToken ? `Bearer ${accessToken}` : ''
        }
      })
      if (!response.ok) throw new Error('Failed to fetch artworks')
      return response.json()
    },
    staleTime: 1000 * 60 * 2,
    enabled: !!accessToken  
  })
}

/** Single artwork by ID (public if published, or own). */
export function useArtwork(id: string) {
  const { accessToken } = useAuthStore()
  
  return useQuery({
    queryKey: artworkKeys.detail(id),
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/api/artworks/${id}`, {
        headers: {
          'Authorization': accessToken ? `Bearer ${accessToken}` : ''
        }
      })
      if (!response.ok) throw new Error('Failed to fetch artwork')
      return response.json()
    },
    enabled: Boolean(id),
  })
}

// ── Mutations ─────────────────────────────────────────────────────────────────

export function useCreateArtwork() {
  const queryClient = useQueryClient()
  const { accessToken } = useAuthStore()

  return useMutation({
    mutationFn: async ({ data, imageFile }: { data: CreateArtworkRequest; imageFile: File }) => {
      console.log('Token being sent:', accessToken)
      console.log('Token exists:', !!accessToken)
      
      if (!accessToken) {
        Toast.show({ type: 'error', text1: 'Please sign in again' })
        throw new Error('No access token')
      }
      
      const formData = new FormData()
      
      formData.append('title', data.title)
      formData.append('artworkType', data.artworkType)
      if (data.description) formData.append('description', data.description)
      if (data.materials) formData.append('materials', data.materials)
      if (data.dimensions) formData.append('dimensions', data.dimensions)
      if (data.year) formData.append('year', data.year.toString())
      if (data.price) formData.append('price', data.price.toString())
      
      formData.append('imageFile', imageFile)

      console.log('📤 Sending FormData:')
      for (let pair of formData.entries()) {
        if (pair[0] === 'imageFile') {
          console.log(`  ${pair[0]}: [File: ${(pair[1] as File).name}, Size: ${(pair[1] as File).size} bytes]`)
        } else {
          console.log(`  ${pair[0]}: ${pair[1]}`)
        }
      }

      const response = await fetch(`${API_BASE_URL}/api/artworks`, {
        method: 'POST',
        headers: {
          'Authorization': accessToken ? `Bearer ${accessToken}` : ''
        },
        body: formData
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('❌ Server response:', {
          status: response.status,
          statusText: response.statusText,
          errorData
        })
        
        if (errorData.errors) {
          console.error('📋 Validation errors:', errorData.errors)
          let errorMessage = 'Validation failed:\n'
          for (const [field, messages] of Object.entries(errorData.errors)) {
            errorMessage += `- ${field}: ${(messages as string[]).join(', ')}\n`
          }
          throw new Error(errorMessage)
        }
        
        if (errorData.title) {
          console.error('📋 Error title:', errorData.title)
          throw new Error(errorData.title)
        }
        
        throw new Error(errorData.message || errorData.title || 'Upload failed')
      }

      return response.json()
    },
    onSuccess: (newArtwork) => {
      queryClient.setQueryData(artworkKeys.mine(), (old: any[] | undefined) => {
        return old ? [newArtwork, ...old] : [newArtwork]
      })
      Toast.show({ type: 'success', text1: 'Artwork uploaded successfully!' })
    },
    onError: (error) => {
      console.error('❌ Mutation error:', error)
      Toast.show({ type: 'error', text1: getApiErrorMessage(error, 'Upload failed. Please try again.') })
    },
  })
}

export function useUpdateArtwork() {
  const queryClient = useQueryClient()
  const { accessToken } = useAuthStore()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateArtworkRequest }) => {
      const response = await fetch(`${API_BASE_URL}/api/artworks/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': accessToken ? `Bearer ${accessToken}` : '',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || 'Update failed')
      }

      return response.json()
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(artworkKeys.detail(updated.id), updated)
      queryClient.setQueryData(artworkKeys.mine(), (old: any[] | undefined) => {
        return old?.map(a => (a.id === updated.id ? updated : a))
      })
      Toast.show({ type: 'success', text1: 'Artwork updated.' })
    },
    onError: (error) => {
      Toast.show({ type: 'error', text1: getApiErrorMessage(error, 'Update failed.') })
    },
  })
}

export function useDeleteArtwork() {
  const queryClient = useQueryClient()
  const { accessToken } = useAuthStore()

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`${API_BASE_URL}/api/artworks/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': accessToken ? `Bearer ${accessToken}` : ''
        }
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || 'Delete failed')
      }

      return id
    },
    onSuccess: (deletedId) => {
      queryClient.setQueryData(artworkKeys.mine(), (old: any[] | undefined) => {
        return old?.filter(a => a.id !== deletedId)
      })
      queryClient.removeQueries({ queryKey: artworkKeys.detail(deletedId) })
      Toast.show({ type: 'success', text1: 'Artwork deleted.' })
    },
    onError: (error) => {
      Toast.show({ type: 'error', text1: getApiErrorMessage(error, 'Delete failed.') })
    },
  })
}

export function useBulkUpdatePositions() {
  const queryClient = useQueryClient()
  const { accessToken } = useAuthStore()

  return useMutation({
    mutationFn: async (positions: UpdateArtworkPositionRequest[]) => {
      console.log('📤 Sending positions to save:', JSON.stringify(positions, null, 2))
      
      const response = await fetch(`${API_BASE_URL}/api/artworks/positions`, {
        method: 'POST',
        headers: {
          'Authorization': accessToken ? `Bearer ${accessToken}` : '',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(positions)
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('❌ Save failed:', {
          status: response.status,
          statusText: response.statusText,
          errorData
        })
        throw new Error(errorData.message || 'Failed to save layout')
      }

      if (response.status === 204 || response.headers.get('content-length') === '0') {
        console.log('✅ Save successful (no content)')
        return { success: true }
      }

      const text = await response.text()
      if (!text) {
        console.log('✅ Save successful (empty response)')
        return { success: true }
      }

      try {
        const result = JSON.parse(text)
        console.log('✅ Save successful:', result)
        return result
      } catch (e) {
        console.log('✅ Save successful (non-JSON response):', text)
        return { success: true, message: text }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: artworkKeys.mine() })
      Toast.show({ type: 'success', text1: 'Gallery layout saved!' })
    },
    onError: (error) => {
      console.error('❌ Mutation error:', error)
      Toast.show({ type: 'error', text1: getApiErrorMessage(error, 'Failed to save layout.') })
    },
  })
}

export function useUpdateArtworkImage() {
  const queryClient = useQueryClient()
  const { accessToken } = useAuthStore()

  return useMutation({
    mutationFn: async ({ id, file }: { id: string; file: File }) => {
      const formData = new FormData()
      formData.append('image', file)

      const response = await fetch(`${API_BASE_URL}/api/artworks/${id}/image`, {
        method: 'PUT',
        headers: {
          'Authorization': accessToken ? `Bearer ${accessToken}` : ''
        },
        body: formData
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || 'Image update failed')
      }

      return response.json()
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(artworkKeys.detail(updated.id), updated)
      queryClient.invalidateQueries({ queryKey: artworkKeys.mine() })
      Toast.show({ type: 'success', text1: 'Artwork image replaced.' })
    },
    onError: (error) => {
      Toast.show({ type: 'error', text1: getApiErrorMessage(error, 'Image upload failed.') })
    },
  })
}