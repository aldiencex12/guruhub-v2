# Dokumentasi Modul Teachers GuruHub

Modul ini mengimplementasikan pengelolaan data Guru (CRUD) dengan penegakan **Tenant Isolation** berbasis `school_id`, otorisasi peran (**RBAC**), validasi input TypeBox, dan dukungan **Soft Delete**.

---

## A. Spesifikasi & Endpoint API

Seluruh endpoint pada modul ini berada di bawah awalan rute `/teachers`.
Setiap request wajib menyertakan header berikut:
*   `x-school-id`: ID Sekolah (Tenant)
*   `Authorization`: `Bearer <accessToken>`

### 1. GET /teachers (Ambil Semua Guru)
Mengambil daftar guru yang aktif (tidak di-soft-delete) milik sekolah tersebut.
*   **Akses**: Semua user terautentikasi (SuperAdmin, SchoolAdmin, Principal, Teacher, HomeroomTeacher, Student).
*   **Contoh Request**:
    ```bash
    curl -X GET http://localhost:3000/teachers \
      -H "x-school-id: 1" \
      -H "Authorization: Bearer <accessToken>"
    ```
*   **Contoh Response Sukses (200 OK)**:
    ```json
    {
      "success": true,
      "message": "Daftar guru berhasil diambil",
      "data": [
        {
          "id": 1,
          "schoolId": 1,
          "userId": null,
          "nip": "198706152010121003",
          "name": "Budi Utomo, M.Pd.",
          "phone": "081234567890",
          "gender": "L",
          "deletedAt": null,
          "createdAt": "2026-06-15T15:42:00.000Z",
          "updatedAt": "2026-06-15T15:42:00.000Z"
        }
      ]
    }
    ```

---

### 2. GET /teachers/:id (Detail Guru)
Mengambil detail informasi guru berdasarkan ID.
*   **Akses**: Semua user terautentikasi di tenant tersebut.
*   **Contoh Request**:
    ```bash
    curl -X GET http://localhost:3000/teachers/1 \
      -H "x-school-id: 1" \
      -H "Authorization: Bearer <accessToken>"
    ```
*   **Contoh Response Sukses (200 OK)**:
    ```json
    {
      "success": true,
      "message": "Detail guru berhasil diambil",
      "data": {
        "id": 1,
        "schoolId": 1,
        "userId": null,
        "nip": "198706152010121003",
        "name": "Budi Utomo, M.Pd.",
        "phone": "081234567890",
        "gender": "L",
        "deletedAt": null,
        "createdAt": "2026-06-15T15:42:00.000Z",
        "updatedAt": "2026-06-15T15:42:00.000Z"
      }
    }
    ```
*   **Contoh Response Gagal - Guru Tidak Ditemukan (404 Not Found)**:
    ```json
    {
      "success": false,
      "error": "Guru tidak ditemukan"
    }
    ```

---

### 3. POST /teachers (Tambah Guru)
Menambahkan data guru baru ke sekolah.
*   **Akses**: SchoolAdmin, Principal, SuperAdmin.
*   **Input Body (JSON)**:
    *   `nip` (string, opsional, harus 18 digit angka)
    *   `name` (string, wajib, 1-255 karakter)
    *   `phone` (string, opsional, maks 20 karakter)
    *   `gender` (enum: "L" / "P", wajib)
    *   `userId` (number, opsional)
*   **Contoh Request**:
    ```bash
    curl -X POST http://localhost:3000/teachers \
      -H "Content-Type: application/json" \
      -H "x-school-id: 1" \
      -H "Authorization: Bearer <accessToken>" \
      -H "user-agent: curl-client" \
      -d '{
        "nip": "198706152010121003",
        "name": "Budi Utomo, M.Pd.",
        "phone": "081234567890",
        "gender": "L"
      }'
    ```
*   **Contoh Response Sukses (200 OK)**:
    ```json
    {
      "success": true,
      "message": "Guru berhasil ditambahkan",
      "data": {
        "id": 1,
        "schoolId": 1,
        "userId": null,
        "nip": "198706152010121003",
        "name": "Budi Utomo, M.Pd.",
        "phone": "081234567890",
        "gender": "L",
        "deletedAt": null,
        "createdAt": "2026-06-15T15:42:00.000Z",
        "updatedAt": "2026-06-15T15:42:00.000Z"
      }
    }
    ```
*   **Contoh Response Gagal - NIP Duplikat (409 Conflict)**:
    ```json
    {
      "success": false,
      "error": "NIP guru sudah terdaftar di sekolah ini"
    }
    ```

---

### 4. PUT /teachers/:id (Pembaruan Guru)
Memperbarui informasi data guru berdasarkan ID.
*   **Akses**: SchoolAdmin, Principal, SuperAdmin.
*   **Input Body (JSON)**: Parsial (sama dengan Create)
*   **Contoh Request**:
    ```bash
    curl -X PUT http://localhost:3000/teachers/1 \
      -H "Content-Type: application/json" \
      -H "x-school-id: 1" \
      -H "Authorization: Bearer <accessToken>" \
      -d '{
        "name": "Budi Utomo, M.Pd. (Updated)",
        "phone": "081234567899"
      }'
    ```
*   **Contoh Response Sukses (200 OK)**:
    ```json
    {
      "success": true,
      "message": "Data guru berhasil diperbarui",
      "data": {
        "id": 1,
        "schoolId": 1,
        "userId": null,
        "nip": "198706152010121003",
        "name": "Budi Utomo, M.Pd. (Updated)",
        "phone": "081234567899",
        "gender": "L",
        "deletedAt": null,
        "createdAt": "2026-06-15T15:42:00.000Z",
        "updatedAt": "2026-06-15T15:42:05.000Z"
      }
    }
    ```

---

### 5. DELETE /teachers/:id (Hapus Guru / Soft Delete)
Melakukan penghapusan logis (soft delete) dengan mengisi kolom `deleted_at` pada database.
*   **Akses**: SchoolAdmin, Principal, SuperAdmin.
*   **Contoh Request**:
    ```bash
    curl -X DELETE http://localhost:3000/teachers/1 \
      -H "x-school-id: 1" \
      -H "Authorization: Bearer <accessToken>"
    ```
*   **Contoh Response Sukses (200 OK)**:
    ```json
    {
      "success": true,
      "message": "Guru berhasil dihapus"
    }
    ```

---

## B. Pengujian Menggunakan Bun Runner
Anda dapat menjalankan pengujian otomatis di `tests/teachers.test.ts` dengan:
```bash
bun test tests/teachers.test.ts
```
Laporan pengujian akan secara otomatis memvalidasi seluruh fungsionalitas CRUD, soft delete, otorisasi RBAC, dan tenant isolation.
