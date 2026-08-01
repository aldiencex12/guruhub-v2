// @ts-nocheck
import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { db } from "../src/db";
import { schools } from "../src/schema/schools";
import { users } from "../src/schema/users";
import { classes } from "../src/schema/classes";
import { students } from "../src/schema/students";
import { academicYears } from "../src/schema/academicYears";
import { teachers } from "../src/schema/teachers";
import { schedules } from "../src/schema/schedules";
import { subjects } from "../src/schema/subjects";
import { attendances } from "../src/schema/attendances";
import { teachingJournals } from "../src/schema/teachingJournals";
import { sessions } from "../src/schema/sessions";
import { auditLogs } from "../src/schema/auditLogs";
import { hashPassword } from "../src/utils/password";
import { eq, and, isNull, isNotNull } from "drizzle-orm";

describe("Modul Teaching Journal GuruHub - Clean Architecture & Tenant Isolation", () => {
  let school1Id: number;
  let school2Id: number;
  let academicYear1Id: number;
  let academicYear2Id: number;

  let teacher1Id: number;
  let teacher2Id: number;
  let teacher3Id: number; // school 2

  let class1Id: number;
  let subject1Id: number;
  
  let schedule1Id: number; // teacher1
  let schedule2Id: number; // teacher2
  let schedule3Id: number; // school 2, teacher3

  let attendance1Id: number;

  let admin1Token: string;
  let admin2Token: string;
  let principal1Token: string;
  let teacher1Token: string;
  let teacher2Token: string;
  let homeroomTeacherToken: string;
  let studentToken: string;

  let createdJournalId1: number;
  let createdJournalId2: number;

  const rawPassword = "GuruHub!2026";

  beforeAll(async () => {
    // 1. Setup Sekolah
    const [s1] = await db.insert(schools).values({
      npsn: "22334455",
      name: "Journal School 1",
      level: "SMA",
      status: "Swasta",
    });
    school1Id = s1.insertId;

    const [s2] = await db.insert(schools).values({
      npsn: "22334456",
      name: "Journal School 2",
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

    const [uAdmin1] = await db.insert(users).values({
      schoolId: school1Id,
      email: "admin.journal@school1.sch.id",
      passwordHash,
      role: "SchoolAdmin",
    });

    const [uAdmin2] = await db.insert(users).values({
      schoolId: school2Id,
      email: "admin.journal@school2.sch.id",
      passwordHash,
      role: "SchoolAdmin",
    });

    const [uPrincipal1] = await db.insert(users).values({
      schoolId: school1Id,
      email: "principal.journal@school1.sch.id",
      passwordHash,
      role: "Principal",
    });

    const [uTeacher1] = await db.insert(users).values({
      schoolId: school1Id,
      email: "teacher1.journal@school1.sch.id",
      passwordHash,
      role: "Teacher",
    });

    const [uTeacher2] = await db.insert(users).values({
      schoolId: school1Id,
      email: "teacher2.journal@school1.sch.id",
      passwordHash,
      role: "Teacher",
    });

    const [uTeacher3] = await db.insert(users).values({
      schoolId: school2Id,
      email: "teacher3.journal@school2.sch.id",
      passwordHash,
      role: "Teacher",
    });

    const [uHomeroom] = await db.insert(users).values({
      schoolId: school1Id,
      email: "homeroom.journal@school1.sch.id",
      passwordHash,
      role: "HomeroomTeacher",
    });

    const [uStudent] = await db.insert(users).values({
      schoolId: school1Id,
      email: "student.journal@school1.sch.id",
      passwordHash,
      role: "Student",
    });

    // 4. Setup Profil Guru
    const [t1] = await db.insert(teachers).values({
      schoolId: school1Id,
      userId: uTeacher1.insertId,
      name: "Teacher 1 Journal",
      gender: "L",
    });
    teacher1Id = t1.insertId;

    const [t2] = await db.insert(teachers).values({
      schoolId: school1Id,
      userId: uTeacher2.insertId,
      name: "Teacher 2 Journal",
      gender: "P",
    });
    teacher2Id = t2.insertId;

    const [t3] = await db.insert(teachers).values({
      schoolId: school2Id,
      userId: uTeacher3.insertId,
      name: "Teacher 3 Journal",
      gender: "L",
    });
    teacher3Id = t3.insertId;

    await db.insert(teachers).values({
      schoolId: school1Id,
      userId: uHomeroom.insertId,
      name: "Homeroom Teacher Journal",
      gender: "P",
    });

    // 5. Setup Kelas & Mapel
    const [c1] = await db.insert(classes).values({
      schoolId: school1Id,
      academicYearId: academicYear1Id,
      name: "XII-IPA-1",
      gradeLevel: "12",
    });
    class1Id = c1.insertId;

    const [sub1] = await db.insert(subjects).values({
      schoolId: school1Id,
      name: "Matematika Peminatan",
      code: "MATH-12",
      gradeLevel: "12",
    });
    subject1Id = sub1.insertId;

    // 6. Setup Jadwal Pelajaran
    const [sch1] = await db.insert(schedules).values({
      schoolId: school1Id,
      classId: class1Id,
      subjectId: subject1Id,
      teacherId: teacher1Id,
      academicYearId: academicYear1Id,
      dayOfWeek: "Rabu",
      startTime: "08:00",
      endTime: "09:30",
    });
    schedule1Id = sch1.insertId;

    const [sch2] = await db.insert(schedules).values({
      schoolId: school1Id,
      classId: class1Id,
      subjectId: subject1Id,
      teacherId: teacher2Id,
      academicYearId: academicYear1Id,
      dayOfWeek: "Kamis",
      startTime: "08:00",
      endTime: "09:30",
    });
    schedule2Id = sch2.insertId;

    const [sch3] = await db.insert(schedules).values({
      schoolId: school2Id,
      classId: class1Id, // reuse class1Id (isolation test)
      subjectId: subject1Id,
      teacherId: teacher3Id,
      academicYearId: academicYear2Id,
      dayOfWeek: "Senin",
      startTime: "08:00",
      endTime: "09:30",
    });
    schedule3Id = sch3.insertId;

    // 7. Setup Absensi (Opsional)
    const [att1] = await db.insert(attendances).values({
      schoolId: school1Id,
      scheduleId: schedule1Id,
      teacherId: teacher1Id,
      attendanceDate: "2026-06-16",
    });
    attendance1Id = att1.insertId;

    // 8. Login untuk mengambil token
    const fetchToken = async (schoolId: number, email: string) => {
      const res = await fetch("http://localhost:3000/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ schoolId, email, password: rawPassword }),
      });
      const body = await res.json();
      return body.accessToken;
    };

    admin1Token = await fetchToken(school1Id, "admin.journal@school1.sch.id");
    admin2Token = await fetchToken(school2Id, "admin.journal@school2.sch.id");
    principal1Token = await fetchToken(school1Id, "principal.journal@school1.sch.id");
    teacher1Token = await fetchToken(school1Id, "teacher1.journal@school1.sch.id");
    teacher2Token = await fetchToken(school1Id, "teacher2.journal@school1.sch.id");
    homeroomTeacherToken = await fetchToken(school1Id, "homeroom.journal@school1.sch.id");
    studentToken = await fetchToken(school1Id, "student.journal@school1.sch.id");
  });

  afterAll(async () => {
    await db.delete(teachingJournals);
    await db.delete(attendances);
    await db.delete(schedules);
    await db.delete(subjects);
    await db.delete(classes);
    await db.delete(teachers);
    await db.delete(academicYears);
    await db.delete(sessions);
    await db.delete(auditLogs);
    await db.delete(users);
    await db.delete(schools);
  });

  // 1. Teacher berhasil membuat jurnal.
  it("1. Teacher berhasil membuat jurnal", async () => {
    const res = await fetch("http://localhost:3000/teaching-journals", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-school-id": String(school1Id),
        "Authorization": `Bearer ${teacher1Token}`,
      },
      body: JSON.stringify({
        scheduleId: schedule1Id,
        teacherId: teacher1Id,
        attendanceId: attendance1Id,
        journalDate: "2026-06-16",
        topic: "Aljabar Linear",
        learningObjectives: "Siswa memahami matriks eselon baris terreduksi",
        teachingMethod: "Ceramah & Diskusi",
        reflection: "Siswa tampak antusias, beberapa kesulitan di operasi baris elementer",
        notes: "Andi izin sakit",
      }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.id).toBeDefined();
    createdJournalId1 = body.data.id;
  });

  // 2. Teacher tidak boleh membuat jurnal guru lain.
  it("2. Teacher tidak boleh membuat jurnal guru lain", async () => {
    // Teacher 1 mencoba mengisi jurnal untuk schedule2 (milik Teacher 2)
    const res = await fetch("http://localhost:3000/teaching-journals", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-school-id": String(school1Id),
        "Authorization": `Bearer ${teacher1Token}`,
      },
      body: JSON.stringify({
        scheduleId: schedule2Id,
        teacherId: teacher2Id, // teacher 2
        journalDate: "2026-06-16",
        topic: "Vektor",
        learningObjectives: "Siswa memahami vektor 3 dimensi",
        teachingMethod: "Ceramah",
      }),
    });

    expect(res.status).toBe(403);
  });

  // 3. Duplicate journal ditolak.
  it("3. Duplicate journal ditolak", async () => {
    // Mencoba membuat jurnal dengan scheduleId dan journalDate yang sama dengan test 1
    const res = await fetch("http://localhost:3000/teaching-journals", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-school-id": String(school1Id),
        "Authorization": `Bearer ${teacher1Token}`,
      },
      body: JSON.stringify({
        scheduleId: schedule1Id,
        teacherId: teacher1Id,
        journalDate: "2026-06-16",
        topic: "Matriks Lanjutan",
        learningObjectives: "Siswa memahami determinan",
        teachingMethod: "Ceramah",
      }),
    });

    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error).toContain("sudah dibuat");
  });

  // 4. Tenant isolation berhasil.
  it("4. Tenant isolation berhasil", async () => {
    // POST menggunakan admin sekolah 2 ke sekolah 1
    const res = await fetch("http://localhost:3000/teaching-journals", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-school-id": String(school1Id),
        "Authorization": `Bearer ${admin2Token}`, // Token sekolah 2
      },
      body: JSON.stringify({
        scheduleId: schedule1Id,
        teacherId: teacher1Id,
        journalDate: "2026-06-17",
        topic: "Topic",
        learningObjectives: "Objectives",
        teachingMethod: "Method",
      }),
    });

    expect(res.status).toBe(403);
  });

  // 5. Principal dapat membaca seluruh jurnal.
  it("5. Principal dapat membaca seluruh jurnal", async () => {
    const res = await fetch("http://localhost:3000/teaching-journals", {
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

  // 6. HomeroomTeacher read-only.
  it("6. HomeroomTeacher read-only", async () => {
    // 1. Coba buat jurnal -> Ditolak (403)
    const resPost = await fetch("http://localhost:3000/teaching-journals", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-school-id": String(school1Id),
        "Authorization": `Bearer ${homeroomTeacherToken}`,
      },
      body: JSON.stringify({
        scheduleId: schedule1Id,
        teacherId: teacher1Id,
        journalDate: "2026-06-18",
        topic: "Topic",
        learningObjectives: "Objectives",
        teachingMethod: "Method",
      }),
    });
    expect(resPost.status).toBe(403);

    // 2. Coba baca jurnal -> Berhasil (200)
    const resGet = await fetch("http://localhost:3000/teaching-journals", {
      method: "GET",
      headers: {
        "x-school-id": String(school1Id),
        "Authorization": `Bearer ${homeroomTeacherToken}`,
      },
    });
    expect(resGet.status).toBe(200);
  });

  // 7. Student ditolak.
  it("7. Student ditolak", async () => {
    const res = await fetch("http://localhost:3000/teaching-journals", {
      method: "GET",
      headers: {
        "x-school-id": String(school1Id),
        "Authorization": `Bearer ${studentToken}`,
      },
    });

    expect(res.status).toBe(403);
  });

  // 8. GET list berhasil.
  it("8. GET list berhasil", async () => {
    const res = await fetch("http://localhost:3000/teaching-journals", {
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

  // 9. GET detail berhasil.
  it("9. GET detail berhasil", async () => {
    const res = await fetch(`http://localhost:3000/teaching-journals/${createdJournalId1}`, {
      method: "GET",
      headers: {
        "x-school-id": String(school1Id),
        "Authorization": `Bearer ${teacher1Token}`,
      },
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.topic).toBe("Aljabar Linear");
  });

  // 10. Update berhasil.
  it("10. Update berhasil", async () => {
    const res = await fetch(`http://localhost:3000/teaching-journals/${createdJournalId1}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "x-school-id": String(school1Id),
        "Authorization": `Bearer ${teacher1Token}`,
      },
      body: JSON.stringify({
        topic: "Aljabar Linear (Updated)",
        reflection: "Siswa sudah mulai mengerti",
      }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.topic).toBe("Aljabar Linear (Updated)");
  });

  // 11. Delete berhasil.
  it("11. Delete berhasil", async () => {
    // Buat jurnal kedua untuk dihapus
    const resCreate = await fetch("http://localhost:3000/teaching-journals", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-school-id": String(school1Id),
        "Authorization": `Bearer ${teacher1Token}`,
      },
      body: JSON.stringify({
        scheduleId: schedule1Id,
        teacherId: teacher1Id,
        journalDate: "2026-06-19",
        topic: "Kalkulus",
        learningObjectives: "Siswa memahami turunan",
        teachingMethod: "Ceramah",
      }),
    });
    const createBody = await resCreate.json();
    createdJournalId2 = createBody.data.id;

    // Hapus jurnal kedua oleh admin
    const resDelete = await fetch(`http://localhost:3000/teaching-journals/${createdJournalId2}`, {
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

  // 12. Soft delete berhasil.
  it("12. Soft delete berhasil", async () => {
    // Verifikasi deletedAt terisi di database
    const dbRecord = await db
      .select()
      .from(teachingJournals)
      .where(and(eq(teachingJournals.id, createdJournalId2), isNotNull(teachingJournals.deletedAt)));
    
    expect(dbRecord.length).toBe(1);
  });

  // 13. Soft deleted journal tidak muncul.
  it("13. Soft deleted journal tidak muncul", async () => {
    // Cek di list
    const resList = await fetch("http://localhost:3000/teaching-journals", {
      method: "GET",
      headers: {
        "x-school-id": String(school1Id),
        "Authorization": `Bearer ${admin1Token}`,
      },
    });
    const listBody = await resList.json();
    const found = listBody.data.some((j: any) => j.id === createdJournalId2);
    expect(found).toBe(false);

    // Cek di detail
    const resDetail = await fetch(`http://localhost:3000/teaching-journals/${createdJournalId2}`, {
      method: "GET",
      headers: {
        "x-school-id": String(school1Id),
        "Authorization": `Bearer ${admin1Token}`,
      },
    });
    expect(resDetail.status).toBe(404);
  });

  // 14. Teacher tidak dapat mengubah jurnal guru lain.
  it("14. Teacher tidak dapat mengubah jurnal guru lain", async () => {
    // Buat jurnal oleh Teacher 2
    const resCreate = await fetch("http://localhost:3000/teaching-journals", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-school-id": String(school1Id),
        "Authorization": `Bearer ${teacher2Token}`,
      },
      body: JSON.stringify({
        scheduleId: schedule2Id,
        teacherId: teacher2Id,
        journalDate: "2026-06-20",
        topic: "Statistika",
        learningObjectives: "Siswa memahami modus",
        teachingMethod: "Ceramah",
      }),
    });
    const createBody = await resCreate.json();
    const targetJournalId = createBody.data.id;

    // Coba update oleh Teacher 1
    const resUpdate = await fetch(`http://localhost:3000/teaching-journals/${targetJournalId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "x-school-id": String(school1Id),
        "Authorization": `Bearer ${teacher1Token}`,
      },
      body: JSON.stringify({
        topic: "Statistika (Hacked)",
      }),
    });

    expect(resUpdate.status).toBe(403);
  });

  // 15. SchoolAdmin dapat mengelola seluruh jurnal sekolah.
  it("15. SchoolAdmin dapat mengelola seluruh jurnal sekolah", async () => {
    // Admin 1 memperbarui jurnal Teacher 1
    const resUpdate = await fetch(`http://localhost:3000/teaching-journals/${createdJournalId1}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "x-school-id": String(school1Id),
        "Authorization": `Bearer ${admin1Token}`,
      },
      body: JSON.stringify({
        notes: "Jurnal diverifikasi oleh Admin",
      }),
    });

    expect(resUpdate.status).toBe(200);
    const body = await resUpdate.json();
    expect(body.data.notes).toBe("Jurnal diverifikasi oleh Admin");
  });
});
