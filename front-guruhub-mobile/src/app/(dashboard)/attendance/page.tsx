"use client";
import { showAlert } from "@/utils/alert";

import { useEffect, useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { attendanceService } from "@/services/attendance";
import { schedulesService } from "@/services/schedules";
import { classMembersService } from "@/services/class-members";
import { classesService } from "@/services/classes";
import { subjectsService } from "@/services/subjects";
import { teachersService } from "@/services/teachers";
import type { Attendance, Schedule, ClassMember, AttendanceStatus, Class, Subject, Teacher } from "@/types";
import { ClipboardCheck, Plus, Calendar, ArrowLeft, Check, Info, Printer, FileText, Users } from "lucide-react";
import { toast } from "sonner";
import { PrintHeader } from "@/components/PrintHeader";
import { cn, formatDate, formatTime } from "@/lib/utils";

const STATUS_LIST: { value: AttendanceStatus; label: string; color: string; activeColor: string }[] = [
  { value: "PRESENT", label: "Hadir", color: "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300", activeColor: "bg-emerald-500 text-white font-bold" },
  { value: "SICK", label: "Sakit", color: "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300", activeColor: "bg-amber-500 text-white font-bold" },
  { value: "PERMISSION", label: "Izin", color: "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300", activeColor: "bg-blue-500 text-white font-bold" },
  { value: "ABSENT", label: "Alfa", color: "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300", activeColor: "bg-rose-500 text-white font-bold" },
];

export default function MobileAttendancePage() {
  const searchParams = useSearchParams();

  // Tab State
  const [activeTab, setActiveTab] = useState<"sessions" | "daily" | "monthly">("sessions");
  const [isCreating, setIsCreating] = useState(false);

  // Query Lookups
  const { data: rawAttendances = [], isLoading: loadingAttendances, refetch: refetchAttendances } = useQuery<Attendance[]>({ 
    queryKey: ["attendances"],
    queryFn: async () => {
      const attList = await attendanceService.getAll().catch(() => []);
      return Promise.all(
        attList.map(async (att) => {
          try {
            return await attendanceService.getById(att.id);
          } catch {
            return att;
          }
        })
      );
    }
  });

  const { data: rawSchedules = [], isLoading: loadingSchedules } = useQuery<Schedule[]>({ 
    queryKey: ["schedules"],
    queryFn: () => schedulesService.getAll(),
  });

  const { data: classes = [], isLoading: loadingClasses } = useQuery<Class[]>({ 
    queryKey: ["classes"],
    queryFn: () => classesService.getAll(),
  });

  const { data: subjects = [], isLoading: loadingSubjects } = useQuery<Subject[]>({ 
    queryKey: ["subjects"],
    queryFn: () => subjectsService.getAll(),
  });

  const { data: teachers = [], isLoading: loadingTeachers } = useQuery<Teacher[]>({ 
    queryKey: ["teachers"],
    queryFn: () => teachersService.getAll(),
  });

  const schedules = useMemo(() => {
    return rawSchedules.map((sched) => ({
      ...sched,
      class: classes.find((c) => c.id === sched.classId),
      subject: subjects.find((sub) => sub.id === sched.subjectId),
      teacher: teachers.find((t) => t.id === sched.teacherId),
    }));
  }, [rawSchedules, classes, subjects, teachers]);

  const attendances = useMemo(() => {
    return rawAttendances.map((att) => {
      const sched = schedules.find((s) => s.id === att.scheduleId);
      return {
        ...att,
        schedule: sched,
      };
    });
  }, [rawAttendances, schedules]);

  const loading = loadingAttendances || loadingSchedules || loadingClasses || loadingSubjects || loadingTeachers;

  // Create Form States
  const [scheduleId, setScheduleId] = useState<string>("");
  const [attendanceDate, setAttendanceDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");
  const [classMembers, setClassMembers] = useState<ClassMember[]>([]);
  const [details, setDetails] = useState<Record<number, { status: AttendanceStatus; notes: string }>>({});
  const [submitting, setSubmitting] = useState(false);

  // Recap Filter States
  const [recapClassId, setRecapClassId] = useState<string>("");
  const [recapDate, setRecapDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [recapMonth, setRecapMonth] = useState<string>(new Date().toISOString().slice(0, 7));

  // Daily Recap Load States
  const [dailySessions, setDailySessions] = useState<Attendance[]>([]);
  const [dailyDetailsMap, setDailyDetailsMap] = useState<Record<number, Record<number, string>>>({});
  const [recapMembers, setRecapMembers] = useState<ClassMember[]>([]);
  const [loadingDaily, setLoadingDaily] = useState(false);

  // Monthly Recap Load States
  const [monthlyRecapData, setMonthlyRecapData] = useState<any>(null);
  const [loadingMonthly, setLoadingMonthly] = useState(false);

  useEffect(() => {
    if (classes.length > 0 && !recapClassId) {
      setRecapClassId(String(classes[0].id));
    }
  }, [classes, recapClassId]);

  useEffect(() => {
    const queryScheduleId = searchParams.get("scheduleId");
    if (queryScheduleId) {
      setScheduleId(queryScheduleId);
      setIsCreating(true);
    } else if (schedules.length > 0 && !scheduleId) {
      setScheduleId(String(schedules[0].id));
    }
  }, [searchParams, schedules, scheduleId]);

  // Load students for Create Form
  useEffect(() => {
    if (!scheduleId || schedules.length === 0) return;
    const selectedSchedule = schedules.find((s) => s.id === Number(scheduleId));
    if (!selectedSchedule) return;

    const fetchStudents = async () => {
      try {
        const members = await classMembersService.getAll({ classId: selectedSchedule.classId });
        setClassMembers(members);

        const initDetails: Record<number, { status: AttendanceStatus; notes: string }> = {};
        members.forEach((m) => {
          if (m.studentId) {
            initDetails[m.studentId] = { status: "PRESENT", notes: "" };
          }
        });
        setDetails(initDetails);
      } catch (err) {
        toast.error("Gagal memuat daftar siswa");
      }
    };

    fetchStudents();
  }, [scheduleId, schedules]);

  // Load Daily Recap Data
  const fetchDailyRecap = async () => {
    if (!recapClassId) return;
    setLoadingDaily(true);
    try {
      const sessions = await attendanceService.getAll({
        classId: Number(recapClassId),
        attendanceDate: recapDate,
      });
      
      const enrichedSessions = sessions.map((sess) => {
        const sched = schedules.find((s) => s.id === sess.scheduleId);
        return {
          ...sess,
          schedule: sched,
        };
      });
      setDailySessions(enrichedSessions);

      const members = await classMembersService.getAll({ classId: Number(recapClassId) });
      setRecapMembers(members);

      if (sessions.length > 0) {
        const results = await Promise.all(
          sessions.map(async (s) => {
            const fullDetails = await attendanceService.getById(s.id);
            return { sessionId: s.id, details: fullDetails?.details ?? [] };
          })
        );

        const map: Record<number, Record<number, string>> = {};
        results.forEach((res) => {
          (res.details ?? []).forEach((d) => {
            if (!map[d.studentId]) map[d.studentId] = {};
            map[d.studentId][res.sessionId] = d.status;
          });
        });
        setDailyDetailsMap(map);
      } else {
        setDailyDetailsMap({});
      }
    } catch (err) {
      toast.error("Gagal memuat rekap harian");
    } finally {
      setLoadingDaily(false);
    }
  };

  useEffect(() => {
    if (activeTab === "daily") {
      fetchDailyRecap();
    }
  }, [activeTab, recapClassId, recapDate]);

  // Load Monthly Recap Data
  const fetchMonthlyRecap = async () => {
    if (!recapClassId) return;
    setLoadingMonthly(true);
    try {
      const recap = await attendanceService.getRecap(Number(recapClassId), recapMonth);
      setMonthlyRecapData(recap);
    } catch (err) {
      toast.error("Gagal memuat rekap bulanan");
    } finally {
      setLoadingMonthly(false);
    }
  };

  useEffect(() => {
    if (activeTab === "monthly") {
      fetchMonthlyRecap();
    }
  }, [activeTab, recapClassId, recapMonth]);

  const handleStatusChange = (studentId: number, status: AttendanceStatus) => {
    setDetails((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        status,
      },
    }));
  };

  const handleStudentNoteChange = (studentId: number, studentNote: string) => {
    setDetails((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        notes: studentNote,
      },
    }));
  };

  const markAll = (status: AttendanceStatus) => {
    setDetails((prev) => {
      const updated = { ...prev };
      Object.keys(updated).forEach((k) => {
        updated[Number(k)] = { ...updated[Number(k)], status };
      });
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduleId) {
      toast.error("Silakan pilih jadwal terlebih dahulu");
      return;
    }

    setSubmitting(true);
    try {
      const detailsArray = Object.entries(details).map(([studentIdStr, detailVal]) => ({
        studentId: Number(studentIdStr),
        status: detailVal.status,
        notes: detailVal.notes || undefined,
      }));

      await attendanceService.create({
        scheduleId: Number(scheduleId),
        attendanceDate,
        notes: notes || undefined,
        details: detailsArray,
      });

      toast.success("Absensi berhasil disimpan!");
      showAlert("Berhasil", "Absensi berhasil disimpan!", "success");
      setIsCreating(false);
      refetchAttendances();
    } catch (err: any) {
      toast.error(err.message || "Gagal menyimpan absensi");
    } finally {
      setSubmitting(false);
    }
  };

  const handlePrint = () => {
    const originalTitle = document.title;
    const className = classes.find((c) => String(c.id) === String(recapClassId))?.name ?? "—";
    const cleanClassName = className.replace(/[^a-zA-Z0-9]/g, "_");
    if (activeTab === "daily") {
      document.title = `Rekap_Absensi_Harian_Kelas_${cleanClassName}_${recapDate}`;
    } else {
      document.title = `Rekap_Absensi_Bulanan_Kelas_${cleanClassName}_${recapMonth}`;
    }
    window.print();
    document.title = originalTitle;
  };

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
  const selectedClassName = classes.find((c) => String(c.id) === String(recapClassId))?.name ?? "—";

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
        <span className="text-xs text-gray-500 dark:text-gray-400">Memuat halaman...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* HEADER SECTION */}
      <div className="flex justify-between items-center bg-white dark:bg-gray-900 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm no-print">
        <div className="flex items-center gap-2">
          {isCreating ? (
            <button
              onClick={() => setIsCreating(false)}
              className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          ) : (
            <ClipboardCheck className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          )}
          <span className="text-sm font-bold text-gray-900 dark:text-white">
            {isCreating ? "Input Absensi Baru" : "Absensi Siswa"}
          </span>
        </div>

        <div className="flex gap-2">
          {!isCreating && activeTab !== "sessions" && (
            <button
              onClick={handlePrint}
              className="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-indigo-600 transition-colors"
              title="Cetak PDF"
            >
              <Printer className="h-4 w-4" />
            </button>
          )}
          {!isCreating && (
            <button
              onClick={() => setIsCreating(true)}
              className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 shadow-sm"
            >
              <Plus className="h-4 w-4" />
              Input
            </button>
          )}
        </div>
      </div>

      {/* TABS SELECTOR (no-print) */}
      {!isCreating && (
        <div className="flex bg-white dark:bg-gray-900 p-1 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm no-print">
          {(["sessions", "daily", "monthly"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "flex-1 py-2 text-[11px] font-bold rounded-lg transition-all text-center",
                activeTab === tab
                  ? "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400"
                  : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              )}
            >
              {tab === "sessions" ? "Sesi Absensi" : tab === "daily" ? "Rekap Harian" : "Rekap Bulanan"}
            </button>
          ))}
        </div>
      )}

      {/* FILTER PANEL FOR RECAPS */}
      {!isCreating && activeTab !== "sessions" && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 shadow-sm grid grid-cols-2 gap-3 no-print">
          <div className="space-y-1">
            <label className="text-[9px] uppercase font-bold text-gray-400">Kelas</label>
            <select
              value={recapClassId}
              onChange={(e) => setRecapClassId(e.target.value)}
              className="w-full px-2 py-1.5 text-xs bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
            >
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {activeTab === "daily" ? (
            <div className="space-y-1">
              <label className="text-[9px] uppercase font-bold text-gray-400">Tanggal</label>
              <input
                type="date"
                value={recapDate}
                onChange={(e) => setRecapDate(e.target.value)}
                className="w-full px-2 py-1.5 text-xs bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
              />
            </div>
          ) : (
            <div className="space-y-1">
              <label className="text-[9px] uppercase font-bold text-gray-400">Bulan</label>
              <input
                type="month"
                value={recapMonth}
                onChange={(e) => setRecapMonth(e.target.value)}
                className="w-full px-2 py-1.5 text-xs bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
              />
            </div>
          )}
        </div>
      )}

      {/* CREATE FORM VIEW */}
      {isCreating && (
        <form onSubmit={handleSubmit} className="space-y-4 no-print">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 shadow-sm space-y-3">
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-gray-500 dark:text-gray-400">
                Pilih Jadwal Mengajar
              </label>
              <select
                value={scheduleId}
                onChange={(e) => setScheduleId(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white"
              >
                {schedules.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.dayOfWeek} • Kelas {s.class?.name} • Mapel {s.subject?.name} ({formatTime(s.startTime)} - {formatTime(s.endTime)})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-gray-500 dark:text-gray-400">
                Tanggal Absensi
              </label>
              <input
                type="date"
                value={attendanceDate}
                onChange={(e) => setAttendanceDate(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-gray-500 dark:text-gray-400">
                Catatan Absensi (Opsional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Misal: Kelas digabung, jam pelajaran berkurang"
                rows={2}
                className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white"
              />
            </div>

            <div className="flex items-center gap-1.5 pt-2">
              <span className="text-[9px] text-gray-500 font-bold mr-1">Set Semua:</span>
              {STATUS_LIST.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => markAll(s.value)}
                  className="px-2 py-1 rounded-md text-[9px] font-bold border border-gray-200 dark:border-gray-850 hover:bg-gray-100 text-gray-700 dark:text-gray-300"
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-bold text-gray-700 dark:text-gray-300 px-1">
              Daftar Kehadiran Siswa ({classMembers.length} Orang)
            </h4>

            {classMembers.length === 0 ? (
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 text-center text-xs text-gray-500 dark:text-gray-400">
                Belum ada siswa terdaftar di kelas untuk jadwal ini.
              </div>
            ) : (
              classMembers.map((member, index) => {
                const sId = member.studentId!;
                const currentSelection = details[sId]?.status || "PRESENT";

                return (
                  <div
                    key={member.id}
                    className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 shadow-sm space-y-3"
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-gray-400 w-5">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-gray-950 dark:text-white">
                            {member.student?.name}
                          </span>
                          <span className="text-[9px] text-gray-400">NISN: {member.student?.nisn}</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-2">
                      {STATUS_LIST.map((stat) => {
                        const isSel = currentSelection === stat.value;
                        return (
                          <button
                            key={stat.value}
                            type="button"
                            onClick={() => handleStatusChange(sId, stat.value)}
                            className={`py-2 text-[10px] font-semibold rounded-lg text-center transition-all ${
                              isSel ? stat.activeColor : stat.color
                            } active:scale-95`}
                          >
                            {stat.label}
                          </button>
                        );
                      })}
                    </div>

                    <input
                      type="text"
                      placeholder="Catatan individu (cth: Terlambat 15 menit, dispensasi)"
                      value={details[sId]?.notes || ""}
                      onChange={(e) => handleStudentNoteChange(sId, e.target.value)}
                      className="w-full px-2.5 py-1.5 text-[10px] bg-gray-50 dark:bg-gray-850 border border-gray-200 dark:border-gray-800 rounded-lg focus:outline-none text-gray-900 dark:text-white"
                    />
                  </div>
                );
              })
            )}
          </div>

          {classMembers.length > 0 && (
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-2"
            >
              {submitting ? (
                <div className="h-4 w-4 border-2 border-white border-t-transparent animate-spin rounded-full" />
              ) : (
                <>
                  <Check className="h-4.5 w-4.5" />
                  Simpan Absensi
                </>
              )}
            </button>
          )}
        </form>
      )}

      {/* TABS CONTENT: SESSIONS LIST */}
      {!isCreating && activeTab === "sessions" && (
        <div className="space-y-3 no-print">
          {attendances.length === 0 ? (
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-8 text-center text-xs text-gray-500 dark:text-gray-400 shadow-sm">
              <Info className="h-8 w-8 text-indigo-400 mx-auto mb-2" />
              Belum ada riwayat pengisian absensi siswa.
            </div>
          ) : (
            attendances.map((att) => {
              const presentCount = att.details?.filter((d) => d.status === "PRESENT").length || 0;
              const sickCount = att.details?.filter((d) => d.status === "SICK").length || 0;
              const permCount = att.details?.filter((d) => d.status === "PERMISSION").length || 0;
              const absCount = att.details?.filter((d) => d.status === "ABSENT").length || 0;

              return (
                <div
                  key={att.id}
                  className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 shadow-sm space-y-3"
                >
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-gray-900 dark:text-white">
                        Kelas {att.schedule?.class?.name || "-"} • Mapel {att.schedule?.subject?.name || "-"}
                      </h4>
                      <p className="text-[10px] text-gray-500 dark:text-gray-400">
                        Guru: {att.schedule?.teacher?.name || "-"}
                      </p>
                      <div className="flex items-center gap-1.5 text-[9px] text-gray-400 mt-2 font-medium">
                        <Calendar className="h-3.5 w-3.5 text-indigo-500" />
                        {formatDate(att.attendanceDate)}{" "}
                        ({att.schedule?.startTime ? formatTime(att.schedule.startTime) : "—"} - {att.schedule?.endTime ? formatTime(att.schedule.endTime) : "—"})
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-2 pt-3 border-t border-gray-100 dark:border-gray-800">
                    <div className="text-center py-1 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 rounded-lg">
                      <div className="text-[11px] font-bold">{presentCount}</div>
                      <div className="text-[8px] font-medium">Hadir</div>
                    </div>
                    <div className="text-center py-1 bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 rounded-lg">
                      <div className="text-[11px] font-bold">{sickCount}</div>
                      <div className="text-[8px] font-medium">Sakit</div>
                    </div>
                    <div className="text-center py-1 bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400 rounded-lg">
                      <div className="text-[11px] font-bold">{permCount}</div>
                      <div className="text-[8px] font-medium">Izin</div>
                    </div>
                    <div className="text-center py-1 bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400 rounded-lg">
                      <div className="text-[11px] font-bold">{absCount}</div>
                      <div className="text-[8px] font-medium">Alfa</div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* TABS CONTENT: DAILY RECAP */}
      {!isCreating && activeTab === "daily" && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 shadow-sm print:p-0 print:border-none print:shadow-none">
            
            {/* Kop Surat */}
            <PrintHeader 
              title="Laporan Rekapitulasi Absensi Harian Siswa" 
              subtitle={`Kelas: ${selectedClassName}`}
              metadata={[
                { label: "Tanggal", value: formatDate(recapDate) },
                { label: "Kelas", value: selectedClassName },
                { label: "Sesi Hari Ini", value: `${dailySessions.length} Sesi Terlaksana` }
              ]}
            />

            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800 mb-3 print:hidden">
              <div className="flex items-center gap-1.5">
                <Calendar className="h-4.5 w-4.5 text-indigo-600" />
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                  Rekap Harian: {formatDate(recapDate)}
                </span>
              </div>
              <span className="text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-full">
                {dailySessions.length} Sesi
              </span>
            </div>

            {loadingDaily ? (
              <div className="flex justify-center py-8">
                <div className="h-6 w-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : recapMembers.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-xs">Tidak ada siswa di kelas ini.</div>
            ) : dailySessions.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-xs">Tidak ada sesi absensi yang tercatat untuk kelas dan tanggal ini.</div>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-800">
                <table className="w-full text-left text-[11px] border-collapse">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300">
                      <th className="p-2 font-bold w-8 text-center">No</th>
                      <th className="p-2 font-bold">Nama Siswa</th>
                      {dailySessions.map((session) => {
                        const sched = schedules.find((s) => s.id === session.scheduleId);
                        return (
                          <th key={session.id} className="p-2 font-bold text-center border-l border-gray-200 dark:border-gray-800">
                            <span className="block">{sched?.subject?.name || "Mapel"}</span>
                            <span className="text-[9px] font-normal text-gray-400">{sched?.startTime ? formatTime(sched.startTime) : "—"}</span>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                    {recapMembers.map((member, idx) => {
                      const studentId = member.studentId!;
                      return (
                        <tr key={studentId} className="hover:bg-gray-50 dark:hover:bg-gray-850">
                          <td className="p-2 text-center">{idx + 1}</td>
                          <td className="p-2 font-medium text-gray-900 dark:text-gray-100 max-w-[120px] truncate">{member.student?.name}</td>
                          {dailySessions.map((session) => {
                            const status = dailyDetailsMap[studentId]?.[session.id] as AttendanceStatus | undefined;
                            return (
                              <td key={session.id} className="p-2 text-center border-l border-gray-200 dark:border-gray-800 font-bold">
                                {status ? (
                                  <span className={cn(
                                    "px-1.5 py-0.5 rounded text-[9px] uppercase font-black",
                                    status === "PRESENT" && "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400",
                                    status === "SICK" && "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400",
                                    status === "PERMISSION" && "bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-400",
                                    status === "ABSENT" && "bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-400"
                                  )}>
                                    {status === "PRESENT" ? "H" : status === "SICK" ? "S" : status === "PERMISSION" ? "I" : "A"}
                                  </span>
                                ) : (
                                  <span className="text-gray-300">—</span>
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

      {/* TABS CONTENT: MONTHLY RECAP */}
      {!isCreating && activeTab === "monthly" && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 shadow-sm print:p-0 print:border-none print:shadow-none">
            
            {/* Kop Surat */}
            <PrintHeader 
              title="Laporan Rekapitulasi Absensi Bulanan Siswa" 
              subtitle={`Kelas: ${selectedClassName}`}
              metadata={[
                { label: "Bulan / Tahun", value: recapMonth },
                { label: "Kelas", value: selectedClassName },
                { label: "Total Hari Aktif", value: `${monthlyRecapData?.dates?.length ?? 0} Hari Absensi` }
              ]}
            />

            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800 mb-3 print:hidden">
              <div className="flex items-center gap-1.5">
                <FileText className="h-4.5 w-4.5 text-indigo-600" />
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                  Rekap Bulanan: {recapMonth}
                </span>
              </div>
              <span className="text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-full">
                {monthlyRecapData?.dates?.length ?? 0} Hari
              </span>
            </div>

            {loadingMonthly ? (
              <div className="flex justify-center py-8">
                <div className="h-6 w-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : !monthlyRecapData || monthlyRecapData.students.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-xs">Tidak ada data rekapitulasi untuk bulan ini.</div>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-800">
                <table className="w-full text-left text-[11px] border-collapse">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300">
                      <th className="p-2 font-bold w-8 text-center">No</th>
                      <th className="p-2 font-bold">Nama Siswa</th>
                      {daysInSelectedMonth.map((day) => (
                        <th key={day.getDate()} className="p-1 font-bold text-center border-l border-gray-200 dark:border-gray-850 w-5 text-[9px]">
                          {day.getDate()}
                        </th>
                      ))}
                      <th className="p-1.5 font-bold text-center border-l border-gray-200 dark:border-gray-800 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600">H</th>
                      <th className="p-1.5 font-bold text-center border-l border-gray-200 dark:border-gray-800 bg-amber-50 dark:bg-amber-950/20 text-amber-600">S</th>
                      <th className="p-1.5 font-bold text-center border-l border-gray-200 dark:border-gray-800 bg-blue-50 dark:bg-blue-950/20 text-blue-600">I</th>
                      <th className="p-1.5 font-bold text-center border-l border-gray-200 dark:border-gray-800 bg-rose-50 dark:bg-rose-950/20 text-rose-600">A</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                    {monthlyRecapData.students.map((student: any, idx: number) => {
                      return (
                        <tr key={student.studentId} className="hover:bg-gray-50 dark:hover:bg-gray-850">
                          <td className="p-2 text-center">{idx + 1}</td>
                          <td className="p-2 font-medium text-gray-900 dark:text-gray-100 max-w-[100px] truncate">{student.studentName}</td>
                          {daysInSelectedMonth.map((day) => {
                            const dateStr = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, "0")}-${String(day.getDate()).padStart(2, "0")}`;
                            const status = student.dailyStatus[dateStr];
                            return (
                              <td key={day.getDate()} className="p-1 text-center border-l border-gray-200 dark:border-gray-850 text-[9px] font-bold">
                                {status ? (
                                  <span className={cn(
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
                          <td className="p-1.5 text-center border-l border-gray-200 dark:border-gray-800 font-bold bg-emerald-50/50 dark:bg-emerald-950/10 text-emerald-600">{student.summary.PRESENT}</td>
                          <td className="p-1.5 text-center border-l border-gray-200 dark:border-gray-800 font-bold bg-amber-50/50 dark:bg-amber-950/10 text-amber-600">{student.summary.SICK}</td>
                          <td className="p-1.5 text-center border-l border-gray-200 dark:border-gray-800 font-bold bg-blue-50/50 dark:bg-blue-950/10 text-blue-600">{student.summary.PERMISSION}</td>
                          <td className="p-1.5 text-center border-l border-gray-200 dark:border-gray-800 font-bold bg-rose-50/50 dark:bg-rose-950/10 text-rose-600">{student.summary.ABSENT}</td>
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
    </div>
  );
}
