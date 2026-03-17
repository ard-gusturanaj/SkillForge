# SkillForge

SkillForge is a full-stack collaboration platform where developers can showcase projects, find teammates, and manage collaboration requests.

## Tech Stack

- Frontend: React 19, TypeScript, Vite, Tailwind CSS
- Backend: Node.js, Express 5, TypeScript
- Database: PostgreSQL, Drizzle ORM
- API contracts: OpenAPI + Orval-generated client/types
- Monorepo: npm workspaces

## Repository Structure

```text
.
├─ artifacts/
│  ├─ skillforge/       # Frontend app (Vite)
│  ├─ api-server/       # Backend API (Express)
│  └─ mockup-sandbox/   # UI sandbox app
├─ lib/
│  ├─ api-spec/         # OpenAPI spec + codegen config
│  ├─ api-client-react/ # Generated React Query client
│  ├─ api-zod/          # Generated Zod schemas
│  └─ db/               # Drizzle schema + DB config
├─ scripts/             # Workspace utilities
└─ package.json         # Root scripts/workspaces
```

## Prerequisites

- Node.js 20+
- npm 10+
- PostgreSQL 14+ (local or remote)

## Environment Variables

Copy values from `.env.example` and set them in your shell before running backend/db commands.

Required:

- `DATABASE_URL`
- `JWT_SECRET`
- `PORT` (API server port, default rec: `8080`)

Optional:

- `BASE_PATH` (frontend base path, default `/`)
- `API_TARGET` (frontend proxy target, default `http://localhost:8080`)

PowerShell example:

```powershell
$env:DATABASE_URL="postgresql://postgres:postgres@localhost:5432/skillforge"
$env:JWT_SECRET="change-me"
$env:PORT="8080"
```

## Install

```bash
npm install
```

## Database Setup

```bash
npm run db:push
```

## Run in Development

Run both API + frontend:

```bash
npm start
```

Or run separately:

```bash
npm run dev:api
npm run dev:web
```

## Validation

Typecheck:

```bash
npm run typecheck
```

Build all workspaces:

```bash
npm run build
```

## API Base

- API root: `/api`
- Health check: `/api/healthz`

## License

MIT
