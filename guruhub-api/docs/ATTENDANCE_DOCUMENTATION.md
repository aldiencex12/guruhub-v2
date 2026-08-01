# Dokumentasi Modul Attendance (Absensi Siswa) GuruHub

Modul ini mengimplementasikan pencatatan kehadiran/absensi siswa oleh guru berdasarkan jadwal pelajaran, dilengkapi dengan penegakan **Tenant Isolation** berbasis `school_id`, otorisasi peran (**RBAC**), validasi input TypeBox, dan dukungan **Soft Delete**.

---

## A. Spesifikasi & Endpoint API

Seluruh endpoint pada modul ini berada di bawah awalan rute `/attendances`.
Setiap request wajib menyertakan header berikut:
*   `x-school-id`: ID Sekolah (Tenant)
*   `Authorization`: `Bearer <accessToken>`

### 1. GET /attendances (Ambil Daftar Absensi)
Mengambil daftar riwayat absensi yang aktif (tidak di-soft-delete) milik sekolah tersebut. Dapat difilter berdasarkan kelas, guru, atau tanggal.
*   **Akses**: SuperAdmin, SchoolAdmin, Principal, Teacher, HomeroomTeacher.
*   **Filter Query**:
    *   `classId` (number, opsional)
    *   `teacherId` (number, opsional)
    *   `date` (string format YYYY-MM-DD, opsional)
*   **Contoh Request**:
    ```bash
    curl -X GET "http://localhost:3000/attendances?classId=1" \
      -H "x-school-id: 1" \
      -H "Authorization: Bearer <accessToken>"
    ```
*   **Contoh Response Sukses (200 OK)**:
    ```json
    {
      "success": true,
      "message": "Daftar absensi berhasil diambil",
      "data": [
        {
          "id": 1,
          "schoolId": 1,
          "scheduleId": 1,
          "teacherId": 1,
          "attendanceDate": "2026-06-15",
          "notes": "Pertemuan pertama",
          "createdAt": "2026-06-15T16:10:00.000Z",
          "updatedAt": "2026-06-15T16:10:00.000Z",
          "deletedAt": null
        }
      ]
    }
    ```

---

### 2. GET /attendances/:id (Detail Absensi Beserta Seluruh Siswa)
Mengambil detail absensi beserta daftar status kehadiran siswa yang tercatat.
*   **Akses**: SuperAdmin, SchoolAdmin, Principal, Teacher, HomeroomTeacher.
*   **Contoh Request**:
    ```bash
    curl -X GET http://localhost:3000/attendances/1 \
      -H "x-school-id: 1" \
      -H "Authorization: Bearer <accessToken>"
    ```
*   **Contoh Response Sukses (200 OK)**:
    ```json
    {
      "success": true,
      "message": "Detail absensi berhasil diambil",
      "data": {
        "id": 1,
        "schoolId": 1,
        "scheduleId": 1,
        "teacherId": 1,
        "attendanceDate": "2026-06-15",
        "notes": "Pertemuan pertama",
        "createdAt": "2026-06-15T16:10:00.000Z",
        "updatedAt": "2026-06-15T16:10:00.000Z",
        "deletedAt": null,
        "details": [
          {
            "id": 1,
            "studentId": 1,
            "studentName": "Siswa Aktif 1",
            "status": "PRESENT",
            "notes": null
          },
          {
            "id": 2,
            "studentId": 3,
            "studentName": "Siswa Aktif 2",
            "status": "SICK",
            "notes": "Sakit demam"
          }
        ]
      }
    }
    ```

---

### 3. POST /attendances (Buat Absensi Baru)
Membuat data absensi baru beserta status kehadiran setiap siswa.
*   **Akses**: SuperAdmin, SchoolAdmin, Principal, Teacher (hanya diperbolehkan untuk jadwal mengajar miliknya sendiri).
*   **Input Body (JSON)**:
    *   `scheduleId` (number, wajib)
    *   `attendanceDate` (string, wajib, format YYYY-MM-DD)
    *   `notes` (string, opsional)
    *   `details` (array, wajib):
        *   `studentId` (number, wajib)
        *   `status` (enum: `"PRESENT"`, `"SICK"`, `"PERMISSION"`, `"ABSENT"`, wajib)
        *   `notes` (string, opsional)
