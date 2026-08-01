# 03 — API Reference

> Source: `guruhub-api/src/modules/*/routes/*.ts`, `src/modules/auth/controller/authController.ts`, `src/index.ts`
> Cross-ref: [01_System_Architecture](01_System_Architecture.md) | [04_RBAC](04_RBAC.md) | [06_Modules](06_Modules.md) | [07_DependencyGraph](07_DependencyGraph.md)

---

## Base URL

```
http://<host>:8000
```

## Required Headers (all protected routes)

```
Authorization: Bearer <accessToken>
x-school-id: <schoolId>
```

## Standard Response Shape

```json
{ "success": true, "message": "...", "data": {...} }
```

Error:
```json
{ "success": false, "error": "..." }
```

Paginated:
```json
{ "success": true, "message": "...", "data": [...], "pagination": { "totalItems": 0, "totalPages": 0, "currentPage": 1, "limit": 10 } }
```

---

## Module: Auth (`/auth`)

No tenant/auth middleware on login and refresh. Auth module is registered as a controller directly on the app.

| Method | Path | Auth? | Body | Notes |
|---|---|---|---|---|
| POST | `/auth/login` | ❌ | `{ email, password }` | `x-school-id` header required |
| POST | `/auth/refresh` | ❌ | `{ refreshToken }` | Token rotation |
| POST | `/auth/logout` | ❌ | `{ refreshToken }` | Revokes session |
| GET | `/auth/protected/me` | ✅ all roles | — | Returns current user profile |
| GET | `/auth/protected/admin-only` | ✅ Admin,Principal | — | RBAC test route |

---

## Module: Teachers (`/teachers`)

| Method | Path | RBAC | Notes |
|---|---|---|---|
| GET | `/teachers` | All authenticated | Paginated. Query: `page, limit, search, status` |
| GET | `/teachers/:id` | All authenticated | |
| POST | `/teachers` | SA, SchA, Prin | Create teacher profile |
| PUT | `/teachers/:id` | SA, SchA, Prin | |
| DELETE | `/teachers/:id` | SA, SchA, Prin | Soft delete |

---

## Module: Students (`/students`)

| Method | Path | RBAC | Notes |
|---|---|---|---|
| GET | `/students` | SA, SchA, Prin | Paginated. Query: `page, limit, search, status` |
| GET | `/students/:id` | SA, SchA, Prin | |
| POST | `/students` | SA, SchA, Prin | |
| PUT | `/students/:id` | SA, SchA, Prin | |
| DELETE | `/students/:id` | SA, SchA, Prin | Soft delete; nullifies NISN |
| POST | `/students/bulk-delete` | SA, SchA, Prin | Body: `{ ids: number[] }` |

---

## Module: Classes (`/classes`)

| Method | Path | RBAC | Notes |
|---|---|---|---|
| GET | `/classes` | SA, SchA, Prin | |
| GET | `/classes/:id` | SA, SchA, Prin | |
| POST | `/classes` | SA, SchA, Prin | |
| PUT | `/classes/:id` | SA, SchA, Prin | |
| DELETE | `/classes/:id` | SA, SchA, Prin | Soft delete |
| POST | `/classes/bulk-delete` | SA, SchA, Prin | Body: `{ ids: number[] }` |

---

## Module: Class Members (`/class-members`)

| Method | Path | RBAC | Notes |
|---|---|---|---|
| GET | `/class-members` | SA,SchA,Prin,Tea,HT | Teachers see own classes only |
| GET | `/class-members/:id` | SA,SchA,Prin,Tea,HT | |
| POST | `/class-members` | SA, SchA, Prin | |
| PUT | `/class-members/:id` | SA, SchA, Prin | Update status |
| DELETE | `/class-members/:id` | SA, SchA, Prin | Soft delete |
| POST | `/class-members/promote` | SA, SchA, Prin | Body: `{ sourceClassId, targetClassId, studentIds[] }` |

---

## Module: Subjects (`/subjects`)

| Method | Path | RBAC | Notes |
|---|---|---|---|
| GET | `/subjects` | All authenticated | Teachers see subjects for their classes |
| GET | `/subjects/:id` | All authenticated | |
| POST | `/subjects` | SA, SchA, Prin | |
| PUT | `/subjects/:id` | SA, SchA, Prin | |
| DELETE | `/subjects/:id` | SA, SchA, Prin | Soft delete |
| POST | `/subjects/bulk-delete` | SA, SchA, Prin | Body: `{ ids: number[] }` |

