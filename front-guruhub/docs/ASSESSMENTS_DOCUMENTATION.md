# Dokumentasi Modul Assessment (Penilaian Siswa) GuruHub

Modul ini mengimplementasikan pencatatan penilaian siswa sesuai dengan **Kurikulum Merdeka**, lengkap dengan pengaturan batas nilai maksimal, input nilai massal siswa, penegakan **Tenant Isolation** berbasis `school_id`, otorisasi peran (**RBAC**), validasi input TypeBox, dan dukungan **Soft Delete**.

---

## A. Spesifikasi & Endpoint API

Seluruh endpoint pada modul ini berada di bawah awalan rute `/assessments`.
Setiap request wajib menyertakan header berikut:
*   `x-school-id`: ID Sekolah (Tenant)
*   `Authorization`: `Bearer <accessToken>`

### 1. GET /assessments (Ambil Daftar Asesmen)
Mengambil daftar asesmen yang aktif (tidak di-soft-delete) milik sekolah tersebut.
*   **Akses**: SuperAdmin, SchoolAdmin, Principal, Teacher, HomeroomTeacher.
    *   *Catatan*: Pengguna dengan peran `Teacher` atau `HomeroomTeacher` hanya akan mendapatkan daftar asesmen milik mereka sendiri.
*   **Filter Query**:
    *   `classId` (number, opsional)
    *   `subjectId` (number, opsional)
    *   `teacherId` (number, opsional)
    *   `assessmentType` (enum: `"DAILY_TEST"`, `"ASSIGNMENT"`, `"PROJECT"`, `"PRACTICAL"`, `"MIDTERM"`, `"FINAL"`, opsional)
    *   `academicYearId` (number, opsional)
*   **Contoh Request**:
    ```bash
    curl -X GET "http://localhost:3000/assessments?classId=1&assessmentType=DAILY_TEST" \
      -H "x-school-id: 1" \
      -H "Authorization: Bearer <accessToken>"
    ```
*   **Contoh Response Sukses (200 OK)**:
    ```json
    {
      "success": true,
      "message": "Daftar asesmen berhasil diambil",
      "data": [
        {
          "id": 1,
          "schoolId": 1,
          "classId": 1,
          "subjectId": 1,
          "teacherId": 1,
          "academicYearId": 1,
          "title": "Kuis Fisika Gerak Lurus",
          "description": "Materi GLB & GLBB",
          "assessmentType": "DAILY_TEST",
          "assessmentDate": "2026-06-16",
          "maxScore": 100,
          "createdAt": "2026-06-16T12:00:00.000Z",
          "updatedAt": "2026-06-16T12:00:00.000Z",
          "deletedAt": null
        }
      ]
    }
    ```

---

### 2. GET /assessments/:id (Detail Asesmen Beserta Seluruh Nilai)
Mengambil rincian asesmen beserta daftar nilai seluruh siswa yang terdaftar.
*   **Akses**: SuperAdmin, SchoolAdmin, Principal, Teacher (pemilik asesmen), HomeroomTeacher (pemilik asesmen).
*   **Contoh Request**:
    ```bash
    curl -X GET http://localhost:3000/assessments/1 \
      -H "x-school-id: 1" \
      -H "Authorization: Bearer <accessToken>"
    ```
*   **Contoh Response Sukses (200 OK)**:
    ```json
    {
      "success": true,
      "message": "Detail asesmen berhasil diambil",
      "data": {
        "id": 1,
        "schoolId": 1,
        "classId": 1,
        "subjectId": 1,
        "teacherId": 1,
        "academicYearId": 1,
        "title": "Kuis Fisika Gerak Lurus",
        "description": "Materi GLB & GLBB",
        "assessmentType": "DAILY_TEST",
        "assessmentDate": "2026-06-16",
        "maxScore": 100,
        "createdAt": "2026-06-16T12:00:00.000Z",
        "updatedAt": "2026-06-16T12:00:00.000Z",
        "deletedAt": null,
        "scores": [
          {
            "id": 1,
            "studentId": 1,
            "studentName": "Siswa Satu",
            "score": 85,
            "notes": "Kerja bagus",
            "createdAt": "2026-06-16T12:05:00.000Z",
            "updatedAt": "2026-06-16T12:05:00.000Z"
          }
        ]
      }
    }
    ```

---

### 3. POST /assessments (Buat Asesmen Baru)
Membuat data asesmen baru untuk kelas dan mata pelajaran tertentu.
*   **Akses**: SuperAdmin, SchoolAdmin, Principal, Teacher.
*   **Input Body (JSON)**:
    *   `classId` (number, wajib)
    *   `subjectId` (number, wajib)
    *   `teacherId` (number, wajib)
    *   `academicYearId` (number, wajib)
    *   `title` (string, wajib, max 255 karakter)
    *   `description` (string, opsional/nullable)
    *   `assessmentType` (enum: `"DAILY_TEST"`, `"ASSIGNMENT"`, `"PROJECT"`, `"PRACTICAL"`, `"MIDTERM"`, `"FINAL"`, wajib)
    *   `assessmentDate` (string, wajib, format YYYY-MM-DD)
    *   `maxScore` (number, wajib, harus > 0)
