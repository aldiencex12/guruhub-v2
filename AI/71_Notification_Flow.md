# 71 — Multi-Channel Notification Flow Specification

## Module: Student Character & Discipline Management
**Author:** Chief Product Designer & UX Architect  
**Status:** DRAFT (Sprint 2.9)  
**Date:** 2026-07-25  

---

## 1. Notification Event Matrix

| Event Trigger | Recipient Role | Target Channel | Template Key | Action Link |
| :--- | :--- | :--- | :--- | :--- |
| `IncidentCreated` | Guru BK Staff | Mobile Push & In-App | `NOTIF_NEW_INCIDENT_BK` | `/discipline/dashboard` |
| `IncidentVerified` | Homeroom Teacher | In-App Bell Feed | `NOTIF_INCIDENT_VERIFIED_HR` | `/discipline/incidents/42` |
| `SanctionGenerated` | Parent | WhatsApp & PWA Push | `NOTIF_SANCTION_ISSUED_PARENT` | Parent Portal Link |
| `SanctionGenerated` | Principal | In-App Bell Feed | `NOTIF_SANCTION_ISSUED_PRINCIPAL`| `/discipline/sanctions` |

---

## 2. Fallback & Retry Behavior

1. **Primary Delivery:** Dispatched asynchronously via Redis Queue worker.
2. **Channel Failover:** If WhatsApp gateway fails to deliver after 3 retries (10m exponential backoff), system automatically falls back to Email delivery.
3. **In-App Delivery Status Tracking:** Admin Notification Center `/discipline/notifications` provides real-time status pills (`DELIVERED`, `FAILED`, `PENDING_RETRY`) with a manual "Retry Now" button for administrators.
