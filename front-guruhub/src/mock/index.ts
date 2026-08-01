import type {
  Teacher, Student, Subject, Class, AcademicYear,
  ClassMember, Schedule, Attendance, TeachingJournal,
  Assessment, AssessmentCategory, ReportCard, DashboardSummary,
} from "@/types";

// ====================== Academic Years =====================

export const mockAcademicYears: AcademicYear[] = [
  {
    id: 1,
    name: "2025/2026",
    semester: "Ganjil",
    startDate: "2025-07-14",
    endDate: "2025-12-20",
    isActive: true,
  },
  {
    id: 2,
    name: "2024/2025",
    semester: "Genap",
    startDate: "2025-01-06",
    endDate: "2025-06-20",
    isActive: false,
  },
];

// ====================== Teachers ===========================

export const mockTeachers: Teacher[] = [
  { id: 1, nip: "198501012010011001", name: "Dr. Budi Santoso", phone: "081234567890", gender: "L", email: "budi@guruhub.id", status: "Aktif", createdAt: "2025-07-01T08:00:00Z" },
  { id: 2, nip: "199002022015012001", name: "Siti Rahayu, M.Pd", phone: "082345678901", gender: "P", email: "siti@guruhub.id", status: "Aktif", createdAt: "2025-07-01T08:00:00Z" },
  { id: 3, nip: "198703031012011002", name: "Ahmad Fauzi", phone: "083456789012", gender: "L", email: "ahmad@guruhub.id", status: "Aktif", createdAt: "2025-07-01T08:00:00Z" },
  { id: 4, nip: "199104041018012002", name: "Dewi Lestari, S.Pd", phone: "084567890123", gender: "P", email: "dewi@guruhub.id", status: "Aktif", createdAt: "2025-07-01T08:00:00Z" },
  { id: 5, nip: "198805051014011003", name: "Rizky Pratama", phone: "085678901234", gender: "L", email: "rizky@guruhub.id", status: "Aktif", createdAt: "2025-07-01T08:00:00Z" },
  { id: 6, name: "Maya Indah, S.Kom", phone: "086789012345", gender: "P", email: "maya@guruhub.id", status: "Aktif", createdAt: "2025-07-02T08:00:00Z" },
  { id: 7, nip: "199206061020011004", name: "Hendra Wijaya", phone: "087890123456", gender: "L", email: "hendra@guruhub.id", status: "Nonaktif", createdAt: "2025-07-02T08:00:00Z" },
  { id: 8, name: "Rina Setiawati, M.Si", phone: "088901234567", gender: "P", email: "rina@guruhub.id", status: "Aktif", createdAt: "2025-07-03T08:00:00Z" },
];

// ====================== Students ===========================

