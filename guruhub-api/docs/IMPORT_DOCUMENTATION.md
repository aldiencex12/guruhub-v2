# Modul Excel Import GuruHub - Dokumentasi Integrasi & API

Modul Excel Import menyediakan mekanisme pengunggahan batch data master sekolah menggunakan format file Excel (`.xlsx` atau `.xls`) untuk mempercepat proses onboarding data Guru, Siswa, Kelas, Mata Pelajaran, dan Anggota Kelas.

---

## 1. Spesifikasi File & Validasi Umum

- **Format File**: `.xlsx` atau `.xls` saja.
- **Ukuran Maksimum**: 20 MB.
- **Pemberian Nama Header**: Case-insensitive dan whitespace-friendly. Nama kolom akan ditrim dan dikonversi ke lowercase sebelum diproses (misal `Nama` atau `  NAME ` akan dibaca sebagai `name`).
- **Isolasi Multi-Tenant**: Kolom sekolah (`schoolId`) sengaja tidak disertakan dalam berkas template Excel. Sistem secara otomatis menautkan data yang diunggah ke `schoolId` dari pengguna yang sedang login (dideteksi via payload token JWT dan header `x-school-id`).
- **Mode Uji Coba (Preview)**: Pengguna dapat mengunggah file untuk menganalisis baris data tanpa menyimpannya ke database.
- **Transaksi Basis Data**: Semua baris data diproses dalam satu transaksi database (`db.transaction()`). Jika terdapat satu baris data yang melanggar aturan bisnis, seluruh proses import dalam file tersebut dibatalkan (rollback) untuk menjaga konsistensi data.

---

## 2. Struktur Kolom Template & Aturan Bisnis

### A. Template Guru (Teachers)
- **Nama Berkas**: `template-teachers.xlsx`
- **Daftar Kolom**: `| nip | name | gender | phone |`
- **Aturan Bisnis & Validasi**:
  1. `name` (Wajib): Tidak boleh kosong.
  2. `gender` (Wajib): Harus bernilai huruf `L` (Laki-laki) atau `P` (Perempuan).
  3. `nip` (Opsional): Jika diisi, harus unik di tingkat sekolah bersangkutan. Duplikasi NIP di dalam file Excel atau dengan NIP yang sudah ada di database akan menghasilkan error.

### B. Template Siswa (Students)
- **Nama Berkas**: `template-students.xlsx`
- **Daftar Kolom**: `| nisn | nis | name | gender |`
- **Aturan Bisnis & Validasi**:
  1. `name` (Wajib): Tidak boleh kosong.
  2. `gender` (Wajib): Harus bernilai `L` atau `P`.
  3. `nisn` (Wajib): Harus diisi, berupa string maksimal 10 karakter, dan harus unik secara **global** (di seluruh sekolah).
  4. `nis` (Wajib): Harus diisi dan harus unik di tingkat sekolah bersangkutan.

### C. Template Kelas (Classes)
- **Nama Berkas**: `template-classes.xlsx`
- **Daftar Kolom**: `| name | gradeLevel | homeroomTeacherNip |`
- **Aturan Bisnis & Validasi**:
  1. `name` (Wajib): Harus unik untuk tahun ajaran aktif di sekolah tersebut.
  2. `gradeLevel` (Wajib): Harus bernilai antara `7` sampai `12`.
  3. `homeroomTeacherNip` (Wajib): Harus merupakan NIP guru aktif yang terdaftar di sekolah yang sama.

### D. Template Mata Pelajaran (Subjects)
- **Nama Berkas**: `template-subjects.xlsx`
- **Daftar Kolom**: `| code | name | gradeLevel |`
- **Aturan Bisnis & Validasi**:
  1. `code` (Wajib): Harus unik di tingkat sekolah.
  2. `name` (Wajib): Harus unik di tingkat sekolah.
  3. `gradeLevel` (Wajib): Harus bernilai antara `7` sampai `12`.

### E. Template Anggota Kelas (Class Members)
- **Nama Berkas**: `template-class-members.xlsx`
- **Daftar Kolom**: `| className | nis |`
- **Aturan Bisnis & Validasi**:
  1. `className` (Wajib): Harus merujuk pada nama kelas aktif yang terdaftar di sekolah pada tahun ajaran aktif saat ini.
  2. `nis` (Wajib): Harus merujuk pada NIS siswa aktif yang terdaftar di sekolah yang sama.
  3. **Keanggotaan Ganda**: Satu siswa tidak boleh memiliki lebih dari satu keanggotaan kelas aktif (status `ACTIVE`) pada tahun ajaran yang sama.
  4. **Pendaftaran Duplikat**: Mengunggah siswa yang sama ke kelas yang sama berulang kali di dalam file Excel atau dengan yang sudah ada di DB akan ditolak.

