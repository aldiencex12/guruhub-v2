# 37 — Performance & Caching Review

## Module: Student Character & Discipline Management
**Author:** Lead Software Architect  
**Status:** DRAFT (Sprint 1.5)  
**Date:** 2026-07-25  

---

## 1. Comprehensive Query Audit

An audit of database interaction patterns was conducted to identify bottleneck queries and establish a high-performance database execution strategy for 10-year production scaling.

---

## 2. Database Indexing Strategy

To guarantee sub-second execution across high-volume queries, the following compound indexes are enforced in `schema/discipline.ts`:

| Table | Index Name | Columns Covered | Target Query Supported |
| :--- | :--- | :--- | :--- |
| `discipline_incidents` | `idx_incidents_school_status_date` | `(school_id, status, incident_date)` | Paginated incident list filtering |
| `discipline_incidents` | `idx_incidents_reporter` | `(school_id, reporter_user_id)` | Teacher incident reporting history |
| `discipline_incident_students`| `idx_inc_stud_student_ay` | `(student_id, academic_year_id)` | Active student demerit point aggregation |
| `discipline_sanction_logs` | `idx_sanctions_student_status` | `(school_id, student_id, status)` | Active student sanctions check |
| `discipline_types` | `idx_types_school_cat` | `(school_id, category_id, deleted_at)` | Master category and type lookups |

---

## 3. Distributed Redis Caching Strategy

Read-heavy master datasets and frequent lookup items are cached in Redis to minimize relational database read pressure.

```
+----------------+        1. Cache Check       +----------------+
| Service Layer  | --------------------------> |  Redis Cache   |
+----------------+                             +----------------+
        │                                              │
        │ 2. Cache Miss                                │ Hit: Return Fast
        v                                              v
+----------------+                             +----------------+
| MySQL Database |                             | Response Payload|
+----------------+                             +----------------+
```

### Cache Keys & TTL Policies

1. **School Discipline Policy Cache (`discipline:policy:{schoolId}`)**
   - **TTL:** 3600 seconds (1 hour).
   - **Invalidation:** Automatically invalidated on `updatePolicy()` invocation.

2. **Master Types & Categories Cache (`discipline:types:{schoolId}`)**
   - **TTL:** 86400 seconds (24 hours).
   - **Invalidation:** Invalidated when a category or type is created or modified.

3. **Student Active Points Cache (`discipline:points:{schoolId}:{studentId}`)**
   - **TTL:** 600 seconds (10 minutes).
   - **Invalidation:** Invalidated instantly when an incident status transitions to `VERIFIED` or a point cycle reset occurs.

---

## 4. N+1 Query Elimination Benchmarks

- **Incident Details Fetching:** `getIncidentDetails()` uses Drizzle relational query hydration (`with: { disciplineType: true }`) to fetch incident students and their corresponding type definitions in 2 batch queries rather than $1 + N$ queries.
- **Incident List Counting:** Count and list queries execute in parallel via `Promise.all()` over indexed queries, preventing double round-trip network latencies.
