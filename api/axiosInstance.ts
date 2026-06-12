import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL } from "@/utils/constants";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

// قائمة بالنقاط العامة (لا تحتاج توكن)
const publicEndpoints = [
  '/api/auth/',
  '/api/artworks/search',
  '/api/artworks/suggestions',
  '/api/artworks/popular-searches',
  '/api/galleries',
  '/api/galleries/search',
];

function isPublicEndpoint(url?: string): boolean {
  if (!url) return false;
  return publicEndpoints.some(endpoint => url.includes(endpoint));
}

// Request interceptor – إضافة التوكين فقط للنقاط المحمية
api.interceptors.request.use(
  async (config) => {
    // لا تضف توكين للنقاط العامة
    if (isPublicEndpoint(config.url)) {
      console.log("🔓 Public endpoint, skipping token:", config.url);
      return config;
    }
    
    try {
      const authStorage = await AsyncStorage.getItem("auth-storage");
      if (authStorage) {
        const parsed = JSON.parse(authStorage);
        const token = parsed.state?.accessToken;
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
          console.log("✅ Token attached to request:", config.url);
        } else {
          console.log("⚠️ No token found in storage");
        }
      } else {
        console.log("⚠️ No auth-storage found");
      }
    } catch (e) {
      console.log("❌ Error reading auth-storage:", e);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor – تجديد التوكين عند 401
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
          
          if (!refreshToken) throw new Error("No refresh token");
          
          const response = await axios.post(`${API_BASE_URL}/api/auth/refresh-token`, {
            accessToken,
            refreshToken,
          });
          
          const newAuth = {
            ...parsed,
            state: {
              ...parsed.state,
              accessToken: response.data.accessToken,
              refreshToken: response.data.refreshToken,
            },
          };
          
          await AsyncStorage.setItem("auth-storage", JSON.stringify(newAuth));
          originalRequest.headers.Authorization = `Bearer ${response.data.accessToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        console.log("❌ Refresh token failed, clearing storage");
        await AsyncStorage.removeItem("auth-storage");
        // يمكنك إرسال حدث لتسجيل الخروج
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;