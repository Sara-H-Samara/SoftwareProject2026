import Constants from "expo-constants";

// احصل على IP جهاز الكمبيوتر من الـ extra config (يمكنك تغييره يدوياً)
// للاختبار السريع، استخدم IP مباشر:
const getBaseUrl = () => {
  // إذا كنت تستخدم محاكي Android على نفس الجهاز، استخدم 10.0.2.2
  // إذا كنت تستخدم جهاز حقيقي أو محاكي iOS، استخدم IP شبكتك الحقيقية
  // مثال: "http://192.168.1.100:5005"
  return "http://192.168.1.95:5005"; // غيّر هذا إلى IP جهازك الفعلي
};

export const APP_NAME = "Virtual Art Gallery";
export const API_BASE_URL = getBaseUrl();
console.log("🔧 API_BASE_URL used:", API_BASE_URL);

export const STRIPE_PUBLISHABLE_KEY =
  Constants.expoConfig?.extra?.stripePublishableKey ?? "";

export const ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  REGISTER: "/register",
  FORGOT_PASSWORD: "/forgot-password",
  RESET_PASSWORD: "/reset-password",
  BROWSE_GALLERIES: "/galleries",
  GALLERY: (artistId: string) => `/galleries/${artistId}`,
  VIRTUAL_GALLERY: (artistId: string) => `/galleries/${artistId}/3d`,
  DASHBOARD: "/dashboard",
  DASHBOARD_ARTWORKS: "/dashboard/artworks",
  DASHBOARD_UPLOAD: "/dashboard/upload",
  DASHBOARD_LAYOUT: "/dashboard/layout",
  DASHBOARD_PROFILE: "/dashboard/profile",
} as const;

export const PAGE_SIZE = 12;

export const ARTWORK_TYPES = [
  "Painting",
  "Sculpture",
  "Digital",
  "Photography",
  "Installation",
] as const;

export const TWO_D_ARTWORK_TYPES = ["Painting", "Photography", "Digital"];