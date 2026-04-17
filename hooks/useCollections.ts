import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import { collectionsApi } from '@/api/collections.api';
import type { CreateCollectionRequest, UpdateCollectionRequest, AddToCollectionRequest } from '@/types';

export const collectionKeys = {
  all: ['collections'] as const,
  list: () => [...collectionKeys.all, 'list'] as const,
  detail: (id: string) => [...collectionKeys.all, 'detail', id] as const,
};

export function useMyCollections() {
  return useQuery({
    queryKey: collectionKeys.list(),
    queryFn: () => collectionsApi.getMyCollections(),
    staleTime: 1000 * 60,
  });
}

export function useCollection(collectionId: string) {
  return useQuery({
    queryKey: collectionKeys.detail(collectionId),
    queryFn: () => collectionsApi.getCollection(collectionId),
    enabled: Boolean(collectionId),
  });
}

export function useCreateCollection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCollectionRequest) => collectionsApi.createCollection(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: collectionKeys.list() });
      Toast.show({ type: 'success', text1: 'Collection created!' });
    },
    onError: () => Toast.show({ type: 'error', text1: 'Failed to create collection' }),
  });
}

export function useUpdateCollection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ collectionId, data }: { collectionId: string; data: UpdateCollectionRequest }) =>
      collectionsApi.updateCollection(collectionId, data),
    onSuccess: (_, { collectionId }) => {
      queryClient.invalidateQueries({ queryKey: collectionKeys.detail(collectionId) });
      queryClient.invalidateQueries({ queryKey: collectionKeys.list() });
      Toast.show({ type: 'success', text1: 'Collection updated' });
    },
    onError: () => Toast.show({ type: 'error', text1: 'Failed to update collection' }),
  });
}

export function useDeleteCollection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (collectionId: string) => collectionsApi.deleteCollection(collectionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: collectionKeys.list() });
      Toast.show({ type: 'success', text1: 'Collection deleted' });
    },
    onError: () => Toast.show({ type: 'error', text1: 'Failed to delete collection' }),
  });
}

export function useAddToCollection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ collectionId, data }: { collectionId: string; data: AddToCollectionRequest }) =>
      collectionsApi.addToCollection(collectionId, data),
    onSuccess: (_, { collectionId }) => {
      queryClient.invalidateQueries({ queryKey: collectionKeys.detail(collectionId) });
      Toast.show({ type: 'success', text1: 'Added to collection!' });
    },
    onError: () => Toast.show({ type: 'error', text1: 'Failed to add to collection' }),
  });
}

export function useRemoveFromCollection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ collectionId, artworkId }: { collectionId: string; artworkId: string }) =>
      collectionsApi.removeFromCollection(collectionId, artworkId),
    onSuccess: (_, { collectionId }) => {
      queryClient.invalidateQueries({ queryKey: collectionKeys.detail(collectionId) });
      Toast.show({ type: 'success', text1: 'Removed from collection' });
    },
    onError: () => Toast.show({ type: 'error', text1: 'Failed to remove from collection' }),
  });
}