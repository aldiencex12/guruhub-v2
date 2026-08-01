# 70 — Offline & Online Data Sync Specification

## Module: Student Character & Discipline Management
**Author:** Chief Product Designer & UX Architect  
**Status:** DRAFT (Sprint 2.9)  
**Date:** 2026-07-25  

---

## 1. PWA Offline Architecture Overview

Teachers reporting violations in areas with weak cellular reception (e.g. school sports field, rear parking lot) must be able to create incident reports seamlessly without losing data.

```
[Teacher Mobile PWA] ──(Offline Mode)──> [IndexedDB / ServiceWorker Queue]
                                                      │
                                                      ▼ (Connection Restored)
[Server DB] <── (Process Queue) ◄── [Background Sync Handler]
```

---

## 2. Synchronization Rules & Idempotency

1. **IndexedDB Local Storage:** Unsubmitted incident reports are persisted locally in `guruhub_offline_incidents` IndexedDB table.
2. **Background Sync API (`sync` event):** As soon as browser detects network reconnection (`window.addEventListener('online')`), the ServiceWorker automatically flushes queued reports to `/discipline/incidents`.
3. **Idempotency Guarantee:** Every offline report generates a UUID v4 `clientReportId`. If a sync attempt is interrupted and retried, the backend rejects duplicate `clientReportId` submissions without creating double demerit entries.
