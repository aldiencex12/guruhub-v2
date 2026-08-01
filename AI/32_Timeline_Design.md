# 32 — Timeline System Specification

## Module: Student Character & Discipline Management
**Author:** Lead Software Architect  
**Status:** DRAFT (Sprint 1.5)  
**Date:** 2026-07-25  

---

## 1. Architectural Overview

To provide teachers, counseling staff (BK), school admins, and parents with complete transparency into how disciplinary cases are reported and resolved, the system includes a dedicated **Incident Timeline Engine**.

Whenever an incident is reported, verified, escalated, sanctioned, or resolved, a timeline event is appended to `discipline_incident_timelines`. The frontend consumes this chronologically sorted feed to render visual progress maps.

---

## 2. Database Schema Specification (`discipline_incident_timelines`)

```sql
CREATE TABLE `discipline_incident_timelines` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `school_id` BIGINT UNSIGNED NOT NULL,
  `incident_id` BIGINT UNSIGNED NOT NULL,
  `event_type` VARCHAR(50) NOT NULL, -- e.g. REPORTED, VERIFIED, REJECTED, SANCTION_ISSUED, NOTIFIED, RESOLVED
  `title` VARCHAR(255) NOT NULL, -- Indonesian title, e.g., "Laporan Insiden Dibuat"
  `description` TEXT NULL, -- Detailed notes
  `actor_name` VARCHAR(255) NOT NULL, -- Name of user performing action
  `actor_role` VARCHAR(50) NOT NULL, -- TEACHER, BK, ADMIN, SYSTEM
  `metadata` JSON NULL, -- Contextual data (e.g. { sanctionLogId: 12, pointSnapshot: 15 })
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_timeline_incident` FOREIGN KEY (`incident_id`) REFERENCES `discipline_incidents` (`id`) ON DELETE CASCADE,
  INDEX `idx_timeline_incident` (`school_id`, `incident_id`, `created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## 3. Timeline Event Lifecycle Flow

```
[09:10] INCIDENT_REPORTED
  │  Reporter: Pak Budi (Guru Piket)
  │  Notes: Terlambat 15 menit saat bel masuk
  ▼
[09:15] STATUS_UNDER_REVIEW
  │  Actor: Ibu Susi (Guru BK)
  │  Notes: Memanggil siswa ke ruang BK untuk konfirmasi
  ▼
[09:20] INCIDENT_VERIFIED
  │  Actor: Ibu Susi (Guru BK)
  │  Notes: Insiden terverifikasi valid, poin demerit +5
  ▼
[09:21] SANCTION_GENERATED (System Event)
  │  Actor: System Auto-Engine
  │  Notes: Poin kumulatif siswa (25) menyentuh ambang batas SP-1
  ▼
[09:22] PARENT_NOTIFIED (System Event)
  │  Actor: Notification Worker
  │  Notes: Notifikasi PWA & WhatsApp terkirim ke Orang Tua
  ▼
[10:00] INCIDENT_RESOLVED
  │  Actor: Ibu Susi (Guru BK)
  │  Notes: Surat pernyataan ditandatangani
```

---

## 4. Extensibility Guarantees

1. **Polymorphic Metadata:** The `metadata` JSON column allows future integrations (e.g. attaching AI risk assessments or video evidence timestamps) without requiring schema migrations.
2. **Event Listener Integration:** `TimelineListener` subscribes to `DisciplineEventBus` events and automatically inserts timeline entries asynchronously. Core business handlers do not write timeline SQL explicitly.
