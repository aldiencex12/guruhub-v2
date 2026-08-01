"use client";

import { useState } from "react";
import { FileText, Eye, Send, Printer, CheckCircle, Clock, Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/tables/DataTable";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import { useReportCards, usePublishReportCard, useCreateReportCard } from "@/queries/report-cards.query";
import { useClasses } from "@/queries/classes.query";
import { useAcademicYears } from "@/queries/dashboard.query";
import { useClassMembers } from "@/queries/class-members.query";
import type { ReportCard, AcademicYear } from "@/types";
import { getGradeColor, formatDate } from "@/lib/utils";

export default function ReportCardsPage() {
  const { data: reports = [], isLoading: isFetching } = useReportCards();
  const { data: classes = [] } = useClasses();
  const { data: academicYears = [] } = useAcademicYears();

  const publishReportCard = usePublishReportCard();
  const createReportCard = useCreateReportCard();

  const [viewDialog, setViewDialog] = useState<ReportCard | null>(null);
  const [generateDialog, setGenerateDialog] = useState(false);
  const [classFilter, setClassFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const [genClassId, setGenClassId] = useState<string>("");
  const [genAcademicYearId, setGenAcademicYearId] = useState<string>("");
  const [genSemester, setGenSemester] = useState<string>("GANJIL");
  const [isGenerating, setIsGenerating] = useState(false);

  const activeAcademicYear = academicYears.find((y: AcademicYear) => y.isActive);

  const { data: classMembers = [] } = useClassMembers({ classId: Number(genClassId) || 0 });

  const filtered = reports.filter(r => {
    if (classFilter !== "all" && r.classId !== Number(classFilter)) return false;
    if (statusFilter !== "all" && r.status !== statusFilter) return false;
    return true;
  });

  const handlePublish = async (id: number) => {
    try {
      await publishReportCard.mutateAsync(id);
      if (viewDialog?.id === id) {
        setViewDialog(prev => prev ? { ...prev, status: "PUBLISHED" as const, publishedAt: new Date().toISOString() } : null);
      }
    } catch {}
  };

  const handlePrint = (report: ReportCard) => {
    toast.info("Fitur cetak PDF akan segera tersedia");
  };

  const handleGenerate = async () => {
    if (!genClassId || !genAcademicYearId || !genSemester) {
      toast.error("Mohon lengkapi semua isian");
      return;
    }

    const activeMembers = classMembers;
    if (activeMembers.length === 0) {
      toast.error("Tidak ada siswa di kelas ini");
      return;
    }

    setIsGenerating(true);
    let successCount = 0;
    let failCount = 0;

    for (const member of activeMembers) {
      try {
        await createReportCard.mutateAsync({
          studentId: member.studentId,
          academicYearId: Number(genAcademicYearId),
          semester: genSemester,
        });
        successCount++;
      } catch (error: any) {
        failCount++;
        // Expected if the report card already exists, skip quietly
      }
    }

    setIsGenerating(false);
    setGenerateDialog(false);
    toast.success(`Berhasil memproses rapor. ${successCount} berhasil, ${failCount} dilewati (mungkin sudah ada)`);
  };

  const columns: ColumnDef<ReportCard>[] = [
    { id: "student", header: "Nama Siswa", cell: ({ row }) => (
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
          {row.original.student?.name?.charAt(0) || "S"}
        </div>
        <div>
          <p className="font-medium text-gray-900 dark:text-gray-100">{row.original.student?.name || `Siswa #${row.original.studentId}`}</p>
          <p className="text-xs text-gray-400">{row.original.student?.nisn}</p>
        </div>
      </div>
    )},
    { id: "kelas", header: "Kelas", cell: ({ row }) => <Badge variant="secondary">{row.original.class?.name ?? "—"}</Badge> },
    { accessorKey: "semester", header: "Semester", cell: ({ getValue }) => getValue() === "GANJIL" ? "Semester 1" : "Semester 2" },
    { id: "tahun", header: "Tahun Ajaran", cell: ({ row }) => row.original.academicYear?.name ?? "—" },
    { accessorKey: "status", header: "Status", cell: ({ row }) => (
      <div className="flex items-center gap-1.5">
        {row.original.status === "PUBLISHED" ? (
          <><CheckCircle className="h-3.5 w-3.5 text-emerald-600" /><Badge variant="success">Diterbitkan</Badge></>
        ) : (
          <><Clock className="h-3.5 w-3.5 text-amber-600" /><Badge variant="warning">Draft</Badge></>
        )}
      </div>
    )},
    { id: "actions", header: "Aksi", cell: ({ row }) => (
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="sm" className="h-7" onClick={() => setViewDialog(row.original)}>
          <Eye className="h-3.5 w-3.5 mr-1" /> Lihat
        </Button>
        {row.original.status === "DRAFT" && (
          <Button variant="ghost" size="sm" className="h-7 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50" loading={publishReportCard.isPending && publishReportCard.variables === row.original.id} onClick={() => handlePublish(row.original.id)}>
            <Send className="h-3.5 w-3.5 mr-1" /> Publish
          </Button>
        )}
        <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-500" onClick={() => handlePrint(row.original)}>
          <Printer className="h-3.5 w-3.5" />
        </Button>
      </div>
    )},
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2"><FileText className="h-6 w-6 text-indigo-600" /> Rapor</h1>
          <p className="text-sm text-gray-500 mt-1">{reports.length} rapor tersedia</p>
        </div>
        <Button onClick={() => {
          setGenAcademicYearId(String(activeAcademicYear?.id || ""));
          setGenSemester(activeAcademicYear?.semester === "Genap" ? "GENAP" : "GANJIL");
          setGenClassId("");
          setGenerateDialog(true);
        }}>
          <Plus className="h-4 w-4 mr-2" /> Generate Rapor
        </Button>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
        {isFetching ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <div className="h-8 w-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-500">Memuat data rapor...</p>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={filtered}
            searchPlaceholder="Cari nama siswa..."
            emptyMessage="Belum ada rapor."
            toolbar={
              <div className="flex gap-2">
                <Select value={classFilter} onChange={e => setClassFilter(e.target.value)} className="w-32">
                  <option value="all">Semua Kelas</option>
                  {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </Select>
                <Select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="w-36">
                  <option value="all">Semua Status</option>
                  <option value="DRAFT">Draft</option>
                  <option value="PUBLISHED">Diterbitkan</option>
                </Select>
              </div>
            }
          />
        )}
      </div>

      {/* Detail Dialog */}
      {viewDialog && (
        <Dialog open={!!viewDialog} onClose={() => setViewDialog(null)} title={`Rapor — ${viewDialog.student?.name || `Siswa #${viewDialog.studentId}`}`} description={`${viewDialog.class?.name} • Semester ${viewDialog.semester === "GANJIL" ? "1" : "2"} • ${viewDialog.academicYear?.name}`} size="xl">
          <div className="space-y-5">
            {/* Status */}
            <div className="flex items-center justify-between">
              {viewDialog.status === "PUBLISHED" ? (
                <Badge variant="success" className="gap-1 px-3 py-1.5"><CheckCircle className="h-3.5 w-3.5" /> Diterbitkan {viewDialog.publishedAt ? formatDate(viewDialog.publishedAt) : ""}</Badge>
              ) : (
                <Badge variant="warning" className="gap-1 px-3 py-1.5"><Clock className="h-3.5 w-3.5" /> Draft</Badge>
              )}
              <div className="flex gap-2">
                {viewDialog.status === "DRAFT" && (
                  <Button size="sm" loading={publishReportCard.isPending && publishReportCard.variables === viewDialog.id} onClick={() => handlePublish(viewDialog.id)}>
                    <Send className="h-4 w-4 mr-1" /> Publish Rapor
                  </Button>
                )}
                <Button size="sm" variant="outline" onClick={() => handlePrint(viewDialog)}>
                  <Printer className="h-4 w-4 mr-1" /> Cetak PDF
                </Button>
              </div>
            </div>

            {/* Student info */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 grid grid-cols-2 gap-2 text-sm">
              <div><span className="text-gray-500">Nama:</span> <span className="font-medium">{viewDialog.student?.name || `Siswa #${viewDialog.studentId}`}</span></div>
              <div><span className="text-gray-500">NISN:</span> <span className="font-mono">{viewDialog.student?.nisn}</span></div>
              <div><span className="text-gray-500">Kelas:</span> <span className="font-medium">{viewDialog.class?.name}</span></div>
              <div><span className="text-gray-500">Wali Kelas:</span> <span className="font-medium">{viewDialog.class?.homeroomTeacher?.name ?? "—"}</span></div>
            </div>

            {/* Subjects table */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Nilai Per Mata Pelajaran</h3>
              <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">Mata Pelajaran</th>
                      <th className="px-4 py-2.5 text-center text-xs font-semibold text-gray-500 uppercase">Nilai Akhir</th>
                      <th className="px-4 py-2.5 text-center text-xs font-semibold text-gray-500 uppercase">Huruf Mutu</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {(viewDialog.subjects || []).map(s => (
                      <tr key={s.subjectId} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                        <td className="px-4 py-3 text-gray-800 dark:text-gray-200">{s.subject?.name || `Mata Pelajaran #${s.subjectId}`}</td>
                        <td className="px-4 py-3 text-center font-mono font-semibold">{s.finalScore}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex items-center justify-center h-7 w-7 rounded-full text-sm font-bold ${getGradeColor(s.gradeLetter)}`}>{s.gradeLetter}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Homeroom notes */}
            {viewDialog.homeroomNotes && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Catatan Wali Kelas</h3>
                <div className="bg-indigo-50 dark:bg-indigo-950/30 rounded-lg p-3 text-sm text-indigo-800 dark:text-indigo-200 italic">
                  "{viewDialog.homeroomNotes}"
                </div>
              </div>
            )}
          </div>
        </Dialog>
      )}

      {/* Generate Rapor Dialog */}
      <Dialog open={generateDialog} onClose={() => !isGenerating && setGenerateDialog(false)} title="Generate Rapor Kelas">
        <div className="space-y-4">
          <p className="text-sm text-gray-500 mb-4">
            Proses ini akan menarik nilai akhir dari Grade Engine, menghitung absensi, dan membuat draf rapor untuk seluruh siswa di kelas yang dipilih.
          </p>

          <div className="space-y-1.5">
            <Label>Tahun Ajaran</Label>
            <Select value={genAcademicYearId} onChange={e => setGenAcademicYearId(e.target.value)} disabled={isGenerating}>
              <option value="" disabled>Pilih Tahun Ajaran</option>
              {academicYears.map((ay: AcademicYear) => (
                <option key={ay.id} value={ay.id}>{ay.name}</option>
              ))}
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Semester</Label>
            <Select value={genSemester} onChange={e => setGenSemester(e.target.value)} disabled={isGenerating}>
              <option value="GANJIL">Ganjil</option>
              <option value="GENAP">Genap</option>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Kelas</Label>
            <Select value={genClassId} onChange={e => setGenClassId(e.target.value)} disabled={isGenerating}>
              <option value="" disabled>Pilih Kelas</option>
              {classes.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </Select>
            {genClassId && (
              <p className="text-xs text-gray-500 mt-1">Siswa di kelas ini: {classMembers.length} orang</p>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
            <Button type="button" variant="outline" onClick={() => setGenerateDialog(false)} disabled={isGenerating}>Batal</Button>
            <Button onClick={handleGenerate} disabled={isGenerating || !genClassId || !genAcademicYearId}>
              {isGenerating ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Memproses...</>
              ) : (
                "Mulai Generate"
              )}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
