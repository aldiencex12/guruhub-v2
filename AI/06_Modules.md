# 06 — Modules Reference

> Source: All files under `guruhub-api/src/modules/`, frontend `src/app/(dashboard)/`, `src/queries/`, `src/services/`
> Cross-ref: [03_API](03_API.md) | [04_RBAC](04_RBAC.md) | [07_DependencyGraph](07_DependencyGraph.md)

---

## Module Inventory (16 Backend Modules)

Each module follows: `routes → controller → service → repository → database`

---

### M01 — auth

| | |
|---|---|
| **Base Path** | `/auth` |
| **Files** | `controller/authController.ts`, `service/authService.ts`, `repository/authRepository.ts`, `dto/authDto.ts` |
| **Tables** | `users`, `sessions`, `audit_logs`, `schools` |
| **No routes file** | Controller registered directly in `src/index.ts` |
| **No repository file** | Auth repository is inline in service layer |

**Operations:**
- `login(email, password)` — validates credentials, creates session, returns token pair
- `refresh(refreshToken)` — validates session, rotates tokens
- `logout(refreshToken)` — revokes session, writes audit log
- `/protected/me` — returns user context

**Key behavior:** Token rotation on every refresh. Session row for old token is set `is_revoked=true`, new session row created.

---

### M02 — teachers

| | |
|---|---|
| **Base Path** | `/teachers` |
| **Tables** | `teachers` |
| **Soft delete** | ✅ |

**Service methods:** `getAllTeachers`, `getTeacherById`, `createTeacher`, `updateTeacher`, `deleteTeacher`
**Repository methods:** `findAll`, `findById`, `findByNip`, `create`, `update`, `softDelete`

**Notes:** NIP is optional (nullable). `user_id` links to `users` table but is also optional. All teachers are readable by any authenticated user in the school.

---

### M03 — students

| | |
|---|---|
| **Base Path** | `/students` |
| **Tables** | `students` |
| **Soft delete** | ✅ — also nullifies `nisn` on delete |

**Service methods:** `getAllStudents`, `getStudentById`, `createStudent`, `updateStudent`, `deleteStudent`, `deleteBulkStudents`
**Repository methods:** `findAll`, `findById`, `findByNisn`, `create`, `update`, `softDelete`, `softDeleteBulk`

**Key behavior on delete:**
```typescript
// studentsRepository.ts
await db.update(students).set({ deletedAt: new Date(), nisn: null }).where(eq(students.id, id));
```

---

### M04 — classes

| | |
|---|---|
| **Base Path** | `/classes` |
| **Tables** | `classes` |
| **Soft delete** | ✅ |

**Service methods:** `getAllClasses`, `getClassById`, `createClass`, `updateClass`, `deleteClass`, `deleteBulkClasses`
**Repository methods:** `findAll`, `findById`, `findByName`, `create`, `update`, `softDelete`, `softDeleteBulk`

**Notes:** `homeroom_teacher_id` FK to `teachers`. One class belongs to one `academic_year_id`.

---

### M05 — class-members

| | |
|---|---|
| **Base Path** | `/class-members` |
| **Tables** | `class_members` |
| **Soft delete** | ✅ |

**Service methods:** `getAllClassMembers`, `getClassMemberById`, `createClassMember`, `updateClassMember`, `deleteClassMember`, `promoteStudents`
**Repository methods:** `findAll`, `findById`, `findActiveMembershipInYear`, `findDuplicateMembership`, `create`, `bulkCreate`, `update`, `softDelete`

**Key behavior — Promotion:**
```
promoteStudents({ sourceClassId, targetClassId, studentIds })
  → validates targetClass exists in same school
  → checks for duplicates in target
  → sets old ACTIVE memberships to INACTIVE
  → bulk-inserts new ACTIVE memberships in targetClass
```

**Business rule:** One student = ONE ACTIVE membership per academic year. Enforced in `findActiveMembershipInYear`.

---

### M06 — subjects

| | |
|---|---|
| **Base Path** | `/subjects` |
| **Tables** | `subjects`, `subject_teachers` |
| **Soft delete** | ✅ |

