# 01 — System Architecture

> Source: `guruhub-api/src/index.ts`, `README.md`, `docs/ARCHITECTURE_REVIEW.md`
> Cross-ref: [02_Database](02_Database.md) | [03_API](03_API.md) | [04_RBAC](04_RBAC.md) | [05_MultiTenant](05_MultiTenant.md)

---

## Overview

GuruHub is a **multi-tenant SaaS school management platform** for Indonesian secondary schools (SMP & SMA) aligned to Kurikulum Merdeka. Three independent projects share one API.

| Project | Directory | Port | Purpose |
|---|---|---|---|
| Backend API | `guruhub-api/` | **8000** | REST API, all business logic |
| Web Admin | `front-guruhub/` | **3001** | Full-featured admin dashboard |
| Mobile PWA | `front-guruhub-mobile/` | **3000** | Teacher-facing PWA (4 modules) |

---

## Technology Stack

### Backend (`guruhub-api/`)
| Layer | Technology | Version |
|---|---|---|
| Runtime | Bun | ≥ 1.3.14 |
| Framework | ElysiaJS | ^1.4.28 |
| ORM | Drizzle ORM | ^0.45.2 |
| Database | MySQL | 8.4 |
| Auth | jsonwebtoken | ^9.0.3 |
| PDF | pdf-lib + Puppeteer | ^1.17.1 / ^22.6.0 |
| Excel | xlsx (SheetJS) | ^0.18.5 |
| API Docs | @elysiajs/swagger | ^1.3.1 |
| Test Runner | Bun built-in | — |

### Frontend Web (`front-guruhub/`)
| Concern | Technology |
|---|---|
| Framework | Next.js ^16.2.9 (App Router) |
| React | ^19.2.7 |
| Styling | TailwindCSS v4 |
| Server state | TanStack React Query ^5 |
| Client state | Zustand ^5 + persist |
| Tables | TanStack Table ^8 |
| Forms | React Hook Form + Zod |
| Charts | Recharts ^3 |
| Icons | Lucide React |
| Toasts | Sonner |

### Frontend Mobile (`front-guruhub-mobile/`)
- Same Next.js + React + Zustand stack
- `next-pwa ^5.6.0` for PWA/service worker
- No TanStack Query — uses direct `useEffect` + `useState`
- 4 modules only: Dashboard, Attendance, Assessments, Teaching Journals

---

## Request Pipeline

Every API request passes through this exact chain (source: `src/index.ts`, `src/middleware/`):

```
Client
  │  Headers: Authorization: Bearer <token>
  │           x-school-id: <schoolId>
  ▼
CORS (@elysiajs/cors)
  │  Allows: Content-Type, Authorization, x-school-id
  ▼
Tenant Middleware (src/middleware/tenant.ts)
  │  Reads x-school-id header
  │  Validates school exists in DB
  │  Injects schoolId into context
  ▼
Auth Middleware (src/middleware/auth.ts)
  │  Reads Authorization: Bearer <token>
  │  Verifies JWT (must be type: "access")
  │  Checks payload.schoolId === context.schoolId
  │  Injects user { id, email, role, schoolId }
  ▼
RBAC Guard (requireRoles([...]))
  │  Checks user.role in allowedRoles[]
  ▼
Controller (DTO validation via ElysiaJS TypeBox)
  ▼
Service (business logic)
  ▼
Repository (Drizzle ORM, always WHERE school_id = ?)
  ▼
MySQL 8.4
```

> ⚠️ The tenant check and auth check are independent layers. Both must pass. See [05_MultiTenant](05_MultiTenant.md).

---

## Module Registration Order (`src/index.ts`)

```
authController          → /auth
teachersRoutes          → /teachers
studentsRoutes          → /students
classesRoutes           → /classes
subjectsRoutes          → /subjects
schedulesRoutes         → /schedules
attendanceRoutes        → /attendance
classMembersRoutes      → /class-members
teachingJournalsRoutes  → /teaching-journals
assessmentsRoutes       → /assessments
assessmentCategoriesRoutes → /assessment-categories
academicYearsRoutes     → /academic-years
usersRoutes             → /users
gradeEngineRoutes       → /grade-engine
reportCardRoutes        → /report-cards
dashboardRoutes         → /dashboard
pdfGeneratorRoutes      → /pdf-generator
importRoutes            → /import
disciplineRoutes        → /discipline
```

Auth module is registered directly as a controller (no separate routes file). All other modules use the routes pattern.

---

## Internal Module Structure

Every feature module follows this exact layout:

```
src/modules/<name>/
├── controller/   # Route handler, input parsing, calls service
├── dto/          # TypeBox schema definitions (request body)
├── service/      # Business logic, orchestrates repositories
├── repository/   # Drizzle ORM queries (always filtered by schoolId)
└── routes/       # ElysiaJS route registration + RBAC guards
```

**Exception:** `auth` module has no `repository/` or `routes/` — the controller is registered directly on the app, and DB access is embedded in the service.

**Exception:** `pdf-generator` and `dashboard` modules have no `repository/` — they query multiple schemas directly from the service.

---

## Frontend Architecture

### Web Admin Route Groups
```
src/app/
├── (auth)/login/        # Public — no auth required
├── (dashboard)/         # Protected group — redirects to /login if not authenticated
│   ├── layout.tsx       # Auth guard + Sidebar + Header shell
│   └── [module]/page.tsx
└── 403/page.tsx         # Forbidden page
```

### Auth Guard (Web)
`(dashboard)/layout.tsx` checks `useAuthStore().isAuthenticated`. If false after mount, redirects to `/login`.

### State Architecture
```
Zustand (auth.store.ts)          — persisted to localStorage key "guruhub-auth"
  ├── currentUser                 — persisted
  ├── refreshToken                — persisted
  └── accessToken                 — IN MEMORY ONLY (not persisted)

Zustand (ui.store.ts)            — UI state (sidebar open, theme, etc.)

TanStack React Query             — server state cache per module query
```

---

## Environment Configuration

**Backend** (`.env` in `guruhub-api/`):
```env
DATABASE_URL=mysql://user:password@host:3306/guruhub
JWT_ACCESS_SECRET=<min 32 chars>
JWT_REFRESH_SECRET=<min 32 chars>
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
PORT=8000
NODE_ENV=development
```

**Frontend** (`.env.local` — not currently in repo):
```env
NEXT_PUBLIC_API_URL=http://<host>:8000
```

If `NEXT_PUBLIC_API_URL` is not set, the frontend dynamically infers the API host from `window.location.hostname` on port 8000.

---

## Production Deployment

- API managed via **PM2** on Proxmox LXC container
- API binds to `0.0.0.0:8000`
- Web admin runs on port 3001
- Mobile PWA runs on port 3000
- Database: production MariaDB (MySQL-compatible)
- No Docker in production — Docker used for local development only

---

## Known Architectural Debt

| Item | File | Risk |
|---|---|---|
| `class_students` table (legacy) vs `class_members` (canonical) | `schema/classes.ts` vs `schema/classMembers.ts` | Medium |
| `journals.ts` (legacy) vs `teachingJournals.ts` (canonical) | `schema/index.ts` exports both | Low |
| `raports.ts` (legacy) vs `reportCards.ts` (canonical) | `schema/index.ts` exports both | Low |
| `getClassReportCards()` defined twice | `reportCardService.ts` lines 296 & 377 | Bug |
| `.env` committed to repo | `guruhub-api/.env` | 🔴 Security |
| No caching on Dashboard queries | `dashboardService.ts` | Performance |
