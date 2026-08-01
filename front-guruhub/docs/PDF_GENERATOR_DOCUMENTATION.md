# Dokumentasi Modul PDF Generator GuruHub

Modul PDF Generator bertanggung jawab untuk memproduksi dokumen cetak kelas profesional (A4 Portrait) untuk berbagai kebutuhan sekolah, termasuk Rapor Kurikulum Merdeka, rekap absensi, jurnal mengajar, nilai asesmen, serta daftar siswa dan guru.

## Teknologi & Pendekatan Teknis

- **Pustaka Rendering**: `puppeteer` (headless browser) digunakan untuk merender HTML & CSS modern ke berkas PDF secara andal.
- **Pustaka PDF Utility**: `pdf-lib` (bisa diintegrasikan jika diperlukan manipulasi halaman PDF tingkat lanjut).
- **Template Layout**: Menggunakan file template berbasis HTML5/CSS3 yang dikompilasi secara dinamis berdasarkan data database riil.
- **Ukuran Halaman**: A4 Portrait dengan margin presisi (`15mm` - `20mm`) yang dioptimalkan untuk cetak fisik.

---

## 1. Daftar Endpoint API

### 1.1 Rapor Siswa (Kurikulum Merdeka)
- **Endpoint**: `GET /pdf/report-card/:reportCardId`
- **Tujuan**: Menghasilkan dokumen Rapor Siswa A4 lengkap dengan identitas sekolah, nilai per mata pelajaran, catatan prestasi, rekap kehadiran, dan catatan wali kelas.
- **RBAC**: `SuperAdmin`, `SchoolAdmin`, `Principal`, `HomeroomTeacher` (Student & Regular Teacher dilarang).

### 1.2 Rekap Kehadiran Kelas
- **Endpoint**: `GET /pdf/attendance/class/:classId`
- **Query Params**:
  - `semester` (string, e.g. "Ganjil" atau "Genap")
  - `academicYearId` (number/string, ID tahun ajaran)
- **Tujuan**: Rekap total kehadiran siswa (Hadir, Sakit, Izin, Alfa) dalam satu semester di kelas tertentu.
- **RBAC**: `SuperAdmin`, `SchoolAdmin`, `Principal`, `Teacher`, `HomeroomTeacher`.

### 1.3 Jurnal Mengajar Guru
- **Endpoint**: `GET /pdf/journals/teacher/:teacherId`
- **Tujuan**: Rekap jurnal mengajar guru yang mencantumkan tanggal, topik, tujuan pembelajaran, metode, dan refleksi mengajar.
- **RBAC**: `SuperAdmin`, `SchoolAdmin`, `Principal`, `Teacher` (hanya jurnal miliknya sendiri), `HomeroomTeacher`.

### 1.4 Laporan Hasil Asesmen
- **Endpoint**: `GET /pdf/assessments/:assessmentId`
- **Tujuan**: Menampilkan statistik asesmen kelas (rata-rata, nilai tertinggi/terendah) beserta tabel nilai seluruh siswa.
- **RBAC**: `SuperAdmin`, `SchoolAdmin`, `Principal`, `Teacher` (hanya asesmen miliknya sendiri), `HomeroomTeacher`.

### 1.5 Daftar Siswa Kelas
- **Endpoint**: `GET /pdf/students`
- **Query Params**:
  - `classId` (number/string, ID kelas)
  - `academicYearId` (number/string, ID tahun ajaran)
- **Tujuan**: Mencetak daftar nama siswa aktif lengkap dengan NIS/NISN dan jenis kelamin.
- **RBAC**: `SuperAdmin`, `SchoolAdmin`, `Principal`, `Teacher`, `HomeroomTeacher`.

### 1.6 Daftar Guru Sekolah
- **Endpoint**: `GET /pdf/teachers`
- **Tujuan**: Mencetak daftar seluruh guru sekolah aktif beserta NIP, jenis kelamin, dan jabatan wali kelas jika ada.
- **RBAC**: `SuperAdmin`, `SchoolAdmin`, `Principal`, `Teacher`, `HomeroomTeacher`.

---

## 2. Fitur Keamanan & Pembatasan Akses

1. **Multi-Tenant Isolation (Wajib)**:
   - Header `x-school-id` wajib dikirimkan pada setiap request.
   - Pengecekan silang dilakukan untuk memastikan data (Rapor, Kelas, Jurnal, Guru, Asesmen) adalah milik sekolah yang sesuai dengan `x-school-id` penanya. Jika terjadi penyimpangan (cross-tenant), sistem mengembalikan status `403 Forbidden`.

2. **Pembatasan Data Guru (Personal Boundaries)**:
   - Seorang guru (`Teacher` / `HomeroomTeacher`) hanya diperbolehkan mengunduh Jurnal Mengajar dan Laporan Asesmen atas namanya sendiri.
   - Jika guru mencoba mengakses ID guru lain, sistem mengembalikan status `403 Forbidden`.

3. **Restriksi Siswa**:
   - Peran `Student` dibatasi sepenuhnya dari seluruh endpoint PDF (`403 Forbidden`).

---

## 3. Contoh Respon Sukses

Ketika request valid dan berhasil diproses, server akan mengembalikan respon dengan header:
```http
Content-Type: application/pdf
Content-Disposition: attachment; filename="rapor-1.pdf"
```
Body respon berisi byte buffer biner dari file PDF yang langsung bisa diunduh oleh client atau dirender secara inline di browser PDF viewer.

---

## 4. Kasus Uji (Integration Tests)

Pengujian integrasi lengkap diimplementasikan pada file `tests/pdf-generator.test.ts` yang mencakup 22 skenario pengujian otomatis, memvalidasi fungsionalitas rendering dokumen serta batas keamanan otentikasi, otorisasi peran (RBAC), isolasi tenant, dan pengembalian error format 404/403.
