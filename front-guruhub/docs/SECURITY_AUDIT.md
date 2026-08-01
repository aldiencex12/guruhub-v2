# Laporan Audit Keamanan & Skalabilitas GuruHub

Laporan ini menyajikan tinjauan teknis terhadap modul Autentikasi, Otorisasi, Manajemen Sesi, dan Multi-Tenant GuruHub.

---

## Ringkasan Temuan Audit

| No | Kategori Audit | Temuan Risiko | Tingkat Risiko | Rekomendasi Remediasi |
| :--- | :--- | :--- | :--- | :--- |
| 1 | **Tenant Isolation** | Celah kebocoran data jika developer lupa menambahkan klausa `schoolId` pada query baru. | **Medium** | Gunakan Helper query tenant-bound atau Drizzle Query Builder wrap. |
| 2 | **JWT Security** | Kunci rahasia memiliki *fallback* teks biasa (hardcoded) dan menggunakan algoritma simetris (HS256). | **High** | Hapus fallback rahasia, validasi startup, pertimbangkan RS256/ES256. |
| 3 | **Refresh Token Rotation (RTR)** | Penggunaan ulang token yang telah dicabut (reuse detection) belum menonaktifkan seluruh sesi aktif user. | **Medium** | Revokasi total seluruh sesi user jika terdeteksi penggunaan ulang token usang. |
| 4 | **Session Revocation** | Access Token stateless (JWT) tidak dapat dicabut sebelum kedaluwarsa (vulnerability window 15 menit). | **Medium** | Implementasikan cache pencabutan token (blacklist) via Redis untuk operasi kritis. |
| 5 | **RBAC vs PBAC** | Penggunaan Role langsung menyulitkan kustomisasi akses seiring bertambahnya variasi tugas sekolah. | **Low** | Migrasi ke *Permission-Based Access Control* (PBAC) dengan memetakan Role ke Permissions. |
| 6 | **Audit Logging** | Penulisan log audit ke MySQL dilakukan secara sinkronus, membebani lifecycle request dan database. | **Medium** | Decouple logging menggunakan antrean asinkron (Redis/BullMQ) atau central log collector. |
| 7 | **SQL Injection** | Penggunaan query builder Drizzle aman, namun celah tetap ada jika developer menggunakan `sql.raw()`. | **Low** | Larang penggunaan `sql.raw()` melalui aturan static analysis / ESLint. |
| 8 | **Rate Limiting** | Tidak ada batasan frekuensi request ke endpoint auth, rentan brute force & DDoS. | **High** | Terapkan middleware Rate Limiter per IP dan Akun Email. |
| 9 | **Password Policy** | Validasi password sangat lemah (hanya minimal 6 karakter tanpa aturan kompleksitas). | **Medium** | Terapkan Regex kompleksitas password di level DTO. |
| 10| **Account Lockout** | Akun dapat diserang brute force tanpa batas karena tidak ada pembatasan percobaan gagal. | **High** | Implementasikan kolom limit percobaan gagal (`failed_attempts` & `locked_until`) di DB. |

---

## Analisis Detail & Contoh Implementasi

### 1. Batasan Percobaan Gagal (Account Lockout) & Password Policy
*   **Risiko (High & Medium)**: Tanpa lockout dan kebijakan kompleksitas, akun guru/siswa rentan terhadap serangan kamus (dictionary attack) dan tebakan password kasar.
*   **Solusi**:
    1.  Tambahkan kolom `failed_attempts` dan `locked_until` pada tabel `users`.
    2.  Validasi kompleksitas password pada `LoginDto`.
    3.  Kunci akun selama 15 menit jika gagal login 5 kali berturut-turut.

#### Contoh Skema Pengguna Terkini (`src/schema/users.ts`)
```typescript
import { mysqlTable, serial, varchar, mysqlEnum, timestamp, bigint, uniqueIndex, integer } from "drizzle-orm/mysql-core";
import { schools } from "./schools";

export const users = mysqlTable("users", {
  id: serial("id").primaryKey(),
  schoolId: bigint("school_id", { mode: "number", unsigned: true }).notNull().references(() => schools.id, { onDelete: "cascade" }),
  email: varchar("email", { length: 255 }).notNull(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  role: mysqlEnum("role", ["SuperAdmin", "SchoolAdmin", "Principal", "Teacher", "HomeroomTeacher", "Student"]).notNull(),
  status: mysqlEnum("status", ["Aktif", "Nonaktif"]).default("Aktif").notNull(),
  
  // Penambahan Keamanan Lockout
  failedAttempts: integer("failed_attempts").default(0).notNull(),
  lockedUntil: timestamp("locked_until"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
}, (table) => [
  uniqueIndex("uq_school_email").on(table.schoolId, table.email)
]);
```

