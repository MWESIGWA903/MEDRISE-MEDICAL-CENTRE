# MedRise Medical Centre — ERP System

Enterprise healthcare platform for MedRise Medical Centre, Lwadda A, Matugga, Uganda.

## What's Included

| App | Description | Port |
|-----|-------------|------|
| **Web Dashboard** | Full admin ERP (Queue, Patients, Wards, Billing, Reports…) | 8081 |
| **API Server** | REST + WebSocket backend | 8080 |
| **Mobile App** | Staff mobile app (Expo / React Native) | Expo Go |

---

## Quick Start (VS Code / Local)

### Prerequisites

- [Node.js 20+](https://nodejs.org)
- [pnpm](https://pnpm.io) — `npm install -g pnpm`
- [Docker Desktop](https://www.docker.com/products/docker-desktop) (for local database)

### 1. Clone & install

```bash
git clone https://github.com/YOUR_USERNAME/medrise.git
cd medrise
pnpm install
```

### 2. Start the database

```bash
docker compose up -d db
# PostgreSQL is now running on localhost:5432
```

### 3. Set up environment variables

```bash
cp artifacts/api-server/.env.example artifacts/api-server/.env
```

Open `artifacts/api-server/.env` and fill in your values.  
The database URL already matches Docker — only email credentials need updating.

### 4. Push database schema (first time only)

```bash
pnpm db:push
```

### 5. Start everything

```bash
pnpm dev:all
```

| Service | URL |
|---------|-----|
| Web Dashboard | http://localhost:8081 |
| API | http://localhost:8080 |

Default login: **Hannington** / **medical_director**

---

## All Commands

```bash
pnpm dev:all        # Start API + Web dashboard together
pnpm dev:api        # Start API only (port 8080)
pnpm dev:web        # Start web dashboard only (port 8081)
pnpm dev:mobile     # Start mobile app (Expo Go)
pnpm db:push        # Push schema changes to database
pnpm db:studio      # Open Drizzle database browser
pnpm build          # Build frontend for production
pnpm build:api      # Build API for production
pnpm typecheck      # Run TypeScript checks
```

---

## Mobile App (VS Code)

```bash
cp artifacts/medrise-mobile/.env.local.example artifacts/medrise-mobile/.env.local
# Edit .env.local — set EXPO_PUBLIC_DOMAIN to your local IP, e.g: 192.168.1.100:8080
pnpm dev:mobile
```

Install **Expo Go** on your phone and scan the QR code shown in the terminal.

> On a real phone, use your machine's LAN IP instead of `localhost`  
> Run `ipconfig` (Windows) or `ifconfig` (Mac/Linux) to find it.

---

## Environment Variables

### `artifacts/api-server/.env`

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `EMAIL_USER` | Gmail address for sending emails |
| `EMAIL_APP_PASSWORD` | Gmail App Password (not your account password) |
| `RESEND_API_KEY` | Resend API key (fallback email) |
| `NOTIFICATION_EMAIL` | Email to receive clinic alerts |
| `NODE_ENV` | `development` or `production` |
| `PORT` | API port (default: 8080) |

### `artifacts/medrise-mobile/.env.local`

| Variable | Description |
|----------|-------------|
| `EXPO_PUBLIC_DOMAIN` | API host — `localhost:8080` or `192.168.x.x:8080` |

---

## Database Tools

```bash
pnpm db:push        # Apply schema to database
pnpm db:studio      # Open Drizzle Studio → http://local.drizzle.studio
```

Or open **pgAdmin** at http://localhost:5050  
Email: `admin@medrise.local` · Password: `medrise`

---

## Tech Stack

- **Frontend**: React 19, Vite 7, Tailwind CSS 4, TanStack Query, Radix UI
- **API**: Node.js, Express 5, TypeScript, Drizzle ORM, PostgreSQL 16
- **Mobile**: Expo (React Native), Expo Router
- **Auth**: JWT sessions, bcrypt passwords
- **Email**: Nodemailer (Gmail SMTP) + Resend fallback
- **Real-time**: WebSockets (live queue & notification updates)

---

## Deploying to Production

### Option A — Replit (one click)
Click **Publish** in Replit. Handles everything automatically.

### Option B — Railway (recommended for GitHub)
1. Push to GitHub
2. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub
3. Add a **PostgreSQL** plugin inside Railway
4. Set environment variables (copy from `artifacts/api-server/.env.example`)
5. Railway auto-detects Node.js and deploys

### Option C — Vercel + Railway
1. Deploy `artifacts/api-server` to Railway (API + DB)
2. Deploy `artifacts/medrise` to Vercel (frontend)

---

*MedRise Medical Centre · Compassionate Care. Better Health. Brighter Lives.*
