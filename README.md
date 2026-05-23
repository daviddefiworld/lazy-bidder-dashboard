# LazyBidder Dashboard

A React + TypeScript app (Vite, Tailwind) with auth and a real-time **Socket.io** connection to the LazyBidder backend.

## Features

- **Authentication** — login, JWT session, protected routes (`ProtectedRoute`, `AuthContext`)
- **Socket context** — `SocketProvider` / `SocketContext`; connects with the admin JWT after login
- **Extensions** — home (`/`) with live extension cards
- **User management** — table of registered extensions (`/users`)
- **API keys** — create and revoke REST API keys (`/api-keys`)
- **Forms** — React Hook Form + Zod where used
- **TypeScript** — typed API and auth helpers

## Tech Stack

- **Frontend**: React 18, TypeScript
- **Build**: Vite
- **Styling**: Tailwind CSS
- **Routing**: React Router DOM
- **Real-time**: Socket.io client

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or Yarn

### Installation

1. Clone the repository
2. Install dependencies:

   ```bash
   npm install
   ```

   or: `yarn install`

3. Start the development server:

   ```bash
   npm run dev
   ```

   or: `yarn dev`

4. Open `http://localhost:5173` (or the URL Vite prints)

### Available Scripts

- `npm run dev` / `yarn dev` — development server
- `npm run build` / `yarn build` — production build
- `npm run preview` / `yarn preview` — preview production build
- `npm run lint` / `yarn lint` — ESLint

## Project Structure

```text
src/
├── components/          # ProtectedRoute, LoadingSpinner, ErrorAlert
├── contexts/            # AuthContext, SocketContext
├── pages/               # LoginPage, ExtensionsPage, UsersPage, ApiKeysPage, …
├── services/            # apiService, socketService
├── types/               # auth, api, env
├── utils/               # formatters, urlUtils
├── App.tsx
├── main.tsx
└── index.css
```

## Authentication Flow

1. User signs in on **`/login`** with backend `ADMIN_USERNAME` / `ADMIN_PASSWORD`
2. JWT is stored in `localStorage` under `lazybidder_dashboard_jwt` (see `constants/authStorage.ts`)
3. Protected routes (`/`, `/users`, `/api-keys`, extension detail) sit behind **`ProtectedRoute`**
4. **Socket.io** uses `auth: { token }` with the same JWT (see `socketService.ts`)
5. Unauthenticated visitors are redirected to **`/login`**

## Development Notes

- Point the app at your backend URL and ensure CORS/socket options match your environment
- See repo root **`SOCKET_ARCHITECTURE.md`** for socket event naming

## License

This project is licensed under the MIT License.
