"use client";

import { useState, useEffect } from "react";
import { BarChart3, Plus, Pencil, Trash2, Eye, AlertTriangle } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { Dialog, ConfirmDialog } from "@/components/ui/dialog";
import { useAssessments, useAssessment, useCreateAssessment, useUpdateAssessment, useDeleteAssessment, useSaveScores } from "@/queries/assessments.query";
import { useClasses } from "@/queries/classes.query";
import { useSubjects } from "@/queries/subjects.query";
import { useCategories } from "@/queries/assessment-categories.query";
import { useTeachers } from "@/queries/teachers.query";
import { useAcademicYears } from "@/queries/dashboard.query";
import { useClassMembers } from "@/queries/class-members.query";
import type { Assessment, AssessmentType } from "@/types";
import { getAssessmentTypeLabel, formatDate, getTodayDateInput } from "@/lib/utils";

const ASSESSMENT_TYPES: AssessmentType[] = ["DAILY_TEST", "ASSIGNMENT", "PROJECT", "PRACTICAL", "MIDTERM", "FINAL"];

const schema = z.object({
  classId: z.coerce.number().min(1),
  subjectId: z.coerce.number().min(1),
  teacherId: z.coerce.number().min(1),
  academicYearId: z.coerce.number().min(1),
  categoryId: z.coerce.number().min(1),
  title: z.string().min(1, "Judul wajib diisi"),
  assessmentType: z.enum(["DAILY_TEST","ASSIGNMENT","PROJECT","PRACTICAL","MIDTERM","FINAL"] as const),
  assessmentDate: z.string().min(1),
  maxScore: z.coerce.number().min(1).max(100),
});
type FormData = z.infer<typeof schema>;

