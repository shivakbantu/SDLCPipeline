# HBW Phase 5 — Full-Stack Skeleton (Hotel Booking Web)

This repository contains the **HBW Phase 5 full-stack skeleton**: a minimal backend + frontend setup with database migrations and a dev proxy configuration.

---

## Prerequisites

Install the following tools before running the project:

### Required
- **Git**
- **Node.js 18+** (recommended: latest LTS) and **npm**
- **Python 3.11+** (3.10 may work, but 3.11+ recommended)
- **PostgreSQL 14+** (recommended)  
  - SQLite may be supported depending on your local setup, but Phase 5 expects PostgreSQL.

### Recommended
- **Docker + Docker Compose** (optional, for running Postgres easily)
- **VS Code** + Python/ESLint extensions

---

## Project Structure (typical)

> Your folder names may differ slightly. Use the commands below from the repo root and adjust paths if needed.

```
.
├─ backend/                 # API service (FastAPI or similar)
│  ├─ app/
│  ├─ alembic/              # DB migrations (if using Alembic)
│  ├─ requirements.txt
│  └─ .env.example
├─ frontend/                # React/Vite frontend
│  ├─ src/
│  ├─ vite.config.ts        # Dev proxy config
│  └─ package.json
└─ README.md
```

---

## 1) Database Setup (PostgreSQL)

### Option A — Docker (recommended)

Create a `docker-compose.yml` (if not already present) or run an existing one.

Example container (adjust as needed):
```bash
docker run --name hbw-postgres \
  -e POSTGRES_USER=hbw \
  -e POSTGRES_PASSWORD=hbw \
  -e POSTGRES_DB=hbw \
  -p 5432:5432 \
  -d postgres:16
```

Verify connection:
```bash
psql "postgresql://hbw:hbw@localhost:5432/hbw"
```

### Option B — Local Postgres

Create a database and user:
```sql
CREATE USER hbw WITH PASSWORD 'hbw';
CREATE DATABASE hbw OWNER hbw;
```

Connection string:
```
postgresql://hbw:hbw@localhost:5432/hbw
```

---

## 2) Backend Configuration

### Create backend environment file

Copy the example env (path may vary):
```bash
cp backend/.env.example backend/.env
```

Set/confirm at least:
- `DATABASE_URL=postgresql://hbw:hbw@localhost:5432/hbw`
- `JWT_SECRET_KEY=change-me` (if auth is included in skeleton)
- `CORS_ORIGINS=http://localhost:5173` (or your frontend port)

If your backend uses Pydantic settings, ensure variable names match exactly what the code expects.

---

## 3) Install Backend Dependencies

From repo root:
```bash
python -m venv .venv
# macOS/Linux
source .venv/bin/activate
# Windows PowerShell
# .\.venv\Scripts\Activate.ps1

pip install -r backend/requirements.txt
```

---

## 4) Run Database Migrations

This skeleton expects you to **run migrations** before starting the app.

### If using Alembic
From repo root (or `backend/` if configured that way):
```bash
cd backend
alembic upgrade head
```

### If using another migration tool
Run the project’s migration command (check `backend/` docs or Makefile).  
The goal is: **create tables + schema** in the configured database.

---

## 5) Start the Backend (API)

From `backend/`:
```bash
cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Backend should be available at:
- API base: `http://localhost:8000`
- OpenAPI docs: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

---

## 6) Frontend Setup & Run

From `frontend/`:
```bash
cd frontend
npm install
npm run dev
```

Frontend should be available at:
- `http://localhost:5173` (Vite default)

---

## Endpoints (Phase 5 Skeleton)

Exact routes depend on your implementation, but you should expect:

### Health / Meta
- `GET /health` (or `/api/health`) — basic server status

### Auth (if included)
- `POST /auth/register`
- `POST /auth/login`
- `GET /auth/me`

### Hotels / Rooms / Bookings (if included)
- `GET /hotels`
- `GET /hotels/{id}`
- `GET /rooms?hotelId=...`
- `POST /bookings`
- `GET /bookings`

Use Swagger for the authoritative list:
- `http://localhost:8000/docs`

---

## Frontend Proxy Details (Vite)

In development, the frontend should **not** call the backend directly with `http://localhost:8000` in your React code. Instead, use a relative API base path (commonly `/api`) and let Vite proxy it.

### Expected setup
- Frontend calls: `fetch("/api/…")`
- Vite proxies to: `http://localhost:8000`

### Example `vite.config.ts`
```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:8000",
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
```

### Backend routing note
Either:
- Backend routes are mounted under `/api` (e.g., `/api/hotels`), **or**
- Vite rewrites `/api` away. If you need rewrites:
```ts
proxy: {
  "/api": {
    target: "http://localhost:8000",
    changeOrigin: true,
    rewrite: (path) => path.replace(/^\/api/, ""),
  },
},
```

Make sure your frontend + backend agree on whether `/api` is part of the path.

---

## Common Issues

### DB connection fails
- Ensure Postgres is running and `DATABASE_URL` is correct
- Confirm user/password/db exist
- Check port `5432` is not in use

### Tables missing / API errors on startup
- Run migrations: `alembic upgrade head`

### CORS errors
- Use Vite proxy (recommended)
- Or configure backend `CORS_ORIGINS` to include the frontend origin

---

## Quick Start (Summary)

```bash
# 1) Start Postgres (Docker example)
docker run --name hbw-postgres -e POSTGRES_USER=hbw -e POSTGRES_PASSWORD=hbw -e POSTGRES_DB=hbw -p 5432:5432 -d postgres:16

# 2) Backend
python -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
cp backend/.env.example backend/.env
cd backend && alembic upgrade head
uvicorn app.main:app --reload --port 8000

# 3) Frontend (new terminal)
cd frontend
npm install
npm run dev
```

---

**Phase:** HBW Phase 5 (Full-Stack Skeleton)