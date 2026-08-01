# 08 — Coding Rules

> Source: All files in `guruhub-api/src/`, `front-guruhub/src/`, `front-guruhub-mobile/src/`
> Cross-ref: [01_System_Architecture](01_System_Architecture.md) | [05_MultiTenant](05_MultiTenant.md) | [09_ProjectMap](09_ProjectMap.md)

---

## These rules are non-negotiable.

Every AI session, every developer, every code review must enforce these rules. Deviating from them breaks architectural consistency and introduces security vulnerabilities.

---

## Backend Rules (`guruhub-api/`)

### Rule 1 — Every query MUST filter by schoolId

```typescript
// ✅ CORRECT
const result = await db.select()
  .from(teachers)
  .where(and(eq(teachers.schoolId, schoolId), isNull(teachers.deletedAt)));

// ❌ WRONG — missing schoolId filter
const result = await db.select().from(teachers).where(isNull(teachers.deletedAt));
```

No exceptions. Even for lookups inside services that call other modules.

---

### Rule 2 — Every module must follow the Clean Architecture pattern

```
routes → controller → service → repository → DB
```

- **Controller:** receives request, validates input via DTO, calls service, returns response. No business logic.
- **Service:** all business logic, orchestration, cross-entity validation. No direct DB access (exception: large services like dashboard, report-cards, grade-engine that aggregate many tables).
- **Repository:** only Drizzle ORM queries. No business logic. Always filtered by `schoolId`.

---

### Rule 3 — Soft delete is the default

All mutations that remove data must use soft delete:

```typescript
// ✅ CORRECT — soft delete
await db.update(teachers).set({ deletedAt: new Date() }).where(eq(teachers.id, id));

// ❌ WRONG — hard delete
await db.delete(teachers).where(eq(teachers.id, id));
```

**Exceptions where hard delete is used intentionally:**
- `attendance`: `hardDeleteAttendance()` — attendances are hard-deleted by design
- `users`: `UserRepository.delete()` — user accounts are hard-deleted
- `subject_teachers`: no soft-delete column exists

---

### Rule 4 — Student soft-delete must nullify NISN

```typescript
// ✅ CORRECT — from studentsRepository.ts
await db.update(students)
  .set({ deletedAt: new Date(), nisn: null })
  .where(eq(students.id, id));

// ❌ WRONG — leaving NISN intact blocks re-registration
await db.update(students).set({ deletedAt: new Date() }).where(eq(students.id, id));
```

---

### Rule 5 — Tenant isolation must be validated at service layer for cross-entity operations

When a service fetches a related entity (student, class, academic year), it must check the entity belongs to the same school:

```typescript
// ✅ CORRECT
if (student.schoolId !== schoolId) {
  throw new ForbiddenError("Akses ditolak (Tenant Isolation)");
}

// ❌ WRONG — assuming the DB query alone is sufficient
```

---

### Rule 6 — Use custom error classes, not raw HTTP status codes

Source: `src/errors/customErrors.ts`

```typescript
// ✅ CORRECT
throw new NotFoundError("Siswa tidak ditemukan");
throw new ForbiddenError("Akses ditolak");
throw new ConflictError("Siswa sudah terdaftar di kelas ini");
throw new BadRequestError("Data tidak valid");

// ❌ WRONG
set.status = 404;
return { error: "not found" };
```

---

### Rule 7 — RBAC guard pattern is standardized

Always use `requireRoles([...])` in route groups, not in individual routes (unless the route has different access from the group):

```typescript
// ✅ CORRECT
.group("", (app) => app
  .guard({ beforeHandle: requireRoles(["SuperAdmin", "SchoolAdmin", "Principal"]) })
  .post("/", controller.create, { body: CreateDto })
  .put("/:id", controller.update)
)

// ❌ WRONG — mixing ad-hoc auth logic in controller
if (user.role !== "SuperAdmin") return { error: "forbidden" };
```

---

### Rule 8 — Always use `isNull(table.deletedAt)` in queries, never `deletedAt = null`

```typescript
// ✅ CORRECT — Drizzle ORM
.where(and(eq(teachers.schoolId, schoolId), isNull(teachers.deletedAt)))

// ❌ WRONG — Drizzle does not support this syntax safely
.where(eq(teachers.deletedAt, null))
```

---

### Rule 9 — `class_members` is canonical, `class_students` is legacy

```typescript
// ✅ CORRECT
import { classMembers } from "../../../schema/classMembers";

// ❌ WRONG — legacy table, do not use in new code
import { classStudents } from "../../../schema/classes";
```

