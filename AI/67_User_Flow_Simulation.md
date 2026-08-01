# 67 — End-to-End User Flow Simulation Specification

## Module: Student Character & Discipline Management
**Author:** Chief Product Designer & UX Architect  
**Status:** DRAFT (Sprint 2.9)  
**Date:** 2026-07-25  

---

## 1. Primary User Journey Simulation (Teacher Report -> BK Verification -> Sanction Issue -> Parent Alert)

```
[Teacher Mobile PWA] ──► Report Incident ──► [Server Database] ──► Event: IncidentCreated
                                                                          │
                                                                          ▼
[Parent WhatsApp Alert] ◄── [Queue Worker] ◄── Event: SanctionGenerated ◄── [BK Web Admin Verify]
```

### 1.1 Step-by-Step Simulation Flow

1. **Step 1: Incident Capture (Teacher - Mobile PWA)**
   - *Action:* Pak Budi (Teacher) notices student Budi Santoso (10-A) arriving 20 mins late.
   - *UI Interaction:* Tap "+ Laporkan Violasi" -> Scan Student QR / Search NISN -> Select "Terlambat Masuk (> 15 mnt)" -> Take photo of gate -> Tap "Kirim Laporan".
   - *System Response:* Instant offline optimistic feedback ("Laporan Terkirim (Pending Verification)").

2. **Step 2: Case Investigation & Verification (Guru BK - Web Admin)**
   - *Action:* Ibu Susi (Guru BK) opens `/discipline/dashboard` on her desktop.
   - *UI Interaction:* Pending Queue badge shows `(1) New`. Ibu Susi clicks "Review" -> Inspects photo evidence -> Clicks "VERIFY INCIDENT" -> Types note: *"Siswa dipanggil, terlambat karena ban bocor tetapi tetap diberi poin demerit +5 sesuai aturan"*.
   - *System Response:* Incident status transitions `PENDING -> VERIFIED`. Student active demerit points increment by +5 (Total: 25).

3. **Step 3: Threshold Auto-Trigger & Sanction Generation (System Engine)**
   - *Action:* Auto-Sanction Engine detects Budi Santoso's active points crossed 25 (SP-1 threshold).
   - *System Response:* Generates `discipline_sanction_logs` record (`SP-1`, Status: `ACTIVE`) and dispatches `SanctionGeneratedEvent`.

4. **Step 4: Parent Multi-Channel Notification (Background Worker)**
   - *Action:* Notification Worker digests `SanctionGeneratedEvent`.
   - *System Response:* Sends instant WhatsApp message to Budi's parent with a link to view the signed SP-1 PDF letter in Parent Portal.