*   **Aturan Validasi**:
    1.  `classId`, `subjectId`, `teacherId`, dan `academicYearId` harus terdaftar di sekolah yang sama (Tenant Isolation).
    2.  Jika pengguna adalah `Teacher`, nilai `teacherId` harus sesuai dengan profil guru miliknya sendiri.
    3.  Batas nilai maksimal (`maxScore`) harus lebih besar dari 0.
*   **Contoh Request**:
    ```bash
    curl -X POST http://localhost:3000/assessments \
      -H "Content-Type: application/json" \
      -H "x-school-id: 1" \
      -H "Authorization: Bearer <accessToken>" \
      -d '{
        "classId": 1,
        "subjectId": 1,
        "teacherId": 1,
        "academicYearId": 1,
        "title": "Kuis Fisika Gerak Lurus",
        "description": "Materi GLB & GLBB",
        "assessmentType": "DAILY_TEST",
        "assessmentDate": "2026-06-16",
        "maxScore": 100
      }'
    ```

---

### 4. PUT /assessments/:id (Pembaruan Asesmen)
Memperbarui informasi pada asesmen yang sudah ada.
*   **Akses**: SuperAdmin, SchoolAdmin, Principal, Teacher (hanya untuk asesmen miliknya sendiri).
*   **Input Body (JSON)**: Seluruh field opsional.
*   **Aturan Validasi**:
    1.  Jika memperbarui batas nilai maksimal (`maxScore`), nilai baru tidak boleh lebih kecil dari nilai siswa yang sudah tercatat.
*   **Contoh Request**:
    ```bash
    curl -X PUT http://localhost:3000/assessments/1 \
      -H "Content-Type: application/json" \
      -H "x-school-id: 1" \
      -H "Authorization: Bearer <accessToken>" \
      -d '{
        "title": "Kuis Fisika Gerak Lurus (Pembaruan)",
        "maxScore": 100
      }'
    ```

---

### 5. DELETE /assessments/:id (Hapus Asesmen / Soft Delete)
Melakukan penghapusan logis (*soft delete*) dengan memperbarui kolom `deleted_at` pada database untuk data asesmen terkait.
*   **Akses**: SuperAdmin, SchoolAdmin, Principal.
    *   *Catatan*: Pengguna dengan peran `Teacher` tidak dapat menghapus data asesmen.
*   **Contoh Request**:
    ```bash
    curl -X DELETE http://localhost:3000/assessments/1 \
      -H "x-school-id: 1" \
      -H "Authorization: Bearer <accessToken>"
    ```

---

### 6. POST /assessments/:id/scores (Input & Perbarui Nilai Siswa)
Memasukkan atau memperbarui nilai siswa secara massal untuk asesmen tertentu.
*   **Akses**: SuperAdmin, SchoolAdmin, Principal, Teacher (hanya untuk asesmen miliknya sendiri).
*   **Input Body (JSON)**:
    *   `scores` (array, wajib):
        *   `studentId` (number, wajib)
        *   `score` (number, wajib, tidak boleh < 0 atau melebihi `maxScore` asesmen)
        *   `notes` (string, opsional/nullable)
*   **Aturan Validasi**:
    1.  Siswa yang dinilai harus berstatus **ACTIVE** pada keanggotaan kelas (`class_members`) di kelas asesmen ini.
    2.  Siswa tidak boleh berasal dari kelas lain.
    3.  Nilai tidak boleh melebihi `maxScore` asesmen.
*   **Contoh Request**:
    ```bash
    curl -X POST http://localhost:3000/assessments/1/scores \
      -H "Content-Type: application/json" \
      -H "x-school-id: 1" \
      -H "Authorization: Bearer <accessToken>" \
      -d '{
        "scores": [
          { "studentId": 1, "score": 95, "notes": "Kinerja luar biasa!" }
        ]
      }'
    ```

---

## B. Pengujian Menggunakan Bun Runner

Anda dapat menjalankan pengujian otomatis di `tests/assessments.test.ts` dengan perintah:
```bash
bun test tests/assessments.test.ts
```

Pengujian ini memvalidasi **20 skenario uji kasus utama** yang mencakup seluruh aturan otorisasi peran (RBAC), batas nilai maksimal, isolasi tenant (Multi-tenant), soft delete lifecycle, dan validasi keanggotaan kelas aktif siswa.