**Service methods:** `getAllSubjects`, `getSubjectById`, `createSubject`, `updateSubject`, `deleteSubject`, `deleteBulkSubjects`
**Repository methods:** `findAll`, `findById`, `findByCode`, `findByName`, `findByNameAndGrade`, `create`, `update`, `softDelete`, `softDeleteBulk`

**Notes:** `getAllSubjects` is role-aware — Teacher/HomeroomTeacher sees only subjects from their schedules.

---

### M07 — academic-years

| | |
|---|---|
| **Base Path** | `/academic-years` |
| **Tables** | `academic_years` |
| **Soft delete** | ❌ |

**Service methods:** `getAllAcademicYears`, `getAcademicYearById`, `createAcademicYear`, `updateAcademicYear`, `deleteAcademicYear`
**Repository methods:** `findAll`, `findById`, `findByYearAndSemester`, `create`, `update`, `deactivateAllOtherYears`

**Key behavior:** Setting `isActive=true` on an academic year automatically calls `deactivateAllOtherYears` to ensure only one is active at a time.

---

### M08 — schedules

| | |
|---|---|
| **Base Path** | `/schedules` |
| **Tables** | `schedules` |
| **Soft delete** | ✅ |

**Service methods:** `getAllSchedules`, `getScheduleById`, `createSchedule`, `updateSchedule`, `deleteSchedule`, `deleteAllSchedules`
**Repository methods:** `findAll`, `findById`, `findTeacherSchedulesByDay`, `findClassSchedulesByDay`, `create`, `update`, `softDelete`, `bulkSoftDelete`, `softDeleteAll`

**Critical note:** Schedule is the **operational anchor**. Attendance and journals both link to `schedule_id`. Deleting a schedule orphans those records behaviorally (though FK integrity is maintained via `ON DELETE CASCADE` on the schedule_id FK).

---

### M09 — attendance

| | |
|---|---|
| **Base Path** | `/attendance` |
| **Tables** | `attendances`, `attendance_details` |
| **Soft delete** | ✅ on `attendances`; cascade on `attendance_details` |

**Service methods:** `createAttendance`, `getAttendanceById`, `updateAttendance`, `deleteAttendance`, `getAllAttendances`, `getAttendanceRecap`
**Repository methods:** `findTeacherByUserId`, `findScheduleById`, `findClassStudents`, `findAttendanceByScheduleAndDate`, `createAttendance`, `findAttendanceById`, `findAttendanceDetails`, `updateAttendance`, `hardDeleteAttendance`, `findAllAttendances`, `getMonthlyRecapData`

**Notes:**
- Unique constraint prevents double-attendance for same schedule+date
- Delete is **hard-delete** (not soft-delete) — `hardDeleteAttendance()`
- Only Admin roles can delete

---

### M10 — teaching-journals

| | |
|---|---|
| **Base Path** | `/teaching-journals` |
| **Tables** | `teaching_journals` |
| **Soft delete** | ✅ |

**Service methods:** `getAllTeachingJournals`, `getTeachingJournalById`, `createTeachingJournal`, `updateTeachingJournal`, `deleteTeachingJournal`
**Repository methods:** `findAll`, `findById`, `findByScheduleAndDate`, `create`, `update`, `softDelete`

**Notes:**
- `findByScheduleAndDate` checks for duplicate journals before insert
- `attendance_id` is nullable — journal can exist independently of attendance
- The unique index on `(schedule_id, journal_date)` was removed in migration 0007

---

### M11 — assessment-categories

| | |
|---|---|
| **Base Path** | `/assessment-categories` |
| **Tables** | `assessment_categories` |
| **Soft delete** | ✅ |

**Service methods:** `getAllCategories`, `getCategoryById`, `createCategory`, `updateCategory`, `deleteCategory`
**Repository methods:** `findAll`, `findById`, `findByName`, `getTotalWeight`, `create`, `update`, `softDelete`

**Notes:** `getTotalWeight` validates that total category weights don't exceed 100%. Role-aware: teachers see own categories + school defaults.

---

### M12 — assessments

| | |
|---|---|
| **Base Path** | `/assessments` |
| **Tables** | `assessments`, `assessment_scores` |
| **Soft delete** | ✅ on `assessments`; none on `assessment_scores` |

**Service methods:** `getAllAssessments`, `getAssessmentById`, `createAssessment`, `updateAssessment`, `deleteAssessment`
**Repository methods:** `findAll`, `findById`, `findDetailWithScores`, `create`, `update`, `softDelete`, `upsertScores`

