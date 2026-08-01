# GuruHub — Complete Module-by-Module Dependency Graph

> Generated from live source code. Last updated: 2026-07-23
> Cross-ref: [02_Database](02_Database.md) | [03_API](03_API.md) | [04_RBAC](04_RBAC.md) | [05_MultiTenant](05_MultiTenant.md) | [06_Modules](06_Modules.md) | [11_ProjectMap_ByDomain](11_ProjectMap_ByDomain.md)

---

## 1. Auth Module (`/auth`)

- **Frontend Page**: `front-guruhub/src/app/(auth)/login/page.tsx` & `front-guruhub-mobile/src/app/(auth)/login/page.tsx`
- **React Components**: `LoginForm`, `Button`, `Input`
- **TanStack Query**: None (Direct service invocation)
- **API Client**: `front-guruhub/src/services/api.ts` (`api.post("/auth/login")`, `api.post("/auth/refresh")`, `api.post("/auth/logout")`)
- **API Route**: `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`, `GET /auth/protected/me`
- **Controller**: `guruhub-api/src/modules/auth/controller/authController.ts`
- **Service**: `guruhub-api/src/modules/auth/service/authService.ts`
- **Repository**: `guruhub-api/src/modules/auth/repository/authRepository.ts`
- **Database Table**: `users`, `sessions`, `audit_logs`
- **Related Tables**: `schools`
- **RBAC**: Public (`/login`, `/refresh`, `/logout`), All Authenticated (`/protected/me`), Admin/Principal (`/protected/admin-only`)
- **Tenant**: `x-school-id` header required for login to resolve tenant; `schoolId` embedded in JWT payload for token validation and tenant isolation.

---

## 2. Teachers Module (`/teachers`)

- **Frontend Page**: `front-guruhub/src/app/(dashboard)/teachers/page.tsx`
- **React Components**: `TeacherTable`, `TeacherFormModal`, `TeacherDeleteDialog`, `Button`, `Input`, `Pagination`
- **TanStack Query**: `front-guruhub/src/queries/teachers.query.ts` (`useTeachers`, `useCreateTeacher`, `useUpdateTeacher`, `useDeleteTeacher`)
- **API Client**: `front-guruhub/src/services/teachers.ts`
- **API Route**: `GET /teachers`, `GET /teachers/:id`, `POST /teachers`, `PUT /teachers/:id`, `DELETE /teachers/:id`
- **Controller**: `guruhub-api/src/modules/teachers/controller/teachersController.ts`
- **Service**: `guruhub-api/src/modules/teachers/service/teachersService.ts`
- **Repository**: `guruhub-api/src/modules/teachers/repository/teachersRepository.ts`
- **Database Table**: `teachers`
- **Related Tables**: `users`, `schools`, `classes`, `schedules`, `subject_teachers`
- **RBAC**: Read: All Authenticated Roles; Write/Delete: `SuperAdmin`, `SchoolAdmin`, `Principal`
- **Tenant**: Scoped via `school_id`. Soft-delete enforced using `deleted_at`. Unique constraint on `(school_id, nip)`.

---

## 3. Students Module (`/students`)

- **Frontend Page**: `front-guruhub/src/app/(dashboard)/students/page.tsx`
- **React Components**: `StudentTable`, `StudentFormModal`, `StudentDeleteDialog`, `BulkDeleteModal`
- **TanStack Query**: `front-guruhub/src/queries/students.query.ts` (`useStudents`, `useCreateStudent`, `useUpdateStudent`, `useDeleteStudent`, `useDeleteBulkStudents`)
- **API Client**: `front-guruhub/src/services/students.ts`
- **API Route**: `GET /students`, `GET /students/:id`, `POST /students`, `PUT /students/:id`, `DELETE /students/:id`, `POST /students/bulk-delete`
- **Controller**: `guruhub-api/src/modules/students/controller/studentsController.ts`
- **Service**: `guruhub-api/src/modules/students/service/studentsService.ts`
- **Repository**: `guruhub-api/src/modules/students/repository/studentsRepository.ts`
- **Database Table**: `students`
- **Related Tables**: `users`, `schools`, `class_members`, `attendance_details`, `assessment_scores`, `student_final_grades`, `report_cards`
- **RBAC**: All Actions: `SuperAdmin`, `SchoolAdmin`, `Principal`
- **Tenant**: Scoped via `school_id`. Special NISN Handling: `nisn` is set to `NULL` on soft-delete to prevent global unique index collisions.

