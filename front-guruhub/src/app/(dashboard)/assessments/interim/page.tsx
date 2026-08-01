"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FileEdit, CheckCircle2, AlertTriangle, Save, Calculator, Layers } from "lucide-react";
import { api } from "@/services/api";
import { interimReportCardService, InterimSubjectGrade } from "@/services/interimReportCard";
import { useAuthStore } from "@/store/auth.store";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

/* ─────────────────────────────── types ─────────────────────────────── */
interface ClassInfo { id: number; name: string; gradeLevel: string }
interface SubjectInfo { id: number; name: string; code: string; religionGroup: string; gradeLevel?: string }
interface AcademicYearInfo { id: number; year: string; isActive?: boolean }
interface StudentInfo { id: number; name: string; nisn: string; religion: string }

/* ────────────────────────── religion helper ──────────────────────────── */
const RELIGION_GROUPS = ["Islam", "Kristen", "Katolik", "Hindu", "Buddha", "Khonghucu"] as const;

function isAgamaSubject(subject: SubjectInfo): boolean {
  if (subject.religionGroup && subject.religionGroup !== "UMUM") return true;
  const nm = subject.name.toLowerCase();
  return nm.includes("agama") || nm.includes("kepercaya");
}

function studentMatchesSubjectReligion(student: StudentInfo, subject: SubjectInfo): boolean {
  if (!isAgamaSubject(subject)) return true; // mapel non-agama: semua siswa
  const relGroup = subject.religionGroup;
  if (relGroup && relGroup !== "UMUM") {
    return relGroup.toLowerCase() === (student.religion || "").toLowerCase();
  }
  // fallback: deteksi dari nama mapel
  const nm = subject.name.toLowerCase();
  const studentRel = (student.religion || "").toLowerCase();
  for (const r of RELIGION_GROUPS) {
    if (nm.includes(r.toLowerCase())) return r.toLowerCase() === studentRel;
  }
  return true;
}

function getReligionBadgeClass(rel: string) {
  switch ((rel || "").toLowerCase()) {
    case "islam": return "bg-emerald-100 text-emerald-800 border-emerald-200";
    case "kristen": return "bg-blue-100 text-blue-800 border-blue-200";
    case "katolik": return "bg-indigo-100 text-indigo-800 border-indigo-200";
    case "hindu": return "bg-amber-100 text-amber-800 border-amber-200";
    case "buddha": return "bg-orange-100 text-orange-800 border-orange-200";
    default: return "bg-purple-100 text-purple-800 border-purple-200";
  }
}

