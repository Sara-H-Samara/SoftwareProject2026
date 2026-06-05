import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { artworksApi } from '@/api/artworks.api'
import { getApiErrorMessage } from '@/utils/helpers'
import type { CreateArtworkRequest, UpdateArtworkRequest, UpdateArtworkPositionRequest } from '@/types'

// ── Query Keys ────────────────────────────────────────────────────────────────
export const artworkKeys = {
  all: ['artworks'] as const,
  mine: () => [...artworkKeys.all, 'mine'] as const,
  detail: (id: string) => [...artworkKeys.all, 'detail', id] as const,
}

// ── Queries ───────────────────────────────────────────────────────────────────

/**
 * FIX #1: كل الـ hooks كانت تستخدم raw fetch() بدل axiosInstance.
 * المشكلة: raw fetch لا يمر بالـ interceptors → لا يوجد token refresh تلقائي.
 * الحل: استخدام artworksApi التي تستخدم axiosInstance مباشرة.
 */

/** All artworks owned by the currently authenticated artist. */
export function useMyArtworks() {
  return useQuery({
    queryKey: artworkKeys.mine(),
    queryFn: () => artworksApi.getMyArtworks(),
    staleTime: 1000 * 60 * 2,
  })
}

/** Single artwork by ID (public if published, or own). */
export function useArtwork(id: string) {
  return useQuery({
    queryKey: artworkKeys.detail(id),
    queryFn: () => artworksApi.getById(id),
    enabled: Boolean(id),
  })
}

// ── Mutations ─────────────────────────────────────────────────────────────────

export function useCreateArtwork() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ data, imageFile }: { data: CreateArtworkRequest; imageFile: File }) =>
      artworksApi.create(data, imageFile),
    onSuccess: (newArtwork) => {
      queryClient.setQueryData(artworkKeys.mine(), (old: typeof newArtwork[] | undefined) =>
        old ? [newArtwork, ...old] : [newArtwork]
      )
      toast.success('Artwork uploaded successfully!')
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, 'Upload failed. Please try again.'))
    },
  })
}

export function useUpdateArtwork() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateArtworkRequest }) =>
      artworksApi.update(id, data),
    onSuccess: (updated) => {
      queryClient.setQueryData(artworkKeys.detail(updated.id), updated)
      queryClient.setQueryData(artworkKeys.mine(), (old: typeof updated[] | undefined) =>
        old?.map(a => (a.id === updated.id ? updated : a))
      )
      toast.success('Artwork updated.')
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, 'Update failed.'))
    },
  })
}

export function useDeleteArtwork() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => artworksApi.delete(id).then(() => id),
    onSuccess: (deletedId) => {
      queryClient.setQueryData(artworkKeys.mine(), (old: { id: string }[] | undefined) =>
        old?.filter(a => a.id !== deletedId)
      )
      queryClient.removeQueries({ queryKey: artworkKeys.detail(deletedId) })
      toast.success('Artwork deleted.')
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, 'Delete failed.'))
    },
  })
}

export function useBulkUpdatePositions() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (positions: UpdateArtworkPositionRequest[]) =>
      artworksApi.bulkUpdatePositions(positions),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: artworkKeys.mine() })
      toast.success('Gallery layout saved!')
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, 'Failed to save layout.'))
    },
  })
}

export function useUpdateArtworkImage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, file }: { id: string; file: File }) =>
      artworksApi.updateImage(id, file),
    onSuccess: (updated) => {
      queryClient.setQueryData(artworkKeys.detail(updated.id), updated)
      queryClient.invalidateQueries({ queryKey: artworkKeys.mine() })
      toast.success('Artwork image replaced.')
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, 'Image upload failed.'))
    },
  })
}