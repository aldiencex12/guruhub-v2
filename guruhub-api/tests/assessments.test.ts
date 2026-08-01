// @ts-nocheck
import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { db } from "../src/db";
import { schools } from "../src/schema/schools";
import { users } from "../src/schema/users";
import { classes } from "../src/schema/classes";
import { students } from "../src/schema/students";
import { classMembers } from "../src/schema/classMembers";
import { academicYears } from "../src/schema/academicYears";
import { teachers } from "../src/schema/teachers";
import { subjects } from "../src/schema/subjects";
import { assessments, assessmentScores } from "../src/schema/assessments";
import { assessmentCategories } from "../src/schema/assessmentCategories";
import { sessions } from "../src/schema/sessions";
import { auditLogs } from "../src/schema/auditLogs";
import { hashPassword } from "../src/utils/password";
import { eq, and, isNull, isNotNull } from "drizzle-orm";

describe("Modul Assessment GuruHub - Clean Architecture & Tenant Isolation", () => {
  let school1Id: number;
  let school2Id: number;
  let academicYear1Id: number;
  let academicYear2Id: number;
  let categoryId1: number;

  let teacher1Id: number;
  let teacher2Id: number;
  let teacher3Id: number; // school 2
  let homeroomTeacherId: number;

  let class1Id: number;
  let class2Id: number;
  let subject1Id: number;

  let student1Id: number; // class1, ACTIVE
  let student2Id: number; // class2, ACTIVE
  let student3Id: number; // class1, INACTIVE
  let student4Id: number; // school 2

  let admin1Token: string;
  let admin2Token: string;
  let principal1Token: string;
  let teacher1Token: string;
  let teacher2Token: string;
  let homeroomTeacherToken: string;
  let studentToken: string;

  let createdAssessmentId1: number;
  let createdAssessmentId2: number;

  const rawPassword = "GuruHub!2026";

  beforeAll(async () => {
    // 1. Setup Sekolah
    const [s1] = await db.insert(schools).values({
      npsn: "11223344",
      name: "Assessment School 1",
      level: "SMA",
      status: "Swasta",
    });
    school1Id = s1.insertId;

    const [s2] = await db.insert(schools).values({
      npsn: "11223345",
      name: "Assessment School 2",
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

    // Setup Category Penilaian
    const [cat1] = await db.insert(assessmentCategories).values({
      schoolId: school1Id,
      name: "Ujian Harian",
      weight: 30,
      isDefault: false,
    });
    categoryId1 = cat1.insertId;

    // 3. Setup User Akun
    const passwordHash = await hashPassword(rawPassword);

    const [uAdmin1] = await db.insert(users).values({
      schoolId: school1Id,
      email: "admin.assess@school1.sch.id",
      passwordHash,
      role: "SchoolAdmin",
    });

    const [uAdmin2] = await db.insert(users).values({
      schoolId: school2Id,
      email: "admin.assess@school2.sch.id",
      passwordHash,
      role: "SchoolAdmin",
    });

    const [uPrincipal1] = await db.insert(users).values({
      schoolId: school1Id,
      email: "principal.assess@school1.sch.id",
      passwordHash,
      role: "Principal",
    });

    const [uTeacher1] = await db.insert(users).values({
      schoolId: school1Id,
      email: "teacher1.assess@school1.sch.id",
      passwordHash,
      role: "Teacher",
    });

    const [uTeacher2] = await db.insert(users).values({
      schoolId: school1Id,
      email: "teacher2.assess@school1.sch.id",
      passwordHash,
      role: "Teacher",
    });

    const [uTeacher3] = await db.insert(users).values({
      schoolId: school2Id,
      email: "teacher3.assess@school2.sch.id",
      passwordHash,
      role: "Teacher",
    });

    const [uHomeroom] = await db.insert(users).values({
      schoolId: school1Id,
      email: "homeroom.assess@school1.sch.id",
      passwordHash,
      role: "HomeroomTeacher",
    });

    const [uStudent] = await db.insert(users).values({
      schoolId: school1Id,
      email: "student.assess@school1.sch.id",
      passwordHash,
      role: "Student",
    });

    // 4. Setup Profil Guru
    const [t1] = await db.insert(teachers).values({
      schoolId: school1Id,
      userId: uTeacher1.insertId,
      name: "Teacher 1 Assess",
      gender: "L",
    });
    teacher1Id = t1.insertId;

    const [t2] = await db.insert(teachers).values({
      schoolId: school1Id,
      userId: uTeacher2.insertId,
      name: "Teacher 2 Assess",
      gender: "P",
    });
    teacher2Id = t2.insertId;

    const [t3] = await db.insert(teachers).values({
      schoolId: school2Id,
      userId: uTeacher3.insertId,
      name: "Teacher 3 Assess",
      gender: "L",
    });
    teacher3Id = t3.insertId;

    const [tH] = await db.insert(teachers).values({
      schoolId: school1Id,
      userId: uHomeroom.insertId,
      name: "Homeroom Teacher Assess",
      gender: "P",
    });
    homeroomTeacherId = tH.insertId;

    // 5. Setup Kelas & Mapel
    const [c1] = await db.insert(classes).values({
      schoolId: school1Id,
      academicYearId: academicYear1Id,
      name: "X-A",
      gradeLevel: "10",
    });
    class1Id = c1.insertId;

    const [c2] = await db.insert(classes).values({
      schoolId: school1Id,
      academicYearId: academicYear1Id,
      name: "X-B",
      gradeLevel: "10",
    });
    class2Id = c2.insertId;

    const [sub1] = await db.insert(subjects).values({
      schoolId: school1Id,
      name: "Fisika",
      code: "PHYS-10",
      gradeLevel: "10",
    });
    subject1Id = sub1.insertId;

    // 6. Setup Siswa & Membership
    const [stud1] = await db.insert(students).values({
      schoolId: school1Id,
      nis: "26001",
      nisn: "0160000001",
      name: "Siswa Satu",
      gender: "L",
    });
    student1Id = stud1.insertId;

    const [stud2] = await db.insert(students).values({
      schoolId: school1Id,
      nis: "26002",
      nisn: "0160000002",
      name: "Siswa Dua",
      gender: "P",
    });
    student2Id = stud2.insertId;

    const [stud3] = await db.insert(students).values({
      schoolId: school1Id,
      nis: "26003",
      nisn: "0160000003",
      name: "Siswa Tiga",
      gender: "L",
    });
    student3Id = stud3.insertId;

    const [stud4] = await db.insert(students).values({
      schoolId: school2Id,
      nis: "26004",
      nisn: "0160000004",
      name: "Siswa Empat",
      gender: "P",
    });
    student4Id = stud4.insertId;

    // Tambah class memberships
    await db.insert(classMembers).values({
      schoolId: school1Id,
      classId: class1Id,
      studentId: student1Id,
      academicYearId: academicYear1Id,
      status: "ACTIVE",
    });

    await db.insert(classMembers).values({
      schoolId: school1Id,
      classId: class2Id,
      studentId: student2Id,
      academicYearId: academicYear1Id,
      status: "ACTIVE",
    });

    await db.insert(classMembers).values({
      schoolId: school1Id,
      classId: class1Id,
      studentId: student3Id,
      academicYearId: academicYear1Id,
      status: "INACTIVE",
    });

    // 7. Login untuk mengambil token
    const fetchToken = async (schoolId: number, email: string) => {
      const res = await fetch("http://localhost:3000/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ schoolId, email, password: rawPassword }),
      });
      const body = await res.json();
      return body.accessToken;
    };

    admin1Token = await fetchToken(school1Id, "admin.assess@school1.sch.id");
    admin2Token = await fetchToken(school2Id, "admin.assess@school2.sch.id");
    principal1Token = await fetchToken(school1Id, "principal.assess@school1.sch.id");
    teacher1Token = await fetchToken(school1Id, "teacher1.assess@school1.sch.id");
    teacher2Token = await fetchToken(school1Id, "teacher2.assess@school1.sch.id");
    homeroomTeacherToken = await fetchToken(school1Id, "homeroom.assess@school1.sch.id");
    studentToken = await fetchToken(school1Id, "student.assess@school1.sch.id");
  });

  afterAll(async () => {
    const schoolIds = [school1Id, school2Id].filter(Boolean);
    for (const id of schoolIds) {
      await db.delete(assessmentScores); // Dihapus secara global karena tidak ada schoolId dan cascade terkadang butuh konfigurasi db
      await db.delete(assessments).where(eq(assessments.schoolId, id));
      await db.delete(assessmentCategories).where(eq(assessmentCategories.schoolId, id));
      await db.delete(classMembers).where(eq(classMembers.schoolId, id));
      await db.delete(students).where(eq(students.schoolId, id));
      await db.delete(classes).where(eq(classes.schoolId, id));
      await db.delete(subjects).where(eq(subjects.schoolId, id));
      await db.delete(teachers).where(eq(teachers.schoolId, id));
      await db.delete(academicYears).where(eq(academicYears.schoolId, id));
      await db.delete(sessions).where(eq(sessions.schoolId, id));
      await db.delete(auditLogs).where(eq(auditLogs.schoolId, id));
      await db.delete(users).where(eq(users.schoolId, id));
      await db.delete(schools).where(eq(schools.id, id));
    }
  });

  // 1. Teacher berhasil membuat assessment.
  it("1. Teacher berhasil membuat assessment", async () => {
    const res = await fetch("http://localhost:3000/assessments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-school-id": String(school1Id),
        "Authorization": `Bearer ${teacher1Token}`,
      },
      body: JSON.stringify({
        classId: class1Id,
        subjectId: subject1Id,
        teacherId: teacher1Id,
        academicYearId: academicYear1Id,
        categoryId: categoryId1,
        title: "Kuis Fisika Gerak Lurus",
        description: "Materi GLB & GLBB",
        assessmentType: "DAILY_TEST",
        assessmentDate: "2026-06-16",
        maxScore: 100,
      }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.id).toBeDefined();
    createdAssessmentId1 = body.data.id;
  });

  // 2. Teacher tidak boleh membuat assessment guru lain.
  it("2. Teacher tidak boleh membuat assessment guru lain", async () => {
    const res = await fetch("http://localhost:3000/assessments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-school-id": String(school1Id),
        "Authorization": `Bearer ${teacher1Token}`,
      },
      body: JSON.stringify({
        classId: class1Id,
        subjectId: subject1Id,
        teacherId: teacher2Id, // teacher 2
        academicYearId: academicYear1Id,
        categoryId: categoryId1,
        title: "Kuis Kimia",
        assessmentType: "DAILY_TEST",
        assessmentDate: "2026-06-16",
        maxScore: 100,
      }),
    });

    expect(res.status).toBe(403);
  });

  // 3. Teacher berhasil input nilai.
  it("3. Teacher berhasil input nilai", async () => {
    const res = await fetch(`http://localhost:3000/assessments/${createdAssessmentId1}/scores`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-school-id": String(school1Id),
        "Authorization": `Bearer ${teacher1Token}`,
      },
      body: JSON.stringify({
        scores: [
          { studentId: student1Id, score: 85, notes: "Kerja bagus" }
        ]
      }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data[0].score).toBe(85);
  });

  // 4. Nilai melebihi maxScore ditolak.
  it("4. Nilai melebihi maxScore ditolak", async () => {
    const res = await fetch(`http://localhost:3000/assessments/${createdAssessmentId1}/scores`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-school-id": String(school1Id),
        "Authorization": `Bearer ${teacher1Token}`,
      },
      body: JSON.stringify({
        scores: [
          { studentId: student1Id, score: 120 }
        ]
      }),
    });

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error).toContain("melebihi batas nilai maksimal");
  });

  // 5. Student dari kelas lain ditolak.
  it("5. Student dari kelas lain ditolak", async () => {
    const res = await fetch(`http://localhost:3000/assessments/${createdAssessmentId1}/scores`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-school-id": String(school1Id),
        "Authorization": `Bearer ${teacher1Token}`,
      },
      body: JSON.stringify({
        scores: [
          { studentId: student2Id, score: 80 } // student2 ada di class2, assessment untuk class1
        ]
      }),
    });

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error).toContain("tidak terdaftar di kelas");
  });

  // 6. Student non ACTIVE ditolak.
  it("6. Student non ACTIVE ditolak", async () => {
    const res = await fetch(`http://localhost:3000/assessments/${createdAssessmentId1}/scores`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-school-id": String(school1Id),
        "Authorization": `Bearer ${teacher1Token}`,
      },
      body: JSON.stringify({
        scores: [
          { studentId: student3Id, score: 80 } // student3 status INACTIVE
        ]
      }),
    });

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error).toContain("tidak berstatus ACTIVE");
  });

  // 7. Tenant isolation berhasil.
  it("7. Tenant isolation berhasil", async () => {
    // Mencoba input nilai dari tenant sekolah 2
    const res = await fetch(`http://localhost:3000/assessments/${createdAssessmentId1}/scores`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-school-id": String(school1Id),
        "Authorization": `Bearer ${admin2Token}`, // Token tenant 2
      },
      body: JSON.stringify({
        scores: [{ studentId: student1Id, score: 90 }]
      }),
    });

    expect(res.status).toBe(403);
  });

  // 8. Principal dapat melihat seluruh assessment.
  it("8. Principal dapat melihat seluruh assessment", async () => {
    const res = await fetch("http://localhost:3000/assessments", {
      method: "GET",
      headers: {
        "x-school-id": String(school1Id),
        "Authorization": `Bearer ${principal1Token}`,
      },
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.length).toBeGreaterThan(0);
  });

  // 9. HomeroomTeacher read only.
  it("9. HomeroomTeacher read only", async () => {
    // 1. Coba buat -> Gagal (403)
    const resPost = await fetch("http://localhost:3000/assessments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-school-id": String(school1Id),
        "Authorization": `Bearer ${homeroomTeacherToken}`,
      },
      body: JSON.stringify({
        classId: class1Id,
        subjectId: subject1Id,
        teacherId: teacher1Id,
        academicYearId: academicYear1Id,
        categoryId: categoryId1,
        title: "Tugas Fisika",
        assessmentType: "ASSIGNMENT",
        assessmentDate: "2026-06-16",
        maxScore: 100,
      }),
    });
    expect(resPost.status).toBe(403);

    // 2. Coba baca -> Sukses (200)
    const resGet = await fetch("http://localhost:3000/assessments", {
      method: "GET",
      headers: {
        "x-school-id": String(school1Id),
        "Authorization": `Bearer ${homeroomTeacherToken}`,
      },
    });
    expect(resGet.status).toBe(200);
  });

  // 10. Student ditolak.
  it("10. Student ditolak", async () => {
    const res = await fetch("http://localhost:3000/assessments", {
      method: "GET",
      headers: {
        "x-school-id": String(school1Id),
        "Authorization": `Bearer ${studentToken}`,
      },
    });

    expect(res.status).toBe(403);
  });

  // 11. GET list berhasil.
  it("11. GET list berhasil", async () => {
    const res = await fetch("http://localhost:3000/assessments", {
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

  // 12. GET detail berhasil.
  it("12. GET detail berhasil", async () => {
    const res = await fetch(`http://localhost:3000/assessments/${createdAssessmentId1}`, {
      method: "GET",
      headers: {
        "x-school-id": String(school1Id),
        "Authorization": `Bearer ${teacher1Token}`,
      },
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.title).toBe("Kuis Fisika Gerak Lurus");
  });

  // 13. Update assessment berhasil.
  it("13. Update assessment berhasil", async () => {
    const res = await fetch(`http://localhost:3000/assessments/${createdAssessmentId1}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "x-school-id": String(school1Id),
        "Authorization": `Bearer ${teacher1Token}`,
      },
      body: JSON.stringify({
        title: "Kuis Fisika Gerak Lurus (Updated)",
      }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.title).toBe("Kuis Fisika Gerak Lurus (Updated)");
  });

  // 14. Delete assessment berhasil.
  it("14. Delete assessment berhasil", async () => {
    // Buat kuis kedua untuk dihapus
    const resCreate = await fetch("http://localhost:3000/assessments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-school-id": String(school1Id),
        "Authorization": `Bearer ${teacher1Token}`,
      },
      body: JSON.stringify({
        classId: class1Id,
        subjectId: subject1Id,
        teacherId: teacher1Id,
        academicYearId: academicYear1Id,
        categoryId: categoryId1,
        title: "Kuis Fisika 2",
        assessmentType: "DAILY_TEST",
        assessmentDate: "2026-06-16",
        maxScore: 100,
      }),
    });
    const createBody = await resCreate.json();
    createdAssessmentId2 = createBody.data.id;

    // Hapus kuis kedua oleh admin
    const resDelete = await fetch(`http://localhost:3000/assessments/${createdAssessmentId2}`, {
      method: "DELETE",
      headers: {
        "x-school-id": String(school1Id),
        "Authorization": `Bearer ${admin1Token}`,
      },
    });

    expect(resDelete.status).toBe(200);
    const deleteBody = await resDelete.json();
    expect(deleteBody.success).toBe(true);
  });

  // 15. Soft delete berhasil.
  it("15. Soft delete berhasil", async () => {
    const dbRecord = await db
      .select()
      .from(assessments)
      .where(and(eq(assessments.id, createdAssessmentId2), isNotNull(assessments.deletedAt)));
    
    expect(dbRecord.length).toBe(1);
  });

  // 16. Soft deleted assessment tidak muncul.
  it("16. Soft deleted assessment tidak muncul", async () => {
    // List check
    const resList = await fetch("http://localhost:3000/assessments", {
      method: "GET",
      headers: {
        "x-school-id": String(school1Id),
        "Authorization": `Bearer ${admin1Token}`,
      },
    });
    const listBody = await resList.json();
    const found = listBody.data.some((a: any) => a.id === createdAssessmentId2);
    expect(found).toBe(false);

    // Detail check
    const resDetail = await fetch(`http://localhost:3000/assessments/${createdAssessmentId2}`, {
      method: "GET",
      headers: {
        "x-school-id": String(school1Id),
        "Authorization": `Bearer ${admin1Token}`,
      },
    });
    expect(resDetail.status).toBe(404);
  });

  // 17. Teacher tidak dapat mengubah assessment guru lain.
  it("17. Teacher tidak dapat mengubah assessment guru lain", async () => {
    // Buat kuis oleh Teacher 2
    const resCreate = await fetch("http://localhost:3000/assessments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-school-id": String(school1Id),
        "Authorization": `Bearer ${teacher2Token}`,
      },
      body: JSON.stringify({
        classId: class1Id,
        subjectId: subject1Id,
        teacherId: teacher2Id,
        academicYearId: academicYear1Id,
        categoryId: categoryId1,
        title: "Kuis Kimia Teacher 2",
        assessmentType: "DAILY_TEST",
        assessmentDate: "2026-06-16",
        maxScore: 100,
      }),
    });
    const createBody = await resCreate.json();
    const targetId = createBody.data.id;

    // Coba update oleh Teacher 1
    const resUpdate = await fetch(`http://localhost:3000/assessments/${targetId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "x-school-id": String(school1Id),
        "Authorization": `Bearer ${teacher1Token}`,
      },
      body: JSON.stringify({
        title: "Kuis Kimia Teacher 2 (Hacked)",
      }),
    });

    expect(resUpdate.status).toBe(403);
  });

  // 18. SchoolAdmin dapat mengelola seluruh assessment sekolah.
  it("18. SchoolAdmin dapat mengelola seluruh assessment sekolah", async () => {
    const res = await fetch(`http://localhost:3000/assessments/${createdAssessmentId1}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "x-school-id": String(school1Id),
        "Authorization": `Bearer ${admin1Token}`,
      },
      body: JSON.stringify({
        title: "Kuis Fisika Gerak Lurus (Verified by Admin)",
      }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.title).toBe("Kuis Fisika Gerak Lurus (Verified by Admin)");
  });

  // 19. Assessment score berhasil diperbarui.
  it("19. Assessment score berhasil diperbarui", async () => {
    const res = await fetch(`http://localhost:3000/assessments/${createdAssessmentId1}/scores`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-school-id": String(school1Id),
        "Authorization": `Bearer ${teacher1Token}`,
      },
      body: JSON.stringify({
        scores: [
          { studentId: student1Id, score: 95, notes: "Kinerja luar biasa!" }
        ]
      }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data[0].score).toBe(95);
    expect(body.data[0].notes).toBe("Kinerja luar biasa!");
  });

  // 20. Assessment score berhasil dibaca kembali.
  it("20. Assessment score berhasil dibaca kembali", async () => {
    const res = await fetch(`http://localhost:3000/assessments/${createdAssessmentId1}`, {
      method: "GET",
      headers: {
        "x-school-id": String(school1Id),
        "Authorization": `Bearer ${teacher1Token}`,
      },
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    
    const scoreItem = body.data.scores.find((s: any) => s.studentId === student1Id);
    expect(scoreItem).toBeDefined();
    expect(scoreItem.score).toBe(95);
    expect(scoreItem.notes).toBe("Kinerja luar biasa!");
  });
});
