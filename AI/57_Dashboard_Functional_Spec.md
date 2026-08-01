# 57 — Dashboard Functional Feature Specification

## Module: Student Character & Discipline Management
**Author:** Chief Product Architect  
**Status:** DRAFT (Sprint 2.8)  
**Date:** 2026-07-25  

---

## 1. Business Goal
Provide school administrators, counseling staff (Guru BK), principals, and teachers with a unified, real-time command center summarizing daily behavior metrics, pending incident verification queues, and high-risk student alerts to enable immediate intervention.

---

## 2. User Personas & Permissions (RBAC Matrix)

| User Persona | View Dashboard | View Pending Queue | Verify Incidents | View Class Filter |
| :--- | :---: | :---: | :---: | :---: |
| **Super Admin** | ✅ School-wide | ✅ Full | ✅ Full | ✅ All Classes |
| **School Admin** | ✅ School-wide | ✅ Full | ✅ Full | ✅ All Classes |
| **Principal** | ✅ School-wide | ✅ Read-only | ❌ | ✅ All Classes |
| **Guru BK** | ✅ School-wide | ✅ Full | ✅ Full | ✅ All Classes |
| **Homeroom Teacher** | 🔒 Class-only | 🔒 Class-only | ❌ | 🔒 Assigned Class |
| **Teacher** | 🔒 Self-only | 🔒 Self-only | ❌ | ❌ |

---

## 3. Navigation & Screen Layout
- **Path:** `/discipline/dashboard`
- **Layout:** 3-column responsive grid (KPI Cards top, Feed + Pending Queue left/center, Heatmaps + Risk Alerts right).

---

## 4. Comprehensive Feature Specifications

- **Widget Breakdown:** 
  1. *KPI Cards:* Today's Incidents, Pending Reviews, High Risk Students, Total Rewards.
  2. *Verification Queue Table:* Top 5 pending reports with quick "Verify" / "Reject" actions.
  3. *Behavior Trend Sparkline:* 7-day demerit velocity chart.
  4. *Risk Alerts Feed:* Live feed of students reaching SP thresholds.
- **User Flow:** User lands on dashboard -> Inspects Pending Queue -> Clicks "Verify" -> Modal opens -> Enters verification notes -> Submits -> Queue updates optimistically.
- **CRUD Operations:** Read-only dashboard with inline Update (`VERIFY` / `REJECT` incident status).
- **Validation Rules:** Verification notes required when rejecting an incident report (min 10 chars).
- **Search & Filters:** Quick class picker dropdown, date range filter (Today, 7 Days, 30 Days).
- **Sorting & Pagination:** Pending queue sorted by `createdAt DESC`, page size fixed at 5 items with "View All" link.
- **States:**
  - *Empty State:* "Tidak ada antrian insiden yang memerlukan verifikasi hari ini."
  - *Loading State:* Shimmer skeleton cards for KPIs and table rows.
  - *Error State:* Error card with retry button if backend query fails.
  - *Confirmation Dialogs:* Verification confirmation dialog before issuing point deductions.
- **Notifications:** Toast notification upon incident verification success (`"Insiden terverifikasi (+15 Poin)"`).
- **Export & Import:** Export daily summary PDF report for principal briefing.
- **Attachments:** Hover preview thumbnail for evidence photo attachments.
- **Mobile Behaviour:** Stacked single column layout; swipe-to-approve on pending items.
- **Accessibility:** High contrast status text (`WCAG AA`), keyboard navigation (`Tab` focus traps).
- **Audit Logging:** Logs `DASHBOARD_VIEW` and `QUICK_VERIFY_INCIDENT` in `discipline_audit_logs`.
- **Performance:** Dynamic prefetching for top 3 pending incident detail drawers on hover.
- **Future Expansion:** Real-time WebSocket feed for instant incident push notifications.
