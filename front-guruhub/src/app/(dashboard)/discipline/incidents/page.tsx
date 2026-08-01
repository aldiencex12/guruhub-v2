"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  useDisciplineViolations,
  useVerifyDisciplineViolation,
  useResolveDisciplineViolation,
  disciplineKeys,
} from "@/queries/discipline.query";
import { disciplineService } from "@/services/discipline";
import { classesService } from "@/services/classes";
import { classMembersService } from "@/services/class-members";
import { PageHeader } from "@/components/core/PageHeader";
import { SectionCard } from "@/components/core/SectionCard";
import { LoadingState } from "@/components/core/LoadingState";
import { EmptyState } from "@/components/core/EmptyState";
import { ErrorState } from "@/components/core/ErrorState";
import { usePermissions } from "@/hooks/usePermissions";
import { formatStatus, formatPoints, formatDate } from "@/lib/discipline.utils";
import {
  ShieldAlert,
  Filter,
  Plus,
  X,
  CheckCircle,
  CheckSquare,
  Square,
  CheckCheck,
  XCircle,
  Loader2,
  AlertTriangle,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const STATUS_CONFIG: Record<string, { label: string; badge: string }> = {
  PENDING:      { label: "Menunggu",   badge: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300" },
  VERIFIED:     { label: "Terverifikasi", badge: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300" },
  RESOLVED:     { label: "Selesai",    badge: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300" },
  REJECTED:     { label: "Ditolak",    badge: "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300" },
  DRAFT:        { label: "Draft",      badge: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300" },
  UNDER_REVIEW: { label: "Dalam Review", badge: "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300" },
};

const SMALL_POINTS_THRESHOLD = 25;

export default function DisciplineIncidentsPage() {
  const queryClient = useQueryClient();
  const { role } = usePermissions();

  const [statusFilter, setStatusFilter] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  // Form State for New Incident
  const todayStr = new Date().toISOString().split("T")[0];
  const [selectedClassId, setSelectedClassId] = useState<number>(0);
  const [selectedStudentId, setSelectedStudentId] = useState<number>(0);
  const [selectedStudentClassMemberId, setSelectedStudentClassMemberId] = useState<number>(0);
  const [academicYearId, setAcademicYearId] = useState<number>(1);
  const [disciplineTypeId, setDisciplineTypeId] = useState<number>(0);
  const [incidentDate, setIncidentDate] = useState<string>(todayStr);
  const [incidentTime, setIncidentTime] = useState<string>("08:00");
  const [location, setLocation] = useState<string>("");
  const [description, setDescription] = useState<string>("");

  // Resolve Modal State
  const [resolveModalId, setResolveModalId] = useState<number | null>(null);
  const [resolveModalPoints, setResolveModalPoints] = useState<number>(0);
  const [actionTaken, setActionTaken] = useState<string>("");

  // Fetch Violations / Incidents Data
  const { data: rawIncidents, isLoading, isError, refetch } = useDisciplineViolations({
    status: statusFilter || undefined,
  });

  const incidents = useMemo(() => {
    let list: any[] = Array.isArray(rawIncidents) ? rawIncidents : (rawIncidents as any)?.data || [];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (item) =>
          item.studentName?.toLowerCase().includes(q) ||
          item.student?.name?.toLowerCase().includes(q) ||
          item.typeName?.toLowerCase().includes(q) ||
          item.className?.toLowerCase().includes(q) ||
          item.location?.toLowerCase().includes(q)
      );
    }
    // Sort newest first (descending by incidentDate, then id)
    return [...list].sort((a: any, b: any) => {
      const dateA = new Date(a.incidentDate || a.createdAt || 0).getTime();
      const dateB = new Date(b.incidentDate || b.createdAt || 0).getTime();
      if (dateB !== dateA) return dateB - dateA;
      return (b.id || 0) - (a.id || 0);
    });
  }, [rawIncidents, searchQuery]);

  // Fetch Discipline Types
  const { data: typesData } = useQuery({
    queryKey: disciplineKeys.types(),
    queryFn: async () => {
      const res = await disciplineService.getTypes();
      return res.data || res;
    },
  });
  const disciplineTypes = Array.isArray(typesData) ? typesData : typesData?.data || [];

  useEffect(() => {
    if (disciplineTypes.length > 0) {
      const exists = disciplineTypes.some((t: any) => t.id === disciplineTypeId);
      if (!exists && disciplineTypes[0]?.id) {
        setDisciplineTypeId(disciplineTypes[0].id);
      }
    }
  }, [disciplineTypes, disciplineTypeId]);

  // Fetch all classes
  const { data: classesData } = useQuery({
    queryKey: ["classes", "all"],
    queryFn: () => classesService.getAll({ limit: 200 }),
  });
  const allClasses: any[] = Array.isArray(classesData) ? classesData : [];

  // Fetch students in selected class
  const { data: membersData } = useQuery({
    queryKey: ["class-members", selectedClassId],
    queryFn: () => classMembersService.getAll({ classId: selectedClassId }),
    enabled: selectedClassId > 0,
  });
  const classMembers: any[] = Array.isArray(membersData) ? membersData : [];

  const handleClassChange = (id: number) => {
    setSelectedClassId(id);
    setSelectedStudentId(0);
    setSelectedStudentClassMemberId(0);
  };

  const handleStudentChange = (memberId: number) => {
    const member = classMembers.find((m: any) => m.id === memberId);
    if (member) {
      setSelectedStudentId(member.studentId);
      setSelectedStudentClassMemberId(member.id);
      if (member.academicYearId) setAcademicYearId(member.academicYearId);
    }
  };

  const verifyMutation = useVerifyDisciplineViolation();
  const resolveMutation = useResolveDisciplineViolation();

  const createIncidentMutation = useMutation({
    mutationFn: async (payload: any) => {
      return disciplineService.createIncident(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: disciplineKeys.all });
      toast.success("Laporan insiden berhasil dikirim.");
      setIsReportModalOpen(false);
      // Reset form
      setSelectedClassId(0);
      setSelectedStudentId(0);
      setSelectedStudentClassMemberId(0);
      setLocation("");
      setDescription("");
    },
    onError: (err: any) => {
      toast.error(err?.message || "Gagal melaporkan insiden");
    },
  });

  const handleReportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClassId || !selectedStudentId || !disciplineTypeId) {
      toast.error("Mohon lengkapi data kelas, siswa, dan jenis pelanggaran.");
      return;
    }

    const timeWithSeconds = incidentTime.length === 5 ? `${incidentTime}:00` : incidentTime;

    createIncidentMutation.mutate({
      incidentDate,
      incidentTime: timeWithSeconds,
      location: location || undefined,
      description: description.trim(),
      students: [
        {
          studentId: Number(selectedStudentId),
          classId: Number(selectedClassId),
          academicYearId: Number(academicYearId),
          disciplineTypeId: Number(disciplineTypeId),
        },
      ],
    });
  };

  // --- Bulk Selection & Actions ---
  const [bulkLoading, setBulkLoading] = useState(false);
  const [selectedPendingIds, setSelectedPendingIds] = useState<Set<number>>(new Set());
  const [selectedVerifiedIds, setSelectedVerifiedIds] = useState<Set<number>>(new Set());

  const pendingViolations = useMemo(
    () => incidents.filter((v: any) => v.status === "PENDING"),
    [incidents]
  );

  const verifiedSmallViolations = useMemo(
    () =>
      incidents.filter(
        (v: any) => v.status === "VERIFIED" && (v.demeritPoints ?? v.points ?? 0) <= SMALL_POINTS_THRESHOLD
      ),
    [incidents]
  );

  const allPendingSelected =
    pendingViolations.length > 0 && pendingViolations.every((v: any) => selectedPendingIds.has(v.id));
  const somePendingSelected = selectedPendingIds.size > 0 && !allPendingSelected;

  const toggleSelectAllPending = () => {
    if (allPendingSelected) setSelectedPendingIds(new Set());
    else setSelectedPendingIds(new Set(pendingViolations.map((v: any) => v.id)));
  };

  const togglePendingRow = (id: number) => {
    setSelectedPendingIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleVerifiedRow = (id: number) => {
    setSelectedVerifiedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const allVerifiedSmallSelected =
    verifiedSmallViolations.length > 0 &&
    verifiedSmallViolations.every((v: any) => selectedVerifiedIds.has(v.id));

  const toggleSelectAllVerifiedSmall = () => {
    if (allVerifiedSmallSelected) setSelectedVerifiedIds(new Set());
    else setSelectedVerifiedIds(new Set(verifiedSmallViolations.map((v: any) => v.id)));
  };

  const handleBulkResolve = async () => {
    const ids = Array.from(selectedVerifiedIds);
    if (ids.length === 0) return;
    setBulkLoading(true);
    let successCount = 0;

    for (const id of ids) {
      try {
        await resolveMutation.mutateAsync({
          id,
          data: { actionTaken: "Penyelesaian massal sanksi poin ringan." },
        });
        successCount++;
      } catch (err) {
        console.error(`[Bulk Resolve] Failed for ID #${id}`, err);
      }
    }

    setBulkLoading(false);
    setSelectedVerifiedIds(new Set());
    toast.success(`${successCount} sanksi insiden berhasil diselesaikan.`);
  };

  const handleBulkVerify = async () => {
    const ids = Array.from(selectedPendingIds);
    if (ids.length === 0) return;
    setBulkLoading(true);
    let successCount = 0;

    for (const id of ids) {
      try {
        await verifyMutation.mutateAsync({ id, data: { status: "VERIFIED" } });
        successCount++;
      } catch (err) {
        console.error(`[Bulk Verify] Failed for ID #${id}`, err);
      }
    }

    setBulkLoading(false);
    setSelectedPendingIds(new Set());
    toast.success(`${successCount} insiden berhasil diverifikasi.`);
  };

  const handleVerifySingle = (id: number, status: "VERIFIED" | "REJECTED") => {
    verifyMutation.mutate(
      { id, data: { status } },
      {
        onSuccess: () => {
          toast.success(
            status === "VERIFIED"
              ? "Insiden terverifikasi dan poin demerit berhasil diakumulasikan."
              : "Laporan insiden berhasil ditolak."
          );
        },
        onError: (err: any) => {
          toast.error(err?.message || "Gagal memperbarui status insiden.");
        },
      }
    );
  };

  const handleOpenResolveModal = (violation: any) => {
    setResolveModalId(violation.id);
    setResolveModalPoints(violation.demeritPoints ?? violation.points ?? 0);
    setActionTaken("");
  };

  const handleConfirmResolve = async () => {
    if (!resolveModalId) return;
    try {
      await resolveMutation.mutateAsync({
        id: resolveModalId,
        data: { actionTaken: actionTaken || "" },
      });
      toast.success("Sanksi pelanggaran berhasil diselesaikan.");
      setResolveModalId(null);
    } catch (err: any) {
      toast.error(err?.message || "Gagal menyelesaikan sanksi pelanggaran.");
    }
  };

  // Pagination calculations
  const totalItems = incidents.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const safePage = Math.min(Math.max(1, page), totalPages);
  const paginatedIncidents = incidents.slice((safePage - 1) * pageSize, safePage * pageSize);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader
          title="Catatan & Manajemen Pelanggaran"
          description="Kelola seluruh catatan pelanggaran siswa, verifikasi laporan guru, dan penyelesaian sanksi kedisiplinan."
        />
        <button
          onClick={() => setIsReportModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Catat Pelanggaran Baru
        </button>
      </div>

      {/* Filter Toolbar & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card p-4 rounded-xl border border-border/80 shadow-sm">
        {/* Status Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground mr-1">
            <Filter className="w-3.5 h-3.5" />
            <span>Status:</span>
          </div>

          {[
            { label: "Semua Insiden", value: "" },
            { label: "Menunggu (PENDING)", value: "PENDING" },
            { label: "Terverifikasi", value: "VERIFIED" },
            { label: "Selesai (RESOLVED)", value: "RESOLVED" },
            { label: "Ditolak", value: "REJECTED" },
          ].map((f) => (
            <button
              key={f.value}
              onClick={() => {
                setStatusFilter(f.value);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                statusFilter === f.value
                  ? "bg-primary text-primary-foreground shadow-sm font-semibold"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Cari siswa, kelas, lokasi..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-4 py-1.5 text-xs rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      {/* Bulk Verification Bar */}
      {selectedPendingIds.size > 0 && (
        <div className="flex items-center justify-between p-3.5 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 rounded-xl">
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-900 dark:text-indigo-200">
            <CheckSquare className="w-4 h-4 text-indigo-600" />
            <span>{selectedPendingIds.size} insiden berstatus PENDING dipilih</span>
          </div>
          <button
            onClick={handleBulkVerify}
            disabled={bulkLoading}
            className="px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {bulkLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCheck className="w-3.5 h-3.5" />}
            Verifikasi Semua Pilihan
          </button>
        </div>
      )}

      {/* Bulk Resolve Bar */}
      {selectedVerifiedIds.size > 0 && (
        <div className="flex items-center justify-between p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl">
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-900 dark:text-emerald-200">
            <CheckSquare className="w-4 h-4 text-emerald-600" />
            <span>{selectedVerifiedIds.size} insiden berstatus VERIFIED dipilih</span>
          </div>
          <button
            onClick={handleBulkResolve}
            disabled={bulkLoading}
            className="px-3 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {bulkLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
            Selesaikan Semua Pilihan
          </button>
        </div>
      )}

      {/* Main Table Section */}
      <SectionCard>
        {isLoading ? (
          <LoadingState message="Memuat catatan pelanggaran disiplin..." rows={6} />
        ) : isError ? (
          <ErrorState onRetry={refetch} />
        ) : incidents.length === 0 ? (
          <EmptyState
            title="Tidak Ada Inciden Tercatat"
            description="Belum ada insiden disiplin yang sesuai dengan kriteria filter."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead className="bg-muted/50 border-b border-border text-xs font-semibold text-muted-foreground uppercase">
                <tr>
                  <th className="px-3 py-3 w-10 text-center">
                    {pendingViolations.length > 0 ? (
                      <button onClick={toggleSelectAllPending} title="Pilih Semua Pending">
                        {allPendingSelected ? (
                          <CheckSquare className="w-4 h-4 text-primary" />
                        ) : (
                          <Square className="w-4 h-4 text-muted-foreground" />
                        )}
                      </button>
                    ) : verifiedSmallViolations.length > 0 ? (
                      <button onClick={toggleSelectAllVerifiedSmall} title="Pilih Semua Terverifikasi">
                        {allVerifiedSmallSelected ? (
                          <CheckSquare className="w-4 h-4 text-indigo-600" />
                        ) : (
                          <Square className="w-4 h-4 text-muted-foreground" />
                        )}
                      </button>
                    ) : null}
                  </th>
                  <th className="px-4 py-3">Tanggal / Waktu</th>
                  <th className="px-4 py-3">Siswa & Kelas</th>
                  <th className="px-4 py-3">Jenis Pelanggaran</th>
                  <th className="px-4 py-3">Lokasi</th>
                  <th className="px-4 py-3 text-center">Demerit</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {paginatedIncidents.map((incident: any) => {
                  const cfg = STATUS_CONFIG[incident.status] || {
                    label: incident.status,
                    badge: "bg-gray-100 text-gray-700",
                  };
                  const isPending = incident.status === "PENDING";
                  const isVerified = incident.status === "VERIFIED";
                  const isPendingSelected = selectedPendingIds.has(incident.id);
                  const isVerifiedSelected = selectedVerifiedIds.has(incident.id);

                  return (
                    <tr key={incident.id} className="hover:bg-muted/40 transition-colors">
                      <td className="px-3 py-3 text-center">
                        {isPending ? (
                          <button onClick={() => togglePendingRow(incident.id)}>
                            {isPendingSelected ? (
                              <CheckSquare className="w-4 h-4 text-primary" />
                            ) : (
                              <Square className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                            )}
                          </button>
                        ) : isVerified ? (
                          <button onClick={() => toggleVerifiedRow(incident.id)}>
                            {isVerifiedSelected ? (
                              <CheckSquare className="w-4 h-4 text-indigo-600" />
                            ) : (
                              <Square className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                            )}
                          </button>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 text-xs font-mono text-muted-foreground whitespace-nowrap">
                        <span className="font-semibold text-foreground block">{formatDate(incident.incidentDate || incident.createdAt)}</span>
                        {incident.incidentTime ? (
                          <span className="block text-[11px] text-muted-foreground">Pukul {incident.incidentTime.slice(0, 5)} WIB</span>
                        ) : incident.createdAt ? (
                          <span className="block text-[11px] text-muted-foreground">
                            Pukul {new Date(incident.createdAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} WIB
                          </span>
                        ) : null}
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-semibold text-foreground block">
                          {incident.studentName || incident.student?.name || `Siswa #${incident.studentId}`}
                        </span>
                        <span className="text-xs text-muted-foreground block">
                          {incident.className ? `Kelas: ${incident.className}` : ""}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs">
                        <span className="font-semibold text-foreground block">
                          {incident.typeName || incident.description || "Pelanggaran Aturan"}
                        </span>
                        {incident.description && (
                          <span className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">{incident.description}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {incident.location || "Sekolah"}
                      </td>
                      <td className="px-4 py-3 text-center font-bold text-rose-600 dark:text-rose-400">
                        {formatPoints(incident.demeritPoints || incident.points || 5)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold shadow-xs", cfg.badge)}>
                          {cfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right space-x-1.5 whitespace-nowrap">
                        {isPending && (
                          <>
                            <button
                              onClick={() => handleVerifySingle(incident.id, "VERIFIED")}
                              disabled={verifyMutation.isPending}
                              className="px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors cursor-pointer disabled:opacity-50 shadow-xs"
                            >
                              Verifikasi
                            </button>
                            <button
                              onClick={() => handleVerifySingle(incident.id, "REJECTED")}
                              disabled={verifyMutation.isPending}
                              className="px-2.5 py-1 text-xs font-bold rounded-lg bg-rose-600 hover:bg-rose-500 text-white transition-colors cursor-pointer disabled:opacity-50 shadow-xs"
                            >
                              Tolak
                            </button>
                          </>
                        )}
                        {isVerified && (
                          <button
                            onClick={() => handleOpenResolveModal(incident)}
                            className="px-2.5 py-1 text-xs font-bold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-colors cursor-pointer shadow-xs"
                          >
                            Selesaikan
                          </button>
                        )}
                        {incident.status === "RESOLVED" && (
                          <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center justify-end gap-1">
                            <CheckCircle className="w-3.5 h-3.5" /> Selesai
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Pagination Controls */}
            <div className="px-4 py-3 bg-muted/30 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground mt-2">
              <div>
                Menampilkan {(safePage - 1) * pageSize + 1} hingga {Math.min(safePage * pageSize, totalItems)} dari {totalItems} insiden
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={safePage === 1}
                  className="px-3 py-1.5 rounded-lg border border-border bg-background hover:bg-muted disabled:opacity-50 transition-colors cursor-pointer"
                >
                  Sebelumnya
                </button>
                <span className="font-semibold px-2">Halaman {safePage} dari {totalPages}</span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={safePage === totalPages}
                  className="px-3 py-1.5 rounded-lg border border-border bg-background hover:bg-muted disabled:opacity-50 transition-colors cursor-pointer"
                >
                  Selanjutnya
                </button>
              </div>
            </div>
          </div>
        )}
      </SectionCard>

      {/* Create New Incident Modal */}
      {isReportModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-lg text-slate-900 dark:text-white">Catat Pelanggaran Siswa</h3>
              </div>
              <button
                onClick={() => setIsReportModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleReportSubmit} className="p-5 space-y-4 text-xs">
              {/* Class Dropdown */}
              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Pilih Kelas Siswa *</label>
                <select
                  value={selectedClassId}
                  onChange={(e) => handleClassChange(Number(e.target.value))}
                  className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                  required
                >
                  <option value={0}>-- Pilih Kelas --</option>
                  {allClasses.map((c: any) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.academicYear ? `(${c.academicYear.name})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              {/* Student Dropdown */}
              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Pilih Siswa *</label>
                <select
                  value={selectedStudentClassMemberId}
                  onChange={(e) => handleStudentChange(Number(e.target.value))}
                  disabled={!selectedClassId}
                  className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white disabled:opacity-50"
                  required
                >
                  <option value={0}>
                    {selectedClassId ? "-- Pilih Siswa --" : "-- Pilih Kelas Terlebih Dahulu --"}
                  </option>
                  {classMembers.map((m: any) => (
                    <option key={m.id} value={m.id}>
                      {m.student?.name || `Siswa #${m.studentId}`} ({m.student?.nisn || "NISN -"})
                    </option>
                  ))}
                </select>
              </div>

              {/* Incident Type Dropdown */}
              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Jenis Pelanggaran Tata Tertib *</label>
                <select
                  value={disciplineTypeId}
                  onChange={(e) => setDisciplineTypeId(Number(e.target.value))}
                  className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                  required
                >
                  {disciplineTypes.map((t: any) => (
                    <option key={t.id} value={t.id}>
                      [{t.category?.name || "Disiplin"}] {t.name} (+{t.demeritPoints} Demerit)
                    </option>
                  ))}
                </select>
              </div>

              {/* Date & Time */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Tanggal Kejadian *</label>
                  <input
                    type="date"
                    value={incidentDate}
                    onChange={(e) => setIncidentDate(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Waktu Kejadian *</label>
                  <input
                    type="time"
                    value={incidentTime}
                    onChange={(e) => setIncidentTime(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                    required
                  />
                </div>
              </div>

              {/* Location */}
              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Lokasi Kejadian</label>
                <input
                  type="text"
                  placeholder="Misal: Kantin, Ruang Kelas VIII-A, Lapangan"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Keterangan / Kronologi Singkat</label>
                <textarea
                  rows={3}
                  placeholder="Tuliskan catatan singkat kronologi pelanggaran siswa..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsReportModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={createIncidentMutation.isPending}
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {createIncidentMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                  Simpan & Laporkan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Resolve Sanction Modal (Solid Non-Transparent BG) */}
      {resolveModalId && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Penyelesaian Sanksi Insiden #{resolveModalId}</h3>
              <button onClick={() => setResolveModalId(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Konfirmasi penyelesaian sanksi untuk laporan pelanggaran ini. Status insiden akan diperbarui menjadi{" "}
              <strong className="text-emerald-600 font-bold">RESOLVED</strong>.
            </p>

            <div>
              <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
                Tindakan Pembinaan / Catatan Penyelesaian
              </label>
              <textarea
                rows={3}
                placeholder="Misal: Telah dilakukan konseling oleh Tim BK dan diberikan surat teguran."
                value={actionTaken}
                onChange={(e) => setActionTaken(e.target.value)}
                className="w-full p-2.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setResolveModalId(null)}
                className="px-4 py-2 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmResolve}
                disabled={resolveMutation.isPending}
                className="px-4 py-2 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {resolveMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Konfirmasi Selesai
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
