"use client";

import { useState, useEffect } from "react";
import { 
  GraduationCap, 
  Search, 
  Printer, 
  Edit3, 
  X, 
  ShieldAlert, 
  Info,
  CheckCircle2,
  FileText,
  AlertTriangle
} from "lucide-react";
import { disciplineService } from "@/services/discipline";
import { classesService } from "@/services/classes";
import { useSchoolSettings } from "@/queries/schools.query";
import { toast } from "sonner";

interface PlenoStudent {
  studentId: number;
  studentName: string;
  nisn: string;
  classId: number;
  className: string;
  totalDemeritPoints: number;
  totalRewardPoints: number;
  totalAlphaCount: number;
  unfulfilledSubjectsCount: number;
  systemRecommendation: "NAIK_KELAS" | "PEMBINAAN_BASECAMP";
  finalDecision: "NAIK_KELAS" | "PEMBINAAN_BASECAMP";
  isOverridden: boolean;
  academicNotes: string | null;
  attendanceNotes: string | null;
  disciplineNotes: string | null;
  overrideReason: string | null;
  updatedAt: string | null;
}

interface StudentViolationDetail {
  incidentId: number;
  incidentDate: string;
  violationName: string;
  categoryName: string;
  severityLevel: string;
  demeritPoints: number;
  notes: string;
  status: string;
}

