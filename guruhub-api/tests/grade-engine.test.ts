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
import { assessmentCategories } from "../src/schema/assessmentCategories";
import { assessments, assessmentScores } from "../src/schema/assessments";
import { studentFinalGrades } from "../src/schema/studentFinalGrades";
import { sessions } from "../src/schema/sessions";
import { auditLogs } from "../src/schema/auditLogs";
import { hashPassword } from "../src/utils/password";
import { eq, and, isNull, isNotNull } from "drizzle-orm";

describe("Modul Academic Grade Engine GuruHub - Clean Architecture & Tenant Isolation", () => {
  let school1Id: number;
  let school2Id: number;
  let academicYear1Id: number;
  let academicYear2Id: number;

  let teacher1Id: number;
  let teacher2Id: number; // school 2

  let class1Id: number;
  let subject1Id: number;

  let student1Id: number; // class1, ACTIVE (untuk final score = 87.85)
  let student2Id: number; // class1, ACTIVE (untuk grade letter test)
  let student3Id: number; // class1, INACTIVE (non active test)
  let student4Id: number; // school 2

  let categoryTugasId: number;
  let categoryPHId: number;
  let categoryProyekId: number;
  let categoryPTSId: number;
  let categoryPASId: number;
  let categoryKosongId: number;

  let assessmentTugas1: number;
  let assessmentTugas2: number;
  let assessmentPH1: number;
  let assessmentPH2: number;
  let assessmentPH3: number;
  let assessmentProyek1: number;
  let assessmentPTS1: number;
  let assessmentPAS1: number;

  let admin1Token: string;
  let admin2Token: string;
  let principal1Token: string;
  let teacher1Token: string;
  let teacher2Token: string;
  let studentToken: string;

  const rawPassword = "GuruHub!2026";

  beforeAll(async () => {
    // 1. Setup Sekolah
    const [s1] = await db.insert(schools).values({
      npsn: "44556677",
      name: "Grade School 1",
      level: "SMA",
      status: "Swasta",
    });
    school1Id = s1.insertId;

    const [s2] = await db.insert(schools).values({
      npsn: "44556678",
      name: "Grade School 2",
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
      email: "admin.grade@school1.sch.id",
      passwordHash,
      role: "SchoolAdmin",
    });

    const [uAdmin2] = await db.insert(users).values({
      schoolId: school2Id,
      email: "admin.grade@school2.sch.id",
      passwordHash,
      role: "SchoolAdmin",
    });

    const [uPrincipal1] = await db.insert(users).values({
      schoolId: school1Id,
      email: "principal.grade@school1.sch.id",
      passwordHash,
      role: "Principal",
    });

    const [uTeacher1] = await db.insert(users).values({
      schoolId: school1Id,
      email: "teacher1.grade@school1.sch.id",
      passwordHash,
      role: "Teacher",
    });

    const [uTeacher2] = await db.insert(users).values({
      schoolId: school2Id,
      email: "teacher2.grade@school2.sch.id",
      passwordHash,
      role: "Teacher",
    });

    const [uStudent] = await db.insert(users).values({
      schoolId: school1Id,
      email: "student.grade@school1.sch.id",
      passwordHash,
      role: "Student",
    });

    // 4. Setup Profil Guru
    const [t1] = await db.insert(teachers).values({
      schoolId: school1Id,
      userId: uTeacher1.insertId,
      name: "Teacher 1 Grade",
      gender: "L",
    });
    teacher1Id = t1.insertId;

    const [t2] = await db.insert(teachers).values({
      schoolId: school2Id,
      userId: uTeacher2.insertId,
      name: "Teacher 2 Grade",
      gender: "P",
    });
    teacher2Id = t2.insertId;

    // 5. Setup Kelas & Mapel
    const [c1] = await db.insert(classes).values({
      schoolId: school1Id,
      academicYearId: academicYear1Id,
      name: "XI-MIPA-1",
      gradeLevel: "11",
    });
    class1Id = c1.insertId;

    const [sub1] = await db.insert(subjects).values({
      schoolId: school1Id,
      name: "Kimia",
      code: "CHEM-11",
      gradeLevel: "11",
    });
    subject1Id = sub1.insertId;

    // 6. Setup Siswa & Membership
    const [stud1] = await db.insert(students).values({
      schoolId: school1Id,
      nis: "27001",
      nisn: "0170000001",
      name: "Siswa Grade Satu",
      gender: "L",
    });
    student1Id = stud1.insertId;

    const [stud2] = await db.insert(students).values({
      schoolId: school1Id,
      nis: "27002",
      nisn: "0170000002",
      name: "Siswa Grade Dua",
      gender: "P",
    });
    student2Id = stud2.insertId;

    const [stud3] = await db.insert(students).values({
      schoolId: school1Id,
      nis: "27003",
      nisn: "0170000003",
      name: "Siswa Grade Tiga",
      gender: "L",
    });
    student3Id = stud3.insertId;

    const [stud4] = await db.insert(students).values({
      schoolId: school2Id,
      nis: "27004",
      nisn: "0170000004",
      name: "Siswa Grade Empat",
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
      classId: class1Id,
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

    // 7. Setup Categories (Tugas=20%, PH=30%, Proyek=20%, PTS=15%, PAS=15%)
    const [catTugas] = await db.insert(assessmentCategories).values({ schoolId: school1Id, name: "Tugas", weight: 20 });
    categoryTugasId = catTugas.insertId;

    const [catPH] = await db.insert(assessmentCategories).values({ schoolId: school1Id, name: "PH", weight: 30 });
    categoryPHId = catPH.insertId;

    const [catProyek] = await db.insert(assessmentCategories).values({ schoolId: school1Id, name: "Proyek", weight: 20 });
    categoryProyekId = catProyek.insertId;

    const [catPTS] = await db.insert(assessmentCategories).values({ schoolId: school1Id, name: "PTS", weight: 15 });
    categoryPTSId = catPTS.insertId;

    const [catPAS] = await db.insert(assessmentCategories).values({ schoolId: school1Id, name: "PAS", weight: 15 });
    categoryPASId = catPAS.insertId;

    const [catKosong] = await db.insert(assessmentCategories).values({ schoolId: school1Id, name: "Kategori Kosong", weight: 0 });
    categoryKosongId = catKosong.insertId;

    // 8. Setup Assessments
    const insertAssessment = async (categoryId: number, title: string, maxScore = 100) => {
      const [inserted] = await db.insert(assessments).values({
        schoolId: school1Id,
        classId: class1Id,
        subjectId: subject1Id,
        teacherId: teacher1Id,
        academicYearId: academicYear1Id,
        categoryId,
        title,
        assessmentType: "DAILY_TEST",
        assessmentDate: "2026-06-16",
        maxScore,
      });
      return inserted.insertId;
    };

    assessmentTugas1 = await insertAssessment(categoryTugasId, "Tugas 1");
    assessmentTugas2 = await insertAssessment(categoryTugasId, "Tugas 2");
    assessmentPH1 = await insertAssessment(categoryPHId, "PH 1");
    assessmentPH2 = await insertAssessment(categoryPHId, "PH 2");
    assessmentPH3 = await insertAssessment(categoryPHId, "PH 3");
    assessmentProyek1 = await insertAssessment(categoryProyekId, "Proyek 1");
    assessmentPTS1 = await insertAssessment(categoryPTSId, "PTS 1");
    assessmentPAS1 = await insertAssessment(categoryPASId, "PAS 1");

    // 9. Input Scores
    // Tugas: 80 & 90 (Avg: 85)
    // PH: 75, 85, 95 (Avg: 85)
    // Proyek: 88 (Avg: 88)
    // PTS: 90
    // PAS: 95 (Avg: 95) -> Supaya Total Akhir = 87.85 sesuai contoh deskripsi
    const insertScore = async (assessmentId: number, studentId: number, score: number) => {
      await db.insert(assessmentScores).values({ assessmentId, studentId, score });
    };

    await insertScore(assessmentTugas1, student1Id, 80);
    await insertScore(assessmentTugas2, student1Id, 90);
    await insertScore(assessmentPH1, student1Id, 75);
    await insertScore(assessmentPH2, student1Id, 85);
    await insertScore(assessmentPH3, student1Id, 95);
    await insertScore(assessmentProyek1, student1Id, 88);
    await insertScore(assessmentPTS1, student1Id, 90);
    await insertScore(assessmentPAS1, student1Id, 95);

    // Untuk student2 (Uji Grade Letter)
    // Berikan nilai 95 di semua kategori -> Avg: 95 -> A
    await insertScore(assessmentTugas1, student2Id, 95);
    await insertScore(assessmentTugas2, student2Id, 95);
    await insertScore(assessmentPH1, student2Id, 95);
    await insertScore(assessmentPH2, student2Id, 95);
    await insertScore(assessmentPH3, student2Id, 95);
    await insertScore(assessmentProyek1, student2Id, 95);
    await insertScore(assessmentPTS1, student2Id, 95);
    await insertScore(assessmentPAS1, student2Id, 95);

    // 10. Login untuk mengambil token
    const fetchToken = async (schoolId: number, email: string) => {
      const res = await fetch("http://localhost:3000/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ schoolId, email, password: rawPassword }),
      });
      const body = await res.json();
      return body.accessToken;
    };

    admin1Token = await fetchToken(school1Id, "admin.grade@school1.sch.id");
    admin2Token = await fetchToken(school2Id, "admin.grade@school2.sch.id");
    principal1Token = await fetchToken(school1Id, "principal.grade@school1.sch.id");
    teacher1Token = await fetchToken(school1Id, "teacher1.grade@school1.sch.id");
    teacher2Token = await fetchToken(school2Id, "teacher2.grade@school2.sch.id");
    studentToken = await fetchToken(school1Id, "student.grade@school1.sch.id");
  });

  afterAll(async () => {
    await db.delete(studentFinalGrades);
    await db.delete(assessmentScores);
    await db.delete(assessments);
    await db.delete(assessmentCategories);
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

  // 1. Hitung nilai siswa berhasil.
  it("1. Hitung nilai siswa berhasil", async () => {
    const res = await fetch("http://localhost:3000/grade-engine/calculate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-school-id": String(school1Id),
        "Authorization": `Bearer ${admin1Token}`,
      },
      body: JSON.stringify({
        studentId: student1Id,
        subjectId: subject1Id,
        academicYearId: academicYear1Id,
      }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    // 87.85 sesuai dengan perhitungan manual contoh deskripsi
    expect(body.data.finalScore).toBe(87.85);
  });

  // 2. Grade letter A berhasil.
  it("2. Grade letter A berhasil", async () => {
    const res = await fetch("http://localhost:3000/grade-engine/calculate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-school-id": String(school1Id),
        "Authorization": `Bearer ${admin1Token}`,
      },
      body: JSON.stringify({
        studentId: student2Id,
        subjectId: subject1Id,
        academicYearId: academicYear1Id,
      }),
    });

    const body = await res.json();
    expect(body.data.gradeLetter).toBe("A"); // Nilai 95 -> A
  });

  // 3. Grade letter B berhasil.
  it("3. Grade letter B berhasil", async () => {
    // student1 bernilai 87.85 -> B
    const res = await fetch("http://localhost:3000/grade-engine/calculate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-school-id": String(school1Id),
        "Authorization": `Bearer ${admin1Token}`,
      },
      body: JSON.stringify({
        studentId: student1Id,
        subjectId: subject1Id,
        academicYearId: academicYear1Id,
      }),
    });

    const body = await res.json();
    expect(body.data.gradeLetter).toBe("B");
  });

  // 4. Grade letter C berhasil.
  it("4. Grade letter C berhasil", async () => {
    // Ubah nilai student2 menjadi 75 di semua kategori
    await db.update(assessmentScores).set({ score: 75 }).where(eq(assessmentScores.studentId, student2Id));

    const res = await fetch("http://localhost:3000/grade-engine/calculate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-school-id": String(school1Id),
        "Authorization": `Bearer ${admin1Token}`,
      },
      body: JSON.stringify({
        studentId: student2Id,
        subjectId: subject1Id,
        academicYearId: academicYear1Id,
      }),
    });

    const body = await res.json();
    expect(body.data.gradeLetter).toBe("C");
  });

  // 5. Grade letter D berhasil.
  it("5. Grade letter D berhasil", async () => {
    // Ubah nilai student2 menjadi 50 di semua kategori
    await db.update(assessmentScores).set({ score: 50 }).where(eq(assessmentScores.studentId, student2Id));

    const res = await fetch("http://localhost:3000/grade-engine/calculate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-school-id": String(school1Id),
        "Authorization": `Bearer ${admin1Token}`,
      },
      body: JSON.stringify({
        studentId: student2Id,
        subjectId: subject1Id,
        academicYearId: academicYear1Id,
      }),
    });

    const body = await res.json();
    expect(body.data.gradeLetter).toBe("D");
  });

  // 6. Assessment soft delete tidak dihitung.
  it("6. Assessment soft delete tidak dihitung", async () => {
    // Soft delete Tugas 2 (semula Tugas 1=80, Tugas 2=90, Avg=85)
    // Sekarang hanya Tugas 1=80, Avg=80.
    // Total kontribusi Tugas: 80 * 20% = 16 (semula 85 * 20% = 17)
    // Skor akhir baru: 87.85 - 1 = 86.85
    await db.update(assessments).set({ deletedAt: new Date() }).where(eq(assessments.id, assessmentTugas2));

    const res = await fetch("http://localhost:3000/grade-engine/calculate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-school-id": String(school1Id),
        "Authorization": `Bearer ${admin1Token}`,
      },
      body: JSON.stringify({
        studentId: student1Id,
        subjectId: subject1Id,
        academicYearId: academicYear1Id,
      }),
    });

    const body = await res.json();
    expect(body.data.finalScore).toBe(86.85);

    // Kembalikan asesmen Tugas 2 aktif kembali
    await db.update(assessments).set({ deletedAt: null }).where(eq(assessments.id, assessmentTugas2));
  });

  // 7. Student non ACTIVE ditolak.
  it("7. Student non ACTIVE ditolak", async () => {
    const res = await fetch("http://localhost:3000/grade-engine/calculate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-school-id": String(school1Id),
        "Authorization": `Bearer ${admin1Token}`,
      },
      body: JSON.stringify({
        studentId: student3Id, // student3 berstatus INACTIVE
        subjectId: subject1Id,
        academicYearId: academicYear1Id,
      }),
    });

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("tidak berstatus ACTIVE");
  });

  // 8. Tenant isolation berhasil.
  it("8. Tenant isolation berhasil", async () => {
    // Admin sekolah 2 mencoba menghitung nilai siswa sekolah 1
    const res = await fetch("http://localhost:3000/grade-engine/calculate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-school-id": String(school1Id),
        "Authorization": `Bearer ${admin2Token}`,
      },
      body: JSON.stringify({
        studentId: student1Id,
        subjectId: subject1Id,
        academicYearId: academicYear1Id,
      }),
    });

    expect(res.status).toBe(403);
  });

  // 9. Teacher dapat menghitung nilai.
  it("9. Teacher dapat menghitung nilai", async () => {
    const res = await fetch("http://localhost:3000/grade-engine/calculate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-school-id": String(school1Id),
        "Authorization": `Bearer ${teacher1Token}`,
      },
      body: JSON.stringify({
        studentId: student1Id,
        subjectId: subject1Id,
        academicYearId: academicYear1Id,
      }),
    });

    expect(res.status).toBe(200);
  });

  // 10. Student ditolak.
  it("10. Student ditolak", async () => {
    const res = await fetch("http://localhost:3000/grade-engine/calculate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-school-id": String(school1Id),
        "Authorization": `Bearer ${studentToken}`,
      },
      body: JSON.stringify({
        studentId: student1Id,
        subjectId: subject1Id,
        academicYearId: academicYear1Id,
      }),
    });

    expect(res.status).toBe(403);
  });

  // 11. Calculate class berhasil.
  it("11. Calculate class berhasil", async () => {
    const res = await fetch("http://localhost:3000/grade-engine/calculate-class", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-school-id": String(school1Id),
        "Authorization": `Bearer ${admin1Token}`,
      },
      body: JSON.stringify({
        classId: class1Id,
        subjectId: subject1Id,
        academicYearId: academicYear1Id,
      }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.length).toBe(2); // student1 dan student2 berstatus ACTIVE
  });

  // 12. Nilai diperbarui setelah assessment berubah.
  it("12. Nilai diperbarui setelah assessment berubah", async () => {
    // Ubah score PAS student1 dari 95 menjadi 100
    // PAS kontribusi: 15% -> 95 * 0.15 = 14.25 -> 100 * 0.15 = 15.0 (selisih +0.75)
    // Final score: 87.85 + 0.75 = 88.60
    await db
      .update(assessmentScores)
      .set({ score: 100 })
      .where(and(eq(assessmentScores.assessmentId, assessmentPAS1), eq(assessmentScores.studentId, student1Id)));

    const res = await fetch("http://localhost:3000/grade-engine/calculate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-school-id": String(school1Id),
        "Authorization": `Bearer ${admin1Token}`,
      },
      body: JSON.stringify({
        studentId: student1Id,
        subjectId: subject1Id,
        academicYearId: academicYear1Id,
      }),
    });

    const body = await res.json();
    expect(body.data.finalScore).toBe(88.60);

    // Kembalikan nilai PAS ke 95
    await db
      .update(assessmentScores)
      .set({ score: 95 })
      .where(and(eq(assessmentScores.assessmentId, assessmentPAS1), eq(assessmentScores.studentId, student1Id)));
  });

  // 13. Bobot kategori digunakan dengan benar.
  it("13. Bobot kategori digunakan dengan benar", async () => {
    const res = await fetch("http://localhost:3000/grade-engine/calculate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-school-id": String(school1Id),
        "Authorization": `Bearer ${admin1Token}`,
      },
      body: JSON.stringify({
        studentId: student1Id,
        subjectId: subject1Id,
        academicYearId: academicYear1Id,
      }),
    });

    const body = await res.json();
    expect(body.data.finalScore).toBe(87.85); // 87.85 adalah bukti bobot digunakan dengan tepat
  });

  // 14. Kategori kosong tidak menyebabkan error.
  it("14. Kategori kosong tidak menyebabkan error", async () => {
    // categoryKosongId tidak memiliki assessment
    const res = await fetch("http://localhost:3000/grade-engine/calculate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-school-id": String(school1Id),
        "Authorization": `Bearer ${admin1Token}`,
      },
      body: JSON.stringify({
        studentId: student1Id,
        subjectId: subject1Id,
        academicYearId: academicYear1Id,
      }),
    });

    expect(res.status).toBe(200);
  });

  // 15. GET final grade berhasil.
  it("15. GET final grade berhasil", async () => {
    const res = await fetch(`http://localhost:3000/grade-engine/student/${student1Id}?subjectId=${subject1Id}&academicYearId=${academicYear1Id}`, {
      method: "GET",
      headers: {
        "x-school-id": String(school1Id),
        "Authorization": `Bearer ${admin1Token}`,
      },
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.finalScore).toBe(87.85);
  });

  // 16. Guru sekolah lain ditolak.
  it("16. Guru sekolah lain ditolak", async () => {
    const res = await fetch("http://localhost:3000/grade-engine/calculate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-school-id": String(school1Id),
        "Authorization": `Bearer ${teacher2Token}`, // Guru sekolah 2
      },
      body: JSON.stringify({
        studentId: student1Id,
        subjectId: subject1Id,
        academicYearId: academicYear1Id,
      }),
    });

    expect(res.status).toBe(403);
  });

  // 17. Principal dapat menghitung semua siswa.
  it("17. Principal dapat menghitung semua siswa", async () => {
    const res = await fetch("http://localhost:3000/grade-engine/calculate-class", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-school-id": String(school1Id),
        "Authorization": `Bearer ${principal1Token}`,
      },
      body: JSON.stringify({
        classId: class1Id,
        subjectId: subject1Id,
        academicYearId: academicYear1Id,
      }),
    });

    expect(res.status).toBe(200);
  });

  // 18. SchoolAdmin dapat menghitung semua siswa.
  it("18. SchoolAdmin dapat menghitung semua siswa", async () => {
    const res = await fetch("http://localhost:3000/grade-engine/calculate-class", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-school-id": String(school1Id),
        "Authorization": `Bearer ${admin1Token}`,
      },
      body: JSON.stringify({
        classId: class1Id,
        subjectId: subject1Id,
        academicYearId: academicYear1Id,
      }),
    });

    expect(res.status).toBe(200);
  });

  // 19. Upsert student_final_grades berhasil.
  it("19. Upsert student_final_grades berhasil", async () => {
    const dbRecord = await db
      .select()
      .from(studentFinalGrades)
      .where(
        and(
          eq(studentFinalGrades.studentId, student1Id),
          eq(studentFinalGrades.subjectId, subject1Id),
          eq(studentFinalGrades.academicYearId, academicYear1Id)
        )
      );
    
    expect(dbRecord.length).toBe(1);
    expect(dbRecord[0].finalScore).toBe(87.85);
  });

  // 20. Data final grade dapat dibaca kembali.
  it("20. Data final grade dapat dibaca kembali", async () => {
    const res = await fetch(`http://localhost:3000/grade-engine/student/${student1Id}?subjectId=${subject1Id}&academicYearId=${academicYear1Id}`, {
      method: "GET",
      headers: {
        "x-school-id": String(school1Id),
        "Authorization": `Bearer ${admin1Token}`,
      },
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.gradeLetter).toBe("B");
    expect(body.data.finalScore).toBe(87.85);
  });
});