---

## Module: Academic Years (`/academic-years`)

| Method | Path | RBAC | Notes |
|---|---|---|---|
| GET | `/academic-years` | All authenticated | |
| GET | `/academic-years/:id` | All authenticated | |
| POST | `/academic-years` | SA, SchA, Prin | Setting `isActive=true` deactivates all others |
| PUT | `/academic-years/:id` | SA, SchA, Prin | |
| DELETE | `/academic-years/:id` | SA, SchA, Prin | |

---

## Module: Schedules (`/schedules`)

| Method | Path | RBAC | Notes |
|---|---|---|---|
| GET | `/schedules` | All authenticated | Teachers see own schedules only |
| GET | `/schedules/:id` | All authenticated | |
| POST | `/schedules` | SA, SchA, Prin | |
| PUT | `/schedules/:id` | SA, SchA, Prin | |
| DELETE | `/schedules/:id` | SA, SchA, Prin | Soft delete |
| POST | `/schedules/bulk-delete` | SA, SchA, Prin | Body: `{ ids: number[] }` |
| DELETE | `/schedules/delete-all` | SA, SchA, Prin | Deletes ALL schedules for school |

---

## Module: Attendance (`/attendance`)

| Method | Path | RBAC | Notes |
|---|---|---|---|
| GET | `/attendance` | SA,SchA,Prin,Tea | Teachers see own records |
| GET | `/attendance/recap` | SA,SchA,Prin,Tea | Monthly recap. Query: `classId, month` |
| GET | `/attendance/:id` | SA,SchA,Prin,Tea,HT | |
| POST | `/attendance` | SA,SchA,Prin,Tea | Create session + details |
| PUT | `/attendance/:id` | SA,SchA,Prin,Tea | |
| DELETE | `/attendance/:id` | SA, SchA, Prin | **Admin only** — not teachers |

---

## Module: Teaching Journals (`/teaching-journals`)

| Method | Path | RBAC | Notes |
|---|---|---|---|
| GET | `/teaching-journals` | SA,SchA,Prin,Tea,HT | Teachers see own records |
| GET | `/teaching-journals/:id` | SA,SchA,Prin,Tea,HT | |
| POST | `/teaching-journals` | SA,SchA,Prin,Tea,HT | |
| PUT | `/teaching-journals/:id` | SA,SchA,Prin,Tea,HT | |
| DELETE | `/teaching-journals/:id` | SA,SchA,Prin,Tea,HT | Soft delete |

---

## Module: Assessment Categories (`/assessment-categories`)

| Method | Path | RBAC | Notes |
|---|---|---|---|
| GET | `/assessment-categories` | SA,SchA,Prin,Tea,HT | |
| GET | `/assessment-categories/:id` | SA,SchA,Prin,Tea,HT | |
| POST | `/assessment-categories` | SA,SchA,Prin,Tea,HT | |
| PUT | `/assessment-categories/:id` | SA,SchA,Prin,Tea,HT | |
| DELETE | `/assessment-categories/:id` | SA,SchA,Prin,Tea,HT | Soft delete |

---

## Module: Assessments (`/assessments`)

| Method | Path | RBAC | Notes |
|---|---|---|---|
| GET | `/assessments` | SA,SchA,Prin,Tea,HT | HT read-only |
| GET | `/assessments/:id` | SA,SchA,Prin,Tea,HT | |
| POST | `/assessments` | SA,SchA,Prin,Tea | |
| PUT | `/assessments/:id` | SA,SchA,Prin,Tea | |
| POST | `/assessments/:id/scores` | SA,SchA,Prin,Tea | Bulk upsert scores |
| DELETE | `/assessments/:id` | SA, SchA, Prin | **Admin/Principal only** |

---

## Module: Grade Engine (`/grade-engine`)

| Method | Path | RBAC | Notes |
|---|---|---|---|
| POST | `/grade-engine/calculate` | SA,SchA,Prin,Tea | Single student: `{ studentId, subjectId, academicYearId }` |
| POST | `/grade-engine/calculate-class` | SA,SchA,Prin,Tea | Whole class: `{ classId, subjectId, academicYearId }` |
| GET | `/grade-engine/student/:studentId` | SA,SchA,Prin,Tea,HT | Query: `subjectId, academicYearId` |