---

## 4. Classes Module (`/classes`)

- **Frontend Page**: `front-guruhub/src/app/(dashboard)/classes/page.tsx`
- **React Components**: `ClassTable`, `ClassFormModal`, `ClassDeleteDialog`
- **TanStack Query**: `front-guruhub/src/queries/classes.query.ts` (`useClasses`, `useCreateClass`, `useUpdateClass`, `useDeleteClass`, `useDeleteBulkClasses`)
- **API Client**: `front-guruhub/src/services/classes.ts`
- **API Route**: `GET /classes`, `GET /classes/:id`, `POST /classes`, `PUT /classes/:id`, `DELETE /classes/:id`, `POST /classes/bulk-delete`
- **Controller**: `guruhub-api/src/modules/classes/controller/classesController.ts`
- **Service**: `guruhub-api/src/modules/classes/service/classesService.ts`
- **Repository**: `guruhub-api/src/modules/classes/repository/classesRepository.ts`
- **Database Table**: `classes`
- **Related Tables**: `academic_years`, `teachers` (homeroom), `class_members`, `schedules`, `assessments`, `report_cards`
- **RBAC**: All Actions: `SuperAdmin`, `SchoolAdmin`, `Principal`
- **Tenant**: Scoped via `school_id`. Soft-delete via `deleted_at`. Unique constraint on `(school_id, academic_year_id, name, deleted_at)`.

---

## 5. Class Members Module (`/class-members`)

- **Frontend Page**: `front-guruhub/src/app/(dashboard)/class-members/page.tsx` & `front-guruhub/src/app/(dashboard)/promotions/page.tsx`
- **React Components**: `ClassMemberTable`, `AddMemberModal`, `PromoteStudentsForm`, `StatusBadge`
- **TanStack Query**: `front-guruhub/src/queries/class-members.query.ts` (`useClassMembers`, `useAddClassMember`, `useRemoveClassMember`, `usePromoteStudents`)
- **API Client**: `front-guruhub/src/services/class-members.ts`
- **API Route**: `GET /class-members`, `GET /class-members/:id`, `POST /class-members`, `PUT /class-members/:id`, `DELETE /class-members/:id`, `POST /class-members/promote`
- **Controller**: `guruhub-api/src/modules/class-members/controller/classMembersController.ts`
- **Service**: `guruhub-api/src/modules/class-members/service/classMembersService.ts`
- **Repository**: `guruhub-api/src/modules/class-members/repository/classMembersRepository.ts`
- **Database Table**: `class_members`
- **Related Tables**: `students`, `classes`, `academic_years`, `schools`, `schedules`
- **RBAC**: Read: All Authenticated (Teachers/HT scoped to taught/homeroom classes); Write/Promote: `SuperAdmin`, `SchoolAdmin`, `Principal`
- **Tenant**: Scoped via `school_id`. Validates student, class, and academic year tenant ownership. Enforces max 1 ACTIVE status per student per academic year.

---

## 6. Subjects Module (`/subjects`)

- **Frontend Page**: `front-guruhub/src/app/(dashboard)/subjects/page.tsx`
- **React Components**: `SubjectTable`, `SubjectFormModal`, `SubjectDeleteDialog`
- **TanStack Query**: `front-guruhub/src/queries/subjects.query.ts` (`useSubjects`, `useCreateSubject`, `useUpdateSubject`, `useDeleteSubject`, `useDeleteBulkSubjects`)
- **API Client**: `front-guruhub/src/services/subjects.ts`
- **API Route**: `GET /subjects`, `GET /subjects/:id`, `POST /subjects`, `PUT /subjects/:id`, `DELETE /subjects/:id`, `POST /subjects/bulk-delete`
- **Controller**: `guruhub-api/src/modules/subjects/controller/subjectsController.ts`
- **Service**: `guruhub-api/src/modules/subjects/service/subjectsService.ts`
- **Repository**: `guruhub-api/src/modules/subjects/repository/subjectsRepository.ts`
- **Database Table**: `subjects`
- **Related Tables**: `subject_teachers`, `schedules`, `assessments`, `student_final_grades`, `report_card_subjects`
- **RBAC**: Read: All Authenticated (Teacher filtered by assigned schedules); Write/Delete: `SuperAdmin`, `SchoolAdmin`, `Principal`
- **Tenant**: Scoped via `school_id`. Soft-delete via `deleted_at`. Unique index on `(school_id, code, deleted_at)` and `(school_id, name, grade_level, deleted_at)`.

