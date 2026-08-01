"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Users, GraduationCap, BookOpen, School,
  UserCheck, Calendar, ClipboardCheck, BookMarked, BarChart3,
  Award, FileText, Upload, ChevronDown, ChevronRight,
  GraduationCap as Logo, X, ShieldCheck, TrendingUp, ShieldAlert,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/store/ui.store";
import { useAuthStore } from "@/store/auth.store";
import type { Role } from "@/types";
import { useState } from "react";

interface MenuItem {
  label: string;
  href?: string;
  icon: React.ElementType;
  roles: Role[];
  children?: Omit<MenuItem, "children">[];
}

const menuItems: MenuItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    roles: ["SuperAdmin", "SchoolAdmin", "Principal", "Teacher", "HomeroomTeacher", "BKTeacher", "Counselor"],
  },
  {
    label: "Data Master",
    icon: Users,
    roles: ["SuperAdmin", "SchoolAdmin", "Principal"],
    children: [
      { label: "Guru", href: "/teachers", icon: GraduationCap, roles: ["SuperAdmin", "SchoolAdmin", "Principal"] },
      { label: "Siswa", href: "/students", icon: UserCheck, roles: ["SuperAdmin", "SchoolAdmin", "Principal"] },
      { label: "Mata Pelajaran", href: "/subjects", icon: BookOpen, roles: ["SuperAdmin", "SchoolAdmin", "Principal"] },
      { label: "Tahun Ajaran", href: "/academic-years", icon: Calendar, roles: ["SuperAdmin", "SchoolAdmin", "Principal"] },
      { label: "Profil & Kop Sekolah", href: "/school-settings", icon: School, roles: ["SuperAdmin", "SchoolAdmin", "Principal"] },
      { label: "Pengguna & Akses", href: "/users", icon: ShieldCheck, roles: ["SuperAdmin", "SchoolAdmin"] },
    ],
  },
  {
    label: "Kurikulum",
    icon: School,
    roles: ["SuperAdmin", "SchoolAdmin", "Principal", "Teacher", "HomeroomTeacher"],
    children: [
      { label: "Kelas", href: "/classes", icon: School, roles: ["SuperAdmin", "SchoolAdmin", "Principal", "Teacher", "HomeroomTeacher"] },
      { label: "Anggota Kelas", href: "/class-members", icon: Users, roles: ["SuperAdmin", "SchoolAdmin"] },
      { label: "Jadwal Pelajaran", href: "/schedules", icon: Calendar, roles: ["SuperAdmin", "SchoolAdmin", "Principal", "Teacher", "HomeroomTeacher"] },
      { label: "Absensi Siswa", href: "/attendance", icon: ClipboardCheck, roles: ["SuperAdmin", "SchoolAdmin", "Principal", "Teacher", "HomeroomTeacher", "BKTeacher"] },
      { label: "Jurnal Mengajar", href: "/teaching-journals", icon: BookMarked, roles: ["SuperAdmin", "SchoolAdmin", "Principal", "Teacher"] },
      { label: "Penilaian & Asesmen", href: "/assessments", icon: BarChart3, roles: ["SuperAdmin", "SchoolAdmin", "Principal", "Teacher"] },
      { label: "Kenaikan Kelas", href: "/promotions", icon: TrendingUp, roles: ["SuperAdmin", "SchoolAdmin"] },
    ],
  },
  {
    label: "Kesiswaan & BK",
    icon: GraduationCap,
    roles: ["SuperAdmin", "SchoolAdmin", "Principal", "Teacher", "HomeroomTeacher", "BKTeacher", "Counselor"],
    children: [
      { label: "Catatan Pelanggaran", href: "/discipline/incidents", icon: ShieldAlert, roles: ["SuperAdmin", "SchoolAdmin", "Principal", "BKTeacher", "Counselor", "Teacher", "HomeroomTeacher"] },
      { label: "Master Aturan Disiplin", href: "/discipline/categories", icon: BookOpen, roles: ["SuperAdmin", "SchoolAdmin", "Principal", "BKTeacher", "Counselor"] },
      { label: "Sanksi & SP", href: "/discipline/sanctions", icon: ShieldCheck, roles: ["SuperAdmin", "SchoolAdmin", "Principal", "BKTeacher", "Counselor"] },
      { label: "Analitik Karakter", href: "/discipline/analytics", icon: TrendingUp, roles: ["SuperAdmin", "SchoolAdmin", "Principal", "BKTeacher", "Counselor"] },
      { label: "Rekap Absensi (BK)", href: "/discipline/attendance-recap", icon: ClipboardCheck, roles: ["SuperAdmin", "SchoolAdmin", "Principal", "BKTeacher", "Counselor"] },
      { label: "Pleno Kenaikan", href: "/discipline/pleno", icon: GraduationCap, roles: ["SuperAdmin", "SchoolAdmin", "Principal", "HomeroomTeacher", "BKTeacher", "Counselor"] },
    ],
  },
  {
    label: "Laporan & Rapor",
    icon: FileText,
    roles: ["SuperAdmin", "SchoolAdmin", "Principal", "Teacher", "HomeroomTeacher"],
    children: [
      { label: "Kategori Nilai", href: "/assessment-categories", icon: Award, roles: ["SuperAdmin", "SchoolAdmin", "Principal", "Teacher", "HomeroomTeacher"] },
      { label: "Kalkulasi Nilai", href: "/grade-engine", icon: BarChart3, roles: ["SuperAdmin", "SchoolAdmin", "Principal", "Teacher"] },
      { label: "Rapor Siswa", href: "/report-cards", icon: FileText, roles: ["SuperAdmin", "SchoolAdmin", "Principal", "HomeroomTeacher"] },
      { label: "Raport Sisipan", href: "/report-cards/interim", icon: FileText, roles: ["SuperAdmin", "SchoolAdmin", "Principal", "Teacher", "HomeroomTeacher"] },
      { label: "Input Nilai Sisipan", href: "/assessments/interim", icon: BarChart3, roles: ["SuperAdmin", "SchoolAdmin", "Principal", "Teacher", "HomeroomTeacher"] },
    ],
  },
  {
    label: "Tools",
    icon: Upload,
    roles: ["SuperAdmin", "SchoolAdmin"],
    children: [
      { label: "Import Excel", href: "/import", icon: Upload, roles: ["SuperAdmin", "SchoolAdmin"] },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarOpen, setSidebarOpen } = useUIStore();
  const { currentUser } = useAuthStore();
  const [openGroups, setOpenGroups] = useState<string[]>(["Data Master", "Kurikulum", "Kesiswaan & BK", "Laporan & Rapor"]);

  const userRole = currentUser?.role ?? "Teacher";

  const toggleGroup = (label: string) => {
    setOpenGroups((prev) =>
      prev.includes(label) ? prev.filter((g) => g !== label) : [...prev, label]
    );
  };

  const filteredMenu = menuItems.filter((item) =>
    item.roles.some((r) => r === userRole)
  );

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 h-full flex flex-col",
          "w-64 bg-white dark:bg-gray-950 border-r border-gray-200 dark:border-gray-800",
          "transition-transform duration-300 ease-in-out",
          "lg:translate-x-0 lg:static lg:z-auto",
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 dark:border-gray-800 flex-shrink-0">
          <Link href="/dashboard" className="flex items-center gap-2.5 group">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 shadow-sm group-hover:bg-indigo-700 transition-colors">
              <Logo className="h-4 w-4 text-white" />
            </div>
            <div>
              <span className="text-base font-bold text-gray-900 dark:text-white">GuruHub</span>
              <span className="block text-[10px] text-gray-500 dark:text-gray-400 -mt-0.5">Platform Sekolah</span>
            </div>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1 rounded text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {filteredMenu.map((item) => {
            if (item.href) {
              // Single link item
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all",
                    isActive
                      ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-100 dark:hover:bg-gray-800"
                  )}
                >
                  <item.icon className={cn("h-4 w-4 flex-shrink-0", isActive ? "text-indigo-600 dark:text-indigo-400" : "")} />
                  {item.label}
                </Link>
              );
            }

            // Group item
            const filteredChildren = (item.children ?? []).filter((child) =>
              child.roles.some((r) => r === userRole)
            );
            if (filteredChildren.length === 0) return null;

            const isOpen = openGroups.includes(item.label);
            const hasActiveChild = filteredChildren.some((c) => c.href && pathname.startsWith(c.href));

            return (
              <div key={item.label}>
                <button
                  onClick={() => toggleGroup(item.label)}
                  className={cn(
                    "flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all",
                    hasActiveChild
                      ? "text-indigo-700 dark:text-indigo-300"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-100 dark:hover:bg-gray-800"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="h-4 w-4 flex-shrink-0" />
                    <span>{item.label}</span>
                  </div>
                  {isOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                </button>

                {isOpen && (
                  <div className="mt-1 ml-4 pl-3 border-l border-gray-200 dark:border-gray-700 space-y-0.5">
                    {filteredChildren.map((child) => {
                      const isActive = pathname === child.href;
                      return (
                        <Link
                          key={child.href}
                          href={child.href ?? "#"}
                          onClick={() => setSidebarOpen(false)}
                          className={cn(
                            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all",
                            isActive
                              ? "bg-indigo-50 text-indigo-700 font-medium dark:bg-indigo-950 dark:text-indigo-300"
                              : "text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-100 dark:hover:bg-gray-800"
                          )}
                        >
                          <child.icon className={cn("h-3.5 w-3.5 flex-shrink-0", isActive ? "text-indigo-600" : "")} />
                          {child.label}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* User info */}
        {currentUser && (
          <div className="border-t border-gray-200 dark:border-gray-800 p-4">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                {currentUser.email.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{currentUser.email}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{currentUser.role}</p>
              </div>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
