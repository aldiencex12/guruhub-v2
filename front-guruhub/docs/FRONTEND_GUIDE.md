# 🖥️ GuruHub — Panduan Pengembangan Frontend

Buat aplikasi **guruhub** dengan fokus utama pada **UI/UX frontend terlebih dahulu** menggunakan:

🏗️ Tech Stack

Gunakan stack berikut:

Next.js 15 (App Router)
TypeScript
TailwindCSS v4
shadcn/ui
Zustand
React Hook Form
Zod
TanStack Table
TanStack Query (persiapan integrasi API)
Lucide Icons
Recharts
Sonner Toast
Framer Motion
🎨 Design System

Tema desain:

Modern SaaS Dashboard
Clean & Professional
Academic Management System
Enterprise Ready

Referensi visual:

Linear
Notion
Stripe Dashboard
Vercel Dashboard
Clerk Dashboard

Prinsip desain:

Minimal clutter
Mobile first
Fast interaction
Accessibility friendly
Consistent spacing
Consistent typography
Reusable component driven

Penting:

* Fokus hanya frontend & tampilan UI
* Jangan integrasi database dulu
* Jangan setup backend API dulu
* Jangan setup authentication dulu
* Gunakan dummy/mock data
* Struktur project tetap scalable untuk future development

Dokumen ini adalah **garis besar** untuk membangun antarmuka (frontend) platform **GuruHub**. Berisi daftar halaman, kebutuhan data dari API, struktur navigasi, dan catatan penting per modul.

> **Base URL API**: `http://localhost:3000`
> **Swagger**: `http://localhost:3000/swagger`

---

## 📋 Daftar Isi

