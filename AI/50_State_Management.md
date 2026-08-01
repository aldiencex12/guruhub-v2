# 50 — State Management & Data Hydration Strategy

## Module: Student Character & Discipline Management (Frontend)
**Author:** Lead Frontend Architect  
**Status:** DRAFT (Sprint 2.5)  
**Date:** 2026-07-25  

---

## 1. Tri-Tier State Management Architecture

To prevent state pollution and unnecessary re-renders, the frontend separates state into three distinct layers:

```
+-------------------------------------------------------------------------+
|                               STATE LAYERS                              |
+-------------------+-----------------------+-----------------------------+
| 1. SERVER STATE   | 2. URL QUERY STATE    | 3. CLIENT UI STATE          |
| (TanStack Query)  | (URL SearchParams)    | (Zustand Store)             |
| - Incidents List  | - Table Search String | - Modal Open/Close Flags    |
| - Student Profile | - Current Page & Limit| - Active Slide-over Drawer  |
| - Category Items  | - Active Filters      | - Selected Bulk Table Keys  |
+-------------------+-----------------------+-----------------------------+
```

---

## 2. Server State Strategy (TanStack Query v5)

### Query Key Hierarchy

```typescript
export const disciplineKeys = {
  all: ['discipline'] as const,
  policy: (schoolId: number) => [...disciplineKeys.all, 'policy', schoolId] as const,
  categories: (schoolId: number, filters: object) => [...disciplineKeys.all, 'categories', schoolId, filters] as const,
  types: (schoolId: number, filters: object) => [...disciplineKeys.all, 'types', schoolId, filters] as const,
  incidents: (schoolId: number, filters: object) => [...disciplineKeys.all, 'incidents', schoolId, filters] as const,
  incidentDetail: (incidentId: number) => [...disciplineKeys.all, 'incident', incidentId] as const,
  studentProfile: (studentId: number) => [...disciplineKeys.all, 'student', studentId] as const,
  sanctions: (schoolId: number, filters: object) => [...disciplineKeys.all, 'sanctions', schoolId, filters] as const,
};
```

---

## 3. URL State Strategy (Table Filters & Search)

All data table controls (search, page, limit, status filter, date range) are driven exclusively by **URL Search Parameters**:

- **URL Param Sync:** Updating a filter mutates `?search=terlambat&page=1&status=PENDING` via `useSearchParams()` or `nuqs`.
- **Shareable Links:** Users can copy/paste table URLs to share filtered views directly with colleagues.
- **Browser History Integration:** Browser Back/Forward buttons smoothly restore previous search and filter states.

---

## 4. Client UI State Strategy (Zustand Store)

Ephemera such as modal visibility and active drawer selections are managed by a lightweight Zustand store (`useDisciplineUIStore`):

```typescript
interface DisciplineUIState {
  isApprovalModalOpen: boolean;
  selectedIncidentId: number | null;
  openApprovalModal: (incidentId: number) => void;
  closeApprovalModal: () => void;
}
```
