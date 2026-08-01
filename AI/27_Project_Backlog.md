# 27 — Project Backlog

## Module Name: Student Character & Discipline Management
**Author:** Lead Software Architect  
**Status:** DRAFT (Sprint 0)  
**Date:** 2026-07-25  

---

## 1. Epics & Features Breakdown

### Epic 1: Configuration & Master Data
*Establish the configurations, policy settings, categories, violation/reward types, and auto-sanction threshold rules.*

| User Story ID | Title | Estimate (SP) | Priority | Dependencies |
|---|---|---|---|---|
| **US-BACKLOG-01** | Create API endpoints for Categories and Types CRUD | 3 | High | None |
| **US-BACKLOG-02** | Develop Web Admin Category & Type settings pages | 3 | High | US-BACKLOG-01 |
| **US-BACKLOG-03** | Create API endpoints for School Policies and Sanction Thresholds | 3 | High | None |
| **US-BACKLOG-04** | Develop Web Admin Policy & Threshold configuration pages | 3 | Medium | US-BACKLOG-03 |

---

### Epic 2: Mobile Incident Reporting (PWA)
*Enable teachers to log student violations or positive achievements directly on mobile.*

| User Story ID | Title | Estimate (SP) | Priority | Dependencies |
|---|---|---|---|---|
| **US-BACKLOG-05** | Create API endpoint for incident submission (`POST /discipline/incidents`) | 5 | High | US-BACKLOG-01 |
| **US-BACKLOG-06** | Develop PWA mobile incident reporting form | 5 | High | US-BACKLOG-05 |
| **US-BACKLOG-07** | Implement image attachment upload support (Mobile & API) | 3 | Medium | US-BACKLOG-06 |

---

### Epic 3: Verification & Review Portal (Web Dashboard)
*Allow Counseling Teachers (Guru BK) and Admins to review, verify, or reject logged incidents.*

| User Story ID | Title | Estimate (SP) | Priority | Dependencies |
|---|---|---|---|---|
| **US-BACKLOG-08** | Create API endpoints for incident list filtering and status updates | 3 | High | US-BACKLOG-05 |
| **US-BACKLOG-09** | Develop Web Admin Incident Review Queue list page | 5 | High | US-BACKLOG-08 |
| **US-BACKLOG-10** | Develop Web Admin Incident Detail & Action modal | 3 | High | US-BACKLOG-09 |

---

### Epic 4: Sanctions Engine & Logs
*Execute automated actions when point thresholds are crossed, and log manual warnings/counseling sessions.*

| User Story ID | Title | Estimate (SP) | Priority | Dependencies |
|---|---|---|---|---|
| **US-BACKLOG-11** | Implement backend service to check thresholds and trigger sanction logs | 5 | High | US-BACKLOG-08, US-BACKLOG-03 |
| **US-BACKLOG-12** | Create API endpoints for student sanction logs search and status updates | 3 | Medium | US-BACKLOG-11 |
| **US-BACKLOG-13** | Develop Web Admin Student Sanction Log and action form | 3 | Medium | US-BACKLOG-12 |

---

### Epic 5: Behavior Profile & Analytics
*Provide a student behavior timeline to prepare counseling interventions and monitor trends.*

| User Story ID | Title | Estimate (SP) | Priority | Dependencies |
|---|---|---|---|---|
| **US-BACKLOG-14** | Create API endpoint for student behavior history timeline | 3 | High | US-BACKLOG-08 |
| **US-BACKLOG-15** | Develop Web Admin Student Behavior Profile and Timeline page | 5 | High | US-BACKLOG-14 |
| **US-BACKLOG-16** | Add school-wide discipline metrics to the Main Dashboard | 3 | Low | US-BACKLOG-08 |

---

## 2. Sprint Planning

### Sprint 1: Backend API Core Implementation (Phase 2)
- **Goal:** Implement the business logic layer, repository queries, and API routes. Get all backend endpoints ready.
- **Scope:** US-BACKLOG-01, US-BACKLOG-03, US-BACKLOG-05, US-BACKLOG-08, US-BACKLOG-11, US-BACKLOG-12, US-BACKLOG-14.
- **Total Story Points:** 25 SP

### Sprint 2: Web Admin Interfaces
- **Goal:** Develop the Next.js desktop web pages for administration, incident review, and student profiles.
- **Scope:** US-BACKLOG-02, US-BACKLOG-04, US-BACKLOG-09, US-BACKLOG-10, US-BACKLOG-13, US-BACKLOG-15.
- **Total Story Points:** 22 SP

### Sprint 3: Mobile PWA, Analytics & UAT
- **Goal:** Build the mobile reporting form, add analytics dashboard metrics, and run integration/UAT tests.
- **Scope:** US-BACKLOG-06, US-BACKLOG-07, US-BACKLOG-16, and End-to-End Testing.
- **Total Story Points:** 14 SP
