# 36 — Analytics Architecture Specification

## Module: Student Character & Discipline Management
**Author:** Lead Software Architect  
**Status:** DRAFT (Sprint 1.5)  
**Date:** 2026-07-25  

---

## 1. Architectural Concept

To prevent executive dashboard queries (e.g. multi-year trend analysis, school-wide heatmaps, category distributions) from executing expensive live SQL aggregations against OLTP transactional tables, the system establishes a **Pre-Aggregated Data Mart Pipeline**.

Live transaction tables process writes, while asynchronous event handlers update pre-computed analytical summary tables (`discipline_analytics_marts`).

```
+----------------------------+        Event Driven        +---------------------------+
| OLTP Tables                | -------------------------> | Analytics Processing Job  |
| (incidents, sanctions)     |                            +---------------------------+
+----------------------------+                                          │
                                                                        ▼
                                                          +---------------------------+
                                                          | Data Mart Tables          |
                                                          | (discipline_monthly_marts)|
                                                          +---------------------------+
                                                                        │
                                                                        ▼
                                                          +---------------------------+
                                                          | Executive BI Dashboard    |
                                                          +---------------------------+
```

---

## 2. Analytics Capabilities & Metrics

1. **Top Violations & Rewards Breakdown:** Frequency distribution of incident types per class, grade level, and gender.
2. **Temporal & Spatial Heatmaps:** High-frequency incident times (e.g. 07:15 recess, 12:30 lunch break) and locations (e.g. Canteen, Rear Gate, Restrooms).
3. **Student Trajectory & Behavior Trends:** Month-over-month demerit velocity per student, identifying improving or deteriorating student behaviors.
4. **Homeroom Class Health Index:** Comparative behavior scoring across classes to help principals evaluate homeroom guidance effectiveness.

---

## 3. Data Mart Schema Specification (`discipline_monthly_analytics`)

```sql
CREATE TABLE `discipline_monthly_analytics` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `school_id` BIGINT UNSIGNED NOT NULL,
  `academic_year_id` BIGINT UNSIGNED NOT NULL,
  `year_month` VARCHAR(7) NOT NULL, -- e.g. "2026-07"
  `total_incidents` INT UNSIGNED NOT NULL DEFAULT 0,
  `total_violations` INT UNSIGNED NOT NULL DEFAULT 0,
  `total_rewards` INT UNSIGNED NOT NULL DEFAULT 0,
  `total_points_demerit` INT UNSIGNED NOT NULL DEFAULT 0,
  `total_points_reward` INT UNSIGNED NOT NULL DEFAULT 0,
  `top_violation_type_id` BIGINT UNSIGNED NULL,
  `top_location` VARCHAR(255) NULL,
  `sanctions_issued_count` INT UNSIGNED NOT NULL DEFAULT 0,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `uq_school_period` (`school_id`, `academic_year_id`, `year_month`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## 4. Query Performance Guarantees

1. **Sub-50ms Executive Dashboards:** Executive chart queries fetch directly from single-row aggregated summary records instead of joining hundreds of thousands of incident records.
2. **Zero OLTP Impact:** Reading analytical reports never locks or contends with live incident reporting transactions.
