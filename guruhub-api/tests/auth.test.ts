// @ts-nocheck
import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { db } from "../src/db";
import { schools } from "../src/schema/schools";
import { users } from "../src/schema/users";
import { sessions } from "../src/schema/sessions";
import { auditLogs } from "../src/schema/auditLogs";
import { hashPassword } from "../src/utils/password";
import { verifyToken } from "../src/utils/jwt";
import type { AccessTokenPayload, RefreshTokenPayload } from "../src/utils/jwt";
import { eq, and } from "drizzle-orm";

describe("Modul Autentikasi dan Otorisasi GuruHub", () => {
  let testSchoolId: number;
  let testSchoolId2: number;
  let testAdminUserId: number;
  let testStudentUserId: number;

  const adminEmail = "admin@testschool.sch.id";
  const studentEmail = "student@testschool.sch.id";
  const rawPassword = "GuruHub!2026";

  // Setup: Masukkan data sekolah dan user uji coba ke DB
  beforeAll(async () => {
    // 1. Buat Sekolah Uji Coba Pertama
    await db.insert(schools).values({
      npsn: "99999999",
      name: "Test School Boarding",
      level: "SMA",
      status: "Swasta",
    });
    
    const schoolQueryResult = await db
      .select()
      .from(schools)
      .where(eq(schools.npsn, "99999999"))
      .limit(1);
    testSchoolId = schoolQueryResult[0].id;

    // 2. Buat Sekolah Uji Coba Kedua (Untuk Tenant Isolation test)
    await db.insert(schools).values({
      npsn: "99999998",
      name: "Second Test School",
      level: "SMA",
      status: "Negeri",
    });
    
    const schoolQueryResult2 = await db
      .select()
      .from(schools)
      .where(eq(schools.npsn, "99999998"))
      .limit(1);
    testSchoolId2 = schoolQueryResult2[0].id;

    // 3. Hash Password
    const passwordHash = await hashPassword(rawPassword);

    // 4. Buat User Admin Sekolah di Sekolah Pertama
    await db.insert(users).values({
      schoolId: testSchoolId,
      email: adminEmail,
      passwordHash,
      role: "SchoolAdmin",
      status: "Aktif",
    });

    const adminQuery = await db
      .select()
      .from(users)
      .where(and(eq(users.schoolId, testSchoolId), eq(users.email, adminEmail)))
      .limit(1);
    testAdminUserId = adminQuery[0].id;

    // 5. Buat User Siswa Sekolah di Sekolah Pertama
    await db.insert(users).values({
      schoolId: testSchoolId,
      email: studentEmail,
      passwordHash,
      role: "Student",
      status: "Aktif",
    });

    const studentQuery = await db
      .select()
      .from(users)
      .where(and(eq(users.schoolId, testSchoolId), eq(users.email, studentEmail)))
      .limit(1);
    testStudentUserId = studentQuery[0].id;
  });

  // Cleanup: Hapus seluruh data uji coba dari DB
  afterAll(async () => {
    if (testSchoolId) {
      await db.delete(auditLogs).where(eq(auditLogs.schoolId, testSchoolId));
      await db.delete(sessions).where(eq(sessions.schoolId, testSchoolId));
      await db.delete(users).where(eq(users.schoolId, testSchoolId));
      await db.delete(schools).where(eq(schools.id, testSchoolId));
    }
    if (testSchoolId2) {
      await db.delete(auditLogs).where(eq(auditLogs.schoolId, testSchoolId2));
      await db.delete(sessions).where(eq(sessions.schoolId, testSchoolId2));
      await db.delete(users).where(eq(users.schoolId, testSchoolId2));
      await db.delete(schools).where(eq(schools.id, testSchoolId2));
    }
  });

  // UJI COBA 1: Password Hashing
  it("Harus berhasil meng-hash dan memverifikasi password dengan bcrypt", async () => {
    const hash = await hashPassword("mySecretPassword");
    expect(hash).not.toBe("mySecretPassword");
    expect(hash.startsWith("$2a$") || hash.startsWith("$2b$")).toBe(true);

    const isMatch = await Bun.password.verify("mySecretPassword", hash);
    expect(isMatch).toBe(true);

    const isNotMatch = await Bun.password.verify("wrongPassword", hash);
    expect(isNotMatch).toBe(false);
  });

  // UJI COBA 2: Login Endpoint (Berhasil & Gagal)
  it("Harus berhasil login dengan kredensial valid dan menghasilkan JWT serta audit log", async () => {
    const response = await fetch("http://localhost:3000/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        schoolId: testSchoolId,
        email: adminEmail,
        password: rawPassword,
      }),
    });

    expect(response.status).toBe(200);
    const body = await response.json();

    expect(body.accessToken).toBeDefined();
    expect(body.refreshToken).toBeDefined();
    expect(body.user.role).toBe("SchoolAdmin");

    // Verifikasi Access Token Payload
    const decodedAccess = verifyToken<AccessTokenPayload>(body.accessToken);
    expect(decodedAccess.userId).toBe(testAdminUserId);
    expect(decodedAccess.schoolId).toBe(testSchoolId);
    expect(decodedAccess.role).toBe("SchoolAdmin");

    // Verifikasi Audit Log terbuat di Database
    const logs = await db
      .select()
      .from(auditLogs)
      .where(and(eq(auditLogs.schoolId, testSchoolId), eq(auditLogs.action, "LOGIN_SUCCESS")));
    
    expect(logs.length).toBeGreaterThan(0);
  });

  it("Harus gagal login dengan password salah dan membuat audit log LOGIN_FAILED", async () => {
    const response = await fetch("http://localhost:3000/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        schoolId: testSchoolId,
        email: adminEmail,
        password: "wrongPassword",
      }),
    });

    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.success).toBe(false);
    expect(body.error).toBe("Email atau password salah");

    // Verifikasi Audit Log kegagalan login
    const logs = await db
      .select()
      .from(auditLogs)
      .where(and(eq(auditLogs.schoolId, testSchoolId), eq(auditLogs.action, "LOGIN_FAILED")));
    
    expect(logs.length).toBeGreaterThan(0);
  });

  // UJI COBA 3: Refresh Token & Rotation
  it("Harus berhasil melakukan refresh token (Token Rotation) dan mencabut sesi lama", async () => {
    // 1. Dapatkan refresh token via login
    const loginRes = await fetch("http://localhost:3000/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        schoolId: testSchoolId,
        email: adminEmail,
        password: rawPassword,
      }),
    });
    const loginBody = await loginRes.json();
    const oldRefreshToken = loginBody.refreshToken;

    // 2. Lakukan refresh
    const refreshRes = await fetch("http://localhost:3000/auth/refresh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: oldRefreshToken }),
    });

    expect(refreshRes.status).toBe(200);
    const refreshBody = await refreshRes.json();
    expect(refreshBody.accessToken).toBeDefined();
    expect(refreshBody.refreshToken).toBeDefined();

    // 3. Verifikasi token lama sudah dicabut (karena Token Rotation)
    const oldDecoded = verifyToken<RefreshTokenPayload>(oldRefreshToken);
    const oldSession = await db
      .select()
      .from(sessions)
      .where(eq(sessions.tokenId, oldDecoded.tokenId))
      .limit(1);
    
    expect(oldSession[0].isRevoked).toBe(true);

    // 4. Verifikasi token baru dapat digunakan kembali
    const newDecoded = verifyToken<RefreshTokenPayload>(refreshBody.refreshToken);
    const newSession = await db
      .select()
      .from(sessions)
      .where(eq(sessions.tokenId, newDecoded.tokenId))
      .limit(1);
    
    expect(newSession[0].isRevoked).toBe(false);
  });

  // UJI COBA 4: Multi-Tenant Middleware & Tenant Isolation
  it("Harus berhasil mengakses route me dengan token valid dan header x-school-id yang sesuai", async () => {
    const loginRes = await fetch("http://localhost:3000/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        schoolId: testSchoolId,
        email: adminEmail,
        password: rawPassword,
      }),
    });
    const loginBody = await loginRes.json();

    const meRes = await fetch("http://localhost:3000/auth/protected/me", {
      method: "GET",
      headers: {
        "x-school-id": String(testSchoolId),
        "Authorization": `Bearer ${loginBody.accessToken}`,
      },
    });

    expect(meRes.status).toBe(200);
    const meBody = await meRes.json();
    expect(meBody.user.email).toBe(adminEmail);
    expect(meBody.schoolName).toBe("Test School Boarding");
  });

  it("Harus gagal (403 Forbidden) jika mengakses tenant sekolah lain (Tenant Isolation)", async () => {
    const loginRes = await fetch("http://localhost:3000/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        schoolId: testSchoolId,
        email: adminEmail,
        password: rawPassword,
      }),
    });
    const loginBody = await loginRes.json();

    // Gunakan ID sekolah uji coba kedua yang valid untuk memicu filter otorisasi tenant
    const meRes = await fetch("http://localhost:3000/auth/protected/me", {
      method: "GET",
      headers: {
        "x-school-id": String(testSchoolId2), 
        "Authorization": `Bearer ${loginBody.accessToken}`,
      },
    });

    // Harus gagal karena tenant header dan token schoolId tidak sinkron
    expect(meRes.status).toBe(403);
    const meBody = await meRes.json();
    expect(meBody.success).toBe(false);
    expect(meBody.error).toBe("Akses antar tenant (sekolah) dilarang");
  });

  // UJI COBA 5: RBAC Authorization (SchoolAdmin vs Student)
  it("Harus memperbolehkan SchoolAdmin mengakses route admin-only", async () => {
    const loginRes = await fetch("http://localhost:3000/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        schoolId: testSchoolId,
        email: adminEmail,
        password: rawPassword,
      }),
    });
    const loginBody = await loginRes.json();

    const adminOnlyRes = await fetch("http://localhost:3000/auth/protected/admin-only", {
      method: "GET",
      headers: {
        "x-school-id": String(testSchoolId),
        "Authorization": `Bearer ${loginBody.accessToken}`,
      },
    });

    expect(adminOnlyRes.status).toBe(200);
    const adminOnlyBody = await adminOnlyRes.json();
    expect(adminOnlyBody.message).toBe("Akses admin berhasil diverifikasi");
  });

  it("Harus menolak (403 Forbidden) jika Student mengakses route admin-only", async () => {
    // 1. Login sebagai siswa
    const loginRes = await fetch("http://localhost:3000/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        schoolId: testSchoolId,
        email: studentEmail,
        password: rawPassword,
      }),
    });
    const loginBody = await loginRes.json();

    // 2. Coba akses endpoint admin
    const adminOnlyRes = await fetch("http://localhost:3000/auth/protected/admin-only", {
      method: "GET",
      headers: {
        "x-school-id": String(testSchoolId),
        "Authorization": `Bearer ${loginBody.accessToken}`,
      },
    });

    expect(adminOnlyRes.status).toBe(403);
    const adminOnlyBody = await adminOnlyRes.json();
    expect(adminOnlyBody.success).toBe(false);
    expect(adminOnlyBody.error).toBe("Anda tidak memiliki hak akses untuk halaman/operasi ini");
  });

  // UJI COBA 6: Logout
  it("Harus berhasil melakukan logout, mencabut sesi, dan mencatat audit log", async () => {
    // 1. Login
    const loginRes = await fetch("http://localhost:3000/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        schoolId: testSchoolId,
        email: adminEmail,
        password: rawPassword,
      }),
    });
    const loginBody = await loginRes.json();
    const refreshToken = loginBody.refreshToken;

    // 2. Logout
    const logoutRes = await fetch("http://localhost:3000/auth/logout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });

    expect(logoutRes.status).toBe(200);
    const logoutBody = await logoutRes.json();
    expect(logoutBody.message).toBe("Logout berhasil");

    // 3. Pastikan token dibatalkan di DB
    const decoded = verifyToken<RefreshTokenPayload>(refreshToken);
    const session = await db
      .select()
      .from(sessions)
      .where(eq(sessions.tokenId, decoded.tokenId))
      .limit(1);
    
    expect(session[0].isRevoked).toBe(true);

    // 4. Pastikan audit log terbuat
    const logs = await db
      .select()
      .from(auditLogs)
      .where(and(eq(auditLogs.schoolId, testSchoolId), eq(auditLogs.action, "LOGOUT_SUCCESS")));
    
    expect(logs.length).toBeGreaterThan(0);
  });
});
