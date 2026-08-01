"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/auth.store";
import { disciplineService } from "@/services/discipline";
import { classesService } from "@/services/classes";
import { studentsService } from "@/services/students";
import { api } from "@/services/api";
import { ShieldAlert, AlertTriangle, FileWarning, CheckCircle2, Clock, Filter, RefreshCw, ChevronDown, ChevronUp, Users, Calendar, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { showAlert } from "@/utils/alert";
import { cn } from "@/lib/utils";
import { SearchableSelectModal, SelectTriggerButton } from "@/components/SearchableSelectModal";

type Tab = "polsis" | "incidents" | "sanctions" | "recap" | "analytics";

const INCIDENT_STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400",
  VERIFIED: "bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400",
  RESOLVED: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400",
  DISMISSED: "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400",
};

const SANCTION_STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-rose-100 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400",
  EXECUTED: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400",
  CANCELLED: "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400",
};

const ensureArray = (val: any): any[] => {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  if (Array.isArray(val?.data)) return val.data;
  if (Array.isArray(val?.data?.data)) return val.data.data;
  if (Array.isArray(val?.incidents)) return val.incidents;
  if (Array.isArray(val?.sanctions)) return val.sanctions;
  if (Array.isArray(val?.categories)) return val.categories;
  if (Array.isArray(val?.types)) return val.types;
  return [];
};

