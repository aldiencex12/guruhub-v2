"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth.store";
import { dashboardService } from "@/services/dashboard";
import { schedulesService } from "@/services/schedules";
import { classesService } from "@/services/classes";
import { subjectsService } from "@/services/subjects";
import { teachersService } from "@/services/teachers";
import { disciplineService } from "@/services/discipline";
import type { Schedule, DashboardSummary } from "@/types";
import { ClipboardCheck, BookOpen, Clock, Calendar, CheckCircle2, AlertCircle, RefreshCw, Users, Layers, ShieldAlert, FileWarning, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { formatTime } from "@/lib/utils";

export default function MobileDashboard() {
  const router = useRouter();
  const { currentUser } = useAuthStore();
  const isBK = currentUser?.role === "BKTeacher";
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [pendingTasks, setPendingTasks] = useState<any[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [greetingName, setGreetingName] = useState("Guru");
  const [bkIncidents, setBkIncidents] = useState<any[]>([]);
  const [bkSanctions, setBkSanctions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentUser?.role === "Polsis") {
      router.replace("/discipline");
    }
  }, [currentUser, router]);

  // Time and Day handling
  const daysMap: Record<number, string> = { 0: "Minggu", 1: "Senin", 2: "Selasa", 3: "Rabu", 4: "Kamis", 5: "Jumat", 6: "Sabtu" };
  const todayDate = new Date();
  const currentDay = daysMap[todayDate.getDay()];
  const currentDateStr = todayDate.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      if (isBK) {
        // BK Dashboard: load discipline data
        const [teachersData, incRes, sanRes] = await Promise.all([
          teachersService.getAll().catch(() => []),
          disciplineService.getIncidents({ limit: 100 }).catch(() => ({ data: [] })),
          disciplineService.getSanctionLogs({ limit: 100 }).catch(() => ({ data: [] })),
        ]);
        const incidents = Array.isArray(incRes) ? incRes : (incRes as any)?.data ?? [];
        const sanctions = Array.isArray(sanRes) ? sanRes : (sanRes as any)?.data ?? [];
        setBkIncidents(incidents);
        setBkSanctions(sanctions);

        const matchedTeacher = teachersData.find((t: any) => {
          if (!t.email || !currentUser?.email) return false;
          const cleanT = t.email.toLowerCase().replace(/[^a-z0-9]/g, "");
          const cleanU = currentUser.email.toLowerCase().replace(/[^a-z0-9]/g, "");
          return cleanT === cleanU || cleanT.includes(cleanU) || cleanU.includes(cleanT);
        });
        setGreetingName(matchedTeacher?.name ?? (currentUser?.email?.split("@")[0] ?? "BK"));
      } else {
        // Teacher Dashboard
        const [sumData, tasksData, schedsData, classesData, subjectsData, teachersData] = await Promise.all([
          dashboardService.getSummary().catch(() => null),
          dashboardService.getPendingTasks().catch(() => []),
          schedulesService.getAll().catch(() => []),
          classesService.getAll().catch(() => []),
          subjectsService.getAll().catch(() => []),
          teachersService.getAll().catch(() => []),
        ]);

        const enriched = schedsData.map((s) => ({
          ...s,
          class: classesData.find((c) => c.id === s.classId),
          subject: subjectsData.find((sub) => sub.id === s.subjectId),
          teacher: teachersData.find((t) => t.id === s.teacherId),
        }));

        const todaySchedules = enriched.filter(
          (s) => s.dayOfWeek.toLowerCase() === currentDay.toLowerCase()
        );

        if (sumData) setSummary(sumData);
        setPendingTasks(tasksData);
        setSchedules(todaySchedules.sort((a, b) => a.startTime.localeCompare(b.startTime)));

        const matchedTeacher = teachersData.find((t) => {
          if (!t.email || !currentUser?.email) return false;
          const cleanT = t.email.toLowerCase().replace(/[^a-z0-9]/g, "");
          const cleanU = currentUser.email.toLowerCase().replace(/[^a-z0-9]/g, "");
          return cleanT === cleanU || cleanT.includes(cleanU) || cleanU.includes(cleanT);
        });
        if (matchedTeacher) {
          setGreetingName(matchedTeacher.name);
        } else if (currentUser?.email) {
          const prefix = currentUser.email.split("@")[0];
          const cleanPrefix = prefix.replace(/[\.\-_]/g, " ").split(" ")
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
            .join(" ");
          setGreetingName(cleanPrefix);
        } else {
          setGreetingName("Guru");
        }
      }
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
        <span className="text-xs text-gray-500 dark:text-gray-400">Memuat data...</span>
      </div>
    );
  }

  const studentCount = summary?.totalStudents || 0;
  const classCount = summary?.totalClasses || 0;

  // ==================== BK DASHBOARD ====================
  if (isBK) {
    const pendingIncidents = bkIncidents.filter((i) => i.status === "PENDING");
    const verifiedIncidents = bkIncidents.filter((i) => i.status === "VERIFIED");
    const activeSanctions = bkSanctions.filter((s) => s.status === "PENDING");

    return (
      <div className="space-y-6 pb-6">
        {/* BK Welcome Card */}
        <div className="bg-gradient-to-tr from-[#be123c] via-[#e11d48] to-[#f43f5e] rounded-2xl p-5 text-white shadow-xl relative overflow-hidden">
          <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none">
            <ShieldAlert className="h-44 w-44 transform translate-x-12 translate-y-12" />
          </div>
          <span className="inline-block text-[9px] uppercase font-bold tracking-wider bg-white/15 backdrop-blur-md border border-white/10 px-2.5 py-1 rounded-full">
            Guru BK — Bimbingan Konseling
          </span>
          <h2 className="text-xl font-black mt-3 tracking-tight">Halo, {greetingName}!</h2>
          <p className="text-xs text-rose-100 mt-1 leading-relaxed">
            Selamat bertugas. Hari ini adalah <span className="font-semibold text-white">{currentDateStr}</span>.
          </p>
          <div className="grid grid-cols-3 gap-2 mt-5 pt-4 border-t border-white/10">
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-2 text-center border border-white/10">
              <div className="text-lg font-black">{pendingIncidents.length}</div>
              <div className="text-[8px] text-rose-200 font-bold uppercase">Pending</div>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-2 text-center border border-white/10">
              <div className="text-lg font-black">{verifiedIncidents.length}</div>
              <div className="text-[8px] text-rose-200 font-bold uppercase">Terverifikasi</div>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-2 text-center border border-white/10">
              <div className="text-lg font-black">{activeSanctions.length}</div>
              <div className="text-[8px] text-rose-200 font-bold uppercase">Sanksi Aktif</div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          <Link href="/discipline" className="flex flex-col items-center gap-2 p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm hover:border-rose-200 dark:hover:border-rose-900 transition-all">
            <div className="p-3 bg-rose-50 dark:bg-rose-950/20 rounded-xl">
              <AlertTriangle className="h-6 w-6 text-rose-500" />
            </div>
            <span className="text-xs font-bold text-gray-700 dark:text-gray-300">Kelola Insiden</span>
          </Link>
          <Link href="/attendance" className="flex flex-col items-center gap-2 p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm hover:border-indigo-200 dark:hover:border-indigo-900 transition-all">
            <div className="p-3 bg-indigo-50 dark:bg-indigo-950/20 rounded-xl">
              <ClipboardCheck className="h-6 w-6 text-indigo-500" />
            </div>
            <span className="text-xs font-bold text-gray-700 dark:text-gray-300">Rekap Absensi</span>
          </Link>
        </div>

        {/* Pending Incidents */}
        <div className="space-y-3">
          <div className="flex justify-between items-center px-1">
            <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Insiden Menunggu Verifikasi</h3>
            <button onClick={fetchData} className="p-1.5 text-gray-400 hover:text-rose-600 rounded-lg">
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
          </div>
          {pendingIncidents.length === 0 ? (
            <div className="flex items-center gap-3 bg-emerald-50/50 dark:bg-emerald-950/10 border border-emerald-100 dark:border-emerald-900/40 p-4 rounded-xl">
              <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
              <div>
                <h4 className="text-xs font-bold text-emerald-800 dark:text-emerald-400">Tidak Ada Insiden Pending</h4>
                <p className="text-[10px] text-emerald-600 dark:text-emerald-500 mt-0.5">Semua insiden sudah ditangani.</p>
              </div>
            </div>
          ) : (
            pendingIncidents.slice(0, 3).map((inc) => (
              <div key={inc.id} className="flex items-start justify-between bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-4 rounded-xl shadow-sm gap-3">
                <div className="flex gap-3">
                  <div className="p-2.5 rounded-xl bg-amber-50 text-amber-500 dark:bg-amber-950/20 dark:text-amber-400 shrink-0">
                    <AlertCircle className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-gray-900 dark:text-white">{inc.studentName || "Siswa"}</h4>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">{inc.disciplineTypeName || "Pelanggaran"}</p>
                    <span className="inline-block text-[9px] px-1.5 py-0.5 rounded mt-1 font-medium text-amber-600 bg-amber-50 dark:bg-amber-950/30">
                      {inc.points || 0} poin
                    </span>
                  </div>
                </div>
                <Link href="/discipline" className="text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/50 px-3 py-2 rounded-xl transition-all active:scale-95 shrink-0">
                  Tinjau
                </Link>
              </div>
            ))
          )}
          {pendingIncidents.length > 3 && (
            <Link href="/discipline" className="block text-center text-xs font-bold text-rose-600 dark:text-rose-400 py-2">
              Lihat {pendingIncidents.length - 3} insiden lainnya →
            </Link>
          )}
        </div>
      </div>
    );
  }
  // ==================== END BK DASHBOARD ====================

  return (
    <div className="space-y-6 pb-6">
      {/* Welcome Card */}
      <div className="bg-gradient-to-tr from-[#1d4ed8] via-[#2563eb] to-[#3b82f6] rounded-2xl p-5 text-white shadow-xl relative overflow-hidden">
        {/* Background graphic elements */}
        <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none">
          <BookOpen className="h-44 w-44 transform translate-x-12 translate-y-12" />
        </div>
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-xl pointer-events-none" />

        <span className="inline-block text-[9px] uppercase font-bold tracking-wider bg-white/15 backdrop-blur-md border border-white/10 px-2.5 py-1 rounded-full">
          Semester {summary?.activeAcademicYear?.semester || "1"} • TA {summary?.activeAcademicYear?.name || "2025/2026"}
        </span>
        <h2 className="text-xl font-black mt-3 tracking-tight">Halo, {greetingName}!</h2>
        <p className="text-xs text-indigo-100 mt-1 leading-relaxed">
          Selamat mengajar. Hari ini adalah <span className="font-semibold text-white">{currentDateStr}</span>.
        </p>

        {/* Premium stats row */}
        <div className="grid grid-cols-2 gap-3 mt-6 pt-5 border-t border-white/10">
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-white/10 shrink-0">
              <Users className="h-4 w-4 text-white" />
            </div>
            <div>
              <div className="text-base font-black leading-none">{studentCount}</div>
              <div className="text-[9px] text-indigo-200 mt-1 font-semibold uppercase tracking-wider">Siswa</div>
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-white/10 shrink-0">
              <Layers className="h-4 w-4 text-white" />
            </div>
            <div>
              <div className="text-base font-black leading-none">{classCount}</div>
              <div className="text-[9px] text-indigo-200 mt-1 font-semibold uppercase tracking-wider">Kelas</div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Refresh */}
      <div className="flex justify-between items-center px-1">
        <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Kebutuhan Tindakan</h3>
        <button onClick={fetchData} className="p-1.5 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
          <RefreshCw className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Pending Tasks Section */}
      <div className="space-y-3">
        {pendingTasks.length === 0 ? (
          <div className="flex items-center gap-3 bg-emerald-50/50 dark:bg-emerald-950/10 border border-emerald-100 dark:border-emerald-900/40 p-4 rounded-xl">
            <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
            <div>
              <h4 className="text-xs font-bold text-emerald-800 dark:text-emerald-400">Semua Tugas Selesai</h4>
              <p className="text-[10px] text-emerald-600 dark:text-emerald-500 mt-0.5 leading-relaxed">
                Hebat! Tidak ada tugas absensi atau jurnal tertunda hari ini.
              </p>
            </div>
          </div>
        ) : (
          pendingTasks.map((task, idx) => (
            <div
              key={idx}
              className="flex items-start justify-between bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 p-4 rounded-xl shadow-sm gap-3 hover:border-indigo-150 dark:hover:border-indigo-950 transition-all duration-300"
            >
              <div className="flex gap-3">
                <div className={`p-2.5 rounded-xl shrink-0 mt-0.5 ${
                  task.type.toLowerCase() === "attendance" 
                    ? "bg-rose-50 text-rose-500 dark:bg-rose-950/20 dark:text-rose-400" 
                    : "bg-amber-50 text-amber-500 dark:bg-amber-950/20 dark:text-amber-400"
                }`}>
                  <AlertCircle className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-900 dark:text-white">
                    {task.type.toLowerCase() === "attendance" ? "Absensi Belum Diisi" : "Jurnal Belum Diisi"}
                  </h4>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">
                    Kelas {task.className} • Mapel {task.subjectName}
                  </p>
                  <span className={`inline-block text-[9px] px-1.5 py-0.5 rounded mt-2 font-medium ${
                    task.type.toLowerCase() === "attendance"
                      ? "text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30"
                      : "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30"
                  }`}>
                    Jam: {task.time}
                  </span>
                </div>
              </div>

              <Link
                href={task.type.toLowerCase() === "attendance" ? `/attendance?scheduleId=${task.scheduleId}` : `/teaching-journals?scheduleId=${task.scheduleId}`}
                className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/50 dark:hover:bg-indigo-950 px-3.5 py-2 rounded-xl transition-all active:scale-95 border border-indigo-100/50 dark:border-indigo-900/30 shrink-0"
              >
                Isi
              </Link>
            </div>
          ))
        )}
      </div>

      {/* Today's Schedule Timeline */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-1">
          Jadwal Mengajar Hari Ini ({currentDay})
        </h3>

        {schedules.length === 0 ? (
          <div className="bg-gray-50 dark:bg-gray-900 border border-dashed border-gray-200 dark:border-gray-800 rounded-xl p-8 text-center text-xs text-gray-400 dark:text-gray-500">
            Tidak ada jadwal mengajar terdaftar untuk hari {currentDay}.
          </div>
        ) : (
          <div className="relative pl-6 border-l border-indigo-100 dark:border-indigo-950 space-y-4 ml-3">
            {schedules.map((schedule) => (
              <div key={schedule.id} className="relative">
                {/* Glowing Bullet */}
                <div className="absolute -left-[31px] top-1.5 h-4.5 w-4.5 rounded-full bg-white dark:bg-gray-950 border-[3.5px] border-indigo-600 dark:border-indigo-400 flex items-center justify-center shadow-sm">
                  <div className="h-1.5 w-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400 animate-pulse" />
                </div>

                <div className="bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-xl p-4 shadow-sm space-y-4 hover:border-indigo-150 dark:hover:border-indigo-950 transition-all duration-300">
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <h4 className="text-xs font-bold text-gray-900 dark:text-white">
                        {schedule.subject?.name || "Mata Pelajaran"}
                      </h4>
                      <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1">
                        Kelas {schedule.class?.name || "-"}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 text-[9px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded border border-indigo-100/50 dark:border-indigo-900/30 shrink-0">
                      <Clock className="h-3 w-3" />
                      {formatTime(schedule.startTime)} - {formatTime(schedule.endTime)}
                    </div>
                  </div>

                  <div className="flex gap-2 pt-3 border-t border-gray-100 dark:border-gray-800/80">
                    <Link
                      href={`/attendance?scheduleId=${schedule.id}`}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/30 dark:hover:bg-indigo-950/65 text-[10px] font-bold text-indigo-700 dark:text-indigo-400 rounded-xl transition-all border border-indigo-100/40 dark:border-indigo-900/40"
                    >
                      <ClipboardCheck className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                      Absensi
                    </Link>
                    <Link
                      href={`/teaching-journals?scheduleId=${schedule.id}`}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/30 dark:hover:bg-purple-950/65 text-[10px] font-bold text-purple-700 dark:text-purple-400 rounded-xl transition-all border border-purple-100/40 dark:border-purple-900/40"
                    >
                      <BookOpen className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                      Jurnal
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
