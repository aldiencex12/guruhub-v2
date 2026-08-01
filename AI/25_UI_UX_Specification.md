# 25 — UI/UX Specification

## Module Name: Student Character & Discipline Management
**Author:** Lead Software Architect  
**Status:** DRAFT (Sprint 0)  
**Date:** 2026-07-25  

---

## 1. User Interface Overview

The UI/UX for the Student Character & Discipline Management module is divided into two primary frontends matching the GuruHub architecture:
1. **Web Admin Dashboard (`front-guruhub`)**: Detailed, desktop-optimized view for School Admins, Principals, and Counseling Teachers (Guru BK) to manage configuration, review pending reports, and trace history.
2. **Mobile PWA (`front-guruhub-mobile`)**: Lightweight, light-mode-enforced interface optimized for teachers to record violations and achievements on the spot.

---

## 2. Screen Flow Maps

### 2.1 Web Admin Dashboard (Guru BK / Admin)
```
[Sidebar Navigation]
       │
       ├──► [Discipline Configuration] ──► (Edit Rules / Point Cycles / Thresholds)
       │
       ├──► [Incident Review Queue] ───► [Incident Detail Dialog]
       │                                          │
       │                                          ├──► [Verify & Apply Points]
       │                                          └──► [Reject with Note]
       │
       └──► [Student Behavior List] ───► [Student Behavior Profile & Timeline]
                                                  │
                                                  └──► [Issue Manual Sanction]
```

### 2.2 Mobile PWA (Teacher / Reporter)
```
[Bottom Navigation: "Disiplin"]
       │
       └──► [Discipline Hub / Dashboard]
                   │
                   └──► [Laporkan Insiden Form]
                             │
                             ├──► [1. Select Students (Search & Tag)]
                             ├──► [2. Select Violations/Rewards]
                             ├──► [3. Upload Photo Evidence]
                             └──► [4. Add Description & Submit]
```

---

## 3. Wireframes (Markdown & Text-Based)

### 3.1 Web Admin: Incident Review Queue
A desktop interface for Guru BK to review logged incidents.

```
+-----------------------------------------------------------------------------------------+
| GuruHub | Dashboard | Akademik | Disiplin | BK Portal                          [Wali] |
+-----------------------------------------------------------------------------------------+
| BK Portal > Antrean Verifikasi Laporan                                                  |
|                                                                                         |
|  [ Cari Laporan... ]  Status: [ Semua v ]  Kategori: [ Pelanggaran v ]  [ Tombol Ekspor ] |
|                                                                                         |
|  +------------------------------------------------------------------------------------+  |
|  | Tanggal    | Pelapor         | Siswa            | Pelanggaran / Penghargaan | Aksi |  |
|  +------------+-----------------+------------------+---------------------------+------+  |
|  | 25-07-2026 | Budi S. (Guru)  | Aditya Pratama   | Terlambat Masuk (5 pts)   | [Lihat]|  |
|  | 24-07-2026 | Ani W. (Guru)   | Siti Aminah      | Menang Olimpiade (-20 pts)| [Lihat]|  |
|  | 24-07-2026 | Joko S. (Guru)  | Bambang Pamungkas| Seragam Tidak Rapi (2 pts) | [Lihat]|  |
|  +------------------------------------------------------------------------------------+  |
|  | Halaman: < 1 [2] 3 >                                       Total Data: 45 Laporan  |  |
|  +------------------------------------------------------------------------------------+  |
+-----------------------------------------------------------------------------------------+
```

