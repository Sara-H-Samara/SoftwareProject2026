# VirtualArtGallery — Web Frontend

React 18 + TypeScript + Vite application with an immersive Three.js 3D gallery experience.

---

## Tech Stack

| Concern | Library |
|---------|---------|
| Framework | React 18 |
| Language | TypeScript (strict) |
| Build tool | Vite 5 |
| Routing | React Router DOM v6 |
| Server state | TanStack React Query v5 |
| Client state | Zustand v4 (with localStorage persistence) |
| HTTP | Axios (with silent JWT refresh interceptor) |
| 3D | Three.js + @react-three/fiber + @react-three/drei |
| Styling | Tailwind CSS v3 (dark gallery theme) |
| UI components | Headless UI + Heroicons |
| Toasts | react-hot-toast |

---

## Project Structure

```
src/
├── api/                  # Axios instance + per-resource API functions
│   ├── axiosInstance.ts  # JWT attach + silent refresh queue
│   ├── auth.api.ts
│   ├── artworks.api.ts
│   ├── galleries.api.ts
│   └── ai.api.ts
├── components/
│   ├── common/           # Button, Input, Modal, Spinner, SkeletonCard
│   ├── layout/           # Navbar, ProtectedRoute
│   └── 3d/               # GalleryScene, DynamicArtwork, ArtworkDetailsModal, LoadingScreen
├── hooks/                # React Query hooks: useAuth, useArtworks, useGallery
├── pages/
│   ├── Auth/             # LoginPage, RegisterPage, ForgotPasswordPage, ResetPasswordPage
│   ├── ArtistDashboard/  # DashboardLayout, Overview, MyArtworks, Upload, Layout Editor, Profile
│   ├── HomePage.tsx
│   ├── BrowseGalleriesPage.tsx
│   ├── GalleryLandingPage.tsx
│   └── VirtualGalleryPage.tsx
├── store/
│   └── authStore.ts      # Zustand auth store (persisted)
├── types/
│   └── index.ts          # All TypeScript interfaces mirroring backend DTOs
├── utils/
│   ├── constants.ts      # Routes, storage keys, 3D defaults
│   └── helpers.ts        # Formatters, builders
├── App.tsx               # BrowserRouter + full route tree
└── main.tsx              # React root + QueryClientProvider
```

---

## Quick Start

### 1. Install dependencies

```bash
cd web-frontend
npm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
# Edit .env.local:
#   VITE_API_BASE_URL=https://localhost:5001
```

### 3. Start the backend

Make sure the ASP.NET Core API is running on `https://localhost:5001`.
(See `../README.md` for backend setup instructions.)

### 4. Start the dev server

```bash
npm run dev
# → http://localhost:3000
```

API requests to `/api/*` are proxied to the backend automatically (see `vite.config.ts`).

---

## 3D Gallery Model

Place your gallery room GLB at:

```
public/assets/3d/gallery_room.glb
```

A procedural fallback room renders automatically if the file is absent.
See `public/assets/3d/README.md` for model requirements and export settings.

---

## Key Features

### Silent JWT Refresh
`axiosInstance.ts` queues concurrent requests when the access token expires and
replays them transparently after a successful refresh — users are never logged out mid-session.

### 3D Gallery Scene
`GalleryScene.tsx` renders a full-screen WebGL scene with:
- WASD / arrow key movement (FPS-style)
- Click-to-lock mouse look via `PointerLockControls`
- Artwork meshes positioned from database 3D placement data
- Procedural fallback room when no GLB is present

### AI Description Suggestion
The Upload page calls `POST /api/ai/describe-artwork` and inserts the result
into the description textarea. The button is disabled until a title is entered.

### Gallery Layout Editor
Split-screen: left panel with per-artwork XYZ inputs, right panel with a live
Three.js preview using `OrbitControls` for free-look orbit.

---

## Scripts

```bash
npm run dev          # Start dev server with HMR
npm run build        # TypeScript check + production build
npm run preview      # Preview production build locally
npm run type-check   # Run tsc without emitting (CI)
npm run lint         # ESLint
```

---

## Production Build

```bash
npm run build
# Output in dist/ — serve as a static site
```

Point your CDN / web server at `dist/` and configure it to serve `index.html`
for all routes (React Router handles client-side navigation).
