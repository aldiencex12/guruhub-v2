// @ts-nocheck
import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { db } from "../src/db";
import { schools } from "../src/schema/schools";
import { users } from "../src/schema/users";
import { classes } from "../src/schema/classes";
import { teachers } from "../src/schema/teachers";
import { academicYears } from "../src/schema/academicYears";
import { sessions } from "../src/schema/sessions";
import { auditLogs } from "../src/schema/auditLogs";
import { hashPassword } from "../src/utils/password";
import { eq, and, isNotNull } from "drizzle-orm";

describe("Modul Classes GuruHub - Clean Architecture & Tenant Isolation", () => {
  let testSchoolId: number;
  let testSchoolId2: number;
  let testAcademicYearId: number;
  let testTeacherId1: number;
  let testTeacherId2: number;
  let adminAccessToken: string;
  let teacherAccessToken: string;
  let createdClassId: number;

  const adminEmail = "admin.classes@testschool.sch.id";
  const teacherEmail = "teacher.classes@testschool.sch.id";
  const rawPassword = "GuruHub!2026";

  beforeAll(async () => {
    // 1. Setup Sekolah Pertama
    await db.insert(schools).values({
      npsn: "77777777",
      name: "Classes Test School 1",
      level: "SMA",
      status: "Swasta",
    });
    const schoolQuery = await db.select().from(schools).where(eq(schools.npsn, "77777777")).limit(1);
    testSchoolId = schoolQuery[0].id;

    // Setup Sekolah Kedua (Tenant Isolation)
    await db.insert(schools).values({
      npsn: "77777776",
      name: "Classes Test School 2",
      level: "SMA",
      status: "Negeri",
    });
    const schoolQuery2 = await db.select().from(schools).where(eq(schools.npsn, "77777776")).limit(1);
    testSchoolId2 = schoolQuery2[0].id;

    // 2. Setup Tahun Ajaran
    await db.insert(academicYears).values({
      schoolId: testSchoolId,
      year: "2025/2026",
      semester: "Ganjil",
      isActive: true,
    });
    const yearQuery = await db.select().from(academicYears).where(and(eq(academicYears.schoolId, testSchoolId), eq(academicYears.year, "2025/2026"))).limit(1);
    testAcademicYearId = yearQuery[0].id;

    // 3. Setup Wali Kelas
    await db.insert(teachers).values({
      schoolId: testSchoolId,
      name: "Wali Kelas 1",
      gender: "L",
    });
    const teacherQuery1 = await db.select().from(teachers).where(and(eq(teachers.schoolId, testSchoolId), eq(teachers.name, "Wali Kelas 1"))).limit(1);
    testTeacherId1 = teacherQuery1[0].id;

    await db.insert(teachers).values({
      schoolId: testSchoolId2,
      name: "Wali Kelas 2 (Sekolah Lain)",
      gender: "P",
    });
    const teacherQuery2 = await db.select().from(teachers).where(and(eq(teachers.schoolId, testSchoolId2), eq(teachers.name, "Wali Kelas 2 (Sekolah Lain)"))).limit(1);
    testTeacherId2 = teacherQuery2[0].id;

    // 4. Setup Pengguna & Password
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

    // 5. Login untuk mengambil token
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
      await db.delete(classes).where(eq(classes.schoolId, testSchoolId));
      await db.delete(teachers).where(eq(teachers.schoolId, testSchoolId));
      await db.delete(academicYears).where(eq(academicYears.schoolId, testSchoolId));
      await db.delete(users).where(eq(users.schoolId, testSchoolId));
      await db.delete(schools).where(eq(schools.id, testSchoolId));
    }
    if (testSchoolId2) {
      await db.delete(auditLogs).where(eq(auditLogs.schoolId, testSchoolId2));
      await db.delete(sessions).where(eq(sessions.schoolId, testSchoolId2));
      await db.delete(classes).where(eq(classes.schoolId, testSchoolId2));
      await db.delete(teachers).where(eq(teachers.schoolId, testSchoolId2));
      await db.delete(users).where(eq(users.schoolId, testSchoolId2));
      await db.delete(schools).where(eq(schools.id, testSchoolId2));
    }
  });

  // 1. POST /classes (Create)
  it("SchoolAdmin harus sukses menambahkan kelas baru", async () => {
    const res = await fetch("http://localhost:3000/classes", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-school-id": String(testSchoolId),
        "Authorization": `Bearer ${adminAccessToken}`,
      },
      body: JSON.stringify({
        name: "7A",
        academicYearId: testAcademicYearId,
        homeroomTeacherId: testTeacherId1,
        gradeLevel: "7",
        status: "Aktif",
      }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.id).toBeDefined();
    expect(body.data.name).toBe("7A");
    createdClassId = body.data.id;
  });

  it("SchoolAdmin tidak boleh menambahkan kelas dengan nama duplikat di sekolah & tahun ajaran sama", async () => {
    const res = await fetch("http://localhost:3000/classes", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-school-id": String(testSchoolId),
        "Authorization": `Bearer ${adminAccessToken}`,
      },
      body: JSON.stringify({
        name: "7A", // Nama kelas sama
        academicYearId: testAcademicYearId,
        homeroomTeacherId: null,
        gradeLevel: "7",
      }),
    });

    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error).toBe("Nama kelas sudah terdaftar untuk tahun ajaran ini");
  });

  it("SchoolAdmin tidak boleh menambahkan wali kelas dari sekolah lain (Tenant Cross Check)", async () => {
    const res = await fetch("http://localhost:3000/classes", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-school-id": String(testSchoolId),
        "Authorization": `Bearer ${adminAccessToken}`,
      },
      body: JSON.stringify({
        name: "7B",
        academicYearId: testAcademicYearId,
        homeroomTeacherId: testTeacherId2, // Wali kelas sekolah lain
        gradeLevel: "7",
      }),
    });

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error).toBe("Wali kelas harus terdaftar di sekolah yang sama");
  });

  it("Guru biasa (role Teacher) tidak boleh membuat kelas baru (RBAC Forbidden)", async () => {
    const res = await fetch("http://localhost:3000/classes", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-school-id": String(testSchoolId),
        "Authorization": `Bearer ${teacherAccessToken}`,
      },
      body: JSON.stringify({
        name: "7C",
        academicYearId: testAcademicYearId,
        homeroomTeacherId: null,
        gradeLevel: "7",
      }),
    });

    expect(res.status).toBe(403);
  });

  // 2. GET /classes (List) & GET /classes/:id (Read)
  it("Guru biasa (role Teacher) harus bisa membaca daftar kelas di sekolahnya", async () => {
    const res = await fetch("http://localhost:3000/classes", {
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
    expect(body.data[0].name).toBe("7A");

    // Verifikasi metadata pagination
    expect(body.pagination).toBeDefined();
    expect(body.pagination.totalItems).toBeGreaterThan(0);
    expect(body.pagination.totalPages).toBeGreaterThan(0);
    expect(body.pagination.currentPage).toBe(1);
    expect(body.pagination.limit).toBe(10);
  });

  it("Guru harus sukses mengambil daftar kelas dengan query parameters pagination, search, dan status", async () => {
    const res = await fetch("http://localhost:3000/classes?page=1&limit=5&search=7&status=Aktif", {
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
    expect(body.data[0].name).toContain("7");
    expect(body.pagination.currentPage).toBe(1);
    expect(body.pagination.limit).toBe(5);
  });

  it("Guru harus sukses mengambil detail kelas berdasarkan ID", async () => {
    const res = await fetch(`http://localhost:3000/classes/${createdClassId}`, {
      method: "GET",
      headers: {
        "x-school-id": String(testSchoolId),
        "Authorization": `Bearer ${teacherAccessToken}`,
      },
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.name).toBe("7A");
  });

  it("Harus gagal (403 Forbidden) jika mengakses data kelas sekolah lain (Tenant Isolation)", async () => {
    const res = await fetch("http://localhost:3000/classes", {
      method: "GET",
      headers: {
        "x-school-id": String(testSchoolId2), // Meminta tenant sekolah 2
        "Authorization": `Bearer ${teacherAccessToken}`, // Token berasal dari sekolah 1
      },
    });

    expect(res.status).toBe(403);
  });

  // 3. PUT /classes/:id (Update)
  it("SchoolAdmin harus sukses memperbarui data kelas", async () => {
    const res = await fetch(`http://localhost:3000/classes/${createdClassId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "x-school-id": String(testSchoolId),
        "Authorization": `Bearer ${adminAccessToken}`,
      },
      body: JSON.stringify({
        name: "7A-Updated",
        status: "Nonaktif",
      }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.name).toBe("7A-Updated");
    expect(body.data.status).toBe("Nonaktif");
  });

  // 4. DELETE /classes/:id (Delete/Soft Delete)
  it("SchoolAdmin harus sukses melakukan soft delete data kelas", async () => {
    const res = await fetch(`http://localhost:3000/classes/${createdClassId}`, {
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
      .from(classes)
      .where(and(eq(classes.id, createdClassId), isNotNull(classes.deletedAt)));
    
    expect(dbRecord.length).toBe(1);
  });

  it("Kelas yang sudah di-soft-delete tidak boleh muncul di daftar kelas", async () => {
    const res = await fetch("http://localhost:3000/classes", {
      method: "GET",
      headers: {
        "x-school-id": String(testSchoolId),
        "Authorization": `Bearer ${teacherAccessToken}`,
      },
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    const found = body.data.some((c: any) => c.id === createdClassId);
    expect(found).toBe(false);
  });
});
