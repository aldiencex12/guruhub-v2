# Dokumentasi Modul Classes GuruHub

Modul ini mengimplementasikan pengelolaan data Kelas/Rombel per Tahun Ajaran (CRUD) dengan penegakan **Tenant Isolation** berbasis `school_id`, otorisasi peran (**RBAC**), validasi input TypeBox, dan dukungan **Soft Delete** serta verifikasi status keaktifan kelas.

---

## A. Spesifikasi & Endpoint API

Seluruh endpoint pada modul ini berada di bawah awalan rute `/classes`.
Setiap request wajib menyertakan header berikut:
*   `x-school-id`: ID Sekolah (Tenant)
*   `Authorization`: `Bearer <accessToken>`

### 1. GET /classes (Ambil Semua Kelas)
Mengambil daftar kelas yang aktif (tidak di-soft-delete) milik sekolah tersebut.
*   **Akses**: Semua user terautentikasi (SuperAdmin, SchoolAdmin, Principal, Teacher, HomeroomTeacher, Student).
*   **Contoh Request**:
    ```bash
    curl -X GET http://localhost:3000/classes \
      -H "x-school-id: 1" \
      -H "Authorization: Bearer <accessToken>"
    ```
*   **Contoh Response Sukses (200 OK)**:
    ```json
    {
      "success": true,
      "message": "Daftar kelas berhasil diambil",
      "data": [
        {
          "id": 1,
          "schoolId": 1,
          "academicYearId": 1,
          "homeroomTeacherId": 5,
          "name": "7A",
          "gradeLevel": "7",
          "status": "Aktif",
          "deletedAt": null,
          "createdAt": "2026-06-15T15:48:00.000Z",
          "updatedAt": "2026-06-15T15:48:00.000Z"
        }
      ]
    }
    ```

---

### 2. GET /classes/:id (Detail Kelas)
Mengambil detail informasi kelas berdasarkan ID.
*   **Akses**: Semua user terautentikasi di tenant tersebut.
*   **Contoh Request**:
    ```bash
    curl -X GET http://localhost:3000/classes/1 \
      -H "x-school-id: 1" \
      -H "Authorization: Bearer <accessToken>"
    ```
*   **Contoh Response Sukses (200 OK)**:
    ```json
    {
      "success": true,
      "message": "Detail kelas berhasil diambil",
      "data": {
        "id": 1,
        "schoolId": 1,
        "academicYearId": 1,
        "homeroomTeacherId": 5,
        "name": "7A",
        "gradeLevel": "7",
        "status": "Aktif",
        "deletedAt": null,
        "createdAt": "2026-06-15T15:48:00.000Z",
        "updatedAt": "2026-06-15T15:48:00.000Z"
      }
    }
    ```

---

### 3. POST /classes (Tambah Kelas)
Menambahkan data kelas baru ke sekolah.
*   **Akses**: SchoolAdmin, Principal, SuperAdmin.
*   **Input Body (JSON)**:
    *   `name` (string, wajib, 1-50 karakter, contoh: "7A")
    *   `academicYearId` (number, wajib, ID Tahun Ajaran)
    *   `homeroomTeacherId` (number atau null, opsional, ID Wali Kelas)
    *   `gradeLevel` (enum: "7" | "8" | "9" | "10" | "11" | "12", wajib)
    *   `status` (enum: "Aktif" / "Nonaktif", opsional, default: "Aktif")
*   **Contoh Request**:
    ```bash
    curl -X POST http://localhost:3000/classes \
      -H "Content-Type: application/json" \
      -H "x-school-id: 1" \
      -H "Authorization: Bearer <accessToken>" \
      -d '{
        "name": "7A",
        "academicYearId": 1,
        "homeroomTeacherId": 5,
        "gradeLevel": "7"
      }'
    ```
*   **Contoh Response Sukses (200 OK)**:
    ```json
    {
      "success": true,
      "message": "Kelas berhasil ditambahkan",
      "data": {
        "id": 1,
        "schoolId": 1,
        "academicYearId": 1,
        "homeroomTeacherId": 5,
        "name": "7A",
        "gradeLevel": "7",
        "status": "Aktif",
        "deletedAt": null,
        "createdAt": "2026-06-15T15:48:00.000Z",
        "updatedAt": "2026-06-15T15:48:00.000Z"
      }
    }
    ```
*   **Contoh Response Gagal - Wali Kelas dari Sekolah Lain (400 Bad Request)**:
    ```json
    {
      "success": false,
      "error": "Wali kelas harus terdaftar di sekolah yang sama"
    }
    ```
*   **Contoh Response Gagal - Nama Kelas Duplikat per Tahun Ajaran (409 Conflict)**:
    ```json
    {
      "success": false,
      "error": "Nama kelas sudah terdaftar untuk tahun ajaran ini"
    }
    ```

---

### 4. PUT /classes/:id (Pembaruan Kelas)
Memperbarui informasi data kelas berdasarkan ID.
*   **Akses**: SchoolAdmin, Principal, SuperAdmin.
*   **Input Body (JSON)**: Parsial (sama dengan Create)
*   **Contoh Request**:
    ```bash
    curl -X PUT http://localhost:3000/classes/1 \
      -H "Content-Type: application/json" \
      -H "x-school-id: 1" \
      -H "Authorization: Bearer <accessToken>" \
      -d '{
        "name": "7A-Updated",
        "status": "Nonaktif"
      }'
    ```
*   **Contoh Response Sukses (200 OK)**:
    ```json
    {
      "success": true,
      "message": "Data kelas berhasil diperbarui",
      "data": {
        "id": 1,
        "schoolId": 1,
        "academicYearId": 1,
        "homeroomTeacherId": 5,
        "name": "7A-Updated",
        "gradeLevel": "7",
        "status": "Nonaktif",
        "deletedAt": null,
        "createdAt": "2026-06-15T15:48:00.000Z",
        "updatedAt": "2026-06-15T15:48:05.000Z"
      }
    }
    ```

---

### 5. DELETE /classes/:id (Hapus Kelas / Soft Delete)
Melakukan penghapusan logis (soft delete) dengan mengisi kolom `deleted_at` pada database.
*   **Akses**: SchoolAdmin, Principal, SuperAdmin.
*   **Contoh Request**:
    ```bash
    curl -X DELETE http://localhost:3000/classes/1 \
      -H "x-school-id: 1" \
      -H "Authorization: Bearer <accessToken>"
    ```
*   **Contoh Response Sukses (200 OK)**:
    ```json
    {
      "success": true,
      "message": "Kelas berhasil dihapus"
    }
    ```

---

## B. Pengujian Menggunakan Bun Runner
Anda dapat menjalankan pengujian otomatis di `tests/classes.test.ts` dengan:
```bash
bun test tests/classes.test.ts
```
Laporan pengujian akan secara otomatis memvalidasi seluruh fungsionalitas CRUD, soft delete, otorisasi RBAC, dan tenant isolation.