---

## Module: Report Cards (`/report-cards`)

| Method | Path | RBAC | Notes |
|---|---|---|---|
| GET | `/report-cards` | SA,SchA,Prin,Tea,HT | HT sees own classes only; Teacher sees nothing |
| GET | `/report-cards/:id` | SA,SchA,Prin,HT | |
| GET | `/report-cards/student/:studentId` | SA,SchA,Prin,HT | Query: `academicYearId, semester` |
| GET | `/report-cards/class/:classId` | SA,SchA,Prin,HT | Query: `academicYearId, semester` |
| POST | `/report-cards/generate` | SA, SchA, Prin | Generates from grade engine + attendance |
| POST | `/report-cards/:id/publish` | SA, SchA, Prin | DRAFT → PUBLISHED |
| PUT | `/report-cards/notes` | SA,SchA,Prin,HT | Homeroom notes |
| POST | `/report-cards/achievement` | SA,SchA,Prin,HT | |
| POST | `/report-cards/extracurricular` | SA,SchA,Prin,HT | |
| POST | `/report-cards/p5` | SA,SchA,Prin,HT | |
| DELETE | `/report-cards` | SA, SchA, Prin | Soft delete |

---

## Module: Users (`/users`)

| Method | Path | RBAC | Notes |
|---|---|---|---|
| GET | `/users` | SA, SchA | Paginated |
| GET | `/users/:id` | SA, SchA | |
| POST | `/users` | SA, SchA | |
| PUT | `/users/:id` | SA, SchA | |
| PUT | `/users/:id/password` | SA, SchA | Reset password |
| POST | `/users/generate-bulk` | SA, SchA | Auto-create accounts for all teachers/students |
| DELETE | `/users/delete-bulk` | SA, SchA | |
| DELETE | `/users/:id` | SA, SchA | Hard delete |

---

## Module: Dashboard (`/dashboard`)

All endpoints: `SA, SchA, Prin, Tea, HT`. Role-aware responses.

| Method | Path | Returns |
|---|---|---|
| GET | `/dashboard/summary` | totalStudents, teachers, classes, subjects, schedules, activeAcademicYear |
| GET | `/dashboard/attendance` | Today's PRESENT/SICK/PERMISSION/ABSENT counts |
| GET | `/dashboard/journals` | Journal fill rate today |
| GET | `/dashboard/assessments` | Assessment counts: total, this month, this week |
| GET | `/dashboard/grades` | Average scores: school-wide, per class, per subject |
| GET | `/dashboard/report-cards` | Count of DRAFT vs PUBLISHED |
| GET | `/dashboard/academic-years` | All academic years for school |
| GET | `/dashboard/activities` | Recent activity log |
| GET | `/dashboard/pending-tasks` | Unfilled attendance/journals for today's finished schedules (Teacher only) |
| GET | `/dashboard/student-highlights` | Top 3 students + 3 with most absences |

---

## Module: PDF Generator (`/pdf-generator`)

| Method | Path | RBAC | Output |
|---|---|---|---|
| GET | `/pdf-generator/report-card/:reportCardId` | SA,SchA,Prin,HT | PDF binary |
| GET | `/pdf-generator/attendance/class/:classId` | SA,SchA,Prin,Tea,HT | PDF binary |
| GET | `/pdf-generator/journals/teacher/:teacherId` | SA,SchA,Prin,Tea,HT | PDF binary |
| GET | `/pdf-generator/assessments/:assessmentId` | SA,SchA,Prin,Tea,HT | PDF binary |
| GET | `/pdf-generator/students` | SA,SchA,Prin,Tea,HT | PDF binary |
| GET | `/pdf-generator/teachers` | SA,SchA,Prin,Tea,HT | PDF binary |

---

## Module: Import (`/import`)

All endpoints: `SA, SchA, Prin`

| Method | Path | Notes |
|---|---|---|
| POST | `/import/upload` | Raw file upload |
| POST | `/import/preview` | Preview parsed rows before commit |
| POST | `/import/teachers` | Bulk import teachers from XLSX |
| POST | `/import/students` | Bulk import students from XLSX |
| POST | `/import/classes` | Bulk import classes |
| POST | `/import/subjects` | Bulk import subjects |
| POST | `/import/class-members` | Bulk import class memberships |
| POST | `/import/schedules` | Bulk import schedules |
| GET | `/import/templates/students` | Download XLSX template |
| GET | `/import/templates/teachers` | Download XLSX template |
| GET | `/import/templates/classes` | Download XLSX template |
| GET | `/import/templates/subjects` | Download XLSX template |
| GET | `/import/templates/class-members` | Download XLSX template |
| GET | `/import/templates/schedules` | Download XLSX template |

