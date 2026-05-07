import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Toast from "react-native-toast-message";
import { getApiErrorMessage } from "@/utils/helpers";
import { useAuthStore } from "@/store/authStore";
import { API_BASE_URL } from "@/utils/constants";
import type {
  CreateArtworkRequest,
  UpdateArtworkRequest,
  UpdateArtworkPositionRequest,
  Artwork,  // ✅ تمت إضافة الاستيراد المفقود
} from "@/types";
import api from '@/api/axiosInstance';

// ── Query Keys ────────────────────────────────────────────────────────────────
export const artworkKeys = {
  all: ["artworks"] as const,
  mine: () => [...artworkKeys.all, "mine"] as const,
  detail: (id: string) => [...artworkKeys.all, "detail", id] as const,
};

// ── Queries ───────────────────────────────────────────────────────────────────

/** All artworks owned by the currently authenticated artist. */
export function useMyArtworks() {
  const { isAuthenticated, accessToken, user } = useAuthStore();
  
  return useQuery({
    queryKey: artworkKeys.mine(),
    queryFn: async () => {
      try {
        console.log("🔍 Fetching my artworks with token (first 20 chars):", accessToken?.substring(0, 20));
        console.log("👤 Current user:", user?.id, user?.email);
        
        // استخدام api مباشرةً بدلاً من fetch – api.ts سيتعامل مع الـ token تلقائياً
        const response = await api.get<Artwork[]>('/api/artworks/my');
        console.log("✅ Artworks fetched:", response.data?.length);
        return response.data;
      } catch (error: any) {
        console.log("❌ API error:", error?.response?.status, error?.response?.data);
        // إذا كان الخطأ 401، نحاول تسجيل خروج المستخدم أو تجديد التوكن
        if (error?.response?.status === 401) {
          Toast.show({ type: "error", text1: "Session expired. Please login again." });
          // يمكنك استدعاء clearAuth هنا إذا أردت
        }
        throw error;
      }
    },
    staleTime: 1000 * 60 * 2,
    enabled: isAuthenticated,
  });
}

/** Single artwork by ID (public if published, or own). */
export function useArtwork(id: string) {
  const { accessToken } = useAuthStore();
  return useQuery({
    queryKey: artworkKeys.detail(id),
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/api/artworks/${id}`, {
        headers: { Authorization: accessToken ? `Bearer ${accessToken}` : "" },
      });
      if (!response.ok) throw new Error("Failed to fetch artwork");
      return response.json();
    },
    enabled: Boolean(id),
  });
}

// ── Helpers ───────────────────────────────────────────────────────────────────
/**
 * fetch with timeout support (prevents hanging requests)
 */
async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs = 30000
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timer);
    return response;
  } catch (error: unknown) {
    clearTimeout(timer);
    // في React Native، عند إلغاء الطلب يتم رمي خطأ اسمه "AbortError"
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Request timed out. Please check your connection.");
    }
    throw error;
  }
}

// ── Mutations ─────────────────────────────────────────────────────────────────
export function useCreateArtwork() {
  const queryClient = useQueryClient();
  const { accessToken, refreshToken, setAuth, clearAuth } = useAuthStore();

  return useMutation({
    mutationFn: async ({
      data,
      imageFile,
    }: {
      data: CreateArtworkRequest;
      imageFile: any;
    }) => {
      // Helper to perform the actual upload fetch
      const sendRequest = (token: string) => {
        const formData = new FormData();
        formData.append("title", data.title);
        formData.append("artworkType", data.artworkType);
        if (data.description) formData.append("description", data.description);
        if (data.materials) formData.append("materials", data.materials);
        if (data.dimensions) formData.append("dimensions", data.dimensions);
        if (data.year) formData.append("year", String(data.year));
        if (data.price) formData.append("price", String(data.price));

        if (imageFile) {
          formData.append("imageFile", {
            uri: imageFile.uri,
            name: imageFile.name || "artwork.jpg",
            type: imageFile.type || "image/jpeg",
          } as any);
        }

        return fetchWithTimeout(`${API_BASE_URL}/api/artworks`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });
      };

      if (!accessToken) {
        Toast.show({ type: "error", text1: "Please sign in again" });
        throw new Error("No access token");
      }

      console.log("🚀 Sending upload request...");
      let response = await sendRequest(accessToken);

      // If 401 and refresh token exists, try refreshing once
      if (response.status === 401 && refreshToken) {
        try {
          console.log("🔄 Token expired, attempting one‑time refresh…");
          const refreshResponse = await fetchWithTimeout(
            `${API_BASE_URL}/api/auth/refresh-token`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ accessToken, refreshToken }),
            }
          );

          if (refreshResponse.ok) {
            const authData = await refreshResponse.json();
            setAuth(authData.user, authData.accessToken, authData.refreshToken);
            // Retry the original request with the new token
            console.log("✅ Token refreshed, retrying upload…");
            response = await sendRequest(authData.accessToken);
          } else {
            // Refresh failed – clear session and throw
            clearAuth();
            Toast.show({
              type: "error",
              text1: "Session expired. Please sign in again.",
            });
            throw new Error("Session expired");
          }
        } catch (refreshError) {
          clearAuth();
          Toast.show({
            type: "error",
            text1: "Session expired. Please sign in again.",
          });
          throw new Error("Session expired");
        }
      }

      // Handle unsuccessful responses after possible retry
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || errorData.title || "Upload failed"
        );
      }

      return response.json();
    },
    onSuccess: (newArtwork) => {
      queryClient.setQueryData(artworkKeys.mine(), (old: any[] | undefined) =>
        old ? [newArtwork, ...old] : [newArtwork]
      );
      Toast.show({
        type: "success",
        text1: "Artwork uploaded successfully!",
      });
    },
    onError: (error) => {
      const message =
        error instanceof Error ? error.message : "Upload failed.";
      console.error("❌ Upload error:", message);
      Toast.show({ type: "error", text1: message });

      // If session expired, we already cleared auth above; the UI will react accordingly.
      // The user will be redirected to the login screen the next time they interact
      // with a protected route. No further action needed here.
    },
  });
}

export function useDeleteArtwork() {
  const queryClient = useQueryClient();
  const { accessToken } = useAuthStore();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`${API_BASE_URL}/api/artworks/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Delete failed");
      }

      return id;
    },
    onSuccess: (deletedId) => {
      queryClient.setQueryData(artworkKeys.mine(), (old: any[] | undefined) => {
        return old?.filter((a) => a.id !== deletedId);
      });
      queryClient.removeQueries({ queryKey: artworkKeys.detail(deletedId) });
      Toast.show({ type: "success", text1: "Artwork deleted." });
    },
    onError: (error) => {
      Toast.show({
        type: "error",
        text1: getApiErrorMessage(error, "Delete failed."),
      });
    },
  });
}

