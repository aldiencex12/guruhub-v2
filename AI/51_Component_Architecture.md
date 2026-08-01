# 51 — Component Architecture & RSC Boundaries Specification

## Module: Student Character & Discipline Management (Frontend)
**Author:** Lead Frontend Architect  
**Status:** DRAFT (Sprint 2.5)  
**Date:** 2026-07-25  

---

## 1. Server Components (RSC) vs Client Components Matrix

| Component Type | RSC (Server Component) | Client Component (`'use client'`) |
| :--- | :--- | :--- |
| **Primary Responsibility** | Data fetching, SEO metadata, security authorization checks. | Interactivity, event listeners, form inputs, animation. |
| **Allowed Features** | `async/await`, Direct DB/API prefetching, Node modules. | `useState`, `useEffect`, `useQuery`, `onClick`, `framer-motion`. |
| **Disallowed Features** | React hooks (`useState`), browser APIs (`window`, `localStorage`). | Async server functions inside component scope. |
| **Module Examples** | `incidents/page.tsx`, `students/[id]/page.tsx`. | `IncidentFilterBar.tsx`, `ApprovalModal.tsx`. |

---

## 2. Boundary Placement Strategy

To keep client JavaScript bundle size minimal, `'use client'` boundaries are pushed as far down the component tree as possible:

```
[Server Component: incidents/page.tsx]  <-- Fetches Initial Query Prefetch
       │
       ├─► [Server Component: IncidentHeader.tsx]  <-- Static Markup
       │
       └─► [Client Component: IncidentTableShell.tsx]  <-- 'use client'
                │
                ├─► [Client Component: FilterToolbar.tsx]
                └─► [Client Component: DataTableVirtual.tsx]
```

---

## 3. Atomic Design Hierarchy

1. **Atoms (`src/components/ui/`):** Generic un-styled or styled primitives (`Button`, `Input`, `Badge`, `Skeleton`, `Dialog`).
2. **Molecules (`src/features/discipline/components/`):** Composite domain primitives (`StatusBadge`, `ViolationPill`, `CharacterScoreGauge`).
3. **Organisms (`src/features/discipline/components/`):** Self-contained feature blocks (`IncidentFeedTable`, `Student360Header`, `TimelineStream`).
4. **Templates (`src/app/(dashboard)/discipline/`):** Page layout structures and responsive grid containers.