*   **Aturan Validasi**:
    1.  `scheduleId` harus berada di sekolah yang sama.
    2.  Jika user adalah `Teacher`, `teacher_id` pada jadwal harus cocok dengan profil guru miliknya.
    3.  Tidak boleh ada absensi ganda (kombinasi `scheduleId` + `attendanceDate` harus unik).
    4.  Seluruh `studentId` wajib terdaftar di kelas jadwal tersebut dan berstatus aktif (tidak di-soft-delete).
*   **Contoh Request**:
    ```bash
    curl -X POST http://localhost:3000/attendances \
      -H "Content-Type: application/json" \
      -H "x-school-id: 1" \
      -H "Authorization: Bearer <accessToken>" \
      -d '{
        "scheduleId": 1,
        "attendanceDate": "2026-06-15",
        "notes": "Pertemuan pertama",
        "details": [
          { "studentId": 1, "status": "PRESENT" },
          { "studentId": 3, "status": "SICK", "notes": "Sakit demam" }
        ]
      }'
    ```
*   **Contoh Response Sukses (200 OK)**:
    ```json
    {
      "success": true,
      "message": "Absensi berhasil disimpan",
      "data": {
        "id": 1,
        "schoolId": 1,
        "scheduleId": 1,
        "teacherId": 1,
        "attendanceDate": "2026-06-15",
        "notes": "Pertemuan pertama",
        "createdAt": "2026-06-15T16:10:00.000Z",
        "updatedAt": "2026-06-15T16:10:00.000Z",
        "deletedAt": null
      }
    }
    ```

---

### 4. PUT /attendances/:id (Pembaruan Absensi)
Memperbarui catatan absensi atau mengubah status kehadiran siswa pada absensi tertentu.
*   **Akses**: SuperAdmin, SchoolAdmin, Principal, Teacher (hanya untuk jadwal miliknya).
*   **Input Body (JSON)**:
    *   `notes` (string, opsional)
    *   `details` (array, opsional): list data `studentId`, `status`, dan `notes` siswa yang ingin diperbarui.
*   **Contoh Request**:
    ```bash
    curl -X PUT http://localhost:3000/attendances/1 \
      -H "Content-Type: application/json" \
      -H "x-school-id: 1" \
      -H "Authorization: Bearer <accessToken>" \
      -d '{
        "notes": "Pertemuan pertama - Catatan Diperbarui",
        "details": [
          { "studentId": 3, "status": "PRESENT" }
        ]
      }'
    ```
*   **Contoh Response Sukses (200 OK)**:
    ```json
    {
      "success": true,
      "message": "Absensi berhasil diperbarui",
      "data": {
        "id": 1,
        "schoolId": 1,
        "scheduleId": 1,
        "teacherId": 1,
        "attendanceDate": "2026-06-15",
        "notes": "Pertemuan pertama - Catatan Diperbarui",
        "createdAt": "2026-06-15T16:10:00.000Z",
        "updatedAt": "2026-06-15T16:10:05.000Z",
        "deletedAt": null
      }
    }
    ```

---

### 5. DELETE /attendances/:id (Hapus Absensi / Soft Delete)
Melakukan penghapusan logis (soft delete) dengan mengisi kolom `deleted_at` pada database untuk record absensi terkait.
*   **Akses**: SuperAdmin, SchoolAdmin, Principal, Teacher (hanya untuk jadwal miliknya).
*   **Contoh Request**:
    ```bash
    curl -X DELETE http://localhost:3000/attendances/1 \
      -H "x-school-id: 1" \
      -H "Authorization: Bearer <accessToken>"
    ```
*   **Contoh Response Sukses (200 OK)**:
    ```json
    {
      "success": true,
      "message": "Absensi berhasil dihapus"
    }
    ```

---

## B. Pengujian Menggunakan Bun Runner
Anda dapat menjalankan pengujian otomatis di `tests/attendance.test.ts` dengan perintah:
```bash
bun test tests/attendance.test.ts
```
Pengujian ini mencakup 15 skenario kasus uji yang memvalidasi otorisasi RBAC, isolasi tenant (Multi-tenant), penanganan bentrok ganda, validasi siswa kelas, hak akses khusus guru, serta kemampuan Admin dan Principal mengelola absensi.