1. [Autentikasi & Session](#1-autentikasi--session)
2. [Struktur Navigasi](#2-struktur-navigasi)
3. [Halaman Per Modul](#3-halaman-per-modul)
4. [Peran & Hak Akses Halaman](#4-peran--hak-akses-halaman)
5. [Pola Request API](#5-pola-request-api)
6. [Referensi Enum & Konstanta](#6-referensi-enum--konstanta)

---

## 1. Autentikasi & Session

### Alur Login

```
User input schoolId + email + password
  → POST /auth/login
  → Simpan { accessToken, refreshToken, user } di localStorage/cookie
  → Redirect ke /dashboard
```

### Header Wajib (setiap request ke API)

```js
headers: {
  "Content-Type": "application/json",
  "x-school-id": schoolId,          // Dari session login
  "Authorization": `Bearer ${accessToken}`
}
```

### Refresh Token (saat 401)

```
Interceptor: Jika response 401
  → POST /auth/refresh { refreshToken }
  → Simpan token baru
  → Ulangi request sebelumnya
```

### Endpoint Auth

| Method | URL                  | Kegunaan              |
| ------ | -------------------- | --------------------- |
| `POST` | `/auth/login`        | Login                 |
| `POST` | `/auth/refresh`      | Perbarui access token |
| `POST` | `/auth/logout`       | Logout                |
| `GET`  | `/auth/protected/me` | Profil user aktif     |

### Data User (disimpan di state global)

```ts
interface CurrentUser {
  id: number;
  email: string;
  role: "SuperAdmin" | "SchoolAdmin" | "Principal" | "Teacher" | "HomeroomTeacher" | "Student";
  schoolId: number;
  schoolName: string;
}
```

📱 Responsive Requirement

Aplikasi wajib mendukung:

Device	Width
Mobile	< 768px
Tablet	768px - 1024px
Desktop	> 1024px

Semua halaman harus memiliki:

Responsive Sidebar
Mobile Drawer Navigation
Sticky Header
Loading Skeleton
Empty State
Error State

---

## 2. Struktur Navigasi

### Sidebar Menu (sesuai peran)

```
📊 Dashboard              → /dashboard
👥 Data Master
   ├── Guru               → /teachers
   ├── Siswa              → /students
   └── Mata Pelajaran     → /subjects
🏫 Akademik
   ├── Kelas              → /classes
   ├── Anggota Kelas      → /class-members
   ├── Jadwal             → /schedules
   ├── Absensi            → /attendance
   ├── Jurnal Mengajar    → /teaching-journals
   └── Penilaian          → /assessments
📈 Laporan
   ├── Kategori Nilai     → /assessment-categories
   ├── Kalkulasi Nilai    → /grade-engine
   └── Rapor              → /report-cards
⚙️ Tools
   ├── Import Excel       → /import
   └── Cetak PDF          → (button di halaman rapor)
```

### Visibilitas Menu Per Peran

| Menu                 | SuperAdmin | SchoolAdmin | Principal | Teacher | HomeroomTeacher |
| -------------------- | :--------: | :---------: | :-------: | :-----: | :-------------: |
| Dashboard            |      ✅     |      ✅      |     ✅     |    ❌    |        ❌        |
| Guru / Siswa / Mapel |      ✅     |      ✅      |    👁️    |    ❌    |        ❌        |
| Kelas & Jadwal       |      ✅     |      ✅      |    👁️    |   👁️   |       👁️       |
| Absensi              |      ✅     |      ✅      |    👁️    |    ✅    |        ✅        |
| Jurnal & Penilaian   |      ✅     |      ✅      |    👁️    |    ✅    |        ❌        |
| Grade Engine & Rapor |      ✅     |      ✅      |    👁️    |    ❌    |        ✅        |
| Import               |      ✅     |      ✅      |     ❌     |    ❌    |        ❌        |

> 👁️ = Read Only    ✅ = Full Access    ❌ = Disembunyikan

---

## 3. Halaman Per Modul

---

### 🔐 Halaman Login (`/login`)

**Komponen form:**

* Input: `schoolId` (number), `email`, `password`
* Tombol: Login

**API:** `POST /auth/login`

**Setelah sukses:** Simpan token → redirect `/dashboard`

---

### 📊 Dashboard (`/dashboard`)

**Data yang ditampilkan:**

* Total guru, siswa, kelas aktif
* Tahun ajaran aktif
* Statistik absensi hari ini

**API:** `GET /dashboard/summary`

---

### 👨‍🏫 Guru (`/teachers`)

**Halaman List:**

* Tabel: Nama, NIP, Gender, Telepon, Aksi
* Filter: Search nama/NIP
* Tombol: + Tambah Guru, Import Excel

**Halaman Form (Tambah/Edit):**

| Field    | Tipe          | Validasi               |
| -------- | ------------- | ---------------------- |
| `nip`    | text          | opsional, maks 18 char |
| `name`   | text          | wajib                  |
| `phone`  | text          | opsional               |
| `gender` | select: L / P | wajib                  |

**API:**

```
GET    /teachers          → list
POST   /teachers          → tambah
GET    /teachers/:id      → detail
PUT    /teachers/:id      → edit
DELETE /teachers/:id      → hapus
```

---

### 👨‍🎓 Siswa (`/students`)

**Halaman List:**

* Tabel: Nama, NISN, NIS, Gender, Status, Aksi
* Filter: Search, Status (Aktif/Nonaktif)
* Tombol: + Tambah Siswa, Import Excel

**Halaman Form:**

| Field        | Tipe                     | Validasi                      |
| ------------ | ------------------------ | ----------------------------- |
| `nisn`       | text                     | wajib, 10 digit unik nasional |
| `nis`        | text                     | wajib, unik per sekolah       |
| `name`       | text                     | wajib                         |
| `gender`     | select: L / P            | wajib                         |
| `birthPlace` | text                     | opsional                      |
| `birthDate`  | date                     | opsional                      |
| `status`     | select: Aktif / Nonaktif | default Aktif                 |

**API:**

```
GET    /students          → list
POST   /students          → tambah
GET    /students/:id      → detail
PUT    /students/:id      → edit
DELETE /students/:id      → hapus
```

---

### 📚 Mata Pelajaran (`/subjects`)

**Halaman List:**

* Tabel: Kode, Nama, Tingkat Kelas, Status

**Halaman Form:**

| Field         | Tipe   | Keterangan        |
| ------------- | ------ | ----------------- |
| `code`        | text   | Contoh: MTK-SMA10 |
| `name`        | text   | Nama mapel        |
| `gradeLevel`  | select | 7–12              |
| `description` | text   | opsional          |

**API:**

```
GET    /subjects
POST   /subjects
GET    /subjects/:id
PUT    /subjects/:id
DELETE /subjects/:id
```

---

### 🏫 Kelas (`/classes`)

**Halaman List:**

* Tabel: Nama Kelas, Tingkat, Wali Kelas, Tahun Ajaran, Status
* Filter: Tahun Ajaran, Tingkat

**Halaman Form:**

| Field               | Tipe                      | Keterangan         |
| ------------------- | ------------------------- | ------------------ |
| `academicYearId`    | select (dari API)         | Tahun ajaran aktif |
| `name`              | text                      | Contoh: X-MIPA-1   |
| `gradeLevel`        | select                    | 7–12               |
| `homeroomTeacherId` | select (dari `/teachers`) | Wali kelas         |

**API:**

```
GET    /classes
POST   /classes
GET    /classes/:id
PUT    /classes/:id
DELETE /classes/:id
```

---

### 👥 Anggota Kelas (`/class-members`)

**Halaman:**

* Pilih kelas dari dropdown
* Tampilkan daftar siswa di kelas tersebut
* Tombol: Tambah Siswa (modal select), Keluarkan Siswa

**API:**

```
GET    /class-members?classId=1    → list anggota
POST   /class-members              → tambah siswa ke kelas
DELETE /class-members/:id          → keluarkan siswa
```

**Request Tambah:**

```json
{ "classId": 1, "studentId": 5 }
```

---

### 🗓️ Jadwal (`/schedules`)

**Halaman List / Grid Mingguan:**

* View grid per hari (Senin–Sabtu) per kelas
* Filter: Kelas, Guru, Tahun Ajaran

**Halaman Form:**

| Field            | Tipe   | Keterangan     |
| ---------------- | ------ | -------------- |
| `classId`        | select | Kelas          |
| `subjectId`      | select | Mata pelajaran |
| `teacherId`      | select | Guru           |
| `academicYearId` | select | Tahun ajaran   |
| `dayOfWeek`      | select | Senin–Minggu   |
| `startTime`      | time   | Format HH:MM   |
| `endTime`        | time   | Format HH:MM   |

**API:**

```
GET    /schedules
POST   /schedules
PUT    /schedules/:id
DELETE /schedules/:id
```

---

### ✅ Absensi (`/attendance`)

**Halaman List:**

* Tabel: Tanggal, Jadwal, Guru, Jumlah Hadir/Sakit/Izin/Alfa

**Halaman Input Absensi (Form Utama):**

1. Pilih Jadwal (dropdown)
2. Pilih Tanggal
3. Tampilkan daftar siswa di kelas tersebut
4. Tiap siswa: toggle status (PRESENT / SICK / PERMISSION / ABSENT)
5. Input catatan per siswa (opsional)

**Request Body:**

```json
{
  "scheduleId": 1,
  "teacherId": 3,
  "attendanceDate": "2026-06-21",
  "notes": "Pertemuan ke-12",
  "details": [
    { "studentId": 1, "status": "PRESENT", "notes": "" },
    { "studentId": 2, "status": "SICK",    "notes": "Sakit demam" }
  ]
}
```

**Status Absensi:**

| Nilai        | Label | Warna Saran |
| ------------ | ----- | ----------- |
| `PRESENT`    | Hadir | Hijau       |
| `SICK`       | Sakit | Kuning      |
| `PERMISSION` | Izin  | Biru        |
| `ABSENT`     | Alfa  | Merah       |

**API:**

```
GET    /attendance
POST   /attendance
GET    /attendance/:id
PUT    /attendance/:id
DELETE /attendance/:id
```

---

### 📓 Jurnal Mengajar (`/teaching-journals`)

**Halaman List:**

* Tabel: Tanggal, Jadwal, Topik, Metode Mengajar
* Filter: Guru, Jadwal, Rentang Tanggal

**Halaman Form:**

| Field                | Tipe     | Keterangan                      |
| -------------------- | -------- | ------------------------------- |
| `scheduleId`         | select   | Jadwal                          |
| `attendanceId`       | select   | Link ke sesi absensi (opsional) |
| `journalDate`        | date     | Tanggal jurnal                  |
| `topic`              | text     | Topik pembahasan                |
| `learningObjectives` | textarea | Tujuan pembelajaran             |
| `teachingMethod`     | text     | Metode (Ceramah, Diskusi, dll)  |
| `reflection`         | textarea | Refleksi mengajar               |
| `notes`              | textarea | Catatan tambahan                |

**API:**

```
GET    /teaching-journals
POST   /teaching-journals
GET    /teaching-journals/:id
PUT    /teaching-journals/:id
DELETE /teaching-journals/:id
```

---

### 📊 Penilaian (`/assessments`)

**Halaman List:**

* Tabel: Judul, Tipe, Mata Pelajaran, Kelas, Tanggal, Maks Skor
* Filter: Kelas, Mapel, Tipe

**Halaman Form Penilaian:**

| Field            | Tipe   | Keterangan          |
| ---------------- | ------ | ------------------- |
| `classId`        | select | Kelas               |
| `subjectId`      | select | Mata pelajaran      |
| `categoryId`     | select | Kategori penilaian  |
| `title`          | text   | Judul penilaian     |
| `assessmentType` | select | Lihat enum di bawah |
| `assessmentDate` | date   | Tanggal pelaksanaan |
| `maxScore`       | number | Nilai maksimal      |

**Tipe Penilaian (enum):**

| Nilai        | Label          |
| ------------ | -------------- |
| `DAILY_TEST` | Ulangan Harian |
| `ASSIGNMENT` | Tugas          |
| `PROJECT`    | Proyek         |
| `PRACTICAL`  | Praktik        |
| `MIDTERM`    | UTS / PTS      |
| `FINAL`      | UAS / PAS      |

**Halaman Input Nilai Siswa:**

* Tabel daftar siswa + kolom input skor (0 – maxScore)
* Kolom catatan per siswa (opsional)

**API:**

```
GET    /assessments
POST   /assessments          (termasuk array scores[])
GET    /assessments/:id
PUT    /assessments/:id
DELETE /assessments/:id
```

---

### ⚖️ Kategori Penilaian (`/assessment-categories`)

**Halaman:**

* Tabel: Nama Kategori, Bobot (%), Status Aktif
* Total bobot harus = 100%
* Tombol: Tambah, Edit, Hapus

| Field         | Tipe    | Keterangan    |
| ------------- | ------- | ------------- |
| `name`        | text    | Nama kategori |
| `weight`      | number  | Bobot dalam % |
| `description` | text    | opsional      |
| `isActive`    | boolean | Aktif/tidak   |

**API:**

```
GET    /assessment-categories
POST   /assessment-categories
PUT    /assessment-categories/:id
DELETE /assessment-categories/:id
```

---

### 🧮 Kalkulasi Nilai Akhir (`/grade-engine`)

**Halaman:**

* Pilih Kelas, Mata Pelajaran, Tahun Ajaran
* Tombol: **Hitung Nilai Semua Siswa**
* Tabel hasil: Nama Siswa | Nilai Akhir | Huruf Mutu

**Tabel Huruf Mutu:**

| Nilai    | Huruf |
| -------- | ----- |
| 90–100   | **A** |
| 80–89.99 | **B** |
| 70–79.99 | **C** |
| < 70     | **D** |

**API:**

```
POST /grade-engine/calculate          → hitung 1 siswa
POST /grade-engine/calculate-class    → hitung 1 kelas
GET  /grade-engine/student/:id?subjectId=&academicYearId=
```

---

### 📄 Rapor (`/report-cards`)

**Halaman List:**

* Filter: Kelas, Semester, Status (DRAFT / PUBLISHED)
* Tabel: Nama Siswa, Semester, Status, Aksi

**Halaman Detail Rapor:**

* Identitas siswa
* Tabel nilai per mata pelajaran + huruf mutu
* Rekap absensi (Sakit / Izin / Alfa)
* Ekstrakulikuler + Prestasi + Proyek P5
* Catatan wali kelas
* Tombol: **Publish Rapor** | **Cetak PDF**

**Status Rapor:**

| Nilai       | Label                       |
| ----------- | --------------------------- |
| `DRAFT`     | Masih disusun               |
| `PUBLISHED` | Final (dapat dicetak siswa) |

**Semester:**

| Nilai    | Label      |
| -------- | ---------- |
| `GANJIL` | Semester 1 |
| `GENAP`  | Semester 2 |

**API:**

```
GET    /report-cards
POST   /report-cards
GET    /report-cards/:id
PUT    /report-cards/:id
DELETE /report-cards/:id

GET    /pdf-generator/report-card/:id   → download PDF
```

---

### 📥 Import Excel (`/import`)

**Halaman:**

* Dua section: Import Guru & Import Siswa
* Upload file `.xlsx`
* Tampilkan hasil: berhasil / dilewati / error per baris

**API:**

```
POST /import/teachers   (multipart/form-data, field: file)
POST /import/students   (multipart/form-data, field: file)
```

---

## 4. Peran & Hak Akses Halaman

| Route / Halaman          | SuperAdmin | SchoolAdmin | Principal | Teacher | HomeroomTeacher |
| ------------------------ | :--------: | :---------: | :-------: | :-----: | :-------------: |
| `/dashboard`             |      ✅     |      ✅      |     ✅     |    ❌    |        ❌        |
| `/teachers`              |      ✅     |      ✅      |    👁️    |    ❌    |        ❌        |
| `/students`              |      ✅     |      ✅      |    👁️    |    ❌    |        ❌        |
| `/subjects`              |      ✅     |      ✅      |    👁️    |    ❌    |        ❌        |
| `/classes`               |      ✅     |      ✅      |    👁️    |   👁️   |       👁️       |
| `/class-members`         |      ✅     |      ✅      |     ❌     |    ❌    |        ❌        |
| `/schedules`             |      ✅     |      ✅      |    👁️    |   👁️   |       👁️       |
| `/attendance` (input)    |      ✅     |      ✅      |     ❌     |    ✅    |        ✅        |
| `/attendance` (lihat)    |      ✅     |      ✅      |     ✅     |    ✅    |        ✅        |
| `/teaching-journals`     |      ✅     |      ✅      |    👁️    |    ✅    |        ❌        |
| `/assessments`           |      ✅     |      ✅      |    👁️    |    ✅    |        ❌        |
| `/assessment-categories` |      ✅     |      ✅      |     ❌     |    ❌    |        ❌        |
| `/grade-engine`          |      ✅     |      ✅      |    👁️    |    ✅    |        ❌        |
| `/report-cards`          |      ✅     |      ✅      |    👁️    |    ❌    |        ✅        |
| `/import`                |      ✅     |      ✅      |     ❌     |    ❌    |        ❌        |

> ✅ = Akses penuh   👁️ = Read only   ❌ = Tidak dapat diakses

---

## 5. Pola Request API

### Contoh GET dengan query params

```js
// GET /teachers?page=1&limit=10&search=budi
const response = await fetch(`${BASE_URL}/teachers?page=1&limit=10&search=${keyword}`, {
  headers: {
    "x-school-id": schoolId,
    "Authorization": `Bearer ${accessToken}`
  }
});
```

### Contoh POST

```js
// POST /attendance
const response = await fetch(`${BASE_URL}/attendance`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-school-id": schoolId,
    "Authorization": `Bearer ${accessToken}`
  },
  body: JSON.stringify({ scheduleId, teacherId, attendanceDate, details })
});
```

### Contoh Upload File (Import Excel)

```js
// POST /import/students (multipart)
const formData = new FormData();
formData.append("file", fileInput.files[0]);

const response = await fetch(`${BASE_URL}/import/students`, {
  method: "POST",
  headers: {
    "x-school-id": schoolId,
    "Authorization": `Bearer ${accessToken}`
    // Jangan set Content-Type — browser otomatis set boundary untuk multipart
  },
  body: formData
});
```

### Format Response (selalu konsisten)

```ts
// Sukses
{ success: true, message: string, data: T | T[] }

// Gagal
{ success: false, error: string, details?: string }
```

---

## 6. Referensi Enum & Konstanta

### Role Pengguna

```ts
type Role = "SuperAdmin" | "SchoolAdmin" | "Principal" | "Teacher" | "HomeroomTeacher" | "Student";
```

### Gender

```ts
type Gender = "L" | "P";
// L = Laki-laki, P = Perempuan
```

### Status Umum

```ts
type Status = "Aktif" | "Nonaktif";
```

### Tingkat Kelas

```ts
type GradeLevel = "7" | "8" | "9" | "10" | "11" | "12";
```

### Tingkat Sekolah

```ts
type SchoolLevel = "SMP" | "SMA";
```

### Status Sekolah

```ts
type SchoolStatus = "Negeri" | "Swasta";
```

### Hari Jadwal

```ts
type DayOfWeek = "Senin" | "Selasa" | "Rabu" | "Kamis" | "Jumat" | "Sabtu" | "Minggu";
```

### Semester Tahun Ajaran

```ts
type Semester = "Ganjil" | "Genap";      // Untuk academic_years
type ReportSemester = "GANJIL" | "GENAP"; // Untuk report_cards
```

### Status Absensi

```ts
type AttendanceStatus = "PRESENT" | "SICK" | "PERMISSION" | "ABSENT";
// PRESENT = Hadir, SICK = Sakit, PERMISSION = Izin, ABSENT = Alfa
```

### Tipe Penilaian

```ts
type AssessmentType = "DAILY_TEST" | "ASSIGNMENT" | "PROJECT" | "PRACTICAL" | "MIDTERM" | "FINAL";
```

### Status Rapor

```ts
type ReportCardStatus = "DRAFT" | "PUBLISHED";
```

### Huruf Mutu (Grade Letter)

```ts
// 90–100 = A, 80–89.99 = B, 70–79.99 = C, < 70 = D
type GradeLetter = "A" | "B" | "C" | "D";
```

### Level Prestasi Siswa

```ts
type AchievementLevel = "SCHOOL" | "DISTRICT" | "PROVINCE" | "NATIONAL" | "INTERNATIONAL";
```

### Predikat Ekstrakulikuler

```ts
type Predicate = "A" | "B" | "C" | "D";
```

### Predikat Proyek P5

```ts
type P5Predicate = "SB" | "B" | "C" | "PB";
// SB = Sangat Baik, B = Baik, C = Cukup, PB = Perlu Bimbingan
```

---

## Catatan Penting untuk Frontend

1. **Selalu simpan `schoolId` dari response login** — digunakan sebagai header `x-school-id` di setiap request.

2. **Dropdown dinamis** — Jangan hardcode ID. Selalu fetch dari API:

   * Daftar guru → `GET /teachers`
   * Daftar siswa → `GET /students`
   * Daftar kelas → `GET /classes`
   * Daftar mapel → `GET /subjects`
   * Tahun ajaran → `GET /academic-years` *(atau dari response kelas)*

3. **Proteksi route** — Cek `user.role` dari session sebelum merender halaman. Redirect ke `/403` jika tidak punya akses.

4. **Token expired** — Intercept response 401, otomatis refresh token, lalu ulangi request.

5. **Soft delete** — Data yang dihapus menggunakan soft delete (`deletedAt`). Tampilkan hanya data aktif (API sudah menyaring otomatis).

6. **Pagination** — Semua list endpoint mendukung `?page=1&limit=10`.

7. **Multi-tenant** — Satu user = satu sekolah. Tidak perlu UI pemilih sekolah setelah login.

---

*GuruHub Frontend Guide — v1.0.0 | Juni 2026*

Implementation plan Anda sudah sangat bagus, tetapi ada beberapa hal yang akan membuat hasil dari Claude/Gemini jauh lebih baik dan mengurangi risiko AI membuat struktur yang nanti harus dirombak.

### 1. Ubah "Open Questions"

Saat ini:

```md
## Open Questions

Backend sudah berjalan di http://localhost:3000.
Apakah frontend harus langsung connect ke backend tersebut, atau menggunakan mock data terlebih dahulu?
```

Ganti menjadi lebih tegas:

```md
## Development Strategy

IMPORTANT:

Phase 1 menggunakan MOCK DATA terlebih dahulu.

Jangan melakukan integrasi backend pada tahap awal.

Namun seluruh struktur aplikasi harus disiapkan untuk backend integration di fase berikutnya.

Gunakan:

- services/
- repositories/
- api-client/
- TanStack Query

seolah-olah backend sudah ada.

Ketika backend diaktifkan nanti, perubahan hanya terjadi pada service layer tanpa mengubah UI.
```

AI biasanya jauh lebih konsisten jika tidak diberi pertanyaan terbuka.

---

### 2. Tambahkan Folder Structure Target

AI coding agent sering membuat struktur berbeda-beda.

Tambahkan:

```md
## Target Folder Structure

src/
│
├── app/
├── components/
│   ├── ui/
│   ├── forms/
│   ├── tables/
│   ├── cards/
│   ├── charts/
│   ├── dialogs/
│   └── layouts/
│
├── features/
│   ├── dashboard/
│   ├── teachers/
│   ├── students/
│   ├── subjects/
│   ├── classes/
│   ├── attendance/
│   ├── assessments/
│   └── report-cards/
│
├── services/
├── store/
├── types/
├── hooks/
├── lib/
├── mock/
└── providers/
```

---

### 3. Tambahkan Coding Rules

Ini sangat membantu Claude.

```md
## Coding Rules

- Use TypeScript strict mode.
- Avoid any type.
- Prefer composition over duplication.
- Prefer reusable components.
- Keep components under 300 lines.
- Keep pages under 500 lines.
- Extract complex logic into hooks.
- Use server components when possible.
- Use client components only when necessary.
```

---

### 4. Tambahkan UI Requirements

Saat ini belum ada standar visual dashboard.

```md
## UI Requirements

Every page must contain:

- Page Header
- Breadcrumb
- Search Bar (when applicable)
- Filter Section
- Main Content Area
- Loading State
- Empty State
- Error State

Tables must support:

- Search
- Pagination
- Sorting
- Filtering

Forms must support:

- Validation
- Loading State
- Success Toast
- Error Toast
```

---

### 5. Tambahkan Dashboard Specification

Dashboard sering dibuat terlalu sederhana.

```md
Dashboard must contain:

- Total Teachers
- Total Students
- Total Classes
- Attendance Today
- Recent Activities
- Attendance Trend Chart
- Quick Actions

Use modern SaaS dashboard design.
```

---

### 6. Tambahkan AI Instruction

Bagian paling penting jika menggunakan Claude Sonnet 4.6 atau Opus 4.6:

```md
## AI Instructions

Read the entire implementation plan before generating code.

Do not start coding immediately.

First:

1. Analyze architecture.
2. Create folder structure.
3. Create reusable components strategy.
4. Create type definitions.
5. Create stores.
6. Create mock data.

Then implement pages module by module.

Never skip requirements.

Treat FRONTEND_GUIDE.md as the source of truth.

If a conflict exists:
FRONTEND_GUIDE.md overrides this implementation plan.
```

-