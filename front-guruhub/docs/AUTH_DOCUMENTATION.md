# Dokumentasi Modul Autentikasi & Otorisasi GuruHub

Modul ini mengimplementasikan sistem Autentikasi, Otorisasi (RBAC), Session Management, Multi-Tenant Isolation, dan Audit Logging pada platform GuruHub menggunakan Clean Architecture.

---

## A. Struktur Folder Clean Architecture

Implementasi diatur berdasarkan tanggung jawab masing-masing lapisan (separation of concerns):

```
src/
├── errors/
│   └── customErrors.ts          # Custom Exception Classes (400, 401, 403, 404, 409, 500)
├── middleware/
│   ├── tenant.ts                # Middleware validasi & injeksi tenant (x-school-id)
│   └── auth.ts                  # Middleware validasi JWT & Guard RBAC (requireRoles)
├── utils/
│   ├── jwt.ts                   # Token signing & verification (Access & Refresh Token)
│   └── password.ts              # Password hashing & verification menggunakan Bun bcrypt
└── modules/
    └── auth/
        ├── controller/
        │   └── authController.ts # Elysia Router & API Endpoints
        ├── dto/
        │   └── authDto.ts       # TypeBox schemas untuk input validation
        ├── repository/
        │   └── authRepository.ts# Database queries layer (Drizzle ORM)
        └── service/
            └── authService.ts   # Logika bisnis utama (Auth, Refresh rotation, Logging)
```

---

## B. Penjelasan Fitur Keamanan

1.  **Multi-Tenant Isolation (Keamanan Tenant)**:
    *   Setiap request ke route terlindungi wajib menyertakan header `x-school-id`.
    *   `tenantMiddleware` memvalidasi apakah sekolah tersebut terdaftar di database.
    *   `authMiddleware` membandingkan `schoolId` yang diinjeksi oleh tenant middleware dengan `schoolId` yang tertanam dalam payload Access Token (JWT). Jika tidak cocok, request langsung ditolak dengan kode **403 Forbidden** (mencegah kebocoran data antar sekolah).
2.  **Session Management & Token Rotation**:
    *   Setiap login sukses membuat record sesi baru di tabel `sessions` dengan `token_id` berupa UUID acak.
    *   Refresh token membawa payload berisi `token_id` sesi tersebut.
    *   Ketika user melakukan refresh token, sistem melakukan **Token Rotation**:
        *   Sesi lama dicabut (`isRevoked = true`).
        *   Sesi baru dengan `token_id` UUID baru dibuat di database.
        *   Access token baru dan Refresh token baru dikembalikan ke user.
        *   Jika token lama dicoba digunakan kembali, sistem akan mendeteksinya sebagai sesi tidak valid/dicabut, sehingga membatalkan akses.
3.  **Audit Logs**:
    *   Setiap aktivitas penting (`LOGIN_SUCCESS`, `LOGIN_FAILED`, `LOGOUT_SUCCESS`) direkam di tabel `audit_logs` bersama metadata IP Address, User Agent, dan alasan kegagalan.

---

## C. Spesifikasi API Endpoint & Contoh Request/Response

### 1. Login
*   **Method & URL**: `POST /auth/login`
*   **Headers**: `Content-Type: application/json`
*   **Request Body**:
    ```json
    {
      "schoolId": 1,
      "email": "admin@sekolah.sch.id",
      "password": "GuruHub!2026"
    }
    ```
*   **Response Sukses (200 OK)**:
    ```json
    {
      "user": {
        "id": 1,
        "email": "admin@sekolah.sch.id",
        "role": "SchoolAdmin",
        "schoolId": 1
      },
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ey...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ey..."
    }
    ```
*   **Response Gagal Kredensial Salah (401 Unauthorized)**:
    ```json
    {
      "success": false,
      "error": "Email atau password salah"
    }
    ```

### 2. Refresh Token
*   **Method & URL**: `POST /auth/refresh`
*   **Headers**: `Content-Type: application/json`
*   **Request Body**:
    ```json
    {
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ey..."
    }
    ```
*   **Response Sukses (200 OK)**:
    ```json
    {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ey...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ey..."
    }
    ```

### 3. Logout
*   **Method & URL**: `POST /auth/logout`
*   **Headers**: `Content-Type: application/json`
*   **Request Body**:
    ```json
    {
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ey..."
    }
    ```
*   **Response Sukses (200 OK)**:
    ```json
    {
      "message": "Logout berhasil"
    }
    ```

### 4. Get Profil (Protected & Tenant Bound)
*   **Method & URL**: `GET /auth/protected/me`
*   **Headers**:
    *   `x-school-id`: `1`
    *   `Authorization`: `Bearer <accessToken>`
*   **Response Sukses (200 OK)**:
    ```json
    {
      "message": "Profil berhasil diambil",
      "user": {
        "id": 1,
        "email": "admin@sekolah.sch.id",
        "role": "SchoolAdmin",
        "schoolId": 1
      },
      "schoolName": "SMA Negeri 1 Jakarta"
    }
    ```
*   **Response Gagal Cross-Tenant (403 Forbidden)**:
    ```json
    {
      "success": false,
      "error": "Akses antar tenant (sekolah) dilarang"
    }
    ```

---

## D. Cara Menjalankan Unit Test

Unit test telah disiapkan di `tests/auth.test.ts` menggunakan runtime test bawaan Bun.

1.  Pastikan Server Elysia menyala di port 3000:
    ```bash
    bun run src/index.ts
    ```
2.  Buka terminal baru dan jalankan test runner:
    ```bash
    bun test tests/auth.test.ts
    ```