### 3.2 Web Admin: Incident Detail Dialog (Pop-up)
```
+--------------------------------------------------------------------+
| Detail Laporan Insiden #42                                     [X] |
+--------------------------------------------------------------------+
| Pelapor  : Budi Santoso (Guru MTK)                                 |
| Tanggal  : 25 Juli 2026, 07:15 WIB                                 |
| Lokasi   : Gerbang Utama Sekolah                                   |
|                                                                    |
| Siswa Terlibat:                                                    |
| - Aditya Pratama (Kelas X-MIPA-1)                                  |
|   Aturan: Terlambat Masuk Sekolah (Default: 5 Poin)                |
|                                                                    |
| Catatan Kejadian:                                                  |
| "Siswa datang terlambat 15 menit karena ban sepeda bocor."         |
|                                                                    |
| Bukti Foto:                                                        |
| +-------------------------+                                        |
| | [ Foto Ban Bocor ]      |                                        |
| +-------------------------+                                        |
|                                                                    |
| Tindakan Guru BK:                                                  |
| [ Catatan tambahan peninjauan...                         ]         |
|                                                                    |
| [ Tolak Laporan (Merah) ]             [ Verifikasi & Terapkan (Biru) ] |
+--------------------------------------------------------------------+
```

### 3.3 Mobile PWA: Report Incident Form
Optimized for mobile viewports, single-handed operation.

```
+---------------------------------------+
| ◄ Kembali            Laporkan Insiden |
+---------------------------------------+
| 1. Siswa Terlibat                     |
|    [ Cari nama siswa...           ]   |
|    Tags: [ Aditya Pratama X ]         |
|                                       |
| 2. Jenis Kejadian                     |
|    ( ) Pelanggaran    ( ) Penghargaan |
|    Aturan: [ Pilih Pelanggaran...  v ]|
|    Selected: Terlambat Masuk (5 pts)  |
|                                       |
| 3. Detail Kejadian                    |
|    Tanggal : [ 2026-07-25 ]           |
|    Lokasi  : [ Gerbang Depan  ]       |
|    Catatan : [ Terlambat 15 menit... ]|
|                                       |
| 4. Bukti Pendukung                    |
|    [ + Ambil Foto / Upload File ]     |
|                                       |
| +-----------------------------------+ |
| |        Kirim Laporan BK           | |
| +-----------------------------------+ |
+---------------------------------------+
|  [Home]   [Absen]   [Nilai]   [*Disiplin*] |
+---------------------------------------+
```

---

## 4. User Journeys & Step-by-Step Walkthroughs

### 4.1 Reporting a Violation on Mobile (Teacher)
1. Teacher logs into GuruHub Mobile PWA and taps the **Disiplin** tab.
2. Taps **Laporkan Kejadian** button.
3. Type "Aditya" in the student search bar, and tags "Aditya Pratama".
4. Selects **Pelanggaran** and picks "Terlambat Masuk Sekolah".
5. Inputs optional location and description notes.
6. Taps **Ambil Foto**, uses the smartphone camera to snap a photo of the gate, and uploads it.
7. Taps **Kirim Laporan BK**. The incident is successfully submitted, transitioning to a `PENDING` state.

### 4.2 Reviewing and Approving a Report (Guru BK)
1. Counseling Teacher (Guru BK) logs into Web Admin and navigates to the **BK Portal -> Antrean Verifikasi**.
2. Finds the pending incident report #42, and clicks **Lihat Detail**.
3. Reviews the description, students, and photo proof.
4. Optionally writes a review note: "Siswa dinasihati secara lisan".
5. Clicks **Verifikasi & Terapkan**.
6. The system sets the status to `VERIFIED`, captures a `point_snapshot`, applies the points to Aditya's cumulative active points balance, and runs the automated sanction threshold check.

---

## 5. UI/UX Rules & Accessibility

- **Consistency**: All forms must show inline error validations when required inputs are missing or incorrect.
- **Micro-interactions**: Success alerts and warning popups must use proper Bahasa Indonesia text.
- **Performance**: Tables must support paginated loading and filter updates without requiring full page refreshes.
- **Responsiveness**: Mobile PWA layouts must adjust to fit narrow portrait screens, wrapping long names or codes logically to avoid horizontal scrolling.
- **Contrasts**: Warning buttons and alerts must be clearly visible, using standard accessibility contrast ratios.
