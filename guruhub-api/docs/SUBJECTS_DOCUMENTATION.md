# Dokumentasi Modul Subjects GuruHub

Modul ini mengimplementasikan pengelolaan data Mata Pelajaran (CRUD) dengan penegakan **Tenant Isolation** berbasis `school_id`, otorisasi peran (**RBAC**), validasi input TypeBox, dan dukungan **Soft Delete** serta verifikasi status keaktifan mata pelajaran.

---

## A. Spesifikasi & Endpoint API

Seluruh endpoint pada modul ini berada di bawah awalan rute `/subjects`.
Setiap request wajib menyertakan header berikut:
*   `x-school-id`: ID Sekolah (Tenant)
*   `Authorization`: `Bearer <accessToken>`

### 1. GET /subjects (Ambil Semua Mata Pelajaran)
Mengambil daftar mata pelajaran yang aktif (tidak di-soft-delete) milik sekolah tersebut.
*   **Akses**: Semua user terautentikasi (SuperAdmin, SchoolAdmin, Principal, Teacher, HomeroomTeacher, Student).
*   **Contoh Request**:
    ```bash
    curl -X GET http://localhost:3000/subjects \
      -H "x-school-id: 1" \
      -H "Authorization: Bearer <accessToken>"
    ```
*   **Contoh Response Sukses (200 OK)**:
    ```json
    {
      "success": true,
      "message": "Daftar mata pelajaran berhasil diambil",
      "data": [
        {
          "id": 1,
          "schoolId": 1,
          "name": "Informatika",
          "code": "INF-7",
          "gradeLevel": "7",
          "description": "Dasar-dasar pemrograman dan logika",
          "status": "Aktif",
          "deletedAt": null,
          "createdAt": "2026-06-15T15:51:00.000Z",
          "updatedAt": "2026-06-15T15:51:00.000Z"
        }
      ]
    }
    ```

---

### 2. GET /subjects/:id (Detail Mata Pelajaran)
Mengambil detail informasi mata pelajaran berdasarkan ID.
*   **Akses**: Semua user terautentikasi di tenant tersebut.
*   **Contoh Request**:
    ```bash
    curl -X GET http://localhost:3000/subjects/1 \
      -H "x-school-id: 1" \
      -H "Authorization: Bearer <accessToken>"
    ```
*   **Contoh Response Sukses (200 OK)**:
    ```json
    {
      "success": true,
      "message": "Detail mata pelajaran berhasil diambil",
      "data": {
        "id": 1,
        "schoolId": 1,
        "name": "Informatika",
        "code": "INF-7",
        "gradeLevel": "7",
        "description": "Dasar-dasar pemrograman dan logika",
        "status": "Aktif",
        "deletedAt": null,
        "createdAt": "2026-06-15T15:51:00.000Z",
        "updatedAt": "2026-06-15T15:51:00.000Z"
      }
    }
    ```

---

### 3. POST /subjects (Tambah Mata Pelajaran)
Menambahkan data mata pelajaran baru ke sekolah.
*   **Akses**: SchoolAdmin, Principal, SuperAdmin.
*   **Input Body (JSON)**:
    *   `name` (string, wajib, 1-100 karakter, contoh: "Informatika")
    *   `code` (string, wajib, 1-20 karakter, contoh: "INF-7")
    *   `gradeLevel` (enum: "7" | "8" | "9" | "10" | "11" | "12", wajib)
    *   `description` (string, opsional)
    *   `status` (enum: "Aktif" / "Nonaktif", opsional, default: "Aktif")
*   **Contoh Request**:
    ```bash
    curl -X POST http://localhost:3000/subjects \
      -H "Content-Type: application/json" \
      -H "x-school-id: 1" \
      -H "Authorization: Bearer <accessToken>" \
      -d '{
        "code": "INF-7",
        "name": "Informatika",
        "gradeLevel": "7",
        "description": "Dasar-dasar pemrograman dan logika"
      }'
    ```
*   **Contoh Response Sukses (200 OK)**:
    ```json
    {
      "success": true,
      "message": "Mata pelajaran berhasil ditambahkan",
      "data": {
        "id": 1,
        "schoolId": 1,
        "name": "Informatika",
        "code": "INF-7",
        "gradeLevel": "7",
        "description": "Dasar-dasar pemrograman dan logika",
        "status": "Aktif",
        "deletedAt": null,
        "createdAt": "2026-06-15T15:51:00.000Z",
        "updatedAt": "2026-06-15T15:51:00.000Z"
      }
    }
    ```
*   **Contoh Response Gagal - Kode Mapel Duplikat (409 Conflict)**:
    ```json
    {
      "success": false,
      "error": "Kode mata pelajaran sudah terdaftar di sekolah ini"
    }
    ```

---

### 4. PUT /subjects/:id (Pembaruan Mata Pelajaran)
Memperbarui informasi data mata pelajaran berdasarkan ID.
*   **Akses**: SchoolAdmin, Principal, SuperAdmin.
*   **Input Body (JSON)**: Parsial (sama dengan Create)
*   **Contoh Request**:
    ```bash
    curl -X PUT http://localhost:3000/subjects/1 \
      -H "Content-Type: application/json" \
      -H "x-school-id: 1" \
      -H "Authorization: Bearer <accessToken>" \
      -d '{
        "name": "Informatika Dasar",
        "status": "Nonaktif"
      }'
    ```
*   **Contoh Response Sukses (200 OK)**:
    ```json
    {
      "success": true,
      "message": "Data mata pelajaran berhasil diperbarui",
      "data": {
        "id": 1,
        "schoolId": 1,
        "name": "Informatika Dasar",
        "code": "INF-7",
        "gradeLevel": "7",
        "description": "Dasar-dasar pemrograman dan logika",
        "status": "Nonaktif",
        "deletedAt": null,
        "createdAt": "2026-06-15T15:51:00.000Z",
        "updatedAt": "2026-06-15T15:51:05.000Z"
      }
    }
    ```

---

### 5. DELETE /subjects/:id (Hapus Mata Pelajaran / Soft Delete)
Melakukan penghapusan logis (soft delete) dengan mengisi kolom `deleted_at` pada database.
*   **Akses**: SchoolAdmin, Principal, SuperAdmin.
*   **Contoh Request**:
    ```bash
    curl -X DELETE http://localhost:3000/subjects/1 \
      -H "x-school-id: 1" \
      -H "Authorization: Bearer <accessToken>"
    ```
*   **Contoh Response Sukses (200 OK)**:
    ```json
    {
      "success": true,
      "message": "Mata pelajaran berhasil dihapus"
    }
    ```

---

## B. Pengujian Menggunakan Bun Runner
Anda dapat menjalankan pengujian otomatis di `tests/subjects.test.ts` dengan:
```bash
bun test tests/subjects.test.ts
```
Laporan pengujian akan secara otomatis memvalidasi seluruh fungsionalitas CRUD, soft delete, otorisasi RBAC, dan tenant isolation.