export default function BKDisciplinePage() {
  const { currentUser } = useAuthStore();
  const isPolsisRole = currentUser?.role === "Polsis";
  const [activeTab, setActiveTab] = useState<Tab>(isPolsisRole ? "polsis" : "incidents");
  const [incidents, setIncidents] = useState<any[]>([]);
  const [sanctions, setSanctions] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterClassId, setFilterClassId] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [updating, setUpdating] = useState<number | null>(null);

  // POLSIS form state
  const [polsisClassId, setPolsisClassId] = useState("");
  const [polsisStudentId, setPolsisStudentId] = useState("");
  const [polsisTypeId, setPolsisTypeId] = useState("");
  const [polsisLocation, setPolsisLocation] = useState("");
  const [polsisDate, setPolsisDate] = useState(new Date().toISOString().slice(0, 10));
  const [polsisNotes, setPolsisNotes] = useState("");
  const [polsisStudents, setPolsisStudents] = useState<any[]>([]);
  const [disciplineTypesList, setDisciplineTypesList] = useState<any[]>([]);
  const [isSubmittingPolsis, setIsSubmittingPolsis] = useState(false);
  const [polsisSuccessAlert, setPolsisSuccessAlert] = useState(false);

  // Modal open states for searchable selectors
  const [openClassModal, setOpenClassModal] = useState(false);
  const [openStudentModal, setOpenStudentModal] = useState(false);
  const [openTypeModal, setOpenTypeModal] = useState(false);

  // Derived safe array variables
  const safeIncidents = ensureArray(incidents);
  const safeSanctions = ensureArray(sanctions);
  const safeClasses = ensureArray(classes);
  const safePolsisStudents = ensureArray(polsisStudents);
  const safeDisciplineTypes = ensureArray(disciplineTypesList);

  useEffect(() => {
    if (polsisClassId) {
      studentsService.getByClass(Number(polsisClassId)).then((res) => {
        setPolsisStudents(ensureArray(res));
      }).catch(() => setPolsisStudents([]));
    } else {
      setPolsisStudents([]);
    }
  }, [polsisClassId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [cls, inc, san, ana, typ] = await Promise.all([
        classesService.getAll().catch(() => []),
        disciplineService.getIncidents({ limit: 50 }).catch(() => ({ data: [] })),
        disciplineService.getSanctionLogs({ limit: 50 }).catch(() => ({ data: [] })),
        disciplineService.getAnalytics().catch(() => null),
        disciplineService.getTypes().catch(() => ({ data: [] })),
      ]);
      setClasses(ensureArray(cls));
      setIncidents(ensureArray(inc));
      setSanctions(ensureArray(san));
      setAnalytics(ana?.data ?? ana);
      setDisciplineTypesList(ensureArray(typ));
    } catch (err) {
      toast.error("Gagal memuat data kedisiplinan");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitPolsis = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!polsisClassId || !polsisStudentId || !polsisTypeId) {
      showAlert(
        "Form Belum Lengkap",
        "Silakan pilih kelas, siswa, dan jenis pelanggaran terlebih dahulu.",
        "error"
      );
      return;
    }
    setIsSubmittingPolsis(true);
    try {
      await disciplineService.createIncident({
        students: [{
          studentId: Number(polsisStudentId),
          classId: Number(polsisClassId),
          disciplineTypeId: Number(polsisTypeId)
        }],
        incidentDate: polsisDate,
        location: polsisLocation || "Ruang Kelas / Lingkungan Sekolah",
        description: polsisNotes ? `[Rekap POLSIS]: ${polsisNotes}` : "[Rekap POLSIS]: Pelanggaran terdata dari Buku Siswa",
      });

      showAlert(
        "Laporan POLSIS Terkirim!",
        "Data pelanggaran dari Buku Siswa telah berhasil disimpan ke sistem dengan status PENDING dan siap ditinjau oleh Guru BK.",
        "success"
      );
      toast.success("Laporan POLSIS berhasil dikirim!");
      
      setPolsisClassId("");
      setPolsisStudentId("");
      setPolsisTypeId("");
      setPolsisLocation("");
      setPolsisNotes("");
      setPolsisSuccessAlert(true);
      reloadIncidents();
    } catch (err: any) {
      showAlert(
        "Gagal Mengirim Laporan",
        err?.message || "Terjadi kesalahan saat mengirim laporan POLSIS.",
        "error"
      );
      toast.error(err?.message || "Gagal mengirim laporan POLSIS");
    } finally {
      setIsSubmittingPolsis(false);
    }
  };

  const reloadIncidents = async () => {
    const params: any = { limit: 50 };
    if (filterClassId) params.classId = Number(filterClassId);
    if (filterStatus) params.status = filterStatus;
    const res = await disciplineService.getIncidents(params).catch(() => ({ data: [] }));
    setIncidents(ensureArray(res));
  };

  const reloadSanctions = async () => {
    const params: any = { limit: 50 };
    if (filterClassId) params.classId = Number(filterClassId);
    if (filterStatus) params.status = filterStatus;
    const res = await disciplineService.getSanctionLogs(params).catch(() => ({ data: [] }));
    setSanctions(ensureArray(res));
  };

  const [recapData, setRecapData] = useState<any>(null);
  const [recapLoading, setRecapLoading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));

  const loadRecapData = async () => {
    if (!filterClassId && classes.length > 0) {
      setFilterClassId(String(classes[0].id));
    }
    const classId = filterClassId || (classes[0]?.id ? String(classes[0].id) : "");
    if (!classId) return;

    setRecapLoading(true);
    try {
      const res = await api.get(`/attendances/recap?classId=${classId}&month=${selectedMonth}`);
      setRecapData(res.data || res);
    } catch (err) {
      console.error("Gagal memuat rekap absensi", err);
    } finally {
      setRecapLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);
  useEffect(() => {
    if (activeTab === "incidents") reloadIncidents();
    else if (activeTab === "sanctions") reloadSanctions();
    else if (activeTab === "recap") loadRecapData();
  }, [filterClassId, filterStatus, selectedMonth, activeTab]);

  const handleVerifyIncident = async (id: number, newStatus: string) => {
    setUpdating(id);
    try {
      await disciplineService.updateIncidentStatus(id, { status: newStatus });
      toast.success(`Status insiden diperbarui ke ${newStatus}`);
      reloadIncidents();
    } catch (err: any) {
      toast.error(err?.message || "Gagal memperbarui status");
    } finally {
      setUpdating(null);
    }
  };

  const handleUpdateSanction = async (id: number, newStatus: string) => {
    setUpdating(id);
    try {
      await disciplineService.updateSanctionStatus(id, { status: newStatus });
      toast.success("Status sanksi diperbarui");
      reloadSanctions();
    } catch (err: any) {
      toast.error(err?.message || "Gagal memperbarui sanksi");
    } finally {
      setUpdating(null);
    }
  };

  const allTabs: { key: Tab; label: string; icon: React.ElementType }[] = [
    { key: "polsis", label: "Catat Polsis", icon: ShieldAlert },
    { key: "incidents", label: "Insiden", icon: AlertTriangle },
    { key: "sanctions", label: "Sanksi", icon: FileWarning },
    { key: "recap", label: "Absensi BK", icon: Clock },
    { key: "analytics", label: "Analitik", icon: ShieldAlert },
  ];

  const tabs = isPolsisRole
    ? [{ key: "polsis" as Tab, label: "Catat Polsis", icon: ShieldAlert }]
    : allTabs;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-rose-500 border-t-transparent" />
        <span className="text-xs text-gray-500 dark:text-gray-400">Memuat data kedisiplinan...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-gradient-to-tr from-[#be123c] via-[#e11d48] to-[#f43f5e] rounded-2xl p-5 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none">
          <ShieldAlert className="h-40 w-40 transform translate-x-10 translate-y-10" />
        </div>
        <span className="inline-block text-[9px] uppercase font-bold tracking-wider bg-white/15 backdrop-blur-md border border-white/10 px-2.5 py-1 rounded-full">
          Modul Kedisiplinan — Polisi Siswa (POLSIS)
        </span>
        <h2 className="text-xl font-black mt-3 tracking-tight">Pelaporan & Monitoring Disiplin</h2>
        <p className="text-xs text-rose-100 mt-1 leading-relaxed">
          Catat pelanggaran siswa dari buku saku ke sistem & verifikasi sanksi.
        </p>
        <div className="grid grid-cols-3 gap-2 mt-5 pt-4 border-t border-white/10 text-center">
          <div className="bg-white/10 rounded-xl p-2">
            <div className="text-lg font-black">{safeIncidents.filter((i) => i?.status === "PENDING").length}</div>
            <div className="text-[8px] uppercase font-bold text-rose-200">Pending</div>
          </div>
          <div className="bg-white/10 rounded-xl p-2">
            <div className="text-lg font-black">{safeIncidents.filter((i) => i?.status === "VERIFIED").length}</div>
            <div className="text-[8px] uppercase font-bold text-rose-200">Terverifikasi</div>
          </div>
          <div className="bg-white/10 rounded-xl p-2">
            <div className="text-lg font-black">{safeSanctions.filter((s) => s?.status === "PENDING").length}</div>
            <div className="text-[8px] uppercase font-bold text-rose-200">Sanksi Aktif</div>
          </div>
        </div>
      </div>

      {/* Tab Bar */}
      <div className="flex bg-white dark:bg-gray-900 p-1 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-x-auto">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 py-2 px-2 text-[10px] font-bold rounded-lg transition-all whitespace-nowrap",
              activeTab === key
                ? "bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400"
                : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* ===== TAB: POLSIS (FORM INPUT PELANGGARAN SISWA) ===== */}
      {activeTab === "polsis" && (
        <div className="space-y-3">
          {polsisSuccessAlert && (
            <div className="bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 rounded-2xl p-4 shadow-md flex items-start gap-3 animate-in fade-in duration-200">
              <CheckCircle2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="text-xs font-black text-emerald-900 dark:text-emerald-100 uppercase tracking-wider">
                  Laporan Berhasil Terkirim!
                </h4>
                <p className="text-[11px] text-emerald-700 dark:text-emerald-300 mt-1 leading-relaxed">
                  Data pelanggaran dari Buku Siswa telah berhasil disimpan ke sistem dengan status <strong>PENDING</strong> dan akan ditinjau oleh Guru BK.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPolsisSuccessAlert(false)}
                className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-800 text-xs font-extrabold px-2.5 py-1 bg-emerald-100 dark:bg-emerald-900/80 rounded-lg shrink-0"
              >
                Tutup
              </button>
            </div>
          )}

          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4 shadow-sm space-y-4">
            <div className="flex items-center gap-2.5 border-b border-gray-100 dark:border-gray-800 pb-3">
              <div className="h-9 w-9 bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 rounded-xl flex items-center justify-center font-black shrink-0">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-xs font-extrabold text-gray-900 dark:text-white uppercase tracking-wider">
                  {isPolsisRole ? "Beranda Rekap POLSIS" : "Rekap Pelanggaran POLSIS"}
                </h3>
                <p className="text-[10px] text-gray-500 dark:text-gray-400">Input cepat dari Buku Siswa ke sistem (Status: PENDING)</p>
              </div>
            </div>

          {/* Selected items derived helpers */}
          {(() => {
            const selectedClass = safeClasses.find((c) => String(c.id) === String(polsisClassId));
            const selectedStudent = safePolsisStudents.find((s) => String(s.id) === String(polsisStudentId));
            const selectedType = safeDisciplineTypes.find((t) => String(t.id) === String(polsisTypeId));

            return (
              <>
                <form onSubmit={handleSubmitPolsis} className="space-y-3.5">
                  {/* Step 1: Pilih Kelas */}
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase text-gray-400 mb-1">
                      1. Pilih Kelas
                    </label>
                    <SelectTriggerButton
                      label="Pilih Kelas"
                      valueName={selectedClass?.name}
                      placeholder="-- Klik Untuk Pilih Kelas Siswa --"
                      onClick={() => setOpenClassModal(true)}
                    />
                  </div>

                  {/* Step 2: Pilih Siswa */}
                  {polsisClassId && (
                    <div>
                      <label className="block text-[10px] font-extrabold uppercase text-gray-400 mb-1">
                        2. Pilih Nama Siswa ({safePolsisStudents.length} Siswa)
                      </label>
                      <SelectTriggerButton
                        label="Pilih Nama Siswa"
                        valueName={selectedStudent ? `${selectedStudent.name} (${selectedStudent.nisn || "No NISN"})` : ""}
                        placeholder="-- Klik Untuk Cari & Pilih Siswa --"
                        onClick={() => setOpenStudentModal(true)}
                      />
                    </div>
                  )}

                  {/* Step 3: Pilih Jenis Pelanggaran */}
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase text-gray-400 mb-1">
                      3. Jenis Pelanggaran
                    </label>
                    <SelectTriggerButton
                      label="Pilih Jenis Pelanggaran"
                      valueName={selectedType ? `${selectedType.name} (+${selectedType.defaultPoints || selectedType.points || 5} Poin)` : ""}
                      placeholder="-- Klik Untuk Cari & Pilih Aturan / Pelanggaran --"
                      onClick={() => setOpenTypeModal(true)}
                    />
                  </div>

                  {/* Step 4: Tanggal & Lokasi */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-extrabold uppercase text-gray-400 mb-1">
                        Tanggal Kejadian
                      </label>
                      <input
                        type="date"
                        value={polsisDate}
                        onChange={(e) => setPolsisDate(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white font-semibold"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-extrabold uppercase text-gray-400 mb-1">
                        Lokasi Kejadian
                      </label>
                      <input
                        type="text"
                        placeholder="Ruang Kelas, Kantin, Lapangan..."
                        value={polsisLocation}
                        onChange={(e) => setPolsisLocation(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-rose-500"
                      />
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {["Ruang Kelas", "Kantin", "Lapangan", "Koridor", "Toilet", "Gerbang"].map((loc) => (
                          <button
                            key={loc}
                            type="button"
                            onClick={() => setPolsisLocation(loc)}
                            className={cn(
                              "text-[9px] px-2 py-0.5 rounded-lg font-bold transition-all border",
                              polsisLocation === loc
                                ? "bg-rose-600 text-white border-rose-600 shadow-xs"
                                : "bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-100"
                            )}
                          >
                            + {loc}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Step 5: Catatan dari Buku Siswa */}
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase text-gray-400 mb-1">
                      Catatan dari Buku Siswa
                    </label>
                    <textarea
                      placeholder="Rincian pelanggaran fisik dari buku saku siswa..."
                      value={polsisNotes}
                      onChange={(e) => setPolsisNotes(e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white font-medium"
                    />
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isSubmittingPolsis || !polsisClassId || !polsisStudentId || !polsisTypeId}
                    className="w-full py-3 text-xs font-black bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-md transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
                  >
                    {isSubmittingPolsis ? "Mengirim Laporan..." : "Kirim Laporan POLSIS"}
                  </button>
                </form>

                {/* Modals */}
                <SearchableSelectModal
                  isOpen={openClassModal}
                  onClose={() => setOpenClassModal(false)}
                  title="Pilih Kelas Siswa"
                  options={safeClasses.map((c) => ({ value: c.id, label: c.name }))}
                  selectedValue={polsisClassId}
                  onSelect={(val) => {
                    setPolsisClassId(String(val));
                    setPolsisStudentId("");
                  }}
                  placeholder="Cari nama kelas..."
                />

                <SearchableSelectModal
                  isOpen={openStudentModal}
                  onClose={() => setOpenStudentModal(false)}
                  title="Pilih Nama Siswa"
                  options={safePolsisStudents.map((s) => ({
                    value: s.id,
                    label: s.name,
                    sublabel: s.nisn ? `NISN: ${s.nisn}` : "Tanpa NISN",
                  }))}
                  selectedValue={polsisStudentId}
                  onSelect={(val) => setPolsisStudentId(String(val))}
                  placeholder="Cari nama atau NISN siswa..."
                />

                <SearchableSelectModal
                  isOpen={openTypeModal}
                  onClose={() => setOpenTypeModal(false)}
                  title="Pilih Jenis Pelanggaran"
                  options={safeDisciplineTypes.map((t) => ({
                    value: t.id,
                    label: t.name,
                    sublabel: `+${t.defaultPoints || t.points || 5} Poin Demerit`,
                  }))}
                  selectedValue={polsisTypeId}
                  onSelect={(val) => setPolsisTypeId(String(val))}
                  placeholder="Cari jenis / aturan pelanggaran..."
                />
              </>
            );
          })()}
        </div>
      </div>
      )}

      {/* Filters (Incidents & Sanctions) */}
      {activeTab !== "analytics" && activeTab !== "polsis" && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-3 shadow-sm grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-[9px] uppercase font-bold text-gray-400 flex items-center gap-1">
              <Filter className="h-3 w-3" /> Kelas
            </label>
            <select
              value={filterClassId}
              onChange={(e) => setFilterClassId(e.target.value)}
              className="w-full px-2 py-1.5 text-xs bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
            >
              <option value="">Semua Kelas</option>
              {safeClasses.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[9px] uppercase font-bold text-gray-400">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-2 py-1.5 text-xs bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
            >
              <option value="">Semua Status</option>
              {activeTab === "incidents"
                ? ["PENDING", "VERIFIED", "RESOLVED", "DISMISSED"].map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))
                : ["PENDING", "EXECUTED", "CANCELLED"].map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
            </select>
          </div>
        </div>
      )}

      {/* ===== TAB: INCIDENTS ===== */}
      {activeTab === "incidents" && (
        <div className="space-y-3">
          <div className="flex justify-between items-center px-1">
            <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              {safeIncidents.length} Insiden Ditemukan
            </span>
            <button onClick={reloadIncidents} className="p-1.5 text-gray-400 hover:text-rose-600 rounded-lg transition-colors">
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
          </div>

          {safeIncidents.length === 0 ? (
            <div className="bg-white dark:bg-gray-900 border border-dashed border-gray-200 dark:border-gray-800 rounded-xl p-8 text-center text-xs text-gray-400">
              <CheckCircle2 className="h-8 w-8 text-emerald-400 mx-auto mb-2" />
              Tidak ada insiden yang ditemukan.
            </div>
          ) : (
            safeIncidents.map((inc) => (
              <div key={inc.id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm overflow-hidden">
                <div className="p-4 space-y-2">
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <h4 className="text-xs font-bold text-gray-900 dark:text-white">
                        {inc.studentName || inc.student?.name || "Siswa"} {inc.className ? `(${inc.className})` : ""}
                      </h4>
                      <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">
                        {inc.disciplineTypeName || inc.disciplineType?.name || "Pelanggaran"} • <span className="font-extrabold text-rose-600 dark:text-rose-400">+{inc.points || inc.demeritPoints || 5} Poin</span>
                      </p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="text-[9px] text-gray-400 font-medium">
                          📅 {inc.incidentDate ? new Date(inc.incidentDate).toLocaleDateString("id-ID") : "—"}
                        </span>
                        {inc.location && (
                          <span className="text-[9px] bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 px-1.5 py-0.5 rounded font-semibold">
                            📍 {inc.location}
                          </span>
                        )}
                      </div>
                      {/* Log akun pelapor */}
                      <div className="text-[9px] text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/60 px-2 py-0.5 rounded-md font-bold mt-1.5 inline-flex items-center gap-1">
                        <span>👤 Pelapor:</span>
                        <span className="underline">{inc.reporterName || inc.reporterEmail || "Sistem"}</span>
                        {inc.reporterRole && <span className="opacity-75">({inc.reporterRole})</span>}
                      </div>
                    </div>
                    <span className={cn("text-[9px] font-bold px-2 py-0.5 rounded-full", INCIDENT_STATUS_COLORS[inc.status] ?? "bg-gray-100 text-gray-500")}>
                      {inc.status}
                    </span>
                  </div>

                  {inc.description && (
                    <p className="text-[10px] text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2 leading-relaxed">
                      {inc.description}
                    </p>
                  )}

                  <button
                    onClick={() => setExpandedId(expandedId === inc.id ? null : inc.id)}
                    className="flex items-center gap-1 text-[9px] text-indigo-500 font-bold"
                  >
                    {expandedId === inc.id ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                    Aksi Verifikasi
                  </button>

                  {expandedId === inc.id && (
                    <div className="flex gap-2 pt-1">
                      {inc.status === "PENDING" && (
                        <>
                          <button
                            onClick={() => handleVerifyIncident(inc.id, "VERIFIED")}
                            disabled={updating === inc.id}
                            className="flex-1 py-1.5 text-[10px] font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all disabled:opacity-50"
                          >
                            {updating === inc.id ? "..." : "✓ Verifikasi"}
                          </button>
                          <button
                            onClick={() => handleVerifyIncident(inc.id, "DISMISSED")}
                            disabled={updating === inc.id}
                            className="flex-1 py-1.5 text-[10px] font-bold bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg transition-all disabled:opacity-50"
                          >
                            Tolak
                          </button>
                        </>
                      )}
                      {inc.status === "VERIFIED" && (
                        <button
                          onClick={() => handleVerifyIncident(inc.id, "RESOLVED")}
                          disabled={updating === inc.id}
                          className="flex-1 py-1.5 text-[10px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-all disabled:opacity-50"
                        >
                          {updating === inc.id ? "..." : "✓ Selesaikan"}
                        </button>
                      )}
                      {(inc.status === "RESOLVED" || inc.status === "DISMISSED") && (
                        <p className="text-[9px] text-gray-400 py-1">Insiden sudah ditutup.</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ===== TAB: SANCTIONS ===== */}
      {activeTab === "sanctions" && (
        <div className="space-y-3">
          <div className="flex justify-between items-center px-1">
            <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              {safeSanctions.length} Catatan Sanksi
            </span>
            <button onClick={reloadSanctions} className="p-1.5 text-gray-400 hover:text-rose-600 rounded-lg transition-colors">
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
          </div>

          {safeSanctions.length === 0 ? (
            <div className="bg-white dark:bg-gray-900 border border-dashed border-gray-200 dark:border-gray-800 rounded-xl p-8 text-center text-xs text-gray-400">
              <CheckCircle2 className="h-8 w-8 text-emerald-400 mx-auto mb-2" />
              Tidak ada catatan sanksi aktif.
            </div>
          ) : (
            safeSanctions.map((san) => (
              <div key={san.id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 shadow-sm space-y-3">
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <h4 className="text-xs font-bold text-gray-900 dark:text-white">
                      {san.studentName || san.student?.name || "Siswa"}
                    </h4>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">
                      {san.sanctionType || san.type || "Sanksi"} • Total {san.totalPoints || 0} poin
                    </p>
                    <p className="text-[9px] text-gray-400 mt-0.5">
                      {san.issuedAt ? new Date(san.issuedAt).toLocaleDateString("id-ID") : "—"}
                    </p>
                  </div>
                  <span className={cn("text-[9px] font-bold px-2 py-0.5 rounded-full", SANCTION_STATUS_COLORS[san.status] ?? "bg-gray-100 text-gray-500")}>
                    {san.status}
                  </span>
                </div>

                {san.status === "PENDING" && (
                  <div className="flex gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                    <button
                      onClick={() => handleUpdateSanction(san.id, "EXECUTED")}
                      disabled={updating === san.id}
                      className="flex-1 py-1.5 text-[10px] font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition-all disabled:opacity-50"
                    >
                      {updating === san.id ? "..." : "Terapkan Sanksi"}
                    </button>
                    <button
                      onClick={() => handleUpdateSanction(san.id, "CANCELLED")}
                      disabled={updating === san.id}
                      className="flex-1 py-1.5 text-[10px] font-bold bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg transition-all disabled:opacity-50"
                    >
                      Batalkan
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* ===== TAB: RECAP ABSENSI BK ===== */}
      {activeTab === "recap" && (
        <div className="space-y-3">
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-3 shadow-sm flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-gray-500 uppercase">Pilih Kelas & Bulan</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <select
                value={filterClassId}
                onChange={(e) => setFilterClassId(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white font-semibold"
              >
                {safeClasses.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full px-2 py-1 text-xs bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white font-semibold"
              />
            </div>
            <div className="text-[10px] text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 p-2 rounded-lg font-medium flex items-center gap-1.5 border border-rose-200 dark:border-rose-800">
              <ShieldAlert className="h-3.5 w-3.5 text-rose-600 shrink-0" />
              <span>Siswa dengan status <strong>Alpha</strong> otomatis diakumulasi poin demerit disiplinnya.</span>
            </div>
          </div>

          {recapLoading ? (
            <div className="bg-white dark:bg-gray-900 rounded-xl p-8 border border-gray-200 dark:border-gray-800 text-center text-xs text-gray-400 flex flex-col items-center gap-2">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
              <span>Memuat rekapitulasi kelas...</span>
            </div>
          ) : !recapData || !recapData.students || recapData.students.length === 0 ? (
            <div className="bg-white dark:bg-gray-900 border border-dashed border-gray-200 dark:border-gray-800 rounded-xl p-8 text-center text-xs text-gray-400">
              Belum ada catatan presensi untuk kelas pada bulan ini.
            </div>
          ) : (
            <div className="space-y-3">
              {/* High Risk Warning */}
              {recapData.students.filter((s: any) => (s.summary?.ABSENT || 0) >= 3).length > 0 && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 rounded-xl space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-rose-700 dark:text-rose-300 uppercase">
                    <AlertTriangle className="h-3.5 w-3.5 text-rose-600" />
                    Peringatan BK: Siswa Sering Alpha (≥ 3 Hari)
                  </div>
                  <div className="space-y-1">
                    {recapData.students
                      .filter((s: any) => (s.summary?.ABSENT || 0) >= 3)
                      .map((s: any) => (
                        <div key={s.studentId} className="flex justify-between items-center text-xs text-rose-900 dark:text-rose-200 bg-white/60 dark:bg-gray-900/60 p-2 rounded-lg font-medium">
                          <span>{s.studentName}</span>
                          <span className="font-bold text-rose-600">{s.summary?.ABSENT}x Alpha</span>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Student Summary List */}
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-3 shadow-sm space-y-2">
                <h4 className="text-xs font-bold text-gray-700 dark:text-gray-300 border-b border-gray-100 dark:border-gray-800 pb-2">
                  Daftar Presensi Siswa ({recapData.students.length} Siswa)
                </h4>
                <div className="divide-y divide-gray-100 dark:divide-gray-800">
                  {recapData.students.map((st: any) => (
                    <div key={st.studentId} className="py-2 flex justify-between items-center gap-2 text-xs">
                      <div>
                        <div className="font-bold text-gray-900 dark:text-white">{st.studentName}</div>
                        {st.nisn && <div className="text-[9px] text-gray-400">NISN: {st.nisn}</div>}
                      </div>
                      <div className="flex items-center gap-1 text-[10px] font-bold">
                        <span className="bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.5 rounded">
                          {st.summary?.PRESENT || 0} H
                        </span>
                        <span className="bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 px-1.5 py-0.5 rounded">
                          {st.summary?.SICK || 0} S
                        </span>
                        <span className="bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded">
                          {st.summary?.PERMISSION || 0} I
                        </span>
                        <span className={cn(
                          "px-1.5 py-0.5 rounded",
                          (st.summary?.ABSENT || 0) >= 3
                            ? "bg-rose-600 text-white font-black animate-pulse"
                            : "bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300"
                        )}>
                          {st.summary?.ABSENT || 0} A
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===== TAB: ANALYTICS ===== */}
      {activeTab === "analytics" && (
        <div className="space-y-3">
          {!analytics ? (
            <div className="bg-white dark:bg-gray-900 border border-dashed border-gray-200 dark:border-gray-800 rounded-xl p-8 text-center text-xs text-gray-400">
              Tidak ada data analitik tersedia.
            </div>
          ) : (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Total Insiden", value: analytics.totalIncidents ?? 0, color: "text-rose-600" },
                  { label: "Total Poin", value: analytics.totalPoints ?? 0, color: "text-amber-600" },
                  { label: "Siswa Bermasalah", value: analytics.studentsWithIncidents ?? 0, color: "text-indigo-600" },
                  { label: "Sanksi Aktif", value: analytics.activeSanctions ?? 0, color: "text-purple-600" },
                ].map(({ label, value, color }) => (
                  <div key={label} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 shadow-sm text-center">
                    <div className={cn("text-xl font-black", color)}>{value}</div>
                    <div className="text-[9px] text-gray-400 font-semibold uppercase tracking-wider mt-1">{label}</div>
                  </div>
                ))}
              </div>

              {/* Top Violators */}
              {analytics.topStudents && analytics.topStudents.length > 0 && (
                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 shadow-sm">
                  <h4 className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-3">Siswa dengan Poin Tertinggi</h4>
                  <div className="space-y-2">
                    {analytics.topStudents.slice(0, 5).map((s: any, idx: number) => (
                      <div key={s.studentId || idx} className="flex justify-between items-center py-1.5 border-b border-gray-50 dark:border-gray-800 last:border-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-bold text-gray-400 w-4">{idx + 1}.</span>
                          <span className="text-xs font-medium text-gray-900 dark:text-white">{s.studentName || s.name}</span>
                        </div>
                        <span className="text-[10px] font-bold text-rose-600 bg-rose-50 dark:bg-rose-950/30 px-2 py-0.5 rounded-full">
                          {s.totalPoints} poin
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
