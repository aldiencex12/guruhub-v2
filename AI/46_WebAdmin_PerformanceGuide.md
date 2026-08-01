# 46 — Web Admin Performance & Virtualization Specification

## Module: Student Character & Discipline Management (Web Admin)
**Author:** Lead Product Designer & Senior Frontend Architect  
**Status:** DRAFT (Sprint 2)  
**Date:** 2026-07-25  

---

## 1. Performance Target Benchmarks

- **First Contentful Paint (FCP):** `< 0.8 seconds`
- **Largest Contentful Paint (LCP):** `< 1.2 seconds`
- **First Input Delay (FID) / INP:** `< 50 ms`
- **Lighthouse Performance Score:** `>= 95 / 100`

---

## 2. Front-End Optimization Strategies

### 2.1 Table Virtualization (`@tanstack/react-virtual`)
List tables with over 50 rows (e.g. Incident History, Student Directory) employ window virtualization. Only visible DOM nodes plus a 5-row buffer are rendered, keeping total DOM nodes under 150 even when scrolling through 10,000 records.

### 2.2 Route-Level Code Splitting & Dynamic Imports
Non-critical sub-components (such as `BehaviorCharts`, `AttachmentViewer`, `AuditTimeline`, and `ApprovalDialog`) are lazily loaded using React Code Splitting (`next/dynamic` or `React.lazy`), reducing the initial JavaScript bundle size by ~40%.

### 2.3 Intelligent Query Prefetching (TanStack Query)
When a user hovers over an incident table row or student card for more than 100ms, the frontend automatically triggers a background prefetch (`queryClient.prefetchQuery(['student', studentId])`). By the time the user clicks, the profile page renders instantaneously from cache.

### 2.4 Optimistic UI Updates
Verification actions (`VERIFY`, `REJECT`) execute optimistic UI updates. The target status badge updates immediately on click while the API request processes in the background. If the API returns an error, the UI rolls back gracefully with a toast notification.