**Key operation — score input:**
```typescript
// POST /assessments/:id/scores
// Body: { scores: [{ studentId, score, notes }] }
// Performs UPSERT per student
repository.upsertScores(assessmentId, scoresList)
```

---

### M13 — grade-engine

| | |
|---|---|
| **Base Path** | `/grade-engine` |
| **Tables** | reads: `class_members`, `assessment_categories`, `assessments`, `assessment_scores`, `students`; writes: `student_final_grades` |
| **No repository file** | Service queries DB directly |

**Service methods:** `calculateStudentFinalGrade`, `calculateClassFinalGrades`, `getStudentFinalGrade`

**Algorithm (from `gradeEngineService.ts`):**
```
1. Validate student is ACTIVE in class_members for this academic_year
2. Get all ACTIVE assessment_categories for school
3. Get all active assessments for (class, subject, academic_year)
4. Get student's assessment_scores for those assessments
5. Group assessments by category_id
6. For each category: avg(scores) — missing score = 0
7. weightedSum += categoryAvg × (weight / 100)
8. finalScore = round(weightedSum, 2)
9. gradeLetter = calculateGradeLetter(finalScore)
10. UPSERT student_final_grades
```

**Grade letter thresholds** (from `src/utils/gradeCalculator.ts`):
- A: 90–100
- B: 75–89
- C: 60–74
- D: 0–59

---

### M14 — report-cards

| | |
|---|---|
| **Base Path** | `/report-cards` |
| **Tables** | reads: `student_final_grades`, `attendance_details`, `attendances`, `schedules`, `class_members`; writes: `report_cards`, `report_card_subjects`, `report_card_attendances`, `student_extracurriculars`, `student_achievements`, `p5_projects` |
| **No repository file** | Service queries DB directly |

**Service methods:** `generateReportCard`, `publishReportCard`, `getReportCardDetails`, `getStudentReportCard`, `getClassReportCards`, `getAllReportCards`, `updateHomeroomTeacherNotes`, `addAchievement`, `addExtracurricular`, `addP5Project`, `deleteReportCard`

**Generation flow:** Validate → count attendance → pull final grades → create DRAFT → insert subjects → insert attendance summary.

**Published lock:** `checkPublishedLock()` — only SuperAdmin can mutate PUBLISHED report cards.

⚠️ **Known bug:** `getClassReportCards` is defined twice in the service (lines 296 and 377). The second definition shadows the first.

---

### M15 — dashboard

| | |
|---|---|
| **Base Path** | `/dashboard` |
| **Tables** | reads virtually all tables; writes nothing |
| **No repository file** | Service queries DB directly |

**9 service methods:** `getSchoolSummary`, `getAttendanceSummary`, `getTeachingJournalSummary`, `getAssessmentSummary`, `getGradeSummary`, `getReportCardSummary`, `getAcademicYears`, `getPendingTasks`, `getStudentHighlights`

**All methods are role-aware:** Teacher/HomeroomTeacher scope to own schedules/classes. Admin scope to entire school.

---

### M16 — pdf-generator

| | |
|---|---|
| **Base Path** | `/pdf-generator` |
| **Tables** | reads all report-card and attendance tables |
| **No repository file** | Service queries DB directly; uses Puppeteer for rendering |

**6 PDF types:** report card, attendance by class, teaching journals by teacher, assessment scores, student list, teacher list.

---

### M17 — import

| | |
|---|---|
| **Base Path** | `/import` |
| **Tables** | writes: `teachers`, `students`, `classes`, `subjects`, `class_members`, `schedules` |

**Service methods:** `previewExcel`, `importTeachers`, `importStudents`, `importClasses`, `importSubjects`, `importClassMembers`, `importSchedules`

Uses `xlsx` (SheetJS) for parsing. Validates per-row and returns structured error list. Writes audit log for each import operation.

---

## Frontend Module ↔ API Mapping

