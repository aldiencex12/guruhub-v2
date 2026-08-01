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
import { schedules } from "../src/schema/schedules";
import { attendances, attendanceDetails } from "../src/schema/attendances";
import { teachingJournals } from "../src/schema/teachingJournals";
import { assessments } from "../src/schema/assessments";
import { studentFinalGrades } from "../src/schema/studentFinalGrades";
import { reportCards } from "../src/schema/reportCards";
import { sessions } from "../src/schema/sessions";
import { auditLogs } from "../src/schema/auditLogs";
import { hashPassword } from "../src/utils/password";
import { eq } from "drizzle-orm";

describe("Modul Dashboard & Analytics GuruHub - Tenant Isolation, RBAC & Aggregations", () => {
  let school1Id: number;
  let school2Id: number;
  let academicYearId: number;

  let teacher1UserId: number;
  let teacher1Id: number;
  let class1Id: number;
  let subject1Id: number;
  let student1Id: number;

  let superAdminToken: string;
  let adminToken: string;
  let teacherToken: string;
  let principalToken: string;
  let studentToken: string;
  let school2AdminToken: string;

  const rawPassword = "GuruHub!2026";

  beforeAll(async () => {
    // 1. Setup Sekolah
    const [s1] = await db.insert(schools).values({
      npsn: "12345671",
      name: "Dashboard School 1",
      level: "SMP",
      status: "Negeri",
    });
    school1Id = s1.insertId;

    const [s2] = await db.insert(schools).values({
      npsn: "12345672",
      name: "Dashboard School 2",
      level: "SMP",
      status: "Swasta",
    });
    school2Id = s2.insertId;

    // 2. Setup Tahun Ajaran
    const [ay] = await db.insert(academicYears).values({
      schoolId: school1Id,
      year: "2026/2027",
      semester: "Ganjil",
      isActive: true,
    });
    academicYearId = ay.insertId;

    // 3. Setup Akun
    const passwordHash = await hashPassword(rawPassword);

    const [uSuper] = await db.insert(users).values({
      schoolId: school1Id,
      email: "superadmin.db@guruhub.sch.id",
      passwordHash,
      role: "SuperAdmin",
    });

    const [uAdmin] = await db.insert(users).values({
      schoolId: school1Id,
      email: "admin.db@school1.sch.id",
      passwordHash,
      role: "SchoolAdmin",
    });

    const [uTeach] = await db.insert(users).values({
      schoolId: school1Id,
      email: "teacher.db@school1.sch.id",
      passwordHash,
      role: "Teacher",
    });
    teacher1UserId = uTeach.insertId;

    const [uPrincipal] = await db.insert(users).values({
      schoolId: school1Id,
      email: "principal.db@school1.sch.id",
      passwordHash,
      role: "Principal",
    });

    const [uStudent] = await db.insert(users).values({
      schoolId: school1Id,
      email: "student.db@school1.sch.id",
      passwordHash,
      role: "Student",
    });

    const [uAdmin2] = await db.insert(users).values({
      schoolId: school2Id,
      email: "admin.db@school2.sch.id",
      passwordHash,
      role: "SchoolAdmin",
    });

    // 4. Profil Guru
    const [t1] = await db.insert(teachers).values({
      schoolId: school1Id,
      userId: teacher1UserId,
      name: "Bambang Guru",
      gender: "L",
    });
    teacher1Id = t1.insertId;

    // 5. Kelas, Mapel & Siswa
    const [c1] = await db.insert(classes).values({
      schoolId: school1Id,
      academicYearId,
      name: "7A",
      gradeLevel: "7",
    });
    class1Id = c1.insertId;

    const [sub1] = await db.insert(subjects).values({
      schoolId: school1Id,
      name: "Matematika",
      code: "MATH-7",
      gradeLevel: "7",
    });
    subject1Id = sub1.insertId;

    const [st1] = await db.insert(students).values({
      schoolId: school1Id,
      nis: "99001",
      nisn: "0190000001",
      name: "Anto Siswa",
      gender: "L",
    });
    student1Id = st1.insertId;

    await db.insert(classMembers).values({
      schoolId: school1Id,
      classId: class1Id,
      studentId: student1Id,
      academicYearId,
      status: "ACTIVE",
    });

    // 6. Schedule (Hari ini agar muncul di Teaching Journal schedule checking)
    const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
    const todayDay = days[new Date().getDay()];

    const [sch] = await db.insert(schedules).values({
      schoolId: school1Id,
      classId: class1Id,
      subjectId: subject1Id,
      teacherId: teacher1Id,
      academicYearId,
      dayOfWeek: todayDay,
      startTime: "07:00:00",
      endTime: "08:30:00",
      status: "Aktif",
    });

    // 7. Absensi hari ini
    const todayStr = new Date().toISOString().split("T")[0];
    const [att] = await db.insert(attendances).values({
      schoolId: school1Id,
      scheduleId: sch.insertId,
      teacherId: teacher1Id,
      attendanceDate: todayStr,
    });
    await db.insert(attendanceDetails).values({
      attendanceId: att.insertId,
      studentId: student1Id,
      status: "PRESENT",
    });

    // 8. Teaching Journal hari ini
    await db.insert(teachingJournals).values({
      schoolId: school1Id,
      scheduleId: sch.insertId,
      teacherId: teacher1Id,
      journalDate: todayStr,
      topic: "Aljabar",
      learningObjectives: "Siswa mengerti persamaan linier",
      teachingMethod: "Ceramah",
    });

    // 9. Assessment & Final Grade
    await db.insert(assessments).values({
      schoolId: school1Id,
      classId: class1Id,
      subjectId: subject1Id,
      teacherId: teacher1Id,
      academicYearId,
      title: "UH 1 Aljabar",
      assessmentType: "DAILY_TEST",
      assessmentDate: todayStr,
      maxScore: 100,
    });

    await db.insert(studentFinalGrades).values({
      schoolId: school1Id,
      studentId: student1Id,
      classId: class1Id,
      subjectId: subject1Id,
      academicYearId,
      finalScore: 92.50,
      gradeLetter: "A",
      calculatedAt: new Date(),
    });

    // 10. Rapor
    await db.insert(reportCards).values({
      schoolId: school1Id,
      studentId: student1Id,
      classId: class1Id,
      academicYearId,
      semester: "GANJIL",
      status: "DRAFT",
    });

    // Login token retrieval
    const fetchToken = async (schoolId: number, email: string) => {
      const res = await fetch("http://localhost:3000/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ schoolId, email, password: rawPassword }),
      });
      const body = await res.json();
      return body.accessToken;
    };

    superAdminToken = await fetchToken(school1Id, "superadmin.db@guruhub.sch.id");
    adminToken = await fetchToken(school1Id, "admin.db@school1.sch.id");
    teacherToken = await fetchToken(school1Id, "teacher.db@school1.sch.id");
    principalToken = await fetchToken(school1Id, "principal.db@school1.sch.id");
    studentToken = await fetchToken(school1Id, "student.db@school1.sch.id");
    school2AdminToken = await fetchToken(school2Id, "admin.db@school2.sch.id");
  });

  afterAll(async () => {
    await db.delete(reportCards);
    await db.delete(studentFinalGrades);
    await db.delete(assessments);
    await db.delete(teachingJournals);
    await db.delete(attendanceDetails);
    await db.delete(attendances);
    await db.delete(schedules);
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

  // Tests 1 - 6: Admin Statistics verification
  it("1. getSummary returns correct school summary for Admin", async () => {
    const res = await fetch("http://localhost:3000/dashboard/summary", {
      headers: { "x-school-id": String(school1Id), "Authorization": `Bearer ${adminToken}` },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.totalStudents).toBe(1);
    expect(body.data.totalTeachers).toBe(1);
    expect(body.data.totalClasses).toBe(1);
    expect(body.data.totalSchedules).toBe(1);
  });

  it("2. getAttendance returns correct attendance summary for Admin", async () => {
    const res = await fetch("http://localhost:3000/dashboard/attendance", {
      headers: { "x-school-id": String(school1Id), "Authorization": `Bearer ${adminToken}` },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.hadirHariIni).toBe(1);
  });

  it("3. getJournals returns correct teaching journals summary for Admin", async () => {
    const res = await fetch("http://localhost:3000/dashboard/journals", {
      headers: { "x-school-id": String(school1Id), "Authorization": `Bearer ${adminToken}` },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.jurnalHariIni).toBe(1);
    expect(body.data.guruSudahMengisi).toBe(1);
    expect(body.data.guruBelumMengisi).toBe(0);
  });

  it("4. getAssessments returns correct assessments summary for Admin", async () => {
    const res = await fetch("http://localhost:3000/dashboard/assessments", {
      headers: { "x-school-id": String(school1Id), "Authorization": `Bearer ${adminToken}` },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.totalAssessment).toBe(1);
    expect(body.data.assessmentBulanIni).toBe(1);
  });

  it("5. getGrades returns correct grade summary for Admin", async () => {
    const res = await fetch("http://localhost:3000/dashboard/grades", {
      headers: { "x-school-id": String(school1Id), "Authorization": `Bearer ${adminToken}` },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.rataRataSekolah).toBe(92.50);
    expect(body.data.rataRataPerKelas[0].className).toBe("7A");
    expect(body.data.rataRataPerMapel[0].subjectName).toBe("Matematika");
  });

  it("6. getReportCards returns correct report card summary for Admin", async () => {
    const res = await fetch("http://localhost:3000/dashboard/report-cards", {
      headers: { "x-school-id": String(school1Id), "Authorization": `Bearer ${adminToken}` },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.totalDraft).toBe(1);
  });

  // Tests 7 - 10: RBAC allowed roles
  it("7. RBAC validation: Principal has full access", async () => {
    const res = await fetch("http://localhost:3000/dashboard/summary", {
      headers: { "x-school-id": String(school1Id), "Authorization": `Bearer ${principalToken}` },
    });
    expect(res.status).toBe(200);
  });

  it("8. RBAC validation: Teacher has access", async () => {
    const res = await fetch("http://localhost:3000/dashboard/summary", {
      headers: { "x-school-id": String(school1Id), "Authorization": `Bearer ${teacherToken}` },
    });
    expect(res.status).toBe(200);
  });

  it("9. RBAC validation: SuperAdmin has full access", async () => {
    const res = await fetch("http://localhost:3000/dashboard/summary", {
      headers: { "x-school-id": String(school1Id), "Authorization": `Bearer ${superAdminToken}` },
    });
    expect(res.status).toBe(200);
  });

  it("10. Teacher restriction: personal getJournals only returns their teaching journals status", async () => {
    const res = await fetch("http://localhost:3000/dashboard/journals", {
      headers: { "x-school-id": String(school1Id), "Authorization": `Bearer ${teacherToken}` },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.jurnalHariIni).toBe(1);
  });

  // Tests 11 - 16: RBAC Student Forbidden
  it("11. RBAC validation: Student getSummary is forbidden", async () => {
    const res = await fetch("http://localhost:3000/dashboard/summary", {
      headers: { "x-school-id": String(school1Id), "Authorization": `Bearer ${studentToken}` },
    });
    expect(res.status).toBe(403);
  });

  it("12. RBAC validation: Student getAttendance is forbidden", async () => {
    const res = await fetch("http://localhost:3000/dashboard/attendance", {
      headers: { "x-school-id": String(school1Id), "Authorization": `Bearer ${studentToken}` },
    });
    expect(res.status).toBe(403);
  });

  it("13. RBAC validation: Student getJournals is forbidden", async () => {
    const res = await fetch("http://localhost:3000/dashboard/journals", {
      headers: { "x-school-id": String(school1Id), "Authorization": `Bearer ${studentToken}` },
    });
    expect(res.status).toBe(403);
  });

  it("14. RBAC validation: Student getAssessments is forbidden", async () => {
    const res = await fetch("http://localhost:3000/dashboard/assessments", {
      headers: { "x-school-id": String(school1Id), "Authorization": `Bearer ${studentToken}` },
    });
    expect(res.status).toBe(403);
  });

  it("15. RBAC validation: Student getGrades is forbidden", async () => {
    const res = await fetch("http://localhost:3000/dashboard/grades", {
      headers: { "x-school-id": String(school1Id), "Authorization": `Bearer ${studentToken}` },
    });
    expect(res.status).toBe(403);
  });

  it("16. RBAC validation: Student getReportCards is forbidden", async () => {
    const res = await fetch("http://localhost:3000/dashboard/report-cards", {
      headers: { "x-school-id": String(school1Id), "Authorization": `Bearer ${studentToken}` },
    });
    expect(res.status).toBe(403);
  });

  // Test 17: Tenant Isolation
  it("17. Tenant isolation: Admin School 2 cannot view School 1's stats", async () => {
    const res = await fetch("http://localhost:3000/dashboard/summary", {
      headers: { "x-school-id": String(school2Id), "Authorization": `Bearer ${school2AdminToken}` },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    // School 2 has 0 students / 0 teachers
    expect(body.data.totalStudents).toBe(0);
    expect(body.data.totalTeachers).toBe(0);
  });

  // Tests 18 - 20: Teacher restrictions
  it("18. Teacher restriction: personal getSummary only returns schedules/classes/subjects they teach", async () => {
    const res = await fetch("http://localhost:3000/dashboard/summary", {
      headers: { "x-school-id": String(school1Id), "Authorization": `Bearer ${teacherToken}` },
    });
    const body = await res.json();
    expect(body.data.totalTeachers).toBe(1); // 1, which is themselves
    expect(body.data.totalSchedules).toBe(1);
  });

  it("19. Teacher restriction: personal getAttendance only returns their lesson's attendance details", async () => {
    const res = await fetch("http://localhost:3000/dashboard/attendance", {
      headers: { "x-school-id": String(school1Id), "Authorization": `Bearer ${teacherToken}` },
    });
    const body = await res.json();
    expect(body.data.hadirHariIni).toBe(1);
  });

  it("20. Teacher restriction: personal getAssessments only returns their assessments", async () => {
    const res = await fetch("http://localhost:3000/dashboard/assessments", {
      headers: { "x-school-id": String(school1Id), "Authorization": `Bearer ${teacherToken}` },
    });
    const body = await res.json();
    expect(body.data.totalAssessment).toBe(1);
  });
});
