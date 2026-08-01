# Dokumentasi Modul Schedules GuruHub

Modul ini mengimplementasikan pengelolaan data Jadwal Pelajaran (CRUD) dengan penegakan **Tenant Isolation** berbasis `school_id`, otorisasi peran (**RBAC**), validasi input TypeBox, pencegahan bentrok jadwal (untuk guru & kelas), dan dukungan **Soft Delete**.

---

## A. Spesifikasi & Endpoint API

Seluruh endpoint pada modul ini berada di bawah awalan rute `/schedules`.
Setiap request wajib menyertakan header berikut:
*   `x-school-id`: ID Sekolah (Tenant)
*   `Authorization`: `Bearer <accessToken>`

### 1. GET /schedules (Ambil Semua Jadwal)
Mengambil daftar jadwal yang aktif (tidak di-soft-delete) milik sekolah tersebut.
*   **Akses**: Semua user terautentikasi (SuperAdmin, SchoolAdmin, Principal, Teacher, HomeroomTeacher, Student).
*   **Contoh Request**:
    ```bash
    curl -X GET http://localhost:3000/schedules \
      -H "x-school-id: 1" \
      -H "Authorization: Bearer <accessToken>"
    ```
*   **Contoh Response Sukses (200 OK)**:
    ```json
    {
      "success": true,
      "message": "Daftar jadwal pelajaran berhasil diambil",
      "data": [
        {
          "id": 1,
          "schoolId": 1,
          "classId": 3,
          "subjectId": 4,
          "teacherId": 5,
          "academicYearId": 1,
          "dayOfWeek": "Senin",
          "startTime": "07:00:00",
          "endTime": "08:20:00",
          "status": "Aktif",
          "deletedAt": null,
          "createdAt": "2026-06-15T15:54:00.000Z",
          "updatedAt": "2026-06-15T15:54:00.000Z"
        }
      ]
    }
    ```

---

### 2. GET /schedules/:id (Detail Jadwal)
Mengambil detail informasi jadwal pelajaran berdasarkan ID.
*   **Akses**: Semua user terautentikasi di tenant tersebut.
*   **Contoh Request**:
    ```bash
    curl -X GET http://localhost:3000/schedules/1 \
      -H "x-school-id: 1" \
      -H "Authorization: Bearer <accessToken>"
    ```
*   **Contoh Response Sukses (200 OK)**:
    ```json
    {
      "success": true,
      "message": "Detail jadwal pelajaran berhasil diambil",
      "data": {
        "id": 1,
        "schoolId": 1,
        "classId": 3,
        "subjectId": 4,
        "teacherId": 5,
        "academicYearId": 1,
        "dayOfWeek": "Senin",
        "startTime": "07:00:00",
        "endTime": "08:20:00",
        "status": "Aktif",
        "deletedAt": null,
        "createdAt": "2026-06-15T15:54:00.000Z",
        "updatedAt": "2026-06-15T15:54:00.000Z"
      }
    }
    ```

---

### 3. POST /schedules (Tambah Jadwal Pelajaran)
Menambahkan data jadwal pelajaran baru ke sekolah.
*   **Akses**: SchoolAdmin, Principal, SuperAdmin.
*   **Input Body (JSON)**:
    *   `classId` (number, wajib)
    *   `subjectId` (number, wajib)
    *   `teacherId` (number, wajib)
    *   `academicYearId` (number, wajib)
    *   `dayOfWeek` (enum: "Senin" | "Selasa" | "Rabu" | "Kamis" | "Jumat" | "Sabtu" | "Minggu", wajib)
    *   `startTime` (string, format HH:MM atau HH:MM:SS, wajib)
    *   `endTime` (string, format HH:MM atau HH:MM:SS, wajib)
    *   `status` (enum: "Aktif" / "Nonaktif", opsional, default: "Aktif")
