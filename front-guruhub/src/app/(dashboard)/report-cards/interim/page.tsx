"use client";

import { useState, useEffect } from "react";
import { FileText, Eye, Printer, Plus, RefreshCw, Save, BookOpen, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import { useClasses } from "@/queries/classes.query";
import { useAcademicYears } from "@/queries/dashboard.query";
import { useSubjects } from "@/queries/subjects.query";
import { interimReportCardsService } from "@/services/report-cards";
import { api } from "@/services/api";
import { useAuthStore } from "@/store/auth.store";
import type { AcademicYear } from "@/types";

/* ─── 3-Way Religion Filter Helpers ─── */
const RELIGION_GROUPS = ["Islam", "Kristen", "Katolik", "Hindu", "Buddha", "Khonghucu"] as const;

function isAgamaSubject(subject: any): boolean {
  if (subject?.religionGroup && subject.religionGroup !== "UMUM") return true;
  const nm = (subject?.name || "").toLowerCase();
  return nm.includes("agama") || nm.includes("kepercaya");
}

function studentMatchesSubject(studentReligion: string, subject: any): boolean {
  if (!isAgamaSubject(subject)) return true;
  const rg = subject?.religionGroup;
  if (rg && rg !== "UMUM") return rg.toLowerCase() === (studentReligion || "").toLowerCase();
  const nm = (subject?.name || "").toLowerCase();
  const rel = (studentReligion || "").toLowerCase();
  for (const r of RELIGION_GROUPS) {
    if (nm.includes(r.toLowerCase())) return r.toLowerCase() === rel;
  }
  return true;
}

export default function InterimReportCardsPage() {
  const { currentUser } = useAuthStore();
  const { data: classes = [] } = useClasses();
  const { data: academicYears = [] } = useAcademicYears();
  const { data: subjectsRaw = [] } = useSubjects();
  const subjects: any[] = subjectsRaw as any[];

  if (currentUser?.role === "Teacher") {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <AlertTriangle className="h-12 w-12 text-amber-500 mb-3" />
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Akses Ditolak</h2>
        <p className="text-sm text-gray-500 mt-1">Guru Mapel tidak memiliki akses untuk melihat Raport Sisipan.</p>
      </div>
    );
  }

  const activeAcademicYear = academicYears.find((y: AcademicYear) => y.isActive);

  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [selectedAcademicYearId, setSelectedAcademicYearId] = useState<string>("");
  const [selectedSemester, setSelectedSemester] = useState<string>("GANJIL");

  const [reports, setReports] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const [viewModal, setViewModal] = useState<any | null>(null);

  // Batch grade input modal
  const [inputModal, setInputModal] = useState(false);
  const [inputSubjectId, setInputSubjectId] = useState<string>("");
  const [matrixGrades, setMatrixGrades] = useState<Record<number, { tugas1: string; tugas2: string; sts: string; notes: string }>>({});
  const [isSavingBatch, setIsSavingBatch] = useState(false);

  // Auto initialize class and academic year
  useEffect(() => {
    if (activeAcademicYear && !selectedAcademicYearId) {
      setSelectedAcademicYearId(String(activeAcademicYear.id));
      setSelectedSemester(activeAcademicYear.semester === "Genap" ? "GENAP" : "GANJIL");
    }
    if (classes.length > 0 && !selectedClassId) {
      setSelectedClassId(String(classes[0].id));
    }
  }, [classes, activeAcademicYear]);

  const loadReports = async () => {
    if (!selectedClassId || !selectedAcademicYearId) return;
    setIsLoading(true);
    try {
      const data = await interimReportCardsService.getClassReports(
        Number(selectedClassId),
        Number(selectedAcademicYearId),
        selectedSemester
      );
      setReports(data || []);
    } catch (error: any) {
      toast.error(error?.message || "Gagal memuat Raport Sisipan kelas");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedClassId && selectedAcademicYearId) {
      loadReports();
    }
  }, [selectedClassId, selectedAcademicYearId, selectedSemester]);

  const handlePrintPdf = async (reportId: number) => {
    try {
      await api.openBlob(`/pdf/interim-report-card/${reportId}`);
    } catch (err: any) {
      toast.error(err?.message || "Gagal membuka PDF Raport Sisipan");
    }
  };

  const handleOpenInputModal = () => {
    if (reports.length === 0) {
      toast.error("Tidak ada siswa di kelas ini.");
      return;
    }
    if (subjects.length > 0) {
      setInputSubjectId(String(subjects[0].id));
      populateMatrixGrades(subjects[0].id);
    }
    setInputModal(true);
  };

  const populateMatrixGrades = (subjectId: number) => {
    const map: Record<number, { tugas1: string; tugas2: string; sts: string; notes: string }> = {};
    reports.forEach((r) => {
      const subjDetail = (r.subjects || []).find((s: any) => s.subjectId === subjectId);
      map[r.studentId] = {
        tugas1: subjDetail?.tugas1 !== null && subjDetail?.tugas1 !== undefined ? String(subjDetail.tugas1) : "",
        tugas2: subjDetail?.tugas2 !== null && subjDetail?.tugas2 !== undefined ? String(subjDetail.tugas2) : "",
        sts: subjDetail?.sts !== null && subjDetail?.sts !== undefined ? String(subjDetail.sts) : "",
        notes: subjDetail?.notes || "",
      };
    });
    setMatrixGrades(map);
  };

  const handleSubjectChange = (subjIdStr: string) => {
    setInputSubjectId(subjIdStr);
    populateMatrixGrades(Number(subjIdStr));
  };

  const selectedClassObj = classes.find((c: any) => String(c.id) === selectedClassId);
  const availableSubjects = selectedClassObj
    ? subjects.filter((s: any) => !s.gradeLevel || s.gradeLevel === selectedClassObj.gradeLevel)
    : subjects;

  // 3-Way Religion Filtering: students shown in batch input modal
  const selectedSubjectObj = subjects.find((s: any) => String(s.id) === inputSubjectId);
  const isAgamaFilter = isAgamaSubject(selectedSubjectObj);
  const filteredReports = isAgamaFilter
    ? reports.filter((r: any) => studentMatchesSubject(r.student?.religion, selectedSubjectObj))
    : reports;

  const handleSaveMatrix = async () => {
    if (!inputSubjectId || !selectedClassId || !selectedAcademicYearId) return;
    setIsSavingBatch(true);
    try {
      const gradesArray = Object.entries(matrixGrades).map(([studentId, data]) => ({
        studentId: Number(studentId),
        tugas1: data.tugas1 !== "" ? Number(data.tugas1) : null,
        tugas2: data.tugas2 !== "" ? Number(data.tugas2) : null,
        sts: data.sts !== "" ? Number(data.sts) : null,
        notes: data.notes || undefined,
      }));

      await interimReportCardsService.batchSaveGrades({
        classId: Number(selectedClassId),
        subjectId: Number(inputSubjectId),
        academicYearId: Number(selectedAcademicYearId),
        semester: selectedSemester,
        grades: gradesArray,
      });

      toast.success("Nilai Raport Sisipan berhasil disimpan!");
      setInputModal(false);
      loadReports();
    } catch (error: any) {
      toast.error(error?.message || "Gagal menyimpan nilai");
    } finally {
      setIsSavingBatch(false);
    }
  };

  const getReligionBadgeColor = (rel: string) => {
    switch (rel?.toLowerCase()) {
      case "islam": return "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300";
      case "kristen": return "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300";
      case "katolik": return "bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300";
      case "hindu": return "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300";
      case "buddha": return "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300";
      default: return "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <FileText className="h-6 w-6 text-indigo-600" /> Raport Sisipan (Mid-Term)
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Penilaian Sisipan berbasis 3 komponen (2 Tugas + 1 STS) dengan penyaringan 5 Agama otomatis.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={loadReports} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} /> Refresh
          </Button>
          <Button onClick={handleOpenInputModal} className="bg-indigo-600 hover:bg-indigo-700">
            <Plus className="h-4 w-4 mr-2" /> Input Nilai Sisipan
          </Button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-1">
          <Label className="text-xs font-semibold text-gray-600">Tahun Ajaran</Label>
          <Select value={selectedAcademicYearId} onChange={(e) => setSelectedAcademicYearId(e.target.value)}>
            {academicYears.map((ay: AcademicYear) => (
              <option key={ay.id} value={ay.id}>{ay.name}</option>
            ))}
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs font-semibold text-gray-600">Semester</Label>
          <Select value={selectedSemester} onChange={(e) => setSelectedSemester(e.target.value)}>
            <option value="GANJIL">Semester Ganjil</option>
            <option value="GENAP">Semester Genap</option>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs font-semibold text-gray-600">Kelas</Label>
          <Select value={selectedClassId} onChange={(e) => setSelectedClassId(e.target.value)}>
            <option value="" disabled>Pilih Kelas</option>
            {classes.map((c: any) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </Select>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <div className="h-8 w-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-500">Memuat Raport Sisipan...</p>
          </div>
        ) : reports.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            Pilih kelas dan tahun ajaran untuk melihat atau mengelola Raport Sisipan.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-300">No</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-300">Nama Siswa</th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-600 dark:text-gray-300">Agama</th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-600 dark:text-gray-300">Mapel Terdata</th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-600 dark:text-gray-300">Rata-Rata Nilai</th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-600 dark:text-gray-300">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {reports.map((r, idx) => {
                  const subjs = r.subjects || [];
                  const sumScores = subjs.reduce((acc: number, s: any) => acc + (s.finalScore || 0), 0);
                  const avgScore = subjs.length > 0 ? Math.round(sumScores / subjs.length) : 0;

                  return (
                    <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="px-4 py-3 text-gray-500">{idx + 1}</td>
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">
                        {r.student?.name}
                        <span className="block text-xs font-mono text-gray-400">NISN: {r.student?.nisn || "-"}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${getReligionBadgeColor(r.student?.religion)}`}>
                          {r.student?.religion || "Islam"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant="secondary" className="gap-1">
                          <BookOpen className="h-3 w-3 text-indigo-500" /> {subjs.length} Mapel
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-center font-mono font-bold text-indigo-600 dark:text-indigo-400">
                        {avgScore}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Button size="sm" variant="ghost" onClick={() => setViewModal(r)}>
                            <Eye className="h-3.5 w-3.5 mr-1" /> Lihat
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handlePrintPdf(r.id)}>
                            <Printer className="h-3.5 w-3.5 mr-1" /> Cetak PDF
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Pratinjau Raport Sisipan */}
      {viewModal && (
        <Dialog
          open={!!viewModal}
          onClose={() => setViewModal(null)}
          title={`Raport Sisipan — ${viewModal.student?.name}`}
          description={`Kelas ${viewModal.class?.name} • Agama ${viewModal.student?.religion || "Islam"} • ${selectedSemester}`}
          size="xl"
        >
          <div className="space-y-4">
            <div className="bg-indigo-50 dark:bg-indigo-950/40 p-3 rounded-lg flex items-center justify-between text-xs text-indigo-800 dark:text-indigo-200 font-medium">
              <span>* Pembobotan Nilai Sisipan disetujui: (Tugas 1 + Tugas 2 + 2 &times; STS) / 4</span>
              <Button size="sm" variant="outline" onClick={() => handlePrintPdf(viewModal.id)}>
                <Printer className="h-3.5 w-3.5 mr-1" /> Cetak Form Sisipan (PDF)
              </Button>
            </div>

            <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-gray-100 dark:bg-gray-800">
                  <tr>
                    <th className="px-3 py-2 text-left">Mata Pelajaran</th>
                    <th className="px-3 py-2 text-center w-16">Tugas 1</th>
                    <th className="px-3 py-2 text-center w-16">Tugas 2</th>
                    <th className="px-3 py-2 text-center w-16">STS</th>
                    <th className="px-3 py-2 text-center w-20 bg-indigo-50 dark:bg-indigo-900/50">Rata-Rata</th>
                    <th className="px-3 py-2 text-center w-16">Predikat</th>
                    <th className="px-3 py-2 text-left">Deskripsi / Catatan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {(viewModal.subjects || []).map((s: any) => (
                    <tr key={s.id}>
                      <td className="px-3 py-2 font-medium">{s.subject?.name}</td>
                      <td className="px-3 py-2 text-center font-mono">{s.tugas1 ?? "-"}</td>
                      <td className="px-3 py-2 text-center font-mono">{s.tugas2 ?? "-"}</td>
                      <td className="px-3 py-2 text-center font-mono">{s.sts ?? "-"}</td>
                      <td className="px-3 py-2 text-center font-mono font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/20">
                        {s.finalScore}
                      </td>
                      <td className="px-3 py-2 text-center font-bold">{s.gradeLetter}</td>
                      <td className="px-3 py-2 text-gray-600 dark:text-gray-300">{s.notes || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg text-xs space-y-1">
              <span className="font-semibold text-gray-700 dark:text-gray-300">Catatan Wali Kelas:</span>
              <p className="italic text-gray-600 dark:text-gray-400">
                {viewModal.homeroomTeacherNotes || "Tingkatkan kedisiplinan dan semangat belajar."}
              </p>
            </div>
          </div>
        </Dialog>
      )}

      {/* Modal Input Nilai Sisipan Matriks Batch */}
      <Dialog
        open={inputModal}
        onClose={() => !isSavingBatch && setInputModal(false)}
        title="Input Nilai Sisipan Matriks Kelas"
        description="Masukkan Nilai Tugas 1, Tugas 2, dan STS untuk seluruh siswa per Mata Pelajaran."
        size="xl"
      >
        <div className="space-y-4">
          <div className="space-y-1">
            <Label className="text-xs font-semibold">Pilih Mata Pelajaran {selectedClassObj ? `(Kelas ${selectedClassObj.gradeLevel})` : ""}</Label>
            <Select value={inputSubjectId} onChange={(e) => handleSubjectChange(e.target.value)} disabled={isSavingBatch}>
              {availableSubjects.map((subj: any) => (
                <option key={subj.id} value={subj.id}>
                  {subj.name} {subj.religionGroup && subj.religionGroup !== "UMUM" ? `(Agama ${subj.religionGroup})` : ""}
                </option>
              ))}
            </Select>
          </div>

          {/* 3-Way Religion Filter Info Banner */}
          {isAgamaFilter && selectedSubjectObj && (
            <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-50 border border-amber-200 dark:bg-amber-950/30 dark:border-amber-800 text-xs">
              <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold text-amber-800 dark:text-amber-300">
                  Filter Agama Aktif — {selectedSubjectObj?.religionGroup && selectedSubjectObj.religionGroup !== "UMUM" ? selectedSubjectObj.religionGroup : "Terdeteksi dari nama mapel"}
                </p>
                <p className="text-amber-700 dark:text-amber-400 mt-0.5">
                  Menampilkan <strong>{filteredReports.length}</strong> dari {reports.length} siswa kelas yang agamanya sesuai mata pelajaran ini.
                </p>
              </div>
            </div>
          )}

          <div className="max-h-96 overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-800">
            <table className="w-full text-xs">
              <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0">
                <tr>
                  <th className="px-3 py-2 text-left">Nama Siswa</th>
                  <th className="px-3 py-2 text-center">Agama</th>
                  <th className="px-3 py-2 text-center w-20">Tugas 1</th>
                  <th className="px-3 py-2 text-center w-20">Tugas 2</th>
                  <th className="px-3 py-2 text-center w-20">STS</th>
                  <th className="px-3 py-2 text-left w-56">Deskripsi / Catatan Capaian</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {filteredReports.map((r) => {
                  const studentId = r.studentId;
                  const item = matrixGrades[studentId] || { tugas1: "", tugas2: "", sts: "", notes: "" };

                  return (
                    <tr key={studentId}>
                      <td className="px-3 py-2 font-medium">{r.student?.name}</td>
                      <td className="px-3 py-2 text-center text-[10px]">
                        <span className={`px-2 py-0.5 rounded-full font-semibold ${getReligionBadgeColor(r.student?.religion)}`}>
                          {r.student?.religion || "Islam"}
                        </span>
                      </td>
                      <td className="px-2 py-1">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          className="w-full border rounded px-2 py-1 text-center font-mono text-xs dark:bg-gray-800 dark:border-gray-700"
                          value={item.tugas1}
                          onChange={(e) =>
                            setMatrixGrades((prev) => ({
                              ...prev,
                              [studentId]: { ...prev[studentId], tugas1: e.target.value },
                            }))
                          }
                        />
                      </td>
                      <td className="px-2 py-1">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          className="w-full border rounded px-2 py-1 text-center font-mono text-xs dark:bg-gray-800 dark:border-gray-700"
                          value={item.tugas2}
                          onChange={(e) =>
                            setMatrixGrades((prev) => ({
                              ...prev,
                              [studentId]: { ...prev[studentId], tugas2: e.target.value },
                            }))
                          }
                        />
                      </td>
                      <td className="px-2 py-1">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          className="w-full border rounded px-2 py-1 text-center font-mono text-xs dark:bg-gray-800 dark:border-gray-700"
                          value={item.sts}
                          onChange={(e) =>
                            setMatrixGrades((prev) => ({
                              ...prev,
                              [studentId]: { ...prev[studentId], sts: e.target.value },
                            }))
                          }
                        />
                      </td>
                      <td className="px-2 py-1">
                        <input
                          type="text"
                          placeholder="Input deskripsi / catatan capaian..."
                          className="w-full border rounded px-2 py-1 text-xs dark:bg-gray-800 dark:border-gray-700 min-w-[200px]"
                          value={item.notes}
                          onChange={(e) =>
                            setMatrixGrades((prev) => ({
                              ...prev,
                              [studentId]: { ...prev[studentId], notes: e.target.value },
                            }))
                          }
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-gray-100 dark:border-gray-800">
            <Button variant="outline" onClick={() => setInputModal(false)} disabled={isSavingBatch}>
              Batal
            </Button>
            <Button onClick={handleSaveMatrix} disabled={isSavingBatch} className="bg-indigo-600 hover:bg-indigo-700">
              {isSavingBatch ? (
                <>Simpan Memproses...</>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-1.5" /> Simpan Semua Nilai Sisipan
                </>
              )}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