| Web Page | Queries Used | API Modules Hit |
|---|---|---|
| `/dashboard` | `useDashboardSummary`, `useDashboardAttendance`, `useDashboardPendingTasks`, `useSchedules`, `useClasses`, `useSubjects`, `useTeachers` | dashboard, schedules, classes, subjects, teachers |
| `/teachers` | `useTeachers`, `useCreateTeacher`, `useUpdateTeacher`, `useDeleteTeacher` | teachers |
| `/students` | `useStudents`, `useCreateStudent`, `useUpdateStudent`, `useDeleteStudent`, `useDeleteBulkStudents` | students |
| `/classes` | `useClasses`, `useAcademicYears`, `useTeachers` | classes, academic-years, teachers |
| `/class-members` | `useClassMembers`, `useClasses`, `useStudents`, `useTeachers`, `useAcademicYears` | class-members, classes, students, teachers, academic-years |
| `/subjects` | `useSubjects` | subjects |
| `/schedules` | `useSchedules`, `useClasses`, `useSubjects`, `useTeachers`, `useAcademicYears` | schedules, classes, subjects, teachers, academic-years |
| `/academic-years` | `useAcademicYears` | academic-years |
| `/attendance` | `useAttendances`, `useClasses`, `useSchedules`, `useClassMembers`, `useSubjects`, `useTeachers` | attendance, classes, schedules, class-members, subjects, teachers |
| `/teaching-journals` | `useJournals`, `useSchedules`, `useClasses`, `useSubjects` | teaching-journals, schedules, classes, subjects |
| `/assessments` | `useAssessments`, `useCategories`, `useClasses`, `useClassMembers`, `useSubjects`, `useTeachers`, `useAcademicYears` | assessments, assessment-categories, classes, class-members, subjects, teachers |
| `/assessment-categories` | `useCategories` | assessment-categories |
| `/grade-engine` | `useCalculateClass`, `useClasses`, `useSchedules`, `useSubjects`, `useAcademicYears` | grade-engine, classes, schedules, subjects, academic-years |
| `/report-cards` | `useReportCards`, `useClasses`, `useClassMembers`, `useAcademicYears` | report-cards, classes, class-members, academic-years |
| `/promotions` | `useClasses`, `useClassMembers`, `usePromoteStudents`, `useAcademicYears` | class-members, classes, academic-years |
| `/import` | `importService` (direct) | import |
| `/users` | `useUsers`, `useTeachers` | users, teachers |
| `/discipline-violations` | `useDisciplineIncidents`, `useDisciplineCategories`, `useDisciplineTypes`, `useDisciplinePolicies`, `useDisciplineAnalytics` | discipline |

---

### M18 — discipline

| | |
|---|---|
| **Base Path** | `/discipline` |
| **Files** | `controller/disciplineController.ts`, `service/disciplineService.ts`, `repository/disciplineRepository.ts`, `dto/disciplineDto.ts` |
| **Tables** | `discipline_categories`, `discipline_types`, `discipline_incidents`, `discipline_incident_students`, `discipline_incident_witnesses`, `discipline_incident_attachments`, `discipline_policies`, `discipline_sanction_thresholds`, `discipline_sanction_logs` |
| **Soft delete** | ✅ (on categories, types, incidents, thresholds, sanction logs) |

**Workflow & States:**
- **Draft**: Reporter is drafting the incident report. Not visible to Counseling (BK) teachers. Student points are NOT modified.
- **Pending**: Incident submitted, waiting for assignment or initial review by BK.
- **Under Review**: BK teacher is actively reviewing, investigating, or editing incident details/witness statements.
- **Verified**: BK/Admin verifies the incident occurred. Student points tally is officially updated in real-time, and automatic threshold/sanction checks are executed.
- **Rejected**: BK/Admin determines the incident is invalid. Closed with no demerits/points.
- **Cancelled**: Retracted due to duplication or logging error.
- **Resolved**: Sanction/coaching has been successfully executed, and the file is permanently closed.

**Analytics Capabilities:**
- Heatmap queries (group counts by location and hour/day-of-week).
- Top locations, times, and reporters rankings.
- Weekly/monthly count trend queries.

**Role Permissions:**
- **Teachers & Homeroom Teachers**: Create/draft incident, update own drafts, view own reported incidents.
- **Counseling Teacher (BK) & Admin**: Full CRUD on categories, types, policies, thresholds. Verify, reject, cancel, resolve, or edit all incidents. Execute sanctions.
- **Principal**: Read-only overview of all incidents and access to analytics dashboards.