*   **Contoh Request**:
    ```bash
    curl -X POST http://localhost:3000/schedules \
      -H "Content-Type: application/json" \
      -H "x-school-id: 1" \
      -H "Authorization: Bearer <accessToken>" \
      -d '{
        "classId": 3,
        "subjectId": 4,
        "teacherId": 5,
        "academicYearId": 1,
        "dayOfWeek": "Senin",
        "startTime": "07:00",
        "endTime": "08:20"
      }'
    ```
*   **Contoh Response Sukses (200 OK)**:
    ```json
    {
      "success": true,
      "message": "Jadwal pelajaran berhasil ditambahkan",
      "data": {
        "id": 1,
        "schoolId": 1,
        "classId": 3,
        "subjectId": 4,
        "teacherId": 5,
        "academicYearId": 1,
        "dayOfWeek": "Senin",
        "startTime": "07:00:00",
        "endTime": "08:20:00",
        "status": "Aktif",
        "deletedAt": null,
        "createdAt": "2026-06-15T15:54:00.000Z",
        "updatedAt": "2026-06-15T15:54:00.000Z"
      }
    }
    ```
*   **Contoh Response Gagal - Guru Sekolah Lain (400 Bad Request)**:
    ```json
    {
      "success": false,
      "error": "Guru harus terdaftar di sekolah yang sama"
    }
    ```
*   **Contoh Response Gagal - Bentrok Jadwal Guru (409 Conflict)**:
    ```json
    {
      "success": false,
      "error": "Guru tersebut sudah memiliki jadwal mengajar pada jam ini"
    }
    ```
*   **Contoh Response Gagal - Bentrok Jadwal Kelas (409 Conflict)**:
    ```json
    {
      "success": false,
      "error": "Kelas tersebut sudah memiliki jadwal pelajaran lain pada jam ini"
    }
    ```

---

### 4. PUT /schedules/:id (Pembaruan Jadwal Pelajaran)
Memperbarui informasi data jadwal pelajaran berdasarkan ID.
*   **Akses**: SchoolAdmin, Principal, SuperAdmin.
*   **Input Body (JSON)**: Parsial (sama dengan Create)
*   **Contoh Request**:
    ```bash
    curl -X PUT http://localhost:3000/schedules/1 \
      -H "Content-Type: application/json" \
      -H "x-school-id: 1" \
      -H "Authorization: Bearer <accessToken>" \
      -d '{
        "startTime": "09:00",
        "endTime": "10:20"
      }'
    ```
*   **Contoh Response Sukses (200 OK)**:
    ```json
    {
      "success": true,
      "message": "Jadwal pelajaran berhasil diperbarui",
      "data": {
        "id": 1,
        "schoolId": 1,
        "classId": 3,
        "subjectId": 4,
        "teacherId": 5,
        "academicYearId": 1,
        "dayOfWeek": "Senin",
        "startTime": "09:00:00",
        "endTime": "10:20:00",
        "status": "Aktif",
        "deletedAt": null,
        "createdAt": "2026-06-15T15:54:00.000Z",
        "updatedAt": "2026-06-15T15:54:05.000Z"
      }
    }
    ```

---

### 5. DELETE /schedules/:id (Hapus Jadwal / Soft Delete)
Melakukan penghapusan logis (soft delete) dengan mengisi kolom `deleted_at` pada database.
*   **Akses**: SchoolAdmin, Principal, SuperAdmin.
*   **Contoh Request**:
    ```bash
    curl -X DELETE http://localhost:3000/schedules/1 \
      -H "x-school-id: 1" \
      -H "Authorization: Bearer <accessToken>"
    ```
*   **Contoh Response Sukses (200 OK)**:
    ```json
    {
      "success": true,
      "message": "Jadwal pelajaran berhasil dihapus"
    }
    ```

---

## B. Pengujian Menggunakan Bun Runner
Anda dapat menjalankan pengujian otomatis di `tests/schedules.test.ts` dengan:
```bash
bun test tests/schedules.test.ts
```
Laporan pengujian akan secara otomatis memvalidasi seluruh fungsionalitas CRUD, soft delete, otorisasi RBAC, tenant isolation, dan deteksi tumpang tindih waktu.
