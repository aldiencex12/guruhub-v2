# 🏫 GuruHub — Platform Manajemen Sekolah Multi-Tenant

> Platform SaaS administrasi sekolah Indonesia berbasis **Kurikulum Merdeka**, dibangun dengan **Bun**, **ElysiaJS**, **Drizzle ORM**, dan **MySQL 8.4**.

[![Bun](https://img.shields.io/badge/Runtime-Bun-orange)](https://bun.sh)
[![ElysiaJS](https://img.shields.io/badge/Framework-ElysiaJS-purple)](https://elysiajs.com)
[![Drizzle ORM](https://img.shields.io/badge/ORM-Drizzle-green)](https://orm.drizzle.team)
[![MySQL](https://img.shields.io/badge/Database-MySQL%208.4-blue)](https://mysql.com)
[![TypeScript](https://img.shields.io/badge/Language-TypeScript-blue)](https://typescriptlang.org)

---

## 📑 Daftar Isi

- [Tentang Proyek](#tentang-proyek)
- [Fitur Utama](#fitur-utama)
- [Arsitektur Sistem](#arsitektur-sistem)
- [Stack Teknologi](#stack-teknologi)
- [Struktur Proyek](#struktur-proyek)
- [Model Peran (RBAC)](#model-peran-rbac)
- [Instalasi & Setup](#instalasi--setup)
- [Konfigurasi Environment](#konfigurasi-environment)
- [Menjalankan Aplikasi](#menjalankan-aplikasi)
- [Migrasi Database](#migrasi-database)
- [Modul API](#modul-api)
- [Sistem Autentikasi](#sistem-autentikasi)
- [Multi-Tenant Isolation](#multi-tenant-isolation)
- [Pengujian (Testing)](#pengujian-testing)
- [Dokumentasi Lengkap](#dokumentasi-lengkap)

---

## Tentang Proyek

**GuruHub** adalah platform manajemen sekolah multi-tenant yang dirancang khusus untuk memenuhi kebutuhan administrasi akademik sekolah Indonesia (SMP & SMA) sesuai **Kurikulum Merdeka**. Setiap sekolah (tenant) memiliki data yang terisolasi secara logis dalam satu database bersama (*Shared Database, Shared Schema*).

### Tujuan Utama

- Otomatisasi administrasi akademik harian (absensi, penilaian, jurnal mengajar)
- Kalkulasi nilai akhir otomatis berdasarkan bobot kategori penilaian
- Generasi rapor digital format Kurikulum Merdeka
- Impor data massal via file Excel
- Kontrol akses berbasis peran (RBAC) yang ketat

---

## Fitur Utama

| Fitur | Deskripsi |
|-------|-----------|
| 🔐 **Autentikasi JWT** | Login multi-tenant, refresh token rotation, audit logs |
| 🏫 **Multi-Tenant** | Isolasi data antar sekolah menggunakan `x-school-id` header |
| 👨‍🏫 **Manajemen Guru** | CRUD data guru, NIP, penugasan mata pelajaran |
| 👨‍🎓 **Manajemen Siswa** | CRUD data siswa, NISN/NIS, pengelompokan kelas |
| 📚 **Manajemen Kelas** | Kelas per tahun ajaran, wali kelas, anggota kelas |
| 📖 **Mata Pelajaran** | CRUD mata pelajaran, penugasan guru per kelas |
| 🗓️ **Jadwal Pelajaran** | Jadwal per hari/kelas/guru dengan manajemen konflik |
| ✅ **Absensi** | Absensi harian per jadwal, status HADIR/SAKIT/IZIN/ALFA |
| 📓 **Jurnal Mengajar** | Pencatatan topik, metode, dan refleksi mengajar guru |
| 📊 **Penilaian** | Asesmen formatif & sumatif berbasis Kurikulum Merdeka |
| ⚖️ **Grade Engine** | Kalkulasi nilai akhir tertimbang otomatis per siswa/kelas |
| 📄 **Rapor Digital** | Generasi rapor per semester (Draft/Published) |
| 📥 **Import Excel** | Impor massal data guru, siswa, nilai via XLSX |
| 🖨️ **PDF Generator** | Cetak rapor ke format PDF |
| 📈 **Dashboard** | Statistik ringkasan akademik per sekolah |

---

## Arsitektur Sistem

GuruHub mengimplementasikan **Clean Architecture** dengan pemisahan tanggung jawab yang jelas:

```
Client Request
    │
    ▼
┌─────────────────┐
│  Tenant MW      │  ← Validasi x-school-id header
│  (tenant.ts)    │
└────────┬────────┘
         │
    ▼
┌─────────────────┐
│  Auth MW        │  ← Verifikasi JWT & RBAC
│  (auth.ts)      │
└────────┬────────┘
         │
    ▼
┌─────────────────┐
│  Controller     │  ← Routing & DTO Validation
└────────┬────────┘
         │
    ▼
┌─────────────────┐
│  Service        │  ← Business Logic
└────────┬────────┘
         │
    ▼
┌─────────────────┐
│  Repository     │  ← Drizzle ORM Queries
└────────┬────────┘
         │
    ▼
┌─────────────────┐
│  MySQL 8.4      │  ← Database
└─────────────────┘
```

### Pola Multi-Tenant

Model **Shared Database, Shared Schema** — semua sekolah berbagi satu database, dengan kolom `school_id` pada setiap tabel untuk isolasi data secara logis.

---

## Stack Teknologi

| Komponen | Teknologi | Versi |
|----------|-----------|-------|
| **Runtime** | [Bun](https://bun.sh) | ≥ 1.3.14 |
| **Framework** | [ElysiaJS](https://elysiajs.com) | ^1.4.28 |
| **ORM** | [Drizzle ORM](https://orm.drizzle.team) | ^0.45.2 |
| **Database** | MySQL | 8.4 (Docker) |
| **Auth** | JSON Web Token | ^9.0.3 |
| **PDF** | pdf-lib + Puppeteer | ^1.17.1 / ^22.6.0 |
| **Excel** | xlsx (SheetJS) | ^0.18.5 |
| **CORS** | @elysiajs/cors | ^1.4.2 |
| **Swagger** | @elysiajs/swagger | ^1.3.1 |
| **Language** | TypeScript | ^5 |

---

## Struktur Proyek

```
guruhub/
├── src/
│   ├── index.ts                    # Entry point, registrasi seluruh route
│   ├── db/                         # Koneksi database Drizzle ORM
│   ├── schema/                     # Definisi skema tabel (Drizzle)
│   │   ├── schools.ts
│   │   ├── users.ts
│   │   ├── teachers.ts
│   │   ├── students.ts
│   │   ├── classes.ts
│   │   ├── subjects.ts
│   │   ├── academicYears.ts
│   │   ├── schedules.ts
│   │   ├── attendances.ts
│   │   ├── teachingJournals.ts
│   │   ├── assessments.ts
│   │   ├── assessmentCategories.ts
│   │   ├── reportCards.ts
│   │   ├── studentFinalGrades.ts
│   │   └── ...
│   ├── middleware/
│   │   ├── auth.ts                 # JWT Verification & RBAC Guard
│   │   └── tenant.ts               # Multi-Tenant Header Validation
│   ├── errors/
│   │   └── customErrors.ts         # Custom HTTP Error Classes
│   ├── utils/
│   │   ├── jwt.ts                  # Token signing & verification
│   │   ├── password.ts             # Bcrypt hash & verify
│   │   └── gradeCalculator.ts      # Grade letter conversion
│   └── modules/                    # Feature Modules (Clean Architecture)
│       ├── auth/
│       ├── teachers/
│       ├── students/
│       ├── classes/
│       ├── class-members/
│       ├── subjects/
│       ├── schedules/
│       ├── attendance/
│       ├── teaching-journals/
│       ├── assessments/
│       ├── assessment-categories/
│       ├── grade-engine/
│       ├── report-cards/
│       ├── import/
│       ├── pdf-generator/
│       └── dashboard/
├── migrations/                     # File migrasi SQL (Drizzle Kit)
├── tests/                          # Integration tests (Bun test runner)
│   ├── auth.test.ts
│   ├── teachers.test.ts
│   ├── students.test.ts
│   ├── classes.test.ts
│   ├── schedules.test.ts
│   ├── attendance.test.ts
│   ├── assessments.test.ts
│   ├── grade-engine.test.ts
│   ├── report-cards.test.ts
│   ├── teaching-journals.test.ts
│   ├── import.test.ts
│   ├── pdf-generator.test.ts
│   └── dashboard.test.ts
├── docs/                           # Dokumentasi teknis lengkap
├── docker/                         # Docker setup untuk MySQL
├── drizzle.config.ts               # Konfigurasi Drizzle Kit
├── package.json
└── tsconfig.json
```

Setiap modul mengikuti struktur internal yang konsisten:

```
modules/<nama-modul>/
├── controller/     # Route handler & input validation
├── dto/            # TypeBox schema (request body types)
├── service/        # Business logic layer
├── repository/     # Database queries (Drizzle ORM)
└── routes/         # Route registration
```

---

## Model Peran (RBAC)

GuruHub mengimplementasikan Role-Based Access Control dengan 6 peran hierarkis:

| Peran | Deskripsi | Akses |
|-------|-----------|-------|
| `SuperAdmin` | Admin platform (lintas sekolah) | Penuh |
| `SchoolAdmin` | Admin sekolah | Penuh dalam 1 sekolah |
| `Principal` | Kepala sekolah | Read & approve |
| `Teacher` | Guru mata pelajaran | Modul pengajaran |
| `HomeroomTeacher` | Wali kelas | Kelas & rapor |
| `Student` | Siswa | Read-only data pribadi |

---

## Instalasi & Setup

### Prasyarat

- **Bun** ≥ 1.3.14 — [Install Bun](https://bun.sh/docs/installation)
- **Docker** — untuk MySQL 8.4
- **Node.js** ≥ 18 (opsional, untuk tools tambahan)

### Langkah Instalasi

```bash
# 1. Clone repositori
git clone <repository-url>
cd guruhub

# 2. Install dependencies
bun install

# 3. Salin file environment
cp .env.example .env
# Edit .env sesuai konfigurasi lokal Anda

# 4. Jalankan database MySQL (via Docker)
docker-compose -f docker/docker-compose.yml up -d

# 5. Jalankan migrasi database
bunx drizzle-kit migrate

# 6. Jalankan server
bun run dev
```

---

## Konfigurasi Environment

Buat file `.env` di root proyek berdasarkan template berikut:

```env
# Database
DATABASE_URL=mysql://user:password@localhost:3306/guruhub

# JWT Secrets (gunakan string acak yang panjang & kuat)
JWT_ACCESS_SECRET=your-super-secret-access-key-min-32-chars
JWT_REFRESH_SECRET=your-super-secret-refresh-key-min-32-chars

# JWT Expiry
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Server
PORT=3000
NODE_ENV=development
```

> ⚠️ **Peringatan**: Jangan pernah commit file `.env` ke version control. Pastikan `.gitignore` memuat entri `.env`.

---

## Menjalankan Aplikasi

```bash
# Mode development (hot-reload)
bun run dev

# Mode production
bun run start

# Cek koneksi database
bun tests/db-connection.ts
```

Setelah server berjalan, akses:
- **API Base URL**: `http://localhost:3000`
- **Swagger UI**: `http://localhost:3000/swagger`

---

## Migrasi Database

Proyek menggunakan **Drizzle Kit** untuk manajemen skema dan migrasi:

```bash
# Generate file migrasi baru dari perubahan skema TypeScript
bunx drizzle-kit generate

# Terapkan migrasi ke database
bunx drizzle-kit migrate

# Push skema langsung ke database (development only)
bunx drizzle-kit push

# Inspeksi skema database saat ini
bunx drizzle-kit introspect

# Buka Drizzle Studio (GUI database)
bunx drizzle-kit studio
```

File migrasi tersimpan di direktori `migrations/` dan terurut secara kronologis.

---

## Modul API

Semua endpoint yang memerlukan autentikasi wajib menyertakan header:

```
x-school-id: <ID_SEKOLAH>
Authorization: Bearer <ACCESS_TOKEN>
```

### Ringkasan Endpoint

| Modul | Base Path | Deskripsi |
|-------|-----------|-----------|
| **Auth** | `/auth` | Login, Refresh Token, Logout, Profil |
| **Teachers** | `/teachers` | CRUD data guru |
| **Students** | `/students` | CRUD data siswa |
| **Classes** | `/classes` | CRUD kelas per tahun ajaran |
| **Class Members** | `/class-members` | Manajemen anggota kelas |
| **Subjects** | `/subjects` | CRUD mata pelajaran |
| **Schedules** | `/schedules` | Jadwal pelajaran |
| **Attendance** | `/attendance` | Absensi harian |
| **Teaching Journals** | `/teaching-journals` | Jurnal mengajar guru |
| **Assessments** | `/assessments` | Penilaian siswa |
| **Assessment Categories** | `/assessment-categories` | Kategori & bobot penilaian |
| **Grade Engine** | `/grade-engine` | Kalkulasi nilai akhir otomatis |
| **Report Cards** | `/report-cards` | Rapor digital per semester |
| **Import** | `/import` | Impor massal via Excel |
| **PDF Generator** | `/pdf-generator` | Cetak rapor ke PDF |
| **Dashboard** | `/dashboard` | Statistik & ringkasan akademik |

---

## Sistem Autentikasi

GuruHub menggunakan sistem autentikasi stateful berbasis JWT dengan dua jenis token:

| Token | Durasi | Kegunaan |
|-------|--------|----------|
| **Access Token** | 15 menit | Otorisasi request API |
| **Refresh Token** | 7 hari | Perbarui access token |

### Alur Autentikasi

```
1. POST /auth/login   →  { accessToken, refreshToken }
2. Gunakan accessToken di header Authorization: Bearer <token>
3. Saat accessToken expired → POST /auth/refresh → { accessToken baru, refreshToken baru }
4. POST /auth/logout  →  Revoke session
```

### Fitur Keamanan

- ✅ **Token Rotation** — Setiap refresh menghasilkan token baru, token lama otomatis dicabut
- ✅ **Tenant Isolation** — `schoolId` di JWT dicocokkan dengan header `x-school-id`
- ✅ **Audit Log** — Setiap login/logout tercatat di tabel `audit_logs`
- ✅ **Multi-Tenant** — Email hanya unik per sekolah, bukan global

---

## Multi-Tenant Isolation

Isolasi data antar sekolah dijamin oleh dua lapis middleware:

**1. Tenant Middleware** (`src/middleware/tenant.ts`)
```
Header x-school-id → Validasi ke DB → Inject schoolId ke context
```

**2. Auth Middleware** (`src/middleware/auth.ts`)
```
JWT payload.schoolId === context.schoolId → Lanjutkan / 403 Forbidden
```

Seluruh query database selalu menyertakan klausa `WHERE school_id = ?` untuk memastikan tidak ada kebocoran data antar tenant.

---

## Pengujian (Testing)

GuruHub menggunakan **Bun Test Runner** bawaan untuk integration testing.

### Menjalankan Semua Test

```bash
# Pastikan server berjalan terlebih dahulu
bun run src/index.ts

# Di terminal terpisah, jalankan semua test
bun test
```

### Menjalankan Test Per Modul

```bash
bun test tests/auth.test.ts
bun test tests/teachers.test.ts
bun test tests/students.test.ts
bun test tests/classes.test.ts
bun test tests/schedules.test.ts
bun test tests/attendance.test.ts
bun test tests/assessments.test.ts
bun test tests/grade-engine.test.ts
bun test tests/report-cards.test.ts
bun test tests/teaching-journals.test.ts
bun test tests/import.test.ts
bun test tests/pdf-generator.test.ts
bun test tests/dashboard.test.ts
```

### Cakupan Pengujian

Setiap modul diuji terhadap skenario:
- ✅ Operasi CRUD sukses (200/201)
- ✅ Validasi input (400)
- ✅ Autentikasi (401)
- ✅ Otorisasi RBAC (403)
- ✅ Resource tidak ditemukan (404)
- ✅ Konflik data duplikat (409)
- ✅ Multi-tenant isolation (403)

---

## Dokumentasi Lengkap

Dokumentasi teknis detail tersedia di direktori `docs/`:

| Dokumen | Deskripsi |
|---------|-----------|
| [DATABASE_DESIGN.md](docs/DATABASE_DESIGN.md) | ERD, struktur tabel, dan alasan desain |
| [ARCHITECTURE_REVIEW.md](docs/ARCHITECTURE_REVIEW.md) | Tinjauan arsitektur & skalabilitas |
| [SECURITY_AUDIT.md](docs/SECURITY_AUDIT.md) | Audit keamanan & rekomendasi perbaikan |
| [AUTH_DOCUMENTATION.md](docs/AUTH_DOCUMENTATION.md) | Modul autentikasi & otorisasi |
| [TEACHERS_DOCUMENTATION.md](docs/TEACHERS_DOCUMENTATION.md) | Modul manajemen guru |
| [STUDENTS_DOCUMENTATION.md](docs/STUDENTS_DOCUMENTATION.md) | Modul manajemen siswa |
| [CLASSES_DOCUMENTATION.md](docs/CLASSES_DOCUMENTATION.md) | Modul manajemen kelas |
| [SUBJECTS_DOCUMENTATION.md](docs/SUBJECTS_DOCUMENTATION.md) | Modul mata pelajaran |
| [SCHEDULES_DOCUMENTATION.md](docs/SCHEDULES_DOCUMENTATION.md) | Modul jadwal pelajaran |
| [ATTENDANCE_DOCUMENTATION.md](docs/ATTENDANCE_DOCUMENTATION.md) | Modul absensi |
| [TEACHING_JOURNALS_DOCUMENTATION.md](docs/TEACHING_JOURNALS_DOCUMENTATION.md) | Modul jurnal mengajar |
| [ASSESSMENTS_DOCUMENTATION.md](docs/ASSESSMENTS_DOCUMENTATION.md) | Modul penilaian |
| [ASSESSMENT_CATEGORIES_DOCUMENTATION.md](docs/ASSESSMENT_CATEGORIES_DOCUMENTATION.md) | Kategori & bobot penilaian |
| [GRADE_ENGINE_DOCUMENTATION.md](docs/GRADE_ENGINE_DOCUMENTATION.md) | Mesin kalkulasi nilai akhir |
| [REPORT_CARDS_DOCUMENTATION.md](docs/REPORT_CARDS_DOCUMENTATION.md) | Modul rapor digital |
| [IMPORT_DOCUMENTATION.md](docs/IMPORT_DOCUMENTATION.md) | Fitur impor massal Excel |
| [PDF_GENERATOR_DOCUMENTATION.md](docs/PDF_GENERATOR_DOCUMENTATION.md) | Generator PDF rapor |
| [DASHBOARD_DOCUMENTATION.md](docs/DASHBOARD_DOCUMENTATION.md) | Dashboard & statistik akademik |
| [CODE_REVIEW.md](docs/CODE_REVIEW.md) | Tinjauan kualitas kode |

---

## Kontribusi

1. Fork repositori ini
2. Buat branch fitur: `git checkout -b feature/nama-fitur`
3. Commit perubahan: `git commit -m 'feat: deskripsi fitur'`
4. Push ke branch: `git push origin feature/nama-fitur`
5. Buat Pull Request

---

## Lisensi

Proyek ini bersifat private. Seluruh hak cipta dilindungi.

---

*Dibuat dengan ❤️ menggunakan [Bun](https://bun.sh) & [ElysiaJS](https://elysiajs.com)*
