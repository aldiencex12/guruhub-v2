# 📚 Dokumentasi Resmi Arsitektur & Operasional GuruHub v2
> **Analisis Terstruktur Berbasis Knowledge Graph (Graphify)**

---

## 📋 Daftar Isi
1. [Ringkasan Eksekutif & Ringkasan Sistem](#1-ringkasan-eksekutif--ringkasan-sistem)
2. [Analisis Keterkaitan Sistem Berbasis Graphify](#2-analisis-keterkaitan-sistem-berbasis-graphify)
3. [Arsitektur Multi-Tenant & Keamanan](#3-arsitektur-multi-tenant--keamanan)
4. [Inventaris Modul Utama & Alur Data](#4-inventaris-modul-utama--alur-data)
5. [Logika Penanganan Error Tenant & Autentikasi](#5-logika-penanganan-error-tenant--autentikasi)
6. [Skema Database & Pemulihan Data (Restoration Manual)](#6-skema-database--pemulihan-data-restoration-manual)
7. [Panduan Deployment & Operasional PM2 Server](#7-panduan-deployment--operasional-pm2-server)

---

## 1. Ringkasan Eksekutif & Ringkasan Sistem

**GuruHub v2** adalah platform Manajemen Informasi Sekolah Multi-Tenant skala enterprise yang dirancang khusus untuk mengelola operasional akademik, presensi harian, penilaian Kurikulum Merdeka, Rapor Sisipan (Interim Report), dan sistem poin kedisiplinan siswa/POLSIS.

### Ekosistem Teknologi (Tech Stack)
* **Backend API (`guruhub-api`)**: Powered by **Bun v1.3+**, **ElysiaJS**, dan **Drizzle ORM** terhubung ke **MySQL/MariaDB**.
* **Web Admin Frontend (`front-guruhub`)**: Built with **Next.js 16 (App Router)**, **TypeScript**, **TailwindCSS**, **TanStack Query (React Query)**, dan **Zustand**.
* **Mobile Frontend (`front-guruhub-mobile`)**: Progressive Web App (PWA) berbasis **Next.js** untuk Guru, Wali Kelas, dan POLSIS.
* **Knowledge Graph Tool**: **Graphify** (AST-based code extraction & dependency visualization).

---

## 2. Analisis Keterkaitan Sistem Berbasis Graphify

Berdasarkan analisis otomatis Graphify (3.806 Node, 6.739 Edges, 324 Komunitas):

### 🌟 Node Utama (God Nodes / Core Abstractions)
Node-node berikut merupakan pusat keterkaitan tertinggi di seluruh modul aplikasi:
1. `db` (Drizzle ORM Connection & Query Builder) — *58 Keterkaitan*
2. `schools` (Tabel Utama Multi-Tenant) — *44 Keterkaitan*
3. `classes` (Struktur Akademik Kelas) — *43 Keterkaitan*
4. `UserContext` (Konteks Autentikasi User) — *43 Keterkaitan*
5. `teachers` (Entitas Guru & Wali Kelas) — *42 Keterkaitan*
6. `students` (Entitas Siswa) — *41 Keterkaitan*
7. `academicYears` (Tahun Ajaran & Semester) — *40 Keterkaitan*
8. `getTeacherIdFromUserId()` (Helper Resolusi Identitas Guru) — *36 Keterkaitan*
9. `DisciplineService` / `DisciplineRepository` — *35 Keterkaitan*

### 🧱 Pembagian Komunitas Kode (Community Inventory)
- **Komunitas Autentikasi (`Modul Auth`)**: Mengisolasi JWT Token, hashing password (bcrypt/Argon2), dan guard peran (`SchoolAdmin`, `Teacher`, `Student`, `Principal`).
- **Komunitas Akademik (`Modul Subjects` & `InterimReportCardService`)**: Mengelola pemetaan mata pelajaran, agama siswa, dan kalkulasi Rapor Sisipan.
- **Komunitas Presensi (`Modul Attendance`)**: Mengintegrasikan absensi harian dengan pengurangan/penambahan poin kedisiplinan.

---

## 3. Arsitektur Multi-Tenant & Keamanan

Sistem menerapkan **Dua Lapis Isolasi Data (Tenant Isolation)** untuk memastikan tidak ada kebocoran data antar sekolah:

### 🛡️ Lapis 1: Header Resolusi Tenant (`x-school-id`)
Setiap request dari frontend wajib menyertakan header `x-school-id`. Backend memvalidasi header ini melalui `tenantMiddleware`:
```typescript
// Strict check pada guruhub-api/src/middleware/tenant.ts
export async function tenantMiddleware(req: Request) {
  const schoolId = req.headers.get("x-school-id");
  if (!schoolId) throw new BadRequestError("Header x-school-id wajib disertakan");
  // Validasi keberadaan sekolah di database...
}
```

### 🛡️ Lapis 2: Token JWT & Guard Peran (`requireRoles`)
Token JWT membawa klaim `userId`, `schoolId`, dan `role`. Panggilan API di tingkat service/repository selalu menerapkan filter `WHERE school_id = ?` secara mutlak.

---

## 4. Inventaris Modul Utama & Alur Data

```
+-------------------+      +-------------------+      +----------------------+
|   front-guruhub   | ---> |   guruhub-api     | ---> |   MySQL (guruhub_db) |
| (Next.js App)     |      | (Bun + ElysiaJS)  |      |                      |
+-------------------+      +-------------------+      +----------------------+
        |                            |                           |
   Interceptor                  tenantMiddleware            Drizzle ORM
(auto-logout 404)             (check x-school-id)         (school_id scoped)
```

### Modul Rapor Sisipan (Interim Report Card)
- **Filtering Agama Siswa**: Mapel agama dipetakan secara otomatis berdasarkan agama siswa (`religion_group`). Jika siswa beragama Islam, hanya mapel PAI yang dimasukkan ke kalkulasi Rapor Sisipan.
- **Sinkronisasi Presensi**: Kehadiran (Sakit, Izin, Alpha) dihitung secara real-time berdasarkan parameter semester aktif (Ganjil/Genap).

---

## 5. Logika Penanganan Error Tenant & Autentikasi

Untuk menangani skenario saat database di-reset atau header sekolah di `localStorage` kadaluarsa (menyebabkan error *"Sekolah tidak ditemukan"*), modul `src/services/api.ts` dilengkapi dengan **Global Interceptor**:

```typescript
// Logic Auto-Redirect saat Tenant Invalid di front-guruhub/src/services/api.ts
if (response.status === 404 || response.status === 400) {
  const isTenantError = 
    errorMessage.includes("Sekolah tidak ditemukan") ||
    errorMessage.includes("tenant tidak valid") ||
    errorMessage.includes("Header x-school-id wajib");

  if (isTenantError) {
    useAuthStore.getState().logout();
    window.location.href = "/login?reason=tenant_mismatch";
  }
}
```

---

## 6. Skema Database & Pemulihan Data (Restoration Manual)

### 📊 Statistik Tabel Terverifikasi
| Nama Tabel | Jumlah Record | Keterangan |
| :--- | :---: | :--- |
| `schools` | **2** | SMA Negeri 1 Jakarta (ID: 719), SMA Negeri 2 Bandung (ID: 720) |
| `users` | **508** | Akun Admin, Guru, Wali Kelas, POLSIS, Siswa |
| `students` | **645** | Data Siswa Terdaftar |
| `teachers` | **70** | Data Tenaga Pendidik |
| `classes` | **22** | Rincian Kelas |
| `subjects` | **91** | Mata Pelajaran Berdasarkan Tingkat & Agama |
| `schedules` | **897** | Jadwal Pelajaran Harian |
| `class_members` | **475** | Alokasi Siswa di Kelas |

### 🛠️ Prosedur Restorasi Data (Jika Database Reset)
Jalankan skrip Bun berikut dari folder `guruhub-api`:
```bash
# Executing SQL Dump & Patch Migrasi
bun -e "
import fs from 'fs';
import { db } from './src/db';
import { sql } from 'drizzle-orm';

const dataSql = fs.readFileSync('guruhub_data.sql', 'utf8');
// Impor tabel schools, users, subjects, dll.
"
```

---

## 7. Panduan Deployment & Operasional PM2 Server

### 1. Update Repository
```bash
cd /home/encex12/project
git pull origin main
```

### 2. Build Web Frontend
```bash
cd /home/encex12/project/front-guruhub
npm install
npm run build
```

### 3. Restart PM2 Cluster
```bash
pm2 restart all --update-env
```

### 4. Cek Status PM2
```bash
pm2 status
```
*Pastikan `guruhub-api` (Port 3000) dan `front-guruhub` (Port 3001) berstatus **online**.*
