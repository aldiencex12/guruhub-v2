"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { disciplineService } from "@/services/discipline";
import { classesService } from "@/services/classes";
import { schedulesService } from "@/services/schedules";
import { api } from "@/services/api";
import { PageHeader } from "@/components/core/PageHeader";
import { SectionCard } from "@/components/core/SectionCard";
import { LoadingState } from "@/components/core/LoadingState";
import { EmptyState } from "@/components/core/EmptyState";
import { ErrorState } from "@/components/core/ErrorState";
import { PrintHeader } from "@/components/PrintHeader";
import { useSchoolSettings } from "@/queries/schools.query";
import { toast } from "sonner";
import {
  ClipboardCheck,
  Users,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Printer,
  Info,
  Calendar,
  Search,
  ChevronRight,
  ShieldAlert,
  X,
  Save,
  CheckCircle,
  FileText
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function BKAttendanceRecapPage() {
  const currentMonthStr = new Date().toISOString().slice(0, 7); // "YYYY-MM"

  const [selectedClassId, setSelectedClassId] = useState<number>(0);
  const [recapType, setRecapType] = useState<"monthly" | "semester">("monthly");
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthStr);
  const [selectedSemester, setSelectedSemester] = useState<1 | 2>(1);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  const { data: school } = useSchoolSettings();

  // Fetch all classes
  const { data: classesData, isLoading: loadingClasses } = useQuery({
    queryKey: ["classes", "all"],
    queryFn: () => classesService.getAll({ limit: 200 }),
  });
  const allClasses: any[] = Array.isArray(classesData) ? classesData : [];

  // Auto-select first class if none selected
  React.useEffect(() => {
    if (allClasses.length > 0 && selectedClassId === 0) {
      setSelectedClassId(allClasses[0].id);
    }
  }, [allClasses, selectedClassId]);

  // Fetch Attendance Recap for selected class & period
  const {
    data: recapData,
    isLoading: loadingRecap,
    isError,
    refetch
  } = useQuery({
    queryKey: ["attendance-recap", selectedClassId, recapType, selectedMonth, selectedSemester, selectedYear],
    queryFn: async () => {
      if (!selectedClassId) return null;
      let url = `/attendances/recap?classId=${selectedClassId}`;
      if (recapType === "monthly") {
        url += `&month=${selectedMonth}`;
      } else {
        url += `&semester=${selectedSemester}&year=${selectedYear}`;
      }
      const res = await api.get(url);
      return res.data?.data || res.data || res;
    },
    enabled: selectedClassId > 0,
  });

  const students = recapData?.students || [];
  const dates: string[] = recapData?.dates || [];
  const semesterMonths: string[] = recapData?.months || [];
  const className = allClasses.find((c) => c.id === selectedClassId)?.name || recapData?.class?.name || "Kelas";

  // Calculate Totals across class
  const classTotalPresent = students.reduce((acc: number, s: any) => {
    return acc + (recapType === "monthly" ? (s.summary?.PRESENT || 0) : (s.grandTotal?.PRESENT || 0));
  }, 0);
  const classTotalSick = students.reduce((acc: number, s: any) => {
    return acc + (recapType === "monthly" ? (s.summary?.SICK || 0) : (s.grandTotal?.SICK || 0));
  }, 0);
  const classTotalPermission = students.reduce((acc: number, s: any) => {
    return acc + (recapType === "monthly" ? (s.summary?.PERMISSION || 0) : (s.grandTotal?.PERMISSION || 0));
  }, 0);
  const classTotalAbsent = students.reduce((acc: number, s: any) => {
    return acc + (recapType === "monthly" ? (s.summary?.ABSENT || 0) : (s.grandTotal?.ABSENT || 0));
  }, 0);

  // High Risk Alpha Students (Alpha >= 3 days)
  const highRiskStudents = students.filter((s: any) => {
    const totalAbsent = recapType === "monthly" ? (s.summary?.ABSENT || 0) : (s.grandTotal?.ABSENT || 0);
    return totalAbsent >= 3;
  });

  // Modal Input State
  const [isInputModalOpen, setIsInputModalOpen] = useState(false);
  const [inputDate, setInputDate] = useState(new Date().toISOString().slice(0, 10));
  const [classSchedules, setClassSchedules] = useState<any[]>([]);
  const [selectedScheduleId, setSelectedScheduleId] = useState<number>(0);
  const [studentStatuses, setStudentStatuses] = useState<Record<number, "PRESENT" | "SICK" | "PERMISSION" | "ABSENT">>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleOpenInputModal = () => {
    if (!selectedClassId) {
      toast.error("Pilih kelas terlebih dahulu");
      return;
    }
    const initialMap: Record<number, "PRESENT" | "SICK" | "PERMISSION" | "ABSENT"> = {};
    students.forEach((st: any) => {
      initialMap[st.studentId] = "PRESENT";
    });
    setStudentStatuses(initialMap);
    setIsInputModalOpen(true);
  };

  const handleSetAllPresent = () => {
    const updated: Record<number, "PRESENT" | "SICK" | "PERMISSION" | "ABSENT"> = {};
    students.forEach((st: any) => {
      updated[st.studentId] = "PRESENT";
    });
    setStudentStatuses(updated);
  };

  const handleSaveAttendance = async () => {
    setIsSubmitting(true);
    try {
      const details = Object.entries(studentStatuses).map(([studentId, status]) => ({
        studentId: Number(studentId),
        status
      }));

      await api.post("/attendances/daily", {
        classId: selectedClassId,
        attendanceDate: inputDate,
        notes: "Presensi Harian Kelas (BK)",
        details
      });

      toast.success("Presensi harian kelas berhasil disimpan! Poin pelanggaran Alpha otomatis terakumulasi.");
      setIsInputModalOpen(false);
      refetch();
    } catch (err: any) {
      toast.error(err?.message || "Gagal menyimpan presensi harian kelas");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const MONTH_NAMES: Record<string, string> = {
    "01": "Januari", "02": "Februari", "03": "Maret", "04": "April",
    "05": "Mei", "06": "Juni", "07": "Juli", "08": "Agustus",
    "09": "September", "10": "Oktober", "11": "November", "12": "Desember"
  };

  return (
    <div className="space-y-6 print:p-0 print:space-y-4">
      <style dangerouslySetInnerHTML={{
        __html: `
        @media print {
          table {
            font-size: 11pt !important;
          }
          th, td {
            padding: 4px !important;
            line-height: 1.15 !important;
          }
          /* Restore normal signature gap to match 11pt spacing */
          .h-16 {
            height: 4rem !important;
          }
          /* Remove SectionCard UI elements in print mode */
          .bg-card {
            background-color: transparent !important;
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          /* Hide the SectionCard header (title) since PrintHeader already exists */
          .bg-card > div:first-child {
            display: none !important;
          }
        }
      `}} />
      {/* Kop Surat Resmi (Print Header) */}
      <PrintHeader
        title={recapType === "monthly" ? "Laporan Rekapitulasi Presensi Kehadiran Bulanan Siswa" : "Laporan Rekapitulasi Presensi Kehadiran 1 Semester Siswa"}
        subtitle={`Bimbingan Konseling (BK) & Kedisiplinan Siswa — Kelas ${className}`}
        orientation="landscape"
        metadata={[
          { label: "Kelas", value: className },
          {
            label: "Periode Rekap",
            value: recapType === "monthly"
              ? `Bulan ${selectedMonth}`
              : `Semester ${selectedSemester} (${selectedSemester === 1 ? 'Ganjil' : 'Genap'}) T.A. ${selectedYear}/${selectedYear + 1}`
          },
          { label: "Tanggal Cetak", value: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) }
        ]}
      />

      {/* Screen Header */}
      <div className="print:hidden">
        <PageHeader
          title="Rekapitulasi Absensi Kelas (BK)"
          description="Pemantauan menyeluruh presensi harian per kelas, agregasi bulanan & 1 semester, serta deteksi dini ketidakhadiran siswa."
        />
      </div>

      {/* Filter Toolbar */}
      <div className="bg-card p-4 rounded-xl border border-border/80 shadow-sm print:hidden flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-indigo-600" /> Pilih Kelas:
            </label>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(Number(e.target.value))}
              disabled={loadingClasses}
              className="px-3 py-1.5 bg-background border border-border rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 text-foreground min-w-[140px]"
            >
              {loadingClasses ? (
                <option value={0}>Memuat kelas...</option>
              ) : (
                allClasses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))
              )}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-indigo-600" /> Mode Rekap:
            </label>
            <select
              value={recapType}
              onChange={(e) => setRecapType(e.target.value as any)}
              className="px-3 py-1.5 bg-background border border-border rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 text-foreground"
            >
              <option value="monthly">Rekap Bulanan</option>
              <option value="semester">Rekap 1 Semester</option>
            </select>
          </div>

          {recapType === "monthly" ? (
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-indigo-600" /> Bulan & Tahun:
              </label>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="px-3 py-1.5 bg-background border border-border rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 text-foreground"
              />
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-indigo-600" /> Semester:
                </label>
                <select
                  value={selectedSemester}
                  onChange={(e) => setSelectedSemester(Number(e.target.value) as 1 | 2)}
                  className="px-3 py-1.5 bg-background border border-border rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 text-foreground"
                >
                  <option value={1}>Semester 1 (Ganjil - Jul s/d Des)</option>
                  <option value={2}>Semester 2 (Genap - Jan s/d Jun)</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs font-semibold text-muted-foreground">Tahun:</label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="px-3 py-1.5 bg-background border border-border rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 text-foreground"
                >
                  {[2024, 2025, 2026, 2027].map((y) => (
                    <option key={y} value={y}>{y} / {y + 1}</option>
                  ))}
                </select>
              </div>
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleOpenInputModal()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition-colors shadow-xs"
          >
            <ClipboardCheck className="w-3.5 h-3.5" />
            + Input Presensi Kelas
          </button>

          <button
            onClick={handlePrint}
            disabled={students.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-900 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            <Printer className="w-3.5 h-3.5" />
            Cetak Rekap (PDF)
          </button>
        </div>
      </div>

      {/* Info Banner for BK Context */}
      <div className="print:hidden flex items-start gap-3 p-4 bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/50 rounded-xl text-xs text-indigo-800 dark:text-indigo-300">
        <Info className="w-4 h-4 shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold">Transparansi Data Absensi Guru BK</p>
          <p className="mt-0.5 opacity-90">
            Halaman ini merakap data kehadiran harian yang diinput oleh masing-masing Guru Mata Pelajaran. Guru BK dapat memantau pergerakan presensi per kelas tanpa risiko mengubah atau menimpa data absensi jam mengajar guru mapel.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 print:hidden">
        <div className="bg-card p-4 rounded-xl border border-border/70 shadow-sm flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-muted-foreground">Total Hadir (H)</p>
            <h4 className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{classTotalPresent}</h4>
          </div>
        </div>

        <div className="bg-card p-4 rounded-xl border border-border/70 shadow-sm flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-muted-foreground">Total Sakit (S)</p>
            <h4 className="text-xl font-bold text-amber-600 dark:text-amber-400">{classTotalSick}</h4>
          </div>
        </div>

        <div className="bg-card p-4 rounded-xl border border-border/70 shadow-sm flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0">
            <Info className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-muted-foreground">Total Izin (I)</p>
            <h4 className="text-xl font-bold text-blue-600 dark:text-blue-400">{classTotalPermission}</h4>
          </div>
        </div>

        <div className="bg-card p-4 rounded-xl border border-border/70 shadow-sm flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-rose-500/10 text-rose-600 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-muted-foreground">Total Alpha (A)</p>
            <h4 className="text-xl font-bold text-rose-600 dark:text-rose-400">{classTotalAbsent}</h4>
          </div>
        </div>
      </div>

      {/* High Risk Alpha Alert Banner */}
      {highRiskStudents.length > 0 && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/50 rounded-xl space-y-2 print:hidden">
          <div className="flex items-center gap-2 text-xs font-bold text-rose-700 dark:text-rose-300 uppercase tracking-wider">
            <ShieldAlert className="w-4 h-4 text-rose-600" />
            Peringatan Perhatian Khusus BK ({highRiskStudents.length} Siswa Alpha ≥ 3 Hari)
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            {highRiskStudents.map((s: any) => (
              <span
                key={s.studentId}
                className="px-2.5 py-1 bg-white dark:bg-slate-900 border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-semibold rounded-md shadow-xs flex items-center gap-1.5"
              >
                <span>{s.studentName}</span>
                <span className="bg-rose-600 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                  {s.summary?.ABSENT}x Alpha
                </span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Matrix Table Card */}
      <SectionCard
        title={
          recapType === "monthly"
            ? `Matriks Absensi Bulanan - ${className} (${selectedMonth})`
            : `Matriks Absensi 1 Semester - ${className} (Semester ${selectedSemester} T.A. ${selectedYear}/${selectedYear + 1})`
        }
      >
        {loadingRecap ? (
          <LoadingState message="Memuat rekapitulasi absensi kelas..." rows={6} />
        ) : isError ? (
          <ErrorState onRetry={refetch} />
        ) : students.length === 0 ? (
          <EmptyState
            title="Tidak Ada Data Absensi"
            description="Belum ada catatan presensi yang dibuat untuk kelas ini pada periode yang dipilih."
          />
        ) : (
          <div className="overflow-x-auto">
            {recapType === "monthly" ? (
              /* TABEL REKAP BULANAN */
              <table className="w-full text-left text-xs border-collapse font-sans print:font-serif border border-gray-400 dark:border-gray-600 print:table-fixed print:border print:border-black">
                <thead className="bg-gray-200 dark:bg-gray-800 border-y-2 border-gray-500 dark:border-gray-400 uppercase font-bold text-gray-800 dark:text-gray-200 print:bg-gray-200 print:border-black print:text-black">
                  <tr>
                    <th className="px-3 py-2 text-center w-10 print:w-[3%] border border-gray-400 print:border print:border-black">No</th>
                    <th className="px-3 py-2 text-center min-w-[160px] print:w-[24%] border border-gray-400 print:border print:border-black">Nama Siswa</th>
                    {dates.map((d: string) => {
                      const dayNum = d.split("-")[2];
                      return (
                        <th key={d} className="px-1.5 py-2 text-center min-w-[28px] border border-gray-400 bg-gray-100 dark:bg-gray-900 print:bg-gray-100 print:border print:border-black print:text-black">
                          {dayNum}
                        </th>
                      );
                    })}
                    <th className="px-2 py-2 text-center text-emerald-700 bg-emerald-100 dark:bg-emerald-900/30 border border-gray-400 print:bg-emerald-100 print:text-black print:border print:border-black">H</th>
                    <th className="px-2 py-2 text-center text-amber-700 bg-amber-100 dark:bg-amber-900/30 border border-gray-400 print:bg-amber-100 print:text-black print:border print:border-black">S</th>
                    <th className="px-2 py-2 text-center text-blue-700 bg-blue-100 dark:bg-blue-900/30 border border-gray-400 print:bg-blue-100 print:text-black print:border print:border-black">I</th>
                    <th className="px-2 py-2 text-center text-rose-700 bg-rose-100 dark:bg-rose-900/30 border border-gray-400 print:bg-rose-100 print:text-black print:border print:border-black">A</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-300 dark:divide-gray-600">
                  {students.map((student: any, idx: number) => {
                    const isHighRisk = (student.summary?.ABSENT || 0) >= 3;
                    return (
                      <tr
                        key={student.studentId}
                        className={cn(
                          "hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors even:bg-gray-50 dark:even:bg-gray-900/50 print:even:bg-gray-100",
                          isHighRisk && "bg-rose-50 dark:bg-rose-950/20 print:bg-transparent"
                        )}
                      >
                        <td className="px-3 py-2 text-center font-mono text-gray-500 dark:text-gray-400 border border-gray-400 print:text-black print:border print:border-black">
                          {idx + 1}
                        </td>
                        <td className="px-3 py-2 text-gray-900 dark:text-gray-100 border border-gray-400 whitespace-nowrap print:whitespace-normal print:break-words print:text-black print:border print:border-black">
                          <div className="flex items-center gap-1.5">
                            <span>{student.studentName}</span>
                            {isHighRisk && (
                              <span className="w-2 h-2 rounded-full bg-rose-500 inline-block print:hidden" title="Sering Alpha (≥ 3 kali)" />
                            )}
                          </div>
                          {student.nisn && (
                            <span className="block text-[10px] font-normal text-gray-500 font-mono print:hidden">
                              NISN: {student.nisn}
                            </span>
                          )}
                        </td>

                        {/* Daily Matrix Cells */}
                        {dates.map((d: string) => {
                          const st = student.dailyStatus?.[d];
                          let badgeClass = "text-gray-300 font-normal";
                          let label = "-";

                          if (st === "PRESENT") {
                            badgeClass = "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400";
                            label = "H";
                          } else if (st === "SICK") {
                            badgeClass = "bg-amber-500/20 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300";
                            label = "S";
                          } else if (st === "PERMISSION") {
                            badgeClass = "bg-blue-500/20 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300";
                            label = "I";
                          } else if (st === "ABSENT") {
                            badgeClass = "bg-rose-600 text-white dark:bg-rose-700";
                            label = "A";
                          }

                          return (
                            <td key={d} className="px-0.5 py-1.5 text-center border border-gray-400 print:border print:border-black print:text-black">
                              <span className={cn("inline-flex items-center justify-center w-6 h-6 rounded text-[11px] print:bg-transparent print:text-black", badgeClass)}>
                                {label}
                              </span>
                            </td>
                          );
                        })}

                        {/* Summary Columns */}
                        <td className="px-2 py-2 text-center text-emerald-700 bg-emerald-50 dark:bg-emerald-900/10 border border-gray-400 print:text-black print:bg-emerald-50 print:border print:border-black">
                          {student.summary?.PRESENT || 0}
                        </td>
                        <td className="px-2 py-2 text-center text-amber-700 bg-amber-50 dark:bg-amber-900/10 border border-gray-400 print:text-black print:bg-amber-50 print:border print:border-black">
                          {student.summary?.SICK || 0}
                        </td>
                        <td className="px-2 py-2 text-center text-blue-700 bg-blue-50 dark:bg-blue-900/10 border border-gray-400 print:text-black print:bg-blue-50 print:border print:border-black">
                          {student.summary?.PERMISSION || 0}
                        </td>
                        <td className={cn(
                          "px-2 py-2 text-center bg-rose-50 dark:bg-rose-900/10 border border-gray-400 print:text-black print:bg-rose-50 print:border print:border-black",
                          isHighRisk ? "text-rose-600 print:text-black" : "text-rose-600 print:text-black"
                        )}>
                          {student.summary?.ABSENT || 0}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              /* TABEL REKAP 1 SEMESTER */
              <table className="w-full text-left text-xs border-collapse font-sans print:font-serif border border-gray-400 dark:border-gray-600 print:table-fixed print:border print:border-black">
                <thead className="bg-gray-200 dark:bg-gray-800 border-y-2 border-gray-500 dark:border-gray-400 uppercase font-bold text-gray-800 dark:text-gray-200 print:bg-gray-200 print:border-black print:text-black">
                  <tr>
                    <th className="px-3 py-2.5 text-center w-10 print:w-[3%] border border-gray-400 print:border print:border-black" rowSpan={2}>No</th>
                    <th className="px-3 py-2.5 text-center min-w-[170px] print:w-[24%] border border-gray-400 print:border print:border-black" rowSpan={2}>Nama Siswa</th>
                    {semesterMonths.map((m: string) => {
                      const mNum = m.split("-")[1];
                      const mName = MONTH_NAMES[mNum] || m;
                      return (
                        <th key={m} className="px-2 py-1 text-center border border-gray-400 bg-gray-100 dark:bg-gray-900 print:bg-gray-100 print:border print:border-black print:text-black" colSpan={4}>
                          {mName}
                        </th>
                      );
                    })}
                    <th className="px-2 py-1 text-center bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-200 font-bold border border-gray-400 print:bg-indigo-100 print:border print:border-black print:text-black" colSpan={4}>
                      TOTAL SEMESTER
                    </th>
                  </tr>
                  <tr className="bg-gray-100 dark:bg-gray-800 border-b-2 border-gray-400 dark:border-gray-500 text-[10px] print:bg-gray-100 print:border-black">
                    {semesterMonths.map((m: string) => (
                      <React.Fragment key={m}>
                        <th className="px-1 py-1 text-center text-emerald-700 border border-gray-400 print:text-black print:border print:border-black">H</th>
                        <th className="px-1 py-1 text-center text-amber-700 border border-gray-400 print:text-black print:border print:border-black">S</th>
                        <th className="px-1 py-1 text-center text-blue-700 border border-gray-400 print:text-black print:border print:border-black">I</th>
                        <th className="px-1 py-1 text-center text-rose-700 border border-gray-400 print:text-black print:border print:border-black">A</th>
                      </React.Fragment>
                    ))}
                    <th className="px-1.5 py-1 text-center text-emerald-800 bg-emerald-200 dark:bg-emerald-800/40 font-bold border border-gray-400 print:bg-emerald-200 print:text-black print:border print:border-black">H</th>
                    <th className="px-1.5 py-1 text-center text-amber-800 bg-amber-200 dark:bg-amber-800/40 font-bold border border-gray-400 print:bg-amber-200 print:text-black print:border print:border-black">S</th>
                    <th className="px-1.5 py-1 text-center text-blue-800 bg-blue-200 dark:bg-blue-800/40 font-bold border border-gray-400 print:bg-blue-200 print:text-black print:border print:border-black">I</th>
                    <th className="px-1.5 py-1 text-center text-rose-800 bg-rose-200 dark:bg-rose-800/40 font-bold border border-gray-400 print:bg-rose-200 print:text-black print:border print:border-black">A</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-300 dark:divide-gray-600">
                  {students.map((student: any, idx: number) => {
                    const isHighRisk = (student.grandTotal?.ABSENT || 0) >= 3;
                    return (
                      <tr
                        key={student.studentId}
                        className={cn(
                          "hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors even:bg-gray-50 dark:even:bg-gray-900/50 print:even:bg-gray-100",
                          isHighRisk && "bg-rose-50 dark:bg-rose-950/20 print:bg-transparent"
                        )}
                      >
                        <td className="px-3 py-2 text-center font-mono text-gray-500 dark:text-gray-400 border border-gray-400 print:text-black print:border print:border-black">
                          {idx + 1}
                        </td>
                        <td className="px-3 py-2 text-gray-900 dark:text-gray-100 border border-gray-400 whitespace-nowrap print:whitespace-normal print:break-words print:text-black print:border print:border-black">
                          <div className="flex items-center gap-1.5">
                            <span>{student.studentName}</span>
                            {isHighRisk && (
                              <span className="w-2 h-2 rounded-full bg-rose-500 inline-block print:hidden" title="Sering Alpha (≥ 3 kali)" />
                            )}
                          </div>
                          {student.nisn && (
                            <span className="block text-[10px] font-normal text-gray-500 font-mono print:hidden">
                              NISN: {student.nisn}
                            </span>
                          )}
                        </td>

                        {/* Monthly Summary Breakdown Cells */}
                        {semesterMonths.map((m: string) => {
                          const mData = student.monthlySummary?.[m] || { PRESENT: 0, SICK: 0, PERMISSION: 0, ABSENT: 0 };
                          return (
                            <React.Fragment key={m}>
                              <td className="px-1 py-1.5 text-center text-gray-700 dark:text-gray-300 border border-gray-400 print:text-black font-medium print:border print:border-black">
                                {mData.PRESENT || 0}
                              </td>
                              <td className="px-1 py-1.5 text-center text-amber-700 dark:text-amber-500 border border-gray-400 print:text-black font-medium print:border print:border-black">
                                {mData.SICK || 0}
                              </td>
                              <td className="px-1 py-1.5 text-center text-blue-700 dark:text-blue-500 border border-gray-400 print:text-black font-medium print:border print:border-black">
                                {mData.PERMISSION || 0}
                              </td>
                              <td className={cn(
                                "px-1 py-1.5 text-center border border-gray-400 print:border print:border-black",
                                mData.ABSENT > 0 ? "text-rose-700 bg-rose-50 dark:bg-rose-900/20 print:bg-rose-50 print:text-black" : "text-gray-400 print:text-black"
                              )}>
                                {mData.ABSENT || 0}
                              </td>
                            </React.Fragment>
                          );
                        })}

                        {/* Grand Total Columns */}
                        <td className="px-2 py-2 text-center text-emerald-800 bg-emerald-100 dark:bg-emerald-900/30 border border-gray-400 print:text-black print:bg-emerald-100 print:border print:border-black">
                          {student.grandTotal?.PRESENT || 0}
                        </td>
                        <td className="px-2 py-2 text-center text-amber-800 bg-amber-100 dark:bg-amber-900/30 border border-gray-400 print:text-black print:bg-amber-100 print:border print:border-black">
                          {student.grandTotal?.SICK || 0}
                        </td>
                        <td className="px-2 py-2 text-center text-blue-800 bg-blue-100 dark:bg-blue-900/30 border border-gray-400 print:text-black print:bg-blue-100 print:border print:border-black">
                          {student.grandTotal?.PERMISSION || 0}
                        </td>
                        <td className={cn(
                          "px-2 py-2 text-center bg-rose-100 dark:bg-rose-900/30 border border-gray-400 print:text-black print:bg-rose-100 print:border print:border-black",
                          isHighRisk ? "text-rose-700 print:text-black" : "text-rose-700 print:text-black"
                        )}>
                          {student.grandTotal?.ABSENT || 0}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}
      </SectionCard>

      {/* Printable Signature Block */}
      <table className="hidden print:table w-full text-center text-xs text-black font-serif mt-12 border-collapse break-inside-avoid">
        <tbody>
          <tr>
            <td className="w-1/3 vertical-top px-2">
              <p className="font-semibold text-black">Mengetahui,</p>
              <p className="font-semibold text-black">Wali Kelas,</p>
              <div className="h-16" />
              <p className="font-bold underline text-black">( .................................................... )</p>
              <p className="text-[10px] mt-0.5">Nama Terang & Tanda Tangan</p>
            </td>

            <td className="w-1/3 vertical-top px-2">
              <p className="font-semibold text-black">Mengetahui,</p>
              <p className="font-semibold text-black">Guru BK / Pembina Disiplin,</p>
              <div className="h-16" />
              <p className="font-bold underline text-black">( .................................................... )</p>
              <p className="text-[10px] mt-0.5">Nama Terang & Tanda Tangan</p>
            </td>

            <td className="w-1/3 vertical-top px-2">
              <p className="font-semibold text-black">
                Sidoarjo, {new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
              </p>
              <p className="font-semibold text-black">Kepala Sekolah,</p>
              <div className="h-16" />
              <p className="font-bold underline text-black">{school?.principalName || "HERWINDA ROSITA, SE"}</p>
            </td>
          </tr>
        </tbody>
      </table>

      {/* Modal Input Presensi Kelas */}
      {isInputModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/60">
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <ClipboardCheck className="w-4 h-4 text-rose-600" />
                  Input / Penyesuaian Presensi Kelas: {className}
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Catat atau sesuaikan presensi siswa. Siswa ber-status Alpha otomatis diproses poin pelanggarannya.
                </p>
              </div>
              <button
                onClick={() => setIsInputModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-4 overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                <div>
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">Tanggal Presensi Harian</label>
                  <input
                    type="date"
                    value={inputDate}
                    onChange={(e) => setInputDate(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">Cakupan Presensi</label>
                  <div className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/50 rounded-lg text-xs font-bold text-indigo-700 dark:text-indigo-300 flex items-center justify-between">
                    <span>Presensi Harian Kelas</span>
                    <span className="bg-indigo-600 text-white px-2 py-0.5 rounded text-[10px] font-extrabold">{className}</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center pt-2">
                <span className="text-xs font-bold text-slate-900 dark:text-white">Daftar Siswa ({students.length})</span>
                <button
                  type="button"
                  onClick={handleSetAllPresent}
                  className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 bg-indigo-50 dark:bg-indigo-950/50 px-2.5 py-1 rounded-md transition-colors"
                >
                  Set Semua Hadir (H)
                </button>
              </div>

              <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                {students.map((st: any, idx: number) => {
                  const currentStatus = studentStatuses[st.studentId] || "PRESENT";
                  return (
                    <div key={st.studentId} className="p-3 flex items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-slate-400 w-6">{idx + 1}.</span>
                        <div>
                          <p className="text-xs font-bold text-slate-900 dark:text-white">{st.studentName}</p>
                          {st.nisn && <p className="text-[10px] text-slate-400">NISN: {st.nisn}</p>}
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        {[
                          { key: "PRESENT", label: "Hadir", color: "bg-emerald-600 text-white" },
                          { key: "SICK", label: "Sakit", color: "bg-amber-600 text-white" },
                          { key: "PERMISSION", label: "Izin", color: "bg-blue-600 text-white" },
                          { key: "ABSENT", label: "Alpha", color: "bg-rose-600 text-white font-extrabold" },
                        ].map((opt) => (
                          <button
                            key={opt.key}
                            type="button"
                            onClick={() =>
                              setStudentStatuses((prev) => ({ ...prev, [st.studentId]: opt.key as any }))
                            }
                            className={cn(
                              "px-2.5 py-1 text-[10px] font-bold rounded-md border transition-all",
                              currentStatus === opt.key
                                ? `${opt.color} border-transparent shadow-xs scale-105`
                                : "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                            )}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2 bg-slate-50 dark:bg-slate-800/60">
              <button
                type="button"
                onClick={() => setIsInputModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-lg transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveAttendance}
                disabled={isSubmitting}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition-colors shadow-xs disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                {isSubmitting ? "Menyimpan..." : "Simpan Presensi Kelas"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