---

## 7. Academic Years Module (`/academic-years`)

- **Frontend Page**: `front-guruhub/src/app/(dashboard)/academic-years/page.tsx`
- **React Components**: `AcademicYearTable`, `AcademicYearFormModal`, `ActiveYearBadge`
- **TanStack Query**: `front-guruhub/src/queries/academic-years.query.ts` (`useAcademicYears`, CRUD mutations)
- **API Client**: `front-guruhub/src/services/academic-years.ts`
- **API Route**: `GET /academic-years`, `GET /academic-years/:id`, `POST /academic-years`, `PUT /academic-years/:id`, `DELETE /academic-years/:id`
- **Controller**: `guruhub-api/src/modules/academic-years/controller/academicYearsController.ts`
- **Service**: `guruhub-api/src/modules/academic-years/service/academicYearsService.ts`
- **Repository**: `guruhub-api/src/modules/academic-years/repository/academicYearsRepository.ts`
- **Database Table**: `academic_years`
- **Related Tables**: `classes`, `schedules`, `assessments`, `class_members`, `student_final_grades`, `report_cards`
- **RBAC**: Read: All Authenticated; Write/Delete: `SuperAdmin`, `SchoolAdmin`, `Principal`
- **Tenant**: Scoped via `school_id`. Automatically deactivates other years in the same school when setting `is_active = true`.

---

## 8. Schedules Module (`/schedules`)

- **Frontend Page**: `front-guruhub/src/app/(dashboard)/schedules/page.tsx`
- **React Components**: `ScheduleTable`, `ScheduleFormModal`, `TimePicker`, `DaySelector`
- **TanStack Query**: `front-guruhub/src/queries/schedules.query.ts` (`useSchedules`, `useCreateSchedule`, `useUpdateSchedule`, `useDeleteSchedule`, `useBulkDeleteSchedules`, `useDeleteAllSchedules`)
- **API Client**: `front-guruhub/src/services/schedules.ts`
- **API Route**: `GET /schedules`, `GET /schedules/:id`, `POST /schedules`, `PUT /schedules/:id`, `DELETE /schedules/:id`, `POST /schedules/bulk-delete`, `DELETE /schedules/delete-all`
- **Controller**: `guruhub-api/src/modules/schedules/controller/schedulesController.ts`
- **Service**: `guruhub-api/src/modules/schedules/service/schedulesService.ts`
- **Repository**: `guruhub-api/src/modules/schedules/repository/schedulesRepository.ts`
- **Database Table**: `schedules`
- **Related Tables**: `classes`, `subjects`, `teachers`, `academic_years`, `attendances`, `teaching_journals`
- **RBAC**: Read: All Authenticated (Teachers see own schedules); Write/Delete: `SuperAdmin`, `SchoolAdmin`, `Principal`
- **Tenant**: Scoped via `school_id`. Soft-delete via `deleted_at`. Acts as operational anchor for daily teaching workflow.

---

## 9. Attendance Module (`/attendance`)

