// @ts-nocheck
import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { db } from "../src/db";
import { schools } from "../src/schema/schools";
import { users } from "../src/schema/users";
import { subjects } from "../src/schema/subjects";
import { sessions } from "../src/schema/sessions";
import { auditLogs } from "../src/schema/auditLogs";
import { hashPassword } from "../src/utils/password";
import { eq, and, isNotNull } from "drizzle-orm";

describe("Modul Subjects GuruHub - Clean Architecture & Tenant Isolation", () => {
  let testSchoolId: number;
  let testSchoolId2: number;
  let adminAccessToken: string;
  let teacherAccessToken: string;
  let createdSubjectId: number;

  const adminEmail = "admin.subjects@testschool.sch.id";
  const teacherEmail = "teacher.subjects@testschool.sch.id";
  const rawPassword = "GuruHub!2026";

  beforeAll(async () => {
    // 1. Setup Sekolah Pertama
    await db.insert(schools).values({
      npsn: "66666666",
      name: "Subjects Test School 1",
      level: "SMA",
      status: "Swasta",
    });
    const schoolQuery = await db.select().from(schools).where(eq(schools.npsn, "66666666")).limit(1);
    testSchoolId = schoolQuery[0].id;

    // Setup Sekolah Kedua (Tenant Isolation)
    await db.insert(schools).values({
      npsn: "66666665",
      name: "Subjects Test School 2",
      level: "SMA",
      status: "Negeri",
    });
    const schoolQuery2 = await db.select().from(schools).where(eq(schools.npsn, "66666665")).limit(1);
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
      await db.delete(subjects).where(eq(subjects.schoolId, testSchoolId));
      await db.delete(users).where(eq(users.schoolId, testSchoolId));
      await db.delete(schools).where(eq(schools.id, testSchoolId));
    }
    if (testSchoolId2) {
      await db.delete(auditLogs).where(eq(auditLogs.schoolId, testSchoolId2));
      await db.delete(sessions).where(eq(sessions.schoolId, testSchoolId2));
      await db.delete(subjects).where(eq(subjects.schoolId, testSchoolId2));
      await db.delete(users).where(eq(users.schoolId, testSchoolId2));
      await db.delete(schools).where(eq(schools.id, testSchoolId2));
    }
  });

  // 1. POST /subjects (Create)
  it("SchoolAdmin harus sukses menambahkan mata pelajaran baru", async () => {
    const res = await fetch("http://localhost:3000/subjects", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-school-id": String(testSchoolId),
        "Authorization": `Bearer ${adminAccessToken}`,
      },
      body: JSON.stringify({
        code: "INF-7",
        name: "Informatika",
        gradeLevel: "7",
        description: "Dasar-dasar pemrograman dan logika",
        status: "Aktif",
      }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.id).toBeDefined();
    expect(body.data.name).toBe("Informatika");
    createdSubjectId = body.data.id;
  });

  it("SchoolAdmin tidak boleh menambahkan mapel dengan kode duplikat di sekolah yang sama", async () => {
    const res = await fetch("http://localhost:3000/subjects", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-school-id": String(testSchoolId),
        "Authorization": `Bearer ${adminAccessToken}`,
      },
      body: JSON.stringify({
        code: "INF-7", // Kode sama
        name: "Informatika Lanjutan", // Nama berbeda
        gradeLevel: "7",
      }),
    });

    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error).toBe("Kode mata pelajaran sudah terdaftar di sekolah ini");
  });

  it("SchoolAdmin tidak boleh menambahkan mapel dengan nama duplikat di sekolah yang sama", async () => {
    const res = await fetch("http://localhost:3000/subjects", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-school-id": String(testSchoolId),
        "Authorization": `Bearer ${adminAccessToken}`,
      },
      body: JSON.stringify({
        code: "INF-7-NEW", // Kode berbeda
        name: "Informatika", // Nama sama
        gradeLevel: "7",
      }),
    });

    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error).toBe("Nama mata pelajaran sudah terdaftar di sekolah ini");
  });

  it("Guru biasa (role Teacher) tidak boleh membuat mapel baru (RBAC Forbidden)", async () => {
    const res = await fetch("http://localhost:3000/subjects", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-school-id": String(testSchoolId),
        "Authorization": `Bearer ${teacherAccessToken}`,
      },
      body: JSON.stringify({
        code: "MAT-7",
        name: "Matematika",
        gradeLevel: "7",
      }),
    });

    expect(res.status).toBe(403);
  });

  // 2. GET /subjects (List) & GET /subjects/:id (Read)
  it("Guru biasa (role Teacher) harus bisa membaca daftar mapel di sekolahnya", async () => {
    const res = await fetch("http://localhost:3000/subjects", {
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
    expect(body.data[0].code).toBe("INF-7");
  });

  it("Guru harus sukses mengambil detail mapel berdasarkan ID", async () => {
    const res = await fetch(`http://localhost:3000/subjects/${createdSubjectId}`, {
      method: "GET",
      headers: {
        "x-school-id": String(testSchoolId),
        "Authorization": `Bearer ${teacherAccessToken}`,
      },
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.name).toBe("Informatika");
  });

  it("Harus gagal (403 Forbidden) jika mengakses data mapel sekolah lain (Tenant Isolation)", async () => {
    const res = await fetch("http://localhost:3000/subjects", {
      method: "GET",
      headers: {
        "x-school-id": String(testSchoolId2), // Meminta tenant sekolah 2
        "Authorization": `Bearer ${teacherAccessToken}`, // Token berasal dari sekolah 1
      },
    });

    expect(res.status).toBe(403);
  });

  // 3. PUT /subjects/:id (Update)
  it("SchoolAdmin harus sukses memperbarui data mapel", async () => {
    const res = await fetch(`http://localhost:3000/subjects/${createdSubjectId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "x-school-id": String(testSchoolId),
        "Authorization": `Bearer ${adminAccessToken}`,
      },
      body: JSON.stringify({
        name: "Informatika Dasar",
        status: "Nonaktif",
      }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.name).toBe("Informatika Dasar");
    expect(body.data.status).toBe("Nonaktif");
  });

  // 4. DELETE /subjects/:id (Delete/Soft Delete)
  it("SchoolAdmin harus sukses melakukan soft delete data mapel", async () => {
    const res = await fetch(`http://localhost:3000/subjects/${createdSubjectId}`, {
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
      .from(subjects)
      .where(and(eq(subjects.id, createdSubjectId), isNotNull(subjects.deletedAt)));
    
    expect(dbRecord.length).toBe(1);
  });

  it("Mapel yang sudah di-soft-delete tidak boleh muncul di daftar mapel", async () => {
    const res = await fetch("http://localhost:3000/subjects", {
      method: "GET",
      headers: {
        "x-school-id": String(testSchoolId),
        "Authorization": `Bearer ${teacherAccessToken}`,
      },
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    const found = body.data.some((s: any) => s.id === createdSubjectId);
    expect(found).toBe(false);
  });
});
