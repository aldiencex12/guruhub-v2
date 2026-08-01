# GuruHub — Project Map by Business Domain

> Generated from live source code. Last updated: 2026-07-23
> Cross-ref: [02_Database](02_Database.md) | [03_API](03_API.md) | [04_RBAC](04_RBAC.md) | [07_DependencyGraph](07_DependencyGraph.md)

---

## Domain Index
1. [Identity & Security](#1-identity--security)
2. [School Administration](#2-school-administration)
3. [People Management — Teachers](#3-people-management--teachers)
4. [People Management — Students](#4-people-management--students)
5. [Academic Structure](#5-academic-structure)
6. [Daily Teaching Operations](#6-daily-teaching-operations)
7. [Assessment & Grading](#7-assessment--grading)
8. [Reporting & Documents](#8-reporting--documents)
9. [Platform Operations](#9-platform-operations)

---

## 1. Identity & Security

**Purpose:** Controls who enters the system, establishes session state, enforces tenant isolation at the token level, and logs all authentication events.

### Database Tables
| Table | Role |
|---|---|
| `users` | User accounts; role assignment; school-scoped email |
| `sessions` | Stateful refresh token store; revocation support |
| `audit_logs` | Login/logout event recording |
| `schools` | Used at login to validate tenant exists |

### Routes
| Method | Path | Notes |
|---|---|---|
| POST | `/auth/login` | No auth required; requires `x-school-id` header |
| POST | `/auth/refresh` | No auth required; rotates token pair |
| POST | `/auth/logout` | Revokes session row |
| GET | `/auth/protected/me` | Returns current user profile |

### Controller
`src/modules/auth/controller/authController.ts`
- Registered directly on app (no routes file)
- Handles login, refresh, logout, /protected/me

### Service
`src/modules/auth/service/authService.ts`
- `login(email, password)` — validates, creates session, issues tokens
- `refresh(refreshToken)` — validates session, rotates tokens
- `logout(refreshToken)` — revokes session, writes audit_log

### Repository
`src/modules/auth/repository/authRepository.ts`
- `findSchoolById`, `findUserByEmail`, `findUserById`
- `createSession`, `findSession`, `revokeSession`, `revokeAllUserSessions`
- `createAuditLog`

### Frontend Pages
| Project | Page | Notes |
|---|---|---|
| Web | `/login` | `src/app/(auth)/login/page.tsx` |
| Mobile | `/login` | `src/app/(auth)/login/page.tsx` |

### Frontend Queries
None — auth uses direct service calls, not TanStack Query hooks.

### Frontend Services
| File | Methods |
|---|---|
| `src/services/api.ts` | `refreshTokens()`, `request()` — token injection + refresh interceptor |

### Dependencies
- Reads: `schools`, `users`
- Writes: `sessions`, `audit_logs`
- Utilities: `src/utils/jwt.ts`, `src/utils/password.ts`
- Middleware: `src/middleware/auth.ts`, `src/middleware/tenant.ts`

### Permissions
| Endpoint | Roles |
|---|---|
| POST /auth/login | Public (no auth) |
| POST /auth/refresh | Public (no auth) |
| POST /auth/logout | Public (no auth) |
| GET /auth/protected/me | All authenticated roles |

### RBAC Roles
- All 6 roles use auth
- SuperAdmin/SchoolAdmin/Principal gated on `/auth/protected/admin-only`

### Tenant Requirements
- `x-school-id` header REQUIRED on login (resolves which school's `users` table to search)
- `schoolId` embedded in JWT; validated on every subsequent request
- Cross-tenant login blocked: JWT `schoolId` must match `x-school-id` header

---

## 2. School Administration

**Purpose:** Manages the tenant root entity (school) and the master academic calendar. Academic years are the temporal spine that all classes, schedules, assessments, and report cards hang from.

### Database Tables
| Table | Role |
|---|---|
| `schools` | Tenant root — every FK chain starts here |
| `academic_years` | Year + semester records; one active per school |
| `users` | User account management |

### Routes

**Academic Years**
| Method | Path |
|---|---|
| GET | `/academic-years` |
| GET | `/academic-years/:id` |
| POST | `/academic-years` |
| PUT | `/academic-years/:id` |
| DELETE | `/academic-years/:id` |

**Users**
| Method | Path |
|---|---|
| GET | `/users` |
| GET | `/users/:id` |
| POST | `/users` |
| PUT | `/users/:id` |
| PUT | `/users/:id/password` |
| POST | `/users/generate-bulk` |
| DELETE | `/users/delete-bulk` |
| DELETE | `/users/:id` |

### Controllers
- `src/modules/academic-years/controller/academicYearsController.ts`
- `src/modules/users/controller/usersController.ts`

### Services
**AcademicYearsService** (`src/modules/academic-years/service/academicYearsService.ts`)
- `getAllAcademicYears`, `getAcademicYearById`
- `createAcademicYear` — calls `deactivateAllOtherYears` when `isActive=true`
- `updateAcademicYear`, `deleteAcademicYear`

**UsersService** (`src/modules/users/service/usersService.ts`)
- `getAllUsers`, `getUserById`, `createUser`, `updateUser`, `deleteUser`
- `generateBulkAccounts` — creates accounts for all teachers/students without login
- `deleteBulkAccounts`

### Repositories
- `src/modules/academic-years/repository/academicYearsRepository.ts`
  - `findAll`, `findById`, `findByYearAndSemester`, `create`, `update`, `deactivateAllOtherYears`
- `src/modules/users/repository/usersRepository.ts`
  - `findAll`, `findById`, `findByEmail`, `create`, `update`, `updatePassword`, `delete`

### Frontend Pages (Web only)
| Page | Path |
|---|---|
| Academic Years | `(dashboard)/academic-years/page.tsx` |
| Users | `(dashboard)/users/page.tsx` |

### Frontend Queries
- `src/queries/academic-years.query.ts` — `useAcademicYears`, CRUD mutations
- `src/queries/users.query.ts` — `useUsers`, CRUD mutations

**Note:** `useAcademicYears` is also imported from `dashboard.query.ts` as a shortcut in many pages (schedules, assessments, grade-engine, report-cards, class-members, promotions).

### Frontend Services
- `src/services/academic-years.ts`
- `src/services/users.ts`

### Dependencies
- `academic_years` referenced by: `classes`, `schedules`, `assessments`, `class_members`, `student_final_grades`, `report_cards`
- `users` referenced by: `teachers.user_id`, `students.user_id`, `sessions.user_id`, `audit_logs.user_id`

### Permissions
| Action | Roles |
|---|---|
| Academic Years — Read | All authenticated |
| Academic Years — Write | SuperAdmin, SchoolAdmin, Principal |
| Users — All | SuperAdmin, SchoolAdmin only |

### RBAC Roles
- Users module is the most restricted — SchoolAdmin and above only
- Academic years readable by teachers (needed for schedule/assessment context)

### Tenant Requirements
- `academic_years.school_id` — one school cannot see another's academic years
- `users.email` unique per `school_id` (not globally unique)
- `deactivateAllOtherYears` scoped to `school_id`

---

## 3. People Management — Teachers

**Purpose:** Manages teacher profiles as entities separate from user accounts. A teacher can exist without a login account and vice versa. Teacher ID is the operational identity used in all academic operations.

### Database Tables
| Table | Role |
|---|---|
| `teachers` | Teacher profiles; optional link to users |
| `subject_teachers` | Assignment: Teacher X teaches Subject Y in Class Z |

### Routes
| Method | Path |
|---|---|
| GET | `/teachers` |
| GET | `/teachers/:id` |
| POST | `/teachers` |
| PUT | `/teachers/:id` |
| DELETE | `/teachers/:id` |

### Controller
`src/modules/teachers/controller/teachersController.ts`

### Service
`src/modules/teachers/service/teachersService.ts`
- `getAllTeachers`, `getTeacherById`
- `createTeacher`, `updateTeacher`, `deleteTeacher`

### Repository
`src/modules/teachers/repository/teachersRepository.ts`
- `findAll(schoolId, filters)` — paginated; search by name/NIP
- `findById`, `findByNip`, `create`, `update`, `softDelete`

### Frontend Pages
| Page | Path |
|---|---|
| Teachers | `(dashboard)/teachers/page.tsx` |

### Frontend Queries
`src/queries/teachers.query.ts`
- `useTeachers`, `useCreateTeacher`, `useUpdateTeacher`, `useDeleteTeacher`

### Frontend Services
`src/services/teachers.ts`

### Dependencies
- `teachers` is consumed by: `classes.homeroom_teacher_id`, `schedules.teacher_id`, `attendances.teacher_id`, `teaching_journals.teacher_id`, `assessments.teacher_id`, `assessment_categories.teacher_id`, `subject_teachers.teacher_id`
- `src/utils/rbac.ts → getTeacherIdFromUserId(schoolId, userId)` — used in 8+ modules to resolve teacher context from JWT user

### Permissions
| Action | Roles |
|---|---|
| Read | All authenticated (teachers, admins, homeroom) |
| Write/Delete | SuperAdmin, SchoolAdmin, Principal |

### RBAC Roles
- All roles can READ teacher list (needed for schedule, attendance, journal context)
- Write restricted to admin roles

### Tenant Requirements
- Soft delete: `deleted_at = NOW()`
- NIP unique per school: `UNIQUE(school_id, nip)`
- `user_id` nullable — teacher profile can exist before account creation

---

## 4. People Management — Students

**Purpose:** Manages student profiles as entities separate from user accounts. NISN (national ID) is globally unique and must be nullified on soft-delete to allow re-registration.

### Database Tables
| Table | Role |
|---|---|
| `students` | Student profiles; optional link to users |

### Routes
| Method | Path |
|---|---|
| GET | `/students` |
| GET | `/students/:id` |
| POST | `/students` |
| PUT | `/students/:id` |
| DELETE | `/students/:id` |
| POST | `/students/bulk-delete` |

### Controller
`src/modules/students/controller/studentsController.ts`

### Service
`src/modules/students/service/studentsService.ts`
- `getAllStudents`, `getStudentById`
- `createStudent`, `updateStudent`
- `deleteStudent` — soft deletes AND sets `nisn = null`
- `deleteBulkStudents`

### Repository
`src/modules/students/repository/studentsRepository.ts`
- `findAll`, `findById`, `findByNisn`
- `create`, `update`
- `softDelete` — sets `deleted_at = NOW(), nisn = NULL`
- `softDeleteBulk`

### Frontend Pages
| Page | Path |
|---|---|
| Students | `(dashboard)/students/page.tsx` |

### Frontend Queries
`src/queries/students.query.ts`
- `useStudents`, `useCreateStudent`, `useUpdateStudent`, `useDeleteStudent`, `useDeleteBulkStudents`

### Frontend Services
`src/services/students.ts`

### Dependencies
- `students` consumed by: `class_members.student_id`, `attendance_details.student_id`, `assessment_scores.student_id`, `student_final_grades.student_id`, `report_cards.student_id`
- NISN globally unique — only student field NOT scoped by `school_id`

### Permissions
| Action | Roles |
|---|---|
| Read | SuperAdmin, SchoolAdmin, Principal |
| Write/Delete | SuperAdmin, SchoolAdmin, Principal |

### RBAC Roles
- Teachers cannot directly access student CRUD
- Students appear to teachers indirectly via class_members → attendance, assessments

### Tenant Requirements
- `students.school_id` required on all queries
- NISN special rule: nullified on soft-delete, globally unique when not null
- `status` field (`Aktif`/`Nonaktif`) independent of `deleted_at`

---

## 5. Academic Structure

**Purpose:** Defines the organizational skeleton within which all teaching and learning happens. Subjects, classes, rosters, and the weekly schedule form the dependency chain that every operational module depends on.

### Database Tables
| Table | Role |
|---|---|
| `subjects` | Mata pelajaran; grade-level scoped |
| `subject_teachers` | Many-to-many: teacher assigned to subject in a class |
| `classes` | Rombongan belajar; linked to academic year + homeroom teacher |
| `class_members` | CANONICAL roster: student ↔ class ↔ academic year with lifecycle status |
| `class_students` | LEGACY — do not use in new code |
| `schedules` | Weekly timetable: class × subject × teacher × day × time |

### Routes

**Subjects**
| Method | Path |
|---|---|
| GET | `/subjects` |
| GET | `/subjects/:id` |
| POST | `/subjects` |
| PUT | `/subjects/:id` |
| DELETE | `/subjects/:id` |
| POST | `/subjects/bulk-delete` |

**Classes**
| Method | Path |
|---|---|
| GET | `/classes` |
| GET | `/classes/:id` |
| POST | `/classes` |
| PUT | `/classes/:id` |
| DELETE | `/classes/:id` |
| POST | `/classes/bulk-delete` |

**Class Members**
| Method | Path |
|---|---|
| GET | `/class-members` |
| GET | `/class-members/:id` |
| POST | `/class-members` |
| PUT | `/class-members/:id` |
| DELETE | `/class-members/:id` |
| POST | `/class-members/promote` |

**Schedules**
| Method | Path |
|---|---|
| GET | `/schedules` |
| GET | `/schedules/:id` |
| POST | `/schedules` |
| PUT | `/schedules/:id` |
| DELETE | `/schedules/:id` |
| POST | `/schedules/bulk-delete` |
| DELETE | `/schedules/delete-all` |

### Controllers
- `src/modules/subjects/controller/subjectsController.ts`
- `src/modules/classes/controller/classesController.ts`
- `src/modules/class-members/controller/classMembersController.ts`
- `src/modules/schedules/controller/schedulesController.ts`

### Services
**SubjectsService** — `getAllSubjects` (teacher-scoped via schedules), CRUD, bulk delete
**ClassesService** — CRUD, bulk delete
**ClassMembersService**
- `getAllClassMembers` — teacher sees own classes (taught + homeroom)
- `createClassMember` — validates: student exists, class exists, no duplicate ACTIVE membership per year
- `promoteStudents` — bulk promote: sets old ACTIVE→INACTIVE, inserts new ACTIVE memberships
**SchedulesService** — CRUD, bulk delete, delete-all

### Repositories
- `src/modules/subjects/repository/subjectsRepository.ts`
  - `findAll(schoolId, allowedSubjectIds?)`, `findByCode`, `findByNameAndGrade`, `softDelete`, `softDeleteBulk`
- `src/modules/classes/repository/classesRepository.ts`
  - `findAll`, `findByName`, `softDelete`, `softDeleteBulk`
- `src/modules/class-members/repository/classMembersRepository.ts`
  - `findAll`, `findActiveMembershipInYear`, `findDuplicateMembership`, `create`, `bulkCreate`, `update`, `softDelete`
- `src/modules/schedules/repository/schedulesRepository.ts`
  - `findAll`, `findTeacherSchedulesByDay`, `findClassSchedulesByDay`, `softDelete`, `bulkSoftDelete`, `softDeleteAll`

### Frontend Pages (Web only)
| Page | Path |
|---|---|
| Subjects | `(dashboard)/subjects/page.tsx` |
| Classes | `(dashboard)/classes/page.tsx` |
| Class Members | `(dashboard)/class-members/page.tsx` |
| Schedules | `(dashboard)/schedules/page.tsx` |
| Promotions | `(dashboard)/promotions/page.tsx` |

### Frontend Queries
- `src/queries/subjects.query.ts` — `useSubjects`, CRUD mutations
- `src/queries/classes.query.ts` — `useClasses`, `useDeleteBulkClasses`
- `src/queries/class-members.query.ts` — `useClassMembers`, `useAddClassMember`, `useRemoveClassMember`, `usePromoteStudents`
- `src/queries/schedules.query.ts` — `useSchedules`, `useDeleteAllSchedules`, `useBulkDeleteSchedules`

### Frontend Services
- `src/services/subjects.ts`
- `src/services/classes.ts`
- `src/services/class-members.ts`
- `src/services/schedules.ts`

### Dependencies
- `subjects` → consumed by `schedules`, `assessments`, `student_final_grades`, `report_card_subjects`
- `classes` → consumed by `class_members`, `schedules`, `assessments`, `student_final_grades`, `report_cards`
- `class_members` → consumed by `grade-engine` (ACTIVE check), `report-cards` (ACTIVE check), `dashboard`, `attendance` (student list)
- `schedules` → consumed by `attendance`, `teaching_journals`, `dashboard` (pending tasks)
- **Schedule is the system's operational heartbeat** — deleting one orphans attendance and journal records

### Permissions
| Action | Roles |
|---|---|
| Subjects — Read | All authenticated (Teacher scoped to own via schedules) |
| Subjects — Write | SuperAdmin, SchoolAdmin, Principal |
| Classes — All | SuperAdmin, SchoolAdmin, Principal |
| Class Members — Read | All authenticated (Teacher/HT scoped to own classes) |
| Class Members — Write | SuperAdmin, SchoolAdmin, Principal |
| Promote | SuperAdmin, SchoolAdmin, Principal |
| Schedules — Read | All authenticated (Teacher scoped to own) |
| Schedules — Write | SuperAdmin, SchoolAdmin, Principal |

### RBAC Roles
- Teachers see subjects/schedules/class-members scoped to their assigned schedules and homeroom
- HomeroomTeacher: additional access to homeroom class members
- Admin roles: full structural CRUD

### Tenant Requirements
- All tables: `school_id` on every row
- `classes.academic_year_id` scopes class to a specific semester
- One student = ONE ACTIVE `class_member` per `academic_year_id` (enforced in service)
- Schedule soft-delete: downstream `attendance` and `teaching_journals` records are NOT auto-deleted

---

## 6. Daily Teaching Operations

**Purpose:** The daily workflow that teachers perform. Records who attended each class and what was taught. These two modules feed the Dashboard's pending task engine and ultimately feed the report card attendance summary.

### Database Tables
| Table | Role |
|---|---|
| `attendances` | One attendance session per schedule per date |
| `attendance_details` | Per-student status within a session |
| `teaching_journals` | One journal per schedule per date |

### Routes

**Attendance**
| Method | Path | Notes |
|---|---|---|
| GET | `/attendance` | |
| GET | `/attendance/recap` | Monthly recap; query: `classId, month` |
| GET | `/attendance/:id` | |
| POST | `/attendance` | Creates session + all student detail rows |
| PUT | `/attendance/:id` | |
| DELETE | `/attendance/:id` | **Admin only** |

**Teaching Journals**
| Method | Path |
|---|---|
| GET | `/teaching-journals` |
| GET | `/teaching-journals/:id` |
| POST | `/teaching-journals` |
| PUT | `/teaching-journals/:id` |
| DELETE | `/teaching-journals/:id` |

### Controllers
- `src/modules/attendance/controller/attendanceController.ts`
- `src/modules/teaching-journals/controller/teachingJournalsController.ts`

### Services
**AttendanceService**
- `createAttendance` — resolves teacher from userId, validates schedule, creates `attendances` + `attendance_details` rows, checks unique constraint
- `getAttendanceById` — returns full session with all student details
- `updateAttendance` — updates details per student
- `deleteAttendance` — **hard delete** (not soft delete)
- `getAllAttendances` — teacher-scoped
- `getAttendanceRecap` — monthly pivot by student

**TeachingJournalsService**
- `createTeachingJournal` — resolves teacher from userId, validates schedule, checks `findByScheduleAndDate` for duplicates
- `getTeachingJournalById`, `getAllTeachingJournals` — teacher-scoped
- `updateTeachingJournal`, `deleteTeachingJournal` (soft)

### Repositories
**AttendanceRepository** (`src/modules/attendance/repository/attendanceRepository.ts`)
- `findTeacherByUserId`, `findScheduleById`, `findClassStudents`
- `findAttendanceByScheduleAndDate`, `createAttendance`, `findAttendanceById`
- `findAttendanceDetails`, `updateAttendance`
- `hardDeleteAttendance` — hard delete, not soft
- `findAllAttendances`, `getMonthlyRecapData`

**TeachingJournalsRepository** (`src/modules/teaching-journals/repository/teachingJournalsRepository.ts`)
- `findAll`, `findById`, `findByScheduleAndDate`, `create`, `update`, `softDelete`

### Frontend Pages
| Project | Page | Path |
|---|---|---|
| Web | Attendance | `(dashboard)/attendance/page.tsx` |
| Mobile | Attendance | `(dashboard)/attendance/page.tsx` |
| Web | Teaching Journals | `(dashboard)/teaching-journals/page.tsx` |
| Mobile | Teaching Journals | `(dashboard)/teaching-journals/page.tsx` |

### Frontend Queries
- `src/queries/attendance.query.ts` — `useAttendances`, `useAttendance`, `useCreateAttendance`, `useAttendanceRecap`, `useDeleteAttendance`
- `src/queries/teaching-journals.query.ts` — `useJournals`, `useCreateJournal`, `useUpdateJournal`, `useDeleteJournal`

### Frontend Services
- `src/services/attendance.ts`
- `src/services/teaching-journals.ts`

### Dependencies
**Attendance reads:**
- `teachers` — resolve `userId → teacherId`
- `schedules` — validate schedule exists and belongs to school
- `class_members` — get student list for the class

**Attendance is read by:**
- `report_cards` — counts SICK/PERMISSION/ABSENT for report card attendance summary
- `dashboard` — today's attendance summary, pending tasks, student highlights

**Teaching Journals read:**
- `schedules` — validate schedule
- `teachers` — resolve teacher context

**Teaching Journals read by:**
- `dashboard` — journal fill rate, pending tasks

### Permissions
| Action | Roles |
|---|---|
| Attendance — Read | SuperAdmin, SchoolAdmin, Principal, Teacher |
| Attendance — Create/Update | All including HomeroomTeacher |
| Attendance — Delete | SuperAdmin, SchoolAdmin, Principal **only** |
| Journals — All CRUD | SuperAdmin, SchoolAdmin, Principal, Teacher, HomeroomTeacher |

### RBAC Roles
- Teachers see only their own attendance/journal records
- Attendance delete is the only endpoint explicitly blocked from teachers (even if they created the record)
- Journal delete unblocked from teacher after migration 0007 fix

### Tenant Requirements
- `attendances.school_id` on all queries
- Unique constraint: `(school_id, schedule_id, attendance_date)` — one session per schedule per day
- `attendance_details` cascade-deleted with parent `attendances` row
- Journal: unique per `(schedule_id, journal_date)` enforced in service (not DB — index removed in migration 0007)

---

## 7. Assessment & Grading

**Purpose:** Records student scores by category, computes weighted final grades, and stores them permanently. This domain is the computational engine of GuruHub — its output is the primary input to report cards.

### Database Tables
| Table | Role |
|---|---|
| `assessment_categories` | Weight definitions per school/teacher |
| `assessments` | Individual assessment events |
| `assessment_scores` | Per-student scores per assessment |
| `student_final_grades` | Grade engine output; UPSERT per calculation |

### Routes

**Assessment Categories**
| Method | Path |
|---|---|
| GET/GET/:id | `/assessment-categories`, `/assessment-categories/:id` |
| POST/PUT/DELETE | Full CRUD |

**Assessments**
| Method | Path | Notes |
|---|---|---|
| GET | `/assessments` | |
| GET | `/assessments/:id` | Returns with all scores |
| POST | `/assessments` | |
| PUT | `/assessments/:id` | |
| POST | `/assessments/:id/scores` | Bulk upsert all student scores |
| DELETE | `/assessments/:id` | Admin/Principal only |

**Grade Engine**
| Method | Path | Notes |
|---|---|---|
| POST | `/grade-engine/calculate` | Single student + subject + year |
| POST | `/grade-engine/calculate-class` | All active students in class |
| GET | `/grade-engine/student/:studentId` | Read stored final grade |

### Controllers
- `src/modules/assessment-categories/controller/assessmentCategoriesController.ts`
- `src/modules/assessments/controller/assessmentsController.ts`
- `src/modules/grade-engine/controller/gradeEngineController.ts`

### Services
**AssessmentCategoriesService**
- `getAllCategories` — role-aware: Teacher sees own + defaults
- `createCategory` — validates total weight ≤ 100
- `updateCategory`, `deleteCategory`

**AssessmentsService**
- `getAllAssessments` — role-aware: Teacher sees own
- `createAssessment`, `updateAssessment`, `deleteAssessment`
- Score input via `repository.upsertScores(assessmentId, scoresList)`

**GradeEngineService** (no repository — queries DB directly)
- `calculateStudentFinalGrade(schoolId, studentId, subjectId, academicYearId)`
  1. Validates student is ACTIVE in `class_members`
  2. Gets all ACTIVE `assessment_categories` for school
  3. Gets all active `assessments` for class+subject+year
  4. Gets student `assessment_scores`
  5. Groups by category → averages → weighted sum
  6. Missing score = 0; category with no assessments = skipped
  7. UPSERT into `student_final_grades`
- `calculateClassFinalGrades` — loops all ACTIVE students via above method
- `getStudentFinalGrade` — read-only lookup

**Grade Letter Thresholds** (`src/utils/gradeCalculator.ts`):
- A: ≥ 90 | B: ≥ 75 | C: ≥ 60 | D: < 60

### Repositories
- `AssessmentCategoriesRepository`: `findAll`, `findByName`, `getTotalWeight`, `create`, `update`, `softDelete`
- `AssessmentsRepository`: `findAll`, `findById`, `findDetailWithScores`, `create`, `update`, `softDelete`, `upsertScores`
- Grade Engine: **no repository** — service queries `class_members`, `assessment_categories`, `assessments`, `assessment_scores`, `student_final_grades` directly

### Frontend Pages
| Page | Project | Path |
|---|---|---|
| Assessment Categories | Web | `(dashboard)/assessment-categories/page.tsx` |
| Assessments | Web | `(dashboard)/assessments/page.tsx` |
| Assessments | Mobile | `(dashboard)/assessments/page.tsx` |
| Grade Engine | Web | `(dashboard)/grade-engine/page.tsx` |

### Frontend Queries
- `src/queries/assessment-categories.query.ts` — `useCategories`, CRUD
- `src/queries/assessments.query.ts` — `useAssessments`, `useAssessment`, `useCreateAssessment`, `useSaveScores`
- `src/queries/grade-engine.query.ts` — `useCalculateClass`

### Frontend Services
- `src/services/assessment-categories.ts`
- `src/services/assessments.ts`
- `src/services/grade-engine.ts`

### Dependencies
**Grade Engine reads:**
- `class_members` — validate ACTIVE status
- `assessment_categories` — get weights
- `assessments` — get assessment list
- `assessment_scores` — get student scores
- `students` — validate existence

**Grade Engine writes:**
- `student_final_grades` — UPSERT

**`student_final_grades` read by:**
- `report_cards` — pulls final grades into report card subjects
- `dashboard` — grade averages by class/subject/school

### Permissions
| Action | Roles |
|---|---|
| Categories — All CRUD | All authenticated |
| Assessments — Read | All authenticated |
| Assessments — Create/Update/Scores | SuperAdmin, SchoolAdmin, Principal, Teacher |
| Assessments — Delete | SuperAdmin, SchoolAdmin, Principal |
| Grade Engine — Calculate | SuperAdmin, SchoolAdmin, Principal, Teacher |
| Grade Engine — Read | All authenticated |

### RBAC Roles
- Teachers create/update own assessments and input scores
- HomeroomTeacher: read-only on assessments
- Admin roles: delete assessments
- Teacher sees only assessments for their own classes/subjects

### Tenant Requirements
- `assessment_categories.school_id` — categories are school-scoped
- `assessments.school_id` — all queries filtered
- `student_final_grades` unique constraint: `(student_id, subject_id, academic_year_id)` — no school_id in unique key (student_id is globally unique enough)
- Weight validation scoped per school: `getTotalWeight(schoolId)`

---

## 8. Reporting & Documents

**Purpose:** Transforms raw academic data into formal, printable documents. Report cards (rapor) are generated from grade engine output + attendance summaries. PDFs are rendered via Puppeteer. This domain is the end product of the entire academic pipeline.

### Database Tables
| Table | Role |
|---|---|
| `report_cards` | Master report card per student per semester |
| `report_card_subjects` | Per-subject grade line items |
| `report_card_attendances` | Attendance summary (sick/permission/absent) |
| `extracurriculars` | Master extracurricular list per school |
| `student_extracurriculars` | Student's extracurricular participation + predicate |
| `student_achievements` | Student awards and achievements |
| `p5_projects` | Kurikulum Merdeka P5 project assessments |

### Routes

**Report Cards**
| Method | Path | Notes |
|---|---|---|
| POST | `/report-cards/generate` | Creates DRAFT from grade engine + attendance |
| POST | `/report-cards/:id/publish` | DRAFT → PUBLISHED |
| PUT | `/report-cards/notes` | Homeroom teacher notes |
| POST | `/report-cards/achievement` | Add achievement to report card |
| POST | `/report-cards/extracurricular` | Add extracurricular to report card |
| POST | `/report-cards/p5` | Add P5 project to report card |
| DELETE | `/report-cards` | Soft delete |
| GET | `/report-cards` | List with filters |
| GET | `/report-cards/:id` | Full detail with all joins |
| GET | `/report-cards/student/:studentId` | By student + semester |
| GET | `/report-cards/class/:classId` | All students in class |

**PDF Generator**
| Method | Path |
|---|---|
| GET | `/pdf-generator/report-card/:reportCardId` |
| GET | `/pdf-generator/attendance/class/:classId` |
| GET | `/pdf-generator/journals/teacher/:teacherId` |
| GET | `/pdf-generator/assessments/:assessmentId` |
| GET | `/pdf-generator/students` |
| GET | `/pdf-generator/teachers` |

**Import**
| Method | Path |
|---|---|
| POST | `/import/preview` |
| POST | `/import/teachers` |
| POST | `/import/students` |
| POST | `/import/classes` |
| POST | `/import/subjects` |
| POST | `/import/class-members` |
| POST | `/import/schedules` |
| GET | `/import/templates/*` |

### Controllers
- `src/modules/report-cards/controller/reportCardController.ts`
- `src/modules/pdf-generator/controller/pdfGeneratorController.ts`
- `src/modules/import/controller/importController.ts`

### Services
**ReportCardService** (no repository — queries DB directly)
- `generateReportCard` — validates ACTIVE membership, counts attendance, pulls final grades, inserts DRAFT
- `publishReportCard` — DRAFT → PUBLISHED
- `getReportCardDetails` — full join: student, class, teacher, subjects, attendance, extracurriculars, achievements, P5
- `getAllReportCards` — role-aware: HomeroomTeacher sees own class only; Teacher sees nothing
- `updateHomeroomTeacherNotes`, `addAchievement`, `addExtracurricular`, `addP5Project`
- `deleteReportCard` — soft delete
- `checkPublishedLock()` — only SuperAdmin can mutate PUBLISHED
- ⚠️ `getClassReportCards` defined twice (lines 296 + 377) — **known bug**

**PdfGeneratorService** (no repository)
- Calls HTML template generators → Puppeteer → PDF Buffer

**ImportService**
- `previewExcel`, `importTeachers`, `importStudents`, `importClasses`, `importSubjects`, `importClassMembers`, `importSchedules`
- Uses `xlsx` (SheetJS), runs in transaction, writes `audit_logs`

### Repositories
- Report Cards: **none** — service queries directly
- PDF Generator: **none** — reads via service layer
- Import: `src/modules/import/repository/importRepository.ts`
  - Read-only validation queries against all entity tables

### Frontend Pages
| Page | Project | Path |
|---|---|---|
| Report Cards | Web | `(dashboard)/report-cards/page.tsx` |
| Import | Web | `(dashboard)/import/page.tsx` |

### Frontend Queries
- `src/queries/report-cards.query.ts` — `useReportCards`, `useCreateReportCard`, `usePublishReportCard`
- Import: uses `importService` directly (no query hook)

### Frontend Services
- `src/services/report-cards.ts`
- `src/services/pdf-generator.ts` — `api.download()` for binary PDF
- `src/services/import.ts`

### Dependencies
**Report Cards read:**
- `students`, `class_members`, `classes`, `teachers`, `academic_years`
- `attendance_details`, `attendances`, `schedules` — for attendance count
- `student_final_grades` — for grade line items
- `subjects` — for subject names
- `extracurriculars` — validates master list on add

**Report Cards write:**
- `report_cards`, `report_card_subjects`, `report_card_attendances`
- `student_extracurriculars`, `student_achievements`, `p5_projects`

**PDF reads:** same as report cards + raw HTML templates

**Import writes:** `teachers`, `students`, `classes`, `subjects`, `class_members`, `schedules`, `audit_logs`

### Permissions
| Action | Roles |
|---|---|
| Generate report card | SuperAdmin, SchoolAdmin, Principal |
| Publish report card | SuperAdmin, SchoolAdmin, Principal |
| Read report cards | SuperAdmin, SchoolAdmin, Principal, HomeroomTeacher (own class) |
| Teacher read report cards | **Blocked** |
| Add notes/achievements/extracurriculars/P5 | SuperAdmin, SchoolAdmin, Principal, HomeroomTeacher |
| Mutate PUBLISHED report card | **SuperAdmin only** |
| PDF export | SuperAdmin, SchoolAdmin, Principal, Teacher, HomeroomTeacher |
| Import | SuperAdmin, SchoolAdmin, Principal |

### RBAC Roles
- HomeroomTeacher role is central to this domain — enriches report cards for their homeroom class
- Teacher role: zero access to report cards (only PDF export)
- Published Lock: irreversible except for SuperAdmin

### Tenant Requirements
- `report_cards.school_id` on all queries
- `extracurriculars.school_id` checked before adding to report card
- Unique: one report card per `(student_id, academic_year_id, semester)`
- ⚠️ `report_cards.semester` uses `'GANJIL'/'GENAP'` (UPPER) vs `academic_years.semester` which uses `'Ganjil'/'Genap'` (Title Case)

---

## 9. Platform Operations

**Purpose:** Cross-cutting aggregation layer. The Dashboard reads from virtually all tables to provide role-aware operational summaries. No data is written by this domain (except audit logs via import).

### Database Tables
Reads from all tables. Writes nothing.

### Routes
| Method | Path | Returns |
|---|---|---|
| GET | `/dashboard/summary` | Total students, teachers, classes, subjects, schedules, active year |
| GET | `/dashboard/attendance` | Today's PRESENT/SICK/PERMISSION/ABSENT counts |
| GET | `/dashboard/journals` | Today's journal fill rate |
| GET | `/dashboard/assessments` | Assessment counts: total, month, week |
| GET | `/dashboard/grades` | Avg score: school-wide, per class, per subject |
| GET | `/dashboard/report-cards` | DRAFT vs PUBLISHED count |
| GET | `/dashboard/academic-years` | All academic years for school |
| GET | `/dashboard/activities` | Recent activity feed |
| GET | `/dashboard/pending-tasks` | Unfilled attendance/journals for today's finished schedules |
| GET | `/dashboard/student-highlights` | Top 3 students + 3 most-absent students |

### Controller
`src/modules/dashboard/controller/dashboardController.ts`

### Service
`src/modules/dashboard/service/dashboardService.ts` — no repository; queries DB directly

**9 methods, all role-aware:**
- `getSchoolSummary` — Admin: school-wide counts; Teacher: own schedule context
- `getAttendanceSummary` — Teacher: own sessions only
- `getTeachingJournalSummary` — Teacher: own journals only
- `getAssessmentSummary` — Teacher: own assessments only
- `getGradeSummary` — Teacher: own classes/subjects only
- `getReportCardSummary` — Teacher: own classes only
- `getAcademicYears` — all roles, no scoping
- `getPendingTasks` — **Teacher/HomeroomTeacher only**; compares finished schedules to filled attendance/journals
- `getStudentHighlights` — Teacher: own classes; Admin: school-wide

### Repository
None — DashboardService queries all tables directly.

### Frontend Pages
| Project | Page | Path |
|---|---|---|
| Web | Dashboard | `(dashboard)/dashboard/page.tsx` |
| Mobile | Dashboard | `(dashboard)/dashboard/page.tsx` |

### Frontend Queries
`src/queries/dashboard.query.ts`
- `useDashboardSummary`, `useDashboardAttendance`, `useDashboardActivities`
- `useDashboardPendingTasks`, `useDashboardStudentHighlights`
- `useAcademicYears` — also used by schedules, assessments, grade-engine, report-cards, class-members, promotions pages

### Frontend Services
`src/services/dashboard.ts`

### Dependencies
Dashboard reads from every major table:
`students`, `teachers`, `classes`, `subjects`, `schedules`, `attendances`, `attendance_details`, `teaching_journals`, `assessments`, `student_final_grades`, `report_cards`, `class_members`, `academic_years`

The `pending-tasks` endpoint specifically:
1. Gets today's schedules for the teacher
2. Filters to finished schedules (`endTime < currentTime`)
3. Checks which have an `attendances` record for today
4. Checks which have a `teaching_journals` record for today
5. Returns missing ones as `ATTENDANCE` or `JOURNAL` task items

### Permissions
| Action | Roles |
|---|---|
| All dashboard endpoints | SuperAdmin, SchoolAdmin, Principal, Teacher, HomeroomTeacher |
| pending-tasks | Teacher, HomeroomTeacher (returns empty for admin roles) |

### RBAC Roles
- Dashboard is the only module where **all 5 operational roles** have equal route access
- Scoping is applied inside the service, not at the route level
- `Student` role: no dashboard access (student portal not built)

### Tenant Requirements
- All queries include `school_id`
- No caching layer — every dashboard load hits MySQL directly
- Performance note: `getStudentHighlights` runs multiple aggregate queries per request

---

## Domain Dependency Map

```
SCHOOL (schools + academic_years)
  │
  ├──► TEACHERS ──────────────────────────────────────┐
  │                                                    │
  ├──► STUDENTS ──────────────────────────────────────┤
  │                                                    │
  └──► ACADEMIC STRUCTURE                             │
        (subjects, classes, class_members, schedules)  │
              │                           │            │
              ▼                           ▼            │
       DAILY OPERATIONS            ASSESSMENT &        │
       (attendance,                GRADING             │
        teaching_journals)         (assessments,       │
              │                     scores,            │
              │                     grade_engine,      │
              │                     final_grades)      │
              │                           │            │
              └───────────────────────────┘            │
                              │                        │
                              ▼                        │
                    REPORTING & DOCUMENTS ◄────────────┘
                    (report_cards, PDF, import)
                              │
                              ▼
                    PLATFORM OPERATIONS
                    (dashboard — reads everything)
```

---
*End of GuruHub Project Map by Business Domain*
