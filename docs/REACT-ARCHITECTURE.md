# FarmMart 2.0 React Architecture & Transition Strategy

This document outlines the React framework foundation established for the frontend in FarmMart 2.0. The goal of this architecture is to provide a modern, robust, and clean development structure using React, Vite, and React Router while preserving legacy pages to support a gradual, non-breaking migration.

---

## 1. Directory Structure

The new frontend directory structure is organized as follows:

```text
frontend/
  ├── public/                 # Static assets served at root (optional)
  ├── src/
  │   ├── assets/             # Images, SVG graphics, and static assets
  │   ├── components/         # Reusable structural and helper components (e.g., Route Guards)
  │   ├── context/            # Global React Contexts (e.g., AuthContext)
  │   ├── layouts/            # Page shell layout wrappers (Public, Authenticated, Admin)
  │   ├── pages/              # Routed page-level components
  │   ├── routes/             # Route configurations and routing types (future scalability)
  │   ├── services/           # central API communications layer (real backend interaction)
  │   ├── styles/             # Modular or global styling definitions
  │   ├── App.jsx             # React root App configuration and router tree
  │   ├── main.jsx            # React root container bootstrap entry point
  │   └── App.css             # Base custom styling tokens and layout configurations
  ├── package.json            # Node.js project manifests & dependencies
  ├── vite.config.js          # Vite configurations (Port: 3000)
  ├── index.html              # React application container mount HTML
  └── index-legacy.html       # Renamed legacy static landing page (preserved)
```

---

## 2. Component and Page Routing

We use **React Router** (`react-router-dom`) inside `App.jsx` to declare routes and handle route protections:

*   `PublicLayout` (Header + Home logo links + Navigation + Legacy site banner link)
    *   `/` -> Home page
    *   `/login` -> Login page
    *   `/signup` -> Signup page
*   `AuthenticatedLayout` (User sidebar and top profile card)
    *   `/dashboard` -> Dashboard overview
    *   `/marketplace` -> Crop offers and buy panels (restricted to `buyer`, `farmer`)
    *   `/demands` -> Store demand listings
    *   `/tasks` -> Procurement operations log
    *   `/profile` -> User profile data
*   `AdminLayout` (Administrator system control panel)
    *   `/admin` -> Admin panel console (restricted to `admin`)

---

## 3. Authentication & State Strategy

*   **`AuthContext.jsx`**: Centralizes session initialization, token parsing, and actions (`login`, `logout`, `signup`).
*   **Session Sharing**: The authentication state is read from and saved to standard browser `sessionStorage` using the key `ftm_session`. This ensures that both the legacy frontend and the React frontend share the same session token.
*   **Role Preservation**: The current backend returns roles `'user'` and `'admin'`. React preserves these roles directly to maintain backend API contracts.

---

## 4. Route Guarding

We implement two custom route guards in `components/`:

1.  **`ProtectedRoute.jsx`**: Validates whether the user is logged in. If not, stores the current URL and redirects the user to `/login`.
2.  **`RoleRoute.jsx`**: Restricts routing to specific user roles. It supports future roles `'buyer'`, `'farmer'`, and `'admin'`, but is backward-compatible with the legacy `'user'` role (mapping `'user'` access to buyer/farmer-scoped views).

---

## 5. API Service Layer

All backend fetch requests are managed in `src/services/api.js`.
*   **Base URL**: Configured locally to match the backend port (`http://localhost:5000` or via environment variable).
*   **Auth Token Injection**: The API service automatically injects `Authorization: Bearer <token>` in the request headers if a session is present.
*   **No Mocking Fallback**: Unlike the legacy frontend, the React API client communicates directly with the real API and does not fall back to local mock data stores.

---

## 6. Legacy Transition Strategy

To maintain a zero-downtime, fully operational system during migration, the legacy static application is preserved intact:
1.  The legacy `index.html` has been renamed to `index-legacy.html`.
2.  A yellow information banner is displayed at the top of the React SPA (`PublicLayout`) with a direct link: *"Go to Legacy Website"*.
3.  Static legacy files (`auth.html`, `admin/dashboard.html`, `user/dashboard.html`, and related assets) are served directly by the dev server.
4.  Once a React page achieves feature parity, the legacy HTML paths can be redirected or replaced.
