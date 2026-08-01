"use client";

import { usePathname, useRouter } from "next/navigation";
import { Menu, Bell, LogOut, Sun, Moon, Monitor } from "lucide-react";
import { useUIStore } from "@/store/ui.store";
import { useAuthStore } from "@/store/auth.store";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { ROLE_LABELS } from "@/lib/utils";

// Breadcrumb helper
function getBreadcrumbs(pathname: string) {
  const routeMap: Record<string, string> = {
    "/dashboard": "Dashboard",
    "/teachers": "Guru",
    "/students": "Siswa",
    "/subjects": "Mata Pelajaran",
    "/classes": "Kelas",
    "/class-members": "Anggota Kelas",
    "/schedules": "Jadwal",
    "/attendance": "Absensi",
    "/teaching-journals": "Jurnal Mengajar",
    "/assessments": "Penilaian",
    "/assessment-categories": "Kategori Penilaian",
    "/grade-engine": "Kalkulasi Nilai",
    "/report-cards": "Rapor",
    "/import": "Import Excel",
  };
  return [{ label: "GuruHub", href: "/" }, { label: routeMap[pathname] ?? "Halaman", href: pathname }];
}

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { toggleSidebar } = useUIStore();
  const { currentUser, logout } = useAuthStore();
  const { theme, setTheme } = useTheme();

  const breadcrumbs = getBreadcrumbs(pathname);

  const handleLogout = () => {
    logout();
    toast.success("Berhasil logout");
    router.push("/login");
  };

  const cycleTheme = () => {
    const themes = ["light", "dark", "system"] as const;
    const current = themes.indexOf((theme as typeof themes[number]) ?? "system");
    setTheme(themes[(current + 1) % themes.length]);
  };

  const ThemeIcon = theme === "dark" ? Moon : theme === "light" ? Sun : Monitor;

  return (
    <header className="sticky top-0 z-30 h-16 flex items-center gap-4 px-4 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
      {/* Sidebar toggle */}
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleSidebar}
        className="flex-shrink-0"
        id="sidebar-toggle"
      >
        <Menu className="h-4 w-4" />
      </Button>

      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm flex-1 min-w-0">
        {breadcrumbs.map((crumb, i) => (
          <span key={crumb.href} className="flex items-center gap-1.5">
            {i > 0 && <span className="text-gray-400">/</span>}
            <span className={i === breadcrumbs.length - 1 ? "font-medium text-gray-900 dark:text-gray-100" : "text-gray-500 dark:text-gray-400"}>
              {crumb.label}
            </span>
          </span>
        ))}
      </nav>

      {/* Right actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Theme toggle */}
        <Button variant="ghost" size="icon" onClick={cycleTheme} title="Toggle theme">
          <ThemeIcon className="h-4 w-4" />
        </Button>

        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-4 w-4" />
          <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-indigo-600" />
        </Button>

        {/* User badge */}
        {currentUser && (
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800">
            <div className="h-6 w-6 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
              {currentUser.email.charAt(0).toUpperCase()}
            </div>
            <div className="text-right">
              <p className="text-xs font-medium text-gray-900 dark:text-gray-100 leading-none">{currentUser.email}</p>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-none mt-0.5">
                {ROLE_LABELS[currentUser.role]}
              </p>
            </div>
          </div>
        )}

        {/* Logout */}
        <Button variant="ghost" size="icon" onClick={handleLogout} title="Logout">
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}
