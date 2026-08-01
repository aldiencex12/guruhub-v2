# Dokumentasi Modul Assessment Categories (Kategori Penilaian) GuruHub

Modul ini menyediakan kategori penilaian beserta bobot persentasenya yang akan digunakan oleh perhitungan nilai akhir siswa dan rapor Kurikulum Merdeka di platform GuruHub.

---

## A. Spesifikasi & Endpoint API

Seluruh endpoint pada modul ini berada di bawah awalan rute `/assessment-categories`.
Setiap request wajib menyertakan header berikut:
*   `x-school-id`: ID Sekolah (Tenant)
*   `Authorization`: `Bearer <accessToken>`

### 1. GET /assessment-categories (Ambil Daftar Kategori)
Mengambil seluruh kategori penilaian aktif (tidak di-soft-delete) untuk sekolah tersebut.
*   **Akses**: SuperAdmin, SchoolAdmin, Principal, Teacher, HomeroomTeacher.
*   **Contoh Request**:
    ```bash
    curl -X GET "http://localhost:3000/assessment-categories" \
      -H "x-school-id: 1" \
      -H "Authorization: Bearer <accessToken>"
    ```
*   **Contoh Response Sukses (200 OK)**:
    ```json
    {
      "success": true,
      "message": "Daftar kategori penilaian berhasil diambil",
      "data": [
        {
          "id": 1,
          "schoolId": 1,
          "name": "Tugas",
          "description": "Kategori untuk tugas mandiri dan kelompok",
          "weight": 20,
          "isDefault": false,
          "createdAt": "2026-06-16T14:00:00.000Z",
          "updatedAt": "2026-06-16T14:00:00.000Z",
          "deletedAt": null
        }
      ]
    }
    ```

---

### 2. GET /assessment-categories/:id (Detail Kategori Penilaian)
Mengambil detail satu kategori penilaian berdasarkan ID.
*   **Akses**: SuperAdmin, SchoolAdmin, Principal, Teacher, HomeroomTeacher.
*   **Contoh Request**:
    ```bash
    curl -X GET http://localhost:3000/assessment-categories/1 \
      -H "x-school-id: 1" \
      -H "Authorization: Bearer <accessToken>"
    ```

---

### 3. POST /assessment-categories (Buat Kategori Penilaian Baru)
Membuat kategori penilaian baru beserta bobotnya.
*   **Akses**: SuperAdmin, SchoolAdmin, Principal.
*   **Input Body (JSON)**:
    *   `name` (string, wajib, max 255 karakter)
    *   `description` (string, opsional/nullable)
    *   `weight` (number, wajib, antara 0 - 100)
    *   `isDefault` (boolean, opsional, default: `false`)
*   **Aturan Validasi**:
    1.  Bobot harus bernilai di antara 0 dan 100.
    2.  Total bobot dari semua kategori aktif di satu sekolah tidak boleh melebihi 100%.
    3.  Nama kategori harus unik untuk sekolah yang bersangkutan.
*   **Contoh Request**:
    ```bash
    curl -X POST http://localhost:3000/assessment-categories \
      -H "Content-Type: application/json" \
      -H "x-school-id: 1" \
      -H "Authorization: Bearer <accessToken>" \
      -d '{
        "name": "Tugas",
        "weight": 20,
        "isDefault": false
      }'
    ```

---

### 4. PUT /assessment-categories/:id (Pembaruan Kategori Penilaian)
Memperbarui nama, keterangan, atau bobot kategori penilaian.
*   **Akses**: SuperAdmin, SchoolAdmin, Principal.
*   **Input Body (JSON)**: Seluruh field opsional.
*   **Aturan Validasi**:
    1.  Jika nama diubah, nama baru tidak boleh duplikat dengan kategori aktif lainnya di sekolah yang sama.
    2.  Jika bobot diubah, total bobot kategori aktif yang tersisa + bobot baru tidak boleh melebihi 100%.
*   **Contoh Request**:
    ```bash
    curl -X PUT http://localhost:3000/assessment-categories/1 \
      -H "Content-Type: application/json" \
      -H "x-school-id: 1" \
      -H "Authorization: Bearer <accessToken>" \
      -d '{
        "name": "Tugas Harian",
        "weight": 25
      }'
    ```

---

### 5. DELETE /assessment-categories/:id (Hapus Kategori Penilaian / Soft Delete)
Melakukan penghapusan logis (*soft delete*) dengan memperbarui kolom `deleted_at`.
*   **Akses**: SuperAdmin, SchoolAdmin, Principal.
*   **Aturan Validasi**:
    1.  Kategori default (`isDefault: true`) **tidak boleh dihapus**.
*   **Contoh Request**:
    ```bash
    curl -X DELETE http://localhost:3000/assessment-categories/1 \
      -H "x-school-id: 1" \
      -H "Authorization: Bearer <accessToken>"
    ```

---

## B. Integrasi dengan Modul Asesmen

Tabel `assessments` kini memiliki relasi langsung ke `assessment_categories` melalui kolom `category_id`. 
Saat membuat asesmen baru menggunakan endpoint `POST /assessments`, klien diwajibkan untuk mengirimkan properti `categoryId` yang valid dan berasal dari sekolah yang sama.

---

## C. Pengujian Menggunakan Bun Runner

Untuk menjalankan rangkaian pengujian otomatis pada modul kategori penilaian, Anda dapat mengeksekusi perintah berikut:
```bash
bun test tests/assessment-categories.test.ts
```

Pengujian ini secara otomatis memvalidasi **15 kasus uji utama** seperti batas bobot negatif, pembatasan total bobot maksimal 100%, pencegahan penghapusan kategori default, hak akses peran, isolasi data tenant, dan verifikasi soft delete.
