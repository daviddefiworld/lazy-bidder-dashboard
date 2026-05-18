# Dashboard Architecture

Overview of the LazyBidder dashboard app (Vite + React + TypeScript).

## Layout

```text
src/
├── App.tsx                 # Router + providers
├── main.tsx                # Entry
├── components/
│   ├── ProtectedRoute.tsx  # Auth gate for routes
│   ├── LoadingSpinner.tsx
│   ├── ErrorAlert.tsx
│   └── index.ts
├── contexts/
│   ├── AuthContext.tsx     # Login/session (JWT, localStorage)
│   └── SocketContext.tsx   # Socket.io client for dashboard ↔ backend
├── pages/
│   ├── LoginPage.tsx
│   └── ScriptConsolePage.tsx  # Main authenticated UI
├── services/
│   ├── apiService.ts       # REST helpers
│   └── socketService.ts  # Low-level socket helpers used by SocketContext
├── types/
│   ├── auth.ts
│   ├── api.ts
│   └── env.d.ts
└── utils/
    ├── formatters.ts
    ├── urlUtils.ts
    └── index.ts
```

## Flow

1. **`SocketProvider`** wraps the app so socket access is available under authenticated routes as needed.
2. **`AuthProvider`** holds auth state; **`ProtectedRoute`** sends anonymous users to **`/login`**.
3. **`ScriptConsolePage`** is the primary post-login experience (scripting / console workflows — see implementation for current features).

## Scripts

Use **`npm run dev`**, **`npm run build`**, etc., or the Yarn equivalents (`yarn dev`, …) per `package.json`.

## Related

- Root **`SOCKET_ARCHITECTURE.md`** — event names between dashboard, backend, and extension.
