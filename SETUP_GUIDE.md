# TaskFlow — Setup Guide (Full Stack)

This project has two parts that must run **at the same time**, in **two separate terminals**:
- **Frontend**: React + Vite (`/` — root folder)
- **Backend**: Python FastAPI (`/backend` folder), using MongoDB

## What was fixed
1. `src/lib/api.ts` — was pointing to a dead temporary URL (`emergentagent.com`). Now uses
   `VITE_API_URL` from `.env`, defaulting to `http://localhost:8000/api` for local dev.
2. `backend/requirements.txt` — was missing entirely. Added with all needed packages.
3. `backend/.env.example` — added, showing the required `MONGO_URL`, `DB_NAME`, `CORS_ORIGINS`.
4. `.env` (root) — added, pointing the frontend at the local backend by default.

## One-time setup

### 1. Install Python (if `python --version` fails in your terminal)
Download from https://www.python.org/downloads/ — during install, **check "Add Python to PATH"**.
Restart your terminal after installing, then confirm with:
```
python --version
```

### 2. Get a MongoDB connection string
Easiest option — MongoDB Atlas (free, no local install needed):
1. Sign up at https://mongodb.com/cloud/atlas
2. Create a free M0 cluster
3. Create a database user (username + password)
4. Network Access → Allow Access from Anywhere (0.0.0.0/0)
5. Connect → Drivers → Python → copy the connection string

### 3. Configure the backend
```
cd backend
copy .env.example .env
```
Open the new `backend/.env` and replace `MONGO_URL` with your real Atlas connection string.

### 4. Install backend dependencies
Still inside the `backend` folder:
```
pip install -r requirements.txt
```

### 5. Install frontend dependencies
Go back to the project root:
```
cd ..
npm install
```

## Running the app (every time)

**Terminal 1 — backend:**
```
cd backend
uvicorn server:app --host 0.0.0.0 --port 8000 --reload
```
You should see: `Uvicorn running on http://0.0.0.0:8000`

**Terminal 2 — frontend:**
```
npm run dev
```
Open the URL it prints (usually `http://localhost:3000`).

## Deploying (Render.com)

**Backend (Web Service):**
- Root Directory: `backend`
- Build Command: `pip install -r requirements.txt`
- Start Command: `uvicorn server:app --host 0.0.0.0 --port $PORT`
- Environment variables: `MONGO_URL`, `DB_NAME`, `CORS_ORIGINS` (set to your frontend's Render URL)

**Frontend (Static Site):**
- Root Directory: (blank)
- Build Command: `npm run build`
- Publish Directory: `dist`
- Environment variable: `VITE_API_URL` = your deployed backend URL + `/api`
  (e.g. `https://taskflow-backend.onrender.com/api`)

After setting `VITE_API_URL` on Render, also update your local `.env` back to the deployed
URL only if you want local dev to hit production — otherwise leave it as `localhost:8000/api`.
