import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { GradeLetter, Role } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format date to Indonesian locale
export function formatDate(dateStr: string): string {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

// Get today's date formatted as YYYY-MM-DD in local timezone
export function getTodayDateInput(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// Get today's month formatted as YYYY-MM in local timezone
export function getTodayMonthInput(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

// Format time HH:MM
export function formatTime(timeStr: string): string {
  if (!timeStr) return "-";
  return timeStr.substring(0, 5).replace(":", ".");
}

// Grade letter from score
export function getGradeLetter(score: number): GradeLetter {
  if (score >= 90) return "A";
  if (score >= 80) return "B";
  if (score >= 70) return "C";
  return "D";
}

// Grade letter color
export function getGradeColor(letter: GradeLetter): string {
  switch (letter) {
    case "A": return "text-emerald-600 bg-emerald-50";
    case "B": return "text-blue-600 bg-blue-50";
    case "C": return "text-amber-600 bg-amber-50";
    case "D": return "text-red-600 bg-red-50";
  }
}

// Attendance status color
export function getAttendanceColor(status: string): string {
  switch (status) {
    case "PRESENT": return "text-emerald-700 bg-emerald-50 border-emerald-200";
    case "SICK": return "text-amber-700 bg-amber-50 border-amber-200";
    case "PERMISSION": return "text-blue-700 bg-blue-50 border-blue-200";
    case "ABSENT": return "text-red-700 bg-red-50 border-red-200";
    default: return "text-gray-700 bg-gray-50 border-gray-200";
  }
}

// Attendance label
export function getAttendanceLabel(status: string): string {
  switch (status) {
    case "PRESENT": return "Hadir";
    case "SICK": return "Sakit";
    case "PERMISSION": return "Izin";
    case "ABSENT": return "Alfa";
    default: return status;
  }
}

// Assessment type label
export function getAssessmentTypeLabel(type: string): string {
  const map: Record<string, string> = {
    DAILY_TEST: "Ulangan Harian",
    ASSIGNMENT: "Tugas",
    PROJECT: "Proyek",
    PRACTICAL: "Praktik",
    MIDTERM: "UTS / PTS",
    FINAL: "UAS / PAS",
  };
  return map[type] ?? type;
}

// Report card status label
export function getReportStatusLabel(status: string): string {
  return status === "PUBLISHED" ? "Diterbitkan" : "Draft";
}

// Gender label
export function getGenderLabel(gender: string): string {
  return gender === "L" ? "Laki-laki" : "Perempuan";
}

// Day of week label
export const DAY_ORDER: Record<string, number> = {
  Senin: 1, Selasa: 2, Rabu: 3, Kamis: 4, Jumat: 5, Sabtu: 6, Minggu: 7,
};

// RBAC helpers
export const ROLE_LABELS: Record<Role, string> = {
  SuperAdmin: "Super Admin",
  SchoolAdmin: "Admin Sekolah",
  Principal: "Kepala Sekolah",
  Teacher: "Guru",
  HomeroomTeacher: "Wali Kelas",
  BKTeacher: "Guru BK",
  Counselor: "Konselor BK",
  Student: "Siswa",
  Polsis: "Siswa + POLSIS",
};

export function hasAccess(
  role: Role,
  allowedRoles: Role[]
): boolean {
  return allowedRoles.includes(role);
}

// Truncate text
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength) + "...";
}

// Generate initials from name
export function getInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}
