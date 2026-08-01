# 33 — Notification Queue Architecture Specification

## Module: Student Character & Discipline Management
**Author:** Lead Software Architect  
**Status:** DRAFT (Sprint 1.5)  
**Date:** 2026-07-25  

---

## 1. Architectural Concept

Directly sending push notifications, emails, or WhatsApp messages inside HTTP request handlers causes dangerous latency spikes, rate-limit failures, and single-point-of-failure vulnerabilities.

The Discipline module uses a **Decoupled Asynchronous Job Queue Pipeline** powered by Redis / BullMQ.

```
+------------------+         Dispatches        +---------------------+
| Domain Event     | ------------------------> | NotificationQueue   |
| (e.g. Verified)  |                           | (Redis / BullMQ)    |
+------------------+                           +---------------------+
                                                          │
                                                          ▼
                                               +---------------------+
                                               | NotificationWorker  |
                                               +---------------------+
                                                          │
                    +--------------------+----------------+--------------------+
                    │                    │                │                    │
                    ▼                    ▼                ▼                    ▼
             +------------+       +------------+   +------------+       +------------+
             | WA Gateway |       | FCM Push   |   | Email SMTP |       | In-App DB  |
             +------------+       +------------+   +------------+       +------------+
```

---

## 2. Notification Job Contract

```typescript
export interface INotificationJobPayload {
  jobId: string;
  schoolId: number;
  recipientUserId: number;
  recipientRole: "PARENT" | "TEACHER" | "STUDENT" | "ADMIN";
  channels: Array<"PUSH" | "WHATSAPP" | "EMAIL" | "IN_APP">;
  templateKey: string; // e.g. "INCIDENT_VERIFIED_PARENT_NOTIF"
  variables: Record<string, string | number>;
  createdAt: string;
}
```

---

## 3. Supported Notification Channels & Provider Adapters

1. **WhatsApp Gateway Adapter (`IWhatsAppProvider`):** Integration with official WhatsApp Business API / Fonnte / Wablas for instant parent alerts.
2. **Firebase Cloud Messaging Adapter (`IFCMProvider`):** Direct mobile push notifications to the GuruHub Mobile App for teachers and parents.
3. **Email Provider Adapter (`IEmailProvider`):** SMTP / Resend integration for formal PDF sanction letters (SP-1, SP-2, Suspension).
4. **In-App Notification Adapter (`IInAppProvider`):** Persists notification entries to `user_notifications` for the web dashboard bell icon feed.

---

## 4. Resilience & Retry Policy

1. **Exponential Backoff:** If a third-party gateway (e.g., WhatsApp API) is down or rate-limited, the job worker retries up to 5 times with exponential backoff (`10s, 30s, 2m, 10m, 30m`).
2. **Dead Letter Queue (DLQ):** Failed jobs after maximum retries are routed to `notification-dlq` for administrative review and manual retry.
3. **Deduplication Key:** Each notification job generates a unique idempotency key (`schoolId:incidentId:recipientId:templateKey`) to prevent sending duplicate messages if a network error occurs during acknowledgment.
