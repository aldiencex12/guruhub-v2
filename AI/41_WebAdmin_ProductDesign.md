# 41 — Web Admin Product Design Specification

## Module: Student Character & Discipline Management (Web Admin)
**Author:** Lead Product Designer & Senior Frontend Architect  
**Status:** DRAFT (Sprint 2)  
**Date:** 2026-07-25  

---

## 1. Executive Summary

This document specifies the UX architecture and product design requirements for the Web Admin interface of the **GuruHub Student Character & Discipline Management System**. The web portal provides school administrators, counseling staff (Guru BK), principals, and teachers with an intuitive, low-friction, high-density dashboard for monitoring behavior trends, processing incident approvals, and configuring discipline policies.

---

## 2. Target User Personas & Role Matrix

| User Role | Primary Focus | Key Responsibilities |
| :--- | :--- | :--- |
| **Super Admin** | System Governance | Cross-tenant monitoring, system audit logs, global configuration. |
| **School Admin** | Master Data & Policy | Configure discipline policies, categories, types, and sanction thresholds. |
| **Principal** | Executive Oversight | Review analytical reports, approve major sanctions (SP-3/Expulsion), track risk metrics. |
| **Guru BK (Counseling)**| Incident Workflow & Case Mgmt | Verify incident reports, issue sanctions, record counseling sessions, track student timelines. |
| **Homeroom Teacher** | Class Behavior Monitoring | Track student demerit points in homeroom class, view student character profile. |
| **Subject Teacher** | Incident Reporting | Submit incident reports (violations/rewards), upload initial evidence. |

---

## 3. Module Specifications & Persona Views

### 3.1 Dashboard Module
- **Purpose:** Central command center displaying live KPIs, high-risk students, pending approvals, and daily violation heatmaps.
- **Visible Data:** Today's incident count, pending verification count, students at risk count, recent rewards, recent violations, sanction summary, daily category chart, quick action bar.
- **Role Permissions:**
  - *SuperAdmin / SchoolAdmin / Principal / Guru BK:* Full access to school-wide metrics and pending approval queues.
  - *Homeroom Teacher:* Filtered view showing metrics for their homeroom class only.
  - *Teacher:* Read-only view of their submitted incident history.

### 3.2 Incident Management Module
- **Purpose:** End-to-end incident processing hub featuring list views, detailed case inspection, multi-student tagging, witness evidence, and verification approval workflows.
- **Visible Data:** Incident ID, incident date, location, reporter name, tagged students list, status badge (`PENDING`, `UNDER_REVIEW`, `VERIFIED`, `REJECTED`, `RESOLVED`), evidence attachments.
- **Role Permissions:**
  - *SuperAdmin / SchoolAdmin / Principal / Guru BK:* Can change incident status (`VERIFY`, `REJECT`, `RESOLVE`), add administrative notes, and edit details.
  - *Teacher:* Can create incidents and view incidents reported by themselves. Status mutation buttons are hidden.

### 3.3 Student Character Profile Module
- **Purpose:** Unified 360-degree student behavior profile combining active demerits, reward history, timeline, counseling logs, sanction status, attendance, and academic context.
- **Visible Data:** Student photo, NISN, Class, Active Points gauge, Character Score Grade (A/B/C/D), timeline feed, sanction cards, attendance summary, behavioral risk score badge.
- **Role Permissions:**
  - *SuperAdmin / SchoolAdmin / Principal / BK / Homeroom Teacher:* Full profile access and counseling log insertion.
  - *Teacher:* Read-only view of student points and violation history (counseling notes hidden for student privacy).

### 3.4 Categories & Types Management
- **Purpose:** Configuration management for discipline violation/reward categories and specific rules with default point values.
- **Role Permissions:**
  - *SchoolAdmin / SuperAdmin:* Full CRUD permissions (Create, Edit, Archive, Restore).
  - *All Other Roles:* Read-only access for reporting dropdowns.

### 3.5 Policies & Sanctions Management
- **Purpose:** Master policy setup (point reset cycle, carry-forward, auto-sanction triggers) and sanction threshold configuration.
- **Role Permissions:**
  - *SchoolAdmin / SuperAdmin:* Full configuration access.
  - *Principal / Guru BK:* View policy rules and execute pending sanction fulfillment.

### 3.6 Analytics, Audit Viewer, & Notifications
- **Purpose:** Executive BI reporting, append-only security audit log inspector, and multi-channel notification status monitor.
- **Role Permissions:**
  - *Principal / Admin / BK:* Analytics & Notifications view.
  - *SuperAdmin / SchoolAdmin:* Audit Viewer access.
