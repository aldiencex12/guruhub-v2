# Dokumentasi Modul Teaching Journal (Jurnal Mengajar Guru) GuruHub

Modul ini mengimplementasikan pencatatan jurnal mengajar oleh guru setelah selesai melaksanakan pembelajaran berdasarkan jadwal pelajaran (`schedules`). Modul ini dirancang dengan arsitektur bersih (**Clean Architecture**), otorisasi peran (**RBAC**), penegakan **Tenant Isolation** berbasis `school_id`, serta validasi input TypeBox dan dukungan **Soft Delete**.

---

## A. Spesifikasi & Endpoint API

Seluruh endpoint pada modul ini berada di bawah awalan rute `/teaching-journals`.
Setiap request wajib menyertakan header berikut:
*   `x-school-id`: ID Sekolah (Tenant)
*   `Authorization`: `Bearer <accessToken>`

### 1. GET /teaching-journals (Ambil Daftar Jurnal Mengajar)
Mengambil daftar riwayat jurnal mengajar yang aktif (tidak di-soft-delete) milik sekolah tersebut.
*   **Akses**: SuperAdmin, SchoolAdmin, Principal, Teacher, HomeroomTeacher.
    *   *Catatan*: Pengguna dengan peran `Teacher` atau `HomeroomTeacher` hanya akan mendapatkan daftar jurnal miliknya sendiri.
*   **Filter Query**:
    *   `teacherId` (number, opsional)
    *   `classId` (number, opsional)
    *   `subjectId` (number, opsional)
    *   `journalDate` (string format YYYY-MM-DD, opsional)
*   **Contoh Request**:
    ```bash
    curl -X GET "http://localhost:3000/teaching-journals?classId=1" \
      -H "x-school-id: 1" \
      -H "Authorization: Bearer <accessToken>"
    ```
*   **Contoh Response Sukses (200 OK)**:
    ```json
    {
      "success": true,
      "message": "Daftar jurnal mengajar berhasil diambil",
      "data": [
        {
          "id": 1,
          "schoolId": 1,
          "scheduleId": 1,
          "teacherId": 1,
          "attendanceId": 1,
          "journalDate": "2026-06-16",
          "topic": "Aljabar Linear",
          "learningObjectives": "Siswa memahami matriks eselon baris terreduksi",
          "teachingMethod": "Ceramah & Diskusi",
          "reflection": "Siswa tampak antusias, beberapa kesulitan di operasi baris elementer",
          "notes": "Andi izin sakit",
          "createdAt": "2026-06-16T12:00:00.000Z",
          "updatedAt": "2026-06-16T12:00:00.000Z",
          "deletedAt": null
        }
      ]
    }
    ```

---

### 2. GET /teaching-journals/:id (Detail Jurnal Mengajar)
Mengambil detail dari jurnal mengajar tertentu berdasarkan ID.
*   **Akses**: SuperAdmin, SchoolAdmin, Principal, Teacher (pemilik jurnal), HomeroomTeacher (pemilik jurnal).
*   **Contoh Request**:
    ```bash
    curl -X GET http://localhost:3000/teaching-journals/1 \
      -H "x-school-id: 1" \
      -H "Authorization: Bearer <accessToken>"
    ```
*   **Contoh Response Sukses (200 OK)**:
    ```json
    {
      "success": true,
      "message": "Detail jurnal mengajar berhasil diambil",
      "data": {
        "id": 1,
        "schoolId": 1,
        "scheduleId": 1,
        "teacherId": 1,
        "attendanceId": 1,
        "journalDate": "2026-06-16",
        "topic": "Aljabar Linear",
        "learningObjectives": "Siswa memahami matriks eselon baris terreduksi",
        "teachingMethod": "Ceramah & Diskusi",
        "reflection": "Siswa tampak antusias, beberapa kesulitan di operasi baris elementer",
        "notes": "Andi izin sakit",
        "createdAt": "2026-06-16T12:00:00.000Z",
        "updatedAt": "2026-06-16T12:00:00.000Z",
        "deletedAt": null
      }
    }
    ```

---

### 3. POST /teaching-journals (Buat Jurnal Mengajar Baru)
Membuat data jurnal mengajar baru setelah proses pembelajaran selesai dilaksanakan.
*   **Akses**: SuperAdmin, SchoolAdmin, Principal, Teacher.
*   **Input Body (JSON)**:
    *   `scheduleId` (number, wajib)
    *   `teacherId` (number, wajib)
    *   `attendanceId` (number, opsional/nullable)
    *   `journalDate` (string, wajib, format YYYY-MM-DD)
    *   `topic` (string, wajib, max 255 karakter)
    *   `learningObjectives` (string, wajib)
    *   `teachingMethod` (string, wajib, max 255 karakter)
    *   `reflection` (string, opsional/nullable)
    *   `notes` (string, opsional/nullable)
