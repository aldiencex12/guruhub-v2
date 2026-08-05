"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, CalendarDays, BarChart3, BookOpen, ShieldAlert, Laptop } from "lucide-react";
import { useAuthStore } from "@/store/auth.store";

type NavItem = {
  label: string;
  href: string;
  icon: React.ElementType;
  external?: boolean;
};

const teacherNavItems: NavItem[] = [
  { label: "Beranda", href: "/dashboard", icon: Home },
  { label: "Absensi", href: "/attendance", icon: CalendarDays },
  { label: "Nilai", href: "/assessments", icon: BarChart3 },
  { label: "Jurnal", href: "/teaching-journals", icon: BookOpen },
];

const bkNavItems: NavItem[] = [
  { label: "Beranda", href: "/dashboard", icon: Home },
  { label: "Absensi", href: "/attendance", icon: CalendarDays },
  { label: "Kedisiplinan", href: "/discipline", icon: ShieldAlert },
];

const polsisNavItems: NavItem[] = [
  { label: "Catat Polsis", href: "/discipline", icon: ShieldAlert },
];

const studentNavItems: NavItem[] = [
  { label: "Beranda", href: "/dashboard", icon: Home },
  { label: "Ujian CBT", href: "/cbt", icon: Laptop },
];

export default function BottomNavigation() {
  const pathname = usePathname();
  const { currentUser } = useAuthStore();

  const isBK = currentUser?.role === "BKTeacher";
  const isPolsis = currentUser?.role === "Polsis";
  const isStudent = currentUser?.role === "Student";
  const navItems = isPolsis ? polsisNavItems : isBK ? bkNavItems : isStudent ? studentNavItems : teacherNavItems;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-t border-gray-200 dark:border-gray-800 pb-safe-bottom">
      <div className="max-w-md mx-auto flex justify-around items-center h-16 px-6">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");

          if (item.external) {
            return (
              <a
                key={item.href}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center justify-center flex-1 h-full text-indigo-600 dark:text-indigo-400 hover:scale-105 transition-all duration-200"
              >
                <div className="relative flex items-center justify-center">
                  <Icon className="h-5.5 w-5.5" />
                </div>
                <span className="text-[10px] font-bold mt-1">{item.label}</span>
              </a>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center flex-1 h-full transition-all duration-200 ${
                isActive
                  ? "text-indigo-600 dark:text-indigo-400 scale-105"
                  : "text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
              }`}
            >
              <div className="relative flex items-center justify-center">
                <Icon className="h-5.5 w-5.5" />
                {isActive && (
                  <span className="absolute -bottom-1 h-1 w-1 bg-indigo-600 dark:bg-indigo-400 rounded-full" />
                )}
              </div>
              <span className="text-[10px] font-medium mt-1">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