export const mockStudents: Student[] = [
  { id: 1, nisn: "0012345601", nis: "001", name: "Andi Saputra", gender: "L", birthPlace: "Jakarta", birthDate: "2009-03-15", status: "Aktif", createdAt: "2025-07-01T08:00:00Z" },
  { id: 2, nisn: "0012345602", nis: "002", name: "Bunga Citra", gender: "P", birthPlace: "Bandung", birthDate: "2009-05-20", status: "Aktif", createdAt: "2025-07-01T08:00:00Z" },
  { id: 3, nisn: "0012345603", nis: "003", name: "Candra Putra", gender: "L", birthPlace: "Surabaya", birthDate: "2009-07-10", status: "Aktif", createdAt: "2025-07-01T08:00:00Z" },
  { id: 4, nisn: "0012345604", nis: "004", name: "Diana Putri", gender: "P", birthPlace: "Yogyakarta", birthDate: "2009-09-25", status: "Aktif", createdAt: "2025-07-01T08:00:00Z" },
  { id: 5, nisn: "0012345605", nis: "005", name: "Eko Prasetyo", gender: "L", birthPlace: "Semarang", birthDate: "2009-11-05", status: "Aktif", createdAt: "2025-07-01T08:00:00Z" },
  { id: 6, nisn: "0012345606", nis: "006", name: "Farah Aulia", gender: "P", birthPlace: "Medan", birthDate: "2009-01-30", status: "Aktif", createdAt: "2025-07-01T08:00:00Z" },
  { id: 7, nisn: "0012345607", nis: "007", name: "Gilang Ramadhan", gender: "L", birthPlace: "Jakarta", birthDate: "2009-04-18", status: "Aktif", createdAt: "2025-07-02T08:00:00Z" },
  { id: 8, nisn: "0012345608", nis: "008", name: "Hana Permata", gender: "P", birthPlace: "Bali", birthDate: "2009-06-22", status: "Aktif", createdAt: "2025-07-02T08:00:00Z" },
  { id: 9, nisn: "0012345609", nis: "009", name: "Irfan Hakim", gender: "L", birthPlace: "Makassar", birthDate: "2009-08-14", status: "Aktif", createdAt: "2025-07-02T08:00:00Z" },
  { id: 10, nisn: "0012345610", nis: "010", name: "Julia Amara", gender: "P", birthPlace: "Palembang", birthDate: "2009-10-01", status: "Nonaktif", createdAt: "2025-07-03T08:00:00Z" },
  { id: 11, nisn: "0012345611", nis: "011", name: "Kevin Santoso", gender: "L", birthPlace: "Jakarta", birthDate: "2009-12-08", status: "Aktif", createdAt: "2025-07-03T08:00:00Z" },
  { id: 12, nisn: "0012345612", nis: "012", name: "Lita Maharani", gender: "P", birthPlace: "Surabaya", birthDate: "2009-02-17", status: "Aktif", createdAt: "2025-07-03T08:00:00Z" },
];

// ====================== Subjects ===========================

export const mockSubjects: Subject[] = [
  { id: 1, code: "MTK-SMP7", name: "Matematika", gradeLevel: "7", status: "Aktif" },
  { id: 2, code: "BIN-SMP7", name: "Bahasa Indonesia", gradeLevel: "7", status: "Aktif" },
  { id: 3, code: "BIG-SMP7", name: "Bahasa Inggris", gradeLevel: "7", status: "Aktif" },
  { id: 4, code: "IPA-SMP7", name: "Ilmu Pengetahuan Alam", gradeLevel: "7", status: "Aktif" },
  { id: 5, code: "IPS-SMP7", name: "Ilmu Pengetahuan Sosial", gradeLevel: "7", status: "Aktif" },
  { id: 6, code: "PKN-SMP7", name: "Pendidikan Kewarganegaraan", gradeLevel: "7", description: "PPKn", status: "Aktif" },
  { id: 7, code: "SBD-SMP7", name: "Seni Budaya dan Prakarya", gradeLevel: "7", status: "Aktif" },
  { id: 8, code: "PJK-SMP7", name: "PJOK", gradeLevel: "7", status: "Aktif" },
  { id: 9, code: "MTK-SMP8", name: "Matematika", gradeLevel: "8", status: "Aktif" },
  { id: 10, code: "BIN-SMP8", name: "Bahasa Indonesia", gradeLevel: "8", status: "Aktif" },
];

// ====================== Classes ============================

export const mockClasses: Class[] = [
  { id: 1, name: "7A", gradeLevel: "7", academicYearId: 1, academicYear: mockAcademicYears[0], homeroomTeacherId: 1, homeroomTeacher: mockTeachers[0], status: "Aktif" },
  { id: 2, name: "7B", gradeLevel: "7", academicYearId: 1, academicYear: mockAcademicYears[0], homeroomTeacherId: 2, homeroomTeacher: mockTeachers[1], status: "Aktif" },
  { id: 3, name: "8A", gradeLevel: "8", academicYearId: 1, academicYear: mockAcademicYears[0], homeroomTeacherId: 3, homeroomTeacher: mockTeachers[2], status: "Aktif" },
  { id: 4, name: "8B", gradeLevel: "8", academicYearId: 1, academicYear: mockAcademicYears[0], homeroomTeacherId: 4, homeroomTeacher: mockTeachers[3], status: "Aktif" },
];

// ====================== Class Members ======================

