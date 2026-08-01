# 64 — Behavioral Analytics Functional Feature Specification

## Module: Student Character & Discipline Management
**Author:** Chief Product Architect  
**Status:** DRAFT (Sprint 2.8)  
**Date:** 2026-07-25  

---

## 1. Business Goal
Provide school leadership with data-driven behavioral intelligence, trend forecasts, time/location heatmaps, and homeroom comparative reports to support proactive school climate improvements.

---

## 2. User Personas & Permissions (RBAC Matrix)

| User Persona | View Executive BI | Export Analytics | View Teacher Stats | Location/Time Analysis |
| :--- | :---: | :---: | :---: | :---: |
| **Super Admin** | ✅ | ✅ | ✅ | ✅ |
| **School Admin** | ✅ | ✅ | ✅ | ✅ |
| **Principal** | ✅ | ✅ | ✅ | ✅ |
| **Guru BK** | ✅ | ✅ | ✅ | ✅ |
| **Homeroom Teacher** | 🔒 Assigned Class | 🔒 Assigned Class | ❌ | 🔒 Assigned Class |
| **Teacher** | ❌ | ❌ | ❌ | ❌ |

---

## 3. Navigation & Screen Layout
- **Path:** `/discipline/analytics`
- **Layout:** Executive KPI grid top, interactive Chart.js/Recharts panels (Violation Categories bar chart, Demerit Velocity line chart, Spatial Heatmap matrix, Time distribution graph).

---

## 4. Comprehensive Feature Specifications

- **Widget Breakdown:** Top Violation Category chart, Top Reward Category chart, Monthly Comparison Trend graph, Peak Violation Hour graph, Location Heatmap matrix, Homeroom Class Ranking table.
- **User Flow:** Principal opens `/discipline/analytics` -> Selects Date Range (e.g. "Semester Ganjil 2026/2027") -> Inspects peak violation times (12:30 Recess) -> Clicks "Export Executive Summary" -> Downloads PDF report.
- **CRUD Operations:** Read Analytics Data Marts (GET pre-aggregated metrics).
- **Validation Rules:** Date range filter start date must be before or equal to end date.
- **Search, Filters, Sorting, Pagination:** Academic Year filter, Grade level filter, Class filter, Date range preset selectors.
- **States:**
  - *Empty State:* "Data analitik belum tersedia untuk periode yang dipilih."
  - *Loading State:* Shimmer chart placeholders.
  - *Error State:* Analytics service offline warning card.
- **Notifications:** None.
- **Export & Import:** Export charts to PNG image or PDF executive briefing deck; export raw aggregated data to XLSX.
- **Attachments:** None.
- **Mobile Behaviour:** Responsive chart stacked view with horizontal scroll for complex heatmaps.
- **Accessibility:** Data table view alternative provided for screen readers (`role="img" aria-label="Grafik Tren Violasi"` with tabular summary fallback).
- **Audit Logging:** Logs `VIEW_ANALYTICS_DASHBOARD` and `EXPORT_ANALYTICS_REPORT`.
- **Performance:** Sub-50ms query responses fetched directly from pre-computed data marts (`discipline_monthly_analytics`).
- **Future Expansion:** AI student behavior risk prediction model integration.
