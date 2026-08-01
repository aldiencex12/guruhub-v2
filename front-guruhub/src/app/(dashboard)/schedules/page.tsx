"use client";

import { useState, useEffect } from "react";
import { Calendar, Plus, Pencil, Trash2, Clock } from "lucide-react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/tables/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { TimeInput } from "@/components/ui/time-input";
import { Dialog, ConfirmDialog } from "@/components/ui/dialog";
import { useSchedules, useCreateSchedule, useUpdateSchedule, useDeleteSchedule, useBulkDeleteSchedules, useDeleteAllSchedules } from "@/queries/schedules.query";
import { useClasses } from "@/queries/classes.query";
import { useSubjects } from "@/queries/subjects.query";
import { useTeachers } from "@/queries/teachers.query";
import { useAcademicYears } from "@/queries/dashboard.query";
import { useAuthStore } from "@/store/auth.store";
import type { Schedule, DayOfWeek } from "@/types";
import { api } from "@/services/api";
import { Download, Upload } from "lucide-react";
import { formatTime } from "@/lib/utils";

const DAYS: DayOfWeek[] = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

const dayColors: Record<DayOfWeek, string> = {
  Senin: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  Selasa: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  Rabu: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  Kamis: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  Jumat: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
  Sabtu: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400",
  Minggu: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

const schema = z.object({
  classId: z.coerce.number().min(1),
  subjectId: z.coerce.number().min(1),
  teacherId: z.coerce.number().min(1),
  academicYearId: z.coerce.number().min(1),
  dayOfWeek: z.enum(["Senin","Selasa","Rabu","Kamis","Jumat","Sabtu","Minggu"] as const),
  startTime: z.string().min(1, "Jam mulai wajib diisi"),
  endTime: z.string().min(1, "Jam selesai wajib diisi"),
});
type FormData = z.infer<typeof schema>;

export default function SchedulesPage() {
  const { currentUser } = useAuthStore();
  const canEdit = ["SuperAdmin", "SchoolAdmin", "Principal"].includes(currentUser?.role || "");

  const [classFilter, setClassFilter] = useState<string>("all");

  const { data: schedules = [], isLoading: isFetching } = useSchedules({
    classId: classFilter === "all" ? undefined : Number(classFilter),
  });

  const { data: classes = [] } = useClasses();
  const { data: subjects = [] } = useSubjects();
  const { data: teachers = [] } = useTeachers();
  const { data: academicYears = [] } = useAcademicYears();

  const createSchedule = useCreateSchedule();
  const updateSchedule = useUpdateSchedule();
  const deleteSchedule = useDeleteSchedule();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<Schedule | null>(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [deleteAllOpen, setDeleteAllOpen] = useState(false);
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});
  const [editing, setEditing] = useState<Schedule | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  
  const bulkDeleteSchedules = useBulkDeleteSchedules();
  const deleteAllSchedules = useDeleteAllSchedules();

  const isMutating = createSchedule.isPending || updateSchedule.isPending || deleteSchedule.isPending || bulkDeleteSchedules.isPending || deleteAllSchedules.isPending;

  const { register, handleSubmit, reset, setValue, control, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  });

  // Pre-fill defaults when data is loaded
  useEffect(() => {
    if (classes.length > 0 && subjects.length > 0 && teachers.length > 0 && academicYears.length > 0) {
      const activeAy = academicYears.find(ay => ay.isActive) || academicYears[0];
      reset({
        classId: classes[0].id,
        subjectId: subjects[0].id,
        teacherId: teachers[0].id,
        academicYearId: activeAy?.id || 0,
        dayOfWeek: "Senin",
        startTime: "07:00",
        endTime: "08:30",
      });
    }
  }, [classes, subjects, teachers, academicYears, reset]);

  const openAdd = () => {
    setEditing(null);
    const activeAy = academicYears.find(ay => ay.isActive) || academicYears[0];
    reset({
      classId: classes[0]?.id || 0,
      subjectId: subjects[0]?.id || 0,
      teacherId: teachers[0]?.id || 0,
      academicYearId: activeAy?.id || 0,
      dayOfWeek: "Senin",
      startTime: "07:00",
      endTime: "08:30",
    });
    setDialogOpen(true);
  };

  const openEdit = (s: Schedule) => {
    setEditing(s);
    reset({
      classId: s.classId,
      subjectId: s.subjectId,
      teacherId: s.teacherId,
      academicYearId: s.academicYearId,
      dayOfWeek: s.dayOfWeek as any,
      startTime: s.startTime,
      endTime: s.endTime,
    });
    setDialogOpen(true);
  };

  const onSubmit = async (data: FormData) => {
    const payload = {
      classId: data.classId,
      subjectId: data.subjectId,
      teacherId: data.teacherId,
      academicYearId: data.academicYearId,
      dayOfWeek: data.dayOfWeek,
      startTime: data.startTime,
      endTime: data.endTime,
    };

    try {
      if (editing) {
        await updateSchedule.mutateAsync({ id: editing.id, data: payload });
      } else {
        await createSchedule.mutateAsync(payload);
      }
      setDialogOpen(false);
    } catch {}
  };

  const handleDelete = async () => {
    if (!deleteDialog) return;
    try {
      await deleteSchedule.mutateAsync(deleteDialog.id);
      setDeleteDialog(null);
    } catch {}
  };

  const handleBulkDelete = async () => {
    const selectedIds = Object.keys(rowSelection).filter(k => rowSelection[k]).map(Number);
    if (selectedIds.length === 0) return;
    try {
      await bulkDeleteSchedules.mutateAsync(selectedIds);
      setBulkDeleteOpen(false);
      setRowSelection({});
    } catch {}
  };

  const handleDeleteAll = async () => {
    try {
      await deleteAllSchedules.mutateAsync();
      setDeleteAllOpen(false);
      setRowSelection({});
    } catch {}
  };

  const columns: ColumnDef<Schedule>[] = [
    ...(canEdit ? [{
      id: "select",
      header: ({ table }: any) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Pilih semua"
        />
      ),
      cell: ({ row }: any) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Pilih baris"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    }] : []),
    { id: "hari", accessorFn: row => row.dayOfWeek, header: "Hari", cell: ({ row }) => {
      const day = row.original.dayOfWeek as DayOfWeek;
      return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${dayColors[day] || "bg-gray-100 text-gray-700"}`}>{day}</span>;
    }},
    { id: "waktu", accessorFn: row => `${formatTime(row.startTime)} - ${formatTime(row.endTime)}`, header: "Waktu", cell: ({ row }) => (
      <div className="flex items-center gap-1 text-sm">
        <Clock className="h-3.5 w-3.5 text-gray-400" />
        {formatTime(row.original.startTime)} – {formatTime(row.original.endTime)}
      </div>
    )},
    { id: "kelas", accessorFn: row => row.class?.name ?? classes.find(c => c.id === row.classId)?.name ?? "", header: "Kelas", cell: ({ row }) => <Badge variant="secondary">{row.original.class?.name ?? classes.find(c => c.id === row.original.classId)?.name ?? "—"}</Badge> },
    { id: "mapel", accessorFn: row => row.subject?.name ?? subjects.find(s => s.id === row.subjectId)?.name ?? "", header: "Mata Pelajaran", cell: ({ row }) => row.original.subject?.name ?? subjects.find(s => s.id === row.original.subjectId)?.name ?? "—" },
    { id: "guru", accessorFn: row => row.teacher?.name ?? teachers.find(t => t.id === row.teacherId)?.name ?? "", header: "Guru", cell: ({ row }) => row.original.teacher?.name ?? teachers.find(t => t.id === row.original.teacherId)?.name ?? "—" },
    ...(canEdit ? [{ id: "actions", header: "Aksi", cell: ({ row }: any) => (
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(row.original)}><Pencil className="h-3.5 w-3.5" /></Button>
        <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => setDeleteDialog(row.original)}><Trash2 className="h-3.5 w-3.5" /></Button>
      </div>
    )}] : []),
  ];

  // Weekly grid data
  const gridData = DAYS.map(day => ({
    day,
    schedules: schedules.filter(s => s.dayOfWeek === day).sort((a, b) => a.startTime.localeCompare(b.startTime)),
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2"><Calendar className="h-6 w-6 text-amber-600" /> Jadwal</h1>
          <p className="text-sm text-gray-500 mt-1">{schedules.length} jadwal terdaftar</p>
        </div>
        {canEdit && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => api.download("/import/templates/schedules", "template-schedules.xlsx")}>
              <Download className="h-4 w-4 mr-2" /> Template Jadwal
            </Button>
            <div className="relative">
              <input
                type="file"
                accept=".xlsx, .xls"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                disabled={isImporting}
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setIsImporting(true);
                  const formData = new FormData();
                  formData.append("file", file);
                  try {
                    await api.post("/import/schedules", formData);
                    toast.success("Jadwal berhasil diimpor");
                    window.location.reload();
                  } catch (error: any) {
                    toast.error(error.message || "Gagal mengimpor jadwal");
                  } finally {
                    setIsImporting(false);
                    e.target.value = "";
                  }
                }}
              />
              <Button variant="outline" disabled={isImporting}>
                <Upload className="h-4 w-4 mr-2" /> {isImporting ? "Mengimpor..." : "Import"}
              </Button>
            </div>
            {schedules.length > 0 && (
              <Button variant="destructive" onClick={() => setDeleteAllOpen(true)}>
                <Trash2 className="h-4 w-4 mr-2" /> Kosongkan Jadwal
              </Button>
            )}
            <Button onClick={openAdd}><Plus className="h-4 w-4 mr-2" /> Tambah Jadwal</Button>
          </div>
        )}
      </div>

      {/* Weekly Grid */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
        <div className="flex gap-3 mb-4">
          <Select value={classFilter} onChange={e => setClassFilter(e.target.value)} className="w-48">
            <option value="all">Semua Kelas</option>
            {classes.map(c => <option key={c.id} value={c.id}>Kelas {c.name}</option>)}
          </Select>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {gridData.map(({ day, schedules: daySched }) => (
            <div key={day} className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className={`px-3 py-2 text-center text-xs font-semibold ${dayColors[day]}`}>{day}</div>
              <div className="p-2 space-y-1.5 min-h-[80px]">
                {daySched.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center pt-2">—</p>
                ) : daySched.map(s => (
                  <div key={s.id} className="rounded-md bg-gray-50 dark:bg-gray-800 p-1.5 text-xs">
                    <p className="font-medium text-gray-800 dark:text-gray-200 truncate">{s.subject?.name ?? subjects.find(sub => sub.id === s.subjectId)?.name}</p>
                    <p className="text-gray-500 truncate">{s.class?.name ?? classes.find(c => c.id === s.classId)?.name}</p>
                    <p className="text-gray-400">{formatTime(s.startTime)}–{formatTime(s.endTime)}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Table View */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Daftar Jadwal</h2>
        {isFetching ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <div className="h-8 w-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-500">Memuat data jadwal...</p>
          </div>
        ) : (
          <DataTable 
            columns={columns} 
            data={schedules} 
            searchPlaceholder="Cari jadwal..." 
            emptyMessage="Tidak ada jadwal." 
            selectedRowIds={rowSelection}
            onSelectedRowIdsChange={setRowSelection}
            toolbar={
              Object.keys(rowSelection).filter(k => rowSelection[k]).length > 0 && (
                <Button variant="destructive" onClick={() => setBulkDeleteOpen(true)} className="h-9">
                  <Trash2 className="h-4 w-4 mr-2" /> Hapus Terpilih ({Object.keys(rowSelection).filter(k => rowSelection[k]).length})
                </Button>
              )
            }
          />
        )}
      </div>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} title={editing ? "Edit Jadwal" : "Tambah Jadwal"} size="lg">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

          {/* Section 1: Kelas & Mapel */}
          <div className="rounded-xl border border-indigo-100 dark:border-indigo-900/40 bg-indigo-50/40 dark:bg-indigo-950/20 p-4 space-y-4">
            <p className="text-xs font-bold text-indigo-500 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
              <span className="inline-flex h-4 w-4 items-center justify-center rounded bg-indigo-500 text-white text-[9px] font-black">1</span>
              Info Kelas &amp; Mata Pelajaran
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-600 dark:text-gray-400">Kelas *</Label>
                <Select {...register("classId")} className="bg-white dark:bg-gray-900">
                  {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-600 dark:text-gray-400">Mata Pelajaran *</Label>
                <Select {...register("subjectId")} className="bg-white dark:bg-gray-900">
                  {subjects.map(s => <option key={s.id} value={s.id}>{s.name} - {s.gradeLevel}</option>)}
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-gray-600 dark:text-gray-400">Guru Pengampu *</Label>
              <Select {...register("teacherId")} className="bg-white dark:bg-gray-900">
                {teachers.filter(t => !t.status || t.status === "Aktif").map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </Select>
            </div>
          </div>

          {/* Section 2: Jadwal & Waktu */}
          <div className="rounded-xl border border-emerald-100 dark:border-emerald-900/40 bg-emerald-50/40 dark:bg-emerald-950/20 p-4 space-y-4">
            <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <span className="inline-flex h-4 w-4 items-center justify-center rounded bg-emerald-500 text-white text-[9px] font-black">2</span>
              Jadwal &amp; Waktu
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-600 dark:text-gray-400">Hari *</Label>
                <Select {...register("dayOfWeek")} className="bg-white dark:bg-gray-900">
                  {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-600 dark:text-gray-400">Tahun Ajaran *</Label>
                <Select {...register("academicYearId")} className="bg-white dark:bg-gray-900">
                  {academicYears.map(ay => <option key={ay.id} value={ay.id}>{ay.name} — {ay.semester}</option>)}
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-600 dark:text-gray-400">Jam Mulai *</Label>
                <Controller
                  control={control}
                  name="startTime"
                  render={({ field }) => (
                    <TimeInput value={field.value} onChange={field.onChange} className="bg-white dark:bg-gray-900" />
                  )}
                />
                {errors.startTime && <p className="text-xs text-red-500">{errors.startTime.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-600 dark:text-gray-400">Jam Selesai *</Label>
                <Controller
                  control={control}
                  name="endTime"
                  render={({ field }) => (
                    <TimeInput value={field.value} onChange={field.onChange} className="bg-white dark:bg-gray-900" />
                  )}
                />
                {errors.endTime && <p className="text-xs text-red-500">{errors.endTime.message}</p>}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-1">
            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Batal</Button>
            <Button type="submit" loading={isMutating} className="min-w-[120px]">
              {editing ? "Simpan Perubahan" : "Tambah Jadwal"}
            </Button>
          </div>
        </form>
      </Dialog>

      <ConfirmDialog open={!!deleteDialog} onClose={() => setDeleteDialog(null)} onConfirm={handleDelete} title="Hapus Jadwal" description="Hapus jadwal ini?" loading={isMutating} />
      <ConfirmDialog open={bulkDeleteOpen} onClose={() => setBulkDeleteOpen(false)} onConfirm={handleBulkDelete} title="Hapus Jadwal Masal" description={`Hapus ${Object.keys(rowSelection).filter(k => rowSelection[k]).length} jadwal yang dipilih secara permanen?`} loading={isMutating} />
      <ConfirmDialog open={deleteAllOpen} onClose={() => setDeleteAllOpen(false)} onConfirm={handleDeleteAll} title="Kosongkan Semua Jadwal" description="PERINGATAN: Apakah Anda yakin ingin menghapus SELURUH jadwal pelajaran yang ada? Tindakan ini tidak dapat dibatalkan." loading={isMutating} />
    </div>
  );
}
