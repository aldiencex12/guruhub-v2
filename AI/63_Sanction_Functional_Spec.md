# 63 — Sanction & Threshold Engine Functional Feature Specification

## Module: Student Character & Discipline Management
**Author:** Chief Product Architect  
**Status:** DRAFT (Sprint 2.8)  
**Date:** 2026-07-25  

---

## 1. Business Goal
Automate the evaluation of cumulative student demerit points against configurable threshold levels (e.g. 25 pts = SP-1, 50 pts = SP-2, 75 pts = SP-3, 100 pts = Expulsion), auto-generating formal sanction logs and parent notification workflows.

---

## 2. User Personas & Permissions (RBAC Matrix)

| User Persona | View Thresholds | Configure Thresholds | Fulfill/Complete Sanction | Revoke Sanction |
| :--- | :---: | :---: | :---: | :---: |
| **Super Admin** | ✅ | ✅ | ✅ | ✅ |
| **School Admin** | ✅ | ✅ | ✅ | ✅ |
| **Principal** | ✅ | ❌ | ✅ Approve SP-3/Expulsion| ❌ |
| **Guru BK** | ✅ | ❌ | ✅ Process Sanction | ❌ |
| **Homeroom Teacher** | ✅ Read-only | ❌ | ❌ | ❌ |
| **Teacher** | ✅ Read-only | ❌ | ❌ | ❌ |

---

## 3. Navigation & Screen Layout
- **Path:** `/discipline/sanctions`
- **Layout:** Tabbed view (Active Sanction Logs, Pending Fulfillments, Threshold Rules Configuration).

---

## 4. Comprehensive Feature Specifications

- **Widget Breakdown:** Sanction threshold milestone bar, active sanction status cards (`PENDING`, `ACTIVE`, `COMPLETED`, `REVOKED`), official SP PDF letter download button, parent notification delivery badge.
- **User Flow:** Incident verified -> Active student points cross 25 -> Auto-Sanction Engine triggers `SanctionGeneratedEvent` -> Sanction log created (`PENDING`) -> Notification dispatched to parent -> BK prints SP letter -> Student completes sanction -> BK marks `COMPLETED`.
- **CRUD Operations:** Read Sanction Logs (GET), Update Sanction Status (PUT), Download PDF Letter (GET).
- **Validation Rules:**
  - `minPoints`: Unique point boundary per threshold rule within school.
  - Completion notes: Required when marking sanction as `COMPLETED` or `REVOKED`.
- **Search, Filters, Sorting, Pagination:** Filter by status, search by student name/NISN, sort by `issuedDate DESC`.
- **States:**
  - *Empty State:* "Tidak ada sanksi aktif yang memerlukan tindakan saat ini."
  - *Loading State:* Shimmer cards.
  - *Error State:* PDF letter generation failure banner.
- **Notifications:** Multi-channel alert (WhatsApp, Push, Email) sent upon sanction issuance.
- **Export & Import:** Download official signed SP PDF letter (Surat Peringatan 1/2/3).
- **Attachments:** Upload signed physical SP letter scan.
- **Mobile Behaviour:** Mobile PDF viewer and quick status completion toggle.
- **Accessibility:** Full screen reader announcements for sanction threshold alerts.
- **Audit Logging:** Logs `SANCTION_GENERATED`, `SANCTION_COMPLETED`, and `SANCTION_REVOKED` in `discipline_audit_logs`.
- **Performance:** Transactional isolation (`DbTx`) ensuring atomic point calculations and sanction generation.
- **Future Expansion:** Suspension calendar scheduling integration.
