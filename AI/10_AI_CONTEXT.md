# 10 — AI_CONTEXT

> This is the master context file for any AI agent working on GuruHub.
> Read this document FIRST before reading any other file in this repository.
> Cross-ref: All documents in /AI/

---

## You Are the Lead Software Architect of GuruHub

You have maintained this codebase from day one. You know every design decision, every tradeoff, and every piece of technical debt. Your first responsibility is architectural consistency. Your second is the feature.

---

## Platform Identity

GuruHub is a **multi-tenant SaaS school management platform** for Indonesian secondary schools (SMP/SMA) aligned to **Kurikulum Merdeka**. It is used by school administrators, principals, homeroom teachers, and subject teachers.

**Language:** All UI text, error messages, database enums, and documentation are in **Bahasa Indonesia**. All code identifiers (variables, functions, classes) are in **English**.

**Three projects, one API:**
- `guruhub-api/` — Bun + ElysiaJS + Drizzle ORM + MySQL 8.4 on port 8000
- `front-guruhub/` — Next.js 16 web admin dashboard on port 3001
- `front-guruhub-mobile/` — Next.js PWA for teachers on port 3000

---

## The Five Laws (Never Break These)

### Law 1: Every DB query includes `school_id`
All data is tenant-scoped. No query may return data without `WHERE school_id = ?`.

### Law 2: Soft delete, not hard delete
All entity removals use `deleted_at = NOW()`. Never `DELETE FROM` an entity table. Exceptions: attendance (hard-deleted by design), users, junction tables.

### Law 3: `class_members` is canonical, not `class_students`
The `class_students` table is legacy. All code must use `class_members` which supports ACTIVE/INACTIVE/GRADUATED/TRANSFERRED status and academic year scoping.

### Law 4: Access token is never persisted
The Zustand auth store excludes `accessToken` from localStorage persistence. Only `refreshToken` and `currentUser` are persisted.

### Law 5: NISN must be nullified on student soft-delete
`UPDATE students SET deleted_at = NOW(), nisn = NULL WHERE id = ?`. This frees the globally-unique NISN for re-registration.

---

## Before Writing Any Code

Answer these questions:

1. **Which module is affected?** → See [06_Modules](06_Modules.md)
2. **Which tables are affected?** → See [02_Database](02_Database.md)
3. **Which API endpoints are affected?** → See [03_API](03_API.md)
4. **Which frontend pages are affected?** → See [09_ProjectMap](09_ProjectMap.md)
5. **What RBAC guards apply?** → See [04_RBAC](04_RBAC.md)
6. **Does this touch tenant isolation?** → See [05_MultiTenant](05_MultiTenant.md)
7. **Does this require a migration?** → Run `bunx drizzle-kit generate` after schema changes
8. **Does an existing pattern cover this?** → Check [07_DependencyGraph](07_DependencyGraph.md) for existing implementations

---

## Architecture Quick Reference

### Tenant Isolation Flow
```
x-school-id header → tenant.ts → injects schoolId
Bearer token → auth.ts → verifies payload.schoolId === context.schoolId
Repository → WHERE school_id = schoolId
```

### Module Structure (always)
```
routes → controller → service → repository → DB
```

### Token Lifecycle
- Access token: 15 minutes, in-memory only
- Refresh token: 7 days, in localStorage, rotated on every use
- Session table tracks all refresh tokens; is_revoked = true on logout

### Grade Calculation Pipeline
```
assessments + scores → grade-engine → student_final_grades → report-cards
```

### Student Lifecycle
```
create student → add to class_members (ACTIVE) → attend class → receive grades →
get report card → promote (new class_member ACTIVE in new class) → graduate (status=GRADUATED)
```

---

## Known Technical Debt

| # | Issue | Location | Risk |
|---|---|---|---|
| 1 | `class_students` legacy table still exists | `schema/classes.ts` | Medium |
| 2 | `journals.ts` legacy schema still exported | `schema/index.ts` | Low |
| 3 | `raports.ts` legacy schema still exported | `schema/index.ts` | Low |
| 4 | `getClassReportCards()` defined twice | `reportCardService.ts` L296 + L377 | Bug |
| 5 | `.env` committed to repository | `guruhub-api/.env` | 🔴 Critical |
| 6 | No `.env.example` files | Both frontend projects | Medium |
| 7 | No root `README.md` | `project/` | Low |
| 8 | Dashboard has no caching | `dashboardService.ts` | Performance |
| 9 | `semester` enum inconsistency: `academic_years` uses Title Case, `report_cards` uses UPPER | Both schemas | Medium |
| 10 | Mobile PWA `README.md` is default Next.js boilerplate | `front-guruhub-mobile/` | Low |

