"use client";

import { useState, useEffect, useMemo } from "react";
import { UserCheck, Plus, Trash2, Users, Search, Check } from "lucide-react";
import { toast } from "sonner";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/tables/DataTable";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Dialog, ConfirmDialog } from "@/components/ui/dialog";
import { useClasses } from "@/queries/classes.query";
import { useStudents } from "@/queries/students.query";
import { useTeachers } from "@/queries/teachers.query";
import { useAcademicYears } from "@/queries/dashboard.query";
import { useClassMembers, useAddClassMember, useRemoveClassMember } from "@/queries/class-members.query";
import type { ClassMember } from "@/types";
import { getGenderLabel } from "@/lib/utils";

export default function ClassMembersPage() {
  const { data: classes = [], isLoading: isClassesLoading } = useClasses();
  const [selectedClassId, setSelectedClassId] = useState<number>(0);

  useEffect(() => {
    if (classes.length > 0 && !selectedClassId) {
      setSelectedClassId(classes[0].id);
    }
  }, [classes, selectedClassId]);

  const { data: members = [], isLoading: isMembersLoading } = useClassMembers({
    classId: selectedClassId,
  });
  const { data: students = [] } = useStudents({ status: "Aktif", limit: 9999 });
  const { data: teachers = [] } = useTeachers();
  const { data: academicYears = [] } = useAcademicYears();

  const addMember = useAddClassMember();
  const removeMember = useRemoveClassMember();

  const [addDialog, setAddDialog] = useState(false);
  const [removeDialog, setRemoveDialog] = useState<ClassMember | null>(null);
  const [studentSearch, setStudentSearch] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");

  const isMutating = addMember.isPending || removeMember.isPending;

  const memberStudentIds = useMemo(() => new Set(members.map((m) => m.studentId)), [members]);
  const availableStudents = useMemo(() => {
    return students.filter((s) => !memberStudentIds.has(s.id));
  }, [students, memberStudentIds]);

  const filteredStudents = useMemo(() => {
    const query = studentSearch.toLowerCase();
    return availableStudents.filter(
      (s) => s.name.toLowerCase().includes(query) || s.nisn?.toLowerCase().includes(query)
    );
  }, [availableStudents, studentSearch]);

  const selectedClass = classes.find((c) => c.id === selectedClassId);

  const handleAdd = async () => {
    if (!selectedStudentId || !selectedClassId) return;
    try {
      await addMember.mutateAsync({
        classId: selectedClassId,
        studentId: Number(selectedStudentId),
      });
      setAddDialog(false);
      setSelectedStudentId("");
      setStudentSearch("");
    } catch {}
  };

  const handleRemove = async () => {
    if (!removeDialog) return;
    try {
      await removeMember.mutateAsync(removeDialog.id);
      setRemoveDialog(null);
    } catch {}
  };

  const columns: ColumnDef<ClassMember>[] = [
    { id: "no", header: "No", cell: ({ row }) => <span className="text-gray-400">{row.index + 1}</span> },
    {
      id: "student.name",
      accessorKey: "student.name",
      header: "Nama Siswa",
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {row.original.student?.name?.charAt(0) || "S"}
          </div>
          <div>
            <p className="font-medium text-gray-900 dark:text-gray-100">{row.original.student?.name}</p>
            <p className="text-xs text-gray-400">{row.original.student?.nisn}</p>
          </div>
        </div>
      )
    },
    { id: "nis", header: "NIS", cell: ({ row }) => <span className="font-mono text-xs">{row.original.student?.nis ?? "—"}</span> },
    { id: "gender", header: "L/P", cell: ({ row }) => getGenderLabel(row.original.student?.gender ?? "L") },
    { id: "actions", header: "Aksi", cell: ({ row }) => (
      <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700 hover:bg-red-50 h-7" onClick={() => setRemoveDialog(row.original)}>
        <Trash2 className="h-3.5 w-3.5 mr-1" /> Keluarkan
      </Button>
    )},
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2"><UserCheck className="h-6 w-6 text-teal-600" /> Anggota Kelas</h1>
          <p className="text-sm text-gray-500 mt-1">Kelola siswa dalam setiap kelas</p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
          <div className="space-y-1.5 flex-1 max-w-xs">
            <Label>Pilih Kelas</Label>
            {isClassesLoading ? (
              <div className="h-10 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
            ) : (
              <Select value={selectedClassId} onChange={(e) => setSelectedClassId(Number(e.target.value))}>
                <option value="0" disabled>— Pilih Kelas —</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} — {c.academicYear?.name ?? academicYears.find(ay => ay.id === c.academicYearId)?.name ?? ""}
                  </option>
                ))}
              </Select>
            )}
          </div>
          <div className="flex items-center gap-3">
            <div className="text-sm text-gray-500">
              <span className="font-semibold text-gray-900 dark:text-gray-100">{members.length}</span> siswa
            </div>
            <Button onClick={() => setAddDialog(true)} disabled={availableStudents.length === 0 || !selectedClassId}>
              <Plus className="h-4 w-4" /> Tambah Siswa
            </Button>
          </div>
        </div>
      </div>

      {selectedClass && (
        <div className="bg-indigo-50 dark:bg-indigo-950/30 rounded-xl border border-indigo-100 dark:border-indigo-900 p-4 flex items-center gap-4">
          <div className="h-10 w-10 rounded-lg bg-indigo-600 flex items-center justify-center">
            <Users className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="font-semibold text-indigo-900 dark:text-indigo-100">Kelas {selectedClass.name}</p>
            <p className="text-sm text-indigo-600 dark:text-indigo-400">
              Tingkat {selectedClass.gradeLevel} • Wali Kelas: {selectedClass.homeroomTeacher?.name ?? teachers.find(t => t.id === selectedClass.homeroomTeacherId)?.name ?? "Belum ditentukan"}
            </p>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
        {isMembersLoading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <div className="h-8 w-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-500">Memuat anggota kelas...</p>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={members}
            searchKey="student.name"
            searchPlaceholder="Cari nama siswa..."
            emptyMessage="Belum ada siswa di kelas ini."
          />
        )}
      </div>

      <Dialog open={addDialog} onClose={() => setAddDialog(false)} title="Tambah Siswa ke Kelas" description={`Pilih siswa untuk ditambahkan ke kelas ${selectedClass?.name}`}>
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input placeholder="Cari nama atau NISN..." value={studentSearch} onChange={(e) => setStudentSearch(e.target.value)} className="pl-9" />
          </div>
          <div className="max-h-64 overflow-y-auto border rounded-md divide-y">
            {filteredStudents.length === 0 ? (
              <p className="p-4 text-center text-sm text-gray-500">Siswa tidak ditemukan.</p>
            ) : (
              filteredStudents.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSelectedStudentId(String(s.id))}
                  className={`w-full flex items-center justify-between p-3 text-sm hover:bg-gray-50 transition-colors ${selectedStudentId === String(s.id) ? "bg-indigo-50 hover:bg-indigo-50" : ""}`}
                >
                  <div className="text-left">
                    <p className="font-medium">{s.name}</p>
                    <p className="text-xs text-gray-400">NISN: {s.nisn}</p>
                  </div>
                  {selectedStudentId === String(s.id) && <Check className="h-4 w-4 text-indigo-600" />}
                </button>
              ))
            )}
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setAddDialog(false)}>Batal</Button>
            <Button onClick={handleAdd} loading={isMutating} disabled={!selectedStudentId}>Tambahkan</Button>
          </div>
        </div>
      </Dialog>

      <ConfirmDialog open={!!removeDialog} onClose={() => setRemoveDialog(null)} onConfirm={handleRemove} title="Keluarkan Siswa" description={`Keluarkan "${removeDialog?.student?.name}" dari kelas ini?`} loading={isMutating} />
    </div>
  );
}