function ScoresDialogContent({ assessment, onClose }: { assessment: Assessment; onClose: () => void }) {
  const { data: members = [], isLoading: isMembersLoading } = useClassMembers({ classId: assessment.classId });
  const { data: detail, isLoading: isDetailLoading } = useAssessment(assessment.id);
  const saveScores = useSaveScores();

  const [scores, setScores] = useState<Record<number, { score: string; notes: string }>>({});

  useEffect(() => {
    if (detail?.scores) {
      const init: Record<number, { score: string; notes: string }> = {};
      detail.scores.forEach(s => {
        init[s.studentId] = {
          score: s.score !== null && s.score !== undefined ? String(s.score) : "",
          notes: s.notes || "",
        };
      });
      setScores(init);
    }
  }, [detail]);

  const handleSaveScores = async () => {
    const payload = Object.entries(scores).map(([studentId, item]) => ({
      studentId: Number(studentId),
      score: Number(item.score || 0),
      notes: item.notes || undefined,
    }));

    try {
      await saveScores.mutateAsync({ id: assessment.id, scores: payload });
      onClose();
    } catch {}
  };

  const isLoading = isMembersLoading || isDetailLoading;

  const hasBelowKkm = Object.values(scores).some(
    item => item.score !== "" && Number(item.score) < 75
  );

  return (
    <div className="space-y-3">
      {isLoading ? (
        <div className="flex justify-center py-8"><div className="h-6 w-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <>
          {hasBelowKkm && (
            <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 text-red-700 dark:text-red-400 px-4 py-2.5 rounded-lg text-xs flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0" />
              <span>Perhatian: Terdapat siswa dengan nilai di bawah KKM (75).</span>
            </div>
          )}
          <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="bg-gray-50 dark:bg-gray-800 px-4 py-2 grid grid-cols-4 text-xs font-semibold text-gray-500 uppercase">
              <span className="col-span-2">Nama Siswa</span>
              <span>Nilai (0–{assessment.maxScore})</span>
              <span>Catatan</span>
            </div>
            <div className="divide-y divide-gray-100 dark:divide-gray-800 max-h-72 overflow-y-auto">
              {members.length === 0 ? (
                <div className="p-4 text-center text-sm text-gray-500">Tidak ada siswa di kelas ini.</div>
              ) : (
                members.map((member, index) => (
                  <div key={member.studentId} className="grid grid-cols-4 items-center gap-2 px-4 py-2 hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors">
                    <span className="col-span-2 text-sm text-gray-800 dark:text-gray-200">{member.student?.name ?? `Siswa #${member.studentId}`}</span>
                    <Input
                      data-score-index={index}
                      type="number"
                      min={0}
                      max={assessment.maxScore}
                      className={`h-8 text-sm ${
                        scores[member.studentId]?.score !== "" && Number(scores[member.studentId]?.score) < 75
                          ? "border-red-300 focus-visible:ring-red-500 dark:border-red-900/50 bg-red-50/30 dark:bg-red-950/10"
                          : ""
                      }`}
                      value={scores[member.studentId]?.score ?? ""}
                    onChange={e => setScores(prev => ({
                      ...prev,
                      [member.studentId]: {
                        ...prev[member.studentId],
                        score: e.target.value,
                      }
                    }))}
                    onKeyDown={(e) => {
                      let targetSelector = null;
                      if (e.key === "Enter" && !e.shiftKey) targetSelector = `input[data-score-index="${index + 1}"]`;
                      else if (e.key === "Enter" && e.shiftKey) targetSelector = `input[data-score-index="${index - 1}"]`;
                      else if (e.key === "ArrowDown") { e.preventDefault(); targetSelector = `input[data-score-index="${index + 1}"]`; }
                      else if (e.key === "ArrowUp") { e.preventDefault(); targetSelector = `input[data-score-index="${index - 1}"]`; }
                      else if (e.key === "ArrowRight") targetSelector = `input[data-notes-index="${index}"]`;
                      
                      if (targetSelector) {
                        if (e.key === "Enter") e.preventDefault();
                        const nextInput = document.querySelector(targetSelector) as HTMLInputElement;
                        if (nextInput) {
                          nextInput.focus();
                          nextInput.select();
                        }
                      }
                    }}
                  />
                  <Input
                    data-notes-index={index}
                    className="h-8 text-xs"
                    placeholder="Catatan"
                    value={scores[member.studentId]?.notes ?? ""}
                    onChange={e => setScores(prev => ({
                      ...prev,
                      [member.studentId]: {
                        ...prev[member.studentId],
                        notes: e.target.value,
                      }
                    }))}
                    onKeyDown={(e) => {
                      let targetSelector = null;
                      if (e.key === "Enter" && !e.shiftKey) targetSelector = `input[data-notes-index="${index + 1}"]`;
                      else if (e.key === "Enter" && e.shiftKey) targetSelector = `input[data-notes-index="${index - 1}"]`;
                      else if (e.key === "ArrowDown") { e.preventDefault(); targetSelector = `input[data-notes-index="${index + 1}"]`; }
                      else if (e.key === "ArrowUp") { e.preventDefault(); targetSelector = `input[data-notes-index="${index - 1}"]`; }
                      else if (e.key === "ArrowLeft") targetSelector = `input[data-score-index="${index}"]`;
                      
                      if (targetSelector) {
                        if (e.key === "Enter") e.preventDefault();
                        const nextInput = document.querySelector(targetSelector) as HTMLInputElement;
                        if (nextInput) {
                          nextInput.focus();
                          nextInput.select();
                        }
                      }
                    }}
                  />
                </div>
              ))
            )}
          </div>
        </div>
        </>
      )}
      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onClose}>Batal</Button>
        <Button onClick={handleSaveScores} loading={saveScores.isPending} disabled={isLoading}>Simpan Nilai</Button>
      </div>
    </div>
  );
}