export const mockClassMembers: ClassMember[] = [
  { id: 1, classId: 1, class: mockClasses[0], studentId: 1, student: mockStudents[0], joinedAt: "2025-07-14T08:00:00Z" },
  { id: 2, classId: 1, class: mockClasses[0], studentId: 2, student: mockStudents[1], joinedAt: "2025-07-14T08:00:00Z" },
  { id: 3, classId: 1, class: mockClasses[0], studentId: 3, student: mockStudents[2], joinedAt: "2025-07-14T08:00:00Z" },
  { id: 4, classId: 1, class: mockClasses[0], studentId: 4, student: mockStudents[3], joinedAt: "2025-07-14T08:00:00Z" },
  { id: 5, classId: 1, class: mockClasses[0], studentId: 5, student: mockStudents[4], joinedAt: "2025-07-14T08:00:00Z" },
  { id: 6, classId: 2, class: mockClasses[1], studentId: 6, student: mockStudents[5], joinedAt: "2025-07-14T08:00:00Z" },
  { id: 7, classId: 2, class: mockClasses[1], studentId: 7, student: mockStudents[6], joinedAt: "2025-07-14T08:00:00Z" },
  { id: 8, classId: 2, class: mockClasses[1], studentId: 8, student: mockStudents[7], joinedAt: "2025-07-14T08:00:00Z" },
  { id: 9, classId: 3, class: mockClasses[2], studentId: 9, student: mockStudents[8], joinedAt: "2025-07-14T08:00:00Z" },
  { id: 10, classId: 3, class: mockClasses[2], studentId: 10, student: mockStudents[9], joinedAt: "2025-07-14T08:00:00Z" },
];

// ====================== Schedules ==========================

export const mockSchedules: Schedule[] = [
  { id: 1, classId: 1, class: mockClasses[0], subjectId: 1, subject: mockSubjects[0], teacherId: 1, teacher: mockTeachers[0], academicYearId: 1, academicYear: mockAcademicYears[0], dayOfWeek: "Senin", startTime: "07:00", endTime: "08:30" },
  { id: 2, classId: 1, class: mockClasses[0], subjectId: 2, subject: mockSubjects[1], teacherId: 2, teacher: mockTeachers[1], academicYearId: 1, academicYear: mockAcademicYears[0], dayOfWeek: "Senin", startTime: "08:30", endTime: "10:00" },
  { id: 3, classId: 1, class: mockClasses[0], subjectId: 3, subject: mockSubjects[2], teacherId: 3, teacher: mockTeachers[2], academicYearId: 1, academicYear: mockAcademicYears[0], dayOfWeek: "Selasa", startTime: "07:00", endTime: "08:30" },
  { id: 4, classId: 1, class: mockClasses[0], subjectId: 4, subject: mockSubjects[3], teacherId: 4, teacher: mockTeachers[3], academicYearId: 1, academicYear: mockAcademicYears[0], dayOfWeek: "Rabu", startTime: "07:00", endTime: "08:30" },
  { id: 5, classId: 2, class: mockClasses[1], subjectId: 1, subject: mockSubjects[0], teacherId: 5, teacher: mockTeachers[4], academicYearId: 1, academicYear: mockAcademicYears[0], dayOfWeek: "Senin", startTime: "07:00", endTime: "08:30" },
  { id: 6, classId: 2, class: mockClasses[1], subjectId: 2, subject: mockSubjects[1], teacherId: 6, teacher: mockTeachers[5], academicYearId: 1, academicYear: mockAcademicYears[0], dayOfWeek: "Selasa", startTime: "07:00", endTime: "08:30" },
];

// ====================== Attendance =========================

