"use client";

import { useState, useEffect, useMemo } from "react";
import { BookMarked, Plus, Pencil, Trash2, Printer, Calendar, FileText, Eye } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/tables/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, ConfirmDialog } from "@/components/ui/dialog";
import { PrintHeader } from "@/components/PrintHeader";
import { useJournals, useCreateJournal, useUpdateJournal, useDeleteJournal } from "@/queries/teaching-journals.query";
import { useSchedules } from "@/queries/schedules.query";
import { useClasses } from "@/queries/classes.query";
import { useSubjects } from "@/queries/subjects.query";
import type { TeachingJournal } from "@/types";
import { formatDate, formatTime, getTodayDateInput, getTodayMonthInput } from "@/lib/utils";
import { cn } from "@/lib/utils";

const schema = z.object({
  scheduleId: z.coerce.number().min(1),
  attendanceId: z.coerce.number().optional(),
  journalDate: z.string().min(1, "Tanggal wajib diisi"),
  topic: z.string().min(1, "Topik wajib diisi"),
  learningObjectives: z.string().min(1, "Tujuan pembelajaran wajib diisi"),
  teachingMethod: z.string().min(1, "Metode wajib diisi"),
  reflection: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
});
type FormData = z.infer<typeof schema>;

export default function TeachingJournalsPage() {
  const [activeTab, setActiveTab] = useState<"journals" | "daily" | "monthly">("journals");

  // Global lookups
  const { data: journals = [], isLoading: isFetching } = useJournals();
  const { data: schedules = [] } = useSchedules();
  const { data: classes = [] } = useClasses();
  const { data: subjects = [] } = useSubjects();

  const createJournal = useCreateJournal();
  const updateJournal = useUpdateJournal();
  const deleteJournal = useDeleteJournal();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<TeachingJournal | null>(null);
  const [editing, setEditing] = useState<TeachingJournal | null>(null);

  // Recap Filters
  const [recapClassId, setRecapClassId] = useState<string>("");
  const [recapDate, setRecapDate] = useState<string>(getTodayDateInput());
  const [recapMonth, setRecapMonth] = useState<string>(getTodayMonthInput());

  // Detail Modal
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailJournal, setDetailJournal] = useState<TeachingJournal | null>(null);

  // Main list filter
  const [filterClassId, setFilterClassId] = useState<string>("ALL");

  const filteredJournals = useMemo(() => {
    return journals.filter((j) => {
      if (filterClassId !== "ALL" && String(j.schedule?.classId) !== filterClassId) {
        return false;
      }
      return true;
    });
  }, [journals, filterClassId]);

  const openDetail = (j: TeachingJournal) => {
    setDetailJournal(j);
    setDetailOpen(true);
  };

  const isMutating = createJournal.isPending || updateJournal.isPending || deleteJournal.isPending;

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  });

  // Pre-fill defaults when schedules load
  useEffect(() => {
    if (schedules.length > 0) {
      reset({
        scheduleId: schedules[0].id,
        journalDate: getTodayDateInput(),
        topic: "",
        learningObjectives: "",
        teachingMethod: "Ceramah",
        reflection: "",
        notes: "",
      });
    }
  }, [schedules, reset]);

  // Sync default recapClassId when classes load
  useEffect(() => {
    if (classes.length > 0 && !recapClassId) {
      setRecapClassId(String(classes[0].id));
    }
  }, [classes, recapClassId]);

  const openAdd = () => {
    setEditing(null);
    reset({
      scheduleId: schedules[0]?.id || 0,
      journalDate: getTodayDateInput(),
      topic: "",
      learningObjectives: "",
      teachingMethod: "",
      reflection: "",
      notes: "",
    });
    setDialogOpen(true);
  };

  const openEdit = (j: TeachingJournal) => {
    setEditing(j);
    reset({
      scheduleId: j.scheduleId,
      attendanceId: j.attendanceId || undefined,
      journalDate: j.journalDate,
      topic: j.topic,
      learningObjectives: j.learningObjectives,
      teachingMethod: j.teachingMethod,
      reflection: j.reflection ?? "",
      notes: j.notes ?? "",
    });
    setDialogOpen(true);
  };

  const onSubmit = async (data: FormData) => {
    const selectedSchedule = schedules.find(s => String(s.id) === String(data.scheduleId));
    const payload = {
      scheduleId: data.scheduleId,
      teacherId: selectedSchedule?.teacherId || 0,
      attendanceId: data.attendanceId || undefined,
      journalDate: data.journalDate,
      topic: data.topic,
      learningObjectives: data.learningObjectives,
      teachingMethod: data.teachingMethod,
      reflection: data.reflection || undefined,
      notes: data.notes || undefined,
    };

    try {
      if (editing) {
        await updateJournal.mutateAsync({ id: editing.id, data: payload });
      } else {
        await createJournal.mutateAsync(payload);
      }
      setDialogOpen(false);
    } catch {}
  };

  const handleDelete = async () => {
    if (!deleteDialog) return;
    try {
      await deleteJournal.mutateAsync(deleteDialog.id);
      setDeleteDialog(null);
    } catch {}
  };

  const handlePrint = () => {
    const originalTitle = document.title;
    const className = classes.find(c => String(c.id) === String(recapClassId))?.name ?? "—";
    const cleanClassName = className.replace(/[^a-zA-Z0-9]/g, "_");
    if (activeTab === "daily") {
      document.title = `Jurnal_Mengajar_Harian_Kelas_${cleanClassName}_${recapDate}`;
    } else {
      document.title = `Jurnal_Mengajar_Bulanan_Kelas_${cleanClassName}_${recapMonth}`;
    }
    window.print();
    document.title = originalTitle;
  };

  // ----------------------------------------------------
  // FILTERING FOR RECAPS
  // ----------------------------------------------------
  const getFilteredJournals = (type: "daily" | "monthly") => {
    return journals.filter(j => {
      const sched = schedules.find(s => s.id === j.scheduleId);
      const matchesClass = recapClassId ? String(sched?.classId) === String(recapClassId) : true;
      const matchesDate = type === "daily" 
        ? j.journalDate === recapDate 
        : j.journalDate.startsWith(recapMonth);
      return matchesClass && matchesDate;
    }).sort((a, b) => a.journalDate.localeCompare(b.journalDate));
  };

  const dailyJournals = getFilteredJournals("daily");
  const monthlyJournals = getFilteredJournals("monthly");

  const columns: ColumnDef<TeachingJournal>[] = [
    { accessorKey: "journalDate", header: "Tanggal", cell: ({ getValue }) => formatDate(getValue() as string) },
    { id: "jadwal", header: "Jadwal", cell: ({ row }) => (
      <div>
        <p className="font-medium text-sm">{row.original.schedule?.subject?.name ?? "—"}</p>
        <p className="text-xs text-gray-400">
          {row.original.schedule?.class?.name} • {row.original.schedule?.dayOfWeek} ({row.original.schedule?.startTime ? formatTime(row.original.schedule.startTime) : "—"} - {row.original.schedule?.endTime ? formatTime(row.original.schedule.endTime) : "—"})
        </p>
      </div>
    )},
    { accessorKey: "topic", header: "Topik", cell: ({ getValue }) => <span className="max-w-xs truncate block">{getValue() as string}</span> },
    { accessorKey: "teachingMethod", header: "Metode" },
    { id: "actions", header: "Aksi", cell: ({ row }) => (
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" className="h-7 w-7 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50" onClick={() => openDetail(row.original)} title="Detail"><Eye className="h-3.5 w-3.5" /></Button>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(row.original)} title="Edit"><Pencil className="h-3.5 w-3.5" /></Button>
        <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => setDeleteDialog(row.original)} title="Hapus"><Trash2 className="h-3.5 w-3.5" /></Button>
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
            <BookMarked className="h-6 w-6 text-indigo-600" /> Jurnal Mengajar
          </h1>
          <p className="text-sm text-gray-500 mt-1">Catat dan tinjau agenda serta jurnal mengajar kelas</p>
        </div>
        <div className="flex items-center gap-2">
          {activeTab !== "journals" && (
            <Button variant="outline" onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-2" /> Cetak PDF
            </Button>
          )}
          <Button onClick={openAdd} disabled={schedules.length === 0}>
            <Plus className="h-4 w-4 mr-2" /> Tambah Jurnal
          </Button>
        </div>
      </div>

      {/* TABS SELECTOR */}
      <div className="border-b border-gray-200 dark:border-gray-800 no-print">
        <nav className="flex space-x-6" aria-label="Tabs">
          {(["journals", "daily", "monthly"] as const).map((tab) => (
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
              {tab === "journals" ? "Daftar Jurnal" : tab === "daily" ? "Rekap Harian" : "Rekap Bulanan"}
            </button>
          ))}
        </nav>
      </div>

      {/* FILTER PANEL */}
      {activeTab !== "journals" && (
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

      {/* TAB CONTENT 1: JOURNALS LIST */}
      {activeTab === "journals" && (
        <div className="space-y-4 no-print">
          {/* Class Filter */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <Label>Filter Kelas</Label>
              <Select value={filterClassId} onChange={e => setFilterClassId(e.target.value)}>
                <option value="ALL">Semua Kelas</option>
                {classes.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </Select>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
            {isFetching ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <div className="h-8 w-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-gray-500">Memuat data jurnal...</p>
              </div>
            ) : (
              <DataTable columns={columns} data={filteredJournals} searchKey="topic" searchPlaceholder="Cari topik jurnal..." emptyMessage="Belum ada jurnal." />
            )}
          </div>
        </div>
      )}

      {/* TAB CONTENT 2: DAILY RECAP */}
      {activeTab === "daily" && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 print:p-0 print:border-none print:shadow-none">
          
          {/* Kop Surat */}
          <PrintHeader 
            title="Laporan Jurnal Mengajar Harian Guru" 
            subtitle={`Kelas: ${selectedClassName}`}
            orientation="portrait"
            metadata={[
              { label: "Tanggal", value: formatDate(recapDate) },
              { label: "Kelas", value: selectedClassName },
              { label: "Total Kegiatan", value: `${dailyJournals.length} Kelas Pembelajaran` }
            ]}
          />

          {/* Screen Info */}
          <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-800 mb-4 print:hidden">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-indigo-600" />
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Agenda Mengajar Harian: {formatDate(recapDate)}
              </span>
            </div>
            <Badge variant="info">{dailyJournals.length} Pembelajaran</Badge>
          </div>

          {dailyJournals.length === 0 ? (
            <div className="text-center py-12 text-gray-400">Tidak ada jurnal mengajar tercatat untuk kelas dan tanggal ini.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border border-gray-200 dark:border-gray-800">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300">
                    <th className="p-3 font-semibold w-12 text-center">No</th>
                    <th className="p-3 font-semibold w-32">Mata Pelajaran</th>
                    <th className="p-3 font-semibold w-32">Topik Pembahasan</th>
                    <th className="p-3 font-semibold">Tujuan Pembelajaran</th>
                    <th className="p-3 font-semibold w-24">Metode</th>
                    <th className="p-3 font-semibold w-40">Refleksi / Catatan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                  {dailyJournals.map((j, idx) => (
                    <tr key={j.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="p-3 text-center">{idx + 1}</td>
                      <td className="p-3 font-medium text-gray-900 dark:text-gray-100">
                        {j.schedule?.subject?.name ?? "—"}
                      </td>
                      <td className="p-3">{j.topic}</td>
                      <td className="p-3 text-gray-600 dark:text-gray-300 whitespace-pre-wrap">{j.learningObjectives}</td>
                      <td className="p-3">{j.teachingMethod}</td>
                      <td className="p-3 text-gray-500">
                        {j.reflection && <p className="mb-1"><span className="font-semibold">Refleksi:</span> {j.reflection}</p>}
                        {j.notes && <p><span className="font-semibold">Catatan:</span> {j.notes}</p>}
                        {!j.reflection && !j.notes && "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT 3: MONTHLY RECAP */}
      {activeTab === "monthly" && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 print:p-0 print:border-none print:shadow-none">
          
          {/* Kop Surat */}
          <PrintHeader 
            title="Laporan Jurnal Mengajar Bulanan Guru" 
            subtitle={`Kelas: ${selectedClassName}`}
            orientation="landscape"
            metadata={[
              { label: "Bulan / Tahun", value: recapMonth },
              { label: "Kelas", value: selectedClassName },
              { label: "Total KBM", value: `${monthlyJournals.length} Kegiatan Belajar Mengajar` }
            ]}
          />

          {/* Screen Info */}
          <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-800 mb-4 print:hidden">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-indigo-600" />
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Agenda Mengajar Bulanan: {recapMonth}
              </span>
            </div>
            <Badge variant="info">{monthlyJournals.length} KBM</Badge>
          </div>

          {monthlyJournals.length === 0 ? (
            <div className="text-center py-12 text-gray-400">Tidak ada jurnal mengajar tercatat untuk kelas dan bulan ini.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border border-gray-200 dark:border-gray-800">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300">
                    <th className="p-3 font-semibold w-12 text-center">No</th>
                    <th className="p-3 font-semibold w-24">Tanggal</th>
                    <th className="p-3 font-semibold w-28">Mata Pelajaran</th>
                    <th className="p-3 font-semibold w-32">Topik Pembahasan</th>
                    <th className="p-3 font-semibold">Tujuan Pembelajaran</th>
                    <th className="p-3 font-semibold w-20">Metode</th>
                    <th className="p-3 font-semibold w-36">Catatan / Refleksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                  {monthlyJournals.map((j, idx) => (
                    <tr key={j.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="p-3 text-center">{idx + 1}</td>
                      <td className="p-3">{formatDate(j.journalDate)}</td>
                      <td className="p-3 font-medium text-gray-900 dark:text-gray-100">
                        {j.schedule?.subject?.name ?? "—"}
                      </td>
                      <td className="p-3">{j.topic}</td>
                      <td className="p-3 text-gray-600 dark:text-gray-300 whitespace-pre-wrap">{j.learningObjectives}</td>
                      <td className="p-3">{j.teachingMethod}</td>
                      <td className="p-3 text-gray-500">
                        {j.reflection && <p className="mb-1"><span className="font-semibold">Refleksi:</span> {j.reflection}</p>}
                        {j.notes && <p><span className="font-semibold">Catatan:</span> {j.notes}</p>}
                        {!j.reflection && !j.notes && "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* DIALOG ADD/EDIT */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} title={editing ? "Edit Jurnal" : "Tambah Jurnal Mengajar"} size="xl">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Jadwal *</Label>
              <Select {...register("scheduleId")}>
                {schedules.map(s => {
                  const cls = classes.find(c => c.id === s.classId);
                  const sub = subjects.find(su => su.id === s.subjectId);
                  return (
                    <option key={s.id} value={s.id}>
                      {cls?.name ?? "—"} — {sub?.name ?? "—"} ({s.dayOfWeek} {formatTime(s.startTime)} - {formatTime(s.endTime)})
                    </option>
                  );
                })}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Tanggal *</Label>
              <Input type="date" {...register("journalDate")} />
              {errors.journalDate && <p className="text-xs text-red-600">{errors.journalDate.message}</p>}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Topik *</Label>
              <Input placeholder="Topik pembahasan" {...register("topic")} />
              {errors.topic && <p className="text-xs text-red-600">{errors.topic.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Metode Mengajar *</Label>
              <Input placeholder="Ceramah, Diskusi, Praktik, dll" {...register("teachingMethod")} />
              {errors.teachingMethod && <p className="text-xs text-red-600">{errors.teachingMethod.message}</p>}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Tujuan Pembelajaran *</Label>
            <Textarea placeholder="Apa yang ingin dicapai siswa?" {...register("learningObjectives")} />
            {errors.learningObjectives && <p className="text-xs text-red-600">{errors.learningObjectives.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Refleksi</Label>
            <Textarea placeholder="Refleksi mengajar (opsional)" {...register("reflection")} />
          </div>
          <div className="space-y-1.5">
            <Label>Catatan Tambahan</Label>
            <Textarea placeholder="Catatan lainnya (opsional)" {...register("notes")} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Batal</Button>
            <Button type="submit" loading={isMutating}>{editing ? "Simpan" : "Tambah"}</Button>
          </div>
        </form>
      </Dialog>

      <ConfirmDialog open={!!deleteDialog} onClose={() => setDeleteDialog(null)} onConfirm={handleDelete} title="Hapus Jurnal" description={`Hapus jurnal "${deleteDialog?.topic}"?`} loading={isMutating} />

      {/* DIALOG DETAIL */}
      <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} title="Detail Jurnal Mengajar" size="lg">
        {detailJournal && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-4 pb-3 border-b border-gray-100 dark:border-gray-800">
              <div>
                <span className="font-bold text-gray-400 block text-[9px] uppercase">Tanggal</span>
                <span className="text-gray-900 dark:text-white font-medium">{formatDate(detailJournal.journalDate)}</span>
              </div>
              <div>
                <span className="font-bold text-gray-400 block text-[9px] uppercase">Jadwal</span>
                <span className="text-gray-900 dark:text-white font-medium">
                  {detailJournal.schedule?.class?.name || "—"} • {detailJournal.schedule?.subject?.name || "—"}
                </span>
              </div>
            </div>
            <div>
              <span className="font-bold text-gray-400 block text-[9px] uppercase">Topik / Materi</span>
              <span className="text-gray-950 dark:text-white font-bold text-sm block mt-0.5">{detailJournal.topic}</span>
            </div>
            <div>
              <span className="font-bold text-gray-400 block text-[9px] uppercase">Tujuan Pembelajaran</span>
              <p className="text-gray-700 dark:text-gray-300 mt-1 whitespace-pre-wrap leading-relaxed">{detailJournal.learningObjectives}</p>
            </div>
            <div>
              <span className="font-bold text-gray-400 block text-[9px] uppercase">Metode Pembelajaran</span>
              <span className="text-gray-700 dark:text-gray-300 mt-1 block">{detailJournal.teachingMethod}</span>
            </div>
            {detailJournal.reflection && (
              <div>
                <span className="font-bold text-gray-400 block text-[9px] uppercase">Refleksi</span>
                <p className="text-gray-700 dark:text-gray-300 mt-1 whitespace-pre-wrap leading-relaxed">{detailJournal.reflection}</p>
              </div>
            )}
            {detailJournal.notes && (
              <div>
                <span className="font-bold text-gray-400 block text-[9px] uppercase">Catatan</span>
                <p className="text-gray-700 dark:text-gray-300 mt-1 whitespace-pre-wrap leading-relaxed">{detailJournal.notes}</p>
              </div>
            )}
            <div className="flex justify-end pt-3 border-t border-gray-100 dark:border-gray-800">
              <Button type="button" onClick={() => setDetailOpen(false)}>Tutup</Button>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}
