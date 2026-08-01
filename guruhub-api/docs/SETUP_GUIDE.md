# 🚀 Panduan Setup & Deployment GuruHub

Panduan lengkap untuk menjalankan platform **GuruHub** di lingkungan lokal (development) maupun produksi.

---

## 📋 Daftar Isi

- [Prasyarat Sistem](#prasyarat-sistem)
- [Setup Development Lokal](#setup-development-lokal)
- [Konfigurasi Database MySQL](#konfigurasi-database-mysql)
- [Variabel Lingkungan (Environment)](#variabel-lingkungan-environment)
- [Struktur Database](#struktur-database)
- [Menjalankan Testing](#menjalankan-testing)
- [Troubleshooting](#troubleshooting)

---

## Prasyarat Sistem

Pastikan tools berikut sudah terinstal sebelum memulai:

| Tool | Versi Minimum | Instalasi |
|------|---------------|-----------|
| **Bun** | ≥ 1.3.14 | [bun.sh](https://bun.sh) |
| **Docker** | ≥ 24.0 | [docker.com](https://docs.docker.com/get-docker/) |
| **Docker Compose** | ≥ 2.0 | Sudah termasuk dalam Docker Desktop |
| **Git** | ≥ 2.40 | [git-scm.com](https://git-scm.com) |

### Install Bun (Linux/macOS)

```bash
curl -fsSL https://bun.sh/install | bash
source ~/.bashrc  # atau ~/.zshrc
bun --version    # Verifikasi instalasi
```

---

## Setup Development Lokal

### 1. Clone & Install Dependencies

```bash
# Clone repositori
git clone <repository-url>
cd guruhub

# Install seluruh dependencies
bun install
```

### 2. Konfigurasi Environment

```bash
# Salin template environment
cp .env.example .env

# Edit file .env dengan nilai yang sesuai
nano .env
```

### 3. Jalankan MySQL via Docker

```bash
# Jalankan container MySQL 8.4
docker-compose -f docker/docker-compose.yml up -d

# Verifikasi container berjalan
docker ps | grep mysql

# Cek log MySQL
docker logs guruhub-mysql
```

### 4. Jalankan Migrasi Database

```bash
# Generate migrasi (jika skema berubah)
bunx drizzle-kit generate

# Terapkan migrasi ke database
bunx drizzle-kit migrate

# Verifikasi koneksi database
bun tests/db-connection.ts
```

### 5. Jalankan Server

```bash
# Mode development (dengan hot-reload)
bun run dev

# Output yang diharapkan:
# 🦊 Elysia is running at localhost:3000
```

### 6. Verifikasi

```bash
# Cek endpoint root
curl http://localhost:3000/

# Akses Swagger UI
open http://localhost:3000/swagger
```

---

## Konfigurasi Database MySQL

### Docker Compose (Development)

File `docker/docker-compose.yml`:

```yaml
version: '3.8'
services:
  mysql:
    image: mysql:8.4
    container_name: guruhub-mysql
    environment:
      MYSQL_ROOT_PASSWORD: root_password
      MYSQL_DATABASE: guruhub
      MYSQL_USER: guruhub_user
      MYSQL_PASSWORD: guruhub_password
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql
    command: --default-authentication-plugin=mysql_native_password

volumes:
  mysql_data:
```

### Koneksi Manual ke MySQL

```bash
# Via Docker exec
docker exec -it guruhub-mysql mysql -u root -p

# Atau via MySQL client lokal
mysql -h localhost -P 3306 -u guruhub_user -p guruhub
```

### Query Verifikasi Tabel

```sql
SHOW DATABASES;
USE guruhub;
SHOW TABLES;
DESCRIBE schools;
```

---

## Variabel Lingkungan (Environment)

### File `.env` Lengkap

```env
# ─────────────────────────────────────
# DATABASE CONFIGURATION
# ─────────────────────────────────────
DATABASE_URL=mysql://guruhub_user:guruhub_password@localhost:3306/guruhub

# ─────────────────────────────────────
# JWT CONFIGURATION
# ─────────────────────────────────────
# PENTING: Gunakan string acak minimal 32 karakter untuk keamanan!
JWT_ACCESS_SECRET=ganti-dengan-secret-access-yang-kuat-minimal-32-karakter
JWT_REFRESH_SECRET=ganti-dengan-secret-refresh-yang-kuat-minimal-32-karakter

# Durasi token
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# ─────────────────────────────────────
# SERVER CONFIGURATION
# ─────────────────────────────────────
PORT=3000
NODE_ENV=development

# ─────────────────────────────────────
# CORS CONFIGURATION
# ─────────────────────────────────────
# Daftar origin yang diizinkan (pisahkan dengan koma)
ALLOWED_ORIGINS=http://localhost:3001,http://localhost:5173
```

### Generate Secret Key yang Aman

```bash
# Menggunakan OpenSSL
openssl rand -base64 64

# Menggunakan Bun
bun -e "console.log(require('crypto').randomBytes(64).toString('base64'))"
```

---

## Struktur Database

### Urutan Tabel (Dependency Order)

Tabel dibuat sesuai urutan ketergantungan Foreign Key:

```
1. schools           ← Induk utama (tenant)
2. academic_years    ← FK: schools
3. users             ← FK: schools
4. teachers          ← FK: schools, users
5. students          ← FK: schools, users
6. classes           ← FK: schools, academic_years, teachers
7. class_students    ← FK: schools, classes, students
8. subjects          ← FK: schools
9. subject_teachers  ← FK: schools, classes, subjects, teachers
10. schedules        ← FK: schools, classes, subjects, teachers, academic_years
11. attendances      ← FK: schools, schedules, teachers
12. attendance_details ← FK: attendances, students
13. teaching_journals  ← FK: schools, schedules, teachers, attendances
14. assessment_categories ← FK: schools
15. assessments      ← FK: schools, classes, subjects, teachers, academic_years, categories
16. assessment_scores ← FK: assessments, students
17. student_final_grades ← FK: schools, students, subjects, academic_years
18. report_cards     ← FK: schools, students, classes, academic_years
19. report_card_subjects ← FK: report_cards, subjects
20. report_card_attendances ← FK: report_cards
21. extracurriculars ← FK: schools
22. student_extracurriculars ← FK: report_cards, extracurriculars
23. student_achievements ← FK: report_cards
24. p5_projects      ← FK: report_cards
25. sessions         ← FK: schools, users
26. audit_logs       ← FK: schools, users
27. notifications    ← FK: schools, users
```

---

## Menjalankan Testing

### Persiapan

```bash
# 1. Pastikan server berjalan
bun run src/index.ts &

# 2. Tunggu server siap
sleep 2

# 3. Verifikasi server merespons
curl -s http://localhost:3000/ | head -5
```

### Jalankan Semua Test

```bash
bun test
```

### Jalankan Test Per Modul

```bash
# Test autentikasi
bun test tests/auth.test.ts

# Test manajemen guru
bun test tests/teachers.test.ts

# Test manajemen siswa
bun test tests/students.test.ts

# Test kelas
bun test tests/classes.test.ts

# Test jadwal
bun test tests/schedules.test.ts

# Test absensi
bun test tests/attendance.test.ts

# Test penilaian
bun test tests/assessments.test.ts

# Test grade engine
bun test tests/grade-engine.test.ts

# Test rapor
bun test tests/report-cards.test.ts

# Test jurnal mengajar
bun test tests/teaching-journals.test.ts

# Test impor Excel
bun test tests/import.test.ts

# Test PDF generator
bun test tests/pdf-generator.test.ts

# Test dashboard
bun test tests/dashboard.test.ts
```

### Jalankan Test dengan Output Verbose

```bash
bun test --verbose tests/assessments.test.ts
```

---

## Troubleshooting

### ❌ Error: Database Connection Refused

**Penyebab:** MySQL belum berjalan atau kredensial salah.

```bash
# Cek status container
docker ps | grep mysql

# Restart container
docker-compose -f docker/docker-compose.yml restart

# Verifikasi koneksi
bun tests/db-connection.ts
```

### ❌ Error: ER_ACCESS_DENIED_ERROR

**Penyebab:** Username/password di `DATABASE_URL` tidak sesuai.

```bash
# Cek konfigurasi .env
cat .env | grep DATABASE_URL

# Test koneksi manual
docker exec guruhub-mysql mysql -u guruhub_user -pguruhub_password -e "SELECT 1"
```

### ❌ Error: Migration Failed

**Penyebab:** Skema tabel tidak sinkron.

```bash
# Lihat status migrasi
bunx drizzle-kit status

# Jalankan ulang migrasi
bunx drizzle-kit migrate

# Atau push langsung (dev only)
bunx drizzle-kit push
```

### ❌ Error: JWT Token Invalid

**Penyebab:** JWT_SECRET di `.env` berubah atau kosong.

```bash
# Pastikan .env memiliki JWT secrets
grep JWT .env

# Restart server setelah ubah .env
pkill -f "bun run src/index.ts"
bun run src/index.ts
```

### ❌ Error: 403 Forbidden - Akses antar tenant dilarang

**Penyebab:** `x-school-id` header tidak sesuai dengan `schoolId` di JWT token.

**Solusi:**
1. Pastikan `x-school-id` header bernilai sama dengan `schoolId` saat login
2. Login ulang untuk mendapatkan token baru dengan `schoolId` yang benar

### ❌ Error: Port 3000 Already in Use

```bash
# Temukan proses yang menggunakan port 3000
lsof -i :3000

# Matikan proses tersebut
kill -9 <PID>

# Atau gunakan port lain
PORT=3001 bun run src/index.ts
```

---

## Tips Development

### Hot Reload

```bash
# Gunakan mode dev untuk hot-reload otomatis
bun run dev
# = bun run --watch src/index.ts
```

### Drizzle Studio (Database GUI)

```bash
# Buka interface visual database
bunx drizzle-kit studio
# Akses di: https://local.drizzle.studio
```

### Inspeksi Log Database Query

Tambahkan logger ke konfigurasi Drizzle di `src/db/index.ts`:

```typescript
const db = drizzle(connection, {
  logger: process.env.NODE_ENV === 'development'
});
```

### Reset Database (Development Only)

```bash
# Hapus dan buat ulang database
docker exec guruhub-mysql mysql -u root -proot_password -e "DROP DATABASE IF EXISTS guruhub; CREATE DATABASE guruhub;"

# Jalankan ulang migrasi
bunx drizzle-kit migrate
```

---

*Panduan Setup GuruHub — Versi 1.0.0 | Juni 2026*