*   **Aturan Validasi Bisnis**:
    1.  `scheduleId` harus berada di sekolah yang sama.
    2.  `teacherId` harus sama dengan guru yang dijadwalkan pada `schedule`.
    3.  Tidak boleh ada jurnal ganda (kombinasi `scheduleId` + `journalDate` harus unik).
    4.  Jika pengguna adalah `Teacher`, ia hanya boleh membuat jurnal atas nama dirinya sendiri dan jadwal mengajar miliknya.
    5.  Jika menyertakan `attendanceId`, data absensi tersebut harus valid dan berasal dari tenant sekolah yang sama.
*   **Contoh Request**:
    ```bash
    curl -X POST http://localhost:3000/teaching-journals \
      -H "Content-Type: application/json" \
      -H "x-school-id: 1" \
      -H "Authorization: Bearer <accessToken>" \
      -d '{
        "scheduleId": 1,
        "teacherId": 1,
        "attendanceId": 1,
        "journalDate": "2026-06-16",
        "topic": "Aljabar Linear",
        "learningObjectives": "Siswa memahami matriks eselon baris terreduksi",
        "teachingMethod": "Ceramah & Diskusi",
        "reflection": "Siswa tampak antusias, beberapa kesulitan di operasi baris elementer",
        "notes": "Andi izin sakit"
      }'
    ```
*   **Contoh Response Sukses (200 OK)**:
    ```json
    {
      "success": true,
      "message": "Jurnal mengajar berhasil dibuat",
      "data": {
        "id": 1,
        "schoolId": 1,
        "scheduleId": 1,
        "teacherId": 1,
        "attendanceId": 1,
        "journalDate": "2026-06-16",
        "topic": "Aljabar Linear",
        "learningObjectives": "Siswa memahami matriks eselon baris terreduksi",
        "teachingMethod": "Ceramah & Diskusi",
        "reflection": "Siswa tampak antusias, beberapa kesulitan di operasi baris elementer",
        "notes": "Andi izin sakit",
        "createdAt": "2026-06-16T12:00:00.000Z",
        "updatedAt": "2026-06-16T12:00:00.000Z",
        "deletedAt": null
      }
    }
    ```

---

### 4. PUT /teaching-journals/:id (Pembaruan Jurnal Mengajar)
Memperbarui informasi di jurnal mengajar yang sudah dibuat.
*   **Akses**: SuperAdmin, SchoolAdmin, Principal, Teacher (hanya untuk jurnal miliknya sendiri).
*   **Input Body (JSON)**: Seluruh field bersifat opsional (menggunakan TypeBox `t.Partial`).
*   **Contoh Request**:
    ```bash
    curl -X PUT http://localhost:3000/teaching-journals/1 \
      -H "Content-Type: application/json" \
      -H "x-school-id: 1" \
      -H "Authorization: Bearer <accessToken>" \
      -d '{
        "topic": "Aljabar Linear (Updated)",
        "reflection": "Siswa sudah mulai mengerti"
      }'
    ```
*   **Contoh Response Sukses (200 OK)**:
    ```json
    {
      "success": true,
      "message": "Jurnal mengajar berhasil diperbarui",
      "data": {
        "id": 1,
        "schoolId": 1,
        "scheduleId": 1,
        "teacherId": 1,
        "attendanceId": 1,
        "journalDate": "2026-06-16",
        "topic": "Aljabar Linear (Updated)",
        "learningObjectives": "Siswa memahami matriks eselon baris terreduksi",
        "teachingMethod": "Ceramah & Diskusi",
        "reflection": "Siswa sudah mulai mengerti",
        "notes": "Andi izin sakit",
        "createdAt": "2026-06-16T12:00:00.000Z",
        "updatedAt": "2026-06-16T12:00:05.000Z",
        "deletedAt": null
      }
    }
    ```

---

### 5. DELETE /teaching-journals/:id (Hapus Jurnal Mengajar / Soft Delete)
Melakukan penghapusan logis (soft delete) dengan mengisi kolom `deleted_at` pada database untuk record jurnal mengajar terkait.
*   **Akses**: SuperAdmin, SchoolAdmin, Principal.
    *   *Catatan*: Pengguna dengan peran `Teacher` tidak dapat menghapus jurnal mengajar.
*   **Contoh Request**:
    ```bash
    curl -X DELETE http://localhost:3000/teaching-journals/1 \
      -H "x-school-id: 1" \
      -H "Authorization: Bearer <accessToken>"
    ```
*   **Contoh Response Sukses (200 OK)**:
    ```json
    {
      "success": true,
      "message": "Jurnal mengajar berhasil dihapus"
    }
    ```

---

## B. Pengujian Menggunakan Bun Runner

Anda dapat menjalankan pengujian otomatis di `tests/teaching-journals.test.ts` dengan perintah:
```bash
bun test tests/teaching-journals.test.ts
```

Pengujian ini mencakup 15 skenario kasus uji utama yang mencakup otorisasi peran (RBAC), pencegahan manipulasi jurnal guru lain, deteksi bentrok duplikat (scheduleId + journalDate), penegakan isolasi tenant sekolah (Multi-tenant), penanganan soft-delete, dan kewenangan Admin serta Principal dalam mengelola data.
