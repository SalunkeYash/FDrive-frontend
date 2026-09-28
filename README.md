# FDrive web (Vite + React)

Drive UI lives in `apps/web` and talks to the FastAPI backend under `/api/v1`.

```bash
cd apps/web
npm install
npm run dev
```

Open http://localhost:5173 — Vite proxies `/api` to `http://localhost:8000`.
