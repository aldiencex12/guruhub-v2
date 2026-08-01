# 69 — Happy Path & Error Path Analysis Specification

## Module: Student Character & Discipline Management
**Author:** Chief Product Designer & UX Architect  
**Status:** DRAFT (Sprint 2.9)  
**Date:** 2026-07-25  

---

## 1. Incident Verification Workflow Analysis

### 1.1 Happy Path
1. BK Staff opens pending incident.
2. Selects "VERIFY INCIDENT".
3. Inputs optional notes.
4. Clicks "Confirm Verification".
5. Backend updates status to `VERIFIED`, increments points, triggers auto-sanction check.
6. Toast notification displays `"Inciden berhasil diverifikasi. Poin siswa diperbarui (+5 Poin)"`.

### 1.2 Error Path
1. **Network Disruption during Submit:** API call fails due to timeout -> UI catches error -> Rolls back optimistic badge to `PENDING` -> Displays error banner: *"Gagal terhubung ke server. Silakan coba lagi."* with a "Retry" button.
2. **Concurrent Modification Collision:** Another BK staff already rejected the incident -> Server returns HTTP 409 Conflict -> UI displays alert: *"Insiden ini telah ditolak oleh Ibu Ani 2 menit yang lalu"* and refreshes page data.

### 1.3 Edge Cases
- **Deleted Student Record:** Tagged student soft-deleted between report creation and verification -> System alerts BK: *"Siswa ini sudah tidak aktif/dikeluarkan. Verifikasi dibatalkan."*
- **Attachment Storage Outage:** S3 bucket unreachable when loading evidence photo -> UI renders fallback placeholder image with retry trigger.
