# 21 — Product Requirement Document (PRD)

## Module Name: Student Character & Discipline Management
**Author:** Lead Software Architect  
**Status:** DRAFT (Sprint 0)  
**Date:** 2026-07-25  

---

## 1. Executive Summary

GuruHub aims to digitize and optimize secondary school administration for Indonesian SMP/SMA schools under the *Kurikulum Merdeka* framework. The **Student Character & Discipline Management** module is a core component of this platform. It transitions schools from legacy, punitive, paper-based demerit tracking systems to a holistic, event-based system that monitors both **Violations** (Pelanggaran) and **Rewards** (Penghargaan/Prestasi). 

By offering real-time reporting via a Mobile PWA for teachers and deep analytics/configuration tools on the Web Admin Dashboard, GuruHub helps counseling teachers (Guru BK), homeroom teachers (Wali Kelas), and school administrators foster positive student character development, automate progressive discipline policy execution, and prepare structured counseling sessions.

---

## 2. Business Goals

- **Increase Reporting Efficiency**: Enable teachers to report a discipline incident in under 60 seconds via mobile while on active duty.
- **Enforce Policy Consistency**: Automate sanction tiering to ensure consistent policy application, removing human bias and errors.
- **Promote Positive Reinforcement**: Introduce a point-based reward system to balance negative demerits and recognize positive student actions.
- **Improve Decision Support**: Provide counseling teachers (Guru BK) with instant, comprehensive student behaviour timelines to optimize intervention strategies.
- **Future Integration Ready**: Lay down data frameworks for AI-driven behavior pattern analysis and secure parental notifications.

---

## 3. Current Problems & Pain Points

1. **Manual Tracking Lag**: Incident logging is delayed because teachers must write paper slips, leading to missing data and outdated point totals.
2. **Punishment-Only Bias**: Existing processes only track negative behavior (demerits), ignoring positive character building.
3. **Information Silos**: Subject teachers, homeroom teachers, and counseling teachers do not share real-time behavior history, leading to uncoordinated interventions.
4. **Policy Enforcement Gaps**: Point thresholds for calling parents or issuing suspension letters are tracked manually, which leads to delayed or missed actions.
5. **No Point Snapshot**: Changing a violation's default point value retroactively alters historical records, violating basic auditing principles.

---

## 4. User Stories

### 4.1 School Admin (Administrator Sekolah)
- **US-ADMIN-01**: As a School Admin, I want to configure the school's point reset cycle (e.g., per semester or per academic year) and point ceilings so that we can customize the system to our school regulations.
- **US-ADMIN-02**: As a School Admin, I want to define discipline categories and types (both violations and rewards) with default point values so that teachers have a standardized master reference list.
- **US-ADMIN-03**: As a School Admin, I want to configure automatic sanction thresholds (e.g., reaching 50 points triggers a parent call request) to ensure policies are applied automatically.

### 4.2 Teacher / Homeroom Teacher (Wali Kelas)
- **US-TEACHER-01**: As a Teacher, I want to report a discipline incident involving one or more students, violations, or rewards via the Mobile PWA, including the date, time, location, and description, so that I can log occurrences immediately.
- **US-TEACHER-02**: As a Teacher, I want to attach photos or files as evidence to an incident report to provide visual proof of the event.
- **US-TEACHER-03**: As a Homeroom Teacher, I want to view my class's discipline timeline and cumulative points so that I can monitor student character trends and identify at-risk students early.

### 4.3 Counseling Teacher (Guru BK)
- **US-BK-01**: As a Counseling Teacher, I want to receive notifications or view a list of pending incident reports so that I can verify or reject them before points are officially applied.
- **US-BK-02**: As a Counseling Teacher, I want to view a student's complete historical discipline and reward timeline, including a snapshot of points at the time of each incident, to prepare for a counseling session.
- **US-BK-03**: As a Counseling Teacher, I want to view auto-triggered sanction recommendations and log the execution status of sanctions (e.g., SP1 issued, counseling completed).

---

## 5. Functional Requirements

### 5.1 Configuration & Master Data (Web Admin Only)
- **FR-CONFIG-01**: Configure global policy settings including `point_reset_cycle` (`SEMESTER`, `ACADEMIC_YEAR`, `NEVER`), `max_active_points` (default 100), and `auto_sanction_enabled` (boolean).
- **FR-CONFIG-02**: Manage discipline categories with custom codes and a hard type distinction (`VIOLATION` or `REWARD`).
- **FR-CONFIG-03**: Manage discipline types within categories, setting code, name, and default point values.
- **FR-CONFIG-04**: Define sanction thresholds: minimum cumulative points, sanction name, and required action type (`PEMBINAAN_BK`, `PANGGILAN_ORANG_TUA`, `SURAT_PERINGATAN`, `SKORSING`, `DIKELUARKAN`).

