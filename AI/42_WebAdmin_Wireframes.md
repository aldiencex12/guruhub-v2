# 42 — Web Admin Wireframe & Layout Specifications

## Module: Student Character & Discipline Management (Web Admin)
**Author:** Lead Product Designer & Senior Frontend Architect  
**Status:** DRAFT (Sprint 2)  
**Date:** 2026-07-25  

---

## 1. Dashboard Layout Wireframe

```
+-----------------------------------------------------------------------------------+
| GuruHub Sidebar | TopBar: School Selector | Notification Bell | User Profile Avatar|
+-----------------+-----------------------------------------------------------------+
| [Dashboard]     | BREADCRUMB: Dashboard > Discipline                              |
| [Incidents]     |                                                                 |
| [Students]      | +------------------+ +------------------+ +------------------+  |
| [Categories]    | | Incidents Today | | Pending Review   | | Students at Risk |  |
| [Sanctions]     | |  12 (+2 vs yesterday)| 4 (Action Req) | | 3 (SP Threshold) |  |
| [Analytics]     | +------------------+ +------------------+ +------------------+  |
| [Audit Logs]    |                                                                 |
|                 | +----------------------------------+ +-------------------------+ |
|                 | | LIVE INCIDENT FEED               | | TOP VIOLATIONS HEATMAP  | |
|                 | | [09:10] Terlambat - Budi (10-A)  | | 1. Terlambat (45%)    | |
|                 | | [08:45] Atribut  - Ani  (11-B)  | | 2. Merokok   (20%)    | |
|                 | +----------------------------------+ +-------------------------+ |
|                 |                                                                 |
|                 | +--------------------------------------------------------------+ |
|                 | | PENDING VERIFICATION QUEUE (Quick Action Bar)                | |
|                 | | Student | Type | Date | Reporter | [Verify] [Reject] [View]  | |
|                 | +--------------------------------------------------------------+ |
+-----------------+-----------------------------------------------------------------+
```

---

## 2. Incident Detail & Timeline Wireframe

```
+-----------------------------------------------------------------------------------+
| INCIDENT DETAILS #INC-2026-0042                              [Print] [Export PDF] |
+------------------------------------+----------------------------------------------+
| INCIDENT INFORMATION               | CASE TIMELINE ENGINE                         |
| Reporter: Pak Budi (Guru Piket)    | [09:10] Incident Reported                    |
| Date: 2026-07-25 07:15 WIB         |         By: Pak Budi (Guru Piket)            |
| Location: Gerbang Depan            |                                              |
| Status: [ VERIFIED ]               | [09:15] Status Changed to UNDER_REVIEW       |
|                                    |         By: Ibu Susi (Guru BK)               |
| TAGGED STUDENTS:                   |                                              |
| 1. Budi Santoso (10-A) - 5 Poin    | [09:20] Incident VERIFIED                    |
| 2. Ahmad Dani   (10-A) - 5 Poin    |         By: Ibu Susi (Guru BK)               |
|                                    |         Note: Terbukti membolos              |
| ATTACHMENTS & EVIDENCE:            |                                              |
| [Photo_Gerbang.jpg] (Preview)      | [09:21] SP-1 Sanction Auto-Triggered         |
|                                    |         Target: Budi Santoso (Point: 25)     |
| VERIFICATION ACTIONS:              |                                              |
| [Verify Incident] [Reject] [Edit]  | [09:22] Parent Notified via WhatsApp         |
+------------------------------------+----------------------------------------------+
```

---

## 3. Student 360 Character Profile Wireframe

```
+-----------------------------------------------------------------------------------+
| STUDENT PROFILE: Budi Santoso | NISN: 00549281 | Class: 10-IPA-1                   |
+------------------------------------+----------------------------------------------+
| CHARACTER OVERVIEW                 | TABBED DETAIL VIEWER                         |
| +--------------------------------+ | [ Violations ] [ Rewards ] [ Sanctions ] [BK]|
| | ACTIVE DEMERIT POINTS: 35 / 100| |                                              |
| | Status: WARNING (SP-1 Active)  | | 2026-07-25  Terlambat Masuk   +5 Poin  [Doc]|
| | Character Grade: B (Baik)      | | 2026-06-10  Tidak Bawa Topi   +5 Poin  [Doc]|
| +--------------------------------+ | 2026-05-02  Juara Futsal     -10 Poin  [Doc]|
|                                    |                                              |
| BEHAVIOR TREND (6 Months)          | COUNSELING LOGS (Guru BK Only)               |
| [Line Chart: Demerit Velocity]     | 2026-07-26: Siswa dipanggil, berjanji tidak  |
|                                    | membolos lagi. Surat SP-1 diserahkan.        |
+------------------------------------+----------------------------------------------+
```

---

## 4. Responsive Breakpoints Strategy

- **Desktop (`>= 1280px`):** Multi-column grid layout with expanded sidebar and persistent detail panels.
- **Tablet (`768px - 1279px`):** Collapsible icon sidebar, 2-column card stack, scrollable data tables.
- **Mobile (`< 768px`):** Single-column stacked layout, bottom slide-up sheets for actions/filters, sticky quick-action bar.
