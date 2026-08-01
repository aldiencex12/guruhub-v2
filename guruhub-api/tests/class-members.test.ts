// @ts-nocheck
import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { db } from "../src/db";
import { schools } from "../src/schema/schools";
import { users } from "../src/schema/users";
import { classes } from "../src/schema/classes";
import { students } from "../src/schema/students";
import { academicYears } from "../src/schema/academicYears";
import { classMembers } from "../src/schema/classMembers";
import { sessions } from "../src/schema/sessions";
import { auditLogs } from "../src/schema/auditLogs";
import { hashPassword } from "../src/utils/password";
import { eq, and, isNotNull } from "drizzle-orm";

describe("Modul Class Membership GuruHub - Clean Architecture & Tenant Isolation", () => {
  let school1Id: number;
  let school2Id: number;
  let academicYear1Id: number;
  let academicYear2Id: number;
  
  let student1Id: number;
  let student2Id: number; // soft-deleted
  let student3Id: number; // school 2
  let student4Id: number; // for principal test
  
  let class1Id: number;
  let class2Id: number;
  let class3Id: number; // school 2
  let class4Id: number; // soft-deleted class
  
  let adminToken: string;
  let principalToken: string;
  let teacherToken: string;
  let studentToken: string;
  
  let createdMembershipId: number;
  
  const rawPassword = "GuruHub!2026";

  beforeAll(async () => {
    // 1. Setup Sekolah
    const [s1] = await db.insert(schools).values({
      npsn: "12345678",
      name: "Membership School 1",
      level: "SMA",
      status: "Swasta",
    });
    school1Id = s1.insertId;

    const [s2] = await db.insert(schools).values({
      npsn: "12345679",
      name: "Membership School 2",
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

    await db.insert(users).values({
      schoolId: school1Id,
      email: "admin.mem@school1.sch.id",
      passwordHash,
      role: "SchoolAdmin",
    });

    await db.insert(users).values({
      schoolId: school1Id,
      email: "principal.mem@school1.sch.id",
      passwordHash,
      role: "Principal",
    });

    await db.insert(users).values({
      schoolId: school1Id,
      email: "teacher.mem@school1.sch.id",
      passwordHash,
      role: "Teacher",
    });

    await db.insert(users).values({
      schoolId: school1Id,
      email: "student.mem@school1.sch.id",
      passwordHash,
      role: "Student",
    });

    // 4. Setup Kelas
    const [c1] = await db.insert(classes).values({
      schoolId: school1Id,
      academicYearId: academicYear1Id,
      name: "XI-A",
      gradeLevel: "11",
    });
    class1Id = c1.insertId;

    const [c2] = await db.insert(classes).values({
      schoolId: school1Id,
      academicYearId: academicYear1Id,
      name: "XI-B",
      gradeLevel: "11",
    });
    class2Id = c2.insertId;

    const [c3] = await db.insert(classes).values({
      schoolId: school2Id,
      academicYearId: academicYear2Id,
      name: "XI-C",
      gradeLevel: "11",
    });
    class3Id = c3.insertId;

    const [c4] = await db.insert(classes).values({
      schoolId: school1Id,
      academicYearId: academicYear1Id,
      name: "XI-D-Deleted",
      gradeLevel: "11",
      deletedAt: new Date(),
    });
    class4Id = c4.insertId;

    // 5. Setup Siswa
    const [st1] = await db.insert(students).values({
      schoolId: school1Id,
      nisn: "1111222233",
      nis: "20001",
      name: "Siswa Mem 1",
      gender: "L",
    });
    student1Id = st1.insertId;

    const [st2] = await db.insert(students).values({
      schoolId: school1Id,
      nisn: "1111222234",
      nis: "20002",
      name: "Siswa Mem Terhapus",
      gender: "P",
      deletedAt: new Date(),
    });
    student2Id = st2.insertId;

    const [st3] = await db.insert(students).values({
      schoolId: school2Id,
      nisn: "1111222235",
      nis: "20003",
      name: "Siswa Mem Sekolah Lain",
      gender: "L",
    });
    student3Id = st3.insertId;

    const [st4] = await db.insert(students).values({
      schoolId: school1Id,
      nisn: "1111222236",
      nis: "20004",
      name: "Siswa Mem 4",
      gender: "P",
    });
    student4Id = st4.insertId;

    // 6. Login untuk mengambil token
    const fetchToken = async (email: string) => {
      const res = await fetch("http://localhost:3000/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ schoolId: school1Id, email, password: rawPassword }),
      });
      const body = await res.json();
      return body.accessToken;
    };

    adminToken = await fetchToken("admin.mem@school1.sch.id");
    principalToken = await fetchToken("principal.mem@school1.sch.id");
    teacherToken = await fetchToken("teacher.mem@school1.sch.id");
    studentToken = await fetchToken("student.mem@school1.sch.id");
  });

  afterAll(async () => {
    await db.delete(classMembers);
    await db.delete(students);
    await db.delete(classes);
    await db.delete(academicYears);
    await db.delete(sessions);
    await db.delete(auditLogs);
    await db.delete(users);
    await db.delete(schools);
  });

  // 1. SchoolAdmin berhasil menambahkan siswa ke kelas.
  it("1. SchoolAdmin berhasil menambahkan siswa ke kelas", async () => {
    const res = await fetch("http://localhost:3000/class-members", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-school-id": String(school1Id),
        "Authorization": `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        classId: class1Id,
        studentId: student1Id,
        academicYearId: academicYear1Id,
        status: "ACTIVE",
      }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.id).toBeDefined();
    createdMembershipId = body.data.id;
  });

  // 2. Principal berhasil menambahkan siswa ke kelas.
  it("2. Principal berhasil menambahkan siswa ke kelas", async () => {
    const res = await fetch("http://localhost:3000/class-members", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-school-id": String(school1Id),
        "Authorization": `Bearer ${principalToken}`,
      },
      body: JSON.stringify({
        classId: class1Id,
        studentId: student4Id,
        academicYearId: academicYear1Id,
        status: "ACTIVE",
      }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  // 3. Teacher tidak boleh menambahkan siswa ke kelas.
  it("3. Teacher tidak boleh menambahkan siswa ke kelas", async () => {
    const res = await fetch("http://localhost:3000/class-members", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-school-id": String(school1Id),
        "Authorization": `Bearer ${teacherToken}`,
      },
      body: JSON.stringify({
        classId: class1Id,
        studentId: student4Id,
        academicYearId: academicYear1Id,
      }),
    });

    expect(res.status).toBe(403);
  });

  // 4. Student tidak boleh mengakses endpoint.
  it("4. Student tidak boleh mengakses endpoint", async () => {
    const res = await fetch("http://localhost:3000/class-members", {
      method: "GET",
      headers: {
        "x-school-id": String(school1Id),
        "Authorization": `Bearer ${studentToken}`,
      },
    });

    expect(res.status).toBe(403);
  });

  // 5. Membership berhasil dibuat.
  it("5. Membership berhasil dibuat", async () => {
    const res = await fetch(`http://localhost:3000/class-members/${createdMembershipId}`, {
      method: "GET",
      headers: {
        "x-school-id": String(school1Id),
        "Authorization": `Bearer ${adminToken}`,
      },
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.status).toBe("ACTIVE");
  });

  // 6. Membership duplikat ditolak.
  it("6. Membership duplikat ditolak", async () => {
    const res = await fetch("http://localhost:3000/class-members", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-school-id": String(school1Id),
        "Authorization": `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        classId: class1Id,
        studentId: student1Id, // student1 sudah ada di class1
        academicYearId: academicYear1Id,
      }),
    });

    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error).toContain("sudah terdaftar di kelas ini");
  });

  // 7. Dua kelas aktif pada tahun ajaran yang sama ditolak.
  it("7. Dua kelas aktif pada tahun ajaran yang sama ditolak", async () => {
    const res = await fetch("http://localhost:3000/class-members", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-school-id": String(school1Id),
        "Authorization": `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        classId: class2Id, // kelas berbeda
        studentId: student1Id, // student1 sudah aktif di class1
        academicYearId: academicYear1Id,
        status: "ACTIVE",
      }),
    });

    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error).toContain("kelas aktif lain");
  });

  // 8. Student soft delete ditolak.
  it("8. Student soft delete ditolak", async () => {
    const res = await fetch("http://localhost:3000/class-members", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-school-id": String(school1Id),
        "Authorization": `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        classId: class1Id,
        studentId: student2Id, // soft-deleted
        academicYearId: academicYear1Id,
      }),
    });

    expect(res.status).toBe(404);
  });

  // 9. Class soft delete ditolak.
  it("9. Class soft delete ditolak", async () => {
    const res = await fetch("http://localhost:3000/class-members", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-school-id": String(school1Id),
        "Authorization": `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        classId: class4Id, // soft-deleted class
        studentId: student4Id,
        academicYearId: academicYear1Id,
      }),
    });

    expect(res.status).toBe(404);
  });

  // 10. Tenant isolation berhasil.
  it("10. Tenant isolation berhasil", async () => {
    // Mencoba menambahkan siswa dari sekolah 2 ke kelas sekolah 1
    const res = await fetch("http://localhost:3000/class-members", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-school-id": String(school1Id),
        "Authorization": `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        classId: class1Id,
        studentId: student3Id, // sekolah 2
        academicYearId: academicYear1Id,
      }),
    });

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("harus berasal dari sekolah yang sama");
  });

  // 11. GET list berhasil.
  it("11. GET list berhasil", async () => {
    const res = await fetch("http://localhost:3000/class-members", {
      method: "GET",
      headers: {
        "x-school-id": String(school1Id),
        "Authorization": `Bearer ${adminToken}`,
      },
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.length).toBeGreaterThan(0);
  });

  // 12. GET detail berhasil.
  it("12. GET detail berhasil", async () => {
    const res = await fetch(`http://localhost:3000/class-members/${createdMembershipId}`, {
      method: "GET",
      headers: {
        "x-school-id": String(school1Id),
        "Authorization": `Bearer ${adminToken}`,
      },
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.id).toBe(createdMembershipId);
  });

  // 13. Update status berhasil.
  it("13. Update status berhasil", async () => {
    const res = await fetch(`http://localhost:3000/class-members/${createdMembershipId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "x-school-id": String(school1Id),
        "Authorization": `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        status: "TRANSFERRED",
      }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.status).toBe("TRANSFERRED");
  });

  // 14. Soft delete berhasil.
  it("14. Soft delete berhasil", async () => {
    const res = await fetch(`http://localhost:3000/class-members/${createdMembershipId}`, {
      method: "DELETE",
      headers: {
        "x-school-id": String(school1Id),
        "Authorization": `Bearer ${adminToken}`,
      },
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  // 15. Membership soft delete tidak muncul pada list.
  it("15. Membership soft delete tidak muncul pada list", async () => {
    const resList = await fetch("http://localhost:3000/class-members", {
      method: "GET",
      headers: {
        "x-school-id": String(school1Id),
        "Authorization": `Bearer ${adminToken}`,
      },
    });

    expect(resList.status).toBe(200);
    const listBody = await resList.json();
    const found = listBody.data.some((m: any) => m.id === createdMembershipId);
    expect(found).toBe(false);

    // GET detail also returns 404
    const resDetail = await fetch(`http://localhost:3000/class-members/${createdMembershipId}`, {
      method: "GET",
      headers: {
        "x-school-id": String(school1Id),
        "Authorization": `Bearer ${adminToken}`,
      },
    });
    expect(resDetail.status).toBe(404);
  });
});
