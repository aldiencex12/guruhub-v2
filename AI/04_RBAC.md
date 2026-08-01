# 04 — RBAC (Role-Based Access Control)

> Source: `src/middleware/auth.ts`, `src/utils/rbac.ts`, all `routes/*.ts` files
> Cross-ref: [03_API](03_API.md) | [05_MultiTenant](05_MultiTenant.md) | [06_Modules](06_Modules.md)

---

## Role Definitions

Roles are defined as a MySQL ENUM on the `users.role` column:

```sql
ENUM('SuperAdmin','SchoolAdmin','Principal','Teacher','HomeroomTeacher','Student')
```

| Role | Indonesian Name | Scope |
|---|---|---|
| `SuperAdmin` | Super Administrator | Cross-school platform admin |
| `SchoolAdmin` | Administrator Sekolah | Full access within one school |
| `Principal` | Kepala Sekolah | Read/approve within one school |
| `HomeroomTeacher` | Wali Kelas | Own homeroom class + report cards |
| `Teacher` | Guru | Own schedules, attendance, journals, assessments |
| `Student` | Siswa | Read-only personal data (student portal not fully built) |

---

## Enforcement Mechanism

RBAC is enforced at **two levels**:

### Level 1 — Route Guard (`requireRoles`)

Source: `src/middleware/auth.ts`

```typescript
export function requireRoles(roles: string[]) {
  return ({ user, set }: any) => {
    if (!user) { set.status = 401; return { error: "Unauthorized" }; }
    if (!roles.includes(user.role)) { set.status = 403; return { error: "Forbidden" }; }
  };
}
```

Applied in route files as `beforeHandle: requireRoles([...])`.

### Level 2 — Service-Level Ownership Check

For `Teacher` and `HomeroomTeacher`, route access alone is not sufficient. The service layer also checks ownership:

```typescript
// src/utils/rbac.ts
export async function getTeacherIdFromUserId(schoolId: number, userId: number): Promise<number> {
  const result = await db.select({ id: teachers.id })
    .from(teachers)
    .where(and(eq(teachers.userId, userId), eq(teachers.schoolId, schoolId), isNull(teachers.deletedAt)))
    .limit(1);
  if (!result[0]) throw new ForbiddenError("Profil guru tidak ditemukan");
  return result[0].id;
}
```

This is called in: `attendance`, `teaching-journals`, `assessments`, `assessment-categories`, `class-members`, `schedules`, `report-cards`, `dashboard`.

---

## RBAC Matrix

✅ = Full access | 👁 = Read own only | 🔒 = Blocked | — = Not applicable

