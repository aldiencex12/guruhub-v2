"use client";

import { useState } from "react";
import { TrendingUp, School, CheckSquare, Square, ArrowRight, Save, Calendar as CalendarIcon, Users } from "lucide-react";
import { useAcademicYears } from "@/queries/academic-years.query";
import { useClasses } from "@/queries/classes.query";
import { useClassMembers, usePromoteStudents } from "@/queries/class-members.query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

import { Dialog, ConfirmDialog } from "@/components/ui/dialog";

export default function PromotionsPage() {
  const { data: academicYears = [], isLoading: isLoadingYears } = useAcademicYears();
  const { data: classes = [], isLoading: isLoadingClasses } = useClasses();
  const promoteMutation = usePromoteStudents();

  // Kolom Asal
  const [sourceYearId, setSourceYearId] = useState<number | "">("");
  const [sourceClassId, setSourceClassId] = useState<number | "">("");
  
  // Kolom Tujuan
  const [targetYearId, setTargetYearId] = useState<number | "">("");
  const [targetClassId, setTargetClassId] = useState<number | "">("");

  // Ambil daftar siswa di kelas asal
  const { data: sourceMembers = [], isLoading: isLoadingMembers } = useClassMembers({ 
    classId: sourceClassId !== "" ? Number(sourceClassId) : 0 
  });

  // Ambil daftar siswa di kelas tujuan untuk mengecek siapa yang sudah dipromosikan
  const { data: targetMembers = [] } = useClassMembers({ 
    classId: targetClassId !== "" ? Number(targetClassId) : 0 
  });

  const targetStudentIds = new Set(targetMembers.map((m: any) => m.studentId));

  const [selectedStudentIds, setSelectedStudentIds] = useState<number[]>([]);

  // Filter kelas berdasarkan tahun ajaran
  const sourceClasses = classes.filter((c: any) => sourceYearId === "" || c.academicYearId === Number(sourceYearId));
  const targetClasses = classes.filter((c: any) => targetYearId === "" || c.academicYearId === Number(targetYearId));

  const handleSelectAll = () => {
    const availableStudents = sourceMembers.filter((m: any) => !targetStudentIds.has(m.studentId));
    if (selectedStudentIds.length === availableStudents.length) {
      setSelectedStudentIds([]); // Deselect all
    } else {
      setSelectedStudentIds(availableStudents.map((m: any) => m.studentId)); // Select all available
    }
  };

  const handleToggleStudent = (studentId: number) => {
    if (selectedStudentIds.includes(studentId)) {
      setSelectedStudentIds(selectedStudentIds.filter((id) => id !== studentId));
    } else {
      setSelectedStudentIds([...selectedStudentIds, studentId]);
    }
  };

  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleSubmit = () => {
    if (!sourceClassId) {
      toast.error("Pilih kelas asal terlebih dahulu.");
      return;
    }
    if (!targetClassId) {
      toast.error("Pilih kelas tujuan terlebih dahulu.");
      return;
    }
    if (selectedStudentIds.length === 0) {
      toast.error("Pilih minimal satu siswa untuk dipindahkan.");
      return;
    }

    if (sourceClassId === targetClassId) {
      toast.error("Kelas asal dan kelas tujuan tidak boleh sama");
      return;
    }

    setConfirmOpen(true);
  };

  const executePromotion = () => {
    promoteMutation.mutate({
      sourceClassId: Number(sourceClassId),
      targetClassId: Number(targetClassId),
      studentIds: selectedStudentIds
    }, {
      onSuccess: () => {
        setSelectedStudentIds([]); // reset selection
        setConfirmOpen(false);
      },
      onError: (err: any) => {
        console.error("Promote Error:", err);
        toast.error(err.message || "Gagal memindahkan siswa. Pastikan siswa belum ada di kelas target.");
        setConfirmOpen(false);
      }
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="bg-indigo-50 p-3 rounded-xl">
          <TrendingUp className="w-6 h-6 text-indigo-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Kenaikan Kelas</h1>
          <p className="text-sm text-gray-500 mt-1">
            Pindahkan siswa secara massal dari tahun ajaran lalu ke tahun ajaran baru
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Kolom Kiri: Kelas Asal */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col">
          <div className="p-5 border-b border-gray-100 bg-gray-50/50 rounded-t-2xl">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <School className="w-5 h-5 text-gray-500" /> Kelas Asal
            </h2>
            <p className="text-sm text-gray-500 mt-1">Pilih kelas yang berisi siswa yang akan dipromosikan</p>
          </div>
          
          <div className="p-5 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
                <CalendarIcon className="w-4 h-4 text-gray-400" /> Tahun Ajaran
              </label>
              <select
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 bg-white text-sm focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-colors"
                value={sourceYearId}
                onChange={(e) => { setSourceYearId(e.target.value ? Number(e.target.value) : ""); setSourceClassId(""); }}
              >
                <option value="">Pilih Tahun Ajaran...</option>
                {academicYears.map((ay: any) => (
                  <option key={ay.id} value={ay.id}>TA {ay.year} ({ay.semester}) {ay.isActive ? "⭐" : ""}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
                <School className="w-4 h-4 text-gray-400" /> Kelas
              </label>
              <select
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 bg-white text-sm focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-colors"
                value={sourceClassId}
                onChange={(e) => setSourceClassId(e.target.value ? Number(e.target.value) : "")}
                disabled={!sourceYearId}
              >
                <option value="">Pilih Kelas Asal...</option>
                {sourceClasses.map((c: any) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex-1 bg-gray-50 border-t border-gray-100 p-5 overflow-y-auto min-h-[300px]">
            {isLoadingMembers ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              </div>
            ) : sourceClassId === "" ? (
              <div className="text-center py-12 text-gray-500 text-sm">
                <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                Pilih kelas asal terlebih dahulu untuk melihat daftar siswa.
              </div>
            ) : sourceMembers.length === 0 ? (
              <div className="text-center py-12 text-gray-500 text-sm">
                Tidak ada siswa di kelas ini.
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Daftar Siswa ({sourceMembers.length})</span>
                  <button 
                    onClick={handleSelectAll}
                    disabled={targetClassId === "" || sourceMembers.filter((m: any) => !targetStudentIds.has(m.studentId)).length === 0}
                    className="text-xs font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {selectedStudentIds.length > 0 && selectedStudentIds.length === sourceMembers.filter((m: any) => !targetStudentIds.has(m.studentId)).length ? <CheckSquare className="w-3.5 h-3.5"/> : <Square className="w-3.5 h-3.5"/>}
                    Pilih Semua
                  </button>
                </div>
                {sourceMembers.map((member: any) => {
                  const isAlreadyPromoted = targetStudentIds.has(member.studentId);
                  const isSelected = selectedStudentIds.includes(member.studentId);
                  return (
                    <div 
                      key={member.id} 
                      onClick={() => !isAlreadyPromoted && handleToggleStudent(member.studentId)}
                      className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                        isAlreadyPromoted ? 'bg-gray-50 border-gray-100 opacity-60 cursor-not-allowed' :
                        isSelected ? 'bg-indigo-50 border-indigo-200 cursor-pointer' : 'bg-white border-gray-200 hover:border-indigo-300 cursor-pointer'
                      }`}
                    >
                      <div className="flex-shrink-0">
                        {isAlreadyPromoted ? (
                          <CheckSquare className="w-5 h-5 text-gray-400" />
                        ) : isSelected ? (
                          <CheckSquare className="w-5 h-5 text-indigo-600" />
                        ) : (
                          <Square className="w-5 h-5 text-gray-300" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className={`text-sm font-medium ${isSelected && !isAlreadyPromoted ? 'text-indigo-900' : 'text-gray-900'}`}>{member.student.name}</p>
                        <p className="text-xs text-gray-500">NISN: {member.student.nisn}</p>
                      </div>
                      {isAlreadyPromoted && (
                        <span className="text-[10px] font-medium bg-green-100 text-green-700 px-2 py-0.5 rounded-full whitespace-nowrap">
                          Sudah di Kelas Ini
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Kolom Kanan: Kelas Tujuan */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col relative">
          <div className="hidden lg:flex absolute top-1/2 -left-[1.6rem] z-10 w-12 h-12 bg-white rounded-full border border-gray-100 shadow-sm items-center justify-center transform -translate-y-1/2">
            <ArrowRight className="w-6 h-6 text-indigo-400" />
          </div>

          <div className="p-5 border-b border-gray-100 bg-gray-50/50 rounded-t-2xl">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <School className="w-5 h-5 text-indigo-500" /> Kelas Tujuan
            </h2>
            <p className="text-sm text-gray-500 mt-1">Pilih kelas baru untuk para siswa tersebut</p>
          </div>
          
          <div className="p-5 space-y-4 flex-1">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
                <CalendarIcon className="w-4 h-4 text-gray-400" /> Tahun Ajaran
              </label>
              <select
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 bg-white text-sm focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-colors"
                value={targetYearId}
                onChange={(e) => { setTargetYearId(e.target.value ? Number(e.target.value) : ""); setTargetClassId(""); }}
              >
                <option value="">Pilih Tahun Ajaran...</option>
                {academicYears.map((ay: any) => (
                  <option key={ay.id} value={ay.id}>TA {ay.year} ({ay.semester}) {ay.isActive ? "⭐" : ""}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
                <School className="w-4 h-4 text-gray-400" /> Kelas
              </label>
              <select
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 bg-white text-sm focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-colors"
                value={targetClassId}
                onChange={(e) => setTargetClassId(e.target.value ? Number(e.target.value) : "")}
                disabled={!targetYearId}
              >
                <option value="">Pilih Kelas Tujuan...</option>
                {targetClasses.map((c: any) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div className="pt-8 flex flex-col gap-3 h-full justify-center">
              <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 text-center">
                <p className="text-sm text-indigo-800">
                  <span className="font-bold text-lg">{selectedStudentIds.length}</span> siswa terpilih siap dipindahkan
                </p>
              </div>

              <Button 
                onClick={handleSubmit}
                disabled={promoteMutation.isPending}
                className="w-full py-6 text-lg rounded-xl flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/20 transition-all"
              >
                {promoteMutation.isPending ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Proses Pindah Kelas
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog 
        open={confirmOpen} 
        onClose={() => setConfirmOpen(false)} 
        onConfirm={executePromotion} 
        title="Konfirmasi Pindah Kelas" 
        description={`Apakah Anda yakin ingin memindahkan ${selectedStudentIds.length} siswa ke kelas tujuan? Tindakan ini tidak akan menghapus riwayat mereka di kelas sebelumnya.`} 
        loading={promoteMutation.isPending} 
        variant="warning" 
      />
    </div>
  );
}
