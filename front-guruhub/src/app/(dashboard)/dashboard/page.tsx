"use client";

import { useState, useEffect } from "react";
import { useDashboardSummary, useDashboardAttendance, useDashboardActivities, useDashboardPendingTasks, useDashboardStudentHighlights } from "@/queries/dashboard.query";
import { useSchedules } from "@/queries/schedules.query";
import { useClasses } from "@/queries/classes.query";
import { useSubjects } from "@/queries/subjects.query";
import { useTeachers } from "@/queries/teachers.query";
import { useQuery } from "@tanstack/react-query";
import { disciplineService } from "@/services/discipline";
import { disciplineKeys } from "@/queries/discipline.query";
import { useAuthStore } from "@/store/auth.store";
import { Clock, Users, GraduationCap, School, ClipboardCheck, TrendingUp, Activity, ArrowRight, Calendar, UserCheck, BarChart3, BookMarked, Zap, AlertCircle, CheckCircle2, XCircle, Trophy, AlertTriangle, ShieldAlert, BarChart2, Printer, Plus, ChevronRight, FileText } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { CardSkeleton } from "@/components/ui/skeleton";
import { formatTime } from "@/lib/utils";

const activityIcons: Record<string, React.ElementType> = {
  attendance: ClipboardCheck,
  assessment: BarChart3,
  teacher: GraduationCap,
  report: BookMarked,
  student: UserCheck,
};

