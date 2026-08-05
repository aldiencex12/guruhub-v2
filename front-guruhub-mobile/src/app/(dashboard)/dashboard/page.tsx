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
import { studentsService } from "@/services/students";
import { attendanceService } from "@/services/attendance";
import { classMembersService } from "@/services/class-members";
import type { Schedule, DashboardSummary } from "@/types";
import { ClipboardCheck, BookOpen, Clock, Calendar, CheckCircle2, AlertCircle, RefreshCw, Users, Layers, ShieldAlert, FileWarning, AlertTriangle, Laptop, ExternalLink, Award, Sparkles, ShieldCheck, ChevronRight } from "lucide-react";
import Link from "next/link";
import { formatTime } from "@/lib/utils";

export default function MobileDashboard() {
  const router = useRouter();
  const { currentUser } = useAuthStore();
  const isBK = currentUser?.role === "BKTeacher";
  const isStudent = currentUser?.role === "Student";
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [pendingTasks, setPendingTasks] = useState<any[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [greetingName, setGreetingName] = useState("Guru");
  const [bkIncidents, setBkIncidents] = useState<any[]>([]);
  const [bkSanctions, setBkSanctions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Student Dynamic States
  const [studentDemeritPoints, setStudentDemeritPoints] = useState<number>(0);
  const [studentIncidentsList, setStudentIncidentsList] = useState<any[]>([]);
  const [studentAttendanceStats, setStudentAttendanceStats] = useState<{ percentage: string; presentCount: number; totalCount: number }>({
    percentage: "-",
    presentCount: 0,
    totalCount: 0,
  });

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
      if (isStudent) {
        // Student Dashboard Data Fetching
        const [studentsData, incRes, schedsData, classesData, subjectsData, teachersData, classMembersData] = await Promise.all([
          studentsService.getAll().catch(() => []),
          disciplineService.getIncidents({ limit: 500 }).catch(() => ({ data: [] })),
          schedulesService.getAll().catch(() => []),
          classesService.getAll().catch(() => []),
          subjectsService.getAll().catch(() => []),
          teachersService.getAll().catch(() => []),
          classMembersService.getAll().catch(() => []),
        ]);

        const matchedStudent = studentsData.find((st: any) => {
          if (!currentUser) return false;
          const stUserId = st.userId || st.user_id;
          if (stUserId && currentUser.id && Number(stUserId) === Number(currentUser.id)) return true;
          if (currentUser.email && st.email && st.email.toLowerCase().trim() === currentUser.email.toLowerCase().trim()) return true;
          if (st.name && currentUser.name && st.name.toLowerCase().trim() === currentUser.name.toLowerCase().trim()) return true;
          if (st.nisn && currentUser.email && currentUser.email.includes(st.nisn)) return true;

          const cleanEmailPrefix = currentUser.email ? currentUser.email.split("@")[0].toLowerCase().replace(/[^a-z0-9]/g, "") : "";
          const cleanStName = st.name ? st.name.toLowerCase().replace(/[^a-z0-9]/g, "") : "";
          if (cleanEmailPrefix && cleanStName && (cleanEmailPrefix === cleanStName || cleanStName.includes(cleanEmailPrefix) || cleanEmailPrefix.includes(cleanStName))) return true;

          return false;
        });

        const studentName = matchedStudent?.name || currentUser?.name || currentUser?.email?.split("@")[0] || "Siswa";
        setGreetingName(studentName);

        // Find student classId
        const myClassMember = classMembersData.find((cm: any) => {
          if (!matchedStudent) return false;
          const cmStudentId = cm.studentId || cm.student_id;
          return cmStudentId && Number(cmStudentId) === Number(matchedStudent.id);
        });
        const studentClassId = (matchedStudent as any)?.classId || (matchedStudent as any)?.class_id || (myClassMember as any)?.classId || (myClassMember as any)?.class_id;

        // Real Discipline Incidents
        let myIncidents: any[] = [];
        if (matchedStudent?.id) {
          const studentIncRes = await disciplineService.getIncidents({ studentId: Number(matchedStudent.id), limit: 500 }).catch(() => ({ data: [] }));
          myIncidents = Array.isArray(studentIncRes) ? studentIncRes : (studentIncRes as any)?.data ?? [];
        }

        const totalPoints = myIncidents.reduce((sum: number, inc: any) => sum + Number(inc.points || inc.demeritPoints || inc.demerit_points || 0), 0);
        setStudentDemeritPoints(totalPoints);
        setStudentIncidentsList(myIncidents);

        // Schedules today (Filtered strictly by student's class)
        const enriched = schedsData.map((s: any) => {
          const sClassId = s.classId || s.class_id;
          const sSubjectId = s.subjectId || s.subject_id;
          const sTeacherId = s.teacherId || s.teacher_id;
          return {
            ...s,
            classId: sClassId,
            class: classesData.find((c: any) => Number(c.id) === Number(sClassId)),
            subject: subjectsData.find((sub: any) => Number(sub.id) === Number(sSubjectId)),
            teacher: teachersData.find((t: any) => Number(t.id) === Number(sTeacherId)),
          };
        });

        const todaySchedules = enriched.filter((s: any) => {
          const isToday = s.dayOfWeek && s.dayOfWeek.toLowerCase().trim() === currentDay.toLowerCase().trim();
          const isMyClass = studentClassId ? Number(s.classId) === Number(studentClassId) : false;
          return isToday && isMyClass;
        });
        setSchedules(todaySchedules.sort((a: any, b: any) => (a.startTime || "").localeCompare(b.startTime || "")));

        // Real Attendance stats
        try {
          const summaryAttList = await attendanceService.getAll().catch(() => []);
          const fullAttList = await Promise.all(
            summaryAttList.map(async (att) => {
              try {
                return await attendanceService.getById(att.id);
              } catch {
                return att;
              }
            })
          );

          let present = 0;
          let total = 0;

          fullAttList.forEach((att: any) => {
            if (Array.isArray(att.details)) {
              att.details.forEach((d: any) => {
                const dStudentId = d.studentId || d.student_id;
                const dStudentName = (d.studentName || d.student_name || "").toLowerCase().trim();
                const curName = (matchedStudent?.name || currentUser?.name || "").toLowerCase().trim();

                const isMyDetail = matchedStudent
                  ? (dStudentId && Number(dStudentId) === Number(matchedStudent.id)) || (dStudentName && curName && dStudentName === curName)
                  : (dStudentName && curName && dStudentName === curName);

                if (isMyDetail) {
                  total++;
                  const stUpper = String(d.status).toUpperCase();
                  if (stUpper === "PRESENT" || stUpper === "HADIR") present++;
                }
              });
            }
          });

          if (total === 0) {
            setStudentAttendanceStats({ percentage: "Belum ada data", presentCount: 0, totalCount: 0 });
          } else {
            const pct = Math.round((present / total) * 100) + "%";
            setStudentAttendanceStats({ percentage: pct, presentCount: present, totalCount: total });
          }
        } catch {
          setStudentAttendanceStats({ percentage: "Belum ada data", presentCount: 0, totalCount: 0 });
        }
      } else if (isBK) {
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

  const fetchKey = currentUser ? `${currentUser.id}_${currentUser.email}` : "guest";

  useEffect(() => {
    fetchData();
  }, [fetchKey]);

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

  // ==================== STUDENT DASHBOARD ====================
  if (isStudent) {
    const studentName = currentUser?.name || currentUser?.email?.split("@")[0] || "Siswa";

    return (
      <div className="space-y-6 pb-6">
        {/* Student Welcome Card */}
        <div className="bg-gradient-to-tr from-[#0284c7] via-[#0369a1] to-[#075985] rounded-2xl p-5 text-white shadow-xl relative overflow-hidden">
          <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none">
            <Award className="h-44 w-44 transform translate-x-12 translate-y-12" />
          </div>
          <span className="inline-block text-[9px] uppercase font-bold tracking-wider bg-white/15 backdrop-blur-md border border-white/10 px-2.5 py-1 rounded-full flex items-center gap-1 w-fit">
            <Sparkles className="h-3 w-3 text-amber-300" />
            Portal Akun Siswa SMP HT5
          </span>
          <h2 className="text-xl font-black mt-3 tracking-tight">Halo, {studentName}!</h2>
          <p className="text-xs text-sky-100 mt-1 leading-relaxed">
            Selamat belajar! Hari ini adalah <span className="font-semibold text-white">{currentDateStr}</span>.
          </p>

          <div className="mt-5 pt-4 border-t border-white/10">
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 text-center border border-white/10 flex items-center justify-between px-4">
              <span className="text-xs text-sky-100 font-bold uppercase tracking-wider">Demerit Disiplin</span>
              <span className="text-lg font-black text-amber-300">{studentDemeritPoints} Poin</span>
            </div>
          </div>
        </div>

        {/* 1. WIDGET UTAMA: UJIAN CBT ONLINE (cbt-smpht5.my.id) */}
        <div className="bg-gradient-to-br from-indigo-900 via-indigo-800 to-purple-900 rounded-2xl p-5 text-white shadow-lg border border-indigo-700/50 space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[9px] uppercase font-extrabold tracking-wider bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 px-2.5 py-1 rounded-full flex items-center gap-1.5">
              <Laptop className="h-3.5 w-3.5 text-cyan-300 animate-pulse" />
              PORTAL UJIAN CBT ONLINE
            </span>
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
          </div>

          <div>
            <h3 className="text-lg font-black text-white tracking-tight">Portal Ujian CBT SMP HT5</h3>
            <p className="text-xs text-indigo-200 mt-1 leading-relaxed">
              Masuk langsung ke portal ujian online sekolah untuk mengikuti Penilaian Tengah Semester / Ujian Harian.
            </p>
          </div>

          <Link
            href="/cbt"
            className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs rounded-xl shadow-md transition-all transform active:scale-95 border border-cyan-400/30 text-center"
          >
            <span>🚀 Masuk Portal Ujian CBT</span>
            <Laptop className="h-4 w-4" />
          </Link>
        </div>

        {/* 2. WIDGET STATUS KEDISIPLINAN & KARTU KARAKTER */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-4 rounded-xl shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
              Status Kedisiplinan & Karakter
            </h3>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${studentDemeritPoints === 0
                ? "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800"
                : studentDemeritPoints < 20
                  ? "text-amber-600 bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800"
                  : "text-rose-600 bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800"
              }`}>
              {studentDemeritPoints === 0 ? "Siswa Teladan" : studentDemeritPoints < 20 ? "Dalam Pembinaan" : "Perhatian Khusus (SP)"}
            </span>
          </div>

          <div className={`flex items-center gap-3 p-3 border rounded-xl ${studentDemeritPoints === 0
              ? "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/40"
              : studentDemeritPoints < 20
                ? "bg-amber-50/50 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900/40"
                : "bg-rose-50/50 dark:bg-rose-950/20 border-rose-100 dark:border-rose-900/40"
            }`}>
            <div className={`p-2 text-white rounded-lg shrink-0 ${studentDemeritPoints === 0 ? "bg-emerald-500" : studentDemeritPoints < 20 ? "bg-amber-500" : "bg-rose-500"
              }`}>
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <h4 className={`text-xs font-bold ${studentDemeritPoints === 0 ? "text-emerald-900 dark:text-emerald-300" : studentDemeritPoints < 20 ? "text-amber-900 dark:text-amber-300" : "text-rose-900 dark:text-rose-300"
                }`}>
                Poin Demerit: {studentDemeritPoints} Poin
              </h4>
              <p className={`text-[10px] mt-0.5 ${studentDemeritPoints === 0 ? "text-emerald-700 dark:text-emerald-400" : studentDemeritPoints < 20 ? "text-amber-700 dark:text-amber-400" : "text-rose-700 dark:text-rose-400"
                }`}>
                {studentDemeritPoints === 0
                  ? "Tidak ada catatan pelanggaran. Pertahankan prestasi dan kedisiplinan positifmu!"
                  : `Tercatat ${studentIncidentsList.length} kejadian pelanggaran (${studentDemeritPoints} poin). Harap lapor dan ikuti bimbingan pembinaan.`}
              </p>
            </div>
          </div>

          {/* LINK MENU TERPISAH RINCIAN POIN PELANGGARAN */}
          {studentIncidentsList.length > 0 && (
            <div className="mt-2 pt-2.5 border-t border-gray-100 dark:border-gray-800/60">
              <Link
                href="/discipline"
                className="flex items-center justify-between w-full py-2.5 px-3.5 bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-900/40 text-rose-700 dark:text-rose-300 font-bold text-xs rounded-xl border border-rose-200/80 dark:border-rose-900/40 transition-all group"
              >
                <span className="flex items-center gap-1.5">
                  <ShieldAlert className="h-4 w-4 text-rose-600 dark:text-rose-400 group-hover:scale-110 transition-transform" />
                  Lihat Rincian Catatan Poin ({studentIncidentsList.length})
                </span>
                <ChevronRight className="h-4 w-4 text-rose-500 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          )}
        </div>

        {/* 3. WIDGET JADWAL PELAJARAN HARI INI & ABSENSI */}
        <div className="space-y-3">
          <div className="flex justify-between items-center px-1">
            <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Jadwal Kelas Hari Ini ({currentDay})
            </h3>
            <button onClick={fetchData} className="p-1 text-gray-400 hover:text-indigo-600 rounded-lg">
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
          </div>

          {schedules.length === 0 ? (
            <div className="bg-gray-50 dark:bg-gray-900 border border-dashed border-gray-200 dark:border-gray-800 rounded-xl p-6 text-center text-xs text-gray-400 dark:text-gray-500">
              Tidak ada jadwal pelajaran terdaftar untuk hari {currentDay}.
            </div>
          ) : (
            <div className="space-y-2.5">
              {schedules.map((schedule) => (
                <div key={schedule.id} className="flex items-center justify-between bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-3.5 rounded-xl shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 rounded-xl shrink-0">
                      <BookOpen className="h-4.5 w-4.5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-gray-900 dark:text-white">
                        {schedule.subject?.name || "Mata Pelajaran"}
                      </h4>
                      <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">
                        Pengajar: {schedule.teacher?.name || "Guru Pengajar"}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-2.5 py-1 rounded-lg border border-indigo-100 dark:border-indigo-900/30 shrink-0">
                    {formatTime(schedule.startTime)} - {formatTime(schedule.endTime)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }
  // ==================== END STUDENT DASHBOARD ====================

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
                <div className={`p-2.5 rounded-xl shrink-0 mt-0.5 ${task.type.toLowerCase() === "attendance"
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
                  <span className={`inline-block text-[9px] px-1.5 py-0.5 rounded mt-2 font-medium ${task.type.toLowerCase() === "attendance"
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
