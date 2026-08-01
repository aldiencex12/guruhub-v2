import { db } from "./index";
import { schools } from "../schema/schools";
import { users } from "../schema/users";
import { teachers } from "../schema/teachers";
import { students } from "../schema/students";
import { classes, classStudents } from "../schema/classes";
import { subjects } from "../schema/subjects";
import { schedules } from "../schema/schedules";
import { academicYears } from "../schema/academicYears";
import { attendances, attendanceDetails } from "../schema/attendances";
import { hashPassword } from "../utils/password";
import {
  disciplineCategories,
  disciplineTypes,
  disciplinePolicies,
  disciplineIncidents,
  disciplineIncidentStudents,
  disciplineIncidentWitnesses,
  disciplineIncidentAttachments,
  disciplineSanctionThresholds,
  disciplineSanctionLogs,
} from "../schema/discipline";

async function seed() {
  console.log("Seeding database with rich mock data for all APIs...");

  // 1. Clean up old data in correct relational order
  await db.delete(attendanceDetails);
  await db.delete(attendances);
  await db.delete(classStudents);
  
  // Clean up discipline tables first due to foreign keys referencing students, teachers, classes, academicYears, users, schools
  await db.delete(disciplineSanctionLogs);
  await db.delete(disciplineSanctionThresholds);
  await db.delete(disciplineIncidentAttachments);
  await db.delete(disciplineIncidentWitnesses);
  await db.delete(disciplineIncidentStudents);
  await db.delete(disciplineIncidents);
  await db.delete(disciplinePolicies);
  await db.delete(disciplineTypes);
  await db.delete(disciplineCategories);

  await db.delete(students);
  await db.delete(classes);
  await db.delete(schedules);
  await db.delete(teachers);
  await db.delete(subjects);
  await db.delete(academicYears);
  await db.delete(users);
  await db.delete(schools); await db.execute(require('drizzle-orm').sql`ALTER TABLE schools AUTO_INCREMENT = 719;`);

  console.log("Database cleared.");

  // 2. Create School 1
  const [sch1] = await db.insert(schools).values({
    npsn: "10203040",
    name: "SMA Negeri 1 Jakarta",
    level: "SMA",
    status: "Negeri",
  });
  const school1Id = sch1.insertId;

  // Create School 2 (For cross-tenant testing)
  const [sch2] = await db.insert(schools).values({
    npsn: "50607080",
    name: "SMA Negeri 2 Bandung",
    level: "SMA",
    status: "Negeri",
  });
  const school2Id = sch2.insertId;
  console.log(`Schools created. School 1 ID: ${school1Id}, School 2 ID: ${school2Id}`);

  // 3. Create Academic Year
  const [ay1] = await db.insert(academicYears).values({
    schoolId: school1Id,
    year: "2026/2027",
    semester: "Ganjil",
    isActive: true,
  });
  const academicYearId = ay1.insertId;
  console.log(`Academic Year created: ID ${academicYearId}`);

  //. Create Users (Password: GuruHub!2026)
  const passwordHash = await hashPassword("GuruHub!2026");

  const [uAdmin] = await db.insert(users).values({ schoolId: school1Id, email: "admin@guruhub.sch.id", passwordHash, role: "SchoolAdmin" });
  const [uPrincipal] = await db.insert(users).values({ schoolId: school1Id, email: "principal@guruhub.sch.id", passwordHash, role: "Principal" });

  // Teachers Users
  const [uTeacher1] = await db.insert(users).values({ schoolId: school1Id, email: "budi@guruhub.sch.id", passwordHash, role: "Teacher" });
  const [uTeacher2] = await db.insert(users).values({ schoolId: school1Id, email: "ani@guruhub.sch.id", passwordHash, role: "Teacher" });
  const [uTeacher3] = await db.insert(users).values({ schoolId: school1Id, email: "joko@guruhub.sch.id", passwordHash, role: "Teacher" });
  const [uTeacher4] = await db.insert(users).values({ schoolId: school1Id, email: "ratna@guruhub.sch.id", passwordHash, role: "Teacher" });

  // Students Users
  const [uStudent1] = await db.insert(users).values({ schoolId: school1Id, email: "aditya@guruhub.sch.id", passwordHash, role: "Student" });
  const [uStudent2] = await db.insert(users).values({ schoolId: school1Id, email: "siti@guruhub.sch.id", passwordHash, role: "Student" });
  const [uStudent3] = await db.insert(users).values({ schoolId: school1Id, email: "bambang@guruhub.sch.id", passwordHash, role: "Student" });
  const [uStudent4] = await db.insert(users).values({ schoolId: school1Id, email: "dewi@guruhub.sch.id", passwordHash, role: "Student" });

  console.log("Users created.");

  // 5. Create Teachers Profiles
  const [t1] = await db.insert(teachers).values({ schoolId: school1Id, userId: uTeacher1.insertId, name: "Budi Santoso, M.Pd.", gender: "L", nip: "198501012010011002", phone: "081234567890" });
  const teacher1Id = t1.insertId;

  const [t2] = await db.insert(teachers).values({ schoolId: school1Id, userId: uTeacher2.insertId, name: "Ani Wijaya, S.Pd.", gender: "P", nip: "199002022015022003", phone: "081234567891" });
  const teacher2Id = t2.insertId;

  const [t3] = await db.insert(teachers).values({ schoolId: school1Id, userId: uTeacher3.insertId, name: "Joko Susilo, M.Si.", gender: "L", nip: "197803032005011004", phone: "081234567892" });
  const teacher3Id = t3.insertId;

  const [t4] = await db.insert(teachers).values({ schoolId: school1Id, userId: uTeacher4.insertId, name: "Ratna Sari, S.Kom.", gender: "P", nip: "198804042012022005", phone: "081234567893" });
  const teacher4Id = t4.insertId;

  console.log("Teachers profiles created.");

  // 6. Create Classes
  const [c1] = await db.insert(classes).values({ schoolId: school1Id, academicYearId, homeroomTeacherId: teacher1Id, name: "X-MIPA-1", gradeLevel: "10", status: "Aktif" });
  const class1Id = c1.insertId;

  const [c2] = await db.insert(classes).values({ schoolId: school1Id, academicYearId, homeroomTeacherId: teacher2Id, name: "X-MIPA-2", gradeLevel: "10", status: "Aktif" });
  const class2Id = c2.insertId;

  const [c3] = await db.insert(classes).values({ schoolId: school1Id, academicYearId, homeroomTeacherId: teacher3Id, name: "XI-IPS-1", gradeLevel: "11", status: "Aktif" });
  const class3Id = c3.insertId;

  console.log("Classes created.");

  // 7. Create Students Profiles
  const [st1] = await db.insert(students).values({ schoolId: school1Id, userId: uStudent1.insertId, name: "Aditya Pratama", gender: "L", nisn: "0012345678", nis: "20260001", status: "Aktif" });
  const student1Id = st1.insertId;

  const [st2] = await db.insert(students).values({ schoolId: school1Id, userId: uStudent2.insertId, name: "Siti Aminah", gender: "P", nisn: "0012345679", nis: "20260002", status: "Aktif" });
  const student2Id = st2.insertId;

  const [st3] = await db.insert(students).values({ schoolId: school1Id, userId: uStudent3.insertId, name: "Bambang Pamungkas", gender: "L", nisn: "0012345680", nis: "20260003", status: "Aktif" });
  const student3Id = st3.insertId;

  const [st4] = await db.insert(students).values({ schoolId: school1Id, userId: uStudent4.insertId, name: "Dewi Lestari", gender: "P", nisn: "0012345681", nis: "20260004", status: "Aktif" });
  const student4Id = st4.insertId;

  const [st5] = await db.insert(students).values({ schoolId: school1Id, name: "Eko Prasetyo", gender: "L", nisn: "0012345682", nis: "20260005", status: "Aktif" });
  const student5Id = st5.insertId;

  const [st6] = await db.insert(students).values({ schoolId: school1Id, name: "Fitri Handayani", gender: "P", nisn: "0012345683", nis: "20260006", status: "Aktif" });
  const student6Id = st6.insertId;

  // Link Students to Classes
  await db.insert(classStudents).values([
    { schoolId: school1Id, classId: class1Id, studentId: student1Id },
    { schoolId: school1Id, classId: class1Id, studentId: student2Id },
    { schoolId: school1Id, classId: class1Id, studentId: student3Id },
    { schoolId: school1Id, classId: class1Id, studentId: student4Id },
    { schoolId: school1Id, classId: class2Id, studentId: student5Id },
    { schoolId: school1Id, classId: class2Id, studentId: student6Id },
  ]);

  console.log("Students profiles and class enrollments created.");

  // 8. Create Subjects
  const [sub1] = await db.insert(subjects).values({ schoolId: school1Id, name: "Matematika", code: "MTK-10", gradeLevel: "10", status: "Aktif" });
  const subject1Id = sub1.insertId;

  const [sub2] = await db.insert(subjects).values({ schoolId: school1Id, name: "Fisika", code: "FIS-10", gradeLevel: "10", status: "Aktif" });
  const subject2Id = sub2.insertId;

  const [sub3] = await db.insert(subjects).values({ schoolId: school1Id, name: "Biologi", code: "BIO-10", gradeLevel: "10", status: "Aktif" });
  const subject3Id = sub3.insertId;

  const [sub4] = await db.insert(subjects).values({ schoolId: school1Id, name: "Informatika", code: "INF-10", gradeLevel: "10", status: "Aktif" });
  const subject4Id = sub4.insertId;

  console.log("Subjects created.");

  // 9. Create Schedules
  const [sch1Obj] = await db.insert(schedules).values({ schoolId: school1Id, classId: class1Id, subjectId: subject1Id, teacherId: teacher1Id, academicYearId, dayOfWeek: "Senin", startTime: "07:00", endTime: "08:30", status: "Aktif" });
  const schedule1Id = sch1Obj.insertId;

  const [sch2Obj] = await db.insert(schedules).values({ schoolId: school1Id, classId: class1Id, subjectId: subject2Id, teacherId: teacher2Id, academicYearId, dayOfWeek: "Senin", startTime: "09:00", endTime: "10:30", status: "Aktif" });
  const schedule2Id = sch2Obj.insertId;

  const [sch3Obj] = await db.insert(schedules).values({ schoolId: school1Id, classId: class1Id, subjectId: subject3Id, teacherId: teacher3Id, academicYearId, dayOfWeek: "Selasa", startTime: "07:00", endTime: "08:30", status: "Aktif" });
  const schedule3Id = sch3Obj.insertId;

  const [sch4Obj] = await db.insert(schedules).values({ schoolId: school1Id, classId: class2Id, subjectId: subject1Id, teacherId: teacher1Id, academicYearId, dayOfWeek: "Rabu", startTime: "07:00", endTime: "08:30", status: "Aktif" });
  const schedule4Id = sch4Obj.insertId;

  console.log("Schedules created.");

  // 10. Pre-mark some Attendances
  // Attendance 1 (Schedule 1, Monday 2026-06-08)
  const [att1] = await db.insert(attendances).values({
    schoolId: school1Id,
    scheduleId: schedule1Id,
    teacherId: teacher1Id,
    attendanceDate: "2026-06-08",
    notes: "Pertemuan ke-1 Aljabar",
  });
  const attendance1Id = att1.insertId;

  await db.insert(attendanceDetails).values([
    { attendanceId: attendance1Id, studentId: student1Id, status: "PRESENT", notes: "Hadir tepat waktu" },
    { attendanceId: attendance1Id, studentId: student2Id, status: "PRESENT" },
    { attendanceId: attendance1Id, studentId: student3Id, status: "SICK", notes: "Sakit demam" },
    { attendanceId: attendance1Id, studentId: student4Id, status: "ABSENT" },
  ]);

  // Attendance 2 (Schedule 2, Monday 2026-06-08)
  const [att2] = await db.insert(attendances).values({
    schoolId: school1Id,
    scheduleId: schedule2Id,
    teacherId: teacher2Id,
    attendanceDate: "2026-06-08",
    notes: "Pengenalan Fisika Kuantum",
  });
  const attendance2Id = att2.insertId;

  await db.insert(attendanceDetails).values([
    { attendanceId: attendance2Id, studentId: student1Id, status: "PRESENT" },
    { attendanceId: attendance2Id, studentId: student2Id, status: "PERMISSION", notes: "Dispen lomba esai" },
    { attendanceId: attendance2Id, studentId: student3Id, status: "PRESENT" },
    { attendanceId: attendance2Id, studentId: student4Id, status: "PRESENT" },
  ]);

  console.log("Initial Attendances marked.");

  // 11. Create default discipline policy for School 1
  await db.insert(disciplinePolicies).values({
    schoolId: school1Id,
    pointResetCycle: "ACADEMIC_YEAR",
    maxActivePoints: 100,
    autoSanctionEnabled: true,
    carryForwardPercentage: 0,
  });
  console.log("Default Discipline Policy created.");

  // 12. Create discipline categories
  // Violations
  const [catV1] = await db.insert(disciplineCategories).values({ schoolId: school1Id, code: "CAT-V-MIN", name: "Pelanggaran Ringan", type: "VIOLATION", description: "Pelanggaran tata tertib kategori ringan" });
  const [catV2] = await db.insert(disciplineCategories).values({ schoolId: school1Id, code: "CAT-V-MOD", name: "Pelanggaran Sedang", type: "VIOLATION", description: "Pelanggaran tata tertib kategori sedang" });
  const [catV3] = await db.insert(disciplineCategories).values({ schoolId: school1Id, code: "CAT-V-MAJ", name: "Pelanggaran Berat", type: "VIOLATION", description: "Pelanggaran tata tertib kategori berat" });
  
  // Rewards
  const [catR1] = await db.insert(disciplineCategories).values({ schoolId: school1Id, code: "CAT-R-ACA", name: "Prestasi Akademik", type: "REWARD", description: "Penghargaan atas prestasi bidang akademik" });
  const [catR2] = await db.insert(disciplineCategories).values({ schoolId: school1Id, code: "CAT-R-NAC", name: "Prestasi Non-Akademik", type: "REWARD", description: "Penghargaan atas prestasi bidang non-akademik" });
  const [catR3] = await db.insert(disciplineCategories).values({ schoolId: school1Id, code: "CAT-R-CHA", name: "Karakter & Kedisiplinan", type: "REWARD", description: "Penghargaan atas kepribadian dan kedisiplinan luar biasa" });
  
  console.log("Discipline Categories seeded.");

  // 13. Create discipline types (Rules)
  // Violations - Minor
  const [typeVLate] = await db.insert(disciplineTypes).values({ schoolId: school1Id, categoryId: catV1.insertId, code: "V-LATE", name: "Terlambat Masuk Sekolah", defaultPoints: 5, description: "Hadir setelah bel masuk berbunyi" });
  const [typeVUniform] = await db.insert(disciplineTypes).values({ schoolId: school1Id, categoryId: catV1.insertId, code: "V-UNIFORM", name: "Atribut Seragam Tidak Lengkap", defaultPoints: 5, description: "Tidak memakai dasi, sabuk, atau kaos kaki sesuai ketentuan" });
  
  // Violations - Moderate
  const [typeVSkip] = await db.insert(disciplineTypes).values({ schoolId: school1Id, categoryId: catV2.insertId, code: "V-SKIP", name: "Membolos Jam Pelajaran", defaultPoints: 15, description: "Meninggalkan kelas tanpa izin selama KBM" });
  const [typeVLang] = await db.insert(disciplineTypes).values({ schoolId: school1Id, categoryId: catV2.insertId, code: "V-LANG", name: "Menggunakan Bahasa Tidak Sopan", defaultPoints: 10, description: "Mengucapkan kata-kata kasar di lingkungan sekolah" });
  
  // Violations - Major
  const [typeVFight] = await db.insert(disciplineTypes).values({ schoolId: school1Id, categoryId: catV3.insertId, code: "V-FIGHT", name: "Perkelahian / Tawuran", defaultPoints: 50, description: "Melakukan kekerasan fisik terhadap sesama siswa" });
  const [typeVSmoke] = await db.insert(disciplineTypes).values({ schoolId: school1Id, categoryId: catV3.insertId, code: "V-SMOKE", name: "Merokok di Area Sekolah", defaultPoints: 30, description: "Membawa atau merokok di dalam kawasan sekolah" });

  // Rewards - Academic
  const [typeROlymp] = await db.insert(disciplineTypes).values({ schoolId: school1Id, categoryId: catR1.insertId, code: "R-OLYMP", name: "Pemenang Olimpiade / Lomba Sains", defaultPoints: 30, description: "Juara 1, 2, atau 3 tingkat Kabupaten/Provinsi/Nasional" });
  const [typeRRank] = await db.insert(disciplineTypes).values({ schoolId: school1Id, categoryId: catR1.insertId, code: "R-RANK", name: "Juara Umum Kelas", defaultPoints: 20, description: "Meraih peringkat 1 di kelas pada akhir semester" });

  // Rewards - Character
  const [typeRHelp] = await db.insert(disciplineTypes).values({ schoolId: school1Id, categoryId: catR3.insertId, code: "R-HELP", name: "Membantu Penyelenggaraan Acara Sekolah", defaultPoints: 10, description: "Menjadi panitia atau membantu guru secara sukarela" });
  const [typeRAtt] = await db.insert(disciplineTypes).values({ schoolId: school1Id, categoryId: catR3.insertId, code: "R-ATT", name: "Kehadiran Sempurna (100% Attendance)", defaultPoints: 15, description: "Tidak pernah absen selama 1 semester" });

  console.log("Discipline Types seeded.");

  // 14. Create discipline sanction thresholds
  await db.insert(disciplineSanctionThresholds).values([
    { schoolId: school1Id, minPoints: 20, sanctionName: "Pembinaan BK & Teguran Lisan", actionRequired: "PEMBINAAN_BK", description: "Panggilan pertama oleh guru BK untuk konseling" },
    { schoolId: school1Id, minPoints: 40, sanctionName: "Panggilan Orang Tua I", actionRequired: "PANGGILAN_ORANG_TUA", description: "Panggilan orang tua siswa ke sekolah untuk diskusi" },
    { schoolId: school1Id, minPoints: 60, sanctionName: "Surat Peringatan Pertama (SP 1)", actionRequired: "SURAT_PERINGATAN", description: "Penerbitan SP 1 dan perjanjian tertulis" },
    { schoolId: school1Id, minPoints: 80, sanctionName: "Skorsing 3 Hari", actionRequired: "SKORSING", description: "Siswa belajar di rumah selama 3 hari kerja" },
    { schoolId: school1Id, minPoints: 100, sanctionName: "Dikembalikan kepada Orang Tua", actionRequired: "DIKELUARKAN", description: "Pemberhentian hak siswa belajar di sekolah secara permanen" },
  ]);
  console.log("Sanction Thresholds seeded.");

  // 15. Seed mock incidents
  // Incident 1: Late violation for Student 3 (Bambang)
  const [inc1] = await db.insert(disciplineIncidents).values({
    schoolId: school1Id,
    reporterUserId: uTeacher1.insertId, // Reported by Budi
    handlerTeacherId: teacher1Id, // Handled by Budi
    incidentDate: "2026-06-08",
    incidentTime: "07:15:00",
    location: "Gerbang Depan Sekolah",
    description: "Siswa datang terlambat 15 menit tanpa alasan yang jelas.",
    status: "VERIFIED",
  });
  
  await db.insert(disciplineIncidentStudents).values({
    incidentId: inc1.insertId,
    studentId: student3Id, // Bambang
    classId: class1Id,
    academicYearId,
    disciplineTypeId: typeVLate.insertId,
    pointSnapshot: 5,
    notes: "Terlambat karena macet di jalan, namun tidak membawa surat izin.",
  });

  await db.insert(disciplineIncidentAttachments).values({
    incidentId: inc1.insertId,
    fileUrl: "/uploads/discipline/late_evidence.jpg",
    fileType: "IMAGE",
    fileName: "late_evidence.jpg",
    fileSize: 102400,
  });

  // Incident 2: Olympiad Reward for Student 1 (Aditya)
  const [inc2] = await db.insert(disciplineIncidents).values({
    schoolId: school1Id,
    reporterUserId: uTeacher2.insertId, // Reported by Ani
    handlerTeacherId: teacher1Id, // Assigned to Budi for verification
    incidentDate: "2026-06-09",
    incidentTime: "10:00:00",
    location: "Aula Sekolah",
    description: "Siswa meraih medali emas pada olimpiade sains tingkat provinsi.",
    status: "PENDING",
  });

  await db.insert(disciplineIncidentStudents).values({
    incidentId: inc2.insertId,
    studentId: student1Id, // Aditya
    classId: class1Id,
    academicYearId,
    disciplineTypeId: typeROlymp.insertId,
    pointSnapshot: 30,
    notes: "Meraih medali emas olimpiade fisika.",
  });

  await db.insert(disciplineIncidentWitnesses).values({
    incidentId: inc2.insertId,
    userId: uTeacher3.insertId, // Joko as witness
    witnessName: "Joko Susilo, M.Si.",
    witnessRole: "TEACHER",
    notes: "Mendampingi siswa saat menerima medali.",
  });

  await db.insert(disciplineIncidentAttachments).values({
    incidentId: inc2.insertId,
    fileUrl: "/uploads/discipline/olympiad_certificate.pdf",
    fileType: "PDF",
    fileName: "olympiad_certificate.pdf",
    fileSize: 512000,
  });

  console.log("Mock Incidents seeded.");

  console.log("=================================================");
  console.log("RICH SEEDING COMPLETED SUCCESSFULLY!");
  console.log("=================================================");
  console.log(`School ID (Tenant)           : ${school1Id}`);
  console.log(`Academic Year ID             : ${academicYearId}`);
  console.log("\n--- Master Data IDs ---");
  console.log(`Teachers:`);
  console.log(`  - Budi Santoso (Guru MTK)  : ID ${teacher1Id}`);
  console.log(`  - Ani Wijaya (Guru Fisika) : ID ${teacher2Id}`);
  console.log(`  - Joko Susilo (Guru Bio)   : ID ${teacher3Id}`);
  console.log(`  - Ratna Sari (Guru Info)   : ID ${teacher4Id}`);
  console.log(`Classes:`);
  console.log(`  - X-MIPA-1                 : ID ${class1Id}`);
  console.log(`  - X-MIPA-2                 : ID ${class2Id}`);
  console.log(`  - XI-IPS-1                 : ID ${class3Id}`);
  console.log(`Students (X-MIPA-1):`);
  console.log(`  - Aditya Pratama           : ID ${student1Id}`);
  console.log(`  - Siti Aminah              : ID ${student2Id}`);
  console.log(`  - Bambang Pamungkas        : ID ${student3Id}`);
  console.log(`  - Dewi Lestari             : ID ${student4Id}`);
  console.log(`Subjects:`);
  console.log(`  - Matematika               : ID ${subject1Id}`);
  console.log(`  - Fisika                   : ID ${subject2Id}`);
  console.log(`  - Biologi                  : ID ${subject3Id}`);
  console.log(`  - Informatika              : ID ${subject4Id}`);
  console.log(`Schedules:`);
  console.log(`  - MTK X-MIPA-1 (Senin)     : ID ${schedule1Id}`);
  console.log(`  - FIS X-MIPA-1 (Senin)     : ID ${schedule2Id}`);
  console.log(`  - BIO X-MIPA-1 (Selasa)    : ID ${schedule3Id}`);
  console.log(`  - MTK X-MIPA-2 (Rabu)      : ID ${schedule4Id}`);
  console.log(`Pre-marked Attendances:`);
  console.log(`  - Absensi MTK (08 Juni)    : ID ${attendance1Id}`);
  console.log(`  - Absensi FIS (08 Juni)    : ID ${attendance2Id}`);
  console.log("=================================================");
  console.log("Logins (All Passwords: GuruHub!2026):");
  console.log(`- SchoolAdmin : admin@guruhub.sch.id`);
  console.log(`- Principal   : principal@guruhub.sch.id`);
  console.log(`- Teacher 1   : budi@guruhub.sch.id`);
  console.log(`- Teacher 2   : ani@guruhub.sch.id`);
  console.log(`- Student 1   : aditya@guruhub.sch.id`);
  console.log("=================================================");

  process.exit(0);
}

seed().catch((err) => {
  console.error("Rich Seeding failed:", err);
  process.exit(1);
});
