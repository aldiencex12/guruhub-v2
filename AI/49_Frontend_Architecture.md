# 49 — Next.js App Router & Directory Architecture Specification

## Module: Student Character & Discipline Management (Frontend)
**Author:** Lead Frontend Architect  
**Status:** DRAFT (Sprint 2.5)  
**Date:** 2026-07-25  

---

## 1. App Router Directory Structure

The discipline module leverages Next.js App Router (located in `front-guruhub/src`), enforcing a strict feature-based folder layout:

```
src/
├── app/
│   └── (dashboard)/
│       └── discipline/
│           ├── layout.tsx                     # Discipline Sub-layout & Providers
│           ├── page.tsx                       # Dashboard Redirect / Summary
│           ├── incidents/
│           │   ├── page.tsx                   # Incidents Data Table Page
│           │   └── [id]/
│           │       └── page.tsx               # Incident Detail & Timeline Page
│           ├── students/
│           │   └── [id]/
│           │       └── page.tsx               # Student 360 Character Profile Page
│           ├── categories/
│           │   └── page.tsx                   # Category Management Page
│           ├── types/
│           │   └── page.tsx                   # Violation & Reward Types Page
│           ├── policies/
│           │   └── page.tsx                   # Master Policy Setup Page
│           ├── sanctions/
│           │   └── page.tsx                   # Sanction Logs & Thresholds Page
│           ├── analytics/
│           │   └── page.tsx                   # Executive BI Analytics Page
│           └── audit-logs/
│               └── page.tsx                   # Security Audit Inspector Page
├── features/
│   └── discipline/                            # Domain Feature Components
│       ├── components/
│       │   ├── IncidentFeed.tsx
│       │   ├── IncidentDetailDrawer.tsx
│       │   ├── StudentCharacterGauge.tsx
│       │   ├── IncidentTimelineStream.tsx
│       │   └── SanctionActionModal.tsx
│       ├── hooks/                             # Custom Feature Hooks
│       │   ├── useIncidentFilter.ts
│       │   └── useStudentProfile.ts
│       └── types/                             # Discipline Feature Interfaces
│           └── discipline.types.ts
├── queries/
│   └── discipline.query.ts                    # TanStack Query Options & Hooks
└── services/
    └── discipline.ts                          # Axios/Fetch API Client Mapping
```

---

## 2. Page & Sub-Layout Architecture

1. **Root Discipline Layout (`discipline/layout.tsx`):**
   - Injects the `DisciplineBreadcrumbs` and `QuickActionButton` in the top header.
   - Enforces RBAC permissions using `ProtectedRoute` wrappers.
   - Preserves tab state across sub-routes.

2. **Server Components (`page.tsx`):**
   - All route entry points (`page.tsx`) are Server Components by default.
   - Fetch initial layout metadata and prefetch TanStack Query state on the server.

3. **Client Interactive Shells:**
   - Complex interactive elements (tables, filters, modals) are encapsulated inside `'use client'` feature components.