### 5.2 Incident Reporting & Workflow (Web & Mobile PWA)
- **FR-INCIDENT-01**: Create incident reports. Support multi-student assignment, multi-violation/reward types, date/time, location, description, and optional witnesses.
- **FR-INCIDENT-02**: Support file attachments (images, PDFs, videos) up to 5MB.
- **FR-INCIDENT-03**: State workflow management: Incidents transition through `DRAFT` -> `PENDING` -> `UNDER_REVIEW` -> `VERIFIED` / `REJECTED` -> `RESOLVED`.
- **FR-INCIDENT-04**: Points must only be added or subtracted from a student's cumulative balance once the incident status transitions to `VERIFIED`.

### 5.3 Point Snapshots & Sanctions Log
- **FR-LOG-01**: Capture and store `point_snapshot` on `discipline_incident_students` at the moment of verification. Subsequent changes to master point values must not affect historical incident points.
- **FR-LOG-02**: Auto-evaluate sanction thresholds when an incident is verified. If the student's cumulative points cross a threshold, automatically create a pending log in `discipline_sanction_logs`.
- **FR-LOG-03**: Support manual and automated sanction logging, state transitions (`PENDING` -> `ACTIVE` -> `COMPLETED` / `REVOKED`), and document URL uploads (e.g., PDF scan of a warning letter).

---

## 6. Non-Functional Requirements

- **Tenant Isolation**: Strictly isolate all queries, settings, and logs by `school_id`. No user can access or modify data belonging to another school.
- **Soft Deletion**: All master records (categories, types, thresholds, policies, incidents) must implement soft delete using `deleted_at`. Hard deletes are forbidden.
- **Performance & Latency**: Mobile incident creation must take less than 1.5 seconds under standard 3G/4G connectivity. Queries for student timelines must return in under 200ms.
- **Audit Trails**: Maintain creation/update timestamps on all tables. Log status transitions for incidents and sanctions.
- **Mobile Friendly (PWA)**: The incident reporting form must be optimized for single-handed usage on screens down to 320px width.

---

## 7. User-Facing Terminology & States (Bahasa Indonesia)

To align with national guidelines and school operations, the following terms and states are defined:

### 7.1 Category Types
- `VIOLATION` -> **Pelanggaran**
- `REWARD` -> **Penghargaan**

### 7.2 Incident Statuses
- `DRAFT` -> **Draf** (Only visible to the reporter)
- `PENDING` -> **Menunggu Verifikasi** (Awaiting Guru BK review)
- `UNDER_REVIEW` -> **Dalam Peninjauan** (Guru BK is investigating)
- `VERIFIED` -> **Terverifikasi** (Points applied)
- `REJECTED` -> **Ditolak** (No points applied, reason documented)
- `CANCELLED` -> **Dibatalkan** (Cancelled by reporter before review)
- `RESOLVED` -> **Selesai** (Action/counseling finished)

### 7.3 Action Types
- `PEMBINAAN_BK` -> **Pembinaan BK**
- `PANGGILAN_ORANG_TUA` -> **Panggilan Orang Tua**
- `SURAT_PERINGATAN` -> **Surat Peringatan (SP)**
- `SKORSING` -> **Skorsing**
- `DIKELUARKAN` -> **Dikeluarkan**

### 7.4 Sanction Statuses
- `PENDING` -> **Menunggu Tindakan**
- `ACTIVE` -> **Sedang Berjalan**
- `COMPLETED` -> **Selesai**
- `REVOKED` -> **Dicabut**

---

## 8. Acceptance Criteria

- **AC-01**: A teacher can create an incident with 2 students and 2 violation types on a mobile browser, and the database correctly records individual `point_snapshot` values for each student-violation pair.
- **AC-02**: If a teacher modifies a violation's point value in settings from 5 to 10 points, all existing verified incidents must still display the point value as 5 in the student's timeline.
- **AC-03**: When a student's cumulative violation points reach 50, a record in `discipline_sanction_logs` must be automatically generated with status `PENDING` and action `SURAT_PERINGATAN` if configured in thresholds.
- **AC-04**: An API call with a modified `x-school-id` header must return a 403 error and not reveal any discipline logs or categories belonging to other tenants.

---

## 9. Key Success Metrics

- **Adoption Rate**: >90% of school teachers log at least one incident or reward through the platform within the first month.
- **Time to Action**: Reduce the average time between a minor/moderate violation occurring and the homeroom teacher being notified from 3 days to under 10 minutes.
- **Data Integrity**: Zero reports of cross-tenant data leaks or unauthorized point modifications.
