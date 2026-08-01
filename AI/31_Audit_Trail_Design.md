# 31 — Audit Trail System Specification

## Module: Student Character & Discipline Management
**Author:** Lead Software Architect  
**Status:** DRAFT (Sprint 1.5)  
**Date:** 2026-07-25  

---

## 1. Architectural Mandate

To satisfy school governance and legal compliance requirements, the Discipline module must enforce a **Permanent Append-Only Audit Logging System**. 

No user, including system administrators, may physically alter (`UPDATE`) or delete (`DELETE`) records from the audit trail. All mutations to master rules, incidents, policies, and sanctions produce an immutable audit log entry.

---

## 2. Database Schema Specification (`discipline_audit_logs`)

```sql
CREATE TABLE `discipline_audit_logs` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `school_id` BIGINT UNSIGNED NOT NULL,
  `actor_user_id` BIGINT UNSIGNED NOT NULL,
  `module` VARCHAR(50) NOT NULL DEFAULT 'DISCIPLINE',
  `action` VARCHAR(50) NOT NULL, -- e.g. CREATE_INCIDENT, VERIFY_INCIDENT, UPDATE_POLICY
  `entity_type` VARCHAR(50) NOT NULL, -- e.g. discipline_incidents, discipline_policies
  `entity_id` BIGINT UNSIGNED NOT NULL,
  `old_values` JSON NULL, -- State before change (NULL for CREATE)
  `new_values` JSON NULL, -- State after change (NULL for DELETE)
  `ip_address` VARCHAR(45) NULL,
  `user_agent` VARCHAR(255) NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_audit_school_action` (`school_id`, `action`),
  INDEX `idx_audit_entity` (`school_id`, `entity_type`, `entity_id`),
  INDEX `idx_audit_actor` (`school_id`, `actor_user_id`),
  INDEX `idx_audit_created` (`school_id`, `created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## 3. Mandatory Audit Events

The following domain actions automatically dispatch append-only audit entries:

1. **`POLICY_UPDATE`**: Changes to `point_reset_cycle`, `max_active_points`, or `auto_sanction_enabled`. Stores previous and new policy settings.
2. **`CATEGORY_CREATE` / `CATEGORY_UPDATE`**: Creation or modification of discipline categories.
3. **`TYPE_CREATE` / `TYPE_UPDATE`**: Creation or alteration of violation/reward types and point values.
4. **`INCIDENT_CREATE`**: Submission of new incident reports.
5. **`INCIDENT_STATUS_CHANGE`**: Transitions between `PENDING`, `UNDER_REVIEW`, `VERIFIED`, `REJECTED`, and `RESOLVED`. Captures handler ID and notes.
6. **`SANCTION_STATUS_CHANGE`**: Status transitions on student sanction logs (`PENDING -> ACTIVE -> COMPLETED / REVOKED`).

---

## 4. Security & Audit Integrity Guarantees

1. **Database Privileges:** The database connection user for application runtime is granted `INSERT` and `SELECT` permissions on `discipline_audit_logs`. `UPDATE` and `DELETE` privileges are explicitly revoked at the MySQL/MariaDB grant level.
2. **Context Enrichment:** `AuditTrailService` extracts HTTP request context (`ip_address`, `user_agent`, `actor_user_id`, `schoolId`) passed from middleware.
3. **Immutability Verification:** Automated integration tests verify that attempting to execute an `UPDATE` or `DELETE` statement against `discipline_audit_logs` raises a database permission error.