/* ═══════════════════════════════ PAGE ═══════════════════════════════ */
export default function InterimGradeInputPage() {
  const { currentUser } = useAuthStore();
  const queryClient = useQueryClient();

  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | null>(null);
  const [selectedAyId, setSelectedAyId] = useState<number | null>(null);
  const [semester, setSemester] = useState<"GANJIL" | "GENAP">("GANJIL");
  const [gradesMap, setGradesMap] = useState<Record<number, { tugas1: string; tugas2: string; sts: string; notes: string }>>({});
  const [saveSuccess, setSaveSuccess] = useState(false);

  /* ─── Fetch Base Data ─── */
  const { data: classesData } = useQuery({
    queryKey: ["classes-list"],
    queryFn: () => api.get("/classes?limit=200"),
  });
  const { data: ayData } = useQuery({
    queryKey: ["academic-years"],
    queryFn: () => api.get("/academic-years"),
  });
  const { data: subjectsData } = useQuery({
    queryKey: ["subjects-list"],
    queryFn: () => api.get("/subjects?limit=200"),
  });

  const classes: ClassInfo[] = classesData?.data || classesData || [];
  const academicYears: AcademicYearInfo[] = ayData?.data || ayData || [];
  const allSubjects: SubjectInfo[] = subjectsData?.data || subjectsData || [];

  // Set default active AY & class
  useEffect(() => {
    const active = academicYears.find((ay) => ay.isActive);
    if (active && !selectedAyId) setSelectedAyId(active.id);
  }, [academicYears, selectedAyId]);

  /* ─── Fetch Students of Selected Class ─── */
  const { data: studentsData, isLoading: loadingStudents } = useQuery({
    queryKey: ["class-students", selectedClassId, selectedAyId],
    queryFn: () =>
      api.get(`/class-members?classId=${selectedClassId}&academicYearId=${selectedAyId}&status=ACTIVE&limit=200`),
    enabled: !!selectedClassId && !!selectedAyId,
  });
  const rawStudents: any[] = studentsData?.data || studentsData || [];
  const allStudents: StudentInfo[] = rawStudents.map((m: any) => ({
    id: m.studentId || m.student?.id,
    name: m.studentName || m.student?.name || m.name,
    nisn: m.nisn || m.student?.nisn || "-",
    religion: m.student?.religion || m.religion || "Islam",
  }));

  /* ─── Fetch Class Interim Reports to Pre-fill Existing Grades ─── */
  const { data: classReportsData } = useQuery({
    queryKey: ["interim-class-reports", selectedClassId, selectedAyId, semester],
    queryFn: () => interimReportCardService.getClassReports(selectedClassId!, selectedAyId!, semester),
    enabled: !!selectedClassId && !!selectedAyId,
  });

  const existingReports: any[] = classReportsData?.data || classReportsData || [];

  const selectedClass = classes.find((c) => c.id === selectedClassId) || null;

  /* Filter mapel berdasarkan tingkat kelas siswa/kelas yang dipilih */
  const availableSubjects = selectedClass
    ? allSubjects.filter((s) => !s.gradeLevel || s.gradeLevel === selectedClass.gradeLevel)
    : allSubjects;

  /* ─── Derive Selected Subject ─── */
  const selectedSubject = availableSubjects.find((s) => s.id === selectedSubjectId) || null;

  /* ─── 3-Way Religion Filter: only students whose religion matches the subject ─── */
  const filteredStudents = selectedSubject
    ? allStudents.filter((st) => studentMatchesSubjectReligion(st, selectedSubject))
    : allStudents;

  /* Auto Populate / Reset grades map when students, subject, or reports change */
  useEffect(() => {
    if (!selectedSubjectId) {
      setGradesMap({});
      return;
    }
    const map: typeof gradesMap = {};
    filteredStudents.forEach((st) => {
      const studentReport = existingReports.find((r) => r.studentId === st.id || r.student?.id === st.id);
      const subjEntry = (studentReport?.subjects || []).find((s: any) => s.subjectId === selectedSubjectId);

      map[st.id] = {
        tugas1: subjEntry?.tugas1 !== null && subjEntry?.tugas1 !== undefined ? String(subjEntry.tugas1) : "",
        tugas2: subjEntry?.tugas2 !== null && subjEntry?.tugas2 !== undefined ? String(subjEntry.tugas2) : "",
        sts: subjEntry?.sts !== null && subjEntry?.sts !== undefined ? String(subjEntry.sts) : "",
        notes: subjEntry?.notes || "",
      };
    });
    setGradesMap(map);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSubjectId, selectedClassId, selectedAyId, semester, existingReports]);

  /* ─── Batch Save Mutation ─── */
  const batchSaveMutation = useMutation({
    mutationFn: () => {
      const grades: InterimSubjectGrade[] = filteredStudents.map((st) => ({
        studentId: st.id,
        tugas1: gradesMap[st.id]?.tugas1 !== "" ? Number(gradesMap[st.id]?.tugas1) : null,
        tugas2: gradesMap[st.id]?.tugas2 !== "" ? Number(gradesMap[st.id]?.tugas2) : null,
        sts: gradesMap[st.id]?.sts !== "" ? Number(gradesMap[st.id]?.sts) : null,
        notes: gradesMap[st.id]?.notes || undefined,
      }));
      return interimReportCardService.batchSaveGrades({
        classId: selectedClassId!,
        subjectId: selectedSubjectId!,
        academicYearId: selectedAyId!,
        semester,
        grades,
      });
    },
    onSuccess: () => {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3500);
      queryClient.invalidateQueries({ queryKey: ["interim-class-reports"] });
      queryClient.invalidateQueries({ queryKey: ["interim-report-cards"] });
    },
  });

  /* ─── Helpers ─── */
  const handleGradeChange = (studentId: number, field: string, value: string) => {
    setGradesMap((prev) => ({
      ...prev,
      [studentId]: { ...prev[studentId], [field]: value },
    }));
  };

  const calcPreview = (studentId: number): string => {
    const g = gradesMap[studentId];
    if (!g) return "-";
    const t1 = g.tugas1 !== "" ? Number(g.tugas1) : null;
    const t2 = g.tugas2 !== "" ? Number(g.tugas2) : null;
    const sts = g.sts !== "" ? Number(g.sts) : null;
    if (t1 === null && t2 === null && sts === null) return "-";
    const score = Math.round(((t1 ?? 0) + (t2 ?? 0) + 2 * (sts ?? 0)) / 4);
    const grade = score >= 90 ? "A" : score >= 80 ? "B" : score >= 70 ? "C" : "D";
    return `${score} (${grade})`;
  };

  const isAgama = selectedSubject ? isAgamaSubject(selectedSubject) : false;
  const canSave = !!selectedClassId && !!selectedSubjectId && !!selectedAyId && filteredStudents.length > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
            <FileEdit className="h-6 w-6 text-indigo-600" /> Input Nilai Sisipan
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Masukkan Nilai Tugas 1, Tugas 2, dan STS untuk Rapor Sisipan. Mata pelajaran agama menyaring siswa secara otomatis.
          </p>
        </div>
      </div>

      {/* Filter Toolbar Container */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {/* Kelas */}
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold uppercase text-slate-500 tracking-wider">Kelas</Label>
          <Select
            value={selectedClassId ? String(selectedClassId) : ""}
            onChange={(e) => {
              setSelectedClassId(e.target.value ? Number(e.target.value) : null);
              setSelectedSubjectId(null);
            }}
          >
            <option value="">-- Pilih Kelas --</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </Select>
        </div>

        {/* Mata Pelajaran */}
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold uppercase text-slate-500 tracking-wider">Mata Pelajaran</Label>
          <Select
            value={selectedSubjectId ? String(selectedSubjectId) : ""}
            onChange={(e) => setSelectedSubjectId(e.target.value ? Number(e.target.value) : null)}
          >
            <option value="">-- Pilih Mapel {selectedClass ? `(Kelas ${selectedClass.gradeLevel})` : ""} --</option>
            {availableSubjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}{isAgamaSubject(s) && s.religionGroup !== "UMUM" ? ` [Agama ${s.religionGroup}]` : ""}
              </option>
            ))}
          </Select>
        </div>

        {/* Tahun Ajaran */}
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold uppercase text-slate-500 tracking-wider">Tahun Ajaran</Label>
          <Select
            value={selectedAyId ? String(selectedAyId) : ""}
            onChange={(e) => setSelectedAyId(e.target.value ? Number(e.target.value) : null)}
          >
            <option value="">-- Tahun Ajaran --</option>
            {academicYears.map((ay) => (
              <option key={ay.id} value={ay.id}>
                {ay.year}{ay.isActive ? " (Aktif)" : ""}
              </option>
            ))}
          </Select>
        </div>

        {/* Semester */}
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold uppercase text-slate-500 tracking-wider">Semester</Label>
          <Select
            value={semester}
            onChange={(e) => setSemester(e.target.value as "GANJIL" | "GENAP")}
          >
            <option value="GANJIL">Semester Ganjil</option>
            <option value="GENAP">Semester Genap</option>
          </Select>
        </div>
      </div>

      {/* Active Religion Filter Badge Banner */}
      {isAgama && selectedSubject && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 shadow-sm">
          <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
          <div className="text-xs sm:text-sm">
            <p className="font-semibold text-amber-900">
              Filter Agama Aktif — {selectedSubject.religionGroup !== "UMUM" ? selectedSubject.religionGroup : "Terdeteksi dari Nama Mapel"}
            </p>
            <p className="text-amber-700 mt-0.5">
              Hanya siswa beragama <strong>{selectedSubject.religionGroup !== "UMUM" ? selectedSubject.religionGroup : "sesuai mapel"}</strong> yang ditampilkan (<strong>{filteredStudents.length}</strong> siswa dari total {allStudents.length} siswa kelas).
            </p>
          </div>
        </div>
      )}

      {/* Formula Info Banner */}
      <div className="flex items-center gap-3 p-3.5 rounded-xl bg-indigo-50/80 border border-indigo-100 text-indigo-900 text-xs sm:text-sm">
        <Calculator className="h-4 w-4 text-indigo-600 shrink-0" />
        <div>
          <strong>Formula Nilai Akhir Sisipan:</strong> (Tugas 1 + Tugas 2 + (2 × STS)) ÷ 4 &nbsp;|&nbsp; Predikat: <strong>A</strong> ≥ 90, <strong>B</strong> ≥ 80, <strong>C</strong> ≥ 70, <strong>D</strong> &lt; 70
        </div>
      </div>

      {/* Main Table / Empty State Container */}
      {selectedClassId && selectedSubjectId ? (
        loadingStudents ? (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 text-center text-slate-500 text-sm">
            <div className="h-7 w-7 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            Memuat data siswa kelas…
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 text-center text-slate-500 text-sm">
            <p className="font-medium text-slate-700">Tidak ada siswa ditemukan</p>
            <p className="text-xs text-slate-400 mt-1">
              {isAgama
                ? `Tidak ada siswa beragama ${selectedSubject?.religionGroup || "terkait"} di kelas ini.`
                : "Belum ada anggota siswa aktif di kelas yang dipilih."}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs sm:text-sm text-left">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 uppercase tracking-wider font-semibold text-[11px]">
                  <tr>
                    <th className="px-4 py-3.5 text-center w-12">No</th>
                    <th className="px-4 py-3.5">Nama Siswa</th>
                    <th className="px-4 py-3.5 text-center w-28">Agama</th>
                    <th className="px-4 py-3.5 text-center w-28">Tugas 1</th>
                    <th className="px-4 py-3.5 text-center w-28">Tugas 2</th>
                    <th className="px-4 py-3.5 text-center w-28">STS</th>
                    <th className="px-4 py-3.5 text-center w-32">Nilai Akhir</th>
                    <th className="px-4 py-3.5">Deskripsi / Catatan Capaian</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {filteredStudents.map((st, idx) => {
                    const g = gradesMap[st.id] || { tugas1: "", tugas2: "", sts: "", notes: "" };
                    const preview = calcPreview(st.id);
                    const numericScore = preview !== "-" ? Number(preview.split(" ")[0]) : null;

                    return (
                      <tr key={st.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-4 py-3 text-center text-slate-400 font-mono">{idx + 1}</td>
                        <td className="px-4 py-3 font-medium text-slate-900">
                          {st.name}
                          <span className="block text-[11px] font-mono text-slate-400 font-normal">NISN: {st.nisn}</span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border ${getReligionBadgeClass(st.religion)}`}>
                            {st.religion || "Islam"}
                          </span>
                        </td>
                        {/* Tugas 1 */}
                        <td className="px-3 py-2 text-center">
                          <input
                            type="number" min="0" max="100"
                            value={g.tugas1}
                            onChange={(e) => handleGradeChange(st.id, "tugas1", e.target.value)}
                            placeholder="-"
                            className="w-20 px-2 py-1.5 text-center bg-white border border-slate-300 rounded-lg text-slate-900 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          />
                        </td>
                        {/* Tugas 2 */}
                        <td className="px-3 py-2 text-center">
                          <input
                            type="number" min="0" max="100"
                            value={g.tugas2}
                            onChange={(e) => handleGradeChange(st.id, "tugas2", e.target.value)}
                            placeholder="-"
                            className="w-20 px-2 py-1.5 text-center bg-white border border-slate-300 rounded-lg text-slate-900 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          />
                        </td>
                        {/* STS */}
                        <td className="px-3 py-2 text-center">
                          <input
                            type="number" min="0" max="100"
                            value={g.sts}
                            onChange={(e) => handleGradeChange(st.id, "sts", e.target.value)}
                            placeholder="-"
                            className="w-20 px-2 py-1.5 text-center bg-white border border-slate-300 rounded-lg text-slate-900 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          />
                        </td>
                        {/* Preview Nilai */}
                        <td className="px-4 py-3 text-center font-bold font-mono">
                          {numericScore === null ? (
                            <span className="text-slate-300">-</span>
                          ) : (
                            <span className={numericScore >= 80 ? "text-emerald-600" : numericScore >= 70 ? "text-indigo-600" : "text-amber-600"}>
                              {preview}
                            </span>
                          )}
                        </td>
                        {/* Catatan */}
                        <td className="px-3 py-2">
                          <input
                            type="text"
                            value={g.notes}
                            onChange={(e) => handleGradeChange(st.id, "notes", e.target.value)}
                            placeholder="Input deskripsi capaian..."
                            className="w-full min-w-[220px] px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Bottom Footer Actions */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-xs text-slate-500">
                Menampilkan <strong>{filteredStudents.length}</strong> siswa untuk mata pelajaran <strong>{selectedSubject?.name}</strong>.
              </div>
              <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                {saveSuccess && (
                  <span className="text-emerald-600 font-semibold text-xs sm:text-sm flex items-center gap-1.5 animate-fadeIn">
                    <CheckCircle2 className="h-4 w-4" /> Nilai berhasil disimpan!
                  </span>
                )}
                {batchSaveMutation.isError && (
                  <span className="text-rose-600 font-medium text-xs sm:text-sm">
                    Gagal menyimpan nilai, silakan coba lagi.
                  </span>
                )}
                <Button
                  onClick={() => canSave && batchSaveMutation.mutate()}
                  disabled={!canSave || batchSaveMutation.isPending}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm gap-2"
                >
                  <Save className="h-4 w-4" />
                  {batchSaveMutation.isPending ? "Menyimpan…" : `Simpan Nilai (${filteredStudents.length} Siswa)`}
                </Button>
              </div>
            </div>
          </div>
        )
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-16 text-center text-slate-400 text-sm">
          <Layers className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <p className="font-medium text-slate-600">Pilih Kelas dan Mata Pelajaran</p>
          <p className="text-xs text-slate-400 mt-1">
            Gunakan filter di atas untuk mulai menginput nilai Tugas 1, Tugas 2, dan STS.
          </p>
        </div>
      )}
    </div>
  );
}
