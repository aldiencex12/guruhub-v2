# 44 — Web Admin User Journeys & Workflow Specifications

## Module: Student Character & Discipline Management (Web Admin)
**Author:** Lead Product Designer & Senior Frontend Architect  
**Status:** DRAFT (Sprint 2)  
**Date:** 2026-07-25  

---

## 1. Journey 1: Incident Reporting by Teacher (Low-Friction Workflow)

```
[Teacher Dashboard] ──(Click "+ Laporkan Insiden")──> [Quick Incident Drawer]
                                                               │
                                                               ▼
[Submit Report] <──(Attach Photo / Location)─── [Select Students & Violation Type]
       │
       ▼
[Notification Dispatched to Guru BK Queue] & [Timeline Event Created: INCIDENT_REPORTED]
```

### UX Design Goals:
- Maximum 3 clicks to submit a standard violation report.
- Smart auto-complete for student NISN/name search.
- Pre-filled default date/time (current timestamp) and current teacher location.

---

## 2. Journey 2: Incident Verification & Auto-Sanction Execution by Guru BK

```
[Guru BK Dashboard] ──(Select "Pending Review (4)")──> [Incident Detail Viewer]
                                                               │
                                                               ▼
[Sanction Log Issued: PENDING] <──(Auto-Threshold Hit)─── [Click "VERIFY INCIDENT"]
       │                                                       │
       ▼                                                       ▼
[WhatsApp & Push Notification to Parent]              [Student Points Updated]
```

### UX Design Goals:
- Side-by-side inspection of reported evidence and student violation history.
- One-click approval (`Cmd + Enter` shortcut) with optional verification note.
- Automated alert modal showing newly triggered sanctions (e.g. *"Checking Budi Santoso: Active points crossed 25 -> SP-1 Auto-Triggered"*).

---

## 3. Journey 3: Student Character Consultation by Homeroom Teacher & BK

```
[Student List] ──(Search "Budi Santoso")──> [Student 360 Character Profile]
                                                        │
                                                        ▼
[Print SP-1 Letter] <──(View Sanctions Tab)─── [Inspect Active Points & Timeline]
       │
       ▼
[Add Counseling Note] ──(Save Log)──> [Timeline Appended: COUNSELING_COMPLETED]
```

### UX Design Goals:
- Instant visual feedback on student behavior trajectory (Green = Improving, Red = Escalating).
- Quick access to download PDF formal sanction letters.
