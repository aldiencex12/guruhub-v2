# 07 — Dependency Graph

> Source: All `routes/*.ts`, `service/*.ts`, `repository/*.ts`, frontend `queries/*.ts`, `services/*.ts`
> Cross-ref: [03_API](03_API.md) | [06_Modules](06_Modules.md)

---

## Reading This Document

Each module is shown as:
```
Frontend Page
  └─ queries/[module].query.ts       (TanStack Query hook)
       └─ services/[module].ts       (HTTP service layer)
            └─ api.ts                (Base HTTP client)
                 └─ [METHOD] /path  (API endpoint)
                      └─ Controller
                           └─ Service
                                └─ Repository
                                     └─ DB Tables
```

Modules without a repository access the DB directly from the service.

---

## M01 — Authentication

```
/login page
  └─ authService.login() (direct, no query hook)
       └─ api.ts → POST /auth/login
            └─ authController
                 └─ AuthService.login()
                      └─ authRepository
                           ├─ schools        (validate school)
                           ├─ users          (find by email + schoolId)
                           ├─ sessions       (CREATE session row)
                           └─ audit_logs     (INSERT login event)

Token Refresh (api.ts interceptor)
  └─ api.ts → POST /auth/refresh
       └─ authController
            └─ AuthService.refresh()
                 └─ authRepository
                      ├─ sessions (find by tokenId, validate is_revoked)
                      ├─ sessions (REVOKE old, CREATE new)
                      └─ users   (find by userId)
```

---

## M02 — Teachers

```
/teachers
  └─ queries/teachers.query.ts
       └─ services/teachers.ts
            └─ api.ts

  GET  /teachers          → TeachersController.getAll
  GET  /teachers/:id      → TeachersController.getById
  POST /teachers          → TeachersController.create
  PUT  /teachers/:id      → TeachersController.update
  DEL  /teachers/:id      → TeachersController.delete

  All → TeachersService → TeachersRepository
             └─ DB: teachers
```

---

## M03 — Students

```
/students
  └─ queries/students.query.ts
       └─ services/students.ts
            └─ api.ts

  GET  /students           → StudentsController.getAll
  GET  /students/:id       → StudentsController.getById
  POST /students           → StudentsController.create
  PUT  /students/:id       → StudentsController.update
  DEL  /students/:id       → StudentsController.delete
  POST /students/bulk-delete → StudentsController.deleteBulk

  All → StudentsService → StudentsRepository
             └─ DB: students
             Note: softDelete also sets nisn = NULL
```

---

## M04 — Classes

```
/classes
  └─ queries/classes.query.ts
       └─ services/classes.ts
            └─ api.ts

  GET  /classes             → ClassesController.getAll
  GET  /classes/:id         → ClassesController.getById
  POST /classes             → ClassesController.create
  PUT  /classes/:id         → ClassesController.update
  DEL  /classes/:id         → ClassesController.delete
  POST /classes/bulk-delete → ClassesController.deleteBulk

  All → ClassesService → ClassesRepository
             └─ DB: classes
```

---

## M05 — Class Members

```
/class-members, /promotions
  └─ queries/class-members.query.ts
       └─ services/class-members.ts
            └─ api.ts

  GET  /class-members         → ClassMembersController.getAll
  GET  /class-members/:id     → ClassMembersController.getById
  POST /class-members         → ClassMembersController.create
  PUT  /class-members/:id     → ClassMembersController.update
  DEL  /class-members/:id     → ClassMembersController.delete
  POST /class-members/promote → ClassMembersController.promote

  All → ClassMembersService → ClassMembersRepository
             └─ DB: class_members
             Service also reads:
               ├─ students   (validate tenant + existence)
               ├─ classes    (validate tenant + existence)
               └─ academic_years (validate tenant)
```

---

## M06 — Subjects

```
/subjects
  └─ queries/subjects.query.ts
       └─ services/subjects.ts
            └─ api.ts

  GET  /subjects            → SubjectsController.getAll
  GET  /subjects/:id        → SubjectsController.getById
  POST /subjects            → SubjectsController.create
  PUT  /subjects/:id        → SubjectsController.update
  DEL  /subjects/:id        → SubjectsController.delete
  POST /subjects/bulk-delete → SubjectsController.deleteBulk

  All → SubjectsService → SubjectsRepository
             └─ DB: subjects
             Service (getAll for Teacher) also reads:
               └─ schedules (to determine allowedSubjectIds)
```

---

## M07 — Academic Years

