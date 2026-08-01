// @ts-nocheck
import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { db } from "../src/db";
import { schools } from "../src/schema/schools";
import { users } from "../src/schema/users";
import { students } from "../src/schema/students";
import { teachers } from "../src/schema/teachers";
import { academicYears } from "../src/schema/academicYears";
import { classes } from "../src/schema/classes";
import { classMembers } from "../src/schema/classMembers";
import { sessions } from "../src/schema/sessions";
import { auditLogs } from "../src/schema/auditLogs";
import { hashPassword } from "../src/utils/password";
import { eq, and, isNotNull } from "drizzle-orm";

describe("Modul Students GuruHub - Clean Architecture & Tenant Isolation", () => {
  let testSchoolId: number;
  let testSchoolId2: number;
  let adminAccessToken: string;
  let teacherAccessToken: string;
  let createdStudentId: number;
  let testAyId: number;
  let testClassId: number;

  const adminEmail = "admin.students@testschool.sch.id";
  const teacherEmail = "teacher.students@testschool.sch.id";
  const rawPassword = "GuruHub!2026";

  beforeAll(async () => {
    // 1. Setup Sekolah Pertama
    await db.insert(schools).values({
      npsn: "99999999",
      name: "Students Test School 1",
      level: "SMA",
      status: "Swasta",
    });
    const schoolQuery = await db.select().from(schools).where(eq(schools.npsn, "99999999")).limit(1);
    testSchoolId = schoolQuery[0].id;

    // Setup Sekolah Kedua (Tenant Isolation)
    await db.insert(schools).values({
      npsn: "99999998",
      name: "Students Test School 2",
      level: "SMA",
      status: "Negeri",
    });
    const schoolQuery2 = await db.select().from(schools).where(eq(schools.npsn, "99999998")).limit(1);
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

    const teacherUserQuery = await db.select().from(users).where(eq(users.email, teacherEmail)).limit(1);
    const teacherUserId = teacherUserQuery[0].id;

    const [teacherInserted] = await db.insert(teachers).values({
      schoolId: testSchoolId,
      userId: teacherUserId,
      nip: "123456789012345678",
      name: "Teacher Test Profile",
      gender: "L",
    });
    const testTeacherId = teacherInserted.insertId;

    const [ayInserted] = await db.insert(academicYears).values({
      schoolId: testSchoolId,
      year: "2026/2027",
      semester: "Ganjil",
      isActive: true,
    });
    testAyId = ayInserted.insertId;

    const [classInserted] = await db.insert(classes).values({
      schoolId: testSchoolId,
      academicYearId: testAyId,
      homeroomTeacherId: testTeacherId,
      name: "X-MIPA-1",
      gradeLevel: "10",
      status: "Aktif",
    });
    testClassId = classInserted.insertId;

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
      await db.delete(students).where(eq(students.schoolId, testSchoolId));
      await db.delete(users).where(eq(users.schoolId, testSchoolId));
      await db.delete(schools).where(eq(schools.id, testSchoolId));
    }
    if (testSchoolId2) {
      await db.delete(auditLogs).where(eq(auditLogs.schoolId, testSchoolId2));
      await db.delete(sessions).where(eq(sessions.schoolId, testSchoolId2));
      await db.delete(teachers).where(eq(teachers.schoolId, testSchoolId2));
      await db.delete(students).where(eq(students.schoolId, testSchoolId2));
      await db.delete(users).where(eq(users.schoolId, testSchoolId2));
      await db.delete(schools).where(eq(schools.id, testSchoolId2));
    }
  });

  // 1. POST /students (Create)
  it("SchoolAdmin harus sukses menambahkan data siswa baru", async () => {
    const res = await fetch("http://localhost:3000/students", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-school-id": String(testSchoolId),
        "Authorization": `Bearer ${adminAccessToken}`,
      },
      body: JSON.stringify({
        nisn: "0123456789",
        nis: "202610001",
        name: "Ahmad Dahlan",
        gender: "L",
        birthPlace: "Jakarta",
        birthDate: "2010-08-17",
        status: "Aktif",
      }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.id).toBeDefined();
    expect(body.data.name).toBe("Ahmad Dahlan");
    createdStudentId = body.data.id;

    // Enroll student in class
    await db.insert(classMembers).values({
      schoolId: testSchoolId,
      classId: testClassId,
      studentId: createdStudentId,
      academicYearId: testAyId,
      status: "ACTIVE",
    });
  });

  it("SchoolAdmin tidak boleh menambahkan siswa dengan NIS duplikat di sekolah yang sama", async () => {
    const res = await fetch("http://localhost:3000/students", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-school-id": String(testSchoolId),
        "Authorization": `Bearer ${adminAccessToken}`,
      },
      body: JSON.stringify({
        nisn: "9876543210", // NISN berbeda
        nis: "202610001",   // NIS sama
        name: "Siti Rahma",
        gender: "P",
      }),
    });

    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error).toBe("NIS siswa sudah terdaftar di sekolah ini");
  });

  it("SchoolAdmin tidak boleh menambahkan siswa dengan NISN duplikat secara nasional", async () => {
    const res = await fetch("http://localhost:3000/students", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-school-id": String(testSchoolId),
        "Authorization": `Bearer ${adminAccessToken}`,
      },
      body: JSON.stringify({
        nisn: "0123456789", // NISN sama
        nis: "202610002",   // NIS berbeda
        name: "Dewi Sartika",
        gender: "P",
      }),
    });

    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error).toBe("NISN siswa sudah terdaftar secara nasional");
  });

  it("Guru biasa (role Teacher) tidak boleh menambahkan siswa baru (RBAC Forbidden)", async () => {
    const res = await fetch("http://localhost:3000/students", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-school-id": String(testSchoolId),
        "Authorization": `Bearer ${teacherAccessToken}`,
      },
      body: JSON.stringify({
        nisn: "2233445566",
        nis: "202610003",
        name: "Ki Hajar Dewantara",
        gender: "L",
      }),
    });

    expect(res.status).toBe(403);
  });

  // 2. GET /students (List) & GET /students/:id (Read)
  it("Guru biasa (role Teacher) harus bisa membaca daftar siswa di sekolahnya", async () => {
    const res = await fetch("http://localhost:3000/students", {
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
    expect(body.data[0].nisn).toBe("0123456789");
    
    // Verifikasi metadata pagination
    expect(body.pagination).toBeDefined();
    expect(body.pagination.totalItems).toBeGreaterThan(0);
    expect(body.pagination.totalPages).toBeGreaterThan(0);
    expect(body.pagination.currentPage).toBe(1);
    expect(body.pagination.limit).toBe(10);
  });

  it("Guru harus sukses mengambil daftar siswa dengan query parameters pagination, search, dan status", async () => {
    const res = await fetch("http://localhost:3000/students?page=1&limit=5&search=Ahmad&status=Aktif", {
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
    expect(body.data[0].name).toContain("Ahmad");
    expect(body.pagination.currentPage).toBe(1);
    expect(body.pagination.limit).toBe(5);
  });

  it("Guru harus sukses mengambil detail siswa berdasarkan ID", async () => {
    const res = await fetch(`http://localhost:3000/students/${createdStudentId}`, {
      method: "GET",
      headers: {
        "x-school-id": String(testSchoolId),
        "Authorization": `Bearer ${teacherAccessToken}`,
      },
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.name).toBe("Ahmad Dahlan");
  });

  it("Harus gagal (403 Forbidden) jika mengakses data siswa sekolah lain (Tenant Isolation)", async () => {
    const res = await fetch("http://localhost:3000/students", {
      method: "GET",
      headers: {
        "x-school-id": String(testSchoolId2), // Meminta tenant sekolah 2
        "Authorization": `Bearer ${teacherAccessToken}`, // Token berasal dari sekolah 1
      },
    });

    expect(res.status).toBe(403);
  });

  // 3. PUT /students/:id (Update)
  it("SchoolAdmin harus sukses memperbarui data siswa", async () => {
    const res = await fetch(`http://localhost:3000/students/${createdStudentId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "x-school-id": String(testSchoolId),
        "Authorization": `Bearer ${adminAccessToken}`,
      },
      body: JSON.stringify({
        name: "Ahmad Dahlan (Updated)",
        status: "Nonaktif",
      }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.name).toBe("Ahmad Dahlan (Updated)");
    expect(body.data.status).toBe("Nonaktif");
  });

  // 4. DELETE /students/:id (Delete/Soft Delete)
  it("SchoolAdmin harus sukses melakukan soft delete data siswa", async () => {
    const res = await fetch(`http://localhost:3000/students/${createdStudentId}`, {
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
      .from(students)
      .where(and(eq(students.id, createdStudentId), isNotNull(students.deletedAt)));
    
    expect(dbRecord.length).toBe(1);
  });

  it("Siswa yang sudah di-soft-delete tidak boleh muncul di daftar siswa", async () => {
    const res = await fetch("http://localhost:3000/students", {
      method: "GET",
      headers: {
        "x-school-id": String(testSchoolId),
        "Authorization": `Bearer ${teacherAccessToken}`,
      },
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    const found = body.data.some((s: any) => s.id === createdStudentId);
    expect(found).toBe(false);
  });
});
