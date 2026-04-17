import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import Toast from "react-native-toast-message";
import axios from "axios";
import { useAuthStore } from "@/store/authStore";
import { API_BASE_URL } from "@/utils/constants";
import type { LoginRequest, RegisterRequest, AuthResponse, UserProfile } from "@/types";

// ─── Query Keys ─────────────────────────────────────────────────────────────
export const authKeys = {
  profile: ["auth", "profile"],
};

// ─── Register ────────────────────────────────────────────────────────────────
export function useRegister() {
  const { setAuth } = useAuthStore();
  const router = useRouter();

  return useMutation({
    mutationFn: async (data: RegisterRequest) => {
      const url = `${API_BASE_URL}/api/auth/register`;
      const payload = {
        email: data.email,
        password: data.password,
        displayName: data.displayName,
        userType: data.userType,
        galleryName: data.userType === "Artist" ? data.galleryName : null,
      };
      console.log("🚀 Sending to:", url);
      console.log("📦 Payload:", JSON.stringify(payload));
    
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    
      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ Registration failed:", response.status, errorText);
        throw new Error(errorText || "Registration failed");
      }
    
      return response.json();
    },
    onSuccess: (response) => {
      setAuth(response.user, response.accessToken, response.refreshToken);
      Toast.show({ type: "success", text1: `Welcome, ${response.user.displayName ?? "User"}!` });
      router.replace(response.user.userType === "Artist" ? "/dashboard/dashboard" : "/galleries");
    },
    onError: (error: any) => {
      console.log("Registration error:", error.response?.data || error.message);
      const message = error.response?.data?.error || "Registration failed. Please try again.";
      Toast.show({ type: "error", text1: message });
    },
  });
}

// ─── Login ───────────────────────────────────────────────────────────────────
export function useLogin() {
  const { setAuth } = useAuthStore();
  const router = useRouter();

  return useMutation({
    mutationFn: async (data: LoginRequest) => {
      const response = await axios.post<AuthResponse>(
        `${API_BASE_URL}/api/auth/login`,
        data,
        { headers: { "Content-Type": "application/json" } }
      );
      return response.data;
    },
    onSuccess: (response) => {
      setAuth(response.user, response.accessToken, response.refreshToken);
      Toast.show({ type: "success", text1: `Welcome back, ${response.user.displayName ?? "User"}!` });
      router.replace(response.user.userType === "Artist" ? "/dashboard/dashboard" : "/galleries");
    },
    onError: (error: any) => {
      console.log("Login error:", error.response?.data || error.message);
      const message = error.response?.data?.error || "Invalid email or password.";
      Toast.show({ type: "error", text1: message });
    },
  });
}

// ─── Profile ─────────────────────────────────────────────────────────────────
export function useProfile() {
  const { isAuthenticated } = useAuthStore();

  return useQuery({
    queryKey: authKeys.profile,
    queryFn: async () => {
      const response = await axios.get<UserProfile>(`${API_BASE_URL}/api/auth/profile`);
      return response.data;
    },
    enabled: isAuthenticated,
  });
}

// ─── Logout ──────────────────────────────────────────────────────────────────
export function useLogout() {
  const { clearAuth } = useAuthStore();
  const queryClient = useQueryClient();
  const router = useRouter();

  return () => {
    clearAuth();
    queryClient.clear();
    router.replace("/");
    Toast.show({ type: "success", text1: "Signed out." });
  };
}

// ─── Forgot / Reset Password ─────────────────────────────────────────────────
export function useForgotPassword() {
  return useMutation({
    mutationFn: async (email: string) => {
      await axios.post(`${API_BASE_URL}/api/auth/forgot-password`, { email });
    },
    onSuccess: () => {
      Toast.show({ type: "success", text1: "If that email exists, a reset link has been sent." });
    },
  });
}

export function useResetPassword() {
  const router = useRouter();

  return useMutation({
    mutationFn: async ({ email, token, newPassword }: { email: string; token: string; newPassword: string }) => {
      await axios.post(`${API_BASE_URL}/api/auth/reset-password`, { email, token, newPassword });
    },
    onSuccess: () => {
      Toast.show({ type: "success", text1: "Password reset! Please sign in." });
      router.replace("/auth/login");
    },
  });
}