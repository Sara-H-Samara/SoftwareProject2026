import Constants from "expo-constants";

export const APP_NAME = "Virtual Art Gallery";
export const API_BASE_URL = "http://localhost:5005";
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