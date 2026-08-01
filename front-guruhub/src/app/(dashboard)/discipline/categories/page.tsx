"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { disciplineService } from "@/services/discipline";
import { disciplineKeys } from "@/queries/discipline.query";
import { BookOpen, Plus, Pencil, Trash2, X, Tag, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

const ADMIN_ROLES = ["SuperAdmin", "SchoolAdmin", "BKTeacher", "Counselor"];

type Tab = "categories" | "types";

const emptyCategory = { name: "", code: "", type: "VIOLATION" as "VIOLATION" | "REWARD", description: "" };
const emptyType = { name: "", code: "", categoryId: 0, defaultPoints: 5, description: "" };

export default function DisciplineCategoriesPage() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>("categories");

  // ── Category state ──
  const [catModal, setCatModal] = useState<"create" | "edit" | null>(null);
  const [catForm, setCatForm] = useState(emptyCategory);
  const [editCatId, setEditCatId] = useState<number | null>(null);
  const [deleteCatId, setDeleteCatId] = useState<number | null>(null);

  // ── Type state ──
  const [typeModal, setTypeModal] = useState<"create" | "edit" | null>(null);
  const [typeForm, setTypeForm] = useState(emptyType);
  const [editTypeId, setEditTypeId] = useState<number | null>(null);
  const [deleteTypeId, setDeleteTypeId] = useState<number | null>(null);

  // ── Queries ──
  const { data: catData, isLoading: catLoading } = useQuery({
    queryKey: disciplineKeys.categories(),
    queryFn: async () => {
      const res = await disciplineService.getCategories();
      return (res as any).data || res;
    },
  });
  const categories: any[] = Array.isArray(catData) ? catData : catData?.data || [];

  const { data: typeData, isLoading: typeLoading } = useQuery({
    queryKey: disciplineKeys.types(),
    queryFn: async () => {
      const res = await disciplineService.getTypes();
      return (res as any).data || res;
    },
  });
  const types: any[] = Array.isArray(typeData) ? typeData : typeData?.data || [];

  // ── Category mutations ──
  const createCatMut = useMutation({
    mutationFn: (data: any) => disciplineService.createCategory(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: disciplineKeys.categories() }); toast.success("Kategori berhasil ditambahkan."); setCatModal(null); },
    onError: (e: any) => toast.error(e?.message || "Gagal menambahkan kategori."),
  });
  const updateCatMut = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => disciplineService.updateCategory(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: disciplineKeys.categories() }); toast.success("Kategori berhasil diperbarui."); setCatModal(null); },
    onError: (e: any) => toast.error(e?.message || "Gagal memperbarui kategori."),
  });
  const deleteCatMut = useMutation({
    mutationFn: (id: number) => disciplineService.deleteCategory(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: disciplineKeys.categories() }); toast.success("Kategori berhasil dihapus."); setDeleteCatId(null); },
    onError: (e: any) => toast.error(e?.message || "Gagal menghapus kategori."),
  });

  // ── Type mutations ──
  const createTypeMut = useMutation({
    mutationFn: (data: any) => disciplineService.createType(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: disciplineKeys.types() }); toast.success("Aturan berhasil ditambahkan."); setTypeModal(null); },
    onError: (e: any) => toast.error(e?.message || "Gagal menambahkan aturan."),
  });
  const updateTypeMut = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => disciplineService.updateType(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: disciplineKeys.types() }); toast.success("Aturan berhasil diperbarui."); setTypeModal(null); },
    onError: (e: any) => toast.error(e?.message || "Gagal memperbarui aturan."),
  });
  const deleteTypeMut = useMutation({
    mutationFn: (id: number) => disciplineService.deleteType(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: disciplineKeys.types() }); toast.success("Aturan berhasil dihapus."); setDeleteTypeId(null); },
    onError: (e: any) => toast.error(e?.message || "Gagal menghapus aturan."),
  });

  // ── Helpers ──
  const openEditCat = (c: any) => {
    setCatForm({ name: c.name, code: c.code, type: c.type, description: c.description || "" });
    setEditCatId(c.id);
    setCatModal("edit");
  };
  const openCreateCat = () => { setCatForm(emptyCategory); setCatModal("create"); };

  const openEditType = (t: any) => {
    setTypeForm({ name: t.name, code: t.code, categoryId: t.categoryId, defaultPoints: t.defaultPoints, description: t.description || "" });
    setEditTypeId(t.id);
    setTypeModal("edit");
  };
  const openCreateType = () => { setTypeForm(emptyType); setTypeModal("create"); };

  const handleCatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (catModal === "edit" && editCatId) updateCatMut.mutate({ id: editCatId, data: catForm });
    else createCatMut.mutate(catForm);
  };
  const handleTypeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (typeModal === "edit" && editTypeId) updateTypeMut.mutate({ id: editTypeId, data: typeForm });
    else createTypeMut.mutate(typeForm);
  };

  const inputCls = "w-full px-3 py-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm text-gray-900 dark:text-white";
  const labelCls = "block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1";

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-indigo-600" />
            Master Aturan &amp; Kategori Disiplin
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Kelola kategori besar dan daftar spesifik aturan pelanggaran beserta poin demerit.
          </p>
        </div>
        {tab === "categories" ? (
          <button onClick={openCreateCat} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors">
            <Plus className="w-4 h-4" /> Tambah Kategori
          </button>
        ) : (
          <button onClick={openCreateType} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors">
            <Plus className="w-4 h-4" /> Tambah Aturan
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 dark:border-gray-700">
        {(["categories", "types"] as Tab[]).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${tab === t ? "border-indigo-600 text-indigo-600" : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"}`}>
            {t === "categories" ? "Kategori Utama" : "Daftar Aturan / Jenis Pelanggaran"}
          </button>
        ))}
      </div>

      {/* ── CATEGORIES TAB ── */}
      {tab === "categories" && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
          {catLoading ? (
            <div className="p-8 text-center text-sm text-gray-500">Memuat kategori...</div>
          ) : categories.length === 0 ? (
            <div className="p-8 text-center text-sm text-gray-500">Belum ada kategori. Klik "+ Tambah Kategori" untuk memulai.</div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800 text-xs font-semibold text-gray-500 uppercase border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-4 py-3">Kode</th>
                  <th className="px-4 py-3">Nama Kategori</th>
                  <th className="px-4 py-3">Tipe</th>
                  <th className="px-4 py-3">Deskripsi</th>
                  <th className="px-4 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {categories.map((c: any) => (
                  <tr key={c.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-indigo-600 dark:text-indigo-400">{c.code}</td>
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{c.name}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${c.type === "VIOLATION" ? "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300" : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"}`}>
                        {c.type === "VIOLATION" ? "Pelanggaran" : "Penghargaan"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs max-w-xs truncate">{c.description || "-"}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openEditCat(c)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-indigo-500 hover:bg-indigo-600 rounded-lg transition-colors">
                          <Pencil className="w-3 h-3" /> Edit
                        </button>
                        <button onClick={() => setDeleteCatId(c.id)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-rose-500 hover:bg-rose-600 rounded-lg transition-colors">
                          <Trash2 className="w-3 h-3" /> Hapus
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ── TYPES TAB ── */}
      {tab === "types" && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
          {typeLoading ? (
            <div className="p-8 text-center text-sm text-gray-500">Memuat aturan...</div>
          ) : types.length === 0 ? (
            <div className="p-8 text-center text-sm text-gray-500">Belum ada aturan. Klik "+ Tambah Aturan" untuk memulai.</div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800 text-xs font-semibold text-gray-500 uppercase border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-4 py-3">Nama Aturan</th>
                  <th className="px-4 py-3">Kategori</th>
                  <th className="px-4 py-3">Poin</th>
                  <th className="px-4 py-3">Deskripsi</th>
                  <th className="px-4 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {types.map((t: any) => {
                  const cat = categories.find((c: any) => c.id === t.categoryId);
                  const isViolation = cat?.type === "VIOLATION";
                  return (
                    <tr key={t.id} className={`transition-colors ${isViolation ? "bg-rose-50/40 hover:bg-rose-50 dark:bg-rose-950/10 dark:hover:bg-rose-950/20" : "bg-emerald-50/40 hover:bg-emerald-50 dark:bg-emerald-950/10 dark:hover:bg-emerald-950/20"}`}>
                      <td className="px-4 py-3">
                        <span className={`font-medium ${isViolation ? "text-rose-700 dark:text-rose-400" : "text-emerald-700 dark:text-emerald-400"}`}>
                          {t.name}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {cat ? (
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${isViolation ? "bg-rose-100 text-rose-700 dark:bg-rose-900 dark:text-rose-300" : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300"}`}>
                            <Tag className="w-3 h-3" />{cat.name}
                          </span>
                        ) : <span className="text-gray-400 text-xs">-</span>}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`font-bold ${isViolation ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                          +{t.defaultPoints}
                        </span>
                        <span className="text-xs text-gray-400 ml-1">poin</span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs max-w-xs truncate">{t.description || "-"}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => openEditType(t)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-indigo-500 hover:bg-indigo-600 rounded-lg transition-colors">
                            <Pencil className="w-3 h-3" /> Edit
                          </button>
                          <button onClick={() => setDeleteTypeId(t.id)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-rose-500 hover:bg-rose-600 rounded-lg transition-colors">
                            <Trash2 className="w-3 h-3" /> Hapus
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ── CATEGORY MODAL (Create/Edit) ── */}
      {catModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-slate-50 dark:bg-slate-800">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                {catModal === "edit" ? "Edit Kategori" : "Tambah Kategori Baru"}
              </h3>
              <button onClick={() => setCatModal(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleCatSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Kode *</label>
                  <input required disabled={catModal === "edit"} value={catForm.code} onChange={e => setCatForm(p => ({ ...p, code: e.target.value.toUpperCase() }))}
                    placeholder="KAT-PEL-01" className={inputCls + (catModal === "edit" ? " opacity-60 cursor-not-allowed" : "")} />
                </div>
                <div>
                  <label className={labelCls}>Tipe *</label>
                  <select required value={catForm.type} onChange={e => setCatForm(p => ({ ...p, type: e.target.value as any }))} className={inputCls}>
                    <option value="VIOLATION">Pelanggaran</option>
                    <option value="REWARD">Penghargaan</option>
                  </select>
                </div>
              </div>
              <div>
                <label className={labelCls}>Nama Kategori *</label>
                <input required value={catForm.name} onChange={e => setCatForm(p => ({ ...p, name: e.target.value }))} placeholder="Kedisiplinan & Kehadiran" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Deskripsi</label>
                <textarea rows={2} value={catForm.description} onChange={e => setCatForm(p => ({ ...p, description: e.target.value }))} placeholder="Keterangan singkat..." className={inputCls} />
              </div>
              <div className="flex justify-end gap-3 pt-2 border-t border-gray-200 dark:border-gray-700">
                <button type="button" onClick={() => setCatModal(null)} className="px-4 py-2 text-xs font-medium rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-700 dark:text-gray-300">Batal</button>
                <button type="submit" disabled={createCatMut.isPending || updateCatMut.isPending}
                  className="px-4 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg disabled:opacity-50">
                  {(createCatMut.isPending || updateCatMut.isPending) ? "Menyimpan..." : catModal === "edit" ? "Simpan Perubahan" : "Simpan Kategori"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── TYPE MODAL (Create/Edit) ── */}
      {typeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-slate-50 dark:bg-slate-800">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                {typeModal === "edit" ? "Edit Aturan" : "Tambah Aturan Baru"}
              </h3>
              <button onClick={() => setTypeModal(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleTypeSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Kode *</label>
                  <input required disabled={typeModal === "edit"} value={typeForm.code} onChange={e => setTypeForm(p => ({ ...p, code: e.target.value.toUpperCase() }))}
                    placeholder="V-TL-01" className={inputCls + (typeModal === "edit" ? " opacity-60 cursor-not-allowed" : "")} />
                </div>
                <div>
                  <label className={labelCls}>Poin Demerit *</label>
                  <input type="number" required min={0} value={typeForm.defaultPoints}
                    onChange={e => setTypeForm(p => ({ ...p, defaultPoints: Number(e.target.value) }))} className={inputCls} />
                </div>
              </div>
              <div>
                <label className={labelCls}>Nama Aturan *</label>
                <input required value={typeForm.name} onChange={e => setTypeForm(p => ({ ...p, name: e.target.value }))} placeholder="Terlambat Masuk Sekolah" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Kategori Induk *</label>
                <select required value={typeForm.categoryId} onChange={e => setTypeForm(p => ({ ...p, categoryId: Number(e.target.value) }))} className={inputCls}>
                  <option value={0} disabled>-- Pilih Kategori --</option>
                  {categories.map((c: any) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}>Deskripsi</label>
                <textarea rows={2} value={typeForm.description} onChange={e => setTypeForm(p => ({ ...p, description: e.target.value }))} placeholder="Keterangan singkat..." className={inputCls} />
              </div>
              <div className="flex justify-end gap-3 pt-2 border-t border-gray-200 dark:border-gray-700">
                <button type="button" onClick={() => setTypeModal(null)} className="px-4 py-2 text-xs font-medium rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-700 dark:text-gray-300">Batal</button>
                <button type="submit" disabled={createTypeMut.isPending || updateTypeMut.isPending}
                  className="px-4 py-2 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg disabled:opacity-50">
                  {(createTypeMut.isPending || updateTypeMut.isPending) ? "Menyimpan..." : typeModal === "edit" ? "Simpan Perubahan" : "Simpan Aturan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── DELETE CONFIRMATION (Category) ── */}
      {deleteCatId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-950 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 dark:text-white text-sm">Hapus Kategori?</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Tindakan ini tidak dapat dibatalkan.</p>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleteCatId(null)} className="px-4 py-2 text-xs font-medium rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-700 dark:text-gray-300">Batal</button>
              <button onClick={() => deleteCatMut.mutate(deleteCatId)} disabled={deleteCatMut.isPending}
                className="px-4 py-2 text-xs font-medium text-white bg-rose-600 hover:bg-rose-700 rounded-lg disabled:opacity-50">
                {deleteCatMut.isPending ? "Menghapus..." : "Ya, Hapus"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── DELETE CONFIRMATION (Type) ── */}
      {deleteTypeId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-950 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 dark:text-white text-sm">Hapus Aturan?</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Tindakan ini tidak dapat dibatalkan.</p>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleteTypeId(null)} className="px-4 py-2 text-xs font-medium rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-700 dark:text-gray-300">Batal</button>
              <button onClick={() => deleteTypeMut.mutate(deleteTypeId)} disabled={deleteTypeMut.isPending}
                className="px-4 py-2 text-xs font-medium text-white bg-rose-600 hover:bg-rose-700 rounded-lg disabled:opacity-50">
                {deleteTypeMut.isPending ? "Menghapus..." : "Ya, Hapus"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
