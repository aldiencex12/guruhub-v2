# 📡 GuruHub API Reference — Dokumentasi Lengkap

Referensi lengkap seluruh endpoint REST API pada platform **GuruHub**.

> **Base URL**: `http://localhost:3000`  
> **Swagger UI**: `http://localhost:3000/swagger`

---

## 📋 Daftar Isi

- [Header Wajib](#header-wajib)
- [Format Response Standar](#format-response-standar)
- [Kode Error HTTP](#kode-error-http)
- [Modul Auth](#modul-auth)
- [Modul Teachers](#modul-teachers)
- [Modul Students](#modul-students)
- [Modul Classes](#modul-classes)
- [Modul Class Members](#modul-class-members)
- [Modul Subjects](#modul-subjects)
- [Modul Schedules](#modul-schedules)
- [Modul Attendance](#modul-attendance)
- [Modul Teaching Journals](#modul-teaching-journals)
- [Modul Assessments](#modul-assessments)
- [Modul Assessment Categories](#modul-assessment-categories)
- [Modul Grade Engine](#modul-grade-engine)
- [Modul Report Cards](#modul-report-cards)
- [Modul Import](#modul-import)
- [Modul PDF Generator](#modul-pdf-generator)
- [Modul Dashboard](#modul-dashboard)

---

## Header Wajib

### Endpoint Publik (tidak perlu token)
```http
POST /auth/login
POST /auth/refresh
POST /auth/logout
```

### Endpoint Terproteksi (wajib)
```http
x-school-id: <ID_SEKOLAH>
Authorization: Bearer <ACCESS_TOKEN>
Content-Type: application/json
```

---

## Format Response Standar

### Sukses
```json
{
  "success": true,
  "message": "Pesan deskriptif",
  "data": { ... }
}
```

### Gagal
```json
{
  "success": false,
  "error": "Pesan error",
  "details": "Detail teknis (opsional)"
}
```

---

## Kode Error HTTP

| Kode | Nama | Kondisi |
|------|------|---------|
| `200` | OK | Request berhasil |
| `201` | Created | Data berhasil dibuat |
| `400` | Bad Request | Input tidak valid / header tidak lengkap |
| `401` | Unauthorized | Token tidak ada / expired |
| `403` | Forbidden | Peran tidak diizinkan / cross-tenant |
| `404` | Not Found | Resource tidak ditemukan |
| `409` | Conflict | Data duplikat |
| `500` | Internal Server Error | Kesalahan server |

---

## Modul Auth

### POST /auth/login
Login dan dapatkan token akses.

**Request Body:**
```json
{
  "schoolId": 1,
  "email": "admin@sekolah.sch.id",
  "password": "GuruHub!2026"
}
```

**Response 200:**
```json
{
  "user": {
    "id": 1,
    "email": "admin@sekolah.sch.id",
    "role": "SchoolAdmin",
    "schoolId": 1
  },
  "accessToken": "eyJhbGci...",
  "refreshToken": "eyJhbGci..."
}
```

**Validasi:**
- `schoolId`: number (wajib)
- `email`: format email valid (wajib)
- `password`: minimal 6 karakter (wajib)

---

### POST /auth/refresh
Perbarui access token menggunakan refresh token (Token Rotation).

**Request Body:**
```json
{
  "refreshToken": "eyJhbGci..."
}
```

**Response 200:**
```json
{
  "accessToken": "eyJhbGci...",
  "refreshToken": "eyJhbGci..."
}
```

---

### POST /auth/logout
Cabut sesi aktif pengguna.

**Request Body:**
```json
{
  "refreshToken": "eyJhbGci..."
}
```

**Response 200:**
```json
{
  "message": "Logout berhasil"
}
```

---

### GET /auth/protected/me
Ambil profil pengguna yang sedang login.

**Headers:** `x-school-id`, `Authorization`

**Response 200:**
```json
{
  "message": "Profil berhasil diambil",
  "user": {
    "id": 1,
    "email": "admin@sekolah.sch.id",
    "role": "SchoolAdmin",
    "schoolId": 1
  },
  "schoolName": "SMA Negeri 1 Jakarta"
}
```

---

## Modul Teachers

**Peran yang diizinkan:** SuperAdmin, SchoolAdmin, Principal

### GET /teachers
Daftar semua guru di sekolah aktif.

**Query Params:** `page`, `limit`, `search`

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "schoolId": 1,
      "userId": 2,
      "nip": "198501012010011001",
      "name": "Budi Santoso, S.Pd",
      "phone": "08123456789",
      "gender": "L",
      "createdAt": "2026-01-01T00:00:00.000Z"
    }
  ],
  "total": 50
}
```

### POST /teachers
Tambah guru baru.

**Request Body:**
```json
{
  "nip": "198501012010011001",
  "name": "Budi Santoso, S.Pd",
  "phone": "08123456789",
  "gender": "L"
}
```

### GET /teachers/:id
Detail guru berdasarkan ID.

### PUT /teachers/:id
Perbarui data guru.

### DELETE /teachers/:id
Hapus guru (soft delete).

---

## Modul Students

**Peran yang diizinkan:** SuperAdmin, SchoolAdmin, Principal

### GET /students
Daftar semua siswa di sekolah aktif.

**Query Params:** `page`, `limit`, `search`, `status`

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "schoolId": 1,
      "nisn": "0012345678",
      "nis": "2526001",
      "name": "Andi Pratama",
      "gender": "L",
      "birthPlace": "Jakarta",
      "birthDate": "2010-05-15",
      "status": "Aktif"
    }
  ]
}
```

### POST /students
Tambah siswa baru.

**Request Body:**
```json
{
  "nisn": "0012345678",
  "nis": "2526001",
  "name": "Andi Pratama",
  "gender": "L",
  "birthPlace": "Jakarta",
  "birthDate": "2010-05-15"
}
```

### GET /students/:id
Detail siswa berdasarkan ID.

### PUT /students/:id
Perbarui data siswa.

### DELETE /students/:id
Hapus siswa (soft delete).

---

## Modul Classes

**Peran yang diizinkan:** SuperAdmin, SchoolAdmin, Principal

### GET /classes
Daftar semua kelas.

**Query Params:** `academicYearId`, `gradeLevel`, `status`

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "schoolId": 1,
      "academicYearId": 1,
      "homeroomTeacherId": 2,
      "name": "X-MIPA-1",
      "gradeLevel": "10",
      "status": "Aktif"
    }
  ]
}
```

### POST /classes
Buat kelas baru.

**Request Body:**
```json
{
  "academicYearId": 1,
  "homeroomTeacherId": 2,
  "name": "X-MIPA-1",
  "gradeLevel": "10"
}
```

### GET /classes/:id
Detail kelas.

### PUT /classes/:id
Perbarui data kelas.

### DELETE /classes/:id
Hapus kelas (soft delete).

---

## Modul Class Members

**Peran yang diizinkan:** SuperAdmin, SchoolAdmin

### GET /class-members
Daftar anggota kelas.

**Query Params:** `classId` (wajib)

### POST /class-members
Tambah siswa ke kelas.

**Request Body:**
```json
{
  "classId": 1,
  "studentId": 5
}
```

### DELETE /class-members/:id
Keluarkan siswa dari kelas.

---

## Modul Subjects

**Peran yang diizinkan:** SuperAdmin, SchoolAdmin

### GET /subjects
Daftar mata pelajaran.

**Query Params:** `gradeLevel`, `status`

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "schoolId": 1,
      "name": "Matematika",
      "code": "MTK-SMA10",
      "gradeLevel": "10",
      "description": "Matematika kelas 10",
      "status": "Aktif"
    }
  ]
}
```

### POST /subjects
Tambah mata pelajaran.

**Request Body:**
```json
{
  "name": "Matematika",
  "code": "MTK-SMA10",
  "gradeLevel": "10",
  "description": "Matematika kelas 10"
}
```

### PUT /subjects/:id
Perbarui mata pelajaran.

### DELETE /subjects/:id
Hapus mata pelajaran (soft delete).

---

## Modul Schedules

**Peran yang diizinkan:** SuperAdmin, SchoolAdmin (write), Teacher (read)

### GET /schedules
Daftar jadwal pelajaran.

**Query Params:** `classId`, `teacherId`, `academicYearId`, `dayOfWeek`

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "schoolId": 1,
      "classId": 1,
      "subjectId": 2,
      "teacherId": 3,
      "academicYearId": 1,
      "dayOfWeek": "Senin",
      "startTime": "07:00:00",
      "endTime": "08:30:00",
      "status": "Aktif"
    }
  ]
}
```

### POST /schedules
Buat jadwal baru.

**Request Body:**
```json
{
  "classId": 1,
  "subjectId": 2,
  "teacherId": 3,
  "academicYearId": 1,
  "dayOfWeek": "Senin",
  "startTime": "07:00",
  "endTime": "08:30"
}
```

### PUT /schedules/:id
Perbarui jadwal.

### DELETE /schedules/:id
Hapus jadwal (soft delete).

---

## Modul Attendance

**Peran yang diizinkan:** Teacher, HomeroomTeacher (write); SchoolAdmin, Principal (read/write)

### GET /attendance
Daftar sesi absensi.

**Query Params:** `scheduleId`, `attendanceDate`, `teacherId`

### POST /attendance
Buat sesi absensi baru dengan detail per siswa.

**Request Body:**
```json
{
  "scheduleId": 1,
  "teacherId": 3,
  "attendanceDate": "2026-06-21",
  "notes": "Pertemuan ke-12",
  "details": [
    { "studentId": 1, "status": "PRESENT", "notes": "" },
    { "studentId": 2, "status": "SICK", "notes": "Sakit demam" },
    { "studentId": 3, "status": "ABSENT", "notes": "" }
  ]
}
```

**Status Absensi:**
| Nilai | Keterangan |
|-------|------------|
| `PRESENT` | Hadir |
| `SICK` | Sakit (ada surat) |
| `PERMISSION` | Izin |
| `ABSENT` | Alfa (tanpa keterangan) |

### GET /attendance/:id
Detail sesi absensi beserta daftar siswa.

### PUT /attendance/:id
Perbarui sesi absensi.

### DELETE /attendance/:id
Hapus sesi absensi (soft delete).

---

## Modul Teaching Journals

**Peran yang diizinkan:** Teacher (write own), SchoolAdmin, Principal (read all)

### GET /teaching-journals
Daftar jurnal mengajar.

**Query Params:** `teacherId`, `scheduleId`, `startDate`, `endDate`

### POST /teaching-journals
Buat jurnal mengajar baru.

**Request Body:**
```json
{
  "scheduleId": 1,
  "teacherId": 3,
  "attendanceId": 5,
  "journalDate": "2026-06-21",
  "topic": "Limit dan Kekontinuan Fungsi",
  "learningObjectives": "Siswa mampu menghitung limit fungsi aljabar",
  "teachingMethod": "Ceramah, Diskusi Kelompok, Latihan Soal",
  "reflection": "Siswa aktif bertanya, materi tersampaikan 90%",
  "notes": "PR halaman 45 nomor 1-10"
}
```

### GET /teaching-journals/:id
Detail jurnal mengajar.

### PUT /teaching-journals/:id
Perbarui jurnal mengajar.

### DELETE /teaching-journals/:id
Hapus jurnal (soft delete).

---

## Modul Assessments

**Peran yang diizinkan:** Teacher (write own), SchoolAdmin, Principal (read all)

### GET /assessments
Daftar penilaian.

**Query Params:** `classId`, `subjectId`, `teacherId`, `academicYearId`, `assessmentType`

### POST /assessments
Buat penilaian baru beserta skor siswa.

**Request Body:**
```json
{
  "classId": 1,
  "subjectId": 2,
  "teacherId": 3,
  "academicYearId": 1,
  "categoryId": 1,
  "title": "Ulangan Harian Bab 3",
  "description": "Materi limit fungsi",
  "assessmentType": "DAILY_TEST",
  "assessmentDate": "2026-06-21",
  "maxScore": 100,
  "scores": [
    { "studentId": 1, "score": 85, "notes": "Baik" },
    { "studentId": 2, "score": 72, "notes": "" }
  ]
}
```

**Tipe Penilaian:**
| Nilai | Keterangan |
|-------|------------|
| `DAILY_TEST` | Ulangan Harian |
| `ASSIGNMENT` | Tugas |
| `PROJECT` | Proyek |
| `PRACTICAL` | Praktik |
| `MIDTERM` | UTS / PTS |
| `FINAL` | UAS / PAS |

### GET /assessments/:id
Detail penilaian beserta skor seluruh siswa.

### PUT /assessments/:id
Perbarui data penilaian.

### DELETE /assessments/:id
Hapus penilaian (soft delete).

---

## Modul Assessment Categories

**Peran yang diizinkan:** SchoolAdmin, Principal

### GET /assessment-categories
Daftar kategori & bobot penilaian sekolah.

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "schoolId": 1,
      "name": "Tugas",
      "weight": 20,
      "description": "Nilai tugas harian",
      "isActive": true
    },
    {
      "id": 2,
      "schoolId": 1,
      "name": "Ulangan Harian",
      "weight": 30,
      "description": "Penilaian harian",
      "isActive": true
    }
  ]
}
```

### POST /assessment-categories
Buat kategori baru.

**Request Body:**
```json
{
  "name": "Tugas",
  "weight": 20,
  "description": "Nilai tugas harian"
}
```

> ⚠️ Total bobot semua kategori aktif harus = 100%

### PUT /assessment-categories/:id
Perbarui kategori.

### DELETE /assessment-categories/:id
Hapus kategori.

---

## Modul Grade Engine

**Peran yang diizinkan:** SuperAdmin, SchoolAdmin, Principal, Teacher

### POST /grade-engine/calculate
Hitung nilai akhir satu siswa untuk satu mata pelajaran.

**Rumus:**
```
Nilai Akhir = Σ (Rata-rata nilai per kategori × Bobot kategori / 100)
```

**Request Body:**
```json
{
  "studentId": 1,
  "subjectId": 2,
  "academicYearId": 1
}
```

**Response 200:**
```json
{
  "success": true,
  "message": "Perhitungan nilai akhir siswa berhasil",
  "data": {
    "finalScore": 87.85,
    "gradeLetter": "B"
  }
}
```

### POST /grade-engine/calculate-class
Hitung nilai akhir seluruh siswa dalam satu kelas.

**Request Body:**
```json
{
  "classId": 1,
  "subjectId": 2,
  "academicYearId": 1
}
```

### GET /grade-engine/student/:studentId
Ambil nilai akhir tersimpan.

**Query Params:** `subjectId` (wajib), `academicYearId` (wajib)

**Tabel Konversi Huruf Mutu:**

| Rentang Nilai | Huruf Mutu |
|:---:|:---:|
| 90.00 – 100.00 | **A** |
| 80.00 – 89.99 | **B** |
| 70.00 – 79.99 | **C** |
| < 70.00 | **D** |

---

## Modul Report Cards

**Peran yang diizinkan:** SchoolAdmin, HomeroomTeacher, Principal

### GET /report-cards
Daftar rapor.

**Query Params:** `classId`, `academicYearId`, `semester`, `status`

### POST /report-cards
Buat rapor baru (status DRAFT).

**Request Body:**
```json
{
  "studentId": 1,
  "classId": 1,
  "academicYearId": 1,
  "semester": "GANJIL",
  "homeroomTeacherNotes": "Siswa menunjukkan perkembangan yang baik"
}
```

**Status Rapor:**
| Nilai | Keterangan |
|-------|------------|
| `DRAFT` | Masih dalam penyusunan |
| `PUBLISHED` | Rapor final, dapat diakses siswa |

### GET /report-cards/:id
Detail rapor lengkap (termasuk nilai per mapel, absensi, ekskul, prestasi, P5).

### PUT /report-cards/:id
Perbarui rapor (termasuk update status ke PUBLISHED).

### DELETE /report-cards/:id
Hapus rapor (soft delete, hanya status DRAFT).

---

## Modul Import

**Peran yang diizinkan:** SchoolAdmin

### POST /import/teachers
Impor data guru massal dari file Excel (.xlsx).

**Request:** `multipart/form-data`
- `file`: file XLSX

**Format kolom Excel:**
| Kolom | Tipe | Contoh |
|-------|------|--------|
| nip | Text | 198501012010011001 |
| name | Text | Budi Santoso |
| phone | Text | 08123456789 |
| gender | L/P | L |

**Response 200:**
```json
{
  "success": true,
  "message": "Import selesai",
  "data": {
    "imported": 45,
    "skipped": 2,
    "errors": [
      { "row": 3, "reason": "NIP sudah terdaftar" }
    ]
  }
}
```

### POST /import/students
Impor data siswa massal dari file Excel.

**Format kolom Excel:**
| Kolom | Tipe | Contoh |
|-------|------|--------|
| nisn | Text | 0012345678 |
| nis | Text | 2526001 |
| name | Text | Andi Pratama |
| gender | L/P | L |
| birthPlace | Text | Jakarta |
| birthDate | YYYY-MM-DD | 2010-05-15 |

### POST /import/scores
Impor nilai siswa massal.

---

## Modul PDF Generator

**Peran yang diizinkan:** SchoolAdmin, HomeroomTeacher, Principal

### GET /pdf-generator/report-card/:reportCardId
Generate dan download rapor dalam format PDF.

**Response:** File PDF (Content-Type: `application/pdf`)

**Fitur PDF:**
- Kop surat sekolah
- Data identitas siswa
- Tabel nilai per mata pelajaran (dengan huruf mutu)
- Rekap absensi semester
- Daftar ekstrakulikuler
- Prestasi siswa
- Proyek P5 (Profil Pelajar Pancasila)
- Catatan wali kelas
- Tanda tangan digital

---

## Modul Dashboard

**Peran yang diizinkan:** SuperAdmin, SchoolAdmin, Principal

### GET /dashboard/summary
Ringkasan statistik akademik sekolah.

**Response 200:**
```json
{
  "success": true,
  "data": {
    "totalTeachers": 52,
    "totalStudents": 850,
    "totalClasses": 24,
    "activeAcademicYear": {
      "id": 1,
      "year": "2025/2026",
      "semester": "Ganjil"
    },
    "attendanceSummary": {
      "today": {
        "present": 820,
        "absent": 15,
        "sick": 10,
        "permission": 5
      }
    },
    "assessmentCount": 248,
    "reportCardsPublished": 0
  }
}
```

### GET /dashboard/attendance-stats
Statistik absensi dalam rentang waktu tertentu.

**Query Params:** `startDate`, `endDate`, `classId`

### GET /dashboard/grade-stats
Statistik distribusi nilai per mata pelajaran.

**Query Params:** `academicYearId`, `classId`, `subjectId`

---

## 🔒 Matriks Akses Per Peran

| Operasi | SuperAdmin | SchoolAdmin | Principal | Teacher | HomeroomTeacher | Student |
|---------|:---:|:---:|:---:|:---:|:---:|:---:|
| Tambah/Edit Guru | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Tambah/Edit Siswa | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Kelola Kelas | ✅ | ✅ | 👁️ | ❌ | ❌ | ❌ |
| Buat Jadwal | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Input Absensi | ✅ | ✅ | ❌ | ✅ | ✅ | ❌ |
| Input Penilaian | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| Hitung Nilai Akhir | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Kelola Rapor | ✅ | ✅ | 👁️ | ❌ | ✅ | ❌ |
| Lihat Rapor | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Import Excel | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Dashboard | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |

**Keterangan:** ✅ = Penuh | 👁️ = Read Only | ❌ = Tidak bisa akses

---

*GuruHub API Reference — Versi 1.0.0 | Juni 2026*
