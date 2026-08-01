"use client";

import { useState, useRef } from "react";
import { 
  Upload, GraduationCap, Users, BookOpen, Calendar, UserCheck, School,
  CheckCircle, AlertCircle, MinusCircle, FileSpreadsheet, Download,
  ArrowRight, Info
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { importService, EntityType } from "@/services/import";

interface ImportResult {
  row?: number;
  status: "success" | "skipped" | "error";
  message: string;
}

interface MasterConfig {
  type: EntityType;
  step: number;
  title: string;
  description: string;
  icon: React.ElementType;
  color: string;
  badgeBg: string;
  templateColumns: string[];
}

const MASTER_CONFIGS: MasterConfig[] = [
  {
    type: "teachers",
    step: 1,
    title: "1. Data Guru & Staff",
    description: "Import data guru (NIP, Nama, Jenis Kelamin, No. HP)",
    icon: GraduationCap,
    color: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
    badgeBg: "bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300",
    templateColumns: ["nip", "name", "gender", "phone"]
  },
  {
    type: "classes",
    step: 2,
    title: "2. Data Kelas",
    description: "Import rombel & wali kelas (Nama Kelas, Tingkat, NIP Wali Kelas)",
    icon: School,
    color: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    badgeBg: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
    templateColumns: ["name", "gradeLevel", "homeroomTeacherNip"]
  },
  {
    type: "subjects",
    step: 3,
    title: "3. Mata Pelajaran",
    description: "Import daftar mapel (Kode Mapel, Nama Mapel, Tingkat Kelas)",
    icon: BookOpen,
    color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    badgeBg: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
    templateColumns: ["code", "name", "gradeLevel"]
  },
  {
    type: "students",
    step: 4,
    title: "4. Data Siswa",
    description: "Import biodata siswa (NISN, Nama, Jenis Kelamin, Agama, Nama Kelas)",
    icon: Users,
    color: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
    badgeBg: "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300",
    templateColumns: ["nisn", "name", "gender", "religion", "className"]
  },
  {
    type: "class-members",
    step: 5,
    title: "5. Anggota Kelas",
    description: "Hubungkan siswa ke kelas (Nama Kelas, NISN)",
    icon: UserCheck,
    color: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    badgeBg: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
    templateColumns: ["className", "nisn"]
  },
  {
    type: "schedules",
    step: 6,
    title: "6. Jadwal Pelajaran",
    description: "Import jadwal KBM (Hari, Jam, Nama Kelas, Kode Mapel, NIP Guru)",
    icon: Calendar,
    color: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
    badgeBg: "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300",
    templateColumns: ["day", "startTime", "endTime", "className", "subjectCode", "teacherNip"]
  }
];

function ImportCard({ config }: { config: MasterConfig }) {
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<ImportResult[] | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDownloadTemplate = async () => {
    try {
      await importService.downloadTemplate(config.type);
      toast.success(`Template ${config.title} berhasil diunduh`);
    } catch (err: any) {
      toast.error(err.message || "Gagal mengunduh template");
    }
  };

  const handleFile = async (file: File) => {
    if (!file.name.endsWith(".xlsx") && !file.name.endsWith(".xls") && !file.name.endsWith(".csv")) {
      toast.error("Format file tidak didukung. Gunakan file .xlsx atau .xls");
      return;
    }
    setFileName(file.name);
    setLoading(true);
    setResults(null);

    try {
      let data;
      switch (config.type) {
        case "teachers":
          data = await importService.uploadTeachers(file);
          break;
        case "classes":
          data = await importService.uploadClasses(file);
          break;
        case "subjects":
          data = await importService.uploadSubjects(file);
          break;
        case "students":
          data = await importService.uploadStudents(file);
          break;
        case "class-members":
          data = await importService.uploadClassMembers(file);
          break;
        case "schedules":
          data = await importService.uploadSchedules(file);
          break;
      }

      const list: ImportResult[] = [];
      if (data.imported > 0) {
        list.push({ status: "success", message: `${data.imported} data berhasil diimpor` });
      }
      if (data.skipped > 0) {
        list.push({ status: "skipped", message: `${data.skipped} data dilewati (sudah ada)` });
      }
      (data.errors || []).forEach(err => {
        list.push({ row: err.row, status: "error", message: err.reason });
      });

      setResults(list);

      const success = data.imported;
      const errors = (data.errors || []).length;
      toast.success(`Import ${config.title} selesai: ${success} berhasil, ${errors} gagal`);
    } catch (err: any) {
      toast.error(err.message || "Gagal mengimpor file Excel");
    } finally {
      setLoading(false);
    }
  };

  const statusIcon = { success: CheckCircle, skipped: MinusCircle, error: AlertCircle };
  const statusColor = { success: "text-emerald-600 dark:text-emerald-400", skipped: "text-amber-600 dark:text-amber-400", error: "text-rose-600 dark:text-rose-400" };
  const statusBadge = { success: "success" as const, skipped: "warning" as const, error: "danger" as const };
  const Icon = config.icon;

  return (
    <Card className="relative overflow-hidden border border-border/60 hover:border-border transition-all">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`h-11 w-11 rounded-xl flex items-center justify-center ${config.color}`}>
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-base font-semibold">{config.title}</CardTitle>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${config.badgeBg}`}>
                  Langkah #{config.step}
                </span>
              </div>
              <CardDescription className="text-xs mt-0.5">{config.description}</CardDescription>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadTemplate}
            className="text-xs flex items-center gap-1.5 shrink-0 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/50"
          >
            <Download className="h-3.5 w-3.5" /> Template
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Expected columns info */}
        <div className="bg-muted/40 rounded-lg p-2.5 text-xs text-muted-foreground flex flex-wrap items-center gap-1.5">
          <span className="font-semibold text-foreground">Kolom Excel:</span>
          {config.templateColumns.map(col => (
            <span key={col} className="bg-background px-1.5 py-0.5 rounded border border-border/50 text-[11px] font-mono">
              {col}
            </span>
          ))}
        </div>

        {/* Drop zone */}
        <div
          className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors cursor-pointer ${
            dragging
              ? "border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30"
              : "border-border/80 hover:border-indigo-400 hover:bg-muted/30"
          }`}
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={e => {
            e.preventDefault();
            setDragging(false);
            const file = e.dataTransfer.files[0];
            if (file) handleFile(file);
          }}
          onClick={() => inputRef.current?.click()}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
          />
          <div className="flex flex-col items-center gap-2">
            <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
              <FileSpreadsheet className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-xs font-medium text-foreground">
                {dragging ? "Lepaskan berkas di sini" : "Drag & drop file Excel di sini"}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">atau klik untuk memilih berkas (.xlsx, .xls)</p>
            </div>
            {fileName && <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">📎 {fileName}</p>}
          </div>
        </div>

        {loading && (
          <div className="flex items-center gap-3 p-3 bg-indigo-50 dark:bg-indigo-950/30 rounded-lg">
            <div className="h-4 w-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-indigo-700 dark:text-indigo-300">Memproses & memvalidasi data...</p>
          </div>
        )}

        {results && !loading && (
          <div className="rounded-lg border border-border overflow-hidden text-xs">
            <div className="bg-muted px-3 py-1.5 flex items-center justify-between font-medium text-muted-foreground">
              <span>Hasil Import Data</span>
            </div>
            <div className="divide-y divide-border max-h-40 overflow-y-auto">
              {results.map((r, idx) => {
                const StatusIcon = statusIcon[r.status];
                return (
                  <div key={idx} className="flex items-center gap-2.5 px-3 py-2">
                    {r.row ? (
                      <span className="text-muted-foreground font-mono text-[11px] w-14">Baris #{r.row}</span>
                    ) : (
                      <span className="text-muted-foreground text-[11px] w-14">Ringkasan</span>
                    )}
                    <StatusIcon className={`h-3.5 w-3.5 flex-shrink-0 ${statusColor[r.status]}`} />
                    <span className="text-foreground flex-1 truncate">{r.message}</span>
                    <Badge variant={statusBadge[r.status]} className="text-[10px] py-0 px-1.5">
                      {r.status.toUpperCase()}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function ImportMasterDataPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Upload className="h-6 w-6 text-indigo-600 dark:text-indigo-400" /> Import Data Master GuruHub
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Pusat impor data master sekolah secara massal menggunakan file format Excel (.xlsx).
        </p>
      </div>

      {/* Workflow Step Guide */}
      <Card className="bg-amber-500/5 border-amber-500/20">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-2 font-semibold text-amber-700 dark:text-amber-300 text-sm">
            <Info className="h-4 w-4" /> Alur & Urutan Import Data Master (Sangat Penting):
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 text-xs">
            <div className="bg-background p-2 rounded-lg border border-border flex flex-col justify-between">
              <span className="font-semibold text-indigo-600 dark:text-indigo-400">1. Data Guru</span>
              <span className="text-[11px] text-muted-foreground mt-1">Input NIP & Data Guru untuk Wali Kelas</span>
            </div>
            <div className="bg-background p-2 rounded-lg border border-border flex flex-col justify-between">
              <span className="font-semibold text-blue-600 dark:text-blue-400">2. Data Kelas</span>
              <span className="text-[11px] text-muted-foreground mt-1">Input Rombel & NIP Wali Kelas</span>
            </div>
            <div className="bg-background p-2 rounded-lg border border-border flex flex-col justify-between">
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">3. Mapel</span>
              <span className="text-[11px] text-muted-foreground mt-1">Input Kode & Nama Mata Pelajaran</span>
            </div>
            <div className="bg-background p-2 rounded-lg border border-border flex flex-col justify-between">
              <span className="font-semibold text-purple-600 dark:text-purple-400">4. Data Siswa</span>
              <span className="text-[11px] text-muted-foreground mt-1">Input NISN & Nama Siswa</span>
            </div>
            <div className="bg-background p-2 rounded-lg border border-border flex flex-col justify-between">
              <span className="font-semibold text-amber-600 dark:text-amber-400">5. Anggota Kelas</span>
              <span className="text-[11px] text-muted-foreground mt-1">Petakan Siswa ke Rombel</span>
            </div>
            <div className="bg-background p-2 rounded-lg border border-border flex flex-col justify-between">
              <span className="font-semibold text-rose-600 dark:text-rose-400">6. Jadwal KBM</span>
              <span className="text-[11px] text-muted-foreground mt-1">Input Jadwal Pelajaran</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grid Cards for 6 Master Data Steps */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {MASTER_CONFIGS.map(config => (
          <ImportCard key={config.type} config={config} />
        ))}
      </div>
    </div>
  );
}
