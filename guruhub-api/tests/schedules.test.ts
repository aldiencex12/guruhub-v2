// @ts-nocheck
import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { db } from "../src/db";
import { schools } from "../src/schema/schools";
import { users } from "../src/schema/users";
import { schedules } from "../src/schema/schedules";
import { teachers } from "../src/schema/teachers";
import { subjects } from "../src/schema/subjects";
import { classes } from "../src/schema/classes";
import { academicYears } from "../src/schema/academicYears";
import { sessions } from "../src/schema/sessions";
import { auditLogs } from "../src/schema/auditLogs";
import { hashPassword } from "../src/utils/password";
import { eq, and, isNotNull } from "drizzle-orm";

describe("Modul Schedules GuruHub - Clean Architecture & Tenant Isolation", () => {
  let testSchoolId: number;
  let testSchoolId2: number;
  let testAcademicYearId: number;
  let testAcademicYearId2: number;
  let testClassId: number;
  let testClassId2: number;
  let testTeacherId: number;
  let testTeacherId2: number;
  let testSubjectId: number;
  let testSubjectId2: number;
  
  let adminAccessToken: string;
  let teacherAccessToken: string;
  let createdScheduleId: number;

  const adminEmail = "admin.schedules@testschool.sch.id";
  const teacherEmail = "teacher.schedules@testschool.sch.id";
  const rawPassword = "GuruHub!2026";

  beforeAll(async () => {
    // 1. Setup Sekolah Pertama
    await db.insert(schools).values({
      npsn: "55555555",
      name: "Schedules Test School 1",
      level: "SMA",
      status: "Swasta",
    });
    const schoolQuery = await db.select().from(schools).where(eq(schools.npsn, "55555555")).limit(1);
    testSchoolId = schoolQuery[0].id;

    // Setup Sekolah Kedua (Tenant Isolation)
    await db.insert(schools).values({
      npsn: "55555554",
      name: "Schedules Test School 2",
      level: "SMA",
      status: "Negeri",
    });
    const schoolQuery2 = await db.select().from(schools).where(eq(schools.npsn, "55555554")).limit(1);
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

    await db.insert(academicYears).values({
      schoolId: testSchoolId2,
      year: "2025/2026",
      semester: "Ganjil",
      isActive: true,
    });
    const yearQuery2 = await db.select().from(academicYears).where(and(eq(academicYears.schoolId, testSchoolId2), eq(academicYears.year, "2025/2026"))).limit(1);
    testAcademicYearId2 = yearQuery2[0].id;

    // 3. Setup Guru
    await db.insert(teachers).values({
      schoolId: testSchoolId,
      name: "Guru Jadwal 1",
      gender: "L",
    });
    const teacherQuery1 = await db.select().from(teachers).where(and(eq(teachers.schoolId, testSchoolId), eq(teachers.name, "Guru Jadwal 1"))).limit(1);
    testTeacherId = teacherQuery1[0].id;

    await db.insert(teachers).values({
      schoolId: testSchoolId2,
      name: "Guru Jadwal 2 (Sekolah Lain)",
      gender: "P",
    });
    const teacherQuery2 = await db.select().from(teachers).where(and(eq(teachers.schoolId, testSchoolId2), eq(teachers.name, "Guru Jadwal 2 (Sekolah Lain)"))).limit(1);
    testTeacherId2 = teacherQuery2[0].id;

    // 4. Setup Mata Pelajaran
    await db.insert(subjects).values({
      schoolId: testSchoolId,
      name: "Matematika Schedules",
      code: "MAT-SCH",
      gradeLevel: "7",
    });
    const subjectQuery1 = await db.select().from(subjects).where(and(eq(subjects.schoolId, testSchoolId), eq(subjects.code, "MAT-SCH"))).limit(1);
    testSubjectId = subjectQuery1[0].id;

    await db.insert(subjects).values({
      schoolId: testSchoolId2,
      name: "Matematika Schedules 2",
      code: "MAT-SCH-2",
      gradeLevel: "7",
    });
    const subjectQuery2 = await db.select().from(subjects).where(and(eq(subjects.schoolId, testSchoolId2), eq(subjects.code, "MAT-SCH-2"))).limit(1);
    testSubjectId2 = subjectQuery2[0].id;

    // 5. Setup Kelas
    await db.insert(classes).values({
      schoolId: testSchoolId,
      academicYearId: testAcademicYearId,
      name: "8A-SCH",
      gradeLevel: "8",
    });
    const classQuery1 = await db.select().from(classes).where(and(eq(classes.schoolId, testSchoolId), eq(classes.name, "8A-SCH"))).limit(1);
    testClassId = classQuery1[0].id;

    await db.insert(classes).values({
      schoolId: testSchoolId2,
      academicYearId: testAcademicYearId2,
      name: "8A-SCH-2",
      gradeLevel: "8",
    });
    const classQuery2 = await db.select().from(classes).where(and(eq(classes.schoolId, testSchoolId2), eq(classes.name, "8A-SCH-2"))).limit(1);
    testClassId2 = classQuery2[0].id;

    // 6. Setup Pengguna & Password
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

    // 7. Login untuk mengambil token
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
      await db.delete(schedules).where(eq(schedules.schoolId, testSchoolId));
      await db.delete(classes).where(eq(classes.schoolId, testSchoolId));
      await db.delete(subjects).where(eq(subjects.schoolId, testSchoolId));
      await db.delete(teachers).where(eq(teachers.schoolId, testSchoolId));
      await db.delete(academicYears).where(eq(academicYears.schoolId, testSchoolId));
      await db.delete(users).where(eq(users.schoolId, testSchoolId));
      await db.delete(schools).where(eq(schools.id, testSchoolId));
    }
    if (testSchoolId2) {
      await db.delete(auditLogs).where(eq(auditLogs.schoolId, testSchoolId2));
      await db.delete(sessions).where(eq(sessions.schoolId, testSchoolId2));
      await db.delete(schedules).where(eq(schedules.schoolId, testSchoolId2));
      await db.delete(classes).where(eq(classes.schoolId, testSchoolId2));
      await db.delete(subjects).where(eq(subjects.schoolId, testSchoolId2));
      await db.delete(teachers).where(eq(teachers.schoolId, testSchoolId2));
      await db.delete(academicYears).where(eq(academicYears.schoolId, testSchoolId2));
      await db.delete(users).where(eq(users.schoolId, testSchoolId2));
      await db.delete(schools).where(eq(schools.id, testSchoolId2));
    }
  });

  // 1. POST /schedules (Create)
  it("SchoolAdmin harus sukses menambahkan jadwal baru", async () => {
    const res = await fetch("http://localhost:3000/schedules", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-school-id": String(testSchoolId),
        "Authorization": `Bearer ${adminAccessToken}`,
      },
      body: JSON.stringify({
        classId: testClassId,
        subjectId: testSubjectId,
        teacherId: testTeacherId,
        academicYearId: testAcademicYearId,
        dayOfWeek: "Senin",
        startTime: "07:00",
        endTime: "08:20",
        status: "Aktif",
      }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.id).toBeDefined();
    expect(body.data.dayOfWeek).toBe("Senin");
    createdScheduleId = body.data.id;
  });

  it("SchoolAdmin tidak boleh menambahkan jadwal dengan startTime >= endTime", async () => {
    const res = await fetch("http://localhost:3000/schedules", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-school-id": String(testSchoolId),
        "Authorization": `Bearer ${adminAccessToken}`,
      },
      body: JSON.stringify({
        classId: testClassId,
        subjectId: testSubjectId,
        teacherId: testTeacherId,
        academicYearId: testAcademicYearId,
        dayOfWeek: "Senin",
        startTime: "08:30",
        endTime: "08:00", // Waktu mulai setelah selesai
      }),
    });

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error).toBe("Jam mulai harus lebih awal dibanding jam selesai");
  });

  it("SchoolAdmin tidak boleh menambahkan jadwal dengan guru sekolah lain (Tenant Cross Check)", async () => {
    const res = await fetch("http://localhost:3000/schedules", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-school-id": String(testSchoolId),
        "Authorization": `Bearer ${adminAccessToken}`,
      },
      body: JSON.stringify({
        classId: testClassId,
        subjectId: testSubjectId,
        teacherId: testTeacherId2, // Guru sekolah lain
        academicYearId: testAcademicYearId,
        dayOfWeek: "Senin",
        startTime: "08:30",
        endTime: "09:50",
      }),
    });

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error).toBe("Guru harus terdaftar di sekolah yang sama");
  });

  it("SchoolAdmin tidak boleh menambahkan jadwal bentrok untuk Guru (jam yang sama)", async () => {
    // Menambahkan kelas lain ke Guru yang sama di waktu yang tumpang tindih (08:00 - 09:00, bentrok dengan 07:00 - 08:20)
    const res = await fetch("http://localhost:3000/schedules", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-school-id": String(testSchoolId),
        "Authorization": `Bearer ${adminAccessToken}`,
      },
      body: JSON.stringify({
        classId: testClassId, // Kelas yang sama atau berbeda tidak masalah untuk guru
        subjectId: testSubjectId,
        teacherId: testTeacherId, // Guru yang sama
        academicYearId: testAcademicYearId,
        dayOfWeek: "Senin",
        startTime: "08:00", // Tumpang tindih dengan 07:00-08:20
        endTime: "09:00",
      }),
    });

    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error).toBe("Guru tersebut sudah memiliki jadwal mengajar pada jam ini");
  });

  it("Guru biasa (role Teacher) tidak boleh membuat jadwal baru (RBAC Forbidden)", async () => {
    const res = await fetch("http://localhost:3000/schedules", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-school-id": String(testSchoolId),
        "Authorization": `Bearer ${teacherAccessToken}`,
      },
      body: JSON.stringify({
        classId: testClassId,
        subjectId: testSubjectId,
        teacherId: testTeacherId,
        academicYearId: testAcademicYearId,
        dayOfWeek: "Selasa",
        startTime: "07:00",
        endTime: "08:20",
      }),
    });

    expect(res.status).toBe(403);
  });

  // 2. GET /schedules (List) & GET /schedules/:id (Read)
  it("Guru biasa (role Teacher) harus bisa membaca daftar jadwal di sekolahnya", async () => {
    const res = await fetch("http://localhost:3000/schedules", {
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
  });

  it("Guru harus sukses mengambil detail jadwal berdasarkan ID", async () => {
    const res = await fetch(`http://localhost:3000/schedules/${createdScheduleId}`, {
      method: "GET",
      headers: {
        "x-school-id": String(testSchoolId),
        "Authorization": `Bearer ${teacherAccessToken}`,
      },
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.dayOfWeek).toBe("Senin");
  });

  it("Harus gagal (403 Forbidden) jika mengakses data jadwal sekolah lain (Tenant Isolation)", async () => {
    const res = await fetch("http://localhost:3000/schedules", {
      method: "GET",
      headers: {
        "x-school-id": String(testSchoolId2), // Meminta tenant sekolah 2
        "Authorization": `Bearer ${teacherAccessToken}`, // Token berasal dari sekolah 1
      },
    });

    expect(res.status).toBe(403);
  });

  // 3. PUT /schedules/:id (Update)
  it("SchoolAdmin harus sukses memperbarui data jadwal", async () => {
    const res = await fetch(`http://localhost:3000/schedules/${createdScheduleId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "x-school-id": String(testSchoolId),
        "Authorization": `Bearer ${adminAccessToken}`,
      },
      body: JSON.stringify({
        startTime: "09:00",
        endTime: "10:20",
        status: "Nonaktif",
      }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.startTime).toContain("09:00");
    expect(body.data.status).toBe("Nonaktif");
  });

  // 4. DELETE /schedules/:id (Delete/Soft Delete)
  it("SchoolAdmin harus sukses melakukan soft delete data jadwal", async () => {
    const res = await fetch(`http://localhost:3000/schedules/${createdScheduleId}`, {
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
      .from(schedules)
      .where(and(eq(schedules.id, createdScheduleId), isNotNull(schedules.deletedAt)));
    
    expect(dbRecord.length).toBe(1);
  });

  it("Jadwal yang sudah di-soft-delete tidak boleh muncul di daftar jadwal", async () => {
    const res = await fetch("http://localhost:3000/schedules", {
      method: "GET",
      headers: {
        "x-school-id": String(testSchoolId),
        "Authorization": `Bearer ${teacherAccessToken}`,
      },
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    const found = body.data.some((s: any) => s.id === createdScheduleId);
    expect(found).toBe(false);
  });
});