```
/academic-years, /classes (picker), /schedules (picker)
  └─ queries/academic-years.query.ts
  └─ queries/dashboard.query.ts (useAcademicYears)
       └─ services/academic-years.ts
            └─ api.ts

  GET  /academic-years      → AcademicYearsController.getAll
  GET  /academic-years/:id  → AcademicYearsController.getById
  POST /academic-years      → AcademicYearsController.create
  PUT  /academic-years/:id  → AcademicYearsController.update
  DEL  /academic-years/:id  → AcademicYearsController.delete

  All → AcademicYearsService → AcademicYearsRepository
             └─ DB: academic_years
             create/update also calls:
               └─ deactivateAllOtherYears() (same table)
```

---

## M08 — Schedules

```
/schedules
  └─ queries/schedules.query.ts
       └─ services/schedules.ts
            └─ api.ts

  GET  /schedules            → SchedulesController.getAll
  GET  /schedules/:id        → SchedulesController.getById
  POST /schedules            → SchedulesController.create
  PUT  /schedules/:id        → SchedulesController.update
  DEL  /schedules/:id        → SchedulesController.delete
  POST /schedules/bulk-delete → SchedulesController.bulkDelete
  DEL  /schedules/delete-all → SchedulesController.deleteAll

  All → SchedulesService → SchedulesRepository
             └─ DB: schedules
```

---

## M09 — Attendance

```
/attendance (web + mobile)
  └─ queries/attendance.query.ts
       └─ services/attendance.ts
            └─ api.ts

  GET  /attendance           → AttendanceController.getAll
  GET  /attendance/recap     → AttendanceController.getRecap
  GET  /attendance/:id       → AttendanceController.getById
  POST /attendance           → AttendanceController.create
  PUT  /attendance/:id       → AttendanceController.update
  DEL  /attendance/:id       → AttendanceController.delete  [Admin only]

  All → AttendanceService → AttendanceRepository
             └─ DB: attendances, attendance_details
             Service also reads:
               ├─ teachers      (resolve userId → teacherId)
               ├─ schedules     (validate schedule)
               └─ class_members (get student list for session)
```

---

## M10 — Teaching Journals

```
/teaching-journals (web + mobile)
  └─ queries/teaching-journals.query.ts
       └─ services/teaching-journals.ts
            └─ api.ts

  GET  /teaching-journals      → TeachingJournalsController.getAll
  GET  /teaching-journals/:id  → TeachingJournalsController.getById
  POST /teaching-journals      → TeachingJournalsController.create
  PUT  /teaching-journals/:id  → TeachingJournalsController.update
  DEL  /teaching-journals/:id  → TeachingJournalsController.delete

  All → TeachingJournalsService → TeachingJournalsRepository
              └─ DB: teaching_journals
              Service.create also reads:
                ├─ schedules  (validate schedule)
                └─ teachers   (resolve userId → teacherId)
```

---

## M11 — Assessment Categories

```
/assessment-categories
  └─ queries/assessment-categories.query.ts
       └─ services/assessment-categories.ts
            └─ api.ts

  GET  /assessment-categories      → AssessmentCategoriesController.getAll
  GET  /assessment-categories/:id  → AssessmentCategoriesController.getById
  POST /assessment-categories      → AssessmentCategoriesController.create
  PUT  /assessment-categories/:id  → AssessmentCategoriesController.update
  DEL  /assessment-categories/:id  → AssessmentCategoriesController.delete

  All → AssessmentCategoriesService → AssessmentCategoriesRepository
               └─ DB: assessment_categories
```

---

## M12 — Assessments

```
/assessments (web + mobile)
  └─ queries/assessments.query.ts
       └─ services/assessments.ts
            └─ api.ts

  GET  /assessments             → AssessmentsController.getAll
  GET  /assessments/:id         → AssessmentsController.getById
  POST /assessments             → AssessmentsController.create
  PUT  /assessments/:id         → AssessmentsController.update
  POST /assessments/:id/scores  → AssessmentsController.inputScores
  DEL  /assessments/:id         → AssessmentsController.delete

  All → AssessmentsService → AssessmentsRepository
              └─ DB: assessments, assessment_scores
```

---

## M13 — Grade Engine

