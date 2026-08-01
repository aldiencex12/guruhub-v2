# 54 — Reusable Component Technical Contracts

## Module: Student Character & Discipline Management (Frontend)
**Author:** Lead Frontend Architect  
**Status:** DRAFT (Sprint 2.5)  
**Date:** 2026-07-25  

---

## 1. Technical Interfaces for Key UI Components

### 1.1 `StatusBadge.tsx`

```typescript
export type IncidentStatusType = 'PENDING' | 'UNDER_REVIEW' | 'VERIFIED' | 'REJECTED' | 'RESOLVED';

export interface StatusBadgeProps {
  status: IncidentStatusType;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
}
```

### 1.2 `CharacterScoreGauge.tsx`

```typescript
export interface CharacterScoreGaugeProps {
  activePoints: number;
  maxActivePoints?: number;
  scoreGrade: 'A' | 'B' | 'C' | 'D';
  size?: number; // SVG Radius
  showLabel?: boolean;
}
```

### 1.3 `IncidentTimelineStream.tsx`

```typescript
export interface TimelineEventItem {
  id: string | number;
  eventType: string;
  title: string;
  description?: string | null;
  actorName: string;
  actorRole: string;
  createdAt: string;
  metadata?: Record<string, any>;
}

export interface IncidentTimelineStreamProps {
  incidentId: number;
  events: TimelineEventItem[];
  isLoading?: boolean;
}
```

### 1.4 `ApprovalDialog.tsx`

```typescript
export interface ApprovalDialogProps {
  isOpen: boolean;
  incidentId: number | null;
  currentStatus: IncidentStatusType;
  onClose: () => void;
  onSuccess?: () => void;
}
```

### 1.5 `DataTable.tsx`

```typescript
export interface DataTableProps<TData> {
  columns: ColumnDef<TData, any>[];
  data: TData[];
  totalItems: number;
  page: number;
  limit: number;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
  isLoading?: boolean;
  onRowClick?: (row: TData) => void;
}
```
