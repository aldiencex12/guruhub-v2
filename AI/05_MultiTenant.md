# 05 — Multi-Tenant Design

> Source: `src/middleware/tenant.ts`, `src/middleware/auth.ts`, all repository files
> Cross-ref: [01_System_Architecture](01_System_Architecture.md) | [02_Database](02_Database.md) | [04_RBAC](04_RBAC.md)

---

## Strategy: Shared Database, Shared Schema

GuruHub uses a **Shared Database, Shared Schema** multi-tenant model. All schools share one MySQL database and one set of tables. Isolation is enforced programmatically, not structurally.

Every tenant-scoped table has:
```sql
school_id BIGINT UNSIGNED NOT NULL REFERENCES schools(id) ON DELETE CASCADE
```

The `schools` table is the **tenant root**. Its primary key is the `school_id` that flows through every other table.

---

## Isolation Enforcement — Two Independent Layers

### Layer 1: Tenant Middleware

Source: `src/middleware/tenant.ts`

- Reads `x-school-id` header from every request
- Validates the school ID exists in the `schools` table
- Injects `schoolId` and `schoolName` into the Elysia request context
- Returns `400 Bad Request` if header is missing or school does not exist

This runs **before** auth middleware.

### Layer 2: Auth Middleware

Source: `src/middleware/auth.ts`

- Reads `Authorization: Bearer <token>`
- Decodes and verifies the JWT
- Checks `payload.schoolId === context.schoolId` (the school injected by Layer 1)
- Returns `403 Forbidden` if the values do not match
- Injects full `user` object into context

**This cross-check is the critical security control.** A valid JWT from School A cannot be used to access School B's data, even if the attacker provides School B's `x-school-id` header — because the JWT payload will contain School A's ID, which will not match.

---

## Layer 3: Repository-Level Enforcement

Every Drizzle ORM query in every repository MUST include the `school_id` filter:

```typescript
// Correct pattern — from every repository in the codebase
const result = await db.select()
  .from(teachers)
  .where(and(
    eq(teachers.schoolId, schoolId),   // ← tenant filter ALWAYS present
    isNull(teachers.deletedAt)
  ));
```

This is the last line of defense. Even if the middleware layers were bypassed (e.g., in a unit test), the repository layer still scopes the data.

### Service Cross-Entity Validation

When a service method fetches a related entity (e.g., fetching a `Student` to validate it before creating a `ClassMember`), it also verifies tenant ownership:

```typescript
// From classMembersService.ts
if (student.schoolId !== schoolId) {
  throw new BadRequestError("Siswa harus berasal dari sekolah yang sama");
}
```

This pattern appears consistently in: `classMembersService`, `reportCardService`, `gradeEngineService`, `assessmentsService`.

---

## Tenant Data Flow Per Request

```
Request arrives
  │
  ├─ x-school-id: 7
  │
  ▼
tenant.ts
  ├─ SELECT * FROM schools WHERE id = 7
  ├─ context.schoolId = 7
  └─ context.schoolName = "SMP Negeri 1 ..."
  │
  ▼
auth.ts
  ├─ Decode JWT → payload = { userId: 42, schoolId: 7, role: "Teacher", ... }
  ├─ payload.schoolId (7) === context.schoolId (7) ✅
  └─ context.user = { id: 42, schoolId: 7, role: "Teacher", ... }
  │
  ▼
Controller → Service → Repository
  └─ All queries: WHERE school_id = 7
```

If `x-school-id: 99` is sent but the JWT contains `schoolId: 7`:
```
auth.ts: payload.schoolId (7) !== context.schoolId (99) → 403 Forbidden
```

---

## Token-Embedded School ID

The school ID is embedded in the JWT at login time:

```typescript
// authService.ts — login()
const accessToken = generateAccessToken({
  userId: user.id,
  email: user.email,
  role: user.role,
  schoolId: schoolId,   // ← embedded in token
});
```

The school ID is **also embedded in the refresh token**. Token refresh re-issues tokens with the same `schoolId`. A user cannot switch schools without logging out and logging back in with a different `x-school-id`.

---

## Login Flow and School Resolution

The `POST /auth/login` endpoint requires the `x-school-id` header to identify which school the user belongs to. The login does NOT accept `schoolId` in the request body — it reads it from the tenant middleware context.

```
POST /auth/login
Headers: x-school-id: 7
Body: { email: "guru@sekolah.com", password: "..." }

→ authService.login(email, password)
→ authRepo.findUserByEmail(schoolId=7, email)
→ validates password
→ creates session in `sessions` table (schoolId=7)
→ returns { accessToken, refreshToken, user }
```

---

## SuperAdmin Cross-Tenant Capability

`SuperAdmin` is not bound to a single school in the RBAC matrix. However, the **tenant middleware still requires a valid `x-school-id` header**. SuperAdmin must specify which school they are acting on per request.

There is no current mechanism for SuperAdmin to query across all schools in a single request. All data access remains school-scoped even for SuperAdmin.

---

## Cascade Delete Behavior

All FK relationships from `schools.id` use `ON DELETE CASCADE`. If a school record is hard-deleted, all of its data across all tables is automatically removed by MySQL.

**Note:** Hard-deleting a school should never be done without a full data export. This operation is irreversible.

---

## Audit Log and School Scope

`audit_logs.school_id` is **nullable** (set to NULL for global SuperAdmin actions that are not school-specific). This is the only table where `school_id` is not strictly required. All other tables enforce `NOT NULL`.

---

## NISN Global Uniqueness Exception

The `students.nisn` (National Student ID) field is the **only uniquely constrained field without school scoping**. NISN must be globally unique across all schools.

To handle soft-delete conflicts:
- On student soft-delete: `UPDATE students SET nisn = NULL WHERE id = ?`
- This frees the NISN for re-use if the student re-registers

This behavior was implemented in migration 0005 and the NISN soft-delete fix script.
