# 61 — Violation Categories & Types Functional Feature Specification

## Module: Student Character & Discipline Management
**Author:** Chief Product Architect  
**Status:** DRAFT (Sprint 2.8)  
**Date:** 2026-07-25  

---

## 1. Business Goal
Standardize school discipline rules by establishing structured violation categories (Kerapian, Kedisiplinan, Moril) and specific violation types with assigned default demerit points and severity levels.

---

## 2. User Personas & Permissions (RBAC Matrix)

| User Persona | Create Category/Type | Edit Category/Type | Archive Rule | View Master Rules |
| :--- | :---: | :---: | :---: | :---: |
| **Super Admin** | ✅ | ✅ | ✅ | ✅ |
| **School Admin** | ✅ | ✅ | ✅ | ✅ |
| **Principal** | ❌ | ❌ | ❌ | ✅ |
| **Guru BK** | ❌ | ❌ | ❌ | ✅ |
| **Homeroom Teacher** | ❌ | ❌ | ❌ | ✅ |
| **Teacher** | ❌ | ❌ | ❌ | ✅ |

---

## 3. Navigation & Screen Layout
- **Path:** `/discipline/categories` and `/discipline/types`
- **Layout:** Master Data Table layout with search header, inline drawer for creation/editing, archive toggle.

---

## 4. Comprehensive Feature Specifications

- **Widget Breakdown:** Category cards, severity badges (`RINGAN`, `SEDANG`, `BERAT`, `SANGAT_BERAT`), default point preview badge, quick search input.
- **User Flow:** Admin opens `/discipline/types` -> Clicks "+ Tambah Jenis Pelanggaran" -> Inputs code, name, category, severity, default points -> Saves -> Available instantly in incident reporting dropdowns.
- **CRUD Operations:** Create (POST), Read (GET paginated list), Update (PUT), Archive/Soft Delete (DELETE).
- **Validation Rules:**
  - `code`: Unique string within school (e.g., `VIOL-001`).
  - `name`: Min 3 chars, max 255.
  - `defaultPoints`: Non-negative integer (1 - 100).
- **Search, Filters, Sorting, Pagination:** Text search by name/code, filter by category or severity, sort by code `ASC`, paginated list.
- **States:**
  - *Empty State:* "Belum ada jenis pelanggaran yang dikonfigurasi."
  - *Loading State:* Shimmer table.
  - *Error State:* Error toast alert on duplicate code constraint violation.
- **Notifications:** Success toast when category/type is saved or archived.
- **Export & Import:** Export master rules to CSV; import standardized school rule templates.
- **Attachments:** None.
- **Mobile Behaviour:** Mobile card stack with expandable detail drawer.
- **Accessibility:** Full ARIA label support for form fields and table action buttons.
- **Audit Logging:** Logs `CREATE_TYPE` and `UPDATE_TYPE` in `discipline_audit_logs`.
- **Performance:** Cached in Redis (`discipline:types:{schoolId}`, TTL 24h).
- **Future Expansion:** School-wide rule customization presets for different academic programs.