---

## 3. Otorisasi & RBAC Matrix

Operasi import ini dilindungi oleh otentikasi JWT dan pengecekan peran (RBAC).

| Endpoint | SuperAdmin | SchoolAdmin | Principal | HomeroomTeacher | Teacher | Student |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| `POST /import/upload` | ✅ | ✅ | ✅ | ❌ (403) | ❌ (403) | ❌ (403) |
| `POST /import/preview` | ✅ | ✅ | ✅ | ❌ (403) | ❌ (403) | ❌ (403) |
| `POST /import/teachers` | ✅ | ✅ | ✅ | ❌ (403) | ❌ (403) | ❌ (403) |
| `POST /import/students` | ✅ | ✅ | ✅ | ❌ (403) | ❌ (403) | ❌ (403) |
| `POST /import/classes` | ✅ | ✅ | ✅ | ❌ (403) | ❌ (403) | ❌ (403) |
| `POST /import/subjects` | ✅ | ✅ | ✅ | ❌ (403) | ❌ (403) | ❌ (403) |
| `POST /import/class-members` | ✅ | ✅ | ✅ | ❌ (403) | ❌ (403) | ❌ (403) |
| `GET /import/templates/:type` | ✅ | ✅ | ✅ | ❌ (403) | ❌ (403) | ❌ (403) |

---

## 4. REST API Endpoint Details

### 1. Unggah Verifikasi File Excel
Memeriksa ukuran berkas dan ekstensi file.
- **URL**: `POST /import/upload`
- **Headers**:
  - `Authorization: Bearer <jwt-token>`
  - `x-school-id: <school-id>`
- **Content-Type**: `multipart/form-data`
- **Request Body**:
  - `file`: Berkas Excel (`.xlsx`/`.xls`)
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Berkas Excel valid",
    "fileName": "daftar-siswa.xlsx",
    "fileSize": 15420
  }
  ```

---

### 2. Preview File Excel
Menganalisis baris data tanpa menyimpannya ke database.
- **URL**: `POST /import/preview`
- **Headers**: Same as above
- **Content-Type**: `multipart/form-data`
- **Request Body**:
  - `file`: Berkas Excel
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "validRows": 120,
      "invalidRows": 2,
      "errors": [
        {
          "row": 4,
          "column": "gender",
          "reason": "Gender harus L atau P"
        },
        {
          "row": 15,
          "column": "nisn",
          "reason": "NISN maksimal 10 karakter"
        }
      ]
    }
  }
  ```

---

### 3. Eksekusi Import
Mengimpor data ke database. Jika ada baris yang tidak lolos validasi bisnis, server mengembalikan status **400 Bad Request** disertai daftar error per baris lengkap dengan nomor baris dan nama kolom.

- **Endpoints**:
  - `POST /import/teachers`
  - `POST /import/students`
  - `POST /import/classes`
  - `POST /import/subjects`
  - `POST /import/class-members`
- **Headers**: Same as above
- **Content-Type**: `multipart/form-data`
- **Request Body**:
  - `file`: Berkas Excel
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Import siswa berhasil",
    "importedRows": 120
  }
  ```
- **Error Validation Response (400 Bad Request)**:
  ```json
  {
    "success": false,
    "errors": [
      {
        "row": 3,
        "column": "nis",
        "reason": "NIS sudah digunakan di sekolah ini"
      }
    ]
  }
  ```

---

### 4. Unduh Template Excel Kosong
Mendapatkan file Excel template kosong dengan baris header yang siap diisi.
- **URL**: `GET /import/templates/:type`
  - `:type` dapat berupa: `students`, `teachers`, `classes`, `subjects`, `class-members`
- **Headers**: Same as above
- **Success Response (200 OK)**:
  - **Content-Type**: `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
  - **Content-Disposition**: `attachment; filename="template-<type>.xlsx"`
  - **Body**: Stream biner file Excel.

---

## 5. Log Audit

Setiap operasi import yang berhasil akan secara otomatis mencatat riwayat ke tabel `audit_logs` dengan struktur payload:
- `schoolId`: ID Sekolah yang bersangkutan.
- `userId`: ID Pengguna (admin/principal/superadmin) yang memicu aksi.
- `action`: Aksi spesifik (`IMPORT_TEACHERS`, `IMPORT_STUDENTS`, `IMPORT_CLASSES`, `IMPORT_SUBJECTS`, atau `IMPORT_CLASS_MEMBERS`).
- `tableName`: Nama tabel target (`teachers`, `students`, `classes`, `subjects`, atau `class_members`).
- `newValues`: Menyimpan properti `{ "rowCount": <jumlah_baris_berhasil> }`.
