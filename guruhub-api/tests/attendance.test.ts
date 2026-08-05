// @ts-nocheck
import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { db } from "../src/db";
import { schools } from "../src/schema/schools";
import { users } from "../src/schema/users";
import { schedules } from "../src/schema/schedules";
import { teachers } from "../src/schema/teachers";
import { subjects } from "../src/schema/subjects";
import { classes, classStudents } from "../src/schema/classes";
import { classMembers } from "../src/schema/classMembers";
import { students } from "../src/schema/students";
import { academicYears } from "../src/schema/academicYears";
import { attendances, attendanceDetails } from "../src/schema/attendances";
import { sessions } from "../src/schema/sessions";
import { auditLogs } from "../src/schema/auditLogs";
import { hashPassword } from "../src/utils/password";
import { eq, and, isNull } from "drizzle-orm";

describe("Modul Attendance GuruHub - Clean Architecture & Tenant Isolation", () => {
  let school1Id: number;
  let school2Id: number;
  let academicYear1Id: number;
  let academicYear2Id: number;
  
  let teacher1Id: number;
  let teacher2Id: number;
  let teacher3Id: number;
  
  let student1Id: number;
  let student2Id: number; // Soft deleted
  let student3Id: number;
  
  let class1Id: number;
  let class2Id: number;
  
  let subject1Id: number;
  let subject2Id: number;
  
  let schedule1Id: number; // School 1, Teacher 1
  let schedule2Id: number; // School 1, Teacher 2
  let schedule3Id: number; // School 2, Teacher 3

  let adminToken: string;
  let principalToken: string;
  let teacher1Token: string;
  let teacher2Token: string; // School 2
  let studentToken: string;
  
  const rawPassword = "GuruHub!2026";

  beforeAll(async () => {
    // 1. Setup Sekolah
    const [s1] = await db.insert(schools).values({
      npsn: "11223344",
      name: "Attendance School 1",
      level: "SMA",
      status: "Swasta",
    });
    school1Id = s1.insertId;

    const [s2] = await db.insert(schools).values({
      npsn: "11223345",
      name: "Attendance School 2",
      level: "SMA",
      status: "Negeri",
    });
    school2Id = s2.insertId;

    // 2. Setup Tahun Ajaran
    const [ay1] = await db.insert(academicYears).values({
      schoolId: school1Id,
      year: "2026/2027",
      semester: "Ganjil",
      isActive: true,
    });
    academicYear1Id = ay1.insertId;

    const [ay2] = await db.insert(academicYears).values({
      schoolId: school2Id,
      year: "2026/2027",
      semester: "Ganjil",
      isActive: true,
    });
    academicYear2Id = ay2.insertId;

    // 3. Setup User Akun
    const passwordHash = await hashPassword(rawPassword);

    const [uAdmin] = await db.insert(users).values({
      schoolId: school1Id,
      email: "admin.att@school1.sch.id",
      passwordHash,
      role: "SchoolAdmin",
    });

    const [uPrincipal] = await db.insert(users).values({
      schoolId: school1Id,
      email: "principal.att@school1.sch.id",
      passwordHash,
      role: "Principal",
    });

    const [uTeacher1] = await db.insert(users).values({
      schoolId: school1Id,
      email: "teacher1.att@school1.sch.id",
      passwordHash,
      role: "Teacher",
    });

    const [uTeacher2] = await db.insert(users).values({
      schoolId: school2Id,
      email: "teacher2.att@school2.sch.id",
      passwordHash,
      role: "Teacher",
    });

    const [uStudent] = await db.insert(users).values({
      schoolId: school1Id,
      email: "student.att@school1.sch.id",
      passwordHash,
      role: "Student",
    });

    // 4. Setup Profil Guru
    const [t1] = await db.insert(teachers).values({
      schoolId: school1Id,
      userId: uTeacher1.insertId,
      name: "Guru Utama",
      gender: "L",
    });
    teacher1Id = t1.insertId;

    const [t2] = await db.insert(teachers).values({
      schoolId: school1Id,
      name: "Guru Cadangan",
      gender: "P",
    });
    teacher2Id = t2.insertId;

    const [t3] = await db.insert(teachers).values({
      schoolId: school2Id,
      userId: uTeacher2.insertId,
      name: "Guru Sekolah Lain",
      gender: "L",
    });
    teacher3Id = t3.insertId;

    // 5. Setup Kelas
    const [c1] = await db.insert(classes).values({
      schoolId: school1Id,
      academicYearId: academicYear1Id,
      name: "X-A",
      gradeLevel: "10",
    });
    class1Id = c1.insertId;

    const [c2] = await db.insert(classes).values({
      schoolId: school2Id,
      academicYearId: academicYear2Id,
      name: "X-B",
      gradeLevel: "10",
    });
    class2Id = c2.insertId;

    // 6. Setup Siswa
    const [st1] = await db.insert(students).values({
      schoolId: school1Id,
      nisn: "0011223344",
      nis: "10001",
      name: "Siswa Aktif 1",
      gender: "L",
    });
    student1Id = st1.insertId;

    const [st2] = await db.insert(students).values({
      schoolId: school1Id,
      nisn: "0011223345",
      nis: "10002",
      name: "Siswa Terhapus",
      gender: "P",
      deletedAt: new Date(),
    });
    student2Id = st2.insertId;

    const [st3] = await db.insert(students).values({
      schoolId: school1Id,
      nisn: "0011223346",
      nis: "10003",
      name: "Siswa Aktif 2",
      gender: "P",
    });
    student3Id = st3.insertId;

    // Hubungkan Siswa ke Kelas
    await db.insert(classStudents).values([
      { schoolId: school1Id, classId: class1Id, studentId: student1Id },
      { schoolId: school1Id, classId: class1Id, studentId: student2Id }, // soft deleted student
      { schoolId: school1Id, classId: class1Id, studentId: student3Id },
    ]);

    await db.insert(classMembers).values([
      { schoolId: school1Id, classId: class1Id, studentId: student1Id, academicYearId: academicYear1Id, status: "ACTIVE" },
      { schoolId: school1Id, classId: class1Id, studentId: student2Id, academicYearId: academicYear1Id, status: "ACTIVE" },
      { schoolId: school1Id, classId: class1Id, studentId: student3Id, academicYearId: academicYear1Id, status: "ACTIVE" },
    ]);

    // 7. Setup Mata Pelajaran
    const [sub1] = await db.insert(subjects).values({
      schoolId: school1Id,
      name: "Pendidikan Pancasila",
      code: "PPKN-10",
      gradeLevel: "10",
    });
    subject1Id = sub1.insertId;

    const [sub2] = await db.insert(subjects).values({
      schoolId: school2Id,
      name: "Pendidikan Pancasila S2",
      code: "PPKN-10-S2",
      gradeLevel: "10",
    });
    subject2Id = sub2.insertId;

    // 8. Setup Jadwal Pelajaran
    const [sch1] = await db.insert(schedules).values({
      schoolId: school1Id,
      classId: class1Id,
      subjectId: subject1Id,
      teacherId: teacher1Id,
      academicYearId: academicYear1Id,
      dayOfWeek: "Senin",
      startTime: "07:00",
      endTime: "08:20",
    });
    schedule1Id = sch1.insertId;

    const [sch2] = await db.insert(schedules).values({
      schoolId: school1Id,
      classId: class1Id,
      subjectId: subject1Id,
      teacherId: teacher2Id, // teacher 2 (bukan teacher1)
      academicYearId: academicYear1Id,
      dayOfWeek: "Selasa",
      startTime: "07:00",
      endTime: "08:20",
    });
    schedule2Id = sch2.insertId;

    const [sch3] = await db.insert(schedules).values({
      schoolId: school2Id,
      classId: class2Id,
      subjectId: subject2Id,
      teacherId: teacher3Id,
      academicYearId: academicYear2Id,
      dayOfWeek: "Senin",
      startTime: "07:00",
      endTime: "08:20",
    });
    schedule3Id = sch3.insertId;

    // 9. Login untuk mengambil token
    const fetchToken = async (email: string) => {
      const res = await fetch("http://localhost:3000/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ schoolId: email.includes("school2") ? school2Id : school1Id, email, password: rawPassword }),
      });
      const body = await res.json();
      return body.accessToken;
    };

    adminToken = await fetchToken("admin.att@school1.sch.id");
    principalToken = await fetchToken("principal.att@school1.sch.id");
    teacher1Token = await fetchToken("teacher1.att@school1.sch.id");
    teacher2Token = await fetchToken("teacher2.att@school2.sch.id");
    studentToken = await fetchToken("student.att@school1.sch.id");
  });

  afterAll(async () => {
    // Clean up
    await db.delete(attendanceDetails);
    await db.delete(attendances);
    await db.delete(classStudents);
    await db.delete(classMembers);
    await db.delete(students);
    await db.delete(classes);
    await db.delete(schedules);
    await db.delete(teachers);
    await db.delete(subjects);
    await db.delete(academicYears);
    await db.delete(sessions);
    await db.delete(auditLogs);
    await db.delete(users);
    await db.delete(schools);
  });

  // 1. Teacher membuat absensi berhasil
  it("1. Teacher membuat absensi berhasil", async () => {
    const res = await fetch("http://localhost:3000/attendances", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-school-id": String(school1Id),
        "Authorization": `Bearer ${teacher1Token}`,
      },
      body: JSON.stringify({
        scheduleId: schedule1Id,
        attendanceDate: "2026-06-15",
        notes: "Pertemuan Pertama",
        details: [
          { studentId: student1Id, status: "PRESENT" },
          { studentId: student3Id, status: "SICK" },
        ],
      }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.id).toBeDefined();
  });

  // 2. Teacher sekolah lain gagal
  it("2. Teacher sekolah lain gagal membuat absensi di tenant pertama", async () => {
    const res = await fetch("http://localhost:3000/attendances", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-school-id": String(school1Id), // Header tenant school 1
        "Authorization": `Bearer ${teacher2Token}`, // Token dari school 2
      },
      body: JSON.stringify({
        scheduleId: schedule1Id,
        attendanceDate: "2026-06-16",
        details: [],
      }),
    });

    expect(res.status).toBe(403); // Forbidden cross tenant
  });

  // 3. Tenant isolation
  it("3. Tenant isolation menghalangi guru sekolah 1 mengakses daftar absensi sekolah 2", async () => {
    const res = await fetch("http://localhost:3000/attendances", {
      method: "GET",
      headers: {
        "x-school-id": String(school2Id), // Request tenant 2
        "Authorization": `Bearer ${teacher1Token}`, // Token tenant 1
      },
    });

    expect(res.status).toBe(403);
  });

  // 4. Duplicate attendance ditolak
  it("4. Duplicate attendance (schedule + date yang sama) ditolak", async () => {
    const res = await fetch("http://localhost:3000/attendances", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-school-id": String(school1Id),
        "Authorization": `Bearer ${teacher1Token}`,
      },
      body: JSON.stringify({
        scheduleId: schedule1Id,
        attendanceDate: "2026-06-15", // Sama dengan test 1
        details: [
          { studentId: student1Id, status: "PRESENT" },
        ],
      }),
    });

    expect(res.status).toBe(409); // Conflict
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error).toContain("sudah dibuat");
  });

  // 5. Soft delete & 15. Soft deleted attendance tidak muncul
  it("5 & 15. Soft delete berfungsi dan absensi terhapus tidak muncul di list", async () => {
    // Buat absensi baru untuk di-delete
    const createRes = await fetch("http://localhost:3000/attendances", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-school-id": String(school1Id),
        "Authorization": `Bearer ${teacher1Token}`,
      },
      body: JSON.stringify({
        scheduleId: schedule1Id,
        attendanceDate: "2026-06-18",
        details: [{ studentId: student1Id, status: "PRESENT" }],
      }),
    });
    const createBody = await createRes.json();
    const targetId = createBody.data.id;

    // Hapus (membutuhkan role Admin/Principal)
    const deleteRes = await fetch(`http://localhost:3000/attendances/${targetId}`, {
      method: "DELETE",
      headers: {
        "x-school-id": String(school1Id),
        "Authorization": `Bearer ${adminToken}`,
      },
    });
    expect(deleteRes.status).toBe(200);

    // Cek di list
    const listRes = await fetch("http://localhost:3000/attendances", {
      method: "GET",
      headers: {
        "x-school-id": String(school1Id),
        "Authorization": `Bearer ${teacher1Token}`,
      },
    });
    const listBody = await listRes.json();
    const found = listBody.data.some((a: any) => a.id === targetId);
    expect(found).toBe(false);
  });

  // 6. Detail siswa tersimpan
  it("6. Detail status kehadiran siswa tersimpan dengan benar", async () => {
    const listRes = await db
      .select()
      .from(attendanceDetails)
      .where(eq(attendanceDetails.studentId, student3Id));
    
    expect(listRes.length).toBeGreaterThan(0);
    expect(listRes[0].status).toBe("SICK");
  });

  // 7. Siswa soft delete tidak muncul
  it("7. Siswa soft delete tidak boleh diisi absensinya", async () => {
    const res = await fetch("http://localhost:3000/attendances", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-school-id": String(school1Id),
        "Authorization": `Bearer ${teacher1Token}`,
      },
      body: JSON.stringify({
        scheduleId: schedule1Id,
        attendanceDate: "2026-06-20",
        details: [
          { studentId: student2Id, status: "PRESENT" }, // student2Id terhapus
        ],
      }),
    });

    expect(res.status).toBe(400); // Bad Request
    const body = await res.json();
    expect(body.error).toContain("tidak aktif atau tidak terdaftar");
  });

  // 8. Update absensi berhasil
  it("8. Update status kehadiran siswa berhasil", async () => {
    // Cari id absensi tanggal 15
    const query = await db
      .select()
      .from(attendances)
      .where(and(eq(attendances.scheduleId, schedule1Id), eq(attendances.attendanceDate, "2026-06-15")))
      .limit(1);
    const targetId = query[0].id;

    const res = await fetch(`http://localhost:3000/attendances/${targetId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "x-school-id": String(school1Id),
        "Authorization": `Bearer ${teacher1Token}`,
      },
      body: JSON.stringify({
        notes: "Pertemuan Pertama - Updated",
        details: [
          { studentId: student3Id, status: "PRESENT" }, // Sebelumnya SICK
        ],
      }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);

    const checkDetails = await db
      .select()
      .from(attendanceDetails)
      .where(and(eq(attendanceDetails.attendanceId, targetId), eq(attendanceDetails.studentId, student3Id)));
    
    expect(checkDetails[0].status).toBe("PRESENT");
  });

  // 9. Teacher hanya boleh mengisi jadwal miliknya
  it("9. Teacher menolak mengisi jadwal guru lain", async () => {
    const res = await fetch("http://localhost:3000/attendances", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-school-id": String(school1Id),
        "Authorization": `Bearer ${teacher1Token}`, // Teacher 1
      },
      body: JSON.stringify({
        scheduleId: schedule2Id, // Jadwal milik Teacher 2
        attendanceDate: "2026-06-15",
        details: [],
      }),
    });

    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toContain("jadwal mengajar Anda sendiri");
  });

  // 10. SchoolAdmin bisa mengisi semua jadwal sekolah
  it("10. SchoolAdmin bisa mengisi semua jadwal sekolah", async () => {
    const res = await fetch("http://localhost:3000/attendances", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-school-id": String(school1Id),
        "Authorization": `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        scheduleId: schedule2Id, // Jadwal milik Guru Cadangan
        attendanceDate: "2026-06-25",
        details: [],
      }),
    });

    expect(res.status).toBe(200);
  });

  // 11. Principal bisa mengisi semua jadwal sekolah
  it("11. Principal bisa mengisi semua jadwal sekolah", async () => {
    const res = await fetch("http://localhost:3000/attendances", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-school-id": String(school1Id),
        "Authorization": `Bearer ${principalToken}`,
      },
      body: JSON.stringify({
        scheduleId: schedule2Id,
        attendanceDate: "2026-06-26",
        details: [],
      }),
    });

    expect(res.status).toBe(200);
  });

  // 12. Student ditolak
  it("12. Student ditolak melakukan modifikasi absensi", async () => {
    const res = await fetch("http://localhost:3000/attendances", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-school-id": String(school1Id),
        "Authorization": `Bearer ${studentToken}`,
      },
      body: JSON.stringify({
        scheduleId: schedule1Id,
        attendanceDate: "2026-06-27",
        details: [],
      }),
    });

    expect(res.status).toBe(403);
  });

  // 13. GET list berhasil
  it("13. GET list absensi dengan filter berhasil", async () => {
    const res = await fetch(`http://localhost:3000/attendances?classId=${class1Id}`, {
      method: "GET",
      headers: {
        "x-school-id": String(school1Id),
        "Authorization": `Bearer ${teacher1Token}`,
      },
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.length).toBeGreaterThan(0);
  });

  // 14. GET detail berhasil
  it("14. GET detail absensi beserta siswa berhasil", async () => {
    const query = await db
      .select()
      .from(attendances)
      .where(and(eq(attendances.scheduleId, schedule1Id), eq(attendances.attendanceDate, "2026-06-15")))
      .limit(1);
    const targetId = query[0].id;

    const res = await fetch(`http://localhost:3000/attendances/${targetId}`, {
      method: "GET",
      headers: {
        "x-school-id": String(school1Id),
        "Authorization": `Bearer ${teacher1Token}`,
      },
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.details).toBeDefined();
    expect(body.data.details.length).toBeGreaterThan(0);
  });
});
