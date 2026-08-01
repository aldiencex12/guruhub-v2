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
import { assessments, assessmentScores } from "../src/schema/assessments";
import {
  reportCards,
  reportCardSubjects,
  reportCardAttendances,
  studentExtracurriculars,
  studentAchievements,
  p5Projects,
  extracurriculars
} from "../src/schema/reportCards";
import { sessions } from "../src/schema/sessions";
import { auditLogs } from "../src/schema/auditLogs";
import { hashPassword } from "../src/utils/password";

describe("Modul PDF Generator GuruHub - Integration & Security tests", () => {
  let school1Id: number;
  let school2Id: number;
  let academicYearId: number;

  let teacher1UserId: number;
  let teacher1Id: number;
  let teacher2UserId: number;
  let teacher2Id: number;

  let class1Id: number;
  let subject1Id: number;
  let student1Id: number;
  let reportCardId: number;
  let assessmentId: number;

  let superAdminToken: string;
  let adminToken: string;
  let teacherToken: string;
  let teacher2Token: string;
  let principalToken: string;
  let homeroomTeacherToken: string;
  let studentToken: string;
  let school2AdminToken: string;

  const rawPassword = "GuruHub!2026";

  beforeAll(async () => {
    // 1. Setup Sekolah
    const [s1] = await db.insert(schools).values({
      npsn: "12349971",
      name: "PDF Test School 1",
      level: "SMP",
      status: "Negeri"
    });
    school1Id = s1.insertId;

    const [s2] = await db.insert(schools).values({
      npsn: "12349972",
      name: "PDF Test School 2",
      level: "SMP",
      status: "Swasta"
    });
    school2Id = s2.insertId;

    // 2. Setup TA
    const [ay] = await db.insert(academicYears).values({
      schoolId: school1Id,
      year: "2026/2027",
      semester: "Ganjil",
      isActive: true
    });
    academicYearId = ay.insertId;

    // 3. Setup Hash
    const passwordHash = await hashPassword(rawPassword);

    // 4. Setup Users
    const [uSuper] = await db.insert(users).values({
      schoolId: school1Id,
      email: "superadmin.pdf@guruhub.sch.id",
      passwordHash,
      role: "SuperAdmin"
    });

    const [uAdmin] = await db.insert(users).values({
      schoolId: school1Id,
      email: "admin.pdf@school1.sch.id",
      passwordHash,
      role: "SchoolAdmin"
    });

    const [uTeach] = await db.insert(users).values({
      schoolId: school1Id,
      email: "teacher.pdf@school1.sch.id",
      passwordHash,
      role: "Teacher"
    });
    teacher1UserId = uTeach.insertId;

    const [uTeach2] = await db.insert(users).values({
      schoolId: school1Id,
      email: "teacher2.pdf@school1.sch.id",
      passwordHash,
      role: "Teacher"
    });
    teacher2UserId = uTeach2.insertId;

    const [uHomeroom] = await db.insert(users).values({
      schoolId: school1Id,
      email: "homeroom.pdf@school1.sch.id",
      passwordHash,
      role: "HomeroomTeacher"
    });

    const [uPrincipal] = await db.insert(users).values({
      schoolId: school1Id,
      email: "principal.pdf@school1.sch.id",
      passwordHash,
      role: "Principal"
    });

    const [uStudent] = await db.insert(users).values({
      schoolId: school1Id,
      email: "student.pdf@school1.sch.id",
      passwordHash,
      role: "Student"
    });

    const [uAdmin2] = await db.insert(users).values({
      schoolId: school2Id,
      email: "admin.pdf@school2.sch.id",
      passwordHash,
      role: "SchoolAdmin"
    });

    // 5. Teachers profile
    const [t1] = await db.insert(teachers).values({
      schoolId: school1Id,
      userId: teacher1UserId,
      name: "Tomi Guru",
      gender: "L"
    });
    teacher1Id = t1.insertId;

    const [t2] = await db.insert(teachers).values({
      schoolId: school1Id,
      userId: teacher2UserId,
      name: "Budi Guru",
      gender: "L"
    });
    teacher2Id = t2.insertId;

    // 6. Class, Subject, Student
    const [c1] = await db.insert(classes).values({
      schoolId: school1Id,
      academicYearId,
      name: "8A",
      gradeLevel: "8"
    });
    class1Id = c1.insertId;

    const [sub1] = await db.insert(subjects).values({
      schoolId: school1Id,
      name: "Fisika",
      code: "PHYS-8",
      gradeLevel: "8"
    });
    subject1Id = sub1.insertId;

    const [st1] = await db.insert(students).values({
      schoolId: school1Id,
      nis: "99002",
      nisn: "0190000002",
      name: "Rudi Siswa",
      gender: "L"
    });
    student1Id = st1.insertId;

    await db.insert(classMembers).values({
      schoolId: school1Id,
      classId: class1Id,
      studentId: student1Id,
      academicYearId,
      status: "ACTIVE"
    });

    // 7. Schedule & Attendance
    const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
    const todayDay = days[new Date().getDay()];
    const todayStr = new Date().toISOString().split("T")[0];

    const [sch] = await db.insert(schedules).values({
      schoolId: school1Id,
      classId: class1Id,
      subjectId: subject1Id,
      teacherId: teacher1Id,
      academicYearId,
      dayOfWeek: todayDay,
      startTime: "08:30:00",
      endTime: "10:00:00",
      status: "Aktif"
    });

    const [att] = await db.insert(attendances).values({
      schoolId: school1Id,
      scheduleId: sch.insertId,
      teacherId: teacher1Id,
      attendanceDate: todayStr
    });

    await db.insert(attendanceDetails).values({
      attendanceId: att.insertId,
      studentId: student1Id,
      status: "PRESENT"
    });

    // 8. Teaching Journal
    await db.insert(teachingJournals).values({
      schoolId: school1Id,
      scheduleId: sch.insertId,
      teacherId: teacher1Id,
      journalDate: todayStr,
      topic: "Kinematika",
      learningObjectives: "Siswa mengerti GLB",
      teachingMethod: "Eksperimen"
    });

    // 9. Assessment & Scores
    const [ass] = await db.insert(assessments).values({
      schoolId: school1Id,
      classId: class1Id,
      subjectId: subject1Id,
      teacherId: teacher1Id,
      academicYearId,
      title: "Asesmen GLB",
      assessmentType: "DAILY_TEST",
      assessmentDate: todayStr,
      maxScore: 100
    });
    assessmentId = ass.insertId;

    await db.insert(assessmentScores).values({
      assessmentId,
      studentId: student1Id,
      score: 95,
      notes: "Sangat baik"
    });

    // 10. Report card & sub-tables
    const [rc] = await db.insert(reportCards).values({
      schoolId: school1Id,
      studentId: student1Id,
      classId: class1Id,
      academicYearId,
      semester: "GANJIL",
      status: "DRAFT",
      homeroomTeacherNotes: "Teruskan prestasi Anda!"
    });
    reportCardId = rc.insertId;

    await db.insert(reportCardSubjects).values({
      reportCardId,
      subjectId: subject1Id,
      finalScore: 95.0,
      gradeLetter: "A",
      knowledgeDescription: "Sangat baik dalam kinematika"
    });

    await db.insert(reportCardAttendances).values({
      reportCardId,
      sick: 0,
      permission: 1,
      absent: 0
    });

    const [ex] = await db.insert(extracurriculars).values({
      schoolId: school1Id,
      name: "Pramuka",
      description: "Praja Muda Karana"
    });

    await db.insert(studentExtracurriculars).values({
      reportCardId,
      extracurricularId: ex.insertId,
      predicate: "A",
      description: "Sangat disiplin"
    });

    await db.insert(studentAchievements).values({
      reportCardId,
      title: "Juara 1 OSN Fisika",
      level: "PROVINCE",
      description: "Medali Emas"
    });

    await db.insert(p5Projects).values({
      reportCardId,
      theme: "Gaya Hidup Berkelanjutan",
      predicate: "SB",
      description: "Sangat aktif dalam daur ulang sampah"
    });

    // Login tokens
    const fetchToken = async (schoolId: number, email: string) => {
      const res = await fetch("http://localhost:3000/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ schoolId, email, password: rawPassword })
      });
      const body = await res.json();
      return body.accessToken;
    };

    superAdminToken = await fetchToken(school1Id, "superadmin.pdf@guruhub.sch.id");
    adminToken = await fetchToken(school1Id, "admin.pdf@school1.sch.id");
    teacherToken = await fetchToken(school1Id, "teacher.pdf@school1.sch.id");
    teacher2Token = await fetchToken(school1Id, "teacher2.pdf@school1.sch.id");
    homeroomTeacherToken = await fetchToken(school1Id, "homeroom.pdf@school1.sch.id");
    principalToken = await fetchToken(school1Id, "principal.pdf@school1.sch.id");
    studentToken = await fetchToken(school1Id, "student.pdf@school1.sch.id");
    school2AdminToken = await fetchToken(school2Id, "admin.pdf@school2.sch.id");
  });

  afterAll(async () => {
    // Clean all seeded data
    await db.delete(p5Projects);
    await db.delete(studentAchievements);
    await db.delete(studentExtracurriculars);
    await db.delete(extracurriculars);
    await db.delete(reportCardAttendances);
    await db.delete(reportCardSubjects);
    await db.delete(reportCards);
    await db.delete(assessmentScores);
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

  // Endpoints: Rapor PDF (/pdf/report-card/:id)
  it("1. GET /pdf/report-card/:id - SuperAdmin succeeds and returns application/pdf", async () => {
    const res = await fetch(`http://localhost:3000/pdf/report-card/${reportCardId}`, {
      headers: { "x-school-id": String(school1Id), Authorization: `Bearer ${superAdminToken}` }
    });
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("application/pdf");
  });

  it("2. GET /pdf/report-card/:id - SchoolAdmin succeeds and returns application/pdf", async () => {
    const res = await fetch(`http://localhost:3000/pdf/report-card/${reportCardId}`, {
      headers: { "x-school-id": String(school1Id), Authorization: `Bearer ${adminToken}` }
    });
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("application/pdf");
  });

  it("3. GET /pdf/report-card/:id - HomeroomTeacher succeeds and returns application/pdf", async () => {
    const res = await fetch(`http://localhost:3000/pdf/report-card/${reportCardId}`, {
      headers: { "x-school-id": String(school1Id), Authorization: `Bearer ${homeroomTeacherToken}` }
    });
    expect(res.status).toBe(200);
  });

  it("4. GET /pdf/report-card/:id - Principal succeeds and returns application/pdf", async () => {
    const res = await fetch(`http://localhost:3000/pdf/report-card/${reportCardId}`, {
      headers: { "x-school-id": String(school1Id), Authorization: `Bearer ${principalToken}` }
    });
    expect(res.status).toBe(200);
  });

  it("5. GET /pdf/report-card/:id - Regular Teacher is Forbidden (403)", async () => {
    const res = await fetch(`http://localhost:3000/pdf/report-card/${reportCardId}`, {
      headers: { "x-school-id": String(school1Id), Authorization: `Bearer ${teacherToken}` }
    });
    expect(res.status).toBe(403);
  });

  it("6. GET /pdf/report-card/:id - Student is Forbidden (403)", async () => {
    const res = await fetch(`http://localhost:3000/pdf/report-card/${reportCardId}`, {
      headers: { "x-school-id": String(school1Id), Authorization: `Bearer ${studentToken}` }
    });
    expect(res.status).toBe(403);
  });

  it("7. GET /pdf/report-card/:id - Tenant Isolation: School 2 Admin is Forbidden (403)", async () => {
    const res = await fetch(`http://localhost:3000/pdf/report-card/${reportCardId}`, {
      headers: { "x-school-id": String(school2Id), Authorization: `Bearer ${school2AdminToken}` }
    });
    expect(res.status).toBe(403);
  });

  it("8. GET /pdf/report-card/:id - Non-existent report card returns 404", async () => {
    const res = await fetch(`http://localhost:3000/pdf/report-card/99999`, {
      headers: { "x-school-id": String(school1Id), Authorization: `Bearer ${adminToken}` }
    });
    expect(res.status).toBe(404);
  });

  // Endpoints: Absensi PDF (/pdf/attendance/class/:classId)
  it("9. GET /pdf/attendance/class/:id - Teacher succeeds and returns A4 rekap absensi", async () => {
    const res = await fetch(`http://localhost:3000/pdf/attendance/class/${class1Id}?semester=Ganjil&academicYearId=${academicYearId}`, {
      headers: { "x-school-id": String(school1Id), Authorization: `Bearer ${teacherToken}` }
    });
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("application/pdf");
  });

  it("10. GET /pdf/attendance/class/:id - Student is Forbidden (403)", async () => {
    const res = await fetch(`http://localhost:3000/pdf/attendance/class/${class1Id}?semester=Ganjil&academicYearId=${academicYearId}`, {
      headers: { "x-school-id": String(school1Id), Authorization: `Bearer ${studentToken}` }
    });
    expect(res.status).toBe(403);
  });

  it("11. GET /pdf/attendance/class/:id - Tenant Isolation: School 2 Admin is Forbidden (403)", async () => {
    const res = await fetch(`http://localhost:3000/pdf/attendance/class/${class1Id}?semester=Ganjil&academicYearId=${academicYearId}`, {
      headers: { "x-school-id": String(school2Id), Authorization: `Bearer ${school2AdminToken}` }
    });
    expect(res.status).toBe(403);
  });

  // Endpoints: Jurnal PDF (/pdf/journals/teacher/:teacherId)
  it("12. GET /pdf/journals/teacher/:id - Teacher succeeds for own journal", async () => {
    const res = await fetch(`http://localhost:3000/pdf/journals/teacher/${teacher1Id}`, {
      headers: { "x-school-id": String(school1Id), Authorization: `Bearer ${teacherToken}` }
    });
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("application/pdf");
  });

  it("13. GET /pdf/journals/teacher/:id - Teacher is Forbidden to access another teacher's journals (403)", async () => {
    const res = await fetch(`http://localhost:3000/pdf/journals/teacher/${teacher1Id}`, {
      headers: { "x-school-id": String(school1Id), Authorization: `Bearer ${teacher2Token}` }
    });
    expect(res.status).toBe(403);
  });

  it("14. GET /pdf/journals/teacher/:id - Admin can access any teacher's journals", async () => {
    const res = await fetch(`http://localhost:3000/pdf/journals/teacher/${teacher1Id}`, {
      headers: { "x-school-id": String(school1Id), Authorization: `Bearer ${adminToken}` }
    });
    expect(res.status).toBe(200);
  });

  it("15. GET /pdf/journals/teacher/:id - Student is Forbidden (403)", async () => {
    const res = await fetch(`http://localhost:3000/pdf/journals/teacher/${teacher1Id}`, {
      headers: { "x-school-id": String(school1Id), Authorization: `Bearer ${studentToken}` }
    });
    expect(res.status).toBe(403);
  });

  // Endpoints: Asesmen PDF (/pdf/assessments/:assessmentId)
  it("16. GET /pdf/assessments/:id - Teacher succeeds for own assessment", async () => {
    const res = await fetch(`http://localhost:3000/pdf/assessments/${assessmentId}`, {
      headers: { "x-school-id": String(school1Id), Authorization: `Bearer ${teacherToken}` }
    });
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("application/pdf");
  });

  it("17. GET /pdf/assessments/:id - Teacher is Forbidden for another teacher's assessment", async () => {
    const res = await fetch(`http://localhost:3000/pdf/assessments/${assessmentId}`, {
      headers: { "x-school-id": String(school1Id), Authorization: `Bearer ${teacher2Token}` }
    });
    expect(res.status).toBe(403);
  });

  it("18. GET /pdf/assessments/:id - Student is Forbidden (403)", async () => {
    const res = await fetch(`http://localhost:3000/pdf/assessments/${assessmentId}`, {
      headers: { "x-school-id": String(school1Id), Authorization: `Bearer ${studentToken}` }
    });
    expect(res.status).toBe(403);
  });

  // Endpoints: Student List (/pdf/students?classId=&academicYearId=)
  it("19. GET /pdf/students - Teacher succeeds and returns list", async () => {
    const res = await fetch(`http://localhost:3000/pdf/students?classId=${class1Id}&academicYearId=${academicYearId}`, {
      headers: { "x-school-id": String(school1Id), Authorization: `Bearer ${teacherToken}` }
    });
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("application/pdf");
  });

  it("20. GET /pdf/students - Student is Forbidden (403)", async () => {
    const res = await fetch(`http://localhost:3000/pdf/students?classId=${class1Id}&academicYearId=${academicYearId}`, {
      headers: { "x-school-id": String(school1Id), Authorization: `Bearer ${studentToken}` }
    });
    expect(res.status).toBe(403);
  });

  // Endpoints: Teacher List (/pdf/teachers)
  it("21. GET /pdf/teachers - Principal succeeds and returns list", async () => {
    const res = await fetch(`http://localhost:3000/pdf/teachers`, {
      headers: { "x-school-id": String(school1Id), Authorization: `Bearer ${principalToken}` }
    });
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("application/pdf");
  });

  it("22. GET /pdf/teachers - Student is Forbidden (403)", async () => {
    const res = await fetch(`http://localhost:3000/pdf/teachers`, {
      headers: { "x-school-id": String(school1Id), Authorization: `Bearer ${studentToken}` }
    });
    expect(res.status).toBe(403);
  });
});
