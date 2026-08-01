# 09 — Project Map

> Source: All `src/` directories, `package.json` files, `next.config.*`, `tsconfig.json`
> Cross-ref: [01_System_Architecture](01_System_Architecture.md) | [06_Modules](06_Modules.md) | [08_CodingRules](08_CodingRules.md)

---

## Workspace Root (`/home/encex12/project/`)

```
project/
├── AI/                          ← This knowledge base
├── guruhub-api/                 ← Backend REST API (Bun + ElysiaJS)
├── front-guruhub/               ← Web Admin Dashboard (Next.js)
├── front-guruhub-mobile/        ← Mobile PWA (Next.js + next-pwa)
├── DATABASE.md                  ← Legacy database notes (user-maintained)
└── README.md                    ← (missing — should be created)
```

---

## Backend: `guruhub-api/`

```
guruhub-api/
├── src/
│   ├── index.ts                 ← Entry point; registers all modules; PORT 8000
│   ├── db/
│   │   └── index.ts             ← Drizzle ORM connection (DATABASE_URL)
│   ├── schema/                  ← One file per DB entity
│   │   ├── index.ts             ← Exports all schemas
│   │   ├── schools.ts
│   │   ├── users.ts
│   │   ├── sessions.ts
│   │   ├── auditLogs.ts
│   │   ├── teachers.ts
│   │   ├── students.ts
│   │   ├── subjects.ts          ← Also exports subjectTeachers
│   │   ├── classes.ts           ← Also exports classStudents (LEGACY)
│   │   ├── classMembers.ts      ← CANONICAL class membership
│   │   ├── academicYears.ts
│   │   ├── schedules.ts
│   │   ├── attendances.ts       ← Also exports attendanceDetails
│   │   ├── teachingJournals.ts  ← CANONICAL journals
│   │   ├── assessmentCategories.ts
│   │   ├── assessments.ts       ← Also exports assessmentScores
│   │   ├── studentFinalGrades.ts
│   │   ├── reportCards.ts       ← Also exports: reportCardSubjects,
│   │   │                          reportCardAttendances, extracurriculars,
│   │   │                          studentExtracurriculars, studentAchievements,
│   │   │                          p5Projects
│   │   ├── notifications.ts     ← Schema only; no module built yet
│   │   ├── journals.ts          ← LEGACY — do not use
│   │   └── raports.ts           ← LEGACY — do not use
│   ├── middleware/
│   │   ├── auth.ts              ← JWT verification + RBAC guard (requireRoles)
│   │   └── tenant.ts            ← x-school-id header validation
│   ├── errors/
│   │   └── customErrors.ts      ← NotFoundError, ForbiddenError, ConflictError,
│   │                              BadRequestError, UnauthorizedError
│   ├── utils/
│   │   ├── jwt.ts               ← generateAccessToken(), generateRefreshToken(), verifyToken()
│   │   ├── password.ts          ← hashPassword(), comparePassword()
│   │   ├── rbac.ts              ← UserContext type, getTeacherIdFromUserId()
│   │   ├── gradeCalculator.ts   ← calculateGradeLetter(score): 'A'|'B'|'C'|'D'
│   │   └── reportDescriptionGenerator.ts ← generateReportDescription(score): string
│   └── modules/
│       ├── auth/
│       │   ├── controller/authController.ts
│       │   ├── service/authService.ts
│       │   ├── repository/authRepository.ts
│       │   └── dto/authDto.ts
│       ├── teachers/
│       │   ├── controller/teachersController.ts
│       │   ├── service/teachersService.ts
│       │   ├── repository/teachersRepository.ts
│       │   ├── dto/teachersDto.ts
│       │   └── routes/teachersRoutes.ts
│       ├── students/            ← same 5-file structure
│       ├── classes/             ← same 5-file structure
│       ├── class-members/       ← same 5-file structure
│       ├── subjects/            ← same 5-file structure
│       ├── academic-years/      ← same 5-file structure
│       ├── schedules/           ← same 5-file structure
│       ├── attendance/          ← same 5-file structure
│       ├── teaching-journals/   ← same 5-file structure
│       ├── assessment-categories/ ← same 5-file structure
│       ├── assessments/         ← same 5-file structure
│       ├── users/               ← same 5-file structure
│       ├── grade-engine/        ← NO repository (service queries DB directly)
│       │   ├── controller/gradeEngineController.ts
│       │   ├── service/gradeEngineService.ts
│       │   ├── dto/gradeEngineDto.ts
│       │   └── routes/gradeEngineRoutes.ts
│       ├── report-cards/        ← NO repository (service queries DB directly)
│       ├── dashboard/           ← NO repository (service queries DB directly)
│       ├── pdf-generator/       ← NO repository; uses Puppeteer
│       └── import/              ← Has repository (ImportRepository for reads)
├── migrations/
│   ├── 0000_breezy_tigra.sql
│   ├── 0001_spooky_morlocks.sql
│   ├── 0002_heavy_tomorrow_man.sql
│   ├── 0003_polite_marvel_apes.sql
│   ├── 0004_shiny_emma_frost.sql
│   ├── 0005_sharp_lorna_dane.sql
│   ├── 0006_lush_la_nuit.sql
│   └── 0007_drop_teaching_journals_unique_index.sql
├── tests/
│   ├── auth.test.ts
│   ├── attendance.test.ts
│   ├── grade-engine.test.ts
│   ├── teaching-journals.test.ts
│   └── [13 more test files]
├── docs/
│   ├── ARCHITECTURE_REVIEW.md
│   ├── DATABASE_SCHEMA.md
│   ├── GRADE_ENGINE_DOCUMENTATION.md
│   └── [19 more documentation files]
├── docker/
│   └── docker-compose.yml       ← MySQL 8.4 for local dev
├── drizzle.config.ts
├── package.json
├── tsconfig.json
└── .env                         ← ⚠️ Committed to repo — security risk
```