export const mockAttendances: Attendance[] = [
  {
    id: 1,
    scheduleId: 1,
    schedule: mockSchedules[0],
    teacherId: 1,
    teacher: mockTeachers[0],
    attendanceDate: "2025-07-21",
    notes: "Pertemuan ke-1",
    createdAt: "2025-07-21T08:00:00Z",
    details: [
      { id: 1, studentId: 1, student: mockStudents[0], status: "PRESENT", notes: "" },
      { id: 2, studentId: 2, student: mockStudents[1], status: "PRESENT", notes: "" },
      { id: 3, studentId: 3, student: mockStudents[2], status: "SICK", notes: "Sakit demam" },
      { id: 4, studentId: 4, student: mockStudents[3], status: "PRESENT", notes: "" },
      { id: 5, studentId: 5, student: mockStudents[4], status: "ABSENT", notes: "" },
    ],
  },
  {
    id: 2,
    scheduleId: 2,
    schedule: mockSchedules[1],
    teacherId: 2,
    teacher: mockTeachers[1],
    attendanceDate: "2025-07-21",
    notes: "Pertemuan ke-1",
    createdAt: "2025-07-21T09:00:00Z",
    details: [
      { id: 6, studentId: 1, student: mockStudents[0], status: "PRESENT", notes: "" },
      { id: 7, studentId: 2, student: mockStudents[1], status: "PERMISSION", notes: "Keperluan keluarga" },
      { id: 8, studentId: 3, student: mockStudents[2], status: "SICK", notes: "" },
      { id: 9, studentId: 4, student: mockStudents[3], status: "PRESENT", notes: "" },
      { id: 10, studentId: 5, student: mockStudents[4], status: "PRESENT", notes: "" },
    ],
  },
];

// ====================== Teaching Journals ==================

export const mockJournals: TeachingJournal[] = [
  {
    id: 1,
    teacherId: 1,
    scheduleId: 1,
    schedule: mockSchedules[0],
    attendanceId: 1,
    journalDate: "2025-07-21",
    topic: "Bilangan Bulat dan Pecahan",
    learningObjectives: "Siswa dapat memahami konsep bilangan bulat dan pecahan",
    teachingMethod: "Ceramah dan Diskusi",
    reflection: "Siswa antusias mengikuti pelajaran",
    notes: "",
    createdAt: "2025-07-21T08:00:00Z",
  },
  {
    id: 2,
    teacherId: 1,
    scheduleId: 2,
    schedule: mockSchedules[1],
    journalDate: "2025-07-21",
    topic: "Teks Deskripsi",
    learningObjectives: "Siswa dapat membuat teks deskripsi yang baik dan benar",
    teachingMethod: "Praktik Menulis",
    reflection: "Masih banyak siswa yang kesulitan dalam struktur kalimat",
    notes: "Perlu remedial untuk beberapa siswa",
    createdAt: "2025-07-21T09:00:00Z",
  },
];

// ====================== Assessment Categories ==============

export const mockCategories: AssessmentCategory[] = [
  { id: 1, name: "Ulangan Harian", weight: 30, description: "Penilaian harian", isActive: true },
  { id: 2, name: "Tugas", weight: 20, description: "Tugas rumah dan proyek", isActive: true },
  { id: 3, name: "UTS", weight: 25, description: "Ujian Tengah Semester", isActive: true },
  { id: 4, name: "UAS", weight: 25, description: "Ujian Akhir Semester", isActive: true },
];

// ====================== Assessments ========================

export const mockAssessments: Assessment[] = [
  {
    id: 1,
    teacherId: 1,
    academicYearId: 1,
    classId: 1,
    class: mockClasses[0],
    subjectId: 1,
    subject: mockSubjects[0],
    categoryId: 1,
    category: mockCategories[0],
    title: "Ulangan Harian 1 - Bilangan Bulat",
    assessmentType: "DAILY_TEST",
    assessmentDate: "2025-07-28",
    maxScore: 100,
    createdAt: "2025-07-28T08:00:00Z",
    scores: [
      { id: 1, studentId: 1, student: mockStudents[0], score: 85, notes: "" },
      { id: 2, studentId: 2, student: mockStudents[1], score: 92, notes: "" },
      { id: 3, studentId: 3, student: mockStudents[2], score: 78, notes: "" },
      { id: 4, studentId: 4, student: mockStudents[3], score: 88, notes: "" },
      { id: 5, studentId: 5, student: mockStudents[4], score: 65, notes: "Perlu bimbingan" },
    ],
  },
  {
    id: 2,
    teacherId: 1,
    academicYearId: 1,
    classId: 1,
    class: mockClasses[0],
    subjectId: 2,
    subject: mockSubjects[1],
    categoryId: 2,
    category: mockCategories[1],
    title: "Tugas 1 - Membuat Teks Deskripsi",
    assessmentType: "ASSIGNMENT",
    assessmentDate: "2025-07-25",
    maxScore: 100,
    createdAt: "2025-07-25T08:00:00Z",
    scores: [
      { id: 6, studentId: 1, student: mockStudents[0], score: 90 },
      { id: 7, studentId: 2, student: mockStudents[1], score: 85 },
      { id: 8, studentId: 3, student: mockStudents[2], score: 80 },
      { id: 9, studentId: 4, student: mockStudents[3], score: 75 },
      { id: 10, studentId: 5, student: mockStudents[4], score: 70 },
    ],
  },
];

