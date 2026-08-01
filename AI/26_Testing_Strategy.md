# 26 — Testing Strategy

## Module Name: Student Character & Discipline Management
**Author:** Lead Software Architect  
**Status:** DRAFT (Sprint 0)  
**Date:** 2026-07-25  

---

## 1. Test Environment Setup & Runner

- **Test Runner:** Bun's built-in test runner (`bun test`).
- **Target Folder:** `guruhub-api/tests/` (following the existing repository convention).
- **Environment:** Dedicated test database matching local development schema configuration. Every integration test is self-contained: it registers its own school, academic year, teachers, and students before running assertions, and drops them inside a clean-up transaction block.

---

## 2. Unit Testing Strategy

Unit tests focus on pure utility functions and isolated business calculations in the service layer, without connecting to the database:
- **Point Calculations:** Verify that positive rewards reduce cumulative violation points while violations increase them.
- **Carry Forward Calculations:** Test carrying forward active points across cycles with custom carry forward percentages (e.g., 20% of active points carried over to next semester).
- **Cycle Reset Evaluator:** Verify logic that triggers point resets based on cycle settings (`SEMESTER`, `ACADEMIC_YEAR`, `NEVER`) against specific dates.

---

## 3. Integration Testing Strategy

Integration tests verify the HTTP route handler path, input parsing, database insertions, and transaction integrity:
- **Incident Creation Pipeline:**
  - Submit an incident with 2 students, verify that the database creates records in `discipline_incidents` and `discipline_incident_students` with status `PENDING` and zero points applied.
- **Incident Verification Pipeline:**
  - Submit status change to `VERIFIED`. Verify that student active points are updated, point snapshots are captured, and matching sanction logs are generated.
- **Attachment Upload Integration:**
  - Verify that mock image file urls are saved in `discipline_incident_attachments` and link correctly to the parent incident.

---

## 4. RBAC Boundary Testing

Verify that user role hierarchy checks block unauthorized requests. These tests must run for all API endpoints:

| Endpoint | Input Role | Expected Output | Assertion Rule |
|---|---|---|---|
| `PUT /discipline/policy` | `Teacher` | `403 Forbidden` | Policy settings changes rejected for teachers |
| `PUT /discipline/policy` | `SchoolAdmin` | `200 OK` | Settings changes allowed for admins |
| `POST /discipline/incidents` | `Teacher` | `201 Created` | Incident reporting allowed for teachers |
| `PUT /discipline/incidents/:id/status` | `Teacher` | `403 Forbidden` | Incident approval/rejection rejected for teachers |
| `PUT /discipline/incidents/:id/status` | `Principal` | `200 OK` | Incident approval allowed for principal / BK |
| `PUT /discipline/sanctions/:id` | `Teacher` | `403 Forbidden` | Sanction logs update rejected for teachers |

---

## 5. Tenant Isolation Boundary Testing

Tenant isolation is critical for a multi-tenant SaaS application. We write automated checks to verify these requirements:
- **Cross-School Read Guard:**
  - Log in a user under School A (`x-school-id: 719`). Run a GET request for a student ID belonging to School B (`school_id: 720`). Verify the request returns an HTTP `403 Forbidden` or `404 Not Found` response.
- **Cross-School Write Guard:**
  - Attempt to submit an incident under School A (`x-school-id: 719`) but pass a student ID belonging to School B (`school_id: 720`) in the request body. Verify that the service layer rejects the request before writing to the database.

---

## 6. Security & Vulnerability Testing

- **Attachment File Upload Security:**
  - Verify that mock attachment upload inputs reject file sizes exceeding 5MB.
  - Verify that the API rejects unauthorized file types (e.g., trying to upload `.exe` files).
- **SQL Injection Verification:**
  - Verify that search parameters and notes are handled safely through Drizzle ORM's parameterized queries, blocking SQL injection attempts.

---

## 7. User Acceptance Testing (UAT) Checklists

| Area | Step | Action | Expected Output |
|---|---|---|---|
| **Mobile PWA** | 1 | Open Mobile PWA, go to "Disiplin" tab, select "Aditya Pratama". | Aditya's name appears with current active points balance. |
| **Mobile PWA** | 2 | Pick violation type "Terlambat Masuk", add a description, and submit. | Success toast displayed, screen redirects to dashboard, and incident appears in pending history. |
| **Web Admin** | 3 | Log in as Counseling Teacher (Guru BK), open "BK Portal -> Antrean". | The incident reported in Step 2 appears in the pending queue. |
| **Web Admin** | 4 | Click "Detail", review description, and click "Setujui". | Incident disappears from queue, Aditya's points increase, and a new sanction log is created if points cross the threshold. |
