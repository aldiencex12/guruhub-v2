# Dokumentasi Modul Students GuruHub

Modul ini mengimplementasikan pengelolaan data Siswa (CRUD) dengan penegakan **Tenant Isolation** berbasis `school_id`, otorisasi peran (**RBAC**), validasi input TypeBox, dan dukungan **Soft Delete** serta verifikasi status keaktifan.

---

## A. Spesifikasi & Endpoint API

Seluruh endpoint pada modul ini berada di bawah awalan rute `/students`.
Setiap request wajib menyertakan header berikut:
*   `x-school-id`: ID Sekolah (Tenant)
*   `Authorization`: `Bearer <accessToken>`

### 1. GET /students (Ambil Semua Siswa)
Mengambil daftar siswa yang aktif (tidak di-soft-delete) milik sekolah tersebut.
*   **Akses**: Semua user terautentikasi (SuperAdmin, SchoolAdmin, Principal, Teacher, HomeroomTeacher, Student).
*   **Contoh Request**:
    ```bash
    curl -X GET http://localhost:3000/students \
      -H "x-school-id: 1" \
      -H "Authorization: Bearer <accessToken>"
    ```
*   **Contoh Response Sukses (200 OK)**:
    ```json
    {
      "success": true,
      "message": "Daftar siswa berhasil diambil",
      "data": [
        {
          "id": 1,
          "schoolId": 1,
          "userId": null,
          "nisn": "0123456789",
          "nis": "202610001",
          "name": "Ahmad Dahlan",
          "gender": "L",
          "birthPlace": "Jakarta",
          "birthDate": "2010-08-17",
          "status": "Aktif",
          "deletedAt": null,
          "createdAt": "2026-06-15T15:45:00.000Z",
          "updatedAt": "2026-06-15T15:45:00.000Z"
        }
      ]
    }
    ```

---

### 2. GET /students/:id (Detail Siswa)
Mengambil detail informasi siswa berdasarkan ID.
*   **Akses**: Semua user terautentikasi di tenant tersebut.
*   **Contoh Request**:
    ```bash
    curl -X GET http://localhost:3000/students/1 \
      -H "x-school-id: 1" \
      -H "Authorization: Bearer <accessToken>"
    ```
*   **Contoh Response Sukses (200 OK)**:
    ```json
    {
      "success": true,
      "message": "Detail siswa berhasil diambil",
      "data": {
        "id": 1,
        "schoolId": 1,
        "userId": null,
        "nisn": "0123456789",
        "nis": "202610001",
        "name": "Ahmad Dahlan",
        "gender": "L",
        "birthPlace": "Jakarta",
        "birthDate": "2010-08-17",
        "status": "Aktif",
        "deletedAt": null,
        "createdAt": "2026-06-15T15:45:00.000Z",
        "updatedAt": "2026-06-15T15:45:00.000Z"
      }
    }
    ```

---

### 3. POST /students (Tambah Siswa)
Menambahkan data siswa baru ke sekolah.
*   **Akses**: SchoolAdmin, Principal, SuperAdmin.
*   **Input Body (JSON)**:
    *   `nisn` (string, wajib, harus 10 digit angka)
    *   `nis` (string, wajib, 1-20 karakter)
    *   `name` (string, wajib, 1-255 karakter)
    *   `gender` (enum: "L" / "P", wajib)
    *   `birthPlace` (string, opsional)
    *   `birthDate` (string, format YYYY-MM-DD, opsional)
    *   `status` (enum: "Aktif" / "Nonaktif", opsional, default: "Aktif")
    *   `userId` (number, opsional)
*   **Contoh Request**:
    ```bash
    curl -X POST http://localhost:3000/students \
      -H "Content-Type: application/json" \
      -H "x-school-id: 1" \
      -H "Authorization: Bearer <accessToken>" \
      -d '{
        "nisn": "0123456789",
        "nis": "202610001",
        "name": "Ahmad Dahlan",
        "gender": "L",
        "birthPlace": "Jakarta",
        "birthDate": "2010-08-17"
      }'
    ```
*   **Contoh Response Sukses (200 OK)**:
    ```json
    {
      "success": true,
      "message": "Siswa berhasil ditambahkan",
      "data": {
        "id": 1,
        "schoolId": 1,
        "userId": null,
        "nisn": "0123456789",
        "nis": "202610001",
        "name": "Ahmad Dahlan",
        "gender": "L",
        "birthPlace": "Jakarta",
        "birthDate": "2010-08-17",
        "status": "Aktif",
        "deletedAt": null,
        "createdAt": "2026-06-15T15:45:00.000Z",
        "updatedAt": "2026-06-15T15:45:00.000Z"
      }
    }
    ```
*   **Contoh Response Gagal - NISN Duplikat Nasional (409 Conflict)**:
    ```json
    {
      "success": false,
      "error": "NISN siswa sudah terdaftar secara nasional"
    }
    ```

---

### 4. PUT /students/:id (Pembaruan Siswa)
Memperbarui informasi data siswa berdasarkan ID.
*   **Akses**: SchoolAdmin, Principal, SuperAdmin.
*   **Input Body (JSON)**: Parsial (sama dengan Create)
*   **Contoh Request**:
    ```bash
    curl -X PUT http://localhost:3000/students/1 \
      -H "Content-Type: application/json" \
      -H "x-school-id: 1" \
      -H "Authorization: Bearer <accessToken>" \
      -d '{
        "name": "Ahmad Dahlan (Updated)",
        "status": "Nonaktif"
      }'
    ```
*   **Contoh Response Sukses (200 OK)**:
    ```json
    {
      "success": true,
      "message": "Data siswa berhasil diperbarui",
      "data": {
        "id": 1,
        "schoolId": 1,
        "userId": null,
        "nisn": "0123456789",
        "nis": "202610001",
        "name": "Ahmad Dahlan (Updated)",
        "phone": null,
        "gender": "L",
        "status": "Nonaktif",
        "deletedAt": null,
        "createdAt": "2026-06-15T15:45:00.000Z",
        "updatedAt": "2026-06-15T15:45:05.000Z"
      }
    }
    ```

---

### 5. DELETE /students/:id (Hapus Siswa / Soft Delete)
Melakukan penghapusan logis (soft delete) dengan mengisi kolom `deleted_at` pada database.
*   **Akses**: SchoolAdmin, Principal, SuperAdmin.
*   **Contoh Request**:
    ```bash
    curl -X DELETE http://localhost:3000/students/1 \
      -H "x-school-id: 1" \
      -H "Authorization: Bearer <accessToken>"
    ```
*   **Contoh Response Sukses (200 OK)**:
    ```json
    {
      "success": true,
      "message": "Siswa berhasil dihapus"
    }
    ```

---

## B. Pengujian Menggunakan Bun Runner
Anda dapat menjalankan pengujian otomatis di `tests/students.test.ts` dengan:
```bash
bun test tests/students.test.ts
```
Laporan pengujian akan secara otomatis memvalidasi seluruh fungsionalitas CRUD, soft delete, otorisasi RBAC, dan tenant isolation.