```
/grade-engine
  └─ queries/grade-engine.query.ts
       └─ services/grade-engine.ts
            └─ api.ts

  POST /grade-engine/calculate        → GradeEngineController.calculateStudent
  POST /grade-engine/calculate-class  → GradeEngineController.calculateClass
  GET  /grade-engine/student/:id      → GradeEngineController.getStudentGrade

  All → GradeEngineService (no repository — queries DB directly)
              └─ DB reads:
                   ├─ class_members       (validate ACTIVE status)
                   ├─ assessment_categories (get weights)
                   ├─ assessments          (get assessments for class+subject+year)
                   ├─ assessment_scores    (get student scores)
                   └─ students            (validate existence)
              └─ DB writes:
                   └─ student_final_grades (UPSERT)
```

---

## M14 — Report Cards

```
/report-cards
  └─ queries/report-cards.query.ts
       └─ services/report-cards.ts
            └─ api.ts

  POST /report-cards/generate             → ReportCardController.generate
  POST /report-cards/:id/publish          → ReportCardController.publish
  PUT  /report-cards/notes                → ReportCardController.updateNotes
  POST /report-cards/achievement          → ReportCardController.addAchievement
  POST /report-cards/extracurricular      → ReportCardController.addExtracurricular
  POST /report-cards/p5                   → ReportCardController.addP5
  DEL  /report-cards                      → ReportCardController.delete
  GET  /report-cards                      → ReportCardController.getAll
  GET  /report-cards/:id                  → ReportCardController.getDetails
  GET  /report-cards/student/:studentId   → ReportCardController.getStudentReport
  GET  /report-cards/class/:classId       → ReportCardController.getClassReports

  All → ReportCardService (no repository — queries DB directly)
              └─ DB reads:
                   ├─ students            (validate)
                   ├─ class_members       (validate ACTIVE)
                   ├─ attendance_details  (count SICK/PERMISSION/ABSENT)
                   ├─ attendances         (join for attendance count)
                   ├─ schedules           (join for attendance scope)
                   ├─ student_final_grades (pull grades)
                   ├─ subjects            (join for subject names)
                   ├─ classes             (join for class info)
                   ├─ teachers            (join for homeroom teacher)
                   ├─ academic_years      (join)
                   └─ extracurriculars    (validate master list)
              └─ DB writes:
                   ├─ report_cards
                   ├─ report_card_subjects
                   ├─ report_card_attendances
                   ├─ student_extracurriculars
                   ├─ student_achievements
                   └─ p5_projects
```

---

## M15 — Dashboard

```
/dashboard (web + mobile)
  └─ queries/dashboard.query.ts
       └─ services/dashboard.ts
            └─ api.ts

  GET /dashboard/summary          → DashboardController.getSummary
  GET /dashboard/attendance       → DashboardController.getAttendance
  GET /dashboard/journals         → DashboardController.getJournals
  GET /dashboard/assessments      → DashboardController.getAssessments
  GET /dashboard/grades           → DashboardController.getGrades
  GET /dashboard/report-cards     → DashboardController.getReportCards
  GET /dashboard/academic-years   → DashboardController.getAcademicYears
  GET /dashboard/activities       → DashboardController.getActivities
  GET /dashboard/pending-tasks    → DashboardController.getPendingTasks
  GET /dashboard/student-highlights → DashboardController.getStudentHighlights

  All → DashboardService (no repository)
              └─ DB reads: students, teachers, classes, subjects,
                           schedules, attendances, attendance_details,
                           teaching_journals, assessments, student_final_grades,
                           report_cards, class_members, academic_years
```

---

## M16 — PDF Generator

```
/report-cards page → download button
  └─ services/pdf-generator.ts
       └─ api.download() → GET /pdf-generator/...

  GET /pdf-generator/report-card/:id        → reads: report_cards + all joins
  GET /pdf-generator/attendance/class/:id   → reads: attendances + details
  GET /pdf-generator/journals/teacher/:id   → reads: teaching_journals
  GET /pdf-generator/assessments/:id        → reads: assessments + scores
  GET /pdf-generator/students               → reads: students + class_members
  GET /pdf-generator/teachers               → reads: teachers

  All → PdfGeneratorService (no repository)
              └─ Calls HTML template generators
              └─ Puppeteer renders HTML → PDF Buffer
              └─ Returns binary PDF response
```

---

## M17 — Import