- **Frontend Page**: `front-guruhub/src/app/(dashboard)/attendance/page.tsx` & `front-guruhub-mobile/src/app/(dashboard)/attendance/page.tsx`
- **React Components**: `AttendanceSheet`, `AttendanceStatusSelector`, `AttendanceRecapTable`
- **TanStack Query**: `front-guruhub/src/queries/attendance.query.ts` (`useAttendances`, `useAttendance`, `useCreateAttendance`, `useAttendanceRecap`, `useDeleteAttendance`)
- **API Client**: `front-guruhub/src/services/attendance.ts`
- **API Route**: `GET /attendance`, `GET /attendance/recap`, `GET /attendance/:id`, `POST /attendance`, `PUT /attendance/:id`, `DELETE /attendance/:id`
- **Controller**: `guruhub-api/src/modules/attendance/controller/attendanceController.ts`
- **Service**: `guruhub-api/src/modules/attendance/service/attendanceService.ts`
- **Repository**: `guruhub-api/src/modules/attendance/repository/attendanceRepository.ts`
- **Database Table**: `attendances`, `attendance_details`
- **Related Tables**: `schedules`, `teachers`, `students`, `class_members`, `report_card_attendances`
- **RBAC**: Read/Create/Update: `SuperAdmin`, `SchoolAdmin`, `Principal`, `Teacher`, `HomeroomTeacher`; Delete: `SuperAdmin`, `SchoolAdmin`, `Principal` **ONLY** (Teachers hard-blocked)
- **Tenant**: Scoped via `school_id`. Hard-delete strategy for removal. Unique constraint on `(school_id, schedule_id, attendance_date)`.

---

## 10. Teaching Journals Module (`/teaching-journals`)

- **Frontend Page**: `front-guruhub/src/app/(dashboard)/teaching-journals/page.tsx` & `front-guruhub-mobile/src/app/(dashboard)/teaching-journals/page.tsx`
- **React Components**: `JournalTable`, `JournalFormModal`, `ReflectionInput`
- **TanStack Query**: `front-guruhub/src/queries/teaching-journals.query.ts` (`useJournals`, `useCreateJournal`, `useUpdateJournal`, `useDeleteJournal`)
- **API Client**: `front-guruhub/src/services/teaching-journals.ts`
- **API Route**: `GET /teaching-journals`, `GET /teaching-journals/:id`, `POST /teaching-journals`, `PUT /teaching-journals/:id`, `DELETE /teaching-journals/:id`
- **Controller**: `guruhub-api/src/modules/teaching-journals/controller/teachingJournalsController.ts`
- **Service**: `guruhub-api/src/modules/teaching-journals/service/teachingJournalsService.ts`
- **Repository**: `guruhub-api/src/modules/teaching-journals/repository/teachingJournalsRepository.ts`
- **Database Table**: `teaching_journals`
- **Related Tables**: `schedules`, `teachers`, `attendances`
- **RBAC**: All Actions: `SuperAdmin`, `SchoolAdmin`, `Principal`, `Teacher`, `HomeroomTeacher` (Teachers access own journals)
- **Tenant**: Scoped via `school_id`. Soft-delete via `deleted_at`. Unique index on `(schedule_id, journal_date)` dropped in migration 0007 to support soft-delete re-creation.

---

## 11. Assessment Categories Module (`/assessment-categories`)

- **Frontend Page**: `front-guruhub/src/app/(dashboard)/assessment-categories/page.tsx`
- **React Components**: `CategoryTable`, `CategoryFormModal`, `WeightIndicator`
- **TanStack Query**: `front-guruhub/src/queries/assessment-categories.query.ts` (`useCategories`, `useCreateCategory`, `useUpdateCategory`, `useDeleteCategory`)
- **API Client**: `front-guruhub/src/services/assessment-categories.ts`
- **API Route**: `GET /assessment-categories`, `GET /assessment-categories/:id`, `POST /assessment-categories`, `PUT /assessment-categories/:id`, `DELETE /assessment-categories/:id`
- **Controller**: `guruhub-api/src/modules/assessment-categories/controller/assessmentCategoriesController.ts`
- **Service**: `guruhub-api/src/modules/assessment-categories/service/assessmentCategoriesService.ts`
- **Repository**: `guruhub-api/src/modules/assessment-categories/repository/assessmentCategoriesRepository.ts`
- **Database Table**: `assessment_categories`
- **Related Tables**: `teachers`, `assessments`
- **RBAC**: All Actions: `SuperAdmin`, `SchoolAdmin`, `Principal`, `Teacher`, `HomeroomTeacher`
- **Tenant**: Scoped via `school_id`. Enforces maximum total weight threshold per school.