---

## Web Admin: `front-guruhub/`

```
front-guruhub/
├── src/
│   ├── app/
│   │   ├── layout.tsx            ← Root layout; font loading (Inter/Google Fonts)
│   │   ├── globals.css           ← TailwindCSS v4 base
│   │   ├── (auth)/
│   │   │   └── login/page.tsx    ← Public login page
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx        ← Auth guard + Sidebar + Header shell
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── teachers/page.tsx
│   │   │   ├── students/page.tsx
│   │   │   ├── classes/page.tsx
│   │   │   ├── class-members/page.tsx
│   │   │   ├── subjects/page.tsx
│   │   │   ├── academic-years/page.tsx
│   │   │   ├── schedules/page.tsx
│   │   │   ├── attendance/page.tsx
│   │   │   ├── teaching-journals/page.tsx
│   │   │   ├── assessment-categories/page.tsx
│   │   │   ├── assessments/page.tsx
│   │   │   ├── grade-engine/page.tsx
│   │   │   ├── report-cards/page.tsx
│   │   │   ├── promotions/page.tsx
│   │   │   ├── import/page.tsx
│   │   │   └── users/page.tsx
│   │   └── 403/page.tsx
│   ├── components/
│   │   ├── layouts/
│   │   │   ├── Sidebar.tsx       ← Navigation menu; role-aware visibility
│   │   │   └── Header.tsx        ← Top bar; user info; logout
│   │   ├── ui/                   ← Generic reusable components (Button, Modal, etc.)
│   │   ├── cards/
│   │   ├── charts/               ← Recharts wrappers
│   │   ├── dialogs/
│   │   ├── forms/
│   │   └── tables/               ← TanStack Table wrappers
│   ├── queries/                  ← TanStack Query hooks (one file per module)
│   │   ├── academic-years.query.ts
│   │   ├── assessment-categories.query.ts
│   │   ├── assessments.query.ts
│   │   ├── attendance.query.ts
│   │   ├── class-members.query.ts
│   │   ├── classes.query.ts
│   │   ├── dashboard.query.ts
│   │   ├── grade-engine.query.ts
│   │   ├── report-cards.query.ts
│   │   ├── schedules.query.ts
│   │   ├── students.query.ts
│   │   ├── subjects.query.ts
│   │   ├── teachers.query.ts
│   │   ├── teaching-journals.query.ts
│   │   └── users.query.ts
│   ├── services/                 ← HTTP wrappers (one file per module)
│   │   ├── api.ts                ← Base client; auth interceptor; token refresh
│   │   ├── academic-years.ts
│   │   ├── assessment-categories.ts
│   │   ├── assessments.ts
│   │   ├── attendance.ts
│   │   ├── class-members.ts
│   │   ├── classes.ts
│   │   ├── dashboard.ts
│   │   ├── grade-engine.ts
│   │   ├── import.ts
│   │   ├── pdf-generator.ts
│   │   ├── report-cards.ts
│   │   ├── schedules.ts
│   │   ├── students.ts
│   │   ├── subjects.ts
│   │   ├── teachers.ts
│   │   ├── teaching-journals.ts
│   │   └── users.ts
│   ├── store/
│   │   ├── auth.store.ts         ← Zustand; accessToken excluded from persist
│   │   └── ui.store.ts           ← Sidebar state, theme
│   ├── types/
│   │   └── index.ts              ← ALL shared TypeScript types (323 lines)
│   ├── hooks/                    ← Custom React hooks
│   ├── lib/
│   │   └── utils.ts              ← cn(), formatTime(), etc.
│   └── providers/
│       └── QueryProvider.tsx     ← TanStack React Query client provider
├── docs/                         ← Mirrored API docs (from guruhub-api/docs)
├── next.config.ts
├── tsconfig.json
├── package.json
└── next-fiture.md                ← Roadmap notes (internal)
```