| Endpoint Area | SuperAdmin | SchoolAdmin | Principal | HomeroomTeacher | Teacher | Student |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| **Auth - Login/Refresh/Logout** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Auth - /me** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Users CRUD** | ✅ | ✅ | 🔒 | 🔒 | 🔒 | 🔒 |
| **Teachers - Read** | ✅ | ✅ | ✅ | ✅ | ✅ | 🔒 |
| **Teachers - Write/Delete** | ✅ | ✅ | ✅ | 🔒 | 🔒 | 🔒 |
| **Students - All** | ✅ | ✅ | ✅ | 🔒 | 🔒 | 🔒 |
| **Classes - All** | ✅ | ✅ | ✅ | 🔒 | 🔒 | 🔒 |
| **Class Members - Read** | ✅ | ✅ | ✅ | 👁 own class | 👁 own class | 🔒 |
| **Class Members - Write** | ✅ | ✅ | ✅ | 🔒 | 🔒 | 🔒 |
| **Class Members - Promote** | ✅ | ✅ | ✅ | 🔒 | 🔒 | 🔒 |
| **Subjects - Read** | ✅ | ✅ | ✅ | 👁 own | 👁 own | 🔒 |
| **Subjects - Write** | ✅ | ✅ | ✅ | 🔒 | 🔒 | 🔒 |
| **Academic Years - Read** | ✅ | ✅ | ✅ | ✅ | ✅ | 🔒 |
| **Academic Years - Write** | ✅ | ✅ | ✅ | 🔒 | 🔒 | 🔒 |
| **Schedules - Read** | ✅ | ✅ | ✅ | 👁 own | 👁 own | 🔒 |
| **Schedules - Write** | ✅ | ✅ | ✅ | 🔒 | 🔒 | 🔒 |
| **Attendance - Read** | ✅ | ✅ | ✅ | ✅ | 👁 own | 🔒 |
| **Attendance - Create/Update** | ✅ | ✅ | ✅ | ✅ | ✅ | 🔒 |
| **Attendance - Delete** | ✅ | ✅ | ✅ | 🔒 | 🔒 | 🔒 |
| **Teaching Journals - All** | ✅ | ✅ | ✅ | 👁/✅ own | 👁/✅ own | 🔒 |
| **Assessment Categories** | ✅ | ✅ | ✅ | ✅ | ✅ | 🔒 |
| **Assessments - Read** | ✅ | ✅ | ✅ | ✅ | 👁 own | 🔒 |
| **Assessments - Create/Update** | ✅ | ✅ | ✅ | 🔒 | ✅ own | 🔒 |
| **Assessments - Delete** | ✅ | ✅ | ✅ | 🔒 | 🔒 | 🔒 |
| **Assessments - Input Scores** | ✅ | ✅ | ✅ | 🔒 | ✅ own | 🔒 |
| **Grade Engine - Calculate** | ✅ | ✅ | ✅ | 🔒 | ✅ | 🔒 |
| **Grade Engine - Read** | ✅ | ✅ | ✅ | ✅ | ✅ | 🔒 |
| **Report Cards - Read** | ✅ | ✅ | ✅ | 👁 own class | 🔒 | 🔒 |
| **Report Cards - Generate** | ✅ | ✅ | ✅ | 🔒 | 🔒 | 🔒 |
| **Report Cards - Publish** | ✅ | ✅ | ✅ | 🔒 | 🔒 | 🔒 |
| **Report Cards - Enrich (notes/achievements/p5)** | ✅ | ✅ | ✅ | ✅ own | 🔒 | 🔒 |
| **Report Cards - Mutate after PUBLISHED** | ✅ | 🔒 | 🔒 | 🔒 | 🔒 | 🔒 |
| **Dashboard - All** | ✅ | ✅ | ✅ | 👁 scoped | 👁 scoped | 🔒 |
| **PDF Generator** | ✅ | ✅ | ✅ | ✅ | ✅ | 🔒 |
| **Import** | ✅ | ✅ | ✅ | 🔒 | 🔒 | 🔒 |

---

## Special Rules

### Published Report Card Lock
Source: `reportCardService.ts` → `checkPublishedLock()`
```typescript
if (status === "PUBLISHED" && role !== "SuperAdmin") {
  throw new ForbiddenError("Data rapor terkunci...");
}
```
Once a report card is published, **only SuperAdmin** can modify it.

### HomeroomTeacher Report Card Scope
Source: `reportCardService.ts` → `getAllReportCards()`
- HomeroomTeacher can only see report cards for **classes where they are the homeroom teacher** (`classes.homeroom_teacher_id = teacherId`)
- Regular Teacher role: explicitly returns `classId = -1` → empty result

### Teacher Attendance Delete — Hard Blocked
Source: `attendanceRoutes.ts`
- DELETE endpoint explicitly restricted to `SA, SchA, Prin`
- Teachers cannot delete attendance records even if they created them

### Teacher Class Member Visibility
Source: `classMembersService.ts` → `getAllClassMembers()`
- Teachers see members of classes they **teach or are homeroom of**
- Computed from `schedules.teacher_id` UNION `classes.homeroom_teacher_id`

---

## RBAC Implementation Pattern

Every protected route group follows this exact pattern:

```typescript
// routes/exampleRoutes.ts
export const exampleRoutes = new Elysia({ prefix: "/example" })
  .use(tenantMiddleware)   // Must come first
  .use(authMiddleware)     // Injects user context

  // Read-only group (wider access)
  .group("", (app) => app
    .guard({ beforeHandle: requireRoles(["SuperAdmin", "SchoolAdmin", "Principal", "Teacher", "HomeroomTeacher"]) })
    .get("/", controller.getAll)
    .get("/:id", controller.getById)
  )

  // Mutating group (restricted)
  .group("", (app) => app
    .guard({ beforeHandle: requireRoles(["SuperAdmin", "SchoolAdmin", "Principal"]) })
    .post("/", controller.create, { body: CreateDto })
    .put("/:id", controller.update, { body: UpdateDto })
    .delete("/:id", controller.delete)
  );
```

---

## UserContext Type

Passed through service and repository layers:

```typescript
// src/utils/rbac.ts
export type UserContext = {
  id: number;
  email: string;
  role: string;
  schoolId: number;
};
```

Always carry this context when making role-aware decisions inside services.