---

## 12. Assessments Module (`/assessments`)

- **Frontend Page**: `front-guruhub/src/app/(dashboard)/assessments/page.tsx` & `front-guruhub-mobile/src/app/(dashboard)/assessments/page.tsx`
- **React Components**: `AssessmentTable`, `AssessmentFormModal`, `ScoreGridInput`
- **TanStack Query**: `front-guruhub/src/queries/assessments.query.ts` (`useAssessments`, `useAssessment`, `useCreateAssessment`, `useSaveScores`, `useDeleteAssessment`)
- **API Client**: `front-guruhub/src/services/assessments.ts`
- **API Route**: `GET /assessments`, `GET /assessments/:id`, `POST /assessments`, `PUT /assessments/:id`, `POST /assessments/:id/scores`, `DELETE /assessments/:id`
- **Controller**: `guruhub-api/src/modules/assessments/controller/assessmentsController.ts`
- **Service**: `guruhub-api/src/modules/assessments/service/assessmentsService.ts`
- **Repository**: `guruhub-api/src/modules/assessments/repository/assessmentsRepository.ts`
- **Database Table**: `assessments`, `assessment_scores`
- **Related Tables**: `classes`, `subjects`, `teachers`, `academic_years`, `assessment_categories`, `students`
- **RBAC**: Read: All Authenticated; Create/Update/Scores: `SuperAdmin`, `SchoolAdmin`, `Principal`, `Teacher`; Delete: `SuperAdmin`, `SchoolAdmin`, `Principal`
- **Tenant**: Scoped via `school_id`. Soft-delete via `deleted_at` on parent assessment. Scores upserted atomically.

---

## 13. Grade Engine Module (`/grade-engine`)

- **Frontend Page**: `front-guruhub/src/app/(dashboard)/grade-engine/page.tsx`
- **React Components**: `GradeCalculationPanel`, `FinalGradeTable`, `CalculationProgressModal`
- **TanStack Query**: `front-guruhub/src/queries/grade-engine.query.ts` (`useCalculateClass`)
- **API Client**: `front-guruhub/src/services/grade-engine.ts`
- **API Route**: `POST /grade-engine/calculate`, `POST /grade-engine/calculate-class`, `GET /grade-engine/student/:studentId`
- **Controller**: `guruhub-api/src/modules/grade-engine/controller/gradeEngineController.ts`
- **Service**: `guruhub-api/src/modules/grade-engine/service/gradeEngineService.ts`
- **Repository**: None (Queries database directly in service layer)
- **Database Table**: `student_final_grades`
- **Related Tables**: `class_members`, `assessment_categories`, `assessments`, `assessment_scores`, `students`, `subjects`, `academic_years`
- **RBAC**: Calculate/Execute: `SuperAdmin`, `SchoolAdmin`, `Principal`, `Teacher`; Read: All Authenticated
- **Tenant**: Scoped via `school_id`. Evaluates active class memberships and updates `student_final_grades` via UPSERT.

---

## 14. Report Cards Module (`/report-cards`)