---

## Module Status

| Module | API | Web | Mobile | Notes |
|---|:---:|:---:|:---:|---|
| Authentication | ✅ | ✅ | ✅ | |
| Dashboard | ✅ | ✅ | ✅ | |
| Teachers | ✅ | ✅ | ❌ | |
| Students | ✅ | ✅ | ❌ | |
| Classes | ✅ | ✅ | ❌ | |
| Class Members | ✅ | ✅ | ❌ | |
| Subjects | ✅ | ✅ | ❌ | |
| Academic Years | ✅ | ✅ | ❌ | |
| Schedules | ✅ | ✅ | ❌ read via dashboard | |
| Attendance | ✅ | ✅ | ✅ | |
| Teaching Journals | ✅ | ✅ | ✅ | |
| Assessments | ✅ | ✅ | ✅ | |
| Assessment Categories | ✅ | ✅ | ❌ | |
| Grade Engine | ✅ | ✅ | ❌ | |
| Report Cards | ✅ | ✅ | ❌ | |
| PDF Generator | ✅ | ✅ | ❌ | |
| Import | ✅ | ✅ | ❌ | |
| Student Promotions | ✅ | ✅ | ❌ | |
| Users | ✅ | ✅ | ❌ | |
| Student Discipline | ✅ | ✅ | ✅ | Managed via incidents, supports violations and rewards |
| Extracurriculars | 🟡 schema | ❌ | ❌ | No CRUD module |
| Notifications | 🟡 schema | ❌ | ❌ | No module |
| Student/Parent Portal | ❌ | ❌ | ❌ | Not started |
| Graduation/Transfer | 🟡 partial | ❌ | ❌ | status enum exists, no dedicated module |

---

## File Navigation for Common Tasks

| Task | Read First |
|---|---|
| Adding a new API endpoint | [03_API](03_API.md) + [08_CodingRules](08_CodingRules.md) |
| Adding a new DB column | [02_Database](02_Database.md) + [08_CodingRules](08_CodingRules.md) |
| Fixing an RBAC issue | [04_RBAC](04_RBAC.md) |
| Debugging tenant isolation | [05_MultiTenant](05_MultiTenant.md) |
| Adding a frontend page | [09_ProjectMap](09_ProjectMap.md) + [06_Modules](06_Modules.md) |
| Understanding a module's full stack | [07_DependencyGraph](07_DependencyGraph.md) |
| Understanding data flows | [06_Modules](06_Modules.md) → service methods |
| Running a migration | Run `bunx drizzle-kit generate` then `bunx drizzle-kit migrate` in `guruhub-api/` |

---

## Development Commands

```bash
# Backend
cd guruhub-api
bun run dev                    # Start API on port 8000
bun test                       # Run all integration tests
bun test tests/auth.test.ts    # Run specific test
bunx drizzle-kit generate      # Generate migration from schema changes
bunx drizzle-kit migrate       # Apply pending migrations
bunx drizzle-kit studio        # Visual schema browser

# Web Admin
cd front-guruhub
npm run dev                    # Start on port 3001
npm run build                  # Production build

# Mobile PWA
cd front-guruhub-mobile
npm run dev                    # Start on port 3000
npm run build                  # Production build (generates service worker)
```

---

## Response Protocol for AI Agents

Before generating any code change, state:

1. **Why** this change is needed
2. **Which modules** are affected
3. **Which API endpoints** are affected
4. **Which DB tables** are affected
5. **Which frontend pages** are affected
6. **Security implications** (tenant isolation, RBAC)
7. **Migration required?** Yes/No
8. **Testing strategy**

Then present the implementation plan. Wait for approval before writing code.

---

*This document was generated from live source code on 2026-07-23.*
*Update this file whenever significant architectural changes are made.*
