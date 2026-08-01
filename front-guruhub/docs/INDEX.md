# 📚 Indeks Dokumentasi GuruHub

Panduan navigasi untuk seluruh dokumentasi teknis platform **GuruHub**.

---

## 🗂️ Dokumentasi Utama

| # | Dokumen | Kategori | Deskripsi Singkat |
|---|---------|----------|-------------------|
| 1 | [README.md](../README.md) | 🏠 Utama | Pengenalan proyek, instalasi, dan panduan cepat |
| 2 | [DATABASE_DESIGN.md](DATABASE_DESIGN.md) | 🗄️ Database | ERD, struktur 16+ tabel, alasan desain multi-tenant |
| 3 | [ARCHITECTURE_REVIEW.md](ARCHITECTURE_REVIEW.md) | 🏗️ Arsitektur | Tinjauan clean architecture, bottleneck, skor kesehatan 78/100 |
| 4 | [SECURITY_AUDIT.md](SECURITY_AUDIT.md) | 🔒 Keamanan | 10 temuan audit, implementasi lockout, rate limiting |
| 5 | [CODE_REVIEW.md](CODE_REVIEW.md) | 🔍 Kualitas | Tinjauan kualitas kode & rekomendasi |
| 6 | [API_REFERENCE.md](API_REFERENCE.md) | 📡 API | Referensi lengkap semua endpoint REST API |
| 7 | [SETUP_GUIDE.md](SETUP_GUIDE.md) | 🚀 Deployment | Panduan instalasi, konfigurasi & troubleshooting |

---

## 🔌 Dokumentasi Modul API

| # | Modul | Dokumen | Endpoint Utama |
|---|-------|---------|----------------|
| 1 | Autentikasi | [AUTH_DOCUMENTATION.md](AUTH_DOCUMENTATION.md) | `POST /auth/login`, `/auth/refresh`, `/auth/logout` |
| 2 | Guru | [TEACHERS_DOCUMENTATION.md](TEACHERS_DOCUMENTATION.md) | `GET/POST/PUT/DELETE /teachers` |
| 3 | Siswa | [STUDENTS_DOCUMENTATION.md](STUDENTS_DOCUMENTATION.md) | `GET/POST/PUT/DELETE /students` |
| 4 | Kelas | [CLASSES_DOCUMENTATION.md](CLASSES_DOCUMENTATION.md) | `GET/POST/PUT/DELETE /classes` |
| 5 | Mata Pelajaran | [SUBJECTS_DOCUMENTATION.md](SUBJECTS_DOCUMENTATION.md) | `GET/POST/PUT/DELETE /subjects` |
| 6 | Jadwal | [SCHEDULES_DOCUMENTATION.md](SCHEDULES_DOCUMENTATION.md) | `GET/POST/PUT/DELETE /schedules` |
| 7 | Absensi | [ATTENDANCE_DOCUMENTATION.md](ATTENDANCE_DOCUMENTATION.md) | `POST /attendance`, `GET /attendance` |
| 8 | Jurnal Mengajar | [TEACHING_JOURNALS_DOCUMENTATION.md](TEACHING_JOURNALS_DOCUMENTATION.md) | `GET/POST/PUT/DELETE /teaching-journals` |
| 9 | Penilaian | [ASSESSMENTS_DOCUMENTATION.md](ASSESSMENTS_DOCUMENTATION.md) | `GET/POST/PUT/DELETE /assessments` |
| 10 | Kategori Penilaian | [ASSESSMENT_CATEGORIES_DOCUMENTATION.md](ASSESSMENT_CATEGORIES_DOCUMENTATION.md) | `GET/POST /assessment-categories` |
| 11 | Grade Engine | [GRADE_ENGINE_DOCUMENTATION.md](GRADE_ENGINE_DOCUMENTATION.md) | `POST /grade-engine/calculate` |
| 12 | Rapor | [REPORT_CARDS_DOCUMENTATION.md](REPORT_CARDS_DOCUMENTATION.md) | `GET/POST /report-cards` |
| 13 | Import Excel | [IMPORT_DOCUMENTATION.md](IMPORT_DOCUMENTATION.md) | `POST /import/teachers`, `/import/students` |
| 14 | PDF Generator | [PDF_GENERATOR_DOCUMENTATION.md](PDF_GENERATOR_DOCUMENTATION.md) | `GET /pdf-generator/report-card/:id` |
| 15 | Dashboard | [DASHBOARD_DOCUMENTATION.md](DASHBOARD_DOCUMENTATION.md) | `GET /dashboard/summary` |

---

## 🔑 Panduan Cepat Header Request

Semua endpoint yang terproteksi memerlukan dua header wajib:

```http
x-school-id: 1
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 🧪 File Test

| File Test | Modul yang Diuji |
|-----------|-----------------|
| `tests/auth.test.ts` | Autentikasi & otorisasi |
| `tests/teachers.test.ts` | Manajemen guru |
| `tests/students.test.ts` | Manajemen siswa |
| `tests/classes.test.ts` | Manajemen kelas |
| `tests/class-members.test.ts` | Anggota kelas |
| `tests/subjects.test.ts` | Mata pelajaran |
| `tests/schedules.test.ts` | Jadwal pelajaran |
| `tests/attendance.test.ts` | Absensi harian |
| `tests/teaching-journals.test.ts` | Jurnal mengajar |
| `tests/assessments.test.ts` | Penilaian siswa |
| `tests/assessment-categories.test.ts` | Kategori penilaian |
| `tests/grade-engine.test.ts` | Mesin nilai akhir |
| `tests/report-cards.test.ts` | Rapor digital |
| `tests/import.test.ts` | Impor Excel massal |
| `tests/pdf-generator.test.ts` | Generator PDF |
| `tests/dashboard.test.ts` | Dashboard statistik |
| `tests/db-connection.ts` | Koneksi database |

---

*Dokumentasi diperbarui: Juni 2026*