- **Frontend Page**: `front-guruhub/src/app/(dashboard)/report-cards/page.tsx`
- **React Components**: `ReportCardTable`, `ReportCardDetailView`, `PublishConfirmationModal`, `EnrichmentTabs`
- **TanStack Query**: `front-guruhub/src/queries/report-cards.query.ts` (`useReportCards`, `useCreateReportCard`, `usePublishReportCard`)
- **API Client**: `front-guruhub/src/services/report-cards.ts`
- **API Route**: `POST /report-cards/generate`, `POST /report-cards/:id/publish`, `PUT /report-cards/notes`, `POST /report-cards/achievement`, `POST /report-cards/extracurricular`, `POST /report-cards/p5`, `DELETE /report-cards`, `GET /report-cards`, `GET /report-cards/:id`, `GET /report-cards/student/:studentId`, `GET /report-cards/class/:classId`
- **Controller**: `guruhub-api/src/modules/report-cards/controller/reportCardController.ts`
- **Service**: `guruhub-api/src/modules/report-cards/service/reportCardService.ts`
- **Repository**: None (Direct SQL/Drizzle query execution inside service)
- **Database Table**: `report_cards`, `report_card_subjects`, `report_card_attendances`, `extracurriculars`, `student_extracurriculars`, `student_achievements`, `p5_projects`
- **Related Tables**: `students`, `class_members`, `attendance_details`, `student_final_grades`, `classes`, `teachers`, `academic_years`
- **RBAC**: Read/Enrich: `SuperAdmin`, `SchoolAdmin`, `Principal`, `HomeroomTeacher` (HomeroomTeacher restricted to assigned class); Generate/Publish/Delete: `SuperAdmin`, `SchoolAdmin`, `Principal`; Post-Publish Lock Mutation: `SuperAdmin` ONLY
- **Tenant**: Scoped via `school_id`. Unique record per `(student_id, academic_year_id, semester)`.

---

## 15. Dashboard Module (`/dashboard`)

- **Frontend Page**: `front-guruhub/src/app/(dashboard)/dashboard/page.tsx` & `front-guruhub-mobile/src/app/(dashboard)/dashboard/page.tsx`
- **React Components**: `SummaryCard`, `AttendanceChart`, `JournalProgressWidget`, `PendingTaskList`
- **TanStack Query**: `front-guruhub/src/queries/dashboard.query.ts` (`useDashboardSummary`, `useDashboardAttendance`, `useDashboardActivities`, `useDashboardPendingTasks`, `useDashboardStudentHighlights`, `useAcademicYears`)
- **API Client**: `front-guruhub/src/services/dashboard.ts`
- **API Route**: `GET /dashboard/summary`, `GET /dashboard/attendance`, `GET /dashboard/journals`, `GET /dashboard/assessments`, `GET /dashboard/grades`, `GET /dashboard/report-cards`, `GET /dashboard/academic-years`, `GET /dashboard/activities`, `GET /dashboard/pending-tasks`, `GET /dashboard/student-highlights`
- **Controller**: `guruhub-api/src/modules/dashboard/controller/dashboardController.ts`
- **Service**: `guruhub-api/src/modules/dashboard/service/dashboardService.ts`
- **Repository**: None (Aggregates across multiple entities directly)
- **Database Table**: Read-only aggregation across all application tables
- **Related Tables**: `students`, `teachers`, `classes`, `subjects`, `schedules`, `attendances`, `teaching_journals`, `assessments`, `student_final_grades`, `report_cards`, `class_members`, `academic_years`
- **RBAC**: All Actions: `SuperAdmin`, `SchoolAdmin`, `Principal`, `Teacher`, `HomeroomTeacher` (Internal scoping applied based on user role)
- **Tenant**: Scoped via `school_id`. Read-only operation without caching.

---

## 16. PDF Generator Module (`/pdf-generator`)

- **Frontend Page**: Triggered via Print/Download buttons on `front-guruhub/src/app/(dashboard)/report-cards/page.tsx` & other list pages
- **React Components**: `PdfDownloadButton`, `PrintHeader`
- **TanStack Query**: None (Direct binary stream download via HTTP client)
- **API Client**: `front-guruhub/src/services/pdf-generator.ts` (`api.download()`)
- **API Route**: `GET /pdf-generator/report-card/:reportCardId`, `GET /pdf-generator/attendance/class/:classId`, `GET /pdf-generator/journals/teacher/:teacherId`, `GET /pdf-generator/assessments/:assessmentId`, `GET /pdf-generator/students`, `GET /pdf-generator/teachers`
- **Controller**: `guruhub-api/src/modules/pdf-generator/controller/pdfGeneratorController.ts`
- **Service**: `guruhub-api/src/modules/pdf-generator/service/pdfGeneratorService.ts`
- **Repository**: None (Service reads domain entities and invokes HTML template renderers with Puppeteer)
- **Database Table**: Read-only access to all underlying domain tables
- **Related Tables**: `report_cards`, `attendances`, `teaching_journals`, `assessments`, `students`, `teachers`
- **RBAC**: `SuperAdmin`, `SchoolAdmin`, `Principal`, `HomeroomTeacher`, `Teacher` (Role-specific document authorization rules apply)
- **Tenant**: Scoped via `school_id`. Generates binary PDF stream responses.