export default function AssessmentsPage() {
  const { data: assessments = [], isLoading: isFetching } = useAssessments();
  const { data: classes = [] } = useClasses();
  const { data: subjects = [] } = useSubjects();
  const { data: categories = [] } = useCategories();
  const { data: teachers = [] } = useTeachers();
  const { data: academicYears = [] } = useAcademicYears();

  const createAssessment = useCreateAssessment();
  const updateAssessment = useUpdateAssessment();
  const deleteAssessment = useDeleteAssessment();
  const saveScores = useSaveScores();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [scoresDialog, setScoresDialog] = useState<Assessment | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<Assessment | null>(null);
  const [editing, setEditing] = useState<Assessment | null>(null);

  const isMutating = createAssessment.isPending || updateAssessment.isPending || deleteAssessment.isPending || saveScores.isPending;

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  });

  // Sync default values when lookup options load
  useEffect(() => {
    if (classes.length > 0 && subjects.length > 0 && categories.length > 0 && teachers.length > 0 && academicYears.length > 0) {
      reset({
        classId: classes[0].id,
        subjectId: subjects[0].id,
        teacherId: teachers[0].id,
        academicYearId: academicYears.find(ay => ay.isActive)?.id || academicYears[0]?.id || 0,
        categoryId: categories[0].id,
        assessmentType: "DAILY_TEST",
        assessmentDate: getTodayDateInput(),
        maxScore: 100,
      });
    }
  }, [classes, subjects, categories, teachers, academicYears, reset]);

  const openAdd = () => {
    setEditing(null);
    reset({
      classId: classes[0]?.id || 0,
      subjectId: subjects[0]?.id || 0,
      teacherId: teachers[0]?.id || 0,
      academicYearId: academicYears.find(ay => ay.isActive)?.id || academicYears[0]?.id || 0,
      categoryId: categories[0]?.id || 0,
      assessmentType: "DAILY_TEST",
      assessmentDate: getTodayDateInput(),
      maxScore: 100,
    });
    setDialogOpen(true);
  };

  const openEdit = (a: Assessment) => {
    setEditing(a);
    reset({
      classId: a.classId,
      subjectId: a.subjectId,
      teacherId: a.teacherId,
      academicYearId: a.academicYearId,
      categoryId: a.categoryId,
      title: a.title,
      assessmentType: a.assessmentType as any,
      assessmentDate: a.assessmentDate,
      maxScore: a.maxScore,
    });
    setDialogOpen(true);
  };

  const openScores = (a: Assessment) => {
    setScoresDialog(a);
  };

  const onSubmit = async (data: FormData) => {
    const payload = {
      classId: data.classId,
      subjectId: data.subjectId,
      teacherId: data.teacherId,
      academicYearId: data.academicYearId,
      categoryId: data.categoryId,
      title: data.title,
      assessmentType: data.assessmentType,
      assessmentDate: data.assessmentDate,
      maxScore: data.maxScore,
    };

    try {
      if (editing) {
        await updateAssessment.mutateAsync({ id: editing.id, data: payload });
      } else {
        await createAssessment.mutateAsync(payload);
      }
      setDialogOpen(false);
    } catch {}
  };

  const handleDelete = async () => {
    if (!deleteDialog) return;
    try {
      await deleteAssessment.mutateAsync(deleteDialog.id);
      setDeleteDialog(null);
    } catch {}
  };

  const typeBadgeVariant = (type: AssessmentType) => {
    const map: Record<AssessmentType, "default"|"success"|"warning"|"danger"|"info"|"secondary"> = {
      DAILY_TEST: "default", ASSIGNMENT: "info", PROJECT: "success",
      PRACTICAL: "warning", MIDTERM: "danger", FINAL: "danger",
    };
    return map[type] || "default";
  };

  const columns: ColumnDef<Assessment>[] = [
    { accessorKey: "title", header: "Judul Penilaian" },
    { accessorKey: "assessmentType", header: "Tipe", cell: ({ getValue }) => (
      <Badge variant={typeBadgeVariant(getValue() as AssessmentType)}>{getAssessmentTypeLabel(getValue() as string)}</Badge>
    )},
    { id: "mapel", header: "Mata Pelajaran", cell: ({ row }) => row.original.subject?.name ?? subjects.find(s => s.id === row.original.subjectId)?.name ?? "—" },
    { id: "kelas", header: "Kelas", cell: ({ row }) => <Badge variant="secondary">{row.original.class?.name ?? classes.find(c => c.id === row.original.classId)?.name ?? "—"}</Badge> },
    { accessorKey: "assessmentDate", header: "Tanggal", cell: ({ getValue }) => formatDate(getValue() as string) },
    { 
      accessorKey: "maxScore", 
      header: "Maks Skor", 
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <span className="font-mono">{row.original.maxScore}</span>
          {row.original.scores?.some(s => s.score !== null && s.score !== undefined && s.score < 75) && (
            <Badge variant="danger" className="flex items-center gap-1 text-[10px] py-0.5 px-1.5 font-bold animate-pulse">
              <AlertTriangle className="h-3 w-3" />
              Nilai &lt; KKM (75)
            </Badge>
          )}
        </div>
      )
    },
    { id: "actions", header: "Aksi", cell: ({ row }) => (
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => openScores(row.original)}><Eye className="h-3.5 w-3.5 mr-1" /> Nilai</Button>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(row.original)}><Pencil className="h-3.5 w-3.5" /></Button>
        <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => setDeleteDialog(row.original)}><Trash2 className="h-3.5 w-3.5" /></Button>
      </div>
    )},
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2"><BarChart3 className="h-6 w-6 text-purple-600" /> Penilaian</h1>
          <p className="text-sm text-gray-500 mt-1">{assessments.length} penilaian terdaftar</p>
        </div>
        <Button onClick={openAdd} disabled={classes.length === 0}><Plus className="h-4 w-4" /> Tambah Penilaian</Button>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
        {isFetching ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <div className="h-8 w-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-500">Memuat data penilaian...</p>
          </div>
        ) : (
          <DataTable columns={columns} data={assessments} searchKey="title" searchPlaceholder="Cari judul penilaian..." emptyMessage="Belum ada penilaian." />
        )}
      </div>

      {/* Form Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} title={editing ? "Edit Penilaian" : "Tambah Penilaian"} size="lg">
        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-2 gap-4">
          <div className="col-span-2 space-y-1.5">
            <Label>Judul Penilaian *</Label>
            <Input placeholder="Contoh: Ulangan Harian 1 — Bilangan Bulat" {...register("title")} />
            {errors.title && <p className="text-xs text-red-600">{errors.title.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Kelas *</Label>
            <Select {...register("classId")}>
              {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Mata Pelajaran *</Label>
            <Select {...register("subjectId")}>
              {subjects.map(s => <option key={s.id} value={s.id}>{s.name} - {s.gradeLevel}</option>)}
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Guru *</Label>
            <Select {...register("teacherId")}>
              {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Tahun Ajaran *</Label>
            <Select {...register("academicYearId")}>
              {academicYears.map(ay => <option key={ay.id} value={ay.id}>{ay.name} — {ay.semester}</option>)}
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Kategori *</Label>
            <Select {...register("categoryId")}>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Tipe Penilaian *</Label>
            <Select {...register("assessmentType")}>
              {ASSESSMENT_TYPES.map(t => <option key={t} value={t}>{getAssessmentTypeLabel(t)}</option>)}
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Tanggal *</Label>
            <Input type="date" {...register("assessmentDate")} />
          </div>
          <div className="space-y-1.5">
            <Label>Skor Maksimal *</Label>
            <Input type="number" min={1} max={100} {...register("maxScore")} />
            {errors.maxScore && <p className="text-xs text-red-600">{errors.maxScore.message}</p>}
          </div>
          <div className="col-span-2 flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Batal</Button>
            <Button type="submit" loading={isMutating}>{editing ? "Simpan" : "Tambah"}</Button>
          </div>
        </form>
      </Dialog>

      {/* Scores Dialog */}
      {scoresDialog && (
        <Dialog open={!!scoresDialog} onClose={() => setScoresDialog(null)} title={`Input Nilai — ${scoresDialog.title}`} description={`Maks skor: ${scoresDialog.maxScore}`} size="lg">
          <ScoresDialogContent assessment={scoresDialog} onClose={() => setScoresDialog(null)} />
        </Dialog>
      )}

      <ConfirmDialog open={!!deleteDialog} onClose={() => setDeleteDialog(null)} onConfirm={handleDelete} title="Hapus Penilaian" description={`Hapus penilaian "${deleteDialog?.title}"?`} loading={isMutating} />
    </div>
  );
}
