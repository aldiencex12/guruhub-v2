# 43 — Web Admin Component Library Inventory

## Module: Student Character & Discipline Management (Web Admin)
**Author:** Lead Product Designer & Senior Frontend Architect  
**Status:** DRAFT (Sprint 2)  
**Date:** 2026-07-25  

---

## 1. Overview & Design Principles

The Web Admin UI is constructed from an atomic library of reusable, accessible, and themeable UI components. Every component follows strict props interfaces, keyboard navigation standards, and ARIA state specifications.

---

## 2. Core Reusable Component Directory

| Component Name | Description | Key Props / State | Target Pages |
| :--- | :--- | :--- | :--- |
| **`StudentCard`** | Compact summary card displaying student photo, NISN, class, and active points badge. | `studentId`, `name`, `nisn`, `className`, `points`, `scoreGrade` | Dashboard, Incidents, BK Modal |
| **`IncidentCard`** | Feed item representing a discipline incident with reporter and status indicator. | `incidentId`, `date`, `reporterName`, `type`, `status`, `points` | Dashboard Feed, Incidents List |
| **`Timeline`** | Chronological event stream displaying incident lifecycle history. | `events: Array<{ timestamp, title, actor, role, icon, notes }>` | Incident Detail, Student Profile |
| **`CharacterScore`** | Radial gauge / badge rendering the student's holistic character grade (A/B/C/D). | `points`, `maxPoints`, `grade` ('A' \| 'B' \| 'C' \| 'D') | Student Profile, Header |
| **`StatusBadge`** | Color-coded status chip (`PENDING`, `UNDER_REVIEW`, `VERIFIED`, `REJECTED`). | `status`: IncidentStatusEnum | Incident Table, Cards |
| **`ViolationBadge`**| Red/Orange demerit pill showing category code and positive point value (e.g. `+15 Poin`). | `code`, `points`, `categoryName` | Incident List, Student Profile |
| **`RewardBadge`** | Green/Emerald award pill showing category code and negative point value (e.g. `-10 Poin`). | `code`, `points`, `rewardName` | Student Profile, Dashboard |
| **`RiskIndicator`** | Visual risk level meter (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`) with pulse animation. | `riskScore`: number, `riskLevel`: string | Dashboard, BK Guidance List |
| **`QuickFilter`** | Segmented pill button group for fast filtering (Today, This Week, Pending, SP-1). | `options`, `selected`, `onChange` | All List Tables |
| **`SearchBar`** | Debounced search input with shortcut key indicator (`Cmd + K`). | `value`, `onChange`, `placeholder`, `debounceMs` | All List Pages |
| **`AttachmentViewer`**| Image/PDF lightbox viewer with zoom, download, and presigned URL refresh handlers. | `attachments: Array<{ url, filename, mimeType }>` | Incident Detail Modal |
| **`ApprovalDialog`**| Modal confirmation dialog for verifying or rejecting an incident report with mandatory notes field. | `isOpen`, `incidentId`, `actionType` ('VERIFY'\|'REJECT'), `onConfirm` | Incidents Page, Dashboard |
| **`SanctionCard`** | Card displaying issued sanction details, minimum point trigger, status, and PDF download button.| `sanctionId`, `sanctionName`, `issuedDate`, `status`, `pdfUrl` | Student Profile, Sanction Mgmt |
| **`AuditTimeline`** | Immutable security log inspector item rendering JSON diffs (old vs new values). | `logId`, `actor`, `action`, `timestamp`, `diffObject` | Audit Viewer Page |
| **`NotificationPanel`**| Slide-over drawer displaying delivered/failed parent notifications and retry controls. | `notifications`, `onRetry` | TopBar, Dashboard |
| **`AnalyticsCard`**| Metric highlight container featuring KPI number, sparkline chart, and percentage delta. | `title`, `metricValue`, `trendDelta`, `chartData` | Executive Dashboard |
| **`BehaviorCharts`**| Reusable Chart.js / Recharts wrappers for heatmaps, violation trends, and category distribution.| `chartType` ('LINE'\|'BAR'\|'HEATMAP'), `data`, `height` | Analytics Module |
| **`DataTable`** | High-performance virtualized table with sort, pagination, column visibility, and bulk selection. | `columns`, `data`, `pagination`, `onRowClick`, `isLoading` | All Management Pages |
| **`PolicyConfigCard`**| Interactive configuration panel with toggle switches, numeric steppers, and tooltips. | `settingKey`, `title`, `value`, `onChange` | Policy Configuration Page |
| **`StudentSelectorModal`**| Multi-select student picker with class filter, NISN search, and avatar list items. | `isOpen`, `selectedStudentIds`, `onSelect` | Incident Creation Form |
