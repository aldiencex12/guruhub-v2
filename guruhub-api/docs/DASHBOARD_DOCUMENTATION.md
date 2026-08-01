# Dokumentasi Modul Dashboard & Analytics GuruHub

Modul ini menyajikan data statistik real-time sekolah, absensi, jurnal mengajar, asesmen, nilai siswa, dan rapor untuk Kepala Sekolah, Admin, dan Guru secara performan dan terisolasi per tenant.

---

## 1. API Documentation

Setiap request wajib menyertakan header:
*   `x-school-id`: ID Sekolah (Tenant)
*   `Authorization`: `Bearer <accessToken>`

### 1. GET `/dashboard/summary`
Mengambil ringkasan data statistik dasar sekolah.
*   **Hak Akses**: `SuperAdmin`, `SchoolAdmin`, `Principal` (seluruh sekolah), `Teacher` / `HomeroomTeacher` (hanya data miliknya).
*   **Response (Admin/Principal)**:
    ```json
    {
      "success": true,
      "message": "Sekolah summary berhasil diambil",
      "data": {
        "totalStudents": 120,
        "totalTeachers": 15,
        "totalClasses": 8,
        "totalSubjects": 12,
        "totalSchedules": 32
      }
    }
    ```
*   **Response (Teacher)**:
    ```json
    {
      "success": true,
      "message": "Sekolah summary berhasil diambil",
      "data": {
        "totalStudents": 40, // Siswa aktif di kelas yang diajar
        "totalTeachers": 1,  // Dirinya sendiri
        "totalClasses": 2,   // Kelas yang diajar
        "totalSubjects": 1,  // Mapel yang diajar
        "totalSchedules": 4  // Jadwal yang diajar
      }
    }
    ```

### 2. GET `/dashboard/attendance`
Mengambil ringkasan kehadiran siswa hari ini.
*   **Hak Akses**: `SuperAdmin`, `SchoolAdmin`, `Principal`, `Teacher`, `HomeroomTeacher`.
*   **Response**:
    ```json
    {
      "success": true,
      "message": "Absensi summary berhasil diambil",
      "data": {
        "hadirHariIni": 95,
        "sakitHariIni": 3,
        "izinHariIni": 2,
        "alfaHariIni": 0
      }
    }
    ```

### 3. GET `/dashboard/journals`
Mengambil statistik pengisian jurnal mengajar hari ini.
*   **Hak Akses**: `SuperAdmin`, `SchoolAdmin`, `Principal`, `Teacher`, `HomeroomTeacher`.
*   **Response**:
    ```json
    {
      "success": true,
      "message": "Jurnal mengajar summary berhasil diambil",
      "data": {
        "jurnalHariIni": 5,
        "guruSudahMengisi": 4,
        "guruBelumMengisi": 1
      }
    }
    ```

### 4. GET `/dashboard/assessments`
Mengambil statistik pembentukan asesmen (tugas/ulangan/projek) minggu ini, bulan ini, dan total keseluruhan.
*   **Hak Akses**: `SuperAdmin`, `SchoolAdmin`, `Principal`, `Teacher`, `HomeroomTeacher`.
*   **Response**:
    ```json
    {
      "success": true,
      "message": "Asesmen summary berhasil diambil",
      "data": {
        "totalAssessment": 18,
        "assessmentBulanIni": 10,
        "assessmentMingguIni": 3
      }
    }
    ```

### 5. GET `/dashboard/grades`
Mengambil performa akademik siswa berdasarkan rata-rata nilai rapor.
*   **Hak Akses**: `SuperAdmin`, `SchoolAdmin`, `Principal`, `Teacher`, `HomeroomTeacher`.
*   **Response**:
    ```json
    {
      "success": true,
      "message": "Nilai akhir summary berhasil diambil",
      "data": {
        "rataRataSekolah": 82.45,
        "rataRataPerKelas": [
          { "classId": 1, "className": "7A", "averageScore": 84.12 },
          { "classId": 2, "className": "7B", "averageScore": 80.78 }
        ],
        "rataRataPerMapel": [
          { "subjectId": 1, "subjectName": "Matematika", "averageScore": 79.50 },
          { "subjectId": 2, "subjectName": "IPA", "averageScore": 85.40 }
        ]
      }
    }
    ```

### 6. GET `/dashboard/report-cards`
Mengambil status pengerjaan rapor.
*   **Hak Akses**: `SuperAdmin`, `SchoolAdmin`, `Principal`, `Teacher`, `HomeroomTeacher`.
*   **Response**:
    ```json
    {
      "success": true,
      "message": "Rapor summary berhasil diambil",
      "data": {
        "totalDraft": 42,
        "totalPublished": 8
      }
    }
    ```

---

## 2. Query Strategy & Optimizations

*   **Promise.all()**: Pengambilan data statistik dasar dilakukan secara paralel untuk mengurangi latency keseluruhan.
*   **SQL Aggregate Functions**: Operasi perhitungan dilakukan langsung di database menggunakan fungsi agregasi bawaan (`COUNT`, `AVG`, `GROUP BY`) guna meminimalkan pengiriman data mentah dari database ke aplikasi backend.
*   **Tenant Isolation**: Semua query menyertakan filter `schoolId = currentTenant` untuk menjamin keamanan multi-tenant, dan `deletedAt IS NULL` untuk mematuhi regulasi *Soft Delete*.

---

## 3. Testing Guide

Jalankan test suite terintegrasi untuk modul dashboard dengan perintah:

```bash
bun test tests/dashboard.test.ts
```

Test suite ini memvalidasi:
1.  Kebenaran agregasi statistik dasar, absensi, jurnal, asesmen, nilai, dan rapor.
2.  Isolasi multi-tenant (Admin dari Sekolah A tidak boleh melihat statistik Sekolah B).
3.  Pembatasan hak akses guru (Guru hanya melihat statistik siswa/kelas/mata pelajaran yang mereka ajar sendiri).
4.  Penolakan hak akses penuh bagi peran Siswa (`403 Forbidden`).
