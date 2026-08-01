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
import { studentFinalGrades } from "../src/schema/studentFinalGrades";
import { attendances, attendanceDetails } from "../src/schema/attendances";
import { schedules } from "../src/schema/schedules";
import { reportCards, reportCardSubjects, reportCardAttendances, studentExtracurriculars, studentAchievements, p5Projects, extracurriculars } from "../src/schema/reportCards";
import { sessions } from "../src/schema/sessions";
import { auditLogs } from "../src/schema/auditLogs";
import { hashPassword } from "../src/utils/password";
import { eq, and, isNull } from "drizzle-orm";

describe("Modul Report Cards GuruHub - Clean Architecture, RBAC & Tenant Isolation", () => {
  let school1Id: number;
  let school2Id: number;
  let academicYear1Id: number;

  let teacher1Id: number;
  let class1Id: number;
  let subject1Id: number;
  let student1Id: number;

  let ext1Id: number; // school 1 master ekskul
  let ext2Id: number; // school 2 master ekskul

  let reportCard1Id: number;

  let admin1Token: string;
  let admin2Token: string;
  let principal1Token: string;
  let homeroom1Token: string;
  let teacher1Token: string;
  let studentToken: string;
  let superAdminToken: string;

  const rawPassword = "GuruHub!2026";

  beforeAll(async () => {
    // 1. Setup Sekolah
    const [s1] = await db.insert(schools).values({
      npsn: "99887766",
      name: "Rapor School 1",
      level: "SMA",
      status: "Swasta",
    });
    school1Id = s1.insertId;

    const [s2] = await db.insert(schools).values({
      npsn: "99887767",
      name: "Rapor School 2",
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

    // 3. Setup User Akun
    const passwordHash = await hashPassword(rawPassword);

    const [uSuper] = await db.insert(users).values({
      schoolId: school1Id,
      email: "super.rapor@guruhub.sch.id",
      passwordHash,
      role: "SuperAdmin",
    });

    const [uAdmin1] = await db.insert(users).values({
      schoolId: school1Id,
      email: "admin.rapor@school1.sch.id",
      passwordHash,
      role: "SchoolAdmin",
    });

    const [uAdmin2] = await db.insert(users).values({
      schoolId: school2Id,
      email: "admin.rapor@school2.sch.id",
      passwordHash,
      role: "SchoolAdmin",
    });

    const [uPrincipal1] = await db.insert(users).values({
      schoolId: school1Id,
      email: "principal.rapor@school1.sch.id",
      passwordHash,
      role: "Principal",
    });

    const [uHomeroom1] = await db.insert(users).values({
      schoolId: school1Id,
      email: "homeroom.rapor@school1.sch.id",
      passwordHash,
      role: "HomeroomTeacher",
    });

    const [uTeacher1] = await db.insert(users).values({
      schoolId: school1Id,
      email: "teacher.rapor@school1.sch.id",
      passwordHash,
      role: "Teacher",
    });

    const [uStudent] = await db.insert(users).values({
      schoolId: school1Id,
      email: "student.rapor@school1.sch.id",
      passwordHash,
      role: "Student",
    });

    // 4. Setup Profil Guru
    const [t1] = await db.insert(teachers).values({
      schoolId: school1Id,
      userId: uTeacher1.insertId,
      name: "Teacher Rapor",
      gender: "L",
    });
    teacher1Id = t1.insertId;

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
      name: "Fisika",
      code: "PHYS-12",
      gradeLevel: "12",
    });
    subject1Id = sub1.insertId;

    // 6. Setup Siswa & Membership ACTIVE
    const [stud1] = await db.insert(students).values({
      schoolId: school1Id,
      nis: "28001",
      nisn: "0180000001",
      name: "Budi Rapor",
      gender: "L",
    });
    student1Id = stud1.insertId;

    await db.insert(classMembers).values({
      schoolId: school1Id,
      classId: class1Id,
      studentId: student1Id,
      academicYearId: academicYear1Id,
      status: "ACTIVE",
    });

    // 7. Setup Master Ekstrakurikuler
    const [ex1] = await db.insert(extracurriculars).values({
      schoolId: school1Id,
      name: "Pramuka",
      description: "Praja Muda Karana",
    });
    ext1Id = ex1.insertId;

    const [ex2] = await db.insert(extracurriculars).values({
      schoolId: school2Id,
      name: "Basket",
      description: "Pecinta Bola Basket",
    });
    ext2Id = ex2.insertId;

    // 8. Setup final grade dari Grade Engine (Fisika = 85.00 -> B)
    await db.insert(studentFinalGrades).values({
      schoolId: school1Id,
      studentId: student1Id,
      classId: class1Id,
      subjectId: subject1Id,
      academicYearId: academicYear1Id,
      finalScore: 85.00,
      gradeLetter: "B",
      calculatedAt: new Date(),
    });

    // 9. Setup Absensi (Sakit = 2, Izin = 1, Alfa = 1)
    const [sch1] = await db.insert(schedules).values({
      schoolId: school1Id,
      classId: class1Id,
      subjectId: subject1Id,
      teacherId: teacher1Id,
      academicYearId: academicYear1Id,
      dayOfWeek: "Senin",
      startTime: "07:00:00",
      endTime: "08:30:00",
      status: "Aktif",
    });

    const insertAttendanceRecord = async (dateStr: string, status: "PRESENT" | "SICK" | "PERMISSION" | "ABSENT") => {
      const [att] = await db.insert(attendances).values({
        schoolId: school1Id,
        scheduleId: sch1.insertId,
        teacherId: teacher1Id,
        attendanceDate: dateStr,
      });
      await db.insert(attendanceDetails).values({
        attendanceId: att.insertId,
        studentId: student1Id,
        status,
      });
    };

    await insertAttendanceRecord("2026-06-01", "SICK");
    await insertAttendanceRecord("2026-06-02", "SICK");
    await insertAttendanceRecord("2026-06-03", "PERMISSION");
    await insertAttendanceRecord("2026-06-04", "ABSENT");
    await insertAttendanceRecord("2026-06-05", "PRESENT");

    // 10. Login tokens
    const fetchToken = async (schoolId: number, email: string) => {
      const res = await fetch("http://localhost:3000/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ schoolId, email, password: rawPassword }),
      });
      const body = await res.json();
      return body.accessToken;
    };

    superAdminToken = await fetchToken(school1Id, "super.rapor@guruhub.sch.id");
    admin1Token = await fetchToken(school1Id, "admin.rapor@school1.sch.id");
    admin2Token = await fetchToken(school2Id, "admin.rapor@school2.sch.id");
    principal1Token = await fetchToken(school1Id, "principal.rapor@school1.sch.id");
    homeroom1Token = await fetchToken(school1Id, "homeroom.rapor@school1.sch.id");
    teacher1Token = await fetchToken(school1Id, "teacher.rapor@school1.sch.id");
    studentToken = await fetchToken(school1Id, "student.rapor@school1.sch.id");
  });

  afterAll(async () => {
    await db.delete(p5Projects);
    await db.delete(studentAchievements);
    await db.delete(studentExtracurriculars);
    await db.delete(extracurriculars);
    await db.delete(reportCardAttendances);
    await db.delete(reportCardSubjects);
    await db.delete(reportCards);
    await db.delete(attendanceDetails);
    await db.delete(attendances);
    await db.delete(schedules);
    await db.delete(studentFinalGrades);
    await db.delete(classMembers);
    await db.delete(students);
    await db.delete(classes);
    await db.delete(subjects);
    await db.delete(teachers);
    await db.delete(academicYears);
    await db.delete(sessions);
    await db.delete(auditLogs);
    await db.delete(users);
    await db.delete(schools);
  });

  // 1. Generate rapor berhasil
  it("1. Generate rapor berhasil", async () => {
    const res = await fetch("http://localhost:3000/report-cards/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-school-id": String(school1Id),
        "Authorization": `Bearer ${admin1Token}`,
      },
      body: JSON.stringify({
        studentId: student1Id,
        academicYearId: academicYear1Id,
        semester: "GANJIL",
      }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.id).toBeDefined();
    reportCard1Id = body.data.id;
  });

  // 2. Tidak boleh generate ganda
  it("2. Tidak boleh generate ganda", async () => {
    const res = await fetch("http://localhost:3000/report-cards/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-school-id": String(school1Id),
        "Authorization": `Bearer ${admin1Token}`,
      },
      body: JSON.stringify({
        studentId: student1Id,
        academicYearId: academicYear1Id,
        semester: "GANJIL",
      }),
    });

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("Siswa sudah memiliki rapor");
  });

  // 3. Rapor DRAFT: update homeroom teacher notes berhasil
  it("3. Rapor DRAFT: update homeroom teacher notes berhasil", async () => {
    const res = await fetch(`http://localhost:3000/report-cards/${reportCard1Id}/notes`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "x-school-id": String(school1Id),
        "Authorization": `Bearer ${homeroom1Token}`,
      },
      body: JSON.stringify({ notes: "Budi berprestasi tinggi" }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.homeroomTeacherNotes).toBe("Budi berprestasi tinggi");
  });

  // 4. Rapor DRAFT: add achievement berhasil
  it("4. Rapor DRAFT: add achievement berhasil", async () => {
    const res = await fetch(`http://localhost:3000/report-cards/${reportCard1Id}/achievement`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-school-id": String(school1Id),
        "Authorization": `Bearer ${homeroom1Token}`,
      },
      body: JSON.stringify({
        title: "Juara 1 Lomba Fisika",
        level: "PROVINCE",
        description: "Juara tingkat Provinsi Jawa Barat",
      }),
    });

    expect(res.status).toBe(200);
  });

  // 5. Rapor DRAFT: add extracurricular berhasil
  it("5. Rapor DRAFT: add extracurricular berhasil", async () => {
    const res = await fetch(`http://localhost:3000/report-cards/${reportCard1Id}/extracurricular`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-school-id": String(school1Id),
        "Authorization": `Bearer ${homeroom1Token}`,
      },
      body: JSON.stringify({
        extracurricularId: ext1Id,
        predicate: "A",
        description: "Aktif memimpin regu",
      }),
    });

    expect(res.status).toBe(200);
  });

  // 6. Rapor DRAFT: add P5 project berhasil
  it("6. Rapor DRAFT: add P5 project berhasil", async () => {
    const res = await fetch(`http://localhost:3000/report-cards/${reportCard1Id}/p5`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-school-id": String(school1Id),
        "Authorization": `Bearer ${homeroom1Token}`,
      },
      body: JSON.stringify({
        theme: "Gaya Hidup Berkelanjutan",
        predicate: "SB",
        description: "Sangat baik dalam projek pengolahan sampah",
      }),
    });

    expect(res.status).toBe(200);
  });

  // 7. Publish berhasil
  it("7. Publish berhasil", async () => {
    const res = await fetch(`http://localhost:3000/report-cards/${reportCard1Id}/publish`, {
      method: "POST",
      headers: {
        "x-school-id": String(school1Id),
        "Authorization": `Bearer ${principal1Token}`,
      },
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.status).toBe("PUBLISHED");
  });

  // 8. Publish mengunci data (update notes ditolak untuk HomeroomTeacher)
  it("8. Publish mengunci data (update notes ditolak untuk HomeroomTeacher)", async () => {
    const res = await fetch(`http://localhost:3000/report-cards/${reportCard1Id}/notes`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "x-school-id": String(school1Id),
        "Authorization": `Bearer ${homeroom1Token}`,
      },
      body: JSON.stringify({ notes: "Budi berprestasi super" }),
    });

    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toContain("terkunci karena sudah dipublikasikan");
  });

  // 9. Publish mengunci data (add achievement ditolak untuk HomeroomTeacher)
  it("9. Publish mengunci data (add achievement ditolak untuk HomeroomTeacher)", async () => {
    const res = await fetch(`http://localhost:3000/report-cards/${reportCard1Id}/achievement`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-school-id": String(school1Id),
        "Authorization": `Bearer ${homeroom1Token}`,
      },
      body: JSON.stringify({ title: "Medali Emas", level: "NATIONAL" }),
    });

    expect(res.status).toBe(403);
  });

  // 10. Publish mengunci data (add extracurricular ditolak untuk HomeroomTeacher)
  it("10. Publish mengunci data (add extracurricular ditolak untuk HomeroomTeacher)", async () => {
    const res = await fetch(`http://localhost:3000/report-cards/${reportCard1Id}/extracurricular`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-school-id": String(school1Id),
        "Authorization": `Bearer ${homeroom1Token}`,
      },
      body: JSON.stringify({ extracurricularId: ext1Id, predicate: "B" }),
    });

    expect(res.status).toBe(403);
  });

  // 11. Publish mengunci data (add P5 ditolak untuk HomeroomTeacher)
  it("11. Publish mengunci data (add P5 ditolak untuk HomeroomTeacher)", async () => {
    const res = await fetch(`http://localhost:3000/report-cards/${reportCard1Id}/p5`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-school-id": String(school1Id),
        "Authorization": `Bearer ${homeroom1Token}`,
      },
      body: JSON.stringify({ theme: "Kearifan Lokal", predicate: "B" }),
    });

    expect(res.status).toBe(403);
  });

  // 12. SuperAdmin bypass lock untuk update notes
  it("12. SuperAdmin bypass lock untuk update notes", async () => {
    const res = await fetch(`http://localhost:3000/report-cards/${reportCard1Id}/notes`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "x-school-id": String(school1Id),
        "Authorization": `Bearer ${superAdminToken}`,
      },
      body: JSON.stringify({ notes: "Catatan khusus SuperAdmin" }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.homeroomTeacherNotes).toBe("Catatan khusus SuperAdmin");
  });

  // 13. SuperAdmin bypass lock untuk add achievement
  it("13. SuperAdmin bypass lock untuk add achievement", async () => {
    const res = await fetch(`http://localhost:3000/report-cards/${reportCard1Id}/achievement`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-school-id": String(school1Id),
        "Authorization": `Bearer ${superAdminToken}`,
      },
      body: JSON.stringify({ title: "Super Medal", level: "INTERNATIONAL" }),
    });

    expect(res.status).toBe(200);
  });

  // 14. SuperAdmin bypass lock untuk add extracurricular
  it("14. SuperAdmin bypass lock untuk add extracurricular", async () => {
    const res = await fetch(`http://localhost:3000/report-cards/${reportCard1Id}/extracurricular`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-school-id": String(school1Id),
        "Authorization": `Bearer ${superAdminToken}`,
      },
      body: JSON.stringify({ extracurricularId: ext1Id, predicate: "A" }),
    });

    expect(res.status).toBe(200);
  });

  // 15. SuperAdmin bypass lock untuk add P5
  it("15. SuperAdmin bypass lock untuk add P5", async () => {
    const res = await fetch(`http://localhost:3000/report-cards/${reportCard1Id}/p5`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-school-id": String(school1Id),
        "Authorization": `Bearer ${superAdminToken}`,
      },
      body: JSON.stringify({ theme: "Kewirausahaan", predicate: "SB" }),
    });

    expect(res.status).toBe(200);
  });

  // 16. Tenant isolation: Admin sekolah lain gagal mengakses rapor sekolah 1
  it("16. Tenant isolation: Admin sekolah lain gagal mengakses rapor sekolah 1", async () => {
    const res = await fetch(`http://localhost:3000/report-cards/${reportCard1Id}`, {
      method: "GET",
      headers: {
        "x-school-id": String(school2Id),
        "Authorization": `Bearer ${admin2Token}`,
      },
    });

    expect(res.status).toBe(403);
  });

  // 17. Tenant isolation: Admin sekolah lain gagal mengedit notes rapor sekolah 1
  it("17. Tenant isolation: Admin sekolah lain gagal mengedit notes rapor sekolah 1", async () => {
    const res = await fetch(`http://localhost:3000/report-cards/${reportCard1Id}/notes`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "x-school-id": String(school2Id),
        "Authorization": `Bearer ${admin2Token}`,
      },
      body: JSON.stringify({ notes: "Diubah sekolah lain" }),
    });

    expect(res.status).toBe(403);
  });

  // 18. RBAC: Student dilarang generate rapor
  it("18. RBAC: Student dilarang generate rapor", async () => {
    const res = await fetch("http://localhost:3000/report-cards/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-school-id": String(school1Id),
        "Authorization": `Bearer ${studentToken}`,
      },
      body: JSON.stringify({
        studentId: student1Id,
        academicYearId: academicYear1Id,
        semester: "GANJIL",
      }),
    });

    expect(res.status).toBe(403);
  });

  // 19. RBAC: Student dilarang membaca rapor
  it("19. RBAC: Student dilarang membaca rapor", async () => {
    const res = await fetch(`http://localhost:3000/report-cards/${reportCard1Id}`, {
      method: "GET",
      headers: {
        "x-school-id": String(school1Id),
        "Authorization": `Bearer ${studentToken}`,
      },
    });

    expect(res.status).toBe(403);
  });

  // 20. RBAC: HomeroomTeacher diperbolehkan generate rapor
  it("20. RBAC: HomeroomTeacher diperbolehkan generate rapor", async () => {
    // Siswa lain di kelas yang sama
    const [stud2] = await db.insert(students).values({
      schoolId: school1Id,
      nis: "28002",
      nisn: "0180000002",
      name: "Siti Rapor",
      gender: "P",
    });

    await db.insert(classMembers).values({
      schoolId: school1Id,
      classId: class1Id,
      studentId: stud2.insertId,
      academicYearId: academicYear1Id,
      status: "ACTIVE",
    });

    const res = await fetch("http://localhost:3000/report-cards/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-school-id": String(school1Id),
        "Authorization": `Bearer ${homeroom1Token}`,
      },
      body: JSON.stringify({
        studentId: stud2.insertId,
        academicYearId: academicYear1Id,
        semester: "GANJIL",
      }),
    });

    expect(res.status).toBe(200);
  });

  // 21. RBAC: Principal diperbolehkan publish rapor
  it("21. RBAC: Principal diperbolehkan publish rapor", async () => {
    // Generate rapor baru untuk Siti
    const student2Query = await db.select().from(students).where(eq(students.nis, "28002")).limit(1);
    const rcList = await db.select().from(reportCards).where(eq(reportCards.studentId, student2Query[0].id)).limit(1);

    const res = await fetch(`http://localhost:3000/report-cards/${rcList[0].id}/publish`, {
      method: "POST",
      headers: {
        "x-school-id": String(school1Id),
        "Authorization": `Bearer ${principal1Token}`,
      },
    });

    expect(res.status).toBe(200);
  });

  // 22. Grade Engine integration: Nilai akhir di rapor terisi secara otomatis
  it("22. Grade Engine integration: Nilai akhir di rapor terisi secara otomatis", async () => {
    const res = await fetch(`http://localhost:3000/report-cards/${reportCard1Id}`, {
      method: "GET",
      headers: {
        "x-school-id": String(school1Id),
        "Authorization": `Bearer ${teacher1Token}`,
      },
    });

    const body = await res.json();
    expect(body.data.subjects.length).toBe(1);
    expect(body.data.subjects[0].finalScore).toBe(85.00);
    expect(body.data.subjects[0].gradeLetter).toBe("B");
    expect(body.data.subjects[0].knowledgeDescription).toContain("Baik dalam memahami materi");
  });

  // 23. Attendance integration: Angka sakit/izin/alfa terisi secara otomatis
  it("23. Attendance integration: Angka sakit/izin/alfa terisi secara otomatis", async () => {
    const res = await fetch(`http://localhost:3000/report-cards/${reportCard1Id}`, {
      method: "GET",
      headers: {
        "x-school-id": String(school1Id),
        "Authorization": `Bearer ${teacher1Token}`,
      },
    });

    const body = await res.json();
    expect(body.data.attendance).toBeDefined();
    expect(body.data.attendance.sick).toBe(2);
    expect(body.data.attendance.permission).toBe(1);
    expect(body.data.attendance.absent).toBe(1);
  });

  // 24. Master extracurricular: Validasi sekolah asal ekstrakurikuler
  it("24. Master extracurricular: Validasi sekolah asal ekstrakurikuler", async () => {
    // Mencoba menambahkan basket (milik sekolah 2) ke rapor sekolah 1
    const res = await fetch(`http://localhost:3000/report-cards/${reportCard1Id}/extracurricular`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-school-id": String(school1Id),
        "Authorization": `Bearer ${superAdminToken}`,
      },
      body: JSON.stringify({
        extracurricularId: ext2Id, // sekolah 2
        predicate: "B",
      }),
    });

    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toContain("milik sekolah lain");
  });

  // 25. Soft delete lifecycle
  it("25. Soft delete lifecycle", async () => {
    // Hapus rapor
    const delRes = await fetch(`http://localhost:3000/report-cards/${reportCard1Id}`, {
      method: "DELETE",
      headers: {
        "x-school-id": String(school1Id),
        "Authorization": `Bearer ${superAdminToken}`,
      },
    });

    expect(delRes.status).toBe(200);

    // Cari kembali detail rapor (seharusnya 404 karena di-soft delete)
    const findRes = await fetch(`http://localhost:3000/report-cards/${reportCard1Id}`, {
      method: "GET",
      headers: {
        "x-school-id": String(school1Id),
        "Authorization": `Bearer ${superAdminToken}`,
      },
    });

    expect(findRes.status).toBe(404);
  });
});
