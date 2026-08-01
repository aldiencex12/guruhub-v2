"use client";

import { useState } from "react";
import { Plus, Edit2, Trash2, KeyRound, ShieldCheck, Search, Filter } from "lucide-react";
import {
  useUsers,
  useCreateUser,
  useUpdateUser,
  useDeleteUser,
  useResetPassword,
  useGenerateBulkUsers,
  useDeleteBulkUsers
} from "../../../queries/users.query";
import { useTeachers } from "../../../queries/teachers.query";
import { User } from "../../../services/users";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

export default function UsersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const limit = 10;

  const { data: usersData, isLoading, isError } = useUsers({ page, limit, search, role: roleFilter });
  const { data: teachers = [] } = useTeachers();
  const createMutation = useCreateUser();
  const updateMutation = useUpdateUser();
  const deleteMutation = useDeleteUser();
  const resetPasswordMutation = useResetPassword();
  const generateBulkMutation = useGenerateBulkUsers();
  const deleteBulkMutation = useDeleteBulkUsers();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "Teacher",
    status: "Aktif",
    teacherId: 0,
  });

  const [passwordForm, setPasswordForm] = useState({
    newPassword: ""
  });

  const [errorMsg, setErrorMsg] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<{ type: "single" | "bulk" | "generate"; id?: number } | null>(null);

  const handleOpenModal = (user?: User) => {
    if (user) {
      setEditingId(user.id);
      setFormData({
        name: "",
        email: user.email,
        password: "",
        role: user.role,
        status: user.status,
        teacherId: 0,
      });
    } else {
      setEditingId(null);
      setFormData({
        name: "",
        email: "",
        password: "",
        role: "Teacher",
        status: "Aktif",
        teacherId: 0,
      });
    }
    setErrorMsg("");
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
  };

  const handleOpenPasswordModal = (user: User) => {
    setEditingId(user.id);
    setPasswordForm({ newPassword: "" });
    setErrorMsg("");
    setIsPasswordModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (editingId) {
      updateMutation.mutate(
        { id: editingId, email: formData.email, role: formData.role, status: formData.status },
        {
          onSuccess: () => handleCloseModal(),
          onError: (err: any) => setErrorMsg(err.message || "Gagal memperbarui pengguna"),
        }
      );
    } else {
      createMutation.mutate(
        { 
          email: formData.email, 
          password: formData.password, 
          role: formData.role, 
          status: formData.status,
          teacherId: formData.teacherId || undefined 
        } as any,
        {
          onSuccess: () => handleCloseModal(),
          onError: (err: any) => setErrorMsg(err.message || "Gagal menambahkan pengguna"),
        }
      );
    }
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (editingId) {
      resetPasswordMutation.mutate(
        { id: editingId, newPassword: passwordForm.newPassword },
        {
          onSuccess: () => {
            setIsPasswordModalOpen(false);
            setEditingId(null);
            alert("Kata sandi berhasil direset!");
          },
          onError: (err: any) => setErrorMsg(err.message || "Gagal mereset kata sandi"),
        }
      );
    }
  };

  const handleDelete = (id: number) => {
    setConfirmDelete({ type: "single", id });
  };

  const handleDeleteBulk = () => {
    setConfirmDelete({ type: "bulk" });
  };

  const executeDelete = () => {
    if (!confirmDelete) return;
    if (confirmDelete.type === "single" && confirmDelete.id) {
      deleteMutation.mutate(confirmDelete.id, {
        onSuccess: () => {
          setConfirmDelete(null);
        },
        onError: (err: any) => {
          alert("Gagal menghapus: " + (err.message || "Terjadi kesalahan"));
          setConfirmDelete(null);
        },
      });
    } else if (confirmDelete.type === "bulk") {
      deleteBulkMutation.mutate(undefined, {
        onSuccess: (res: any) => {
          alert(`Berhasil menghapus ${res.data?.deleted || 0} akun massal!`);
          setConfirmDelete(null);
        },
        onError: (err: any) => {
          alert("Gagal menghapus massal: " + (err.message || "Terjadi kesalahan"));
          setConfirmDelete(null);
        }
      });
    } else if (confirmDelete.type === "generate") {
      generateBulkMutation.mutate(undefined, {
        onSuccess: (res: any) => {
          alert(`Berhasil membuat ${res.data?.totalGenerated || 0} akun baru dengan email berbasis nama!`);
          setConfirmDelete(null);
        },
        onError: (err: any) => {
          alert(err.message || "Gagal membuat akun massal");
          setConfirmDelete(null);
        }
      });
    }
  };

  const handleGenerateBulk = () => {
    setConfirmDelete({ type: "generate" });
  };

  const roleColors: Record<string, string> = {
    SuperAdmin: "bg-purple-100 text-purple-800 border-purple-200",
    SchoolAdmin: "bg-blue-100 text-blue-800 border-blue-200",
    Principal: "bg-fuchsia-100 text-fuchsia-800 border-fuchsia-200",
    Teacher: "bg-emerald-100 text-emerald-800 border-emerald-200",
    HomeroomTeacher: "bg-teal-100 text-teal-800 border-teal-200",
    BKTeacher: "bg-rose-100 text-rose-800 border-rose-200",
    Student: "bg-orange-100 text-orange-800 border-orange-200",
    Polsis: "bg-indigo-100 text-indigo-800 border-indigo-200",
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-4">
          <div className="bg-indigo-50 p-3 rounded-xl">
            <ShieldCheck className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Manajemen Pengguna & Akses</h1>
            <p className="text-sm text-gray-500 mt-1">
              Kelola akun sistem, atur hak akses (Role), dan reset kata sandi
            </p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            onClick={handleDeleteBulk}
            disabled={deleteBulkMutation.isPending}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" />
            {deleteBulkMutation.isPending ? "Menghapus..." : "Hapus Massal"}
          </button>
          <button
            onClick={handleGenerateBulk}
            disabled={generateBulkMutation.isPending}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50"
          >
            <KeyRound className="w-4 h-4" />
            {generateBulkMutation.isPending ? "Memproses..." : "Generate Massal"}
          </button>
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all duration-200 shadow-sm hover:shadow-md"
          >
            <Plus className="w-4 h-4" />
            Tambah Pengguna
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Cari berdasarkan email..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
          />
        </div>
        <div className="relative w-full sm:w-64">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setPage(1);
            }}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none appearance-none"
          >
            <option value="">Semua Peran (Role)</option>
            <option value="SuperAdmin">SuperAdmin</option>
            <option value="SchoolAdmin">School Admin</option>
            <option value="Principal">Kepala Sekolah</option>
            <option value="Teacher">Guru Mata Pelajaran</option>
            <option value="HomeroomTeacher">Wali Kelas</option>
            <option value="BKTeacher">Guru BK</option>
            <option value="Student">Siswa</option>
            <option value="Polsis">Polsis (Polisi Siswa)</option>
          </select>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : isError ? (
          <div className="p-6 text-center text-red-600">Gagal memuat data pengguna.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 font-medium">Email</th>
                  <th className="px-6 py-4 font-medium">Role</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {usersData?.data && usersData.data.length > 0 ? (
                  usersData.data.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 font-medium text-gray-900">{user.email}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${roleColors[user.role] || 'bg-gray-100 text-gray-800'}`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                          user.status === 'Aktif' 
                            ? 'bg-green-100 text-green-800 border border-green-200' 
                            : 'bg-red-100 text-red-800 border border-red-200'
                        }`}>
                          {user.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenPasswordModal(user)}
                            className="p-2 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                            title="Reset Kata Sandi"
                          >
                            <KeyRound className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenModal(user)}
                            className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="Edit Akses"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(user.id)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Hapus Permanen"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                      Data pengguna tidak ditemukan
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {usersData?.pagination && usersData.pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50/50">
            <span className="text-sm text-gray-500">
              Menampilkan halaman {usersData.pagination.currentPage} dari {usersData.pagination.totalPages}
            </span>
            <div className="flex gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
                className="px-3 py-1 text-sm border border-gray-200 rounded-lg disabled:opacity-50 hover:bg-white transition-colors"
              >
                Sebelumnya
              </button>
              <button
                disabled={page === usersData.pagination.totalPages}
                onClick={() => setPage(p => p + 1)}
                className="px-3 py-1 text-sm border border-gray-200 rounded-lg disabled:opacity-50 hover:bg-white transition-colors"
              >
                Selanjutnya
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Main CRUD Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">
                {editingId ? "Edit Akun Pengguna" : "Tambah Akun Pengguna"}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {errorMsg && (
                <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm border border-red-100">
                  {errorMsg}
                </div>
              )}

              {!editingId && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Peran (Role)</Label>
                    <Select
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value, teacherId: 0, name: "", email: "" })}
                      className="w-full"
                    >
                      <option value="Teacher">Guru Mata Pelajaran</option>
                      <option value="HomeroomTeacher">Wali Kelas</option>
                      <option value="BKTeacher">Guru BK</option>
                      <option value="Principal">Kepala Sekolah</option>
                      <option value="SchoolAdmin">Admin Sekolah</option>
                      <option value="SuperAdmin">Super Admin</option>
                      <option value="Student">Siswa</option>
                      <option value="Polsis">Siswa + POLSIS</option>
                    </Select>
                  </div>

                  {["Teacher", "HomeroomTeacher", "BKTeacher", "Principal"].includes(formData.role) && (
                    <div className="space-y-2">
                      <Label>Pilih Guru (Opsional)</Label>
                      <Select
                        value={formData.teacherId}
                        onChange={(e) => {
                          const tId = Number(e.target.value);
                          const teacher = teachers.find((t: any) => t.id === tId);
                          if (teacher) {
                            const generatedEmail = `${teacher.name.toLowerCase().replace(/\s+/g, "").replace(/[^a-z0-9]/g, "")}@guruhub.sch.id`;
                            setFormData({
                              ...formData,
                              teacherId: tId,
                              name: teacher.name,
                              email: generatedEmail
                            });
                          } else {
                            setFormData({ ...formData, teacherId: 0, name: "", email: "" });
                          }
                        }}
                        className="w-full"
                      >
                        <option value={0}>-- Pilih dari data Guru --</option>
                        {teachers.map((t: any) => (
                          <option key={t.id} value={t.id}>{t.name} (NIP: {t.nip || '-'})</option>
                        ))}
                      </Select>
                      <p className="text-xs text-gray-500">
                        Memilih guru akan otomatis mengisi Nama dan Email.
                      </p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>Nama Lengkap</Label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => {
                        const nama = e.target.value;
                        const generatedEmail = `${nama.toLowerCase().replace(/\s+/g, "").replace(/[^a-z0-9]/g, "")}@guruhub.sch.id`;
                        setFormData({ ...formData, name: nama, email: generatedEmail });
                      }}
                      placeholder="Contoh: Budi Santoso"
                      className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
                    />
                    <p className="text-xs text-gray-500">Nama akan digunakan untuk membuat email otomatis.</p>
                  </div>

                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="Contoh: guru@guruhub.sch.id"
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Kata Sandi Baru</Label>
                    <Input
                      type="password"
                      required
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="Masukkan kata sandi"
                      className="w-full"
                    />
                    <p className="text-xs text-gray-500">Minimal 6 karakter.</p>
                  </div>
                </div>
              )}

              {editingId && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Peran (Role)</label>
                    <select
                      required
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
                    >
                      <option value="SuperAdmin">SuperAdmin</option>
                      <option value="SchoolAdmin">School Admin</option>
                      <option value="Principal">Kepala Sekolah</option>
                      <option value="Teacher">Guru Mata Pelajaran</option>
                      <option value="HomeroomTeacher">Wali Kelas</option>
                      <option value="BKTeacher">Guru BK</option>
                      <option value="Student">Siswa</option>
                      <option value="Polsis">Siswa + POLSIS</option>
                    </select>
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full"
                >
                  <option value="Aktif">Aktif</option>
                  <option value="Nonaktif">Nonaktif</option>
                </Select>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-medium disabled:opacity-50"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Password Reset Modal */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-100 flex items-center gap-3">
              <div className="bg-amber-100 p-2 rounded-full">
                <KeyRound className="w-5 h-5 text-amber-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Reset Kata Sandi</h2>
            </div>

            <form onSubmit={handlePasswordSubmit} className="p-6 space-y-4">
              {errorMsg && (
                <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm border border-red-100">
                  {errorMsg}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kata Sandi Baru</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ newPassword: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:amber-500 focus:border-amber-500 transition-all outline-none"
                />
                <p className="text-xs text-gray-500 mt-1">Minimal 6 karakter.</p>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsPasswordModalOpen(false)}
                  className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={resetPasswordMutation.isPending}
                  className="flex-1 px-4 py-2 bg-amber-600 text-white rounded-xl hover:bg-amber-700 transition-colors font-medium disabled:opacity-50"
                >
                  {resetPasswordMutation.isPending ? "Menyimpan..." : "Reset Sandi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Action Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-100 flex items-center gap-3">
              <div className={`p-2 rounded-full ${confirmDelete.type === "generate" ? "bg-emerald-100" : "bg-red-100"}`}>
                {confirmDelete.type === "generate"
                  ? <KeyRound className="w-5 h-5 text-emerald-600" />
                  : <Trash2 className="w-5 h-5 text-red-600" />
                }
              </div>
              <h2 className="text-lg font-semibold text-gray-900">
                {confirmDelete.type === "generate"
                  ? "Generate Akun Massal"
                  : confirmDelete.type === "bulk"
                  ? "Hapus Akun Massal"
                  : "Hapus Akun"}
              </h2>
            </div>
            <div className="p-6">
              <p className="text-gray-600 text-sm">
                {confirmDelete.type === "generate"
                  ? "Sistem akan membuatkan akun untuk semua Guru dan Siswa yang belum memiliki akun. Email dibuat otomatis dari nama mereka. Password bawaan: GuruHub!2026."
                  : confirmDelete.type === "bulk"
                  ? "PERINGATAN! Ini akan menghapus semua akun Guru dan Siswa yang di-generate secara massal. Aksi ini tidak bisa dibatalkan."
                  : "Apakah Anda yakin ingin menghapus akun ini secara permanen?"}
              </p>
            </div>
            <div className="px-6 pb-6 flex gap-3">
              <button
                type="button"
                onClick={() => setConfirmDelete(null)}
                disabled={deleteMutation.isPending || deleteBulkMutation.isPending || generateBulkMutation.isPending}
                className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={executeDelete}
                disabled={deleteMutation.isPending || deleteBulkMutation.isPending || generateBulkMutation.isPending}
                className={`flex-1 px-4 py-2 text-white rounded-xl transition-colors font-medium disabled:opacity-50 ${
                  confirmDelete.type === "generate"
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : "bg-red-600 hover:bg-red-700"
                }`}
              >
                {generateBulkMutation.isPending
                  ? "Memproses..."
                  : (deleteMutation.isPending || deleteBulkMutation.isPending)
                  ? "Menghapus..."
                  : confirmDelete.type === "generate"
                  ? "Ya, Generate"
                  : "Ya, Hapus"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
