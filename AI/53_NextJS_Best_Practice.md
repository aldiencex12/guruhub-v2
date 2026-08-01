# 53 — Next.js Best Practices & Async UI Specification

## Module: Student Character & Discipline Management (Frontend)
**Author:** Lead Frontend Architect  
**Status:** DRAFT (Sprint 2.5)  
**Date:** 2026-07-25  

---

## 1. Async Loading Strategy (Suspense & Skeletons)

To avoid layout shifts (CLS = 0) and provide instantaneous visual feedback, all asynchronous data fetching routes implement **Next.js Loading Skeletons (`loading.tsx`)**.

```
[Page Trigger] ──► [Instant Next.js loading.tsx Renders Skeleton Shell (0ms)]
                                        │
                                        ▼
[Page Hydrated] ◄── [Server Prefetch / Streaming Data Complete]
```

### Skeleton Component Guidelines
1. **Layout Mirroring:** Skeletons mimic the exact dimensions, grid layout, and card heights of the actual content.
2. **Subtle Shimmer Animation:** Uses CSS `@keyframes shimmer` with subtle background linear gradients (`bg-slate-200/80` to `bg-slate-300/80`).

---

## 2. Error Boundary Architecture (`error.tsx`)

Every sub-route directory contains an `error.tsx` component to isolate runtime errors gracefully without crashing the global application layout:

- **Route Isolation:** A failure in `/discipline/analytics/error.tsx` keeps the sidebar, header, and navigation operational while presenting a reset button ("Coba Lagi").
- **Error Logging Integration:** Errors captured in `error.tsx` log stack traces to Sentry / Application Insights along with `schoolId` and user context.

---

## 3. Data List Pattern Decision Matrix: Pagination vs Infinite Scroll

| Pattern Type | Selected Approach | Target Interfaces | Architectural Rationale |
| :--- | :--- | :--- | :--- |
| **Numeric Pagination** | **Enforced** | Incident Tables, Sanction Logs, Audit Logs, Category Lists | Administrative tasks require precise page jumps, total row counts, and predictable URLs (`?page=2`). |
| **Infinite Scroll** | **Enforced** | Incident Timeline Stream, Live Dashboard Feed | Feeds are consumed chronologically where continuous scrolling improves reading flow. |
