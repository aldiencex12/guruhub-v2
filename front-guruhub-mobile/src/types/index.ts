// =========================================================
// Core Types — GuruHub Frontend
// =========================================================

// ------------ Enums / Literal Types ---------------------

export type Role =
  | "SuperAdmin"
  | "SchoolAdmin"
  | "Principal"
  | "Teacher"
  | "HomeroomTeacher"
  | "BKTeacher"
  | "Counselor"
  | "Student"
  | "Polsis";

export type Gender = "L" | "P";

export type Status = "Aktif" | "Nonaktif";

export type Religion = "Islam" | "Kristen" | "Katolik" | "Hindu" | "Buddha" | "Khonghucu";

export type GradeLevel = "7" | "8" | "9" | "10" | "11" | "12";

export type SchoolLevel = "SMP" | "SMA";

export type SchoolStatus = "Negeri" | "Swasta";

export type DayOfWeek =
  | "Senin"
  | "Selasa"
  | "Rabu"
  | "Kamis"
  | "Jumat"
  | "Sabtu"
  | "Minggu";

export type Semester = "Ganjil" | "Genap";

export type ReportSemester = "GANJIL" | "GENAP";

export type AttendanceStatus = "PRESENT" | "SICK" | "PERMISSION" | "ABSENT";

export type AssessmentType =
  | "DAILY_TEST"
  | "ASSIGNMENT"
  | "PROJECT"
  | "PRACTICAL"
  | "MIDTERM"
  | "FINAL";

export type ReportCardStatus = "DRAFT" | "PUBLISHED";

export type GradeLetter = "A" | "B" | "C" | "D";

export type AchievementLevel =
  | "SCHOOL"
  | "DISTRICT"
  | "PROVINCE"
  | "NATIONAL"
  | "INTERNATIONAL";

export type Predicate = "A" | "B" | "C" | "D";

export type P5Predicate = "SB" | "B" | "C" | "PB";

// ------------ User / Auth --------------------------------

export interface CurrentUser {
  id: number;
  email: string;
  role: Role;
  schoolId: number;
  schoolName: string;
  name: string;
}

// ------------ Teacher ------------------------------------

export interface Teacher {
  id: number;
  nip?: string;
  name: string;
  phone?: string;
  gender: Gender;
  email?: string;
  status: Status;
  createdAt: string;
}

// ------------ Student ------------------------------------

export interface Student {
  id: number;
  nisn: string;
  nis?: string;
  name: string;
  gender: Gender;
  religion: Religion;
  status: Status;
  createdAt: string;
}

// ------------ Subject ------------------------------------

export interface Subject {
  id: number;
  code: string;
  name: string;
  gradeLevel: GradeLevel;
  description?: string;
  status: Status;
}

// ------------ Academic Year ------------------------------

export interface AcademicYear {
  id: number;
  name: string;
  semester: Semester;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

// ------------ Class --------------------------------------

export interface Class {
  id: number;
  name: string;
  gradeLevel: GradeLevel;
  academicYearId: number;
  academicYear?: AcademicYear;
  homeroomTeacherId?: number;
  homeroomTeacher?: Teacher;
  status: Status;
}

// ------------ Class Member --------------------------------

export interface ClassMember {
  id: number;
  classId: number;
  class?: Class;
  studentId: number;
  student?: Student;
  joinedAt: string;
}

// ------------ Schedule -----------------------------------

export interface Schedule {
  id: number;
  classId: number;
  class?: Class;
  subjectId: number;
  subject?: Subject;
  teacherId: number;
  teacher?: Teacher;
  academicYearId: number;
  academicYear?: AcademicYear;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
}

// ------------ Attendance ---------------------------------

export interface AttendanceDetail {
  id: number;
  studentId: number;
  studentName?: string;
  student?: Student;
  status: AttendanceStatus;
  notes?: string;
}

export interface Attendance {
  id: number;
  scheduleId: number;
  schedule?: Schedule;
  teacherId: number;
  teacher?: Teacher;
  attendanceDate: string;
  notes?: string;
  details: AttendanceDetail[];
  createdAt: string;
}

// ------------ Teaching Journal ---------------------------

export interface TeachingJournal {
  id: number;
  scheduleId: number;
  teacherId: number;
  schedule?: Schedule;
  attendanceId?: number;
  journalDate: string;
  topic: string;
  learningObjectives: string;
  teachingMethod: string;
  reflection?: string;
  notes?: string;
  createdAt: string;
}

// ------------ Assessment ---------------------------------

export interface AssessmentScore {
  id: number;
  studentId: number;
  studentName?: string;
  student?: Student;
  score: number;
  notes?: string;
}

export interface Assessment {
  id: number;
  classId: number;
  class?: Class;
  subjectId: number;
  subject?: Subject;
  teacherId: number;
  academicYearId: number;
  categoryId: number;
  category?: AssessmentCategory;
  title: string;
  assessmentType: AssessmentType;
  assessmentDate: string;
  maxScore: number;
  scores: AssessmentScore[];
  createdAt: string;
}

// ------------ Assessment Category -----------------------

export interface AssessmentCategory {
  id: number;
  name: string;
  weight: number;
  description?: string;
  isActive: boolean;
}

// ------------ Grade Engine --------------------------------

export interface GradeResult {
  studentId: number;
  student: Student;
  finalScore: number;
  gradeLetter: GradeLetter;
}

// ------------ Report Card --------------------------------

export interface ReportCardSubject {
  subjectId: number;
  subject: Subject;
  finalScore: number;
  gradeLetter: GradeLetter;
}

export interface ReportCard {
  id: number;
  studentId: number;
  student?: Student;
  classId: number;
  class?: Class;
  semester: ReportSemester;
  academicYearId: number;
  academicYear?: AcademicYear;
  status: ReportCardStatus;
  subjects: ReportCardSubject[];
  homeroomNotes?: string;
  publishedAt?: string;
  createdAt: string;
}

// ------------ Dashboard ----------------------------------

export interface DashboardSummary {
  totalTeachers: number;
  totalStudents: number;
  totalClasses: number;
  activeAcademicYear: AcademicYear | null;
  attendanceToday: {
    present: number;
    sick: number;
    permission: number;
    absent: number;
    total: number;
  };
  attendanceTrend: Array<{
    date: string;
    present: number;
    absent: number;
  }>;
  recentActivities: Array<{
    id: number;
    type: string;
    message: string;
    time: string;
  }>;
}

// ------------ API Response Pattern -----------------------

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface PaginatedResponse<T> {
  success: boolean;
  message: string;
  data: T[];
  total: number;
  page: number;
  limit: number;
}