---

## Module: Student Discipline (`/discipline`)

Enables recording, review, and resolution of student discipline incidents (violations and rewards).

### Categories (`/discipline/categories`)

| Method | Path | RBAC | Notes |
|---|---|---|---|
| GET | `/discipline/categories` | All authenticated | Get all categories (optionally filter by `type`) |
| GET | `/discipline/categories/:id` | All authenticated | |
| POST | `/discipline/categories` | SA, SchA | Create category (Body: `CreateDisciplineCategoryDto`) |
| PUT | `/discipline/categories/:id` | SA, SchA | |
| DELETE | `/discipline/categories/:id` | SA, SchA | Soft delete |

### Violation/Reward Types (`/discipline/types`)

| Method | Path | RBAC | Notes |
|---|---|---|---|
| GET | `/discipline/types` | All authenticated | Get all rules/types (optionally filter by `categoryId`) |
| GET | `/discipline/types/:id` | All authenticated | |
| POST | `/discipline/types` | SA, SchA | Create type (Body: `CreateDisciplineTypeDto`) |
| PUT | `/discipline/types/:id` | SA, SchA | |
| DELETE | `/discipline/types/:id` | SA, SchA | Soft delete |

### Incidents (`/discipline/incidents`)

| Method | Path | RBAC | Notes |
|---|---|---|---|
| GET | `/discipline/incidents` | SA, SchA, Prin, Tea, HT | List incidents. Query: `status, studentId, classId, date` (Teachers see own reported/handled) |
| GET | `/discipline/incidents/:id` | SA, SchA, Prin, Tea, HT | View details including students, witnesses, attachments |
| POST | `/discipline/incidents` | SA, SchA, Prin, Tea, HT | Create incident (Body: `CreateDisciplineIncidentDto`) |
| PUT | `/discipline/incidents/:id` | SA, SchA, Prin, Tea, HT | Update incident (Draft/Pending only) (Body: `UpdateDisciplineIncidentDto`) |
| POST | `/discipline/incidents/:id/status` | SA, SchA, Prin, Tea, HT | Transition workflow status (Body: `UpdateIncidentStatusDto`) |
| DELETE | `/discipline/incidents/:id` | SA, SchA, Prin | Soft delete incident |

### Policies (`/discipline/policies`)

| Method | Path | RBAC | Notes |
|---|---|---|---|
| GET | `/discipline/policies` | All authenticated | Get school configuration policy |
| PUT | `/discipline/policies` | SA, SchA | Update school policy config (Body: `UpdateDisciplinePolicyDto`) |

### Sanctions (`/discipline/sanctions`)

| Method | Path | RBAC | Notes |
|---|---|---|---|
| GET | `/discipline/sanctions/thresholds` | All authenticated | List sanction thresholds |
| POST | `/discipline/sanctions/thresholds` | SA, SchA | Create threshold (Body: `CreateThresholdDto`) |
| PUT | `/discipline/sanctions/thresholds/:id` | SA, SchA | |
| DELETE | `/discipline/sanctions/thresholds/:id` | SA, SchA | Soft delete |
| GET | `/discipline/sanctions/logs` | SA, SchA, Prin, HT | List issued sanctions |
| POST | `/discipline/sanctions/logs` | SA, SchA, HT | Manually issue or update sanction log status |

### Analytics (`/discipline/analytics`)

All endpoints: `SA, SchA, Prin`

| Method | Path | Notes |
|---|---|---|
| GET | `/discipline/analytics/heatmap` | Location and time distribution data for incidents |
| GET | `/discipline/analytics/locations` | Most common locations rankings |
| GET | `/discipline/analytics/times` | Peak incident hours and days rankings |
| GET | `/discipline/analytics/reporters` | Top reporters summary |
| GET | `/discipline/analytics/trends` | Weekly/monthly incident count timelines |

---

## RBAC Legend

| Code | Role |
|---|---|
| SA | SuperAdmin |
| SchA | SchoolAdmin |
| Prin | Principal |
| HT | HomeroomTeacher |
| Tea | Teacher |