---

### Rule 10 — Teacher context must be resolved via `getTeacherIdFromUserId()`

Never assume `user.id === teacherId`. The teacher profile is a separate record:

```typescript
// ✅ CORRECT
const teacherId = await getTeacherIdFromUserId(schoolId, user.id);

// ❌ WRONG
const teacherId = user.id;
```

---

### Rule 11 — Schema files: one table per file (or closely related tables)

- `schema/teachers.ts` → `teachers` table
- `schema/assessments.ts` → `assessments` + `assessment_scores` tables (related)
- `schema/reportCards.ts` → `report_cards` + related satellite tables

Do NOT add a new table to an existing unrelated schema file.

---

### Rule 12 — New modules must export from `schema/index.ts`

```typescript
// schema/index.ts — add your new table export here
export * from "./myNewTable";
```

---

## Frontend Rules (`front-guruhub/` and `front-guruhub-mobile/`)

### Rule 13 — Never hardcode API URLs in components or services

```typescript
// ✅ CORRECT
import { api } from "@/services/api";
api.get("/teachers");

// ❌ WRONG
fetch("http://localhost:8000/teachers");
```

---

### Rule 14 — Never store the access token in localStorage

The `api.ts` auth store is configured to exclude `accessToken` from persistence:

```typescript
// auth.store.ts — partialize must exclude accessToken
partialize: (state) => ({
  refreshToken: state.refreshToken,
  currentUser: state.currentUser,
  // accessToken intentionally excluded
})
```

If you add a new auth store field, check whether it should be persisted.

---

### Rule 15 — All API calls must go through `api.ts`, not raw `fetch`

```typescript
// ✅ CORRECT — auto-injects Authorization + x-school-id headers
import { api } from "@/services/api";
const data = await api.get("/teachers");

// ❌ WRONG — bypasses auth + tenant headers
const data = await fetch("/teachers");
```

---

### Rule 16 — Service files are thin HTTP wrappers only

```typescript
// ✅ CORRECT — services/teachers.ts
export const teachersService = {
  getAll: () => api.get("/teachers"),
  getById: (id: number) => api.get(`/teachers/${id}`),
  create: (data: any) => api.post("/teachers", data),
};

// ❌ WRONG — business logic in service
export const teachersService = {
  getAll: async () => {
    const data = await api.get("/teachers");
    return data.filter(t => t.status === "Aktif"); // No filtering here
  }
};
```

---

### Rule 17 — Types must be defined in `src/types/index.ts`

Do not define ad-hoc interfaces inline in page components. All shared types must live in the central types file.

---

### Rule 18 — Web uses TanStack Query; Mobile uses useEffect

- **Web admin:** use `useQuery` and `useMutation` from `@tanstack/react-query` via `queries/*.query.ts`
- **Mobile PWA:** use direct `useEffect` + `useState` pattern (no TanStack Query installed)

Do not add TanStack Query to the mobile project.

---

### Rule 19 — Mobile PWA is light-mode locked

The mobile frontend enforces light mode. Do not add dark mode classes to mobile components. The web admin supports both.

---

### Rule 20 — Do not add new pages to the mobile PWA without architect approval

The mobile app is intentionally limited to 4 modules: Dashboard, Attendance, Assessments, Teaching Journals. New modules require an explicit decision, as they affect PWA bundle size, service worker scope, and teacher UX.

---

## Testing Rules

### Rule 21 — Integration tests go in `guruhub-api/tests/`

Use the Bun test runner. File naming: `<module>.test.ts`.

```typescript
// Correct test structure
import { describe, it, expect, beforeAll, afterAll } from "bun:test";
```

### Rule 22 — Tests must create their own seed data and clean up after

```typescript
beforeAll(async () => {
  // Create school, user, teacher, etc.
});

afterAll(async () => {
  // Delete all test data
});
```

### Rule 23 — Tests must cover RBAC boundary cases

For every endpoint that restricts roles, there must be a test that verifies a forbidden role receives `403`.

---

## Migration Rules

### Rule 24 — Never modify an already-applied migration file

Drizzle Kit tracks applied migrations by filename. Modifying an existing file will break the migration history. Always create a new migration.

### Rule 25 — Test migrations on a copy of production data before applying

The production database is MariaDB. Always verify MySQL 8.4 compatibility.

### Rule 26 — Migration filenames must describe the change

```
✅ 0007_drop_teaching_journals_unique_index.sql
❌ 0007_migration.sql
```
