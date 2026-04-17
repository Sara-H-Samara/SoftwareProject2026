import { useLocalSearchParams } from 'expo-router';      // ← Expo Router equivalent
import { useQuery } from '@tanstack/react-query';
import api from '@/api/axiosInstance';

export function useBreadcrumbData() {
  const { artistId, id } = useLocalSearchParams<{ artistId?: string; id?: string }>();

  const { data: artist } = useQuery({
    queryKey: ['artist', artistId],
    queryFn: async () => {
      if (!artistId) return null;
      const response = await api.get(`/api/galleries/${artistId}`);
      return response.data;
    },
    enabled: !!artistId,
    staleTime: 1000 * 60 * 5,
  });

  const { data: artwork } = useQuery({
    queryKey: ['artwork', id],
    queryFn: async () => {
      if (!id) return null;
      const response = await api.get(`/api/artworks/${id}`);
      return response.data;
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  });

  return { artist, artwork };
}