#### Contoh Logika Lockout pada Service Layer (`src/modules/auth/service/authService.ts`)
```typescript
// Di dalam AuthService.login()
const user = await this.repository.findUserByEmail(schoolId, email);
if (!user) {
  throw new UnauthorizedError("Email atau password salah");
}

// Periksa apakah akun sedang dikunci
if (user.lockedUntil && new Date() < new Date(user.lockedUntil)) {
  const timeLeft = Math.ceil((new Date(user.lockedUntil).getTime() - new Date().getTime()) / 60000);
  throw new ForbiddenError(`Akun Anda dikunci sementara. Silakan coba lagi dalam ${timeLeft} menit`);
}

// Verifikasi password
const isPasswordValid = await verifyPassword(password, user.passwordHash);
if (!isPasswordValid) {
  const newAttempts = user.failedAttempts + 1;
  let lockedUntil: Date | null = null;
  
  if (newAttempts >= 5) {
    lockedUntil = new Date();
    lockedUntil.setMinutes(lockedUntil.getMinutes() + 15); // Kunci selama 15 menit
  }
  
  await this.repository.updateLockoutStatus(user.id, newAttempts, lockedUntil);
  
  throw new UnauthorizedError("Email atau password salah");
}

// Jika berhasil login, reset percobaan gagal
if (user.failedAttempts > 0) {
  await this.repository.updateLockoutStatus(user.id, 0, null);
}
```

---

### 2. Kebijakan Password Kuat (Password Policy)
*   **Solusi**: Perbarui TypeBox DTO untuk mencocokkan string dengan pola ekspresi reguler (Regex) kekuatan sandi tinggi.

```typescript
// src/modules/auth/dto/authDto.ts
import { t } from "elysia";

// Password minimal 8 karakter, mengandung 1 huruf besar, 1 huruf kecil, 1 angka, dan 1 karakter spesial
const passwordPattern = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$";

export const RegisterDto = t.Object({
  schoolId: t.Numeric(),
  email: t.String({ format: "email" }),
  password: t.String({
    pattern: passwordPattern,
    error: "Password minimal 8 karakter, mengandung huruf besar, huruf kecil, angka, dan karakter spesial"
  }),
  role: t.String()
});
```

---

### 3. Rate Limiting pada ElysiaJS
*   **Risiko (High)**: Tanpa pembatasan laju request, API login rentan terhadap serangan Denial of Service (DoS) dan serangan brute-force.
*   **Solusi**: Gunakan middleware rate limiter bawaan Elysia (`elysia-rate-limit`) atau buat custom middleware menggunakan memori lokal / Redis.

```typescript
// Contoh implementasi di src/index.ts menggunakan plugin elysia-rate-limit
import { Elysia } from "elysia";
import { rateLimit } from "elysia-rate-limit";

const app = new Elysia()
  .use(
    rateLimit({
      duration: 60000, // 1 menit
      max: 10,        // Maksimal 10 percobaan per IP untuk rute sensitif
      generator: (req) => req.headers.get("x-forwarded-for") || "127.0.0.1",
      errorResponse: new Response(
        JSON.stringify({ success: false, error: "Terlalu banyak permintaan. Silakan tunggu 1 menit" }),
        { status: 429, headers: { "Content-Type": "application/json" } }
      )
    })
  )
  .listen(3000);
```

---

### 4. Pencegahan Penggunaan Ulang Refresh Token (RTR Automatic Reuse Detection)
*   **Risiko (Medium)**: Jika penyerang berhasil mencuri refresh token yang belum digunakan dan menggunakannya, token tersebut didefinisikan sebagai ganda. Jika sistem tidak mengambil tindakan tegas, penyerang dan korban akan memegang akses.
*   **Solusi**: Jika ada request refresh token menggunakan token yang statusnya `isRevoked = true`, sistem harus menganggap terjadi pelanggaran keamanan dan membatalkan seluruh sesi aktif untuk user tersebut.

```typescript
// Di dalam AuthService.refresh()
const session = await this.repository.findSession(schoolId, userId, tokenId);
if (!session) {
  throw new UnauthorizedError("Sesi tidak ditemukan");
}

if (session.isRevoked) {
  // TERDETEKSI REUSE ATTACK!
  // Batalkan seluruh sesi aktif pengguna demi keamanan
  await this.repository.revokeAllUserSessions(schoolId, userId);
  
  await this.repository.createAuditLog({
    schoolId,
    userId,
    action: "SUSPICIOUS_TOKEN_REUSE",
    tableName: "sessions",
    recordId: session.id,
    newValues: { message: "Penggunaan kembali refresh token terdeteksi. Seluruh sesi user ini dibatalkan" }
  });
  
  throw new UnauthorizedError("Sesi dicurigai telah diretas. Silakan login kembali.");
}
```
