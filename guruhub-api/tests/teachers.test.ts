// @ts-nocheck
import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { db } from "../src/db";
import { schools } from "../src/schema/schools";
import { users } from "../src/schema/users";
import { teachers } from "../src/schema/teachers";
import { sessions } from "../src/schema/sessions";
import { auditLogs } from "../src/schema/auditLogs";
import { hashPassword } from "../src/utils/password";
import { eq, and, isNotNull } from "drizzle-orm";

describe("Modul Teachers GuruHub - Clean Architecture & Tenant Isolation", () => {
  let testSchoolId: number;
  let testSchoolId2: number;
  let adminAccessToken: string;
  let teacherAccessToken: string;
  let createdTeacherId: number;

  const adminEmail = "admin.teachers@testschool.sch.id";
  const teacherEmail = "teacher.teachers@testschool.sch.id";
  const rawPassword = "GuruHub!2026";

  beforeAll(async () => {
    // 1. Setup Sekolah Pertama
    await db.insert(schools).values({
      npsn: "88888888",
      name: "Teachers Test School 1",
      level: "SMA",
      status: "Swasta",
    });
    const schoolQuery = await db.select().from(schools).where(eq(schools.npsn, "88888888")).limit(1);
    testSchoolId = schoolQuery[0].id;

    // Setup Sekolah Kedua (Tenant Isolation)
    await db.insert(schools).values({
      npsn: "88888887",
      name: "Teachers Test School 2",
      level: "SMA",
      status: "Negeri",
    });
    const schoolQuery2 = await db.select().from(schools).where(eq(schools.npsn, "88888887")).limit(1);
    testSchoolId2 = schoolQuery2[0].id;

    // 2. Setup Pengguna & Password
    const passwordHash = await hashPassword(rawPassword);

    await db.insert(users).values({
      schoolId: testSchoolId,
      email: adminEmail,
      passwordHash,
      role: "SchoolAdmin",
    });
    await db.insert(users).values({
      schoolId: testSchoolId,
      email: teacherEmail,
      passwordHash,
      role: "Teacher",
    });

    // 3. Login untuk mengambil token
    const loginAdminRes = await fetch("http://localhost:3000/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ schoolId: testSchoolId, email: adminEmail, password: rawPassword }),
    });
    const adminLogin = await loginAdminRes.json();
    adminAccessToken = adminLogin.accessToken;

    const loginTeacherRes = await fetch("http://localhost:3000/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ schoolId: testSchoolId, email: teacherEmail, password: rawPassword }),
    });
    const teacherLogin = await loginTeacherRes.json();
    teacherAccessToken = teacherLogin.accessToken;
  });

  afterAll(async () => {
    if (testSchoolId) {
      await db.delete(auditLogs).where(eq(auditLogs.schoolId, testSchoolId));
      await db.delete(sessions).where(eq(sessions.schoolId, testSchoolId));
      await db.delete(teachers).where(eq(teachers.schoolId, testSchoolId));
      await db.delete(users).where(eq(users.schoolId, testSchoolId));
      await db.delete(schools).where(eq(schools.id, testSchoolId));
    }
    if (testSchoolId2) {
      await db.delete(auditLogs).where(eq(auditLogs.schoolId, testSchoolId2));
      await db.delete(sessions).where(eq(sessions.schoolId, testSchoolId2));
      await db.delete(teachers).where(eq(teachers.schoolId, testSchoolId2));
      await db.delete(users).where(eq(users.schoolId, testSchoolId2));
      await db.delete(schools).where(eq(schools.id, testSchoolId2));
    }
  });

  // 1. POST /teachers (Create)
  it("SchoolAdmin harus sukses menambahkan data guru baru", async () => {
    const res = await fetch("http://localhost:3000/teachers", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-school-id": String(testSchoolId),
        "Authorization": `Bearer ${adminAccessToken}`,
      },
      body: JSON.stringify({
        nip: "198706152010121003",
        name: "Budi Utomo, M.Pd.",
        phone: "081234567890",
        gender: "L",
      }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.id).toBeDefined();
    expect(body.data.name).toBe("Budi Utomo, M.Pd.");
    createdTeacherId = body.data.id;
  });

  it("SchoolAdmin tidak boleh menambahkan guru dengan NIP duplikat di sekolah yang sama", async () => {
    const res = await fetch("http://localhost:3000/teachers", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-school-id": String(testSchoolId),
        "Authorization": `Bearer ${adminAccessToken}`,
      },
      body: JSON.stringify({
        nip: "198706152010121003", // NIP sama
        name: "Lilik Suryani, S.Pd.",
        phone: "089876543210",
        gender: "P",
      }),
    });

    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error).toBe("NIP guru sudah terdaftar di sekolah ini");
  });

  it("Guru biasa (role Teacher) tidak boleh menambahkan guru baru (RBAC Forbidden)", async () => {
    const res = await fetch("http://localhost:3000/teachers", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-school-id": String(testSchoolId),
        "Authorization": `Bearer ${teacherAccessToken}`,
      },
      body: JSON.stringify({
        nip: "198906152010122005",
        name: "Siti Aminah, S.Si.",
        phone: "081299998888",
        gender: "P",
      }),
    });

    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error).toBe("Anda tidak memiliki hak akses untuk halaman/operasi ini");
  });

  // 2. GET /teachers (List) & GET /teachers/:id (Read)
  it("Guru biasa (role Teacher) harus bisa membaca daftar guru di sekolahnya", async () => {
    const res = await fetch("http://localhost:3000/teachers", {
      method: "GET",
      headers: {
        "x-school-id": String(testSchoolId),
        "Authorization": `Bearer ${teacherAccessToken}`,
      },
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.length).toBeGreaterThan(0);
    expect(body.data[0].nip).toBe("198706152010121003");

    // Verifikasi metadata pagination
    expect(body.pagination).toBeDefined();
    expect(body.pagination.totalItems).toBeGreaterThan(0);
    expect(body.pagination.totalPages).toBeGreaterThan(0);
    expect(body.pagination.currentPage).toBe(1);
    expect(body.pagination.limit).toBe(10);
  });

  it("Guru harus sukses mengambil daftar guru dengan query parameters pagination dan search", async () => {
    const res = await fetch("http://localhost:3000/teachers?page=1&limit=5&search=Budi", {
      method: "GET",
      headers: {
        "x-school-id": String(testSchoolId),
        "Authorization": `Bearer ${teacherAccessToken}`,
      },
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.length).toBeGreaterThan(0);
    expect(body.data[0].name).toContain("Budi");
    expect(body.pagination.currentPage).toBe(1);
    expect(body.pagination.limit).toBe(5);
  });

  it("Guru harus sukses mengambil detail guru berdasarkan ID", async () => {
    const res = await fetch(`http://localhost:3000/teachers/${createdTeacherId}`, {
      method: "GET",
      headers: {
        "x-school-id": String(testSchoolId),
        "Authorization": `Bearer ${teacherAccessToken}`,
      },
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.name).toBe("Budi Utomo, M.Pd.");
  });

  it("Harus gagal (403 Forbidden) jika mengakses data guru sekolah lain (Tenant Isolation)", async () => {
    const res = await fetch("http://localhost:3000/teachers", {
      method: "GET",
      headers: {
        "x-school-id": String(testSchoolId2), // Meminta tenant sekolah 2
        "Authorization": `Bearer ${teacherAccessToken}`, // Token berasal dari sekolah 1
      },
    });

    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error).toBe("Akses antar tenant (sekolah) dilarang");
  });

  // 3. PUT /teachers/:id (Update)
  it("SchoolAdmin harus sukses memperbarui data guru", async () => {
    const res = await fetch(`http://localhost:3000/teachers/${createdTeacherId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "x-school-id": String(testSchoolId),
        "Authorization": `Bearer ${adminAccessToken}`,
      },
      body: JSON.stringify({
        name: "Budi Utomo, M.Pd. (Updated)",
        phone: "081234567899",
      }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.name).toBe("Budi Utomo, M.Pd. (Updated)");
    expect(body.data.phone).toBe("081234567899");
  });

  it("Guru biasa tidak boleh memperbarui data guru", async () => {
    const res = await fetch(`http://localhost:3000/teachers/${createdTeacherId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "x-school-id": String(testSchoolId),
        "Authorization": `Bearer ${teacherAccessToken}`,
      },
      body: JSON.stringify({
        name: "Hacker Attempt",
      }),
    });

    expect(res.status).toBe(403);
  });

  // 4. DELETE /teachers/:id (Delete/Soft Delete)
  it("SchoolAdmin harus sukses melakukan soft delete data guru", async () => {
    const res = await fetch(`http://localhost:3000/teachers/${createdTeacherId}`, {
      method: "DELETE",
      headers: {
        "x-school-id": String(testSchoolId),
        "Authorization": `Bearer ${adminAccessToken}`,
      },
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);

    // Verifikasi di basis data bahwa deleted_at terisi (soft delete)
    const dbRecord = await db
      .select()
      .from(teachers)
      .where(and(eq(teachers.id, createdTeacherId), isNotNull(teachers.deletedAt)));
    
    expect(dbRecord.length).toBe(1);
  });

  it("Guru yang sudah di-soft-delete tidak boleh muncul di daftar guru", async () => {
    const res = await fetch("http://localhost:3000/teachers", {
      method: "GET",
      headers: {
        "x-school-id": String(testSchoolId),
        "Authorization": `Bearer ${teacherAccessToken}`,
      },
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    
    // Pastikan guru yang didelete tidak ada di list
    const found = body.data.some((t: any) => t.id === createdTeacherId);
    expect(found).toBe(false);
  });

  it("Guru yang sudah di-soft-delete tidak boleh diakses detailnya", async () => {
    const res = await fetch(`http://localhost:3000/teachers/${createdTeacherId}`, {
      method: "GET",
      headers: {
        "x-school-id": String(testSchoolId),
        "Authorization": `Bearer ${teacherAccessToken}`,
      },
    });

    expect(res.status).toBe(404);
  });
});
