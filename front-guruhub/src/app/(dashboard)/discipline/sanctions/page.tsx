"use client";

import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { disciplineService } from "@/services/discipline";
import { api } from "@/services/api";
import { useAuthStore } from "@/store/auth.store";
import { 
  disciplineKeys, 
  useUpdateSanctionStatus,
  useCreateThreshold,
  useUpdateThreshold,
  useDeleteThreshold
} from "@/queries/discipline.query";
import { useSchoolSettings } from "@/queries/schools.query";
import { PageHeader } from "@/components/core/PageHeader";
import { SectionCard } from "@/components/core/SectionCard";
import { LoadingState } from "@/components/core/LoadingState";
import { EmptyState } from "@/components/core/EmptyState";
import { ErrorState } from "@/components/core/ErrorState";
import { 
  Plus, 
  Edit3, 
  Trash2, 
  X, 
  CheckCircle2, 
  Sliders, 
  Info, 
  ShieldAlert,
  Loader2,
  Printer,
  FileText,
  Download,
  Eye
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ThresholdItem {
  id: number;
  minPoints: number;
  label?: string;
  sanctionName?: string;
  actionRequired: string;
  description?: string;
}

export default function DisciplineSanctionsPage() {
  const { currentUser } = useAuthStore();
  const { data: school } = useSchoolSettings();
  const updateStatusMutation = useUpdateSanctionStatus();
  const createThresholdMutation = useCreateThreshold();
  const updateThresholdMutation = useUpdateThreshold();
  const deleteThresholdMutation = useDeleteThreshold();

  // Pagination state for sanctions log
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // Print Kop Surat & SP Modal State
  const [printSanction, setPrintSanction] = useState<any | null>(null);
  const [selectedSemester, setSelectedSemester] = useState<string>("Ganjil");
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<string>("2025/2026");
  const [letterDocType, setLetterDocType] = useState<string>("SURAT PERINGATAN (SP)");
  const [paperSize, setPaperSize] = useState<"F4" | "A4">("F4");

  // Query Student Incidents for Kop Surat Recap
  const { data: studentIncidentsData, isLoading: loadingStudentIncidents } = useQuery({
    queryKey: ["discipline-student-incidents", printSanction?.studentId],
    queryFn: async () => {
      if (!printSanction?.studentId) return [];
      const res = await disciplineService.getIncidents({ studentId: printSanction.studentId, limit: 100 });
      return res.data || res;
    },
    enabled: !!printSanction?.studentId,
  });

  const rawStudentIncidents = Array.isArray(studentIncidentsData) ? studentIncidentsData : studentIncidentsData?.data || [];

  const filteredStudentIncidents = useMemo(() => {
    if (!rawStudentIncidents.length) return [];
    return rawStudentIncidents.filter((inc: any) => {
      if (inc.deletedAt) return false;
      if (!inc.incidentDate) return true;
      const m = new Date(inc.incidentDate).getMonth() + 1; // 1-12
      if (selectedSemester === "Ganjil") {
        return m >= 7 && m <= 12;
      } else if (selectedSemester === "Genap") {
        return m >= 1 && m <= 6;
      }
      return true;
    });
  }, [rawStudentIncidents, selectedSemester]);

  const semesterPointsSum = useMemo(() => {
    return filteredStudentIncidents.reduce((sum: number, item: any) => {
      if (item.status === "VERIFIED" || item.status === "RESOLVED") {
        return sum + Number(item.demeritPoints || item.pointSnapshot || 0);
      }
      return sum;
    }, 0);
  }, [filteredStudentIncidents]);

  // Direct PDF Download Handler
  const [downloadingPdf, setDownloadingPdf] = useState<boolean>(false);

  const handleDirectDownloadPDF = async () => {
    if (!printSanction) return;
    setDownloadingPdf(true);
    const toastId = toast.loading("Menyiapkan file PDF...");

    let iframe: HTMLIFrameElement | null = null;

    try {
      const element = document.getElementById("printable-kop-surat-content");
      if (!element) throw new Error("Elemen dokumen tidak ditemukan");

      iframe = document.createElement("iframe");
      iframe.style.position = "absolute";
      iframe.style.left = "-9999px";
      iframe.style.top = "-9999px";
      iframe.style.width = paperSize === "F4" ? "210mm" : "210mm";
      iframe.style.height = "1200px";
      document.body.appendChild(iframe);

      const iframeDoc = iframe.contentWindow?.document;
      if (!iframeDoc) throw new Error("Gagal membuat dokumen PDF");

      const clonedContent = element.cloneNode(true) as HTMLElement;
      const headStyleElements = Array.from(document.head.querySelectorAll("style, link[rel='stylesheet']"))
        .map((el) => el.outerHTML)
        .join("\n");

      iframeDoc.open();
      iframeDoc.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            ${headStyleElements}
            <style id="pdf-tight-style">
              body { margin: 0; padding: 0; background: #ffffff; color: #000000; font-family: Arial, Helvetica, sans-serif; }
              * { box-sizing: border-box; }
              #printable-kop-surat-content {
                width: 100% !important;
                max-width: 210mm !important;
                margin: 0 !important;
                padding: 10mm 15mm !important;
                box-shadow: none !important;
              }
              #printable-kop-surat-content div {
                line-height: 1.05 !important;
              }
            </style>
          </head>
          <body>
            ${clonedContent.outerHTML}
          </body>
        </html>
      `);
      iframeDoc.close();

      const script = iframeDoc.createElement("script");
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js";
      await new Promise((resolve, reject) => {
        script.onload = resolve;
        script.onerror = reject;
        iframeDoc.head.appendChild(script);
      });

      await new Promise((r) => setTimeout(r, 200));

      const safeStudentName = (printSanction.studentName || `Siswa_${printSanction.studentId}`).replace(/[^a-zA-Z0-9]/g, "_");
      const safeDocType = letterDocType.replace(/[^a-zA-Z0-9]/g, "_");
      const filename = `${safeDocType}_${safeStudentName}_${selectedSemester}.pdf`;

      const targetEl = iframeDoc.getElementById("printable-kop-surat-content") || iframeDoc.body;
      const pdfEngine = (iframe.contentWindow as any).html2pdf || (window as any).html2pdf;

      const opt = {
        margin: [5, 5, 5, 5],
        filename: filename,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
          scale: 2, 
          useCORS: true, 
          logging: false, 
          scrollX: 0, 
          scrollY: 0,
          onclone: (clonedDoc: any) => {
            const extraStyle = clonedDoc.createElement("style");
            extraStyle.textContent = `
              #printable-kop-surat-content div,
              #printable-kop-surat-content p,
              #printable-kop-surat-content span {
                line-height: 1.05 !important;
              }
              .px-\\[75px\\] > div {
                margin-top: 1px !important;
                margin-bottom: 0px !important;
                padding: 0px !important;
                line-height: 1.05 !important;
              }
            `;
            clonedDoc.head.appendChild(extraStyle);
          }
        },
        jsPDF: { unit: 'mm', format: paperSize === 'F4' ? [210, 330] : 'a4', orientation: 'portrait' }
      };

      const pdfBlob = await pdfEngine().set(opt).from(targetEl).outputPdf('blob');
      
      const blobUrl = URL.createObjectURL(pdfBlob);
      const downloadLink = document.createElement("a");
      downloadLink.href = blobUrl;
      downloadLink.download = filename;
      downloadLink.style.display = "none";
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      
      setTimeout(() => {
        URL.revokeObjectURL(blobUrl);
      }, 10000);

      toast.success("File PDF berhasil diunduh!", { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error("Gagal mengunduh otomatis. Membuka dialog cetak...", { id: toastId });
      handlePrint();
    } finally {
      if (iframe && iframe.parentNode) {
        iframe.parentNode.removeChild(iframe);
      }
      setDownloadingPdf(false);
    }
  };

  // Dedicated Clean Print Handler via Isolated Iframe with Full Document Styling
  const handlePrint = () => {
    const element = document.getElementById("printable-kop-surat-content");
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
          <title>${letterDocType} - ${printSanction?.studentName || "Siswa"}</title>
          ${headStyleElements}
          <style>
            @page {
              size: ${paperSize === "F4" ? "210mm 330mm" : "A4"};
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
            #printable-kop-surat-content {
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

  // State Modal Threshold
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingThreshold, setEditingThreshold] = useState<ThresholdItem | null>(null);
  const [formData, setFormData] = useState({
    minPoints: 25,
    label: "",
    actionRequired: "PEMBINAAN_BK",
    description: "",
  });

  // Query Thresholds
  const { data: thresholdsData, isLoading: loadingThresholds, refetch: refetchThresholds } = useQuery({
    queryKey: disciplineKeys.thresholds(),
    queryFn: async () => {
      const res = await disciplineService.getThresholds();
      return res.data || res;
    },
  });

  // Query Sanctions Log
  const { data: sanctionsData, isLoading: loadingSanctions, isError, refetch: refetchSanctions } = useQuery({
    queryKey: disciplineKeys.sanctions(),
    queryFn: async () => {
      const res = await disciplineService.getSanctions({ limit: 1000 });
      return res.data || res;
    },
  });

  const rawThresholds = Array.isArray(thresholdsData) ? thresholdsData : thresholdsData?.data || [];
  
  // Jika database belum ada data threshold, pakai default visual untuk display
  const defaultThresholdsFallback: ThresholdItem[] = [
    { id: 1, minPoints: 25, label: "Ambang 1 (SP-1)", actionRequired: "PEMBINAAN_BK", description: "Peringatan tertulis pertama dan konseling Tim BK." },
    { id: 2, minPoints: 50, label: "Ambang 2 (SP-2)", actionRequired: "PANGGILAN_ORANG_TUA", description: "Surat Peringatan kedua dan pemanggilan orang tua/wali." },
    { id: 3, minPoints: 75, label: "Ambang 3 (SP-3)", actionRequired: "SKORSING", description: "Skorsing sementara dan sidang pembinaan Kepala Sekolah." },
  ];

  const thresholds: ThresholdItem[] = rawThresholds.length > 0 ? rawThresholds : defaultThresholdsFallback;
  const sanctions = Array.isArray(sanctionsData) ? sanctionsData : sanctionsData?.data || [];

  // --- Pagination calculations ---
  const totalItems = sanctions.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const safePage = Math.min(Math.max(1, page), totalPages);

  const paginatedSanctions = sanctions.slice((safePage - 1) * pageSize, safePage * pageSize);

  // Handler Open Modal Create/Edit
  const openCreateModal = () => {
    setEditingThreshold(null);
    setFormData({
      minPoints: 25,
      label: "",
      actionRequired: "PEMBINAAN_BK",
      description: "",
    });
    setIsModalOpen(true);
  };

  const openEditModal = (item: ThresholdItem) => {
    setEditingThreshold(item);
    setFormData({
      minPoints: item.minPoints,
      label: item.sanctionName || item.label || "",
      actionRequired: item.actionRequired || "PEMBINAAN_BK",
      description: item.description || "",
    });
    setIsModalOpen(true);
  };

  // Submit Threshold (Create / Update)
  const handleSubmitThreshold = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingThreshold) {
      updateThresholdMutation.mutate(
        { id: editingThreshold.id, data: formData },
        {
          onSuccess: () => {
            toast.success("Ambang batas sanksi berhasil diperbarui.");
            setIsModalOpen(false);
            refetchThresholds();
          },
          onError: (err: any) => toast.error(err?.message || "Gagal memperbarui ambang batas sanksi."),
        }
      );
    } else {
      createThresholdMutation.mutate(formData, {
        onSuccess: () => {
          toast.success("Ambang batas sanksi baru berhasil ditambahkan.");
          setIsModalOpen(false);
          refetchThresholds();
        },
        onError: (err: any) => toast.error(err?.message || "Gagal menambahkan ambang batas sanksi."),
      });
    }
  };

  // Delete Threshold
  const handleDeleteThreshold = (id: number) => {
    if (!confirm("Apakah Anda yakin ingin menghapus aturan ambang batas ini?")) return;
    deleteThresholdMutation.mutate(id, {
      onSuccess: () => {
        toast.success("Ambang batas sanksi berhasil dihapus.");
        refetchThresholds();
      },
      onError: () => toast.error("Gagal menghapus ambang batas sanksi."),
    });
  };

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Log Sanksi & Surat Peringatan (SP)"
        description="Pemantauan ambang batas demerit poin dan penerbitan sanksi otomatis untuk siswa berisiko."
      />

      {/* Threshold Rules Grid */}
      <SectionCard 
        title="Aturan Ambang Batas Sanksi Otomatis (Threshold Rules)"
        action={
          <button
            onClick={openCreateModal}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Tambah Ambang Batas
          </button>
        }
      >
        {loadingThresholds ? (
          <LoadingState message="Memuat aturan ambang batas..." rows={2} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {thresholds.map((t, idx) => {
              const borderColors = [
                "border-amber-500/30 bg-amber-500/5 text-amber-700 dark:text-amber-300",
                "border-orange-500/30 bg-orange-500/5 text-orange-700 dark:text-orange-300",
                "border-rose-500/30 bg-rose-500/5 text-rose-700 dark:text-rose-300",
              ];
              const colorClass = borderColors[idx % borderColors.length];

              return (
                <div 
                  key={t.id || idx} 
                  className={cn("p-4 rounded-xl border relative group transition-all hover:shadow-sm", colorClass)}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider">
                      {t.sanctionName || t.label || `Ambang ${idx + 1} (${t.actionRequired})`}
                    </span>
                    <span className="font-extrabold text-base">
                      {t.minPoints} Poin
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                    {t.description || `Pemicu sanksi otomatis (${t.actionRequired}) saat poin akumulasi mencapai ${t.minPoints}.`}
                  </p>
                  
                  {/* Actions for Threshold items if present in DB */}
                  {rawThresholds.length > 0 && (
                    <div className="mt-3 pt-2 border-t border-gray-200/50 dark:border-gray-800/50 flex items-center justify-end gap-2 opacity-90 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => openEditModal(t)}
                        className="p-1 hover:bg-black/10 dark:hover:bg-white/10 rounded transition-colors"
                        title="Edit Ambang Batas"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteThreshold(t.id)}
                        className="p-1 hover:bg-rose-500/20 text-rose-600 rounded transition-colors"
                        title="Hapus Ambang Batas"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </SectionCard>

      {/* Explanation Banner regarding duplicated names */}
      <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/50 rounded-xl text-xs text-blue-800 dark:text-blue-300">
        <Info className="w-4 h-4 shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold">Mengapa seorang siswa dapat memiliki lebih dari satu baris sanksi?</p>
          <p className="mt-0.5 opacity-90">
            Sistem mencatat sanksi secara bertingkat berdasarkan ambang batas poin (25, 50, 75 poin). Setiap kali akumulasi poin siswa menembus tingkat ambang batas baru, sistem secara otomatis menerbitkan record sanksi khusus untuk tingkat tersebut. Kolom <strong>Tingkat Sanksi</strong> menunjukkan tahap penanganan yang sedang berjalan.
          </p>
        </div>
      </div>

      {/* Sanctions Log Table */}
      <SectionCard title="Log Sanksi Aktif Siswa">
        {loadingSanctions ? (
          <LoadingState message="Memuat log sanksi siswa..." rows={4} />
        ) : isError ? (
          <ErrorState onRetry={refetchSanctions} />
        ) : sanctions.length === 0 ? (
          <EmptyState
            title="Tidak Ada Sanksi Aktif"
            description="Belum ada siswa yang melewati ambang batas poin demerit."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/50 border-b border-border text-xs font-semibold text-muted-foreground uppercase">
                <tr>
                  <th className="px-4 py-3">Siswa</th>
                  <th className="px-4 py-3">Poin Akumulasi</th>
                  <th className="px-4 py-3">Tahap Sanksi (Triggered)</th>
                  <th className="px-4 py-3">Status Penanganan</th>
                  <th className="px-4 py-3 text-right">Aksi & Kop Surat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {paginatedSanctions.map((s: any) => (
                  <tr key={s.id} className="hover:bg-muted/40 transition-colors">
                    <td className="px-4 py-3 font-semibold text-foreground">
                      {s.studentName || `Siswa #${s.studentId}`}
                      {(s.className || s.studentNisn) && (
                        <span className="block text-xs font-normal text-muted-foreground font-mono">
                          {s.className ? `Kelas: ${s.className}` : ""}{s.className && s.studentNisn ? " • " : ""}{s.studentNisn ? `NISN: ${s.studentNisn}` : ""}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-bold text-rose-600 dark:text-rose-400">
                      {s.cumulativePoints || 0} Poin
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                        <ShieldAlert className="w-3.5 h-3.5 text-indigo-500" />
                        {s.sanctionType || "Sanksi Demerit"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <select 
                        className={cn(
                          "text-xs font-semibold px-2.5 py-1 rounded-lg border outline-none cursor-pointer transition-colors",
                          s.status === 'PENDING' && 'bg-amber-500/10 text-amber-600 border-amber-500/30 dark:bg-amber-950/40 dark:text-amber-300',
                          s.status === 'ACTIVE' && 'bg-blue-500/10 text-blue-600 border-blue-500/30 dark:bg-blue-950/40 dark:text-blue-300',
                          s.status === 'COMPLETED' && 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30 dark:bg-emerald-950/40 dark:text-emerald-300',
                          s.status === 'REVOKED' && 'bg-gray-500/10 text-gray-600 border-gray-500/30 dark:bg-gray-800 dark:text-gray-400'
                        )}
                        value={s.status || "PENDING"}
                        onChange={(e) => {
                          const newStatus = e.target.value;
                          updateStatusMutation.mutate({ id: s.id, data: { status: newStatus } }, {
                            onSuccess: () => {
                              toast.success(`Status berhasil diubah menjadi ${newStatus}`);
                              refetchSanctions();
                            },
                            onError: (err: any) => {
                              const errMsg = err?.response?.data?.message || err?.message || "Gagal mengubah status sanksi";
                              toast.error(`Gagal mengubah status sanksi: ${errMsg}`);
                            }
                          });
                        }}
                        disabled={updateStatusMutation.isPending}
                      >
                        <option value="PENDING">PENDING (Menunggu)</option>
                        <option value="ACTIVE">ACTIVE (Sedang Berjalan)</option>
                        <option value="COMPLETED">COMPLETED (Selesai)</option>
                        <option value="REVOKED">REVOKED (Dibatalkan)</option>
                      </select>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={async () => {
                            try {
                              const toastId = toast.loading("Sedang mengunduh dokumen (PDF Vector)...");
                              await api.openBlob(`/pdf/sanctions/${s.id}`);
                              toast.dismiss(toastId);
                              toast.success("Dokumen berhasil diunduh!");
                            } catch (err: any) {
                              toast.error("Gagal mengunduh via server. Menampilkan preview...");
                              setPrintSanction(s);
                            }
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition-colors cursor-pointer"
                          title="Unduh PDF langsung tanpa preview"
                        >
                          <Download className="w-3.5 h-3.5" />
                          Unduh PDF
                        </button>
                        <button
                          onClick={() => setPrintSanction(s)}
                          className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-[10px] font-semibold py-1.5 px-3 rounded shadow-sm transition-colors flex items-center gap-1.5"
                          title="Preview Surat"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Preview</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination Controls Footer */}
            <div className="px-4 py-3 bg-muted/30 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground mt-2">
              <div className="flex items-center gap-4">
                <span>
                  Menampilkan{" "}
                  <span className="font-semibold text-foreground">
                    {totalItems === 0 ? 0 : (safePage - 1) * pageSize + 1}
                  </span>{" "}
                  –{" "}
                  <span className="font-semibold text-foreground">
                    {Math.min(safePage * pageSize, totalItems)}
                  </span>{" "}
                  dari <span className="font-semibold text-foreground">{totalItems}</span> log sanksi
                </span>
                <div className="flex items-center gap-1.5">
                  <span>Per halaman:</span>
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value));
                      setPage(1);
                    }}
                    className="bg-background border border-border rounded px-2 py-1 text-xs font-medium text-foreground focus:outline-none"
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage(1)}
                  disabled={safePage === 1}
                  className="px-2 py-1 rounded bg-background border border-border text-foreground disabled:opacity-40 hover:bg-muted transition-all font-bold"
                >
                  «
                </button>
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={safePage === 1}
                  className="px-2.5 py-1 rounded bg-background border border-border text-foreground disabled:opacity-40 hover:bg-muted transition-all font-semibold"
                >
                  ‹ Prev
                </button>
                <span className="px-3 font-bold text-foreground">
                  {safePage} / {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={safePage >= totalPages}
                  className="px-2.5 py-1 rounded bg-background border border-border text-foreground disabled:opacity-40 hover:bg-muted transition-all font-semibold"
                >
                  Next ›
                </button>
                <button
                  onClick={() => setPage(totalPages)}
                  disabled={safePage >= totalPages}
                  className="px-2 py-1 rounded bg-background border border-border text-foreground disabled:opacity-40 hover:bg-muted transition-all font-bold"
                >
                  »
                </button>
              </div>
            </div>
          </div>
        )}
      </SectionCard>

      {/* ===== MODAL MANAJEMEN THRESHOLD ===== */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-border rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header Modal */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-slate-50 dark:bg-slate-800/50">
              <h3 className="text-base font-bold flex items-center gap-2 text-foreground">
                <Sliders className="w-5 h-5 text-indigo-600" />
                {editingThreshold ? "Edit Ambang Batas Sanksi" : "Tambah Ambang Batas Baru"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Modal */}
            <form onSubmit={handleSubmitThreshold} className="p-6 space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">
                  Nama / Label Ambang Batas <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Ambang 1 (SP-1)"
                  value={formData.label}
                  onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-foreground"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">
                  Batas Minimal Poin Demerit <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  max={999}
                  placeholder="25"
                  value={formData.minPoints}
                  onChange={(e) => setFormData({ ...formData, minPoints: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-foreground"
                />
                <p className="text-[11px] text-muted-foreground mt-1">
                  Siswa yang mencapai akumulasi poin ini akan memicu sanksi otomatis.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">
                  Tindakan Sanksi / Tindak Lanjut <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={formData.actionRequired}
                  onChange={(e) => setFormData({ ...formData, actionRequired: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-foreground cursor-pointer"
                >
                  <option value="PEMBINAAN_BK">PEMBINAAN_BK — Konseling & Pembinaan Guru BK</option>
                  <option value="PANGGILAN_ORANG_TUA">PANGGILAN_ORANG_TUA — Pemanggilan Orang Tua / Wali</option>
                  <option value="SURAT_PERINGATAN">SURAT_PERINGATAN — Penerbitan Surat Peringatan (SP)</option>
                  <option value="SKORSING">SKORSING — Skorsing Pembinaan Sementara</option>
                  <option value="DIKELUARKAN">DIKELUARKAN — Dikembalikan ke Orang Tua / Dikeluarkan</option>
                  {!["PEMBINAAN_BK", "PANGGILAN_ORANG_TUA", "SURAT_PERINGATAN", "SKORSING", "DIKELUARKAN"].includes(formData.actionRequired) && (
                    <option value={formData.actionRequired}>{formData.actionRequired}</option>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">
                  Deskripsi / Keterangan Penanganan
                </label>
                <textarea
                  rows={3}
                  placeholder="Deskripsi singkat mengenai tindakan yang wajib dilakukan..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-foreground resize-none"
                />
              </div>

              {/* Footer Modal */}
              <div className="flex justify-end gap-3 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-lg border border-border hover:bg-muted text-foreground transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={createThresholdMutation.isPending || updateThresholdMutation.isPending}
                  className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg disabled:opacity-50 transition-colors flex items-center gap-1.5"
                >
                  {(createThresholdMutation.isPending || updateThresholdMutation.isPending) && (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  )}
                  {editingThreshold ? "Simpan Perubahan" : "Tambah Ambang Batas"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== MODAL CETAK KOP SURAT & SP ===== */}
      {printSanction && (
        <>
          <style dangerouslySetInnerHTML={{ __html: `
            @page {
              size: ${paperSize === "F4" ? "210mm 330mm" : "A4"};
              margin: 0mm;
            }
            @media print {
              html, body {
                height: auto !important;
                overflow: visible !important;
                background: #ffffff !important;
                color: #000000 !important;
                margin: 0 !important;
                padding: 0 !important;
              }
              body > *:not(#print-modal-wrapper) {
                display: none !important;
              }
              .print\\:hidden {
                display: none !important;
              }
              #print-modal-wrapper {
                position: static !important;
                display: block !important;
                background: #ffffff !important;
                padding: 0 !important;
                margin: 0 !important;
                overflow: visible !important;
                height: auto !important;
                max-height: none !important;
                width: 100% !important;
                visibility: visible !important;
              }
              #print-modal-container {
                position: static !important;
                display: block !important;
                background: #ffffff !important;
                border: none !important;
                box-shadow: none !important;
                padding: 0 !important;
                margin: 0 !important;
                overflow: visible !important;
                height: auto !important;
                max-height: none !important;
                width: 100% !important;
                visibility: visible !important;
              }
              #print-modal-body {
                overflow: visible !important;
                padding: 0 !important;
                margin: 0 !important;
                background: #ffffff !important;
                height: auto !important;
                max-height: none !important;
                visibility: visible !important;
              }
              #printable-kop-surat-content {
                position: static !important;
                display: block !important;
                visibility: visible !important;
                width: 100% !important;
                max-width: 100% !important;
                margin: 0 !important;
                padding: 0 !important;
                box-shadow: none !important;
                border: none !important;
                background: #ffffff !important;
                color: #000000 !important;
              }
              #printable-kop-surat-content * {
                visibility: visible !important;
                color: #000000 !important;
              }
            }
          ` }} />
          <div id="print-modal-wrapper" className="fixed inset-0 z-[9999] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-6 overflow-hidden print:p-0 print:bg-white print:static">
            <div id="print-modal-container" className="w-full max-w-5xl h-[92vh] flex flex-col bg-slate-900 rounded-2xl shadow-2xl overflow-hidden print:h-auto print:bg-white">
              
              {/* Header Modal & Filter Controls (hidden on print) */}
              <div className="shrink-0 flex flex-wrap items-center justify-between gap-4 px-6 py-4 bg-slate-900 text-white print:hidden">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-indigo-600/20 text-indigo-400">
                    <Printer className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Preview Kop Surat & Surat Peringatan</h3>
                    <p className="text-xs text-slate-400">Siswa: <span className="font-semibold text-indigo-300">{printSanction.studentName || `Siswa #${printSanction.studentId}`}</span></p>
                  </div>
                </div>

                {/* Filter controls */}
                <div className="flex flex-wrap items-center gap-3 text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="font-medium text-slate-400">Ukuran Kertas:</span>
                    <select
                      value={paperSize}
                      onChange={(e) => setPaperSize(e.target.value as "F4" | "A4")}
                      className="bg-slate-800 rounded-lg px-3 py-1.5 font-bold text-indigo-300 outline-none focus:ring-2 focus:ring-indigo-500 border-none cursor-pointer"
                    >
                      <option value="F4">F4 / Folio (215 x 330 mm)</option>
                      <option value="A4">A4 (210 x 297 mm)</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="font-medium text-slate-400">Dokumen:</span>
                    <select
                      value={letterDocType}
                      onChange={(e) => setLetterDocType(e.target.value)}
                      className="bg-slate-800 rounded-lg px-3 py-1.5 font-medium text-white outline-none focus:ring-2 focus:ring-indigo-500 border-none"
                    >
                      <option value="SURAT PERINGATAN (SP)">SURAT PERINGATAN (SP)</option>
                      <option value="SURAT PEMBINAAN KEDISIPLINAN">SURAT PEMBINAAN KEDISIPLINAN</option>
                      <option value="REKAPITULASI POIN KEDISIPLINAN SISWA">REKAPITULASI POIN KEDISIPLINAN</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="font-medium text-slate-400">Semester:</span>
                    <select
                      value={selectedSemester}
                      onChange={(e) => setSelectedSemester(e.target.value)}
                      className="bg-slate-800 rounded-lg px-3 py-1.5 font-medium text-white outline-none focus:ring-2 focus:ring-indigo-500 border-none"
                    >
                      <option value="Ganjil">Semester 1 (Ganjil)</option>
                      <option value="Genap">Semester 2 (Genap)</option>
                      <option value="Semua">Semua Semester</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="font-medium text-slate-400">Tahun:</span>
                    <select
                      value={selectedAcademicYear}
                      onChange={(e) => setSelectedAcademicYear(e.target.value)}
                      className="bg-slate-800 rounded-lg px-3 py-1.5 font-medium text-white outline-none focus:ring-2 focus:ring-indigo-500 border-none"
                    >
                      <option value="2025/2026">2025 / 2026</option>
                      <option value="2024/2025">2024 / 2025</option>
                    </select>
                  </div>

                  <button
                    onClick={async () => {
                      try {
                        setDownloadingPdf(true);
                        const safeDocType = encodeURIComponent(letterDocType);
                        await api.openBlob(`/pdf/sanctions/${printSanction.id}?docType=${safeDocType}`);
                      } catch (err: any) {
                        toast.info("Menggunakan mode unduh langsung...");
                        handleDirectDownloadPDF();
                      } finally {
                        setDownloadingPdf(false);
                      }
                    }}
                    disabled={downloadingPdf}
                    className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-md transition-all flex items-center gap-1.5 ml-1 cursor-pointer disabled:opacity-50"
                  >
                    {downloadingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                    Unduh PDF
                  </button>

                  <button
                    onClick={handlePrint}
                    className="px-4 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Printer className="w-4 h-4" />
                    Cetak / Print
                  </button>

                  <button
                    onClick={() => setPrintSanction(null)}
                    className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                    title="Tutup"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Modal Body Container with Scrollbar */}
              <div id="print-modal-body" className="flex-1 overflow-y-auto bg-slate-100 dark:bg-slate-950 p-4 sm:p-8 print:p-0 print:overflow-visible print:bg-white">
                
                {/* Printable Kop Surat Document Paper Sheet */}
                <div 
                  id="printable-kop-surat-content" 
                  className={`bg-white text-slate-900 shadow-2xl rounded-xl p-6 sm:p-10 w-full max-w-[210mm] mx-auto font-sans text-[13px] leading-relaxed print:shadow-none print:p-0 print:m-0 print:rounded-none print:w-full print:min-h-0`}
                >
                  {/* Official Kop Surat Header (Identical to PrintHeader.tsx / Teaching Journals) */}
                  <div className="relative w-full text-center mb-2 font-sans">
                    {(school?.logoUrl || school?.kopSuratUrl || "/logo-hangtuah.png") && (
                      <img
                        src={school?.logoUrl || school?.kopSuratUrl || "/logo-hangtuah.png"}
                        alt="Logo Sekolah"
                        className="absolute left-0 top-1/2 -translate-y-1/2 w-[70px] h-[70px] object-contain"
                      />
                    )}
                    <div className="px-[75px]">
                      <div className="font-bold text-[11pt] uppercase tracking-[0.5px] p-0 m-0" style={{ lineHeight: "1.05", margin: 0, padding: 0 }}>
                        {school?.foundationName || "YAYASAN HANG TUAH"}
                      </div>
                      <div className="font-bold text-[11pt] uppercase p-0" style={{ lineHeight: "1.05", marginTop: "1px", marginBottom: 0, padding: 0 }}>
                        {school?.regionalName || "PENGURUS CABANG SURABAYA"}
                      </div>
                      <div className="font-black text-[15pt] uppercase tracking-[1.5px] p-0" style={{ lineHeight: "1.05", marginTop: "1px", marginBottom: "1px", padding: 0 }}>
                        {school?.name || currentUser?.schoolName || "SMP HANG TUAH 5 SIDOARJO"}
                      </div>
                      <div className="font-bold text-[10.5pt] p-0 m-0" style={{ lineHeight: "1.05", margin: 0, padding: 0 }}>
                        {school?.accreditation ? `Terakreditasi “ ${school.accreditation} “` : 'Terakreditasi “ A “'}
                      </div>
                      <div className="font-bold text-[8.5pt] p-0" style={{ lineHeight: "1.05", marginTop: "1px", marginBottom: 0, padding: 0 }}>
                        {school?.address || "PERUM TNI AL Blok B. 16 / 18 TELP. (031) 8060725, SIDOARJO 61721"}
                      </div>
                      <div className="font-bold text-[8.5pt] text-[#002060] p-0 m-0" style={{ lineHeight: "1.05", margin: 0, padding: 0 }}>
                        {school?.email ? `Email : ${school.email}` : "Email : smpht5sda@gmail.com"}, {school?.website ? `website : ${school.website}` : "website : www.smphangtuah5sidoarjo.sch.id"}
                      </div>
                    </div>
                  </div>
                  <div className="border-t-[3px] border-black mb-4 clear-both" />

                  {/* Document Title */}
                  <div className="text-center mb-5 font-sans">
                    <h2 className="text-[14pt] font-extrabold uppercase text-black">
                      {letterDocType}
                    </h2>
                    <p className="text-[11pt] font-semibold text-slate-800 mt-1 tracking-normal">
                      Nomor: SP/DISC/{new Date().getFullYear()}/{String(printSanction.id).padStart(4, "0")}
                    </p>
                  </div>

                  {/* Student Metadata Section - Clean Borderless Grid */}
                  <div className="mb-5 py-2 border-y border-black">
                    <table className="w-full text-xs border-collapse">
                      <tbody>
                        <tr>
                          <td className="py-1 font-semibold text-black w-36">Nama Siswa</td>
                          <td className="py-1 font-bold text-black">: {printSanction.studentName || `Siswa #${printSanction.studentId}`}</td>
                          <td className="py-1 font-semibold text-black w-36">Semester</td>
                          <td className="py-1 font-bold text-black">: {selectedSemester} ({selectedAcademicYear})</td>
                        </tr>
                        <tr>
                          <td className="py-1 font-semibold text-black">NISN / NIS</td>
                          <td className="py-1 font-medium text-black">: {printSanction.studentNisn || "-"}</td>
                          <td className="py-1 font-semibold text-black">Tingkat Sanksi</td>
                          <td className="py-1 font-bold text-red-700">: {printSanction.sanctionType ? printSanction.sanctionType.replace(/_/g, " ") : "PEMBINAAN BK"}</td>
                        </tr>
                        <tr>
                          <td className="py-1 font-semibold text-black">Kelas</td>
                          <td className="py-1 font-medium text-black">
                            : {printSanction.className || printSanction.studentClassName || printSanction.class?.name || (filteredStudentIncidents[0]?.className || filteredStudentIncidents[0]?.class?.name || "-")}
                          </td>
                          <td className="py-1 font-semibold text-black">Tanggal Diterbitkan</td>
                          <td className="py-1 font-medium text-black">
                            : {new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Incidents Detail Section - Borderless Clean Table */}
                  <div className="mb-5">
                    <h4 className="text-xs font-bold uppercase tracking-wider mb-2 text-black pb-1 border-b border-black">
                      Rincian Catatan Pelanggaran Kedisiplinan Siswa ({selectedSemester})
                    </h4>

                    {loadingStudentIncidents ? (
                      <p className="text-slate-500 italic py-3 text-center">Memuat rincian insiden siswa...</p>
                    ) : filteredStudentIncidents.length === 0 ? (
                      <p className="text-slate-500 italic py-2 text-center">
                        Tidak ada catatan insiden pelanggaran untuk semester {selectedSemester}.
                      </p>
                    ) : (
                      <table className="w-full text-left text-[11px] border-collapse">
                        <thead className="border-b border-black font-bold uppercase text-black">
                          <tr>
                            <th className="py-1.5 px-2 text-center w-8">No</th>
                            <th className="py-1.5 px-2 w-28">Tanggal</th>
                            <th className="py-1.5 px-2">Pelanggaran / Catatan Aturan</th>
                            <th className="py-1.5 px-2 w-32">Lokasi</th>
                            <th className="py-1.5 px-2 text-center w-24">Demerit</th>
                            <th className="py-1.5 px-2 w-24">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {filteredStudentIncidents.map((inc: any, idx: number) => (
                            <tr key={inc.id || idx}>
                              <td className="py-1.5 px-2 text-center font-medium text-black">{idx + 1}</td>
                              <td className="py-1.5 px-2 text-black">
                                {inc.incidentDate ? new Date(inc.incidentDate).toLocaleDateString("id-ID") : "-"}
                              </td>
                              <td className="py-1.5 px-2 font-semibold text-black">
                                {(() => {
                                  const cleanDesc = inc.description?.replace(/^\[Rekap POLSIS\]:\s*/i, "").trim();
                                  return (
                                    <>
                                      {inc.typeName || cleanDesc || "Pelanggaran Tata Tertib"}
                                      {cleanDesc && <span className="block text-[10px] font-normal text-black mt-0.5">{cleanDesc}</span>}
                                    </>
                                  );
                                })()}
                              </td>
                              <td className="py-1.5 px-2 text-black">
                                {inc.location || "Lingkungan Sekolah"}
                              </td>
                              <td className="py-1.5 px-2 text-center font-bold text-black">
                                +{inc.demeritPoints || 5} Poin
                              </td>
                              <td className="py-1.5 px-2 text-black font-medium">
                                {inc.status || "VERIFIED"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="border-t border-black font-bold">
                          <tr>
                            <td colSpan={4} className="py-2 px-2 text-right">
                              Total Poin Demerit Semester Ini:
                            </td>
                            <td className="py-2 px-2 text-center text-black text-xs">
                              {semesterPointsSum} Poin
                            </td>
                            <td className="py-2 px-2" />
                          </tr>
                        </tfoot>
                      </table>
                    )}
                  </div>

                  {/* Point Accumulation & Guidance Note - Clean Borderless Callout */}
                  <div className="py-2.5 px-3.5 mb-6">
                    <div className="flex items-center justify-between font-bold text-black border-b border-black pb-1 mb-1">
                      <span>TOTAL AKUMULASI POIN KEDISIPLINAN KESELURUHAN:</span>
                      <span className="text-sm text-black font-extrabold">{semesterPointsSum} POIN</span>
                    </div>
                    <p className="text-[11px] text-black leading-relaxed">
                      <strong>Catatan Pembinaan Tim BK:</strong> Siswa yang bersangkutan telah menembus batas ambang poin 
                      sanksi (<strong>{printSanction.sanctionType ? printSanction.sanctionType.replace(/_/g, " ") : "PEMBINAAN BK"}</strong>). Diharapkan Orang Tua/Wali Siswa 
                      dapat bekerja sama mendampingi pembinaan kedisiplinan siswa di rumah serta menghadiri sesi konseling di sekolah.
                    </p>
                  </div>

                  {/* Official 3-Column Signature Footer (Proportional Table Format) */}
                  <table className="w-full text-center text-[12px] text-black font-sans mt-8 print:mt-8 border-collapse">
                    <tbody>
                      <tr>
                        <td className="w-1/3 vertical-top px-2">
                          <p className="font-semibold text-black">Mengetahui,</p>
                          <p className="font-semibold text-black">Orang Tua / Wali Siswa,</p>
                          <div className="h-16" />
                          <p className="font-bold underline text-black">( .................................................... )</p>
                          <p className="text-[10px] text-black mt-0.5">Nama Terang & Tanda Tangan</p>
                        </td>

                        <td className="w-1/3 vertical-top px-2">
                          <p className="font-semibold text-black">Mengetahui,</p>
                          <p className="font-semibold text-black">Guru BK / Pembina Disiplin,</p>
                          <div className="h-16" />
                          <p className="font-bold underline text-black">( .................................................... )</p>
                          <p className="text-[10px] text-black mt-0.5">Nama Terang & Tanda Tangan</p>
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

                </div>
              </div>

            </div>
          </div>
        </>
      )}
    </div>
  );
}