export function useBulkUpdatePositions() {
  const queryClient = useQueryClient();
  const { accessToken } = useAuthStore();

  return useMutation({
    mutationFn: async (positions: UpdateArtworkPositionRequest[]) => {
      console.log(
        "📤 Sending positions to save:",
        JSON.stringify(positions, null, 2)
      );

      const response = await fetch(`${API_BASE_URL}/api/artworks/positions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(positions),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("❌ Save failed:", {
          status: response.status,
          statusText: response.statusText,
          errorData,
        });
        throw new Error(errorData.message || "Failed to save layout");
      }

      if (
        response.status === 204 ||
        response.headers.get("content-length") === "0"
      ) {
        console.log("✅ Save successful (no content)");
        return { success: true };
      }

      const text = await response.text();
      if (!text) {
        console.log("✅ Save successful (empty response)");
        return { success: true };
      }

      try {
        const result = JSON.parse(text);
        console.log("✅ Save successful:", result);
        return result;
      } catch (e) {
        console.log("✅ Save successful (non-JSON response):", text);
        return { success: true, message: text };
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: artworkKeys.mine() });
      Toast.show({ type: "success", text1: "Gallery layout saved!" });
    },
    onError: (error) => {
      console.error("❌ Mutation error:", error);
      Toast.show({
        type: "error",
        text1: getApiErrorMessage(error, "Failed to save layout."),
      });
    },
  });
}

export function useUpdateArtworkImage() {
  const queryClient = useQueryClient();
  const { accessToken } = useAuthStore();

  return useMutation({
    mutationFn: async ({ id, file }: { id: string; file: any }) => {
      const formData = new FormData();
      formData.append("image", {
        uri: file.uri,
        name: file.name || "artwork.jpg",
        type: file.type || "image/jpeg",
      } as any);

      const response = await fetch(
        `${API_BASE_URL}/api/artworks/${id}/image`,
        {
          method: "PUT",
          headers: { Authorization: `Bearer ${accessToken}` },
          body: formData,
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Image update failed");
      }

      return response.json();
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(artworkKeys.detail(updated.id), updated);
      queryClient.invalidateQueries({ queryKey: artworkKeys.mine() });
      Toast.show({ type: "success", text1: "Artwork image replaced." });
    },
    onError: (error) => {
      Toast.show({
        type: "error",
        text1: getApiErrorMessage(error, "Image upload failed."),
      });
    },
  });
}

export function useUpdateArtwork() {
  const queryClient = useQueryClient();
  const { accessToken } = useAuthStore();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateArtworkRequest }) => {
      const response = await fetch(`${API_BASE_URL}/api/artworks/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Update failed");
      }

      return response.json();
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(artworkKeys.detail(updated.id), updated);
      queryClient.setQueryData(artworkKeys.mine(), (old: any[] | undefined) =>
        old?.map((a) => (a.id === updated.id ? updated : a))
      );
      Toast.show({ type: "success", text1: "Artwork updated." });
    },
    onError: (error) => {
      Toast.show({
        type: "error",
        text1: getApiErrorMessage(error, "Update failed."),
      });
    },
  });
}