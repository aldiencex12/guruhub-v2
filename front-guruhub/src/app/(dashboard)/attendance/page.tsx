"use client";

import { useState, useEffect } from "react";
import { ClipboardCheck, Plus, Eye, Trash2, Users, Printer, Calendar, FileText } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/tables/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, ConfirmDialog } from "@/components/ui/dialog";
import { PrintHeader } from "@/components/PrintHeader";
import { useAttendances, useCreateAttendance, useAttendance, useAttendanceRecap, useDeleteAttendance } from "@/queries/attendance.query";
import { useSchedules } from "@/queries/schedules.query";
import { useClassMembers } from "@/queries/class-members.query";
import { useClasses } from "@/queries/classes.query";
import { useSubjects } from "@/queries/subjects.query";
import { useTeachers } from "@/queries/teachers.query";
import { useAuthStore } from "@/store/auth.store";
import type { Attendance, AttendanceStatus, ClassMember } from "@/types";
import { getAttendanceColor, getAttendanceLabel, formatDate, formatTime, getTodayDateInput, getTodayMonthInput } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { attendanceService } from "@/services/attendance";

const STATUS_LIST: AttendanceStatus[] = ["PRESENT", "SICK", "PERMISSION", "ABSENT"];

export default function AttendancePage() {
  const { currentUser } = useAuthStore();
  const canEdit = ["SuperAdmin", "SchoolAdmin", "Principal", "Teacher"].includes(currentUser?.role || "");
  const canDelete = ["SuperAdmin", "SchoolAdmin", "Principal"].includes(currentUser?.role || "");

  const [activeTab, setActiveTab] = useState<"sessions" | "daily" | "monthly">("sessions");

  // Global lookups
  const { data: attendances = [], isLoading: isFetching } = useAttendances();
  const { data: schedules = [] } = useSchedules();
  const { data: classes = [] } = useClasses();
  const { data: subjects = [] } = useSubjects();
  const { data: teachers = [] } = useTeachers();

  const createAttendance = useCreateAttendance();
  const deleteAttendance = useDeleteAttendance();

  const [formDialog, setFormDialog] = useState(false);
  const [viewDialog, setViewDialog] = useState<Attendance | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<Attendance | null>(null);

  const { data: attendanceDetail, isLoading: isDetailLoading } = useAttendance(viewDialog?.id ?? 0);

  const handleDelete = async () => {
    if (!deleteDialog) return;
    try {
      await deleteAttendance.mutateAsync(deleteDialog.id);
      setDeleteDialog(null);
    } catch {}
  };

  // Form state
  const [scheduleId, setScheduleId] = useState<string>("");
  const [attendanceDate, setAttendanceDate] = useState<string>(getTodayDateInput());
  const [notes, setNotes] = useState("");
  const [details, setDetails] = useState<Record<number, { status: AttendanceStatus; notes: string }>>({});

  // Recap Filter states
  const [recapClassId, setRecapClassId] = useState<string>("");
  const [recapDate, setRecapDate] = useState<string>(getTodayDateInput());
  const [recapMonth, setRecapMonth] = useState<string>(getTodayMonthInput());

  // Sync default scheduleId when schedules load
  useEffect(() => {
    if (schedules.length > 0 && !scheduleId) {
      setScheduleId(String(schedules[0].id));
    }
  }, [schedules, scheduleId]);

  // Sync default recapClassId when classes load
  useEffect(() => {
    if (classes.length > 0 && !recapClassId) {
      setRecapClassId(String(classes[0].id));
    }
  }, [classes, recapClassId]);

  const selectedSchedule = schedules.find(s => s.id === Number(scheduleId));
  const selectedClassId = selectedSchedule?.classId ?? 0;

  const { data: classMembers = [], isLoading: isMembersLoading } = useClassMembers({
    classId: selectedClassId,
  });

  // Sync details when class members change
  useEffect(() => {
    if (classMembers.length > 0) {
      const initDetails: Record<number, { status: AttendanceStatus; notes: string }> = {};
      classMembers.forEach(m => {
        if (m.studentId) {
          initDetails[m.studentId] = { status: "PRESENT", notes: "" };
        }
      });
      setDetails(initDetails);
    } else {
      // Reset to empty object when no members loaded yet (prevents null/undefined)
      setDetails(prev => Object.keys(prev).length === 0 ? prev : {});
    }
  }, [classMembers]);

  // ----------------------------------------------------
  // DAILY RECAP QUERIES
  // ----------------------------------------------------
  // Fetch sessions for selected class & date
  const { data: dailySessions = [], isLoading: isDailySessionsLoading } = useAttendances(
    activeTab === "daily" && recapClassId
      ? { classId: Number(recapClassId), attendanceDate: recapDate }
      : undefined
  );

  // Fetch student details for all sessions on that day in parallel
  const { data: dailyDetailsMap = {}, isLoading: isDailyDetailsLoading } = useQuery({
    queryKey: ["dailyDetails", dailySessions.map(s => s.id)],
    queryFn: async () => {
      if (dailySessions.length === 0) return {};
      const results = await Promise.all(
        dailySessions.map(async (s) => {
          const fullDetails = await attendanceService.getById(s.id);
          return { sessionId: s.id, details: fullDetails?.details ?? [] };
        })
      );
      // Map to studentId -> sessionId -> status
      const map: Record<number, Record<number, string>> = {};
      results.forEach(res => {
        (res.details ?? []).forEach(d => {
          if (!map[d.studentId]) map[d.studentId] = {};
          map[d.studentId][res.sessionId] = d.status;
        });
      });
      return map;
    },
    enabled: activeTab === "daily" && dailySessions.length > 0,
  });

  const { data: recapMembers = [], isLoading: isRecapMembersLoading } = useClassMembers(
    activeTab === "daily" && recapClassId ? { classId: Number(recapClassId) } : { classId: 0 }
  );

  // ----------------------------------------------------
  // MONTHLY RECAP QUERY
  // ----------------------------------------------------
  const { data: monthlyRecapData, isLoading: isMonthlyRecapLoading } = useAttendanceRecap(
    activeTab === "monthly" ? Number(recapClassId) : 0,
    recapMonth
  );

  const openForm = () => {
    if (schedules.length > 0 && !scheduleId) {
      setScheduleId(String(schedules[0].id));
    }
    setFormDialog(true);
  };

  const handleScheduleChange = (id: string) => {
    setScheduleId(id);
  };

  const handleSubmitAttendance = async () => {
    if (!scheduleId || !selectedSchedule) return;

    // Guard: details must be a non-null object before Object.entries
    const safeDetails = details ?? {};
    const detailList = Object.entries(safeDetails).map(([studentId, d]) => ({
      studentId: Number(studentId),
      status: d.status,
      notes: d.notes || undefined,
    }));

    try {
      await createAttendance.mutateAsync({
        scheduleId: Number(scheduleId),
        attendanceDate,
        notes: notes || undefined,
        details: detailList,
      });
      setFormDialog(false);
      setNotes("");
    } catch {}
  };

  const markAll = (status: AttendanceStatus) => {
    setDetails(prev => {
      const updated = { ...prev };
      Object.keys(updated).forEach(k => {
        updated[Number(k)] = { ...updated[Number(k)], status };
      });
      return updated;
    });
  };

  const handlePrint = () => {
    const originalTitle = document.title;
    const className = classes.find(c => String(c.id) === String(recapClassId))?.name ?? "—";
    const cleanClassName = className.replace(/[^a-zA-Z0-9]/g, "_");
    if (activeTab === "daily") {
      document.title = `Rekap_Absensi_Harian_Kelas_${cleanClassName}_${recapDate}`;
    } else {
      document.title = `Rekap_Absensi_Bulanan_Kelas_${cleanClassName}_${recapMonth}`;
    }
    window.print();
    document.title = originalTitle;
  };

  // Generate days array for month recap
  const getDaysInMonth = (monthStr: string) => {
    const [year, month] = monthStr.split("-").map(Number);
    const date = new Date(year, month - 1, 1);
    const days = [];
    while (date.getMonth() === month - 1) {
      days.push(new Date(date));
      date.setDate(date.getDate() + 1);
    }
    return days;
  };

  const daysInSelectedMonth = getDaysInMonth(recapMonth);

  const columns: ColumnDef<Attendance>[] = [
    { accessorKey: "attendanceDate", header: "Tanggal", cell: ({ getValue }) => formatDate(getValue() as string) },
    { id: "kelas", header: "Kelas", cell: ({ row }) => {
      const schedule = schedules.find(s => String(s.id) === String(row.original.scheduleId));
      const cls = classes.find(c => c.id === schedule?.classId);
      return <Badge variant="secondary">{cls?.name ?? "—"}</Badge>;
    }},
    { id: "mapel", header: "Mata Pelajaran", cell: ({ row }) => {
      const schedule = schedules.find(s => String(s.id) === String(row.original.scheduleId));
      const sub = subjects.find(su => su.id === schedule?.subjectId);
      return sub?.name ?? "—";
    }},
    { id: "guru", header: "Guru", cell: ({ row }) => {
      const schedule = schedules.find(s => String(s.id) === String(row.original.scheduleId));
      const teacher = teachers.find(t => t.id === schedule?.teacherId);
      return teacher?.name ?? "—";
    }},
    { id: "actions", header: "Aksi", cell: ({ row }) => (
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="sm" className="h-7" onClick={() => setViewDialog(row.original)}>
          <Eye className="h-3.5 w-3.5 mr-1" /> Lihat
        </Button>
        {canDelete && (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-50"
            onClick={() => setDeleteDialog(row.original)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    )},
  ];

  const selectedClassName = classes.find(c => String(c.id) === String(recapClassId))?.name ?? "—";

  return (
    <div className="space-y-6">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 no-print">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <ClipboardCheck className="h-6 w-6 text-emerald-600" /> Absensi Siswa
          </h1>
          <p className="text-sm text-gray-500 mt-1">Kelola dan tinjau kehadiran harian & bulanan siswa</p>
        </div>
        <div className="flex items-center gap-2">
          {activeTab !== "sessions" && (
            <Button variant="outline" onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-2" /> Cetak PDF
            </Button>
          )}
          <Button onClick={openForm} disabled={schedules.length === 0}>
            <Plus className="h-4 w-4 mr-2" /> Input Absensi
          </Button>
        </div>
      </div>

      {/* TABS SELECTOR */}
      <div className="border-b border-gray-200 dark:border-gray-800 no-print">
        <nav className="flex space-x-6" aria-label="Tabs">
          {(["sessions", "daily", "monthly"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "py-3 px-1 border-b-2 font-medium text-sm transition-all focus:outline-none capitalize",
                activeTab === tab
                  ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              )}
            >
              {tab === "sessions" ? "Sesi Absensi" : tab === "daily" ? "Rekap Harian" : "Rekap Bulanan"}
            </button>
          ))}
        </nav>
      </div>

      {/* FILTER PANEL FOR RECAPS */}
      {activeTab !== "sessions" && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 grid grid-cols-1 md:grid-cols-3 gap-4 no-print">
          <div className="space-y-1.5">
            <Label>Kelas</Label>
            <Select value={recapClassId} onChange={e => setRecapClassId(e.target.value)}>
              {classes.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </Select>
          </div>

          {activeTab === "daily" ? (
            <div className="space-y-1.5">
              <Label>Tanggal</Label>
              <Input type="date" value={recapDate} onChange={e => setRecapDate(e.target.value)} />
            </div>
          ) : (
            <div className="space-y-1.5">
              <Label>Bulan</Label>
              <Input type="month" value={recapMonth} onChange={e => setRecapMonth(e.target.value)} />
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT 1: SESSIONS LIST */}
      {activeTab === "sessions" && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 no-print">
          {isFetching ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <div className="h-8 w-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-gray-500">Memuat data absensi...</p>
            </div>
          ) : (
            <DataTable columns={columns} data={attendances} searchPlaceholder="Cari..." emptyMessage="Belum ada data absensi." />
          )}
        </div>
      )}

      {/* TAB CONTENT 2: DAILY RECAP */}
      {activeTab === "daily" && (
        <div className="space-y-4">
          {/* Printable Layout Wrapper */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 print:p-0 print:border-none print:shadow-none">
            
            {/* Kop Surat */}
            <PrintHeader 
              title="Laporan Rekapitulasi Absensi Harian Siswa" 
              orientation="portrait"
              metadata={[
                { label: "Tanggal", value: formatDate(recapDate) },
                { label: "Kelas", value: selectedClassName },
                { label: "Sesi Hari Ini", value: `${dailySessions.length} Sesi Terlaksana` }
              ]}
            />

            {/* Screen Header Info */}
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-800 mb-4 print:hidden">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-indigo-600" />
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Hasil Rekap Tanggal: {formatDate(recapDate)}
                </span>
              </div>
              <Badge variant="info">{dailySessions.length} Sesi Terlaksana</Badge>
            </div>

            {/* Daily Matrix Table */}
            {isDailySessionsLoading || isDailyDetailsLoading || isRecapMembersLoading ? (
              <div className="flex justify-center py-12">
                <div className="h-8 w-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : recapMembers.length === 0 ? (
              <div className="text-center py-12 text-gray-400">Tidak ada siswa di kelas ini.</div>
            ) : dailySessions.length === 0 ? (
              <div className="text-center py-12 text-gray-400">Tidak ada sesi absensi yang tercatat untuk kelas dan tanggal ini.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border border-gray-200 dark:border-gray-800">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300">
                      <th className="p-3 font-semibold w-12 text-center">No</th>
                      <th className="p-3 font-semibold w-28">NISN / NIS</th>
                      <th className="p-3 font-semibold">Nama Siswa</th>
                      {dailySessions.map((session, idx) => {
                        const sub = subjects.find(s => s.id === schedules.find(sc => sc.id === session.scheduleId)?.subjectId);
                        const sched = schedules.find(sc => sc.id === session.scheduleId);
                        return (
                          <th key={session.id} className="p-3 font-semibold text-center border-l border-gray-200 dark:border-gray-800">
                            <span className="block font-bold">{sub?.name ?? "Mapel"}</span>
                            <span className="text-[10px] text-gray-400 font-normal">{sched?.startTime ? formatTime(sched.startTime) : "—"}</span>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                    {recapMembers.map((member, idx) => {
                      const studentId = member.studentId;
                      return (
                        <tr key={studentId} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                          <td className="p-3 text-center">{idx + 1}</td>
                          <td className="p-3 text-gray-500">{member.student?.nisn ?? "—"} / {member.student?.nis ?? "—"}</td>
                          <td className="p-3 font-medium text-gray-900 dark:text-gray-100">{member.student?.name}</td>
                          {dailySessions.map((session) => {
                            const status = dailyDetailsMap[studentId]?.[session.id] as AttendanceStatus | undefined;
                            return (
                              <td key={session.id} className="p-3 text-center border-l border-gray-200 dark:border-gray-800 font-semibold">
                                {status ? (
                                  <span className={cn(
                                    "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                                    status === "PRESENT" && "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
                                    status === "SICK" && "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
                                    status === "PERMISSION" && "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
                                    status === "ABSENT" && "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                                  )}>
                                    {status === "PRESENT" ? "H" : status === "SICK" ? "S" : status === "PERMISSION" ? "I" : "A"}
                                  </span>
                                ) : (
                                  <span className="text-gray-400">—</span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB CONTENT 3: MONTHLY RECAP */}
      {activeTab === "monthly" && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 print:p-0 print:border-none print:shadow-none">
            
            {/* Kop Surat */}
            <PrintHeader 
              title="Laporan Rekapitulasi Absensi Bulanan Siswa" 
              orientation="landscape"
              metadata={[
                { label: "Bulan / Tahun", value: recapMonth },
                { label: "Kelas", value: selectedClassName },
                { label: "Total Hari Aktif", value: `${monthlyRecapData?.dates?.length ?? 0} Hari Absensi` }
              ]}
            />

            {/* Screen Info */}
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-800 mb-4 print:hidden">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-indigo-600" />
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Data Rekap Bulan: {recapMonth}
                </span>
              </div>
              <Badge variant="info">{monthlyRecapData?.dates?.length ?? 0} Hari Absensi Tercatat</Badge>
            </div>

            {isMonthlyRecapLoading ? (
              <div className="flex justify-center py-12">
                <div className="h-8 w-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : !monthlyRecapData || monthlyRecapData.students.length === 0 ? (
              <div className="text-center py-12 text-gray-400">Tidak ada data rekapitulasi untuk bulan ini.</div>
            ) : (
              <>
                <style dangerouslySetInnerHTML={{ __html: `
                  @media print {
                    .monthly-print-table {
                      table-layout: fixed !important;
                      width: 100% !important;
                      font-size: 7.5pt !important;
                    }
                    .monthly-print-table th, .monthly-print-table td {
                      padding: 2px 1px !important;
                      word-break: break-word !important;
                    }
                  }
                `}} />
                <div className="overflow-x-auto print:overflow-visible">
                  <table className="w-full text-left text-xs border border-gray-200 dark:border-gray-800 monthly-print-table">
                    <thead>
                      <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300">
                        <th className="p-2 font-semibold w-10 text-center print:w-[3%]">No</th>
                        <th className="p-2 font-semibold print:w-[22%]">Nama Siswa</th>
                        {daysInSelectedMonth.map(day => (
                          <th key={day.getDate()} className="p-1 font-semibold text-center border-l border-gray-200 dark:border-gray-800 w-6 print:w-[2.1%]">
                            {day.getDate()}
                          </th>
                        ))}
                        <th className="p-2 font-semibold text-center border-l border-gray-200 dark:border-gray-800 w-8 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 print:w-[2.5%]">H</th>
                        <th className="p-2 font-semibold text-center border-l border-gray-200 dark:border-gray-800 w-8 bg-amber-50 dark:bg-amber-950/20 text-amber-700 print:w-[2.5%]">S</th>
                        <th className="p-2 font-semibold text-center border-l border-gray-200 dark:border-gray-800 w-8 bg-blue-50 dark:bg-blue-950/20 text-blue-700 print:w-[2.5%]">I</th>
                        <th className="p-2 font-semibold text-center border-l border-gray-200 dark:border-gray-800 w-8 bg-rose-50 dark:bg-rose-950/20 text-rose-700 print:w-[2.5%]">A</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                      {monthlyRecapData.students.map((student: any, idx: number) => {
                        return (
                          <tr key={student.studentId} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                            <td className="p-2 text-center print:p-1">{idx + 1}</td>
                            <td className="p-2 font-medium text-gray-900 dark:text-gray-100 max-w-[150px] truncate print:max-w-none print:whitespace-normal print:p-1">{student.studentName}</td>
                            {daysInSelectedMonth.map(day => {
                              const dateStr = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`;
                              const status = student.dailyStatus[dateStr];
                              return (
                                <td key={day.getDate()} className="p-1 text-center border-l border-gray-200 dark:border-gray-800 text-[10px] print:text-[7.5pt] print:p-0.5">
                                  {status ? (
                                    <span className={cn(
                                      "font-bold",
                                      status === "PRESENT" && "text-emerald-600",
                                      status === "SICK" && "text-amber-600",
                                      status === "PERMISSION" && "text-blue-600",
                                      status === "ABSENT" && "text-rose-600"
                                    )}>
                                      {status === "PRESENT" ? "H" : status === "SICK" ? "S" : status === "PERMISSION" ? "I" : "A"}
                                    </span>
                                  ) : (
                                    <span className="text-gray-300">—</span>
                                  )}
                                </td>
                              );
                            })}
                            <td className="p-2 text-center border-l border-gray-200 dark:border-gray-800 font-bold bg-emerald-50/50 dark:bg-emerald-950/10 text-emerald-600 print:p-1">{student.summary.PRESENT}</td>
                            <td className="p-2 text-center border-l border-gray-200 dark:border-gray-800 font-bold bg-amber-50/50 dark:bg-amber-950/10 text-amber-600 print:p-1">{student.summary.SICK}</td>
                            <td className="p-2 text-center border-l border-gray-200 dark:border-gray-800 font-bold bg-blue-50/50 dark:bg-blue-950/10 text-blue-600 print:p-1">{student.summary.PERMISSION}</td>
                            <td className="p-2 text-center border-l border-gray-200 dark:border-gray-800 font-bold bg-rose-50/50 dark:bg-rose-950/10 text-rose-600 print:p-1">{student.summary.ABSENT}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Printable Signature Block */}
                <table className="hidden print:table w-full text-center text-xs text-black font-serif mt-6 border-collapse break-inside-avoid">
                  <tbody>
                    <tr>
                      <td className="w-1/2 vertical-top px-4">
                        <p className="font-semibold text-black">Wali Kelas,</p>
                        <div className="h-14" />
                        <p className="font-bold underline text-black">( .................................................... )</p>
                      </td>
                      <td className="w-1/2 vertical-top px-4">
                        <p className="font-semibold text-black">
                          Sidoarjo, {new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                        </p>
                        <p className="font-semibold text-black">Kepala Sekolah,</p>
                        <div className="h-14" />
                        <p className="font-bold underline text-black">Herwinda Rosita, S.E.</p>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </>
            )}
          </div>
        </div>
      )}
      {/* INPUT FORM DIALOG */}
      <Dialog open={formDialog} onClose={() => setFormDialog(false)} title="Input Absensi" description="Catat kehadiran siswa untuk sesi ini" size="xl">
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Pilih Jadwal *</Label>
              <Select value={scheduleId} onChange={e => handleScheduleChange(e.target.value)}>
                {schedules.map(s => {
                  const cls = classes.find(c => c.id === s.classId);
                  const sub = subjects.find(su => su.id === s.subjectId);
                  return (
                    <option key={s.id} value={s.id}>
                      {cls?.name ?? "—"} — {sub?.name ?? "—"} ({s.dayOfWeek} {formatTime(s.startTime)})
                    </option>
                  );
                })}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Tanggal *</Label>
              <Input type="date" value={attendanceDate} onChange={e => setAttendanceDate(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Catatan</Label>
            <Input placeholder="Catatan sesi (opsional)" value={notes} onChange={e => setNotes(e.target.value)} />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 mr-1">Tandai semua:</span>
            {STATUS_LIST.map(s => (
              <button
                key={s}
                type="button"
                onClick={() => markAll(s)}
                className={cn("px-2 py-1 rounded text-xs border font-medium transition-colors", getAttendanceColor(s))}
              >
                {getAttendanceLabel(s)}
              </button>
            ))}
          </div>

          <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="bg-gray-50 dark:bg-gray-800 px-4 py-2 flex items-center gap-2">
              <Users className="h-4 w-4 text-gray-400" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {classMembers.length} Siswa — {classes.find(c => c.id === selectedSchedule?.classId)?.name ?? "—"}
              </span>
            </div>
            <div className="divide-y divide-gray-100 dark:divide-gray-800 max-h-64 overflow-y-auto">
              {isMembersLoading ? (
                <div className="flex justify-center py-6">
                  <div className="h-5 w-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : classMembers.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-6">Tidak ada siswa di kelas ini</p>
              ) : classMembers.map((member) => {
                const studentId = member.studentId;
                const d = details[studentId] ?? { status: "PRESENT" as AttendanceStatus, notes: "" };
                return (
                  <div key={studentId} className="px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="text-sm font-medium text-gray-800 dark:text-gray-200">
                      {member.student?.name ?? `Siswa #${studentId}`}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
                      <div className="flex gap-1">
                        {STATUS_LIST.map(status => (
                          <button
                            key={status}
                            type="button"
                            onClick={() => setDetails(prev => ({ ...prev, [studentId]: { ...prev[studentId], status } }))}
                            className={cn(
                              "px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium border transition-all",
                              d.status === status
                                ? getAttendanceColor(status)
                                : "text-gray-400 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
                            )}
                          >
                            {getAttendanceLabel(status)}
                          </button>
                        ))}
                      </div>
                      <Input
                        placeholder="Catatan"
                        className="w-24 sm:w-32 h-7 text-xs"
                        value={d.notes}
                        onChange={e => setDetails(prev => ({ ...prev, [studentId]: { ...prev[studentId], notes: e.target.value } }))}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setFormDialog(false)}>Batal</Button>
            <Button onClick={handleSubmitAttendance} loading={createAttendance.isPending}>Simpan Absensi</Button>
          </div>
        </div>
      </Dialog>

      {/* VIEW DIALOG */}
      {viewDialog && (
        <Dialog open={!!viewDialog} onClose={() => setViewDialog(null)} title={`Absensi — ${formatDate(viewDialog.attendanceDate)}`} size="lg">
          <div className="space-y-3">
            {isDetailLoading ? (
              <div className="flex justify-center py-6">
                <div className="h-6 w-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <>
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 text-sm grid grid-cols-2 gap-2">
                  <div><span className="text-gray-500">Kelas:</span> <span className="font-medium">{classes.find(c => c.id === schedules.find(s => String(s.id) === String(viewDialog.scheduleId))?.classId)?.name ?? "—"}</span></div>
                  <div><span className="text-gray-500">Mapel:</span> <span className="font-medium">{subjects.find(sub => sub.id === schedules.find(s => String(s.id) === String(viewDialog.scheduleId))?.subjectId)?.name ?? "—"}</span></div>
                  <div><span className="text-gray-500">Guru:</span> <span className="font-medium">{teachers.find(t => t.id === schedules.find(s => String(s.id) === String(viewDialog.scheduleId))?.teacherId)?.name ?? "—"}</span></div>
                  <div><span className="text-gray-500">Catatan:</span> <span className="font-medium">{attendanceDetail?.notes || "—"}</span></div>
                </div>
                <div className="divide-y divide-gray-100 dark:divide-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                  {(!attendanceDetail?.details || attendanceDetail.details.length === 0) ? (
                    <div className="px-4 py-3 text-sm text-gray-500 text-center">Belum ada data detail.</div>
                  ) : (
                    attendanceDetail.details.map(d => (
                      <div key={d.id} className="flex items-center justify-between px-4 py-2.5">
                        <span className="text-sm text-gray-700 dark:text-gray-300">{d.studentName ?? d.student?.name ?? `Siswa #${d.studentId}`}</span>
                        <div className="flex items-center gap-2">
                           <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium border", getAttendanceColor(d.status))}>{getAttendanceLabel(d.status)}</span>
                          {d.notes && <span className="text-xs text-gray-400">{d.notes}</span>}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}
          </div>
        </Dialog>
      )}

      {/* CONFIRM DELETE DIALOG */}
      <ConfirmDialog
        open={!!deleteDialog}
        onClose={() => setDeleteDialog(null)}
        onConfirm={handleDelete}
        title="Hapus Sesi Absensi"
        description="Apakah Anda yakin ingin menghapus sesi absensi ini? Tindakan ini tidak dapat dibatalkan."
        loading={deleteAttendance.isPending}
      />
    </div>
  );
}