export default function PlenoKenaikanPage() {
  const { data: school } = useSchoolSettings();
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<PlenoStudent[]>([]);
  const [classesList, setClassesList] = useState<{ id: number; name: string }[]>([]);
  const [summary, setSummary] = useState({
    totalStudents: 0,
    totalNaikKelas: 0,
    totalBasecamp: 0,
    totalOverridden: 0,
  });

  // Filters
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL"); // ALL, NAIK_KELAS, PEMBINAAN_BASECAMP, RISKY, OVERRIDDEN
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Override Modal State
  const [selectedStudent, setSelectedStudent] = useState<PlenoStudent | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [newDecision, setNewDecision] = useState<"NAIK_KELAS" | "PEMBINAAN_BASECAMP">("NAIK_KELAS");
  const [academicNotes, setAcademicNotes] = useState("");
  const [attendanceNotes, setAttendanceNotes] = useState("");
  const [disciplineNotes, setDisciplineNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Violation Detail Modal State
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedStudentForDetail, setSelectedStudentForDetail] = useState<PlenoStudent | null>(null);
  const [violationList, setViolationList] = useState<StudentViolationDetail[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Official Letter State (Surat Pemanggilan / Pernyataan)
  const [selectedStudentForLetter, setSelectedStudentForLetter] = useState<PlenoStudent | null>(null);
  const [letterModalOpen, setLetterModalOpen] = useState(false);

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    fetchPlenoData();
  }, [selectedClassId, searchQuery]);

  const fetchClasses = async () => {
    try {
      const data = await classesService.getAll();
      if (Array.isArray(data)) {
        setClassesList(data.map((c: any) => ({ id: c.id, name: c.name })));
      }
    } catch (err) {
      console.error("Error fetching classes:", err);
    }
  };

  const fetchPlenoData = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (selectedClassId) params.classId = selectedClassId;
      if (searchQuery) params.search = searchQuery;

      const res = await disciplineService.getPlenoDecisions(params);
      if (res?.data) {
        setStudents(res.data);
        if (res.summary) setSummary(res.summary);
      }
    } catch (err) {
      console.error("Error fetching pleno decisions:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenOverrideModal = (student: PlenoStudent) => {
    setSelectedStudent(student);
    setNewDecision(student.finalDecision);
    setAcademicNotes(student.academicNotes || "");
    setAttendanceNotes(student.attendanceNotes || "");
    setDisciplineNotes(student.disciplineNotes || "");
    setModalOpen(true);
  };

  const handleSaveOverride = async () => {
    if (!selectedStudent) return;
    setSubmitting(true);
    try {
      await disciplineService.overridePlenoDecision({
        studentId: selectedStudent.studentId,
        systemRecommendation: selectedStudent.systemRecommendation,
        finalDecision: newDecision,
        academicNotes: academicNotes.trim() || undefined,
        attendanceNotes: attendanceNotes.trim() || undefined,
        disciplineNotes: disciplineNotes.trim() || undefined,
      });

      setModalOpen(false);
      fetchPlenoData();
    } catch (err: any) {
      alert(err.message || "Gagal menyimpan keputusan pleno.");
    } finally {
      setSubmitting(false);
    }
  };

  // Open Violation Details Modal
  const handleOpenViolationDetail = async (student: PlenoStudent) => {
    setSelectedStudentForDetail(student);
    setDetailModalOpen(true);
    setLoadingDetails(true);
    try {
      const res = await disciplineService.getStudentViolationDetails(student.studentId);
      if (res?.data) {
        setViolationList(res.data);
      } else {
        setViolationList([]);
      }
    } catch (err) {
      console.error("Error fetching student violation details:", err);
      setViolationList([]);
    } finally {
      setLoadingDetails(false);
    }
  };

  // Open Letter Modal and fetch violation details for the letter
  const handleOpenLetterModal = async (student: PlenoStudent) => {
    setSelectedStudentForLetter(student);
    setLetterModalOpen(true);
    setLoadingDetails(true);
    try {
      const res = await disciplineService.getStudentViolationDetails(student.studentId);
      if (res?.data) {
        setViolationList(res.data);
      } else {
        setViolationList([]);
      }
    } catch (err) {
      console.error("Error fetching student violation details for letter:", err);
      setViolationList([]);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handlePrintLetter = () => {
    const element = document.getElementById("printable-surat-pemanggilan");
    if (!element) {
      toast.error("Dokumen tidak ditemukan");
      return;
    }

    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "none";
    document.body.appendChild(iframe);

    const iframeDoc = iframe.contentWindow?.document;
    if (!iframeDoc) return;

    const headStyleElements = Array.from(document.head.querySelectorAll("style, link[rel='stylesheet']"))
      .map((el) => el.outerHTML)
      .join("\n");

    iframeDoc.open();
    iframeDoc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Surat Pemanggilan - ${selectedStudentForLetter?.studentName || "Siswa"}</title>
          ${headStyleElements}
          <style>
            @page {
              size: 210mm 330mm;
              margin: 0mm;
            }
            body {
              margin: 0;
              padding: 0;
              background: #ffffff !important;
              color: #000000 !important;
              font-family: Arial, Helvetica, sans-serif;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            * { box-sizing: border-box; }
            #printable-surat-pemanggilan {
              display: block !important;
              width: 100% !important;
              max-width: 210mm !important;
              margin: 0 auto !important;
              padding: 10mm 15mm !important;
              box-shadow: none !important;
              border-radius: 0 !important;
              background: #ffffff !important;
            }
          </style>
        </head>
        <body>
          ${element.outerHTML}
        </body>
      </html>
    `);
    iframeDoc.close();

    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      setTimeout(() => {
        if (iframe.parentNode) {
          iframe.parentNode.removeChild(iframe);
        }
      }, 1000);
    }, 400);
  };

  // Helper check if student is "Berisiko"
  const isStudentRisky = (s: PlenoStudent) => {
    return s.totalDemeritPoints >= 100 || s.totalAlphaCount >= 3 || s.unfulfilledSubjectsCount > 0 || s.finalDecision === "PEMBINAAN_BASECAMP";
  };

  // Filtered List
  const filteredStudents = students.filter((s) => {
    if (statusFilter === "NAIK_KELAS") return s.finalDecision === "NAIK_KELAS";
    if (statusFilter === "PEMBINAAN_BASECAMP") return s.finalDecision === "PEMBINAAN_BASECAMP";
    if (statusFilter === "RISKY") return isStudentRisky(s);
    if (statusFilter === "OVERRIDDEN") return s.isOverridden;
    return true;
  });

  const totalRiskyCount = students.filter(isStudentRisky).length;

  return (
    <div className="space-y-5">
      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          @page {
            size: 210mm 330mm; /* F4 Paper Size (Portrait) */
            margin: 0mm;
          }
          body * {
            visibility: hidden;
          }
          /* Print Berita Acara Utama */
          #printable-berita-acara, #printable-berita-acara * {
            visibility: ${letterModalOpen ? 'hidden' : 'visible'};
          }
          #printable-berita-acara {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            display: ${letterModalOpen ? 'none' : 'block'};
          }
          /* Print Surat Pemanggilan Ortu */
          #printable-surat-pemanggilan, #printable-surat-pemanggilan * {
            visibility: ${letterModalOpen ? 'visible' : 'hidden'};
          }
          #printable-surat-pemanggilan {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            display: ${letterModalOpen ? 'block' : 'none'};
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Header Bar */}
      <div className="no-print bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200/80 dark:border-gray-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400 rounded-xl">
            <GraduationCap className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Rapat Pleno Kenaikan Kelas</h1>
            <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 dark:text-gray-400 mt-1">
              <span>Total: <strong className="text-gray-900 dark:text-white">{summary.totalStudents} Siswa</strong></span>
              <span>•</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{summary.totalNaikKelas} Naik Kelas</span>
              <span>•</span>
              <span className="text-amber-600 dark:text-amber-400 font-semibold">{summary.totalBasecamp} Basecamp</span>
              {totalRiskyCount > 0 && (
                <>
                  <span>•</span>
                  <span className="text-red-600 dark:text-red-400 font-bold">🚨 {totalRiskyCount} Siswa Berisiko</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2.5 bg-gray-900 hover:bg-gray-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white text-sm font-semibold rounded-xl transition-all shadow-sm active:scale-95 cursor-pointer"
          >
            <Printer className="h-4.5 w-4.5" />
            <span>Cetak Berita Acara</span>
          </button>
        </div>
      </div>

      {/* Filter Bar with Filter 1 (Siswa Berisiko) */}
      <div className="no-print bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200/80 dark:border-gray-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3 text-sm">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Cari nama atau NISN..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="px-3.5 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
          >
            <option value="">Semua Kelas</option>
            {classesList.map((cls) => (
              <option key={cls.id} value={cls.id}>
                Kelas {cls.name}
              </option>
            ))}
          </select>
        </div>

        {/* Filter Buttons */}
        <div className="flex flex-wrap items-center gap-1 bg-gray-100 dark:bg-gray-800/80 p-1 rounded-xl">
          <button
            onClick={() => setStatusFilter("ALL")}
            className={`px-3.5 py-1.5 rounded-lg font-semibold transition-all text-xs sm:text-sm ${
              statusFilter === "ALL" 
                ? "bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm" 
                : "text-gray-500 hover:text-gray-900 dark:hover:text-white"
            }`}
          >
            Semua
          </button>

          {/* Filter 1: Siswa Berisiko */}
          <button
            onClick={() => setStatusFilter("RISKY")}
            className={`px-3.5 py-1.5 rounded-lg font-bold transition-all text-xs sm:text-sm flex items-center gap-1.5 ${
              statusFilter === "RISKY" 
                ? "bg-red-600 text-white shadow-sm" 
                : "text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
            }`}
          >
            <span>🚨 Berisiko</span>
            {totalRiskyCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-200">
                {totalRiskyCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setStatusFilter("NAIK_KELAS")}
            className={`px-3.5 py-1.5 rounded-lg font-semibold transition-all text-xs sm:text-sm ${
              statusFilter === "NAIK_KELAS" 
                ? "bg-emerald-600 text-white shadow-sm" 
                : "text-gray-500 hover:text-emerald-600"
            }`}
          >
            Naik Kelas
          </button>

          <button
            onClick={() => setStatusFilter("PEMBINAAN_BASECAMP")}
            className={`px-3.5 py-1.5 rounded-lg font-semibold transition-all text-xs sm:text-sm ${
              statusFilter === "PEMBINAAN_BASECAMP" 
                ? "bg-amber-500 text-white shadow-sm" 
                : "text-gray-500 hover:text-amber-600"
            }`}
          >
            Basecamp
          </button>
        </div>
      </div>

      {/* Main Table */}
      <div id="printable-berita-acara" className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/80 dark:border-gray-800 shadow-sm overflow-hidden">
        <div className="hidden print:block p-8 border-b border-gray-300 text-center space-y-1">
          <h2 className="text-xl font-bold uppercase tracking-wider text-black">BERITA ACARA RAPAT PLENO KENAIKAN KELAS</h2>
          <p className="text-sm text-gray-600">REKAPITULASI EVALUASI AKADEMIK, PRESENSI, & KEDISIPLINAN SEKOALH</p>
          <p className="text-xs text-gray-400">Dicetak Pada: {new Date().toLocaleDateString('id-ID', { dateStyle: 'full' })}</p>
        </div>

        {loading ? (
          <div className="p-12 text-center text-gray-500 text-sm">
            <div className="inline-block animate-spin rounded-full h-7 w-7 border-2 border-emerald-500 border-t-transparent mb-2"></div>
            <p>Memuat data rapat pleno...</p>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="p-12 text-center text-gray-400 text-sm">
            <p>Tidak ada data siswa ditemukan.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-gray-50/80 dark:bg-gray-800/60 border-b border-gray-200/80 dark:border-gray-800 text-gray-600 dark:text-gray-300 font-bold uppercase tracking-wider text-xs">
                  <th className="py-3.5 px-4 w-12 text-center">No</th>
                  <th className="py-3.5 px-4">Nama Siswa / NISN</th>
                  <th className="py-3.5 px-4">Kelas</th>
                  <th className="py-3.5 px-4">Evaluasi Ringkas</th>
                  <th className="py-3.5 px-4 text-center">Keputusan Pleno</th>
                  <th className="py-3.5 px-4">Catatan Rapat Guru</th>
                  <th className="py-3.5 px-4 text-right no-print">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800/60">
                {filteredStudents.map((st, index) => {
                  const isHighDemerit = st.totalDemeritPoints >= 100;
                  const hasUnfulfilledAcademic = st.unfulfilledSubjectsCount > 0;
                  const isHighAlpha = st.totalAlphaCount >= 3;
                  const isRisky = isStudentRisky(st);

                  return (
                    <tr 
                      key={st.studentId} 
                      className={`hover:bg-gray-50/60 dark:hover:bg-gray-800/40 transition-colors ${
                        isRisky ? 'bg-red-50/30 dark:bg-red-950/10' : st.isOverridden ? 'bg-purple-50/25 dark:bg-purple-950/15' : ''
                      }`}
                    >
                      <td className="py-3.5 px-4 text-center text-gray-400 font-medium">{index + 1}</td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-gray-900 dark:text-white text-sm flex items-center gap-1.5">
                          <span>{st.studentName}</span>
                          {isRisky && (
                            <span className="no-print text-[10px] bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300 font-bold px-1.5 py-0.2 rounded">
                              Berisiko
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-400 font-mono">NISN: {st.nisn}</div>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-gray-800 dark:text-gray-200">
                        Kelas {st.className}
                      </td>

                      {/* Evaluasi Ringkas */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {/* Akademik */}
                          {hasUnfulfilledAcademic ? (
                            <span className="px-2.5 py-1 rounded-md font-semibold text-xs bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-300 border border-red-200/50">
                              📚 {st.unfulfilledSubjectsCount} Mapel Belum Tuntas
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-md font-semibold text-xs bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                              📚 Mapel Tuntas
                            </span>
                          )}

                          {/* Alpa */}
                          {st.totalAlphaCount > 0 && (
                            <span className={`px-2.5 py-1 rounded-md font-semibold text-xs ${
                              isHighAlpha 
                                ? 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300 font-bold'
                                : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
                            }`}>
                              🗓️ {st.totalAlphaCount} Alpa
                            </span>
                          )}

                          {/* Demerit Badge (Clickable for details) */}
                          <button
                            type="button"
                            onClick={() => handleOpenViolationDetail(st)}
                            title="Klik untuk melihat rincian riwayat pelanggaran"
                            className={`no-print px-2.5 py-1 rounded-md font-semibold text-xs transition-all flex items-center gap-1 hover:scale-105 active:scale-95 cursor-pointer shadow-xs ${
                              isHighDemerit 
                                ? 'bg-red-600 hover:bg-red-700 text-white font-bold ring-2 ring-red-400/50' 
                                : st.totalDemeritPoints > 0 
                                ? 'bg-amber-100 hover:bg-amber-200 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-700'
                                : 'bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                            }`}
                          >
                            <span>🛡️ {st.totalDemeritPoints} Poin</span>
                            <Info className="h-3 w-3 opacity-70" />
                          </button>

                          <span className="hidden print:inline-block px-2.5 py-1 rounded-md font-semibold text-xs border border-gray-300">
                            🛡️ {st.totalDemeritPoints} Poin
                          </span>
                        </div>
                      </td>

                      {/* Keputusan Pleno */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="inline-flex flex-col items-center">
                          {st.finalDecision === "NAIK_KELAS" ? (
                            <span className="px-3 py-1 rounded-lg text-xs font-bold bg-emerald-600 text-white shadow-xs">
                              Naik Kelas
                            </span>
                          ) : (
                            <span className="px-3 py-1 rounded-lg text-xs font-bold bg-red-600 text-white shadow-xs animate-pulse">
                              Basecamp
                            </span>
                          )}

                          {st.isOverridden && (
                            <span className="text-[10px] text-purple-600 dark:text-purple-400 font-semibold mt-1">
                              ✏️ Disesuaikan
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Catatan Rapat Guru */}
                      <td className="py-3.5 px-4 text-gray-600 dark:text-gray-400 max-w-xs">
                        {st.academicNotes || st.attendanceNotes || st.disciplineNotes || st.overrideReason ? (
                          <div className="space-y-1 text-xs">
                            {st.academicNotes && <div><strong className="text-gray-800 dark:text-gray-200">Akademik:</strong> {st.academicNotes}</div>}
                            {st.attendanceNotes && <div><strong className="text-gray-800 dark:text-gray-200">Alpa:</strong> {st.attendanceNotes}</div>}
                            {st.disciplineNotes && <div><strong className="text-gray-800 dark:text-gray-200">Karakter:</strong> {st.disciplineNotes}</div>}
                            {!st.academicNotes && !st.attendanceNotes && !st.disciplineNotes && st.overrideReason && (
                              <div className="italic text-purple-700 dark:text-purple-300">"{st.overrideReason}"</div>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-300 dark:text-gray-700 italic text-xs">-</span>
                        )}
                      </td>

                      {/* Action Column with Surat Pemanggilan / Pernyataan */}
                      <td className="py-3.5 px-4 text-right no-print">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenLetterModal(st)}
                            title="Cetak Surat Pemanggilan / Pernyataan Orang Tua"
                            className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:hover:bg-blue-900 dark:text-blue-300 font-semibold rounded-lg transition-colors text-xs border border-blue-200 dark:border-blue-800 flex items-center gap-1 cursor-pointer"
                          >
                            <FileText className="h-3.5 w-3.5" />
                            <span className="hidden xl:inline">Surat Ortu</span>
                          </button>

                          <button
                            onClick={() => handleOpenOverrideModal(st)}
                            className="px-3 py-1.5 bg-gray-100 hover:bg-emerald-50 hover:text-emerald-600 dark:bg-gray-800 dark:hover:bg-emerald-950 dark:hover:text-emerald-400 text-gray-700 dark:text-gray-300 font-semibold rounded-lg transition-colors text-xs border border-gray-200 dark:border-gray-700 cursor-pointer"
                          >
                            Edit
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Printable Signatures for Main Table */}
        <div className="hidden print:grid grid-cols-2 gap-8 p-8 mt-6 border-t border-gray-300 text-center text-xs text-gray-800">
          <div>
            <p className="font-semibold">Mengetahui,</p>
            <p className="font-bold mt-0.5">Koordinator Guru BK</p>
            <div className="h-16"></div>
            <p className="font-bold underline">( ___________________________ )</p>
          </div>
          <div>
            <p className="font-semibold">Mengesahkan,</p>
            <p className="font-bold mt-0.5">Kepala Sekolah</p>
            <div className="h-16"></div>
            <p className="font-bold underline">( ___________________________ )</p>
          </div>
        </div>
      </div>

      {/* Violation Detail Breakdown Modal */}
      {detailModalOpen && selectedStudentForDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-gray-200 dark:border-gray-800 space-y-4 text-sm">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 rounded-xl">
                  <ShieldAlert className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-gray-900 dark:text-white">Rincian Riwayat Pelanggaran</h3>
                  <p className="text-xs text-gray-500">{selectedStudentForDetail.studentName} ({selectedStudentForDetail.className})</p>
                </div>
              </div>
              <button 
                onClick={() => setDetailModalOpen(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="bg-amber-50 dark:bg-amber-950/30 p-3 rounded-xl border border-amber-200/60 dark:border-amber-900/50 flex items-center justify-between">
              <span className="text-xs text-amber-900 dark:text-amber-200 font-medium">Akumulasi Demerit Siswa:</span>
              <span className="text-sm font-bold text-amber-700 dark:text-amber-300">
                🛡️ {selectedStudentForDetail.totalDemeritPoints} Poin Pelanggaran
              </span>
            </div>

            {loadingDetails ? (
              <div className="p-8 text-center text-gray-500 text-xs">
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-amber-500 border-t-transparent mb-2"></div>
                <p>Memuat rincian pelanggaran siswa...</p>
              </div>
            ) : violationList.length === 0 ? (
              <div className="p-8 text-center text-gray-400 text-xs bg-gray-50 dark:bg-gray-800/40 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
                <CheckCircle2 className="h-8 w-8 mx-auto text-emerald-500 mb-2" />
                <p className="font-semibold text-gray-700 dark:text-gray-300">Siswa Bersih Dari Pelanggaran</p>
                <p className="text-[11px] text-gray-400 mt-0.5">Siswa ini tidak memiliki catatan poin demerit pelanggaran aktif.</p>
              </div>
            ) : (
              <div className="max-h-64 overflow-y-auto pr-1">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-800/80 border-b border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 font-bold uppercase">
                      <th className="py-2.5 px-3">Tanggal</th>
                      <th className="py-2.5 px-3">Bentuk Pelanggaran</th>
                      <th className="py-2.5 px-3 text-center">Tingkat</th>
                      <th className="py-2.5 px-3 text-right">Poin</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {violationList.map((v) => (
                      <tr key={v.incidentId} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/40">
                        <td className="py-2.5 px-3 text-gray-500 font-mono whitespace-nowrap">
                          {new Date(v.incidentDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="font-semibold text-gray-900 dark:text-white">{v.violationName}</div>
                          <div className="text-[11px] text-gray-400">{v.categoryName}</div>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            v.severityLevel === 'BERAT'
                              ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300'
                              : v.severityLevel === 'SEDANG'
                              ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                              : 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                          }`}>
                            {v.severityLevel}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-red-600 dark:text-red-400">
                          +{v.demeritPoints}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="flex justify-end pt-3 border-t border-gray-100 dark:border-gray-800">
              <button
                type="button"
                onClick={() => setDetailModalOpen(false)}
                className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-xs font-semibold cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fitur 4: Modal & Preview Cetak Surat Pemanggilan / Pernyataan Orang Tua */}
      {letterModalOpen && selectedStudentForLetter && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-gray-200 dark:border-gray-800 space-y-4 text-sm no-print">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 rounded-xl">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-gray-900 dark:text-white">Surat Pernyataan / Pemanggilan Orang Tua</h3>
                  <p className="text-xs text-gray-500">{selectedStudentForLetter.studentName} ({selectedStudentForLetter.className})</p>
                </div>
              </div>
              <button 
                onClick={() => setLetterModalOpen(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Preview Box */}
            <div className="bg-gray-50 dark:bg-gray-800/40 p-4 rounded-xl border border-gray-200 dark:border-gray-700 space-y-3 max-h-80 overflow-y-auto text-xs">
              <div className="text-center font-bold text-gray-900 dark:text-white border-b border-gray-300 pb-2">
                SURAT PERNYATAAN & HASIL RAPAT PLENO KENAIKAN KELAS
              </div>
              <p>Yang bertanda tangan di bawah ini:</p>
              <div className="pl-4 space-y-1">
                <div>Nama Orang Tua / Wali : ....................................................</div>
                <div>Orang Tua Dari Siswa : <strong>{selectedStudentForLetter.studentName}</strong> (NISN: {selectedStudentForLetter.nisn})</div>
                <div>Kelas : {selectedStudentForLetter.className}</div>
              </div>

              <p className="font-semibold pt-1">Berdasarkan Hasil Rapat Pleno Kenaikan Kelas Tahun Ajaran Aktif:</p>
              <div className="bg-white dark:bg-gray-900 p-3 rounded-lg border border-gray-200 dark:border-gray-700 space-y-1.5 text-[11px]">
                {/* BOLD MERAH JIKA BASECAMP */}
                <div>
                  • Keputusan Pleno :{" "}
                  {selectedStudentForLetter.finalDecision === "PEMBINAAN_BASECAMP" ? (
                    <strong className="text-red-600 font-extrabold text-sm uppercase tracking-wide">
                      🔴 PEMBINAAN BASECAMP
                    </strong>
                  ) : (
                    <strong className="text-emerald-600 font-bold uppercase">
                      🟢 NAIK KELAS
                    </strong>
                  )}
                </div>

                <div>• Akumulasi Demerit : <strong>{selectedStudentForLetter.totalDemeritPoints} Poin</strong></div>
                <div>• Presensi (Alpa) : <strong>{selectedStudentForLetter.totalAlphaCount} Hari</strong></div>
                <div>• Ketuntasan Nilai : {selectedStudentForLetter.unfulfilledSubjectsCount > 0 ? <strong className="text-red-600">{selectedStudentForLetter.unfulfilledSubjectsCount} Mapel Belum Tuntas</strong> : <strong className="text-emerald-600">Semua Mapel Tuntas</strong>}</div>
                {selectedStudentForLetter.overrideReason && (
                  <div>• Catatan Rapat Guru : <em>"{selectedStudentForLetter.overrideReason}"</em></div>
                )}
              </div>

              {/* Rincian Poin Pelanggaran di Modal Preview */}
              {violationList.length > 0 && (
                <div className="space-y-1.5 pt-2 border-t border-gray-200 dark:border-gray-700">
                  <div className="font-bold text-gray-800 dark:text-gray-200 text-xs">📋 Rincian Poin Pelanggaran Siswa:</div>
                  <table className="w-full text-left text-[11px] border-collapse border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
                    <thead>
                      <tr className="bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 font-bold">
                        <th className="py-1 px-2">Tanggal</th>
                        <th className="py-1 px-2">Bentuk Pelanggaran</th>
                        <th className="py-1 px-2 text-right">Poin</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                      {violationList.map((v) => (
                        <tr key={v.incidentId}>
                          <td className="py-1 px-2 text-gray-500 whitespace-nowrap">{v.incidentDate}</td>
                          <td className="py-1 px-2 font-medium">{v.violationName}</td>
                          <td className="py-1 px-2 text-right font-bold text-red-600">+{v.demeritPoints}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <p className="pt-1">Menyatakan bersedia mendampingi dan membimbing siswa tersebut di atas sesuai dengan ketentuan keputusan rapat sekolah.</p>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-800">
              <button
                type="button"
                onClick={() => setLetterModalOpen(false)}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={handlePrintLetter}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-2 cursor-pointer"
              >
                <Printer className="h-4 w-4" />
                <span>Cetak Surat Pemanggilan (PDF)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Printable Official Letter (HTML untuk Cetak PDF) */}
      {selectedStudentForLetter && (
        <div id="printable-surat-pemanggilan" className="hidden print:block p-8 font-serif text-black space-y-3 text-xs">
          {/* Header Kop Surat Sekolah */}
          <div className="relative w-full text-center mb-2 font-sans">
            {(school?.logoUrl || school?.kopSuratUrl || "/logo-hangtuah.png") && (
              <img
                src={school?.logoUrl || school?.kopSuratUrl || "/logo-hangtuah.png"}
                alt="Logo Sekolah"
                className="absolute left-0 top-1/2 -translate-y-1/2 w-[70px] h-[70px] object-contain"
              />
            )}
            <div className="px-[75px]">
              <div className="font-bold text-[11pt] uppercase tracking-[0.5px] leading-[1.1]">
                {school?.foundationName || "YAYASAN HANG TUAH"}
              </div>
              <div className="font-bold text-[11pt] uppercase leading-[1.1] mt-[1px]">
                {school?.regionalName || "PENGURUS CABANG SURABAYA"}
              </div>
              <div className="font-black text-[15pt] uppercase tracking-[1.5px] leading-[1.1] my-[1px]">
                {school?.name || "SMP HANG TUAH 5 SIDOARJO"}
              </div>
              <div className="font-bold text-[10.5pt] leading-[1.1]">
                {school?.accreditation ? `Terakreditasi “ ${school.accreditation} “` : 'Terakreditasi “ A “'}
              </div>
              <div className="font-bold text-[8.5pt] leading-[1.1] mt-[1px]">
                {school?.address || "PERUM TNI AL Blok B. 16 / 18 TELP. (031) 8060725, SIDOARJO 61721"}
              </div>
              <div className="font-bold text-[8.5pt] leading-[1.1] text-[#002060]">
                {school?.email ? `Email : ${school.email}` : "Email : smpht5sda@gmail.com"}, {school?.website ? `website : ${school.website}` : "website : www.smphangtuah5sidoarjo.sch.id"}
              </div>
            </div>
          </div>
          <div className="border-t-[3px] border-black border-b-[1px] h-[2px] mb-3 clear-both" />

          <div className="space-y-3">
            <p>Yang bertanda tangan di bawah ini:</p>
            <table className="w-full text-xs leading-relaxed ml-4">
              <tbody>
                <tr>
                  <td className="w-48 font-semibold">Nama Orang Tua / Wali</td>
                  <td>: _____________________________________________</td>
                </tr>
                <tr>
                  <td className="font-semibold">Alamat / No. HP</td>
                  <td>: _____________________________________________</td>
                </tr>
                <tr>
                  <td className="font-semibold">Orang Tua / Wali Dari</td>
                  <td>: <strong>{selectedStudentForLetter.studentName}</strong></td>
                </tr>
                <tr>
                  <td className="font-semibold">NISN / Kelas</td>
                  <td>: {selectedStudentForLetter.nisn} / Kelas {selectedStudentForLetter.className}</td>
                </tr>
              </tbody>
            </table>

            <p className="leading-relaxed">
              Dengan ini menyatakan telah menerima informasi resmi hasil <strong>Rapat Pleno Dewan Guru & Kepala Sekolah</strong> terkait evaluasi akademik, absensi, dan kedisiplinan siswa untuk Tahun Ajaran Aktif, dengan rincian data sebagai berikut:
            </p>

            {/* Rekap Evaluasi dengan BOLD MERAH jika BASECAMP */}
            <div className="border border-black p-3 space-y-1.5 text-xs bg-gray-50">
              <div className="font-bold text-xs">REKAPITULASI HASIL PLENO KENAIKAN KELAS:</div>
              <div className="grid grid-cols-2 gap-1.5 text-xs">
                {/* BOLD MERAH JIKA BASECAMP */}
                <div className="col-span-2 text-xs pb-1 border-b border-gray-300">
                  • Keputusan Rapat Pleno:{" "}
                  {selectedStudentForLetter.finalDecision === "PEMBINAAN_BASECAMP" ? (
                    <span className="text-red-600 font-extrabold underline uppercase tracking-wider">
                      PEMBINAAN BASECAMP
                    </span>
                  ) : (
                    <span className="text-emerald-700 font-bold uppercase">
                      NAIK KELAS
                    </span>
                  )}
                </div>

                <div>• Total Poin Demerit: <strong>{selectedStudentForLetter.totalDemeritPoints} Poin</strong></div>
                <div>• Jumlah Hari Alpa: <strong>{selectedStudentForLetter.totalAlphaCount} Hari</strong></div>
                <div>• Ketuntasan Akademik: <strong>{selectedStudentForLetter.unfulfilledSubjectsCount > 0 ? `${selectedStudentForLetter.unfulfilledSubjectsCount} Mapel Belum Tuntas` : 'Semua Mapel Tuntas'}</strong></div>
              </div>

              {selectedStudentForLetter.overrideReason && (
                <div className="pt-1 border-t border-gray-300 text-xs">
                  <strong>Catatan Rapat Pleno Guru:</strong> "{selectedStudentForLetter.overrideReason}"
                </div>
              )}
            </div>

            {/* RINCIAN POIN PELANGGARAN DI SURAT CETAK PDF */}
            {violationList.length > 0 && (
              <div className="space-y-1 pt-1">
                <div className="font-bold text-xs">RINCIAN CATATAN PELANGGARAN SISWA:</div>
                <table className="w-full text-left text-[11px] border-collapse border border-black">
                  <thead>
                    <tr className="bg-gray-200 border-b border-black font-bold text-[10px]">
                      <th className="py-1 px-2 border-r border-black w-24">Tanggal</th>
                      <th className="py-1 px-2 border-r border-black">Bentuk Pelanggaran / Aturan</th>
                      <th className="py-1 px-2 border-r border-black text-center w-20">Tingkat</th>
                      <th className="py-1 px-2 text-right w-16">Poin</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black text-[10px]">
                    {violationList.map((v) => (
                      <tr key={v.incidentId}>
                        <td className="py-1 px-2 border-r border-black whitespace-nowrap">{v.incidentDate}</td>
                        <td className="py-1 px-2 border-r border-black font-medium">{v.violationName} ({v.categoryName})</td>
                        <td className="py-1 px-2 border-r border-black text-center font-semibold">{v.severityLevel}</td>
                        <td className="py-1 px-2 text-right font-bold text-red-600">+{v.demeritPoints}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <p className="leading-relaxed pt-1">
              Demikian surat pernyataan ini dibuat dengan sebenar-benarnya untuk dipergunakan sebagai komitmen perbaikan dan bimbingan bersama antara pihak Sekolah dan Orang Tua/Wali Murid.
            </p>
          </div>

          {/* Official 3-Column Signature Footer (Proportional Table Format - Identical to discipline/sanctions) */}
          <table className="w-full text-center text-[11px] text-black font-sans mt-6 print:mt-6 border-collapse">
            <tbody>
              <tr>
                <td className="w-1/3 align-top px-2">
                  <p className="font-semibold text-black">Mengetahui,</p>
                  <p className="font-semibold text-black">Wali Kelas / Guru BK,</p>
                  <div className="h-16" />
                  <p className="font-bold underline text-black">( .................................................... )</p>
                  <p className="text-[10px] text-black mt-0.5">Nama Terang & Tanda Tangan</p>
                </td>

                <td className="w-1/3 align-top px-2">
                  <p className="font-semibold text-black">Mengetahui,</p>
                  <p className="font-semibold text-black">Orang Tua / Wali Siswa,</p>
                  <div className="h-16" />
                  <p className="font-bold underline text-black">( .................................................... )</p>
                  <p className="text-[10px] text-black mt-0.5">Nama Terang & Tanda Tangan</p>
                </td>

                <td className="w-1/3 align-top px-2">
                  <p className="font-semibold text-black">
                    Sidoarjo, {new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                  </p>
                  <p className="font-semibold text-black">Mengesahkan, Kepala Sekolah,</p>
                  <div className="h-16" />
                  <p className="font-bold underline text-black">{school?.principalName || "( ___________________________ )"}</p>
                  {school?.principalNip ? <p className="text-[10px] text-black mt-0.5">NIP. {school.principalNip}</p> : <p className="text-[10px] text-black mt-0.5">NIP. ........................................</p>}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* Override Modal */}
      {modalOpen && selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-lg w-full p-6 shadow-xl border border-gray-200 dark:border-gray-800 space-y-4 text-sm">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
              <div>
                <h3 className="font-bold text-base text-gray-900 dark:text-white">Penyesuaian Pleno Guru</h3>
                <p className="text-gray-500 text-xs">{selectedStudent.studentName} ({selectedStudent.className})</p>
              </div>
              <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3.5">
              <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-xl border border-gray-200/60 dark:border-gray-700 flex justify-between items-center text-xs font-semibold">
                <span>Belum Tuntas: <strong>{selectedStudent.unfulfilledSubjectsCount}</strong></span>
                <span>Alpa: <strong className="text-red-600">{selectedStudent.totalAlphaCount} Hari</strong></span>
                <span>Demerit: <strong className="text-amber-600">{selectedStudent.totalDemeritPoints} Poin</strong></span>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1.5 text-xs">Keputusan Rapat Pleno:</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setNewDecision("NAIK_KELAS")}
                    className={`py-2.5 rounded-xl font-bold text-xs transition-all ${
                      newDecision === "NAIK_KELAS"
                        ? "bg-emerald-600 text-white shadow-sm"
                        : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                    }`}
                  >
                    🟢 Naik Kelas
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewDecision("PEMBINAAN_BASECAMP")}
                    className={`py-2.5 rounded-xl font-bold text-xs transition-all ${
                      newDecision === "PEMBINAAN_BASECAMP"
                        ? "bg-amber-500 text-white shadow-sm"
                        : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                    }`}
                  >
                    🟡 Basecamp
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1 text-xs">📚 Pertimbangan Akademik (Opsional):</label>
                <input
                  type="text"
                  placeholder="Contoh: Tugas susulan Matematika sudah tuntas..."
                  value={academicNotes}
                  onChange={(e) => setAcademicNotes(e.target.value)}
                  className="w-full p-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1 text-xs">🗓️ Pertimbangan Alpa (Opsional):</label>
                <input
                  type="text"
                  placeholder="Contoh: Alpa karena keterlambatan klarifikasi surat sakit..."
                  value={attendanceNotes}
                  onChange={(e) => setAttendanceNotes(e.target.value)}
                  className="w-full p-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1 text-xs">🛡️ Pertimbangan Karakter (Opsional):</label>
                <input
                  type="text"
                  placeholder="Contoh: Siswa sangat santun & sopan di kelas..."
                  value={disciplineNotes}
                  onChange={(e) => setDisciplineNotes(e.target.value)}
                  className="w-full p-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 text-xs"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-100 dark:border-gray-800">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl font-medium text-xs"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveOverride}
                disabled={submitting}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-sm text-xs disabled:opacity-50"
              >
                {submitting ? "Menyimpan..." : "Simpan Keputusan"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
