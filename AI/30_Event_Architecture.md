# 30 — Event Architecture Specification

## Module: Student Character & Discipline Management
**Author:** Lead Software Architect  
**Status:** DRAFT (Sprint 1.5)  
**Date:** 2026-07-25  

---

## 1. Architectural Concept

To eliminate tight coupling between the core domain services and secondary concerns (such as notifications, audit logging, timeline tracking, and analytics), the discipline module introduces an **Asynchronous Event-Driven Architecture**.

The core service emits domain events upon business state transitions. Subscribed event handlers asynchronously digest events without blocking the primary business transaction thread.

```
+-------------------+        emits Event        +-----------------------+
| DisciplineService | ------------------------> | DisciplineEventBus    |
+-------------------+                           +-----------------------+
                                                            |
                 +-------------------+----------------------+-------------------+
                 |                   |                      |                   |
                 v                   v                      v                   v
        +------------------+ +------------------+  +------------------+ +------------------+
        | TimelineListener | |  AuditListener   |  | QueuePublisher   | | AnalyticsEngine  |
        +------------------+ +------------------+  +------------------+ +------------------+
```

---

## 2. Event Contract Standard

All domain events implement a common `IDomainEvent` interface:

```typescript
export interface IDomainEvent<T = any> {
  eventId: string;          // UUID v4
  eventName: string;        // e.g. "discipline.incident.created"
  occurredAt: Date;         // Timestamp of event creation
  schoolId: number;         // Multi-tenant Isolation ID
  actorUserId: number;      // ID of user performing the action
  payload: T;               // Strongly typed event payload
}
```

---

## 3. Discipline Domain Events

| Event Name | Class Name | Trigger Description | Payload Attributes |
| :--- | :--- | :--- | :--- |
| `discipline.incident.created` | `IncidentCreatedEvent` | Report submitted by teacher/admin | `incidentId`, `reporterUserId`, `students[]`, `incidentDate` |
| `discipline.incident.verified` | `IncidentVerifiedEvent` | Incident verified by BK/Admin | `incidentId`, `handlerTeacherId`, `verifiedAt`, `pointSnapshots[]` |
| `discipline.incident.rejected` | `IncidentRejectedEvent` | Incident rejected by BK/Admin | `incidentId`, `handlerTeacherId`, `rejectionNotes` |
| `discipline.incident.resolved` | `IncidentResolvedEvent` | All sanctions/actions completed | `incidentId`, `resolvedAt`, `notes` |
| `discipline.reward.granted` | `RewardGrantedEvent` | Positive behavior award granted | `incidentId`, `studentId`, `rewardTypeId`, `pointsAwarded` |
| `discipline.sanction.generated`| `SanctionGeneratedEvent`| Auto/manual sanction threshold hit| `sanctionLogId`, `studentId`, `thresholdId`, `sanctionType` |
| `discipline.sanction.completed`| `SanctionCompletedEvent`| Student finished sanction | `sanctionLogId`, `studentId`, `completedAt`, `documentUrl` |

---

## 4. Event Bus Specification

The `DisciplineEventBus` provides typed event dispatching using Node/Bun's `EventEmitter` in single-node mode, designed for zero-code migration to Redis Pub/Sub or NATS in multi-node clusters.

### Guarantees & Operational Principles
1. **Asynchronous Execution:** Subscribers execute asynchronously using `setImmediate` or process ticks to avoid stalling the main HTTP thread.
2. **Failure Isolation:** Errors thrown inside an event listener are caught, logged, and isolated without crashing the primary business operation.
3. **Tenant Context Preservation:** Every event payload carries `schoolId` to guarantee tenant isolation across background listeners.
