# FDrive frontend (Vite + React)

Standalone web client for the FDrive API.

```bash
npm install
npm run dev
```

Open http://localhost:5173. Vite proxies API routes (`/auth`, `/folders`, `/files`, …) to `http://localhost:8000`.

API responses use `{ ok, message?, data? }`; `src/api/client.ts` unwraps `data` automatically.