```
/import page
  └─ services/import.ts (direct — not via query hook)
       └─ api.ts → POST /import/...

  POST /import/teachers       → ImportController.importTeachers
  POST /import/students       → ImportController.importStudents
  POST /import/classes        → ImportController.importClasses
  POST /import/subjects       → ImportController.importSubjects
  POST /import/class-members  → ImportController.importClassMembers
  POST /import/schedules      → ImportController.importSchedules
  POST /import/preview        → ImportController.preview

  All → ImportService (no repository — uses ImportRepository for reads)
              └─ ImportRepository reads:
                   ├─ academic_years  (get active year)
                   ├─ teachers        (validate NIP uniqueness)
                   ├─ students        (validate NISN uniqueness)
                   ├─ classes         (validate class names)
                   ├─ subjects        (validate subject codes)
                   ├─ class_members   (check existing memberships)
                   └─ schedules       (check conflicts)
              └─ DB writes (in transaction):
                   ├─ teachers / students / classes / subjects
                   ├─ class_members / schedules
                   └─ audit_logs (per import operation)
```

---

## M18 — Student Discipline

```
/discipline-violations
  └─ queries/discipline.query.ts
       └─ services/discipline.ts
            └─ api.ts

  GET  /discipline/categories              → DisciplineController.getAllCategories
  POST /discipline/categories              → DisciplineController.createCategory
  PUT  /discipline/categories/:id          → DisciplineController.updateCategory
  DEL  /discipline/categories/:id          → DisciplineController.deleteCategory

  GET  /discipline/types                   → DisciplineController.getAllTypes
  POST /discipline/types                   → DisciplineController.createType
  PUT  /discipline/types/:id               → DisciplineController.updateType
  DEL  /discipline/types/:id               → DisciplineController.deleteType

  GET  /discipline/incidents               → DisciplineController.getAllIncidents
  GET  /discipline/incidents/:id           → DisciplineController.getIncidentById
  POST /discipline/incidents               → DisciplineController.createIncident
  PUT  /discipline/incidents/:id           → DisciplineController.updateIncident
  POST /discipline/incidents/:id/status    → DisciplineController.updateIncidentStatus
  DEL  /discipline/incidents/:id           → DisciplineController.deleteIncident

  GET  /discipline/policies                → DisciplineController.getPolicy
  PUT  /discipline/policies                → DisciplineController.updatePolicy

  GET  /discipline/sanctions/thresholds    → DisciplineController.getAllThresholds
  POST /discipline/sanctions/thresholds    → DisciplineController.createThreshold
  PUT  /discipline/sanctions/thresholds/:id → DisciplineController.updateThreshold
  DEL  /discipline/sanctions/thresholds/:id → DisciplineController.deleteThreshold

  GET  /discipline/sanctions/logs          → DisciplineController.getAllSanctionLogs
  POST /discipline/sanctions/logs          → DisciplineController.createSanctionLog

  GET  /discipline/analytics/heatmap       → DisciplineController.getHeatmap
  GET  /discipline/analytics/locations     → DisciplineController.getLocations
  GET  /discipline/analytics/times         → DisciplineController.getTimes
  GET  /discipline/analytics/reporters     → DisciplineController.getReporters
  GET  /discipline/analytics/trends        → DisciplineController.getTrends

  All → DisciplineService → DisciplineRepository
              ├─ DB: discipline_categories, discipline_types, discipline_incidents
              ├─ DB: discipline_incident_students, discipline_incident_witnesses
              ├─ DB: discipline_incident_attachments, discipline_policies
              ├─ DB: discipline_sanction_thresholds, discipline_sanction_logs
              Service also reads:
                ├─ students       (validate existence)
                ├─ classes        (resolve student active class)
                ├─ academic_years (resolve active academic year)
                ├─ users          (resolve reporter/witness user ids)
                └─ teachers       (resolve handler/issuer teacher ids)
```

---

## Cross-Module Read Dependencies (Service Layer)

The following shows which service methods read from OTHER modules' tables:

| Service | Reads From |
|---|---|
| `AttendanceService` | `teachers`, `schedules`, `class_members` |
| `ClassMembersService` | `students`, `classes`, `academic_years`, `schedules` |
| `GradeEngineService` | `class_members`, `assessment_categories`, `assessments`, `assessment_scores`, `students` |
| `ReportCardService` | `students`, `class_members`, `attendance_details`, `attendances`, `schedules`, `student_final_grades`, `subjects`, `classes`, `teachers`, `academic_years`, `extracurriculars` |
| `DashboardService` | all major tables |
| `ImportService` | `academic_years`, `teachers`, `students`, `classes`, `subjects`, `class_members`, `schedules` |
| `SubjectsService` | `schedules` (for teacher-scoped filtering) |
| `TeachingJournalsService` | `schedules`, `teachers` |
| `DisciplineService` | `students`, `classes`, `academic_years`, `users`, `teachers` |

