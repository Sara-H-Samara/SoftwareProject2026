// utils/constants.ts

export const APP_NAME = import.meta.env.VITE_APP_NAME ?? 'Virtual Art Gallery'
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'https://localhost:5001'

// Local storage keys — centralised to avoid typo bugs
export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'vag_access_token',
  REFRESH_TOKEN: 'vag_refresh_token',
  USER: 'vag_user',
} as const

// Route paths — used in <Link> and useNavigate calls
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
  BROWSE_GALLERIES: '/galleries',
  GALLERY: (artistId: string) => `/galleries/${artistId}`,
  VIRTUAL_GALLERY: (artistId: string) => `/galleries/${artistId}/3d`, 
  DASHBOARD: '/dashboard',
  DASHBOARD_ARTWORKS: '/dashboard/artworks',
  DASHBOARD_UPLOAD: '/dashboard/upload',
  DASHBOARD_LAYOUT: '/dashboard/layout',
  DASHBOARD_PROFILE: '/dashboard/profile',
} as const

// 3D scene defaults — match the gallery_room.glb coordinate space
export const GALLERY_DEFAULTS = {
  CAMERA_POSITION: [0, 1.6, 5] as [number, number, number],
  CAMERA_FOV: 75,
  ARTWORK_DEFAULT_Y: 1.5,     // Eye-level height in metres
  ARTWORK_DEFAULT_SCALE: 1.0,
  MOVE_SPEED: 0.08,           // ✅ تم التعديل
  AMBIENT_LIGHT_INTENSITY: 0.4,
  SPOT_LIGHT_INTENSITY: 1.2,
  // القيم التالية مضافة لتوفير حدود الغرفة وأنواع الأعمال 2D
  PLAYER_HEIGHT: 1.6, // مطابق لـ CAMERA_POSITION Y
  ROOM_BOUNDS_X: 7.8, // تقدير لحدود الغرفة بناءً على FallbackRoom أو النموذج الفعلي
  ROOM_BOUNDS_Z: 7.8,
  ARTWORK_PLANE_SIZE: 1.5,
  ARTWORK_FRAME_THICKNESS: 0.05,
  ARTWORK_PEDESTAL_HEIGHT: 1.0,
  ARTWORK_PEDESTAL_WIDTH: 0.8,
  ARTWORK_PEDESTAL_DEPTH: 0.8,
} as const

// Keyboard control map for useKeyboardControls (مضافة بناءً على الإصدار السابق)
export const KEYBOARD_CONTROLS_MAP = [
  { name: 'forward', keys: ['ArrowUp', 'KeyW'] },
  { name: 'backward', keys: ['ArrowDown', 'KeyS'] },
  { name: 'left', keys: ['ArrowLeft', 'KeyA'] },
  { name: 'right', keys: ['ArrowRight', 'KeyD'] },
  { name: 'sprint', keys: ['ShiftLeft', 'ShiftRight'] },
] as const;

export const ARTWORK_TYPES = [
  'Painting',
  'Sculpture',
  'Digital',
  'Photography',
  'Installation',
] as const

// أنواع الأعمال التي تعتبر 2D للعرض في 3D (مضافة بناءً على الإصدار السابق)
export const TWO_D_ARTWORK_TYPES = ['Painting', 'Photography', 'Digital'];


export const PAGE_SIZE = 12