const teacherQuickActions = [
  { label: "Input Absensi", href: "/attendance", icon: ClipboardCheck, color: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/50" },
  { label: "Jurnal Mengajar", href: "/teaching-journals", icon: BookMarked, color: "bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50" },
  { label: "Input Nilai", href: "/assessments", icon: BarChart3, color: "bg-purple-50 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400 border border-purple-100 dark:border-purple-900/50" },
  { label: "Jadwal Pelajaran", href: "/schedules", icon: Calendar, color: "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/50" },
  { label: "Lihat Rapor", href: "/report-cards", icon: UserCheck, color: "bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400 border border-amber-100 dark:border-amber-900/50" },
];

const adminQuickActions = [
  { label: "Kelola Guru", href: "/teachers", icon: GraduationCap, color: "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/50" },
  { label: "Kelola Siswa", href: "/students", icon: Users, color: "bg-purple-50 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400 border border-purple-100 dark:border-purple-900/50" },
  { label: "Kelola Kelas", href: "/classes", icon: School, color: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/50" },
  { label: "Modul Kedisiplinan", href: "/discipline/incidents", icon: ShieldAlert, color: "bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400 border border-rose-100 dark:border-rose-900/50" },
  { label: "Log Sanksi & SP", href: "/discipline/sanctions", icon: Printer, color: "bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400 border border-amber-100 dark:border-amber-900/50" },
];

export default function DashboardPage() {
  const { currentUser } = useAuthStore();
  const isBKRole = currentUser?.role === "BKTeacher" || currentUser?.role === "Counselor";
  const isAdminRole = currentUser?.role === "SuperAdmin" || currentUser?.role === "SchoolAdmin" || currentUser?.role === "Principal";
  const isTeacherRole = currentUser?.role === "Teacher" || currentUser?.role === "HomeroomTeacher";

  const quickActions = isAdminRole ? adminQuickActions : teacherQuickActions;

  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [viewMode, setViewMode] = useState<"timeline" | "table">("table");
  const { data, isLoading } = useDashboardSummary();
  const { data: attendanceData, isLoading: isLoadingAttendance } = useDashboardAttendance();
  const { data: activitiesData, isLoading: isLoadingActivities } = useDashboardActivities();
  const { data: pendingTasks = [], isLoading: isLoadingPendingTasks } = useDashboardPendingTasks();
  const { data: studentHighlights, isLoading: isLoadingHighlights } = useDashboardStudentHighlights();

  // Time handling securely based on serverTime
  const serverDate = (data as any)?.serverTime ? new Date((data as any).serverTime) : new Date();
  const daysMap: Record<number, string> = { 0: "Minggu", 1: "Senin", 2: "Selasa", 3: "Rabu", 4: "Kamis", 5: "Jumat", 6: "Sabtu" };
  const currentDay = daysMap[serverDate.getDay()];
  const currentTimeStr = serverDate.toTimeString().split(" ")[0]; // HH:mm:ss

  // Fetch Schedules based on currentDay and selectedClass
  const { data: schedules = [], isLoading: isLoadingSchedules } = useSchedules({ 
    dayOfWeek: currentDay,
    ...(selectedClassId ? { classId: Number(selectedClassId) } : {})
  });
  const { data: classes = [] } = useClasses();
  const { data: subjects = [] } = useSubjects();
  const { data: teachers = [] } = useTeachers();

  if (isLoading && !isBKRole) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <CardSkeleton key={i} />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <CardSkeleton />
          </div>
          <CardSkeleton />
        </div>
      </div>
    );
  }

  const safeData = data || { activeAcademicYear: { name: "Tahun Ajaran Aktif", semester: "-" }, totalStudents: 0, totalTeachers: 0, totalClasses: 0 };
  const activeAcademicYear = safeData.activeAcademicYear || { name: "Tidak ada", semester: "-" };
  
  const attendanceToday = attendanceData || {
    hadirHariIni: 0, sakitHariIni: 0, izinHariIni: 0, alfaHariIni: 0,
  };
  const totalAttendance = attendanceToday.hadirHariIni + attendanceToday.sakitHariIni + attendanceToday.izinHariIni + attendanceToday.alfaHariIni;
  const expectedTotalStudents = safeData.totalStudents || 0;

  const recentActivities = activitiesData || [];

  const attendancePct = totalAttendance > 0
    ? Math.round((attendanceToday.hadirHariIni / totalAttendance) * 100)
    : 0;

  const enrichedSchedules = schedules
    .map(s => ({
      ...s,
      class: classes.find(c => c.id === s.classId),
      subject: subjects.find(sub => sub.id === s.subjectId),
      teacher: teachers.find(t => t.id === s.teacherId),
    }))
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  // Find active and upcoming schedules
  const activeScheduleIndex = enrichedSchedules.findIndex(s => s.startTime <= currentTimeStr && s.endTime >= currentTimeStr);
  
  // Format current date display
  const currentDateDisplay = serverDate.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="space-y-8 pb-8">
      {/* Render BK Discipline Analytics View for BK Roles */}
      {isBKRole ? (
        <BKDashboardView activeAcademicYear={activeAcademicYear} currentDateDisplay={currentDateDisplay} />
      ) : (
        <>
          {/* Slim Header */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white flex items-center gap-2">
                Selamat Datang di GuruHub <span className="animate-wave inline-block origin-bottom-right">👋</span>
              </h1>
              <p className="mt-1 text-gray-500 dark:text-gray-400 text-sm">
                Ringkasan aktivitas akademik, absensi, dan jadwal Anda hari ini.
              </p>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              <Badge className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800 shadow-sm">
                <Calendar className="h-3.5 w-3.5" />
                {currentDateDisplay}
              </Badge>
              <Badge className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800 shadow-sm">
                <School className="h-3.5 w-3.5" />
                TA {activeAcademicYear.name} ({activeAcademicYear.semester})
              </Badge>
            </div>
          </div>

      {/* Pending Tasks Alert (Only for Teachers) */}
      {!isAdminRole && (
        isLoadingPendingTasks ? (
          <div className="bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row gap-4 items-start animate-pulse">
            <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-800 flex-shrink-0"></div>
            <div className="flex-1 w-full space-y-3">
              <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-1/4"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-2/3"></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="bg-white dark:bg-gray-950 border border-gray-100 dark:border-gray-800 rounded-lg p-3 h-24"></div>
                ))}
              </div>
            </div>
          </div>
        ) : pendingTasks.length > 0 ? (
          <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row gap-4 items-start shadow-sm">
            <div className="h-10 w-10 rounded-full bg-rose-100 dark:bg-rose-900/60 flex items-center justify-center flex-shrink-0 text-rose-600 dark:text-rose-400">
              <AlertCircle className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-bold text-rose-800 dark:text-rose-300 mb-1">
                Tugas Tertunda Hari Ini ({pendingTasks.length})
              </h3>
              <p className="text-xs sm:text-sm text-rose-600 dark:text-rose-400 mb-3 leading-relaxed">
                Anda memiliki kelas yang sudah selesai, namun Anda belum mengisi absensi atau jurnal mengajarnya.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {pendingTasks.map((task: any, idx: number) => (
                  <div key={idx} className="bg-white dark:bg-gray-900 border border-rose-100 dark:border-rose-800/50 rounded-lg p-3 flex flex-col gap-1 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <Badge className={task.type === "ATTENDANCE" ? "border-amber-200 text-amber-700 bg-amber-50 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800/50" : "border-indigo-200 text-indigo-700 bg-indigo-50 dark:bg-indigo-950/30 dark:text-indigo-400 dark:border-indigo-800/50"}>
                        {task.type === "ATTENDANCE" ? "Absensi" : "Jurnal"}
                      </Badge>
                      <span className="text-[10px] font-medium text-gray-400 flex items-center gap-1"><Clock className="h-3 w-3" /> {task.time}</span>
                    </div>
                    <p className="text-sm font-bold text-gray-800 dark:text-gray-200 mt-1 truncate">{task.subjectName}</p>
                    <p className="text-xs text-gray-500 font-medium">Kelas {task.className}</p>
                    <Link href={task.type === "ATTENDANCE" ? "/attendance" : "/teaching-journals"} className="mt-1.5 group flex items-center text-xs font-bold text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 w-fit">
                      Isi sekarang <ArrowRight className="h-3 w-3 ml-1 transform transition-transform group-hover:translate-x-1" />
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : null
      )}

      {/* Quick Actions (Moved up for accessibility) */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
          <Zap className="h-4 w-4" /> Aksi Cepat
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-4">
          {quickActions.map((action) => (
            <Link key={action.href} href={action.href}>
              <div className="group relative overflow-hidden rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-5 hover:shadow-lg hover:border-indigo-300 dark:hover:border-indigo-700 transition-all cursor-pointer flex items-center gap-4">
                <div className={`h-12 w-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110 ${action.color}`}>
                  <action.icon className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {action.label}
                  </h3>
                  <div className="flex items-center text-xs text-gray-500 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity translate-x-[-10px] group-hover:translate-x-0 transform duration-300">
                    Buka halaman <ArrowRight className="h-3 w-3 ml-1" />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        <StatCard
          title="Total Guru"
          value={safeData.totalTeachers}
          icon={GraduationCap}
          color="indigo"
          href="/teachers"
          change={`${safeData.totalTeachers} guru terdaftar`}
        />
        <StatCard
          title="Total Siswa"
          value={safeData.totalStudents}
          icon={Users}
          color="purple"
          href="/students"
          change={`${safeData.totalStudents} siswa terdaftar`}
        />
        <StatCard
          title="Total Kelas"
          value={safeData.totalClasses}
          icon={School}
          color="emerald"
          href="/classes"
          change={`${safeData.totalClasses} kelas aktif`}
        />
        
        {/* Special Attendance Card */}
        <Card className="relative overflow-hidden border-t-4 border-t-amber-500 hover:shadow-xl transition-all duration-300 group">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-50 to-transparent dark:from-amber-950/20 dark:to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <CardContent className="p-5 relative z-10 flex flex-col h-full justify-between">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Kehadiran Hari Ini</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <h3 className="text-3xl font-extrabold text-gray-900 dark:text-white">{attendancePct}%</h3>
                  <p className="text-xs text-gray-500">({attendanceToday.hadirHariIni}/{totalAttendance} Kehadiran)</p>
                </div>
              </div>
              <div className="h-10 w-10 rounded-xl bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center flex-shrink-0 text-amber-600 dark:text-amber-400">
                <ClipboardCheck className="h-5 w-5" />
              </div>
            </div>
            
            <div className="grid grid-cols-4 gap-1 mt-2 border-t border-gray-100 dark:border-gray-800 pt-3">
              <div className="text-center"><p className="text-xs text-gray-500">Hadir</p><p className="font-semibold text-emerald-600">{attendanceToday.hadirHariIni}</p></div>
              <div className="text-center"><p className="text-xs text-gray-500">Sakit</p><p className="font-semibold text-amber-500">{attendanceToday.sakitHariIni}</p></div>
              <div className="text-center"><p className="text-xs text-gray-500">Izin</p><p className="font-semibold text-blue-500">{attendanceToday.izinHariIni}</p></div>
              <div className="text-center"><p className="text-xs text-gray-500">Alfa</p><p className="font-semibold text-red-500">{attendanceToday.alfaHariIni}</p></div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Discipline Overview & Analytics Widget for Admin */}
      {isAdminRole && <DisciplineAdminWidget />}

      {/* Main Content: Schedule & Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Schedule */}
        <Card className="lg:col-span-2 shadow-sm border-gray-200 dark:border-gray-800">
          <CardHeader className="bg-gray-50/50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-800 pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center">
                  <Clock className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <CardTitle className="text-lg">Jadwal Kelas</CardTitle>
                  <CardDescription>Menampilkan jadwal mengajar hari ini</CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="w-32 sm:w-40">
                  <Select
                    value={selectedClassId}
                    onChange={(e) => setSelectedClassId(e.target.value)}
                  >
                    <option value="">Semua Kelas</option>
                    {classes.map((cls) => (
                      <option key={cls.id} value={cls.id.toString()}>{cls.name}</option>
                    ))}
                  </Select>
                </div>
                <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-md flex-shrink-0">
                  <button onClick={() => setViewMode('timeline')} className={`px-3 py-1 text-xs font-medium rounded ${viewMode === 'timeline' ? 'bg-white dark:bg-gray-700 shadow text-gray-900 dark:text-gray-100' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>Timeline</button>
                  <button onClick={() => setViewMode('table')} className={`px-3 py-1 text-xs font-medium rounded ${viewMode === 'table' ? 'bg-white dark:bg-gray-700 shadow text-gray-900 dark:text-gray-100' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>Tabel</button>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {isLoadingSchedules || isLoadingPendingTasks ? (
              <div className="flex flex-col items-center justify-center py-16 gap-4">
                <div className="h-8 w-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
                <p className="text-sm font-medium text-gray-500">Memuat jadwal...</p>
              </div>
            ) : enrichedSchedules.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="h-16 w-16 rounded-full bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 flex items-center justify-center mb-4">
                  <Calendar className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">Tidak ada jadwal hari ini</h3>
                <p className="text-sm text-gray-500 mt-1.5 max-w-sm">
                  Hari ini bebas dari kelas akademik. Selamat beristirahat atau menyelesaikan pekerjaan administratif!
                </p>
              </div>
            ) : viewMode === "timeline" ? (
              <div className="relative pl-6 space-y-6 before:absolute before:inset-y-2 before:left-[11px] before:w-px before:bg-gradient-to-b before:from-indigo-200 before:via-gray-200 before:to-transparent dark:before:from-indigo-900/50 dark:before:via-gray-800">
                {enrichedSchedules.map((schedule, idx) => {
                  const isActive = idx === activeScheduleIndex;
                  const isPast = schedule.endTime < currentTimeStr;
                  const isFuture = schedule.startTime > currentTimeStr;
                  
                  return (
                    <div key={schedule.id} className={`relative transition-all duration-500 ${isPast ? 'opacity-50 grayscale-[30%]' : ''}`}>
                      {/* Timeline Dot */}
                      <div className={`absolute -left-6 top-1.5 h-6 w-6 rounded-full flex items-center justify-center ring-4 ring-white dark:ring-gray-950 ${
                        isActive 
                          ? "bg-indigo-600 text-white shadow-[0_0_15px_rgba(79,70,229,0.5)]" 
                          : isPast 
                            ? "bg-gray-200 dark:bg-gray-800 text-gray-500" 
                            : "bg-white dark:bg-gray-900 border-2 border-indigo-200 dark:border-indigo-800"
                      }`}>
                        {isActive && (
                          <span className="absolute w-full h-full rounded-full bg-indigo-500 opacity-40 animate-ping"></span>
                        )}
                        <div className={`h-2 w-2 rounded-full ${isActive || isPast ? "bg-white dark:bg-gray-900" : "bg-indigo-500"}`}></div>
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center gap-4 ml-4">
                        <div className="flex items-center gap-2 sm:w-28 flex-shrink-0">
                          <span className={`text-sm font-bold tracking-tight ${isActive ? "text-indigo-600 dark:text-indigo-400" : "text-gray-900 dark:text-gray-100"}`}>
                            {formatTime(schedule.startTime)}
                          </span>
                          <span className="text-xs text-gray-400">-</span>
                          <span className="text-xs font-medium text-gray-500">
                            {formatTime(schedule.endTime)}
                          </span>
                        </div>
                        
                        <div className={`flex-1 rounded-2xl p-4 transition-all duration-300 border ${
                          isActive 
                            ? "border-indigo-500/30 bg-gradient-to-r from-indigo-50/50 to-white dark:from-indigo-900/20 dark:to-gray-900/50 shadow-sm transform -translate-y-0.5" 
                            : "border-gray-100 bg-gray-50/30 dark:border-gray-800/60 dark:bg-gray-900/30 hover:border-indigo-200 hover:shadow-sm"
                        }`}>
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <Badge variant={isActive ? "default" : "secondary"} className={isActive ? "bg-indigo-600 hover:bg-indigo-700 shadow-sm" : "bg-white dark:bg-gray-950 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700"}>
                              {schedule.class?.name || "Kelas ?"}
                            </Badge>
                            {isActive && (
                              <span className="flex items-center text-[10px] uppercase font-bold tracking-widest text-indigo-600 dark:text-indigo-400 bg-indigo-100/80 dark:bg-indigo-900/50 px-2.5 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-800">
                                Sedang Berlangsung
                              </span>
                            )}
                          </div>
                          
                          <h4 className={`text-base font-bold ${isActive ? "text-gray-900 dark:text-white" : "text-gray-800 dark:text-gray-200"}`}>
                            {schedule.subject?.name || "Mata Pelajaran ?"}
                          </h4>
                          
                          <div className="flex flex-wrap items-center gap-4 mt-3">
                            <span className="flex items-center gap-1.5 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-md text-xs font-medium text-gray-500 dark:text-gray-400">
                              <GraduationCap className="h-3.5 w-3.5 text-gray-400" />
                              <span className="truncate">{schedule.teacher?.name || "Guru ?"}</span>
                            </span>
                            
                            {!isFuture && (
                              <div className="flex items-center gap-3">
                                <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                                  {isPast && !pendingTasks.some((t: any) => String(t.scheduleId) === String(schedule.id) && t.type === "ATTENDANCE") ? (
                                    <Link href="/attendance" className="flex items-center">
                                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 hover:text-emerald-600 transition-colors" aria-label="Absen sudah diisi - Klik untuk melihat" />
                                    </Link>
                                  ) : (
                                    <Link href="/attendance" className="flex items-center">
                                      <CheckCircle2 className="h-3.5 w-3.5 text-rose-500 hover:text-rose-600 transition-colors" aria-label="Absen belum diisi - Klik untuk mengisi" />
                                    </Link>
                                  )}
                                  <span>Absen</span>
                                </div>
                                <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                                  {isPast && !pendingTasks.some((t: any) => String(t.scheduleId) === String(schedule.id) && t.type === "JOURNAL") ? (
                                    <Link href="/teaching-journals" className="flex items-center">
                                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 hover:text-emerald-600 transition-colors" aria-label="Jurnal sudah diisi - Klik untuk melihat" />
                                    </Link>
                                  ) : (
                                    <Link href="/teaching-journals" className="flex items-center">
                                      <CheckCircle2 className="h-3.5 w-3.5 text-rose-500 hover:text-rose-600 transition-colors" aria-label="Jurnal belum diisi - Klik untuk mengisi" />
                                    </Link>
                                  )}
                                  <span>Jurnal</span>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-800 text-gray-500 bg-gray-50 dark:bg-gray-800/50">
                      <th className="p-3 font-semibold w-32 whitespace-nowrap">Waktu</th>
                      <th className="p-3 font-semibold">Kelas</th>
                      <th className="p-3 font-semibold">Mata Pelajaran</th>
                      <th className="p-3 font-semibold">Guru</th>
                      <th className="p-3 font-semibold text-center">Absen</th>
                      <th className="p-3 font-semibold text-center">Jurnal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {enrichedSchedules.map((schedule, idx) => {
                      const isActive = idx === activeScheduleIndex;
                      const isPast = schedule.endTime < currentTimeStr;
                      const isFuture = schedule.startTime > currentTimeStr;
                      const attendanceFilled = isPast && !pendingTasks.some((t: any) => String(t.scheduleId) === String(schedule.id) && t.type === "ATTENDANCE");
                      const journalFilled = isPast && !pendingTasks.some((t: any) => String(t.scheduleId) === String(schedule.id) && t.type === "JOURNAL");
                      
                      return (
                        <tr key={schedule.id} className={`hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${isActive ? "bg-indigo-50/50 dark:bg-indigo-900/10" : ""}`}>
                          <td className="p-3 font-medium text-gray-600 dark:text-gray-300 whitespace-nowrap">
                            {formatTime(schedule.startTime)} - {formatTime(schedule.endTime)}
                            {isActive && <span className="ml-2 inline-flex h-2 w-2 rounded-full bg-indigo-500 animate-ping"></span>}
                          </td>
                          <td className="p-3"><Badge variant={isActive ? "default" : "secondary"} className={isActive ? "bg-indigo-600 hover:bg-indigo-700 shadow-sm" : ""}>{schedule.class?.name || "?"}</Badge></td>
                          <td className="p-3 font-semibold text-gray-900 dark:text-gray-100">{schedule.subject?.name || "?"}</td>
                          <td className="p-3 text-gray-500 dark:text-gray-400">{schedule.teacher?.name || "?"}</td>
                          <td className="p-3">
                            {isFuture ? <div className="flex justify-center"><span className="text-gray-300 dark:text-gray-600">-</span></div> : attendanceFilled ? <div className="flex justify-center"><Link href="/attendance"><CheckCircle2 className="h-4 w-4 text-emerald-500 hover:scale-110 transition-transform" aria-label="Sudah diisi - Klik untuk melihat" /></Link></div> : <div className="flex justify-center"><Link href="/attendance"><CheckCircle2 className="h-4 w-4 text-rose-500 hover:scale-110 transition-transform" aria-label="Belum diisi - Klik untuk mengisi" /></Link></div>}
                          </td>
                          <td className="p-3">
                            {isFuture ? <div className="flex justify-center"><span className="text-gray-300 dark:text-gray-600">-</span></div> : journalFilled ? <div className="flex justify-center"><Link href="/teaching-journals"><CheckCircle2 className="h-4 w-4 text-emerald-500 hover:scale-110 transition-transform" aria-label="Sudah diisi - Klik untuk melihat" /></Link></div> : <div className="flex justify-center"><Link href="/teaching-journals"><CheckCircle2 className="h-4 w-4 text-rose-500 hover:scale-110 transition-transform" aria-label="Belum diisi - Klik untuk mengisi" /></Link></div>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Student Insights / Highlights */}
        <Card className="shadow-sm border-gray-200 dark:border-gray-800 flex flex-col">
          <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border-b border-amber-100 dark:border-amber-900/50 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg text-amber-900 dark:text-amber-100">Highlight Siswa</CardTitle>
                <CardDescription className="text-amber-700/70 dark:text-amber-400/70 mt-1">Wawasan performa & absensi</CardDescription>
              </div>
              <div className="h-10 w-10 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center shadow-sm">
                <Trophy className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0 flex-1 overflow-hidden relative">
            <div className="absolute inset-0 overflow-y-auto custom-scrollbar p-5 space-y-6">
              
              {isLoadingHighlights ? (
                <div className="flex justify-center py-10">
                  <div className="animate-spin h-6 w-6 border-2 border-amber-400 border-t-transparent rounded-full" />
                </div>
              ) : (
                <>
                  {/* Top Students */}
                  <div>
                    <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                      <Trophy className="h-3.5 w-3.5 text-yellow-500" /> Bintang Kelas
                    </h3>
                    <div className="space-y-3">
                      {studentHighlights?.topStudents.map((student, i) => (
                        <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800 hover:border-yellow-200 dark:hover:border-yellow-900/50 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs ${i === 0 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-400' : i === 1 ? 'bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-300' : 'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-400'}`}>
                              #{i+1}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{student.name}</p>
                              <p className="text-xs text-gray-500">Kelas {student.class}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">{student.score}</p>
                            <p className="text-[10px] text-gray-400">Rata-rata</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Needs Attention */}
                  <div>
                    <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                      <AlertTriangle className="h-3.5 w-3.5 text-rose-500" /> Perlu Perhatian
                    </h3>
                    <div className="space-y-3">
                      {studentHighlights?.attentionStudents.map((student, i) => (
                        <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 hover:border-rose-200 dark:hover:border-rose-900/50 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-rose-100 dark:bg-rose-900/50 flex items-center justify-center">
                              <UserCheck className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{student.name}</p>
                              <p className="text-xs text-gray-500">Kelas {student.class}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge className="bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800">
                              {student.alfas} Alfa
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

            </div>
          </CardContent>
        </Card>
      </div>
        </>
      )}
    </div>
  );
}

function BKDashboardView({ activeAcademicYear, currentDateDisplay }: any) {
  const { data: analytics, isLoading: loadingAnalytics } = useQuery({
    queryKey: disciplineKeys.analytics({}),
    queryFn: async () => {
      const res = await disciplineService.getAnalytics();
      return res.data || res;
    },
  });

  const { data: sanctionLogsRes, isLoading: loadingSanctions } = useQuery({
    queryKey: disciplineKeys.sanctions(),
    queryFn: async () => {
      const res = await disciplineService.getSanctions({ limit: 5 });
      return res.data || res;
    },
  });

  const sanctionLogs = Array.isArray(sanctionLogsRes) ? sanctionLogsRes : sanctionLogsRes?.data || [];

  const totalIncidents = analytics?.totalIncidents ?? 0;
  const pendingIncidents = analytics?.pendingIncidents ?? 0;
  const topCategoryName = analytics?.topCategoryName || "Belum Ada Data";
  const topCategoryPercentage = analytics?.topCategoryPercentage ?? 0;
  const highRiskStudentsCount = analytics?.highRiskStudentsCount ?? 0;
  const categoriesDistribution: any[] = analytics?.categoriesDistribution || [];

  const barColors = ["bg-indigo-600", "bg-amber-500", "bg-orange-500", "bg-rose-500", "bg-emerald-500", "bg-sky-500"];

  return (
    <div className="space-y-8 pb-8">
      {/* BK Dashboard Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 sm:p-8 text-white shadow-xl">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-64 h-64 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold border border-indigo-500/30">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Role: Guru Bimbingan Konseling (BK)</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
              Analitik Karakter & Kedisiplinan Siswa
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              Laporan visual tren insiden harian, distribusi kategori pelanggaran, dan pemetaan tingkat risiko untuk pembinaan siswa yang terukur dan proaktif.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Link href="/discipline/incidents">
              <Button className="bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs gap-2 shadow-lg shadow-rose-900/30">
                <Plus className="w-4 h-4" />
                Catat Pelanggaran
              </Button>
            </Link>
            <Link href="/discipline/sanctions">
              <Button variant="outline" className="bg-slate-800/80 hover:bg-slate-800 text-white border-slate-700 text-xs font-bold gap-2">
                <Printer className="w-4 h-4 text-indigo-400" />
                Log Sanksi & Cetak SP
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* 4 Key KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Insiden */}
        <Card className="relative overflow-hidden border-t-4 border-t-indigo-500 hover:shadow-xl transition-all duration-300 group">
          <CardContent className="p-5 flex flex-col justify-between h-full gap-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Insiden Laporan</p>
                <h3 className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
                  {loadingAnalytics ? "..." : totalIncidents}
                </h3>
              </div>
              <div className="h-10 w-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
            <p className="text-xs text-slate-500 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-indigo-500" />
              <span>Total akumulasi insiden tercatat</span>
            </p>
          </CardContent>
        </Card>

        {/* Insiden Menunggu Verifikasi */}
        <Card className="relative overflow-hidden border-t-4 border-t-amber-500 hover:shadow-xl transition-all duration-300 group">
          <CardContent className="p-5 flex flex-col justify-between h-full gap-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Pending Verifikasi BK</p>
                <h3 className="text-3xl font-extrabold text-amber-600 dark:text-amber-400 mt-1">
                  {loadingAnalytics ? "..." : pendingIncidents}
                </h3>
              </div>
              <div className="h-10 w-10 rounded-xl bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <AlertCircle className="w-5 h-5" />
              </div>
            </div>
            <Link href="/discipline/incidents" className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1">
              <span>Verifikasi laporan guru</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </CardContent>
        </Card>

        {/* Pelanggaran Terbanyak */}
        <Card className="relative overflow-hidden border-t-4 border-t-purple-500 hover:shadow-xl transition-all duration-300 group">
          <CardContent className="p-5 flex flex-col justify-between h-full gap-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Kategori Dominan</p>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-1 truncate max-w-[180px]">
                  {loadingAnalytics ? "..." : topCategoryName}
                </h3>
              </div>
              <div className="h-10 w-10 rounded-xl bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                <BarChart2 className="w-5 h-5" />
              </div>
            </div>
            <p className="text-xs text-purple-600 dark:text-purple-400 font-semibold">
              {topCategoryPercentage}% dari seluruh kasus
            </p>
          </CardContent>
        </Card>

        {/* Siswa Risiko SP (Poin >= 50) */}
        <Card className="relative overflow-hidden border-t-4 border-t-rose-500 hover:shadow-xl transition-all duration-300 group">
          <CardContent className="p-5 flex flex-col justify-between h-full gap-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Siswa Risiko Tinggi (SP)</p>
                <h3 className="text-3xl font-extrabold text-rose-600 dark:text-rose-400 mt-1">
                  {loadingAnalytics ? "..." : highRiskStudentsCount}
                </h3>
              </div>
              <div className="h-10 w-10 rounded-xl bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                <ShieldAlert className="w-5 h-5" />
              </div>
            </div>
            <Link href="/discipline/sanctions" className="text-xs font-bold text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1">
              <span>Akumulasi poin &ge; 50 (Tindak SP)</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Main Grid: Category Distribution & Risk Mapping */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Category Distribution (2 Cols) */}
        <Card className="lg:col-span-2 shadow-sm border-slate-200 dark:border-slate-800">
          <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center">
                  <BarChart2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <CardTitle className="text-lg">Distribusi Kategori Pelanggaran</CardTitle>
                  <CardDescription>Persentase dan frekuensi insiden berdasarkan jenis aturan sekolah</CardDescription>
                </div>
              </div>
              <Link href="/discipline/analytics">
                <Button variant="ghost" size="sm" className="text-xs font-bold text-indigo-600 hover:text-indigo-700">
                  Lihat Detail <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {loadingAnalytics ? (
              <div className="py-12 text-center text-slate-500 italic">Memuat grafik distribusi...</div>
            ) : categoriesDistribution.length === 0 ? (
              <div className="py-12 text-center text-slate-500 italic">
                Belum ada data insiden untuk menghitung distribusi kategori.
              </div>
            ) : (
              <div className="space-y-5">
                {categoriesDistribution.map((item, idx) => {
                  const color = barColors[idx % barColors.length];
                  return (
                    <div key={item.category || idx} className="space-y-1.5">
                      <div className="flex justify-between text-xs font-semibold text-slate-800 dark:text-slate-200">
                        <span>{item.category} ({item.count || 0} Insiden)</span>
                        <span className="font-bold text-indigo-600 dark:text-indigo-400">{item.percentage}%</span>
                      </div>
                      <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5">
                        <div
                          className={`h-full ${color} rounded-full transition-all duration-700 shadow-sm`}
                          style={{ width: `${Math.max(item.percentage, 4)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Risk Level Mapping Card (1 Col) */}
        <Card className="shadow-sm border-slate-200 dark:border-slate-800 flex flex-col">
          <CardHeader className="bg-gradient-to-r from-rose-50 to-amber-50 dark:from-rose-950/30 dark:to-amber-950/30 border-b border-rose-100 dark:border-rose-900/50 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg text-rose-900 dark:text-rose-100">Pemetaan Tingkat Risiko</CardTitle>
                <CardDescription className="text-rose-700/70 dark:text-rose-400/70 mt-0.5">Klasifikasi tingkat keparahan poin</CardDescription>
              </div>
              <div className="h-9 w-9 rounded-full bg-rose-100 dark:bg-rose-900/50 flex items-center justify-center">
                <ShieldAlert className="w-5 h-5 text-rose-600 dark:text-rose-400" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-5 flex-1 space-y-4">
            {/* Level 1: Low Risk */}
            <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/50 space-y-1">
              <div className="flex items-center justify-between font-bold text-xs text-emerald-800 dark:text-emerald-300">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  Risiko Rendah (&lt; 25 Poin)
                </span>
                <span>Pembinaan Wali Kelas</span>
              </div>
              <p className="text-[11px] text-emerald-700 dark:text-emerald-400 leading-snug">
                Pelanggaran ringan rutin. Diberikan teguran lisan dan bimbingan wali kelas.
              </p>
            </div>

            {/* Level 2: Medium Risk */}
            <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-800/50 space-y-1">
              <div className="flex items-center justify-between font-bold text-xs text-amber-800 dark:text-amber-300">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  Risiko Sedang (25 - 49 Poin)
                </span>
                <span>Panggilan Ortusa / SP-1</span>
              </div>
              <p className="text-[11px] text-amber-700 dark:text-amber-400 leading-snug">
                Siswa menembus ambang sanksi pertama. Perlu konseling BK & Panggilan Orang Tua.
              </p>
            </div>

            {/* Level 3: High Risk */}
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200/60 dark:border-rose-800/50 space-y-1">
              <div className="flex items-center justify-between font-bold text-xs text-rose-800 dark:text-rose-300">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                  Risiko Tinggi (&ge; 50 Poin)
                </span>
                <span className="text-rose-600 font-extrabold">{highRiskStudentsCount} Siswa</span>
              </div>
              <p className="text-[11px] text-rose-700 dark:text-rose-400 leading-snug">
                Ambang sanksi berat (Skorsing / SP-2 / SP-3). Memerlukan tindakan tegas pembinaan BK & Kepala Sekolah.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Log Sanksi Terbaru Section */}
      <Card className="shadow-sm border-slate-200 dark:border-slate-800">
        <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-rose-100 dark:bg-rose-900/50 flex items-center justify-center">
                <Printer className="w-4 h-4 text-rose-600 dark:text-rose-400" />
              </div>
              <div>
                <CardTitle className="text-lg">Log Sanksi & Surat Peringatan Terbaru</CardTitle>
                <CardDescription>Siswa yang diterbitkan sanksi otomatis berdasarkan poin</CardDescription>
              </div>
            </div>
            <Link href="/discipline/sanctions">
              <Button size="sm" className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold gap-1.5">
                Kelola Semua Sanksi <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          {loadingSanctions ? (
            <div className="p-8 text-center text-slate-500 italic">Memuat log sanksi...</div>
          ) : sanctionLogs.length === 0 ? (
            <div className="p-8 text-center text-slate-500 italic">Belum ada sanksi yang diterbitkan.</div>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-100 dark:bg-slate-800/60 font-bold uppercase text-slate-700 dark:text-slate-300">
                <tr>
                  <th className="p-3">Nama Siswa</th>
                  <th className="p-3">Kelas</th>
                  <th className="p-3">Tingkat Sanksi</th>
                  <th className="p-3 text-center">Akumulasi Poin</th>
                  <th className="p-3">Status Sanksi</th>
                  <th className="p-3 text-center">Aksi Dokumen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {sanctionLogs.map((log: any) => (
                  <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
                    <td className="p-3 font-bold text-slate-900 dark:text-white">
                      {log.studentName || `Siswa #${log.studentId}`}
                    </td>
                    <td className="p-3 text-slate-600 dark:text-slate-400">{log.className || "-"}</td>
                    <td className="p-3 font-semibold text-rose-600 dark:text-rose-400">
                      {log.sanctionType ? log.sanctionType.replace(/_/g, " ") : "PEMBINAAN BK"}
                    </td>
                    <td className="p-3 text-center font-bold text-rose-700 dark:text-rose-400">
                      {log.cumulativePoints || 0} Poin
                    </td>
                    <td className="p-3">
                      <Badge className="bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300">
                        {log.status || "TERBIT"}
                      </Badge>
                    </td>
                    <td className="p-3 text-center">
                      <Link href="/discipline/sanctions">
                        <Button size="sm" variant="outline" className="h-7 text-[11px] font-bold gap-1 text-indigo-600 border-indigo-200 hover:bg-indigo-50">
                          <Printer className="w-3 h-3" />
                          Cetak & Unduh
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function DisciplineAdminWidget() {
  const { data: analytics, isLoading: loadingAnalytics } = useQuery({
    queryKey: disciplineKeys.analytics({}),
    queryFn: async () => {
      const res = await disciplineService.getAnalytics();
      return res.data || res;
    },
  });

  const { data: sanctionLogsRes, isLoading: loadingSanctions } = useQuery({
    queryKey: disciplineKeys.sanctions(),
    queryFn: async () => {
      const res = await disciplineService.getSanctions({ limit: 5 });
      return res.data || res;
    },
  });

  const sanctionLogs = Array.isArray(sanctionLogsRes) ? sanctionLogsRes : sanctionLogsRes?.data || [];

  const totalIncidents = analytics?.totalIncidents ?? 0;
  const pendingIncidents = analytics?.pendingIncidents ?? 0;
  const topCategoryName = analytics?.topCategoryName || "Belum Ada Data";
  const topCategoryPercentage = analytics?.topCategoryPercentage ?? 0;
  const highRiskStudentsCount = analytics?.highRiskStudentsCount ?? 0;
  const categoriesDistribution: any[] = analytics?.categoriesDistribution || [];

  return (
    <div className="space-y-6 my-8">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-48 h-48 rounded-full bg-indigo-500/10 blur-2xl pointer-events-none" />
        <div className="flex items-center gap-3.5 relative z-10">
          <div className="h-11 w-11 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0 shadow-inner">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-extrabold tracking-tight text-white">Ringkasan Modul Kedisiplinan & Karakter Siswa</h2>
              <Badge className="bg-rose-500/20 text-rose-300 border-rose-500/30 text-[10px] px-2 py-0.5">Realtime</Badge>
            </div>
            <p className="text-xs text-slate-300 mt-0.5 max-w-xl">
              Pantau insiden pelanggaran, status verifikasi BK, dan tingkat akumulasi poin sanksi siswa.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 relative z-10 shrink-0">
          <Link href="/discipline/incidents">
            <Button size="sm" className="bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold gap-1.5 shadow-md shadow-rose-900/40">
              <Plus className="w-3.5 h-3.5" /> Catat Pelanggaran
            </Button>
          </Link>
          <Link href="/discipline/sanctions">
            <Button size="sm" variant="outline" className="bg-slate-800/80 hover:bg-slate-800 text-white border-slate-700 text-xs font-bold gap-1.5">
              <Printer className="w-3.5 h-3.5 text-indigo-400" /> Sanksi & SP
            </Button>
          </Link>
        </div>
      </div>

      {/* 4 KPI Discipline Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Insiden */}
        <Card className="relative overflow-hidden border-t-4 border-t-indigo-500 hover:shadow-lg transition-all duration-300">
          <CardContent className="p-4 flex flex-col justify-between h-full gap-3">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Insiden Laporan</p>
                <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-0.5">
                  {loadingAnalytics ? "..." : totalIncidents}
                </h3>
              </div>
              <div className="h-9 w-9 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <FileText className="w-4 h-4" />
              </div>
            </div>
            <p className="text-[11px] text-slate-500 flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-indigo-500" />
              <span>Akumulasi pelanggaran tercatat</span>
            </p>
          </CardContent>
        </Card>

        {/* Pending Verifikasi */}
        <Card className="relative overflow-hidden border-t-4 border-t-amber-500 hover:shadow-lg transition-all duration-300">
          <CardContent className="p-4 flex flex-col justify-between h-full gap-3">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Pending Verifikasi BK</p>
                <h3 className="text-2xl font-extrabold text-amber-600 dark:text-amber-400 mt-0.5">
                  {loadingAnalytics ? "..." : pendingIncidents}
                </h3>
              </div>
              <div className="h-9 w-9 rounded-lg bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <AlertCircle className="w-4 h-4" />
              </div>
            </div>
            <Link href="/discipline/incidents" className="text-[11px] font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1">
              <span>Perlu verifikasi guru/BK</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </CardContent>
        </Card>

        {/* Kategori Dominan */}
        <Card className="relative overflow-hidden border-t-4 border-t-purple-500 hover:shadow-lg transition-all duration-300">
          <CardContent className="p-4 flex flex-col justify-between h-full gap-3">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Kategori Dominan</p>
                <h3 className="text-base font-bold text-slate-900 dark:text-white mt-0.5 truncate max-w-[150px]">
                  {loadingAnalytics ? "..." : topCategoryName}
                </h3>
              </div>
              <div className="h-9 w-9 rounded-lg bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                <BarChart2 className="w-4 h-4" />
              </div>
            </div>
            <p className="text-[11px] text-purple-600 dark:text-purple-400 font-semibold">
              {topCategoryPercentage}% dari seluruh kasus
            </p>
          </CardContent>
        </Card>

        {/* Siswa Risiko SP */}
        <Card className="relative overflow-hidden border-t-4 border-t-rose-500 hover:shadow-lg transition-all duration-300">
          <CardContent className="p-4 flex flex-col justify-between h-full gap-3">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Siswa Risiko SP (&ge;50 Poin)</p>
                <h3 className="text-2xl font-extrabold text-rose-600 dark:text-rose-400 mt-0.5">
                  {loadingAnalytics ? "..." : highRiskStudentsCount}
                </h3>
              </div>
              <div className="h-9 w-9 rounded-lg bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                <ShieldAlert className="w-4 h-4" />
              </div>
            </div>
            <Link href="/discipline/sanctions" className="text-[11px] font-bold text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1">
              <span>Kelola sanksi & surat peringatan</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Log Sanksi & Surat Peringatan Terbaru Table */}
      <Card className="shadow-sm border-slate-200 dark:border-slate-800">
        <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 py-3.5 px-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="h-7 w-7 rounded-full bg-rose-100 dark:bg-rose-900/50 flex items-center justify-center">
                <Printer className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
              </div>
              <div>
                <CardTitle className="text-base">Log Sanksi & Surat Peringatan Terbit</CardTitle>
                <CardDescription className="text-xs">Daftar sanksi otomatis yang diterbitkan untuk siswa berisiko</CardDescription>
              </div>
            </div>
            <Link href="/discipline/sanctions">
              <Button size="sm" variant="ghost" className="text-xs font-bold text-indigo-600 hover:text-indigo-700 gap-1">
                Lihat Semua <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          {loadingSanctions ? (
            <div className="p-6 text-center text-xs text-slate-500 italic">Memuat log sanksi...</div>
          ) : sanctionLogs.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-500 italic">Belum ada sanksi yang diterbitkan.</div>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-100 dark:bg-slate-800/60 font-bold uppercase text-slate-700 dark:text-slate-300">
                <tr>
                  <th className="p-3">Nama Siswa</th>
                  <th className="p-3">Kelas</th>
                  <th className="p-3">Tingkat Sanksi</th>
                  <th className="p-3 text-center">Akumulasi Poin</th>
                  <th className="p-3">Status Sanksi</th>
                  <th className="p-3 text-center">Aksi Dokumen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {sanctionLogs.map((log: any) => (
                  <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
                    <td className="p-3 font-bold text-slate-900 dark:text-white">
                      {log.studentName || `Siswa #${log.studentId}`}
                    </td>
                    <td className="p-3 text-slate-600 dark:text-slate-400">{log.className || "-"}</td>
                    <td className="p-3 font-semibold text-rose-600 dark:text-rose-400">
                      {log.sanctionType ? log.sanctionType.replace(/_/g, " ") : "PEMBINAAN BK"}
                    </td>
                    <td className="p-3 text-center font-bold text-rose-700 dark:text-rose-400">
                      {log.cumulativePoints || 0} Poin
                    </td>
                    <td className="p-3">
                      <Badge className="bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300">
                        {log.status || "TERBIT"}
                      </Badge>
                    </td>
                    <td className="p-3 text-center">
                      <Link href="/discipline/sanctions">
                        <Button size="sm" variant="outline" className="h-7 text-[11px] font-bold gap-1 text-indigo-600 border-indigo-200 hover:bg-indigo-50">
                          <Printer className="w-3 h-3" />
                          Cetak SP
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon: Icon,
  color,
  href,
  change,
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  color: "indigo" | "purple" | "emerald" | "amber" | "rose";
  href: string;
  change: string;
}) {
  const colors = {
    indigo: { 
      border: "border-t-indigo-500", 
      bgHover: "hover:border-indigo-200 dark:hover:border-indigo-800",
      iconBg: "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400",
      gradient: "from-indigo-50 dark:from-indigo-950/20"
    },
    purple: { 
      border: "border-t-purple-500", 
      bgHover: "hover:border-purple-200 dark:hover:border-purple-800",
      iconBg: "bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400",
      gradient: "from-purple-50 dark:from-purple-950/20"
    },
    emerald: { 
      border: "border-t-emerald-500", 
      bgHover: "hover:border-emerald-200 dark:hover:border-emerald-800",
      iconBg: "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400",
      gradient: "from-emerald-50 dark:from-emerald-950/20"
    },
    amber: { 
      border: "border-t-amber-500", 
      bgHover: "hover:border-amber-200 dark:hover:border-amber-800",
      iconBg: "bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400",
      gradient: "from-amber-50 dark:from-amber-950/20"
    },
    rose: { 
      border: "border-t-rose-500", 
      bgHover: "hover:border-rose-200 dark:hover:border-rose-800",
      iconBg: "bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400",
      gradient: "from-rose-50 dark:from-rose-950/20"
    },
  };
  const c = colors[color];

  return (
    <Link href={href} className="block">
      <Card className={`relative overflow-hidden border-t-4 ${c.border} ${c.bgHover} hover:shadow-xl transition-all duration-300 group h-full`}>
        <div className={`absolute inset-0 bg-gradient-to-br ${c.gradient} to-transparent opacity-0 group-hover:opacity-100 transition-opacity`}></div>
        <CardContent className="p-5 relative z-10 flex flex-col h-full justify-between gap-4">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
              <h3 className="text-3xl font-extrabold text-gray-900 dark:text-white">{value}</h3>
            </div>
            <div className={`h-10 w-10 rounded-xl ${c.iconBg} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
              <Icon className="h-5 w-5" />
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500 bg-gray-50 dark:bg-gray-800/50 px-2.5 py-1.5 rounded-md w-max border border-gray-100 dark:border-gray-800">
            <TrendingUp className="h-3.5 w-3.5" /> {change}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