---

## Mobile PWA: `front-guruhub-mobile/`

```
front-guruhub-mobile/
├── src/
│   ├── app/
│   │   ├── layout.tsx            ← Root layout; RegisterSW; BottomNavigation
│   │   ├── manifest.ts           ← PWA manifest (name, icons, theme)
│   │   ├── globals.css
│   │   ├── offline/page.tsx      ← Service worker offline fallback
│   │   ├── (auth)/
│   │   │   └── login/page.tsx
│   │   └── (dashboard)/
│   │       ├── layout.tsx        ← Mobile auth guard
│   │       ├── dashboard/page.tsx      ← Teacher dashboard + pending tasks
│   │       ├── attendance/page.tsx     ← Full attendance flow
│   │       ├── assessments/page.tsx    ← Score input (keyboard-optimized)
│   │       └── teaching-journals/page.tsx
│   ├── components/
│   │   ├── BottomNavigation.tsx  ← 4-tab bottom nav bar
│   │   ├── MobileHeader.tsx
│   │   ├── SplashScreen.tsx
│   │   ├── RegisterSW.tsx        ← Service worker registration
│   │   └── PrintHeader.tsx       ← Print-specific header for PDF views
│   ├── services/                 ← Identical to web (api.ts + per-module)
│   ├── store/
│   │   ├── auth.store.ts         ← Identical to web
│   │   └── ui.store.ts
│   ├── types/                    ← Subset of web types
│   └── lib/
│       └── utils.ts              ← formatTime() (strips seconds from HH:MM:SS)
├── public/
│   ├── icons/                    ← PWA icons (192x192, 512x512, maskable)
│   └── splash/                   ← Splash screen images
├── AGENTS.md                     ← AI agent note: Next.js may have breaking API changes
├── CLAUDE.md                     ← References AGENTS.md
├── next.config.ts                ← next-pwa configuration
├── tsconfig.json
└── package.json
```

---

## Key File Locations Quick Reference

| Need | File |
|---|---|
| Add a new API route | `guruhub-api/src/modules/<name>/routes/<name>Routes.ts` |
| Register a new module | `guruhub-api/src/index.ts` |
| Add a new DB table | `guruhub-api/src/schema/<name>.ts` + export in `schema/index.ts` |
| Run migrations | `cd guruhub-api && bunx drizzle-kit migrate` |
| Generate migration | `cd guruhub-api && bunx drizzle-kit generate` |
| Add a new frontend page | `front-guruhub/src/app/(dashboard)/<name>/page.tsx` |
| Add a new query hook | `front-guruhub/src/queries/<name>.query.ts` |
| Add a new service | `front-guruhub/src/services/<name>.ts` |
| Add a new type | `front-guruhub/src/types/index.ts` |
| Run backend | `cd guruhub-api && bun run dev` |
| Run web admin | `cd front-guruhub && npm run dev` |
| Run mobile PWA | `cd front-guruhub-mobile && npm run dev` |
| Run tests | `cd guruhub-api && bun test` |
| View API docs | `http://localhost:8000/swagger` |
