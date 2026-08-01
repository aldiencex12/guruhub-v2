# GuruHub — Official Coding Bible

> Authored by: Lead Software Architect  
> Last updated: 2026-07-23  
> Basis: Full source code analysis of `guruhub-api`, `front-guruhub`, and `front-guruhub-mobile`.  
> Cross-ref: [01_System_Architecture](01_System_Architecture.md) | [02_Database](02_Database.md) | [04_RBAC](04_RBAC.md) | [05_MultiTenant](05_MultiTenant.md) | [08_CodingRules](08_CodingRules.md)

---

## Table of Contents
1. [Project Philosophy](#1-project-philosophy)
2. [Folder Conventions](#2-folder-conventions)
3. [Naming Conventions](#3-naming-conventions)
4. [Error Handling](#4-error-handling)
5. [Validation](#5-validation)
6. [Authentication](#6-authentication)
7. [Authorization & RBAC](#7-authorization--rbac)
8. [Service Pattern](#8-service-pattern)
9. [Repository Pattern](#9-repository-pattern)
10. [Database Pattern](#10-database-pattern)
11. [Frontend Architecture & Patterns](#11-frontend-architecture--patterns)
12. [State Management](#12-state-management)
13. [API Pattern](#13-api-pattern)
14. [File Naming Rules](#14-file-naming-rules)
15. [Component Naming Rules](#15-component-naming-rules)
16. [Migration Strategy](#16-migration-strategy)
17. [Testing Strategy](#17-testing-strategy)
18. [Future Development Guidelines](#18-future-development-guidelines)

---

## 1. Project Philosophy

GuruHub is designed as a **production-grade, multi-tenant SaaS school management engine** tailored for Indonesian secondary education (SMP/SMA) under Kurikulum Merdeka. The platform prioritizes **tenant isolation, architectural consistency, and extreme reliability** over ad-hoc feature speed.

### Core Tenets:
1. **Tenant Isolation First**: No query, mutation, or API request shall ever bypass `school_id` filtering. Data leakage across tenants is a critical failure.
2. **Explicit over Implicit**: Business rules (e.g., student active membership limits, weight validations, lock states) must be explicitly enforced in the service layer, not left to client-side assumptions.
3. **Canonical Truth**: Duplicate abstractions (e.g., legacy tables like `class_students`, `journals`, `raports`) are strictly forbidden in new development. Always use canonical models (`class_members`, `teaching_journals`, `report_cards`).
4. **Resilient UI Experience**: Frontend client components must maintain high visual polish, light/dark accessibility, smooth micro-interactions, and instant feedback without manual page reloads.

---

## 2. Folder Conventions

The workspace is organized into three decoupled repositories:

```
project/
├── AI/                          # Architectural Knowledge Base & Bibles
├── guruhub-api/                 # Backend REST API (Bun, ElysiaJS, Drizzle ORM)
├── front-guruhub/               # Desktop Web Admin Panel (Next.js 16 App Router)
└── front-guruhub-mobile/        # Mobile PWA for Teachers (Next.js 16 App Router)
```

### 2.1 Backend (`guruhub-api/src/`)
- `db/`: Database connection instance export (`db`).
- `schema/`: One Drizzle ORM schema file per entity.
- `middleware/`: Global context interceptors (`auth.ts`, `tenant.ts`).
- `errors/`: Custom error classes extending `CustomError`.
- `utils/`: Common helpers (`jwt.ts`, `password.ts`, `rbac.ts`, `gradeCalculator.ts`).
- `modules/`: Modular feature domains. Standard structure:
  ```
  modules/<module-name>/
  ├── controller/   # Route handling, input extraction, HTTP responses
  ├── dto/          # TypeBox request/response validation schemas
  ├── service/      # Core business logic & orchestration
  ├── repository/   # Database access layer (Drizzle ORM)
  └── routes/       # ElysiaJS endpoint definitions & RBAC guards
  ```

### 2.2 Frontend Web (`front-guruhub/src/`)
- `app/`: Next.js App Router layout & route pages.
  - `(auth)/`: Unauthenticated auth routes.
  - `(dashboard)/`: Authenticated dashboard layout shell.
- `components/`: UI component library (layout, UI primitives, tables, cards, dialogs, forms).
- `queries/`: TanStack Query hooks (1 file per module domain).
- `services/`: Axios/Fetch API client wrappers.
- `store/`: Zustand state management modules (`auth.store.ts`, `ui.store.ts`).
- `types/`: Shared TypeScript type definitions (`index.ts`).

---

## 3. Naming Conventions

### 3.1 Code Identifiers (Strictly English)
- **Variables & Functions**: `camelCase` (e.g., `calculateStudentFinalGrade`, `getTeacherIdFromUserId`).
- **Classes & Interfaces & Types**: `PascalCase` (e.g., `ClassMembersService`, `UserContext`, `StudentProfile`).
- **Database Tables**: `snake_case` plural (e.g., `class_members`, `student_final_grades`, `teaching_journals`).
- **Database Columns**: `snake_case` (e.g., `school_id`, `academic_year_id`, `deleted_at`).
- **DTO Schemas**: `PascalCase` with `Dto` suffix (e.g., `CreateStudentDto`, `UpdateTeacherDto`).
- **Route Handlers**: `camelCase` matching action verbs (e.g., `getAll`, `getById`, `create`, `update`, `delete`).

### 3.2 User-Facing Text (Strictly Bahasa Indonesia)
All error messages, UI labels, toasts, options, and status strings presented to users must be in proper Bahasa Indonesia (e.g., `"Siswa tidak ditemukan"`, `"Membership kelas sudah ada"`).

---

## 4. Error Handling

### 4.1 Custom Error Hierarchy (`guruhub-api/src/errors/customErrors.ts`)
Never throw raw generic JavaScript errors or manually construct HTTP error responses inside services. Use the standardized error hierarchy:

```typescript
export class CustomError extends Error {
  constructor(message: string, public statusCode: number) {
    super(message);
  }
}

export class NotFoundError extends CustomError {
  constructor(message: string = "Data tidak ditemukan") {
    super(message, 404);
  }
}

export class BadRequestError extends CustomError {
  constructor(message: string = "Input tidak valid") {
    super(message, 400);
  }
}

export class UnauthorizedError extends CustomError {
  constructor(message: string = "Sesi tidak valid") {
    super(message, 401);
  }
}

export class ForbiddenError extends CustomError {
  constructor(message: string = "Akses ditolak") {
    super(message, 403);
  }
}

export class ConflictError extends CustomError {
  constructor(message: string = "Data sudah ada") {
    super(message, 409);
  }
}
```

### 4.2 Global Error Interceptor (`guruhub-api/src/index.ts`)
The root Elysia instance catches all unhandled errors:
- `CustomError` instances → Automatically formatted with `statusCode` and JSON payload: `{ success: false, error: message }`.
- `VALIDATION` errors → Formatted as HTTP `400 Bad Request` with structured TypeBox failure details.
- Unexpected Exceptions → Logged with stack trace and returned as HTTP `500 Internal Server Error`.

---

## 5. Validation

### 5.1 DTO Schemas (Elysia TypeBox)
All request payloads (body, query, params) must be validated using Elysia's `t` schema builder:

```typescript
// modules/teachers/dto/teachersDto.ts
import { t } from "elysia";

export const CreateTeacherDto = t.Object({
  name: t.String({ minLength: 1, error: "Nama wajib diisi" }),
  nip: t.Optional(t.String()),
  gender: t.Union([t.Literal("L"), t.Literal("P")]),
  phone: t.Optional(t.String())
});
```

### 5.2 Business & State Validation
Validation of entity state, tenant boundaries, and relational consistency must happen in the **Service Layer**:
```typescript
// Validate tenant boundaries across foreign keys
if (cls.schoolId !== schoolId) {
  throw new BadRequestError("Kelas harus berasal dari sekolah yang sama");
}
```

---

## 6. Authentication

### 6.1 Token Lifecycle & Security
- **Access Token**: Short-lived (15 minutes). Payload includes: `{ userId, email, role, schoolId, type: "access" }`. Transmitted via `Authorization: Bearer <token>` header.
- **Refresh Token**: Long-lived (7 days). Payload includes: `{ tokenId, userId, schoolId, type: "refresh" }`. Transmitted in request body.
- **Token Rotation**: Every refresh request revokes the old session (`is_revoked = true`) and issues a new token pair.

### 6.2 Session Management (`sessions` Table)
Every login generates a session record containing `token_id` (UUID), `user_id`, `school_id`, `ip_address`, `user_agent`, and `expires_at`. Revoking a session invalidates all refresh attempts using that token chain.

---

## 7. Authorization & RBAC

### 7.1 Role Hierarchy
Defined in `users.role` ENUM:
`SuperAdmin` > `SchoolAdmin` > `Principal` > `HomeroomTeacher` > `Teacher` > `Student`

### 7.2 Route Guards (`requireRoles`)
Guard decorators restrict access at the endpoint group level:
```typescript
.group("", (app) => app
  .guard({
    beforeHandle: requireRoles(["SuperAdmin", "SchoolAdmin", "Principal"])
  })
  .post("/", controller.create)
  .delete("/:id", controller.delete)
)
```

### 7.3 Ownership & Teacher Scoping (`getTeacherIdFromUserId`)
For `Teacher` and `HomeroomTeacher` roles, static role checks are insufficient. The service layer must map `user.id` to `teacher.id`:
```typescript
const teacherId = await getTeacherIdFromUserId(schoolId, user.id);
```
Queries for attendance, journals, assessments, and schedules must be scoped using this resolved `teacherId`.

---

## 8. Service Pattern

### 8.1 Responsibilities
Services encapsulate all core domain logic, transactional boundaries, entity verification, cross-module calculations, and audit logging.

### 8.2 Standard Signature & Rules
- Always accept `schoolId: number` as the first parameter for tenant-scoped operations.
- Always accept `user: UserContext` when role-aware filtering or ownership enforcement is required.
- Do NOT read HTTP headers or raw request objects inside services.

```typescript
export class ClassMembersService {
  private repository = new ClassMembersRepository();

  async createClassMember(
    schoolId: number,
    data: Omit<typeof classMembers.$inferInsert, "schoolId" | "id">
  ) {
    // 1. Validate entities exist and match tenant
    // 2. Validate business rules (e.g. max 1 active membership)
    // 3. Invoke repository creation
  }
}
```

---

## 9. Repository Pattern

### 9.1 Responsibilities
Repositories contain pure database query methods using Drizzle ORM. They contain **zero HTTP logic** and **zero complex business decisions**.

### 9.2 Rule of Tenant Scope
Every query inside a repository MUST include `eq(table.schoolId, schoolId)`:

```typescript
export class TeachersRepository {
  async findAll(schoolId: number, filters: { page: number; limit: number; search?: string }) {
    const conditions = [
      eq(teachers.schoolId, schoolId),
      isNull(teachers.deletedAt)
    ];

    if (filters.search) {
      conditions.push(like(teachers.name, `%${filters.search}%`));
    }

    return await db.select().from(teachers).where(and(...conditions));
  }
}
```

---

## 10. Database Pattern

### 10.1 Engine & ORM
- Engine: MySQL 8.4 (MariaDB production compatible).
- ORM: Drizzle ORM with `drizzle-kit` for schema management.

### 10.2 Soft Delete Standard
Entities supporting soft deletion include a `deleted_at TIMESTAMP NULL` field.
- **Query Rule**: Always wrap conditions with `isNull(table.deletedAt)`.
- **Student Soft Delete Exception**: When soft-deleting a student, `nisn` MUST be explicitly set to `NULL` to avoid unique constraint violations on re-registration.

### 10.3 Primary Key & Foreign Key Conventions
- Primary Keys: `serial("id")` (Unsigned BigInt / Serial).
- Foreign Keys: `bigint("xxx_id", { mode: "number", unsigned: true })` referencing target parent PK with explicit deletion rules (`ON DELETE CASCADE` or `ON DELETE SET NULL`).

---

## 11. Frontend Architecture & Patterns

### 11.1 Directory & Layout Architecture
- `front-guruhub`: Web dashboard using Next.js App Router, TailwindCSS v4, Zustand, and TanStack React Query.
- `front-guruhub-mobile`: Mobile PWA for teachers using Next.js App Router, TailwindCSS, and light-mode layout constraints.

### 11.2 API Client (`services/api.ts`)
All network requests MUST go through the central API client instance.
- Automatic injection of `Authorization: Bearer <accessToken>` and `x-school-id: <schoolId>` headers.
- Response Interceptor: Listens for 401 Unauthorized errors, automatically executes token refresh, updates Zustand state, and retries failed requests.

### 11.3 TanStack Query Hooks (`queries/*.query.ts`)
State caching and remote data fetching on the web frontend must be managed via React Query hooks:
```typescript
export function useTeachers(params: TeacherQueryParams) {
  return useQuery({
    queryKey: ["teachers", params],
    queryFn: () => teachersService.getAll(params)
  });
}
```

---

## 12. State Management

### 12.1 Zustand Auth Store (`store/auth.store.ts`)
Manages global authentication tokens and user profiles:
- **Persisted Keys**: `refreshToken`, `currentUser`, `schoolId`.
- **In-Memory Key**: `accessToken` (EXCLUDED from `localStorage` persistence for security).

### 12.2 Zustand UI Store (`store/ui.store.ts`)
Manages ephemeral layout states like sidebar open/close status, active modals, and temporary filter preferences.

---

## 13. API Pattern

### 13.1 Standard Success Response
```json
{
  "success": true,
  "message": "Data berhak dioperasikan",
  "data": { ... },
  "pagination": {
    "totalItems": 100,
    "totalPages": 10,
    "currentPage": 1,
    "limit": 10
  }
}
```

### 13.2 Standard Error Response
```json
{
  "success": false,
  "error": "Pesan kesalahan deskriptif"
}
```

---

## 14. File Naming Rules

- **Backend Modules**: `camelCase` for directories (`class-members`, `teaching-journals`, `assessment-categories`).
- **Backend Schema Files**: `camelCase.ts` (e.g., `classMembers.ts`, `studentFinalGrades.ts`).
- **Backend Service Files**: `camelCaseService.ts` (e.g., `classMembersService.ts`).
- **Backend Controller Files**: `camelCaseController.ts` (e.g., `classMembersController.ts`).
- **Backend Repository Files**: `camelCaseRepository.ts` (e.g., `classMembersRepository.ts`).
- **Frontend Query Files**: `domain.query.ts` (e.g., `class-members.query.ts`).
- **Frontend Service Files**: `domain.ts` (e.g., `class-members.ts`).

---

## 15. Component Naming Rules

- **React Component Files**: `PascalCase.tsx` (e.g., `TeacherTable.tsx`, `StudentFormModal.tsx`).
- **Export Pattern**: Named exports preferred over default exports for components.
- **Component Subdirectories**: Organized by purpose (`components/ui/`, `components/tables/`, `components/dialogs/`, `components/forms/`).

---

## 16. Migration Strategy

1. **Schema Changes**: Modify schema files inside `guruhub-api/src/schema/`.
2. **Generate Migration**: Run `bunx drizzle-kit generate` in `guruhub-api/`.
3. **Inspect Output**: Verify SQL generated in `guruhub-api/migrations/XXXX_*.sql`.
4. **Apply Migration**: Run `bunx drizzle-kit migrate` against target environment.
5. **Never Mutate History**: Do NOT edit already-executed migration SQL files. Always append new migrations.

---

## 17. Testing Strategy

- **Test Runner**: Bun test runner (`bun test`).
- **Test Directory**: `guruhub-api/tests/`.
- **Scope**: Integration tests for endpoints, tenant isolation, and RBAC boundary verification.
- **Rule**: Tests must seed required tenant fixtures (`school`, `user`, `teacher`/`student`) and perform cleanup upon execution completion.

---

## 18. Future Development Guidelines

### 18.1 Adding a New Business Feature
1. Verify domain placement in `06_Modules.md` and `11_ProjectMap_ByDomain.md`.
2. Define Drizzle schema file in `src/schema/` and export via `src/schema/index.ts`.
3. Generate and apply migration script.
4. Construct DTO validation, Repository, Service, Controller, and Route modules inside `src/modules/<feature>/`.
5. Register route module in `src/index.ts`.
6. Add service wrapper and query hook on frontend (`services/` & `queries/`).
7. Construct responsive Next.js dashboard page and components.

### 18.2 Impact Analysis Requirement
Before submitting code changes, engineers must document:
1. Reason for modification.
2. Affected modules, APIs, database tables, and frontend pages.
3. Security, RBAC, and Multi-Tenant implications.
4. Testing & verification strategy.
