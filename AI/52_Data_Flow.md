# 52 — Data Flow & Optimistic Mutation Specification

## Module: Student Character & Discipline Management (Frontend)
**Author:** Lead Frontend Architect  
**Status:** DRAFT (Sprint 2.5)  
**Date:** 2026-07-25  

---

## 1. End-to-End Data Flow Architecture

```
[User Action: Click "Verify"] ──► [Optimistic Query Cache Update] ──► [UI Renders VERIFIED Badge (0ms)]
                                               │
                                               ▼
[Toast Notification: Success] ◄── [Query Invalidation] ◄── [API Request /discipline/incidents/42/status]
```

---

## 2. Optimistic Mutation Pattern (`updateIncidentStatus`)

```typescript
export function useUpdateIncidentStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ incidentId, status, notes }: { incidentId: number; status: string; notes?: string }) =>
      disciplineService.updateIncidentStatus(incidentId, { status, notes }),

    onMutate: async ({ incidentId, status }) => {
      // 1. Cancel outgoing refetches so they don't overwrite optimistic update
      await queryClient.cancelQueries({ queryKey: disciplineKeys.incidentDetail(incidentId) });

      // 2. Snapshot previous value for rollback on error
      const previousIncident = queryClient.getQueryData(disciplineKeys.incidentDetail(incidentId));

      // 3. Optimistically update query cache
      queryClient.setQueryData(disciplineKeys.incidentDetail(incidentId), (old: any) => ({
        ...old,
        status: status
      }));

      return { previousIncident };
    },

    onError: (err, variables, context) => {
      // 4. Rollback to snapshot on error
      if (context?.previousIncident) {
        queryClient.setQueryData(disciplineKeys.incidentDetail(variables.incidentId), context.previousIncident);
      }
      toast.error("Gagal memperbarui status insiden");
    },

    onSettled: (data, error, variables) => {
      // 5. Invalidate relevant queries to fetch true server state
      queryClient.invalidateQueries({ queryKey: disciplineKeys.all });
    }
  });
}
```

---

## 3. Form Validation & Submission Flow

1. **Client-Side Schema Validation:** Forms use `react-hook-form` paired with `@hookform/resolvers/zod` matching the backend TypeBox DTO schemas.
2. **Inline Input Error Highlighting:** Form inputs display red error focus rings and accessible error text messages (`aria-invalid="true"`).
3. **Submit Button State Locking:** Buttons automatically disable during pending API submissions (`disabled={isPending}`), displaying a spinning loader icon to prevent double submissions.
