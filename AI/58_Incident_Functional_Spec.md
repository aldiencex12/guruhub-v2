# 58 — Incident Management Functional Feature Specification

## Module: Student Character & Discipline Management
**Author:** Chief Product Architect  
**Status:** DRAFT (Sprint 2.8)  
**Date:** 2026-07-25  

---

## 1. Business Goal
Provide a streamlined workflow for reporting, investigating, verifying, and tracking student discipline incidents with full evidence attachment and chronological event history.

---

## 2. User Personas & Permissions (RBAC Matrix)

| User Persona | Create Incident | View All Incidents | Change Status (`VERIFY`/`REJECT`) | Delete Incident |
| :--- | :---: | :---: | :---: | :---: |
| **Super Admin** | ✅ | ✅ All | ✅ | ✅ Soft Delete |
| **School Admin** | ✅ | ✅ All | ✅ | ✅ Soft Delete |
| **Principal** | ✅ | ✅ All | ✅ Read-only | ❌ |
| **Guru BK** | ✅ | ✅ All | ✅ Full Approval | ❌ |
| **Homeroom Teacher** | ✅ | 🔒 Assigned Class | ❌ | ❌ |
| **Teacher** | ✅ | 🔒 Reported by Self | ❌ | ❌ |

---

## 3. Navigation & Screen Layout
- **Path:** `/discipline/incidents` (List), `/discipline/incidents/[id]` (Detail & Timeline)
- **Layout:** Filter bar top, Data Table center, Slide-over detail drawer right, Full Detail page.

---

## 4. Comprehensive Feature Specifications

- **Widget Breakdown:** Filter toolbar, virtualized data table, incident status chips, tagged student multi-badge list, attachment gallery, timeline stream.
- **User Flow:** Teacher clicks "+ Laporkan Insiden" -> Selects student & violation type -> Attaches photo -> Submits -> Status set to `PENDING` -> BK receives alert -> BK clicks "VERIFY" -> System snapshots default points -> Updates student active points.
- **CRUD Operations:** Create (POST), Read (GET paginated list & detail), Update status (PUT), Soft Delete.
- **Validation Rules:**
  - `incidentDate`: Cannot be in the future.
  - `studentIds`: Must contain at least 1 valid student ID.
  - `disciplineTypeId`: Required valid type reference.
  - Evidence photo: JPG/PNG/PDF under 10 MB.
- **Search, Filters, Sorting, Pagination:** Debounced text search (student name, NISN, reporter), filters (status, category, date range), column sorting (`incidentDate DESC`), numeric pagination (10, 25, 50 per page).
- **States:**
  - *Empty State:* "Belum ada laporan insiden disiplin tercatat."
  - *Loading State:* Shimmer table rows and detail drawers.
  - *Error State:* Error banner with retry trigger.
  - *Confirmation Dialogs:* Dialog prompt on status change or deletion.
- **Notifications:** In-app toast and parent WhatsApp notification trigger upon verification.
- **Export & Import:** Export filtered incident list to XLSX and PDF; bulk import via CSV template.
- **Attachments:** Lightbox preview with zoom and presigned S3 URL downloading.
- **Mobile Behaviour:** Bottom action sheet for filters and quick report submission form.
- **Accessibility:** Full keyboard shortcut support (`Cmd + Enter` to verify, `Esc` to close).
- **Audit Logging:** Every status mutation generates an append-only entry in `discipline_audit_logs`.
- **Performance:** Optimistic UI state updates on status change; prefetching detail queries on row hover.
- **Future Expansion:** AI video evidence timestamp tagger and duplicate report detection.