---

## 17. Import Module (`/import`)

- **Frontend Page**: `front-guruhub/src/app/(dashboard)/import/page.tsx`
- **React Components**: `FileDropzone`, `ImportPreviewTable`, `TemplateDownloadButton`, `ImportProgressStep`
- **TanStack Query**: None (Direct file upload service execution)
- **API Client**: `front-guruhub/src/services/import.ts`
- **API Route**: `POST /import/upload`, `POST /import/preview`, `POST /import/teachers`, `POST /import/students`, `POST /import/classes`, `POST /import/subjects`, `POST /import/class-members`, `POST /import/schedules`, `GET /import/templates/:type`
- **Controller**: `guruhub-api/src/modules/import/controller/importController.ts`
- **Service**: `guruhub-api/src/modules/import/service/importService.ts`
- **Repository**: `guruhub-api/src/modules/import/repository/importRepository.ts`
- **Database Table**: Bulk writes to `teachers`, `students`, `classes`, `subjects`, `class_members`, `schedules`, `audit_logs`
- **Related Tables**: `academic_years`, `schools`
- **RBAC**: All Actions: `SuperAdmin`, `SchoolAdmin`, `Principal`
- **Tenant**: Scoped via `school_id`. Validates data format and uniqueness before performing transaction-wrapped bulk inserts.

---

## 18. Discipline Module (`/discipline`)

- **Frontend Page**: `front-guruhub/src/app/(dashboard)/discipline-violations/page.tsx` & `front-guruhub-mobile/src/app/(main)/discipline/page.tsx`
- **React Components**: `DisciplineIncidentTable`, `IncidentFormModal`, `IncidentDetailDialog`, `CategoryManager`, `TypeManager`, `PolicyConfigForm`, `AnalyticsHeatmap`, `AnalyticsTrends`
- **TanStack Query**: `front-guruhub/src/queries/discipline.query.ts` (`useDisciplineIncidents`, `useDisciplineIncident`, `useCreateDisciplineIncident`, `useUpdateIncidentStatus`, `useDisciplineCategories`, `useDisciplineTypes`, `useDisciplinePolicies`, `useDisciplineAnalytics`)
- **API Client**: `front-guruhub/src/services/discipline.ts`
- **API Route**: `/discipline/categories`, `/discipline/types`, `/discipline/incidents`, `/discipline/policies`, `/discipline/sanctions/thresholds`, `/discipline/sanctions/logs`, `/discipline/analytics/*`
- **Controller**: `guruhub-api/src/modules/discipline/controller/disciplineController.ts`
- **Service**: `guruhub-api/src/modules/discipline/service/disciplineService.ts`
- **Repository**: `guruhub-api/src/modules/discipline/repository/disciplineRepository.ts`
- **Database Table**: `discipline_categories`, `discipline_types`, `discipline_incidents`, `discipline_incident_students`, `discipline_incident_witnesses`, `discipline_incident_attachments`, `discipline_policies`, `discipline_sanction_thresholds`, `discipline_sanction_logs`
- **Related Tables**: `students`, `classes`, `academic_years`, `users`, `teachers`, `schools`
- **RBAC**: 
  - Read categories/types/policies/thresholds: All authenticated roles
  - Read/Write incidents: `SuperAdmin`, `SchoolAdmin`, `Principal`, `Teacher`, `HomeroomTeacher` (Teachers scoped to own reported/handled incidents)
  - Write categories/types/policies/thresholds/sanctions: `SuperAdmin`, `SchoolAdmin`
  - Analytics: `SuperAdmin`, `SchoolAdmin`, `Principal`
- **Tenant**: Scoped via `school_id`. Validates student, class, academic year, reporter/handler user/teacher records belong to the same school. Enforces configurable discipline policy rules (e.g. max active points, carry forward, and reset strategy).

