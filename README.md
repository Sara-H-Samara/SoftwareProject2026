# 🖼️ VirtualArtGallery

A **3D virtual art gallery** platform that lets artists showcase their work in an immersive, interactive exhibition space — and lets visitors walk through and explore the artwork as if in a real gallery.

---

## ✨ The Idea

The platform combines:
- **Artist Dashboard** — upload artwork, generate AI-assisted descriptions, and arrange pieces inside the gallery with a 3D layout editor.
- **3D Gallery Experience** — visitors move through the space with WASD keys and look around with the mouse, first-person style, just like a game.
- **AI-Powered Suggestions** — helps artists write artwork descriptions or get creative inspiration.

---

## 🧱 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + TypeScript + Vite |
| 3D Rendering | Three.js + React Three Fiber |
| Styling | Tailwind CSS |
| Backend | ASP.NET Core 8 (Clean Architecture) |
| Database | SQL Server + Entity Framework Core |
| Cloud Storage | Azure Blob Storage |
| AI | Azure OpenAI |
| Auth | JWT with silent token refresh |

---

## 🚀 Quick Start

### Run the Backend (API)
```bash
cd VirtualArtGallery.Api
dotnet run
```
Runs at: `https://localhost:5001` — Swagger: `/swagger`

### Run the Frontend
```bash
cd web-frontend
npm install
npm run dev
```
Runs at: `http://localhost:3000`

> Full setup instructions for each part are in its own README inside the respective folder.

---

## 📁 Project Structure

```
VirtualArtGallery/
├── VirtualArtGallery.Api/            # Backend (ASP.NET Core)
├── VirtualArtGallery.Core/
├── VirtualArtGallery.Infrastructure/
├── VirtualArtGallery.Application/
└── web-frontend/                     # Frontend (React + Three.js)
```
