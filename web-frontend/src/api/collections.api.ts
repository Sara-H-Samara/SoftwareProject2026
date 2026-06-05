import api from './axiosInstance';
import type { Collection, CreateCollectionRequest, UpdateCollectionRequest, AddToCollectionRequest } from '@/types';

export const collectionsApi = {
  getMyCollections: () =>
    api.get<Collection[]>('/api/collections').then(r => r.data),
  
  getCollection: (collectionId: string) =>
    api.get<Collection>(`/api/collections/${collectionId}`).then(r => r.data),
  
  createCollection: (data: CreateCollectionRequest) =>
    api.post<Collection>('/api/collections', data).then(r => r.data),
  
  updateCollection: (collectionId: string, data: UpdateCollectionRequest) =>
    api.put<Collection>(`/api/collections/${collectionId}`, data).then(r => r.data),
  
  deleteCollection: (collectionId: string) =>
    api.delete(`/api/collections/${collectionId}`),
  
  addToCollection: (collectionId: string, data: AddToCollectionRequest) =>
    api.post<Collection>(`/api/collections/${collectionId}/items`, data).then(r => r.data),
  
  removeFromCollection: (collectionId: string, artworkId: string) =>
    api.delete(`/api/collections/${collectionId}/items/${artworkId}`),
  
  reorderCollection: (collectionId: string, itemIds: string[]) =>
    api.post(`/api/collections/${collectionId}/reorder`, { itemIds }),
};