import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL } from "@/utils/constants";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

// Request interceptor
api.interceptors.request.use(
  async (config) => {
    const authStorage = await AsyncStorage.getItem("auth-storage");
    if (authStorage) {
      const parsed = JSON.parse(authStorage);
      const token = parsed.state?.accessToken;
      if (token && !config.url?.includes("/auth/")) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor with refresh logic (similar to web)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const authStorage = await AsyncStorage.getItem("auth-storage");
        if (authStorage) {
          const parsed = JSON.parse(authStorage);
          const refreshToken = parsed.state?.refreshToken;
          const accessToken = parsed.state?.accessToken;
          const res = await axios.post(`${API_BASE_URL}/api/auth/refresh-token`, {
            accessToken,
            refreshToken,
          });
          const newAuth = { ...parsed, state: { ...parsed.state, ...res.data } };
          await AsyncStorage.setItem("auth-storage", JSON.stringify(newAuth));
          originalRequest.headers.Authorization = `Bearer ${res.data.accessToken}`;
          return api(originalRequest);
        }
      } catch {
        await AsyncStorage.removeItem("auth-storage");
      }
    }
    return Promise.reject(error);
  }
);

export default api;