// ====================== Report Cards =======================

export const mockReportCards: ReportCard[] = [
  {
    id: 1,
    studentId: 1,
    student: mockStudents[0],
    classId: 1,
    class: mockClasses[0],
    semester: "GANJIL",
    academicYearId: 1,
    academicYear: mockAcademicYears[0],
    status: "DRAFT",
    homeroomNotes: "Andi adalah siswa yang rajin dan disiplin. Perlu ditingkatkan kemampuan matematika.",
    createdAt: "2025-12-01T08:00:00Z",
    subjects: [
      { subjectId: 1, subject: mockSubjects[0], finalScore: 85, gradeLetter: "B" },
      { subjectId: 2, subject: mockSubjects[1], finalScore: 90, gradeLetter: "A" },
      { subjectId: 3, subject: mockSubjects[2], finalScore: 78, gradeLetter: "C" },
    ],
  },
  {
    id: 2,
    studentId: 2,
    student: mockStudents[1],
    classId: 1,
    class: mockClasses[0],
    semester: "GANJIL",
    academicYearId: 1,
    academicYear: mockAcademicYears[0],
    status: "PUBLISHED",
    publishedAt: "2025-12-20T08:00:00Z",
    homeroomNotes: "Bunga adalah siswa berprestasi. Pertahankan semangat belajarnya.",
    createdAt: "2025-12-01T08:00:00Z",
    subjects: [
      { subjectId: 1, subject: mockSubjects[0], finalScore: 92, gradeLetter: "A" },
      { subjectId: 2, subject: mockSubjects[1], finalScore: 88, gradeLetter: "B" },
      { subjectId: 3, subject: mockSubjects[2], finalScore: 95, gradeLetter: "A" },
    ],
  },
];

// ====================== Dashboard ==========================

export const mockDashboard: DashboardSummary = {
  totalTeachers: mockTeachers.filter(t => t.status === "Aktif").length,
  totalStudents: mockStudents.filter(s => s.status === "Aktif").length,
  totalClasses: mockClasses.filter(c => c.status === "Aktif").length,
  activeAcademicYear: mockAcademicYears[0],
  attendanceToday: {
    present: 38,
    sick: 3,
    permission: 2,
    absent: 1,
    total: 44,
  },
  attendanceTrend: [
    { date: "Sen", present: 40, absent: 4 },
    { date: "Sel", present: 42, absent: 2 },
    { date: "Rab", present: 39, absent: 5 },
    { date: "Kam", present: 43, absent: 1 },
    { date: "Jum", present: 41, absent: 3 },
    { date: "Sab", present: 38, absent: 6 },
    { date: "Hari ini", present: 38, absent: 6 },
  ],
  recentActivities: [
    { id: 1, type: "attendance", message: "Dr. Budi Santoso melakukan absensi kelas 7A", time: "10 menit lalu" },
    { id: 2, type: "assessment", message: "Ulangan Harian Matematika kelas 7A ditambahkan", time: "30 menit lalu" },
    { id: 3, type: "teacher", message: "Guru baru Maya Indah ditambahkan ke sistem", time: "1 jam lalu" },
    { id: 4, type: "report", message: "Rapor Semester Ganjil 2025/2026 mulai disusun", time: "2 jam lalu" },
    { id: 5, type: "student", message: "12 siswa baru berhasil diimport dari Excel", time: "3 jam lalu" },
  ],
};
