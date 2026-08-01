"use client";

import { useState, useEffect, useRef } from "react";
import {
  Building2,
  Upload,
  Image as ImageIcon,
  Save,
  CheckCircle2,
  AlertCircle,
  FileText,
  UserCheck,
  Globe,
  Phone,
  Mail,
  MapPin,
  Award,
  Sparkles,
  RefreshCw,
  Eye,
} from "lucide-react";
import { schoolsService, type SchoolSettings } from "@/services/schools";

export default function SchoolSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingKop, setUploadingKop] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [form, setForm] = useState<Partial<SchoolSettings>>({
    name: "",
    npsn: "",
    foundationName: "",
    regionalName: "",
    accreditation: "",
    address: "",
    phone: "",
    email: "",
    website: "",
    logoUrl: "",
    kopSuratUrl: "",
    principalName: "",
    principalNip: "",
  });

  const logoInputRef = useRef<HTMLInputElement>(null);
  const kopInputRef = useRef<HTMLInputElement>(null);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const data = await schoolsService.getCurrent();
      setForm(data);
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Gagal memuat profil sekolah." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setMessage(null);
      const updated = await schoolsService.updateCurrent(form);
      setForm(updated);
      setMessage({ type: "success", text: "Pengaturan profil sekolah dan kop surat berhasil disimpan!" });
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Gagal memperbarui profil sekolah." });
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploadingLogo(true);
      setMessage(null);
      const res = await schoolsService.uploadLogo(file);
      setForm((prev) => ({ ...prev, logoUrl: res.url }));
      setMessage({ type: "success", text: "Logo sekolah berhasil diunggah!" });
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Gagal mengunggah logo." });
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleKopUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploadingKop(true);
      setMessage(null);
      const res = await schoolsService.uploadKop(file);
      setForm((prev) => ({ ...prev, kopSuratUrl: res.url }));
      setMessage({ type: "success", text: "Kop surat berhasil diunggah!" });
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Gagal mengunggah kop surat." });
    } finally {
      setUploadingKop(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <RefreshCw className="h-8 w-8 text-indigo-600 animate-spin" />
        <p className="text-sm font-medium text-gray-500">Memuat profil & pengaturan sekolah...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-900 via-indigo-800 to-purple-900 p-6 md:p-8 text-white shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-xs font-semibold backdrop-blur-md border border-white/20 text-indigo-200">
              <Sparkles className="h-3.5 w-3.5" /> Brand Identity & Report Setup
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
              Pengaturan Profil & Kop Surat Sekolah
            </h1>
            <p className="text-sm text-indigo-100/80 max-w-2xl">
              Kelola identitas resmi sekolah, unggah Logo dan Header Kop Surat untuk diterapkan secara otomatis pada seluruh laporan PDF (Rapor, Surat SP, Absensi, Jurnal, dll).
            </p>
          </div>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 font-semibold text-sm text-white shadow-lg hover:shadow-indigo-500/30 transition-all disabled:opacity-50"
          >
            {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Simpan Perubahan
          </button>
        </div>
      </div>

      {/* Alert Message */}
      {message && (
        <div
          className={`p-4 rounded-xl border flex items-center gap-3 transition-all ${
            message.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800"
              : "bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-emerald-600 dark:text-emerald-400" />
          ) : (
            <AlertCircle className="h-5 w-5 flex-shrink-0 text-rose-600 dark:text-rose-400" />
          )}
          <p className="text-sm font-medium">{message.text}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 columns: Form Inputs */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card 1: Informasi Dasar & Institusi */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-3 border-b border-gray-100 dark:border-gray-800 pb-3">
              <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-gray-900 dark:text-white">Identitas Lembaga</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">Nama resmi sekolah dan lembaga naungan</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-1">
                  Nama Sekolah <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={form.name || ""}
                  onChange={handleChange}
                  required
                  placeholder="Contoh: SMP HANG TUAH 5 SIDOARJO"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm font-semibold text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-1">
                  Nama Yayasan / Pengurus
                </label>
                <input
                  type="text"
                  name="foundationName"
                  value={form.foundationName || ""}
                  onChange={handleChange}
                  placeholder="Contoh: YAYASAN HANG TUAH PENGURUS"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-1">
                  Wilayah / Cabang / Daerah
                </label>
                <input
                  type="text"
                  name="regionalName"
                  value={form.regionalName || ""}
                  onChange={handleChange}
                  placeholder="Contoh: DAERAH SURABAYA"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-1">NPSN</label>
                <input
                  type="text"
                  name="npsn"
                  value={form.npsn || ""}
                  onChange={handleChange}
                  placeholder="20500000"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm font-mono text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-1">
                  Akreditasi
                </label>
                <input
                  type="text"
                  name="accreditation"
                  value={form.accreditation || ""}
                  onChange={handleChange}
                  placeholder='Contoh: Terakreditasi " A "'
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Card 2: Kontak & Alamat */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-3 border-b border-gray-100 dark:border-gray-800 pb-3">
              <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                <MapPin className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-gray-900 dark:text-white">Alamat & Kontak Resmi</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">Dicetak pada bagian footer/header surat resmi</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-1">
                  Alamat Lengkap
                </label>
                <textarea
                  name="address"
                  rows={2}
                  value={form.address || ""}
                  onChange={handleChange}
                  placeholder="Perum TNI AL Blok B. 16 / 18, Sidoarjo 61721"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-1">
                  No. Telepon / Fax
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    name="phone"
                    value={form.phone || ""}
                    onChange={handleChange}
                    placeholder="(031) 8060725"
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-1">
                  Email Resmi
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <input
                    type="email"
                    name="email"
                    value={form.email || ""}
                    onChange={handleChange}
                    placeholder="sekolah@guruhub.id"
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-1">
                  Website Sekolah
                </label>
                <div className="relative">
                  <Globe className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    name="website"
                    value={form.website || ""}
                    onChange={handleChange}
                    placeholder="www.sekolah.sch.id"
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: Pimpinan Sekolah (Kepala Sekolah) */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-3 border-b border-gray-100 dark:border-gray-800 pb-3">
              <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                <UserCheck className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-gray-900 dark:text-white">Kepala Sekolah / Penanggung Jawab</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">Dicetak pada blok tanda tangan berkas & rapor</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-1">
                  Nama Kepala Sekolah
                </label>
                <input
                  type="text"
                  name="principalName"
                  value={form.principalName || ""}
                  onChange={handleChange}
                  placeholder="Drs. H. Ahmad Fauzi, M.Pd"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm font-medium text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-1">
                  NIP / NUPTK Kepala Sekolah
                </label>
                <input
                  type="text"
                  name="principalNip"
                  value={form.principalNip || ""}
                  onChange={handleChange}
                  placeholder="19750812 200003 1 002"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm font-mono text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right 1 column: Upload Assets & Dynamic Preview */}
        <div className="space-y-6">
          {/* Upload Logo Card */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
              <div className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">Logo Resmi Sekolah</h3>
              </div>
              <span className="text-[11px] font-semibold text-gray-400">PNG / JPG</span>
            </div>

            <div className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-xl bg-gray-50/50 dark:bg-gray-800/30 text-center relative hover:bg-indigo-50/30 transition-colors">
              {form.logoUrl ? (
                <div className="space-y-3">
                  <img
                    src={form.logoUrl}
                    alt="Logo Sekolah"
                    className="h-24 w-24 object-contain mx-auto rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-1 bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => logoInputRef.current?.click()}
                    disabled={uploadingLogo}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 text-xs font-semibold hover:bg-indigo-100 transition-colors"
                  >
                    {uploadingLogo ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                    Ganti Logo
                  </button>
                </div>
              ) : (
                <div className="space-y-2 py-4">
                  <div className="mx-auto h-12 w-12 rounded-full bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                    <Upload className="h-6 w-6" />
                  </div>
                  <div>
                    <button
                      type="button"
                      onClick={() => logoInputRef.current?.click()}
                      disabled={uploadingLogo}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-700 underline"
                    >
                      Unggah Logo Sekolah
                    </button>
                    <p className="text-[11px] text-gray-400 mt-1">Rekomendasi rasio 1:1 (min. 300x300px)</p>
                  </div>
                </div>
              )}
              <input
                ref={logoInputRef}
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="hidden"
              />
            </div>
          </div>

          {/* Upload Banner Kop Surat Card */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">Banner Kop Surat (Opsional)</h3>
              </div>
              <span className="text-[11px] font-semibold text-purple-500">Banner Dokumen</span>
            </div>

            <p className="text-xs text-gray-500 dark:text-gray-400">
              Jika diunggah, banner image ini akan menggantikan Kop Surat HTML standar di semua dokumen cetak.
            </p>

            <div className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-xl bg-gray-50/50 dark:bg-gray-800/30 text-center relative hover:bg-purple-50/30 transition-colors">
              {form.kopSuratUrl ? (
                <div className="space-y-3 w-full">
                  <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-1 bg-white overflow-hidden shadow-sm">
                    <img
                      src={form.kopSuratUrl}
                      alt="Banner Kop Surat"
                      className="max-h-24 w-full object-contain mx-auto"
                    />
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => kopInputRef.current?.click()}
                      disabled={uploadingKop}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400 text-xs font-semibold hover:bg-purple-100 transition-colors"
                    >
                      {uploadingKop ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                      Ganti Kop Surat
                    </button>
                    <button
                      type="button"
                      onClick={() => setForm((prev) => ({ ...prev, kopSuratUrl: "" }))}
                      className="px-3 py-1.5 rounded-lg bg-rose-50 text-rose-600 text-xs font-semibold hover:bg-rose-100"
                    >
                      Hapus Kop Banner
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2 py-4">
                  <div className="mx-auto h-12 w-12 rounded-full bg-purple-50 dark:bg-purple-950 flex items-center justify-center text-purple-600 dark:text-purple-400">
                    <FileText className="h-6 w-6" />
                  </div>
                  <div>
                    <button
                      type="button"
                      onClick={() => kopInputRef.current?.click()}
                      disabled={uploadingKop}
                      className="text-xs font-bold text-purple-600 hover:text-purple-700 underline"
                    >
                      Unggah Banner Kop Surat
                    </button>
                    <p className="text-[11px] text-gray-400 mt-1">Rekomendasi rasio lebar 10:1 (PNG/JPG)</p>
                  </div>
                </div>
              )}
              <input
                ref={kopInputRef}
                type="file"
                accept="image/*"
                onChange={handleKopUpload}
                className="hidden"
              />
            </div>
          </div>

          {/* Live Preview Card */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-gray-100 dark:border-gray-800 pb-3">
              <Eye className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">Live Preview Kop Surat Dokumen</h3>
            </div>

            <div className="p-4 bg-white text-gray-900 rounded-xl border border-gray-200 shadow-inner font-sans text-xs space-y-4">
              {form.kopSuratUrl ? (
                <div className="text-center pb-2 border-b-2 border-black">
                  <img src={form.kopSuratUrl} alt="Kop Surat" className="max-h-20 w-full object-contain mx-auto" />
                </div>
              ) : (
                <div className="flex items-center justify-between border-b-4 border-black pb-2 text-center gap-2">
                  <div className="w-12 h-12 flex-shrink-0 flex items-center justify-center border border-dashed border-gray-300 rounded bg-gray-50">
                    {form.logoUrl ? (
                      <img src={form.logoUrl} alt="Logo" className="max-h-10 max-w-10 object-contain" />
                    ) : (
                      <span className="text-[9px] text-gray-400">LOGO</span>
                    )}
                  </div>
                  <div className="flex-1 px-2">
                    {form.foundationName && (
                      <p className="text-[10px] font-bold uppercase tracking-tight">{form.foundationName}</p>
                    )}
                    {form.regionalName && (
                      <p className="text-[9px] font-semibold uppercase">{form.regionalName}</p>
                    )}
                    <h4 className="text-sm font-black uppercase tracking-wider">{form.name || "NAMA SEKOLAH"}</h4>
                    {form.accreditation && <p className="text-[9px] font-medium">{form.accreditation}</p>}
                    <p className="text-[9px] text-gray-600 mt-0.5">{form.address || "Alamat Sekolah"}</p>
                    {(form.phone || form.email || form.website) && (
                      <p className="text-[8px] text-blue-800 font-semibold">
                        {[form.phone && `Telp: ${form.phone}`, form.email && `Email: ${form.email}`, form.website && `Web: ${form.website}`]
                          .filter(Boolean)
                          .join(" | ")}
                      </p>
                    )}
                  </div>
                  <div className="w-12 h-12 flex-shrink-0 flex items-center justify-center border border-dashed border-gray-300 rounded bg-gray-50">
                    {form.logoUrl ? (
                      <img src={form.logoUrl} alt="Logo" className="max-h-10 max-w-10 object-contain" />
                    ) : (
                      <span className="text-[9px] text-gray-400">LOGO</span>
                    )}
                  </div>
                </div>
              )}

              {/* Sample Document TTD Preview */}
              <div className="pt-2 text-center space-y-1 text-[10px]">
                <p className="text-gray-400 italic font-mono">[ Isi Dokumen Cetak / Surat Peringatan / Rapor ]</p>
                <div className="pt-4 grid grid-cols-2 gap-4 text-center">
                  <div>
                    <p className="text-gray-500 font-medium">Wali Kelas</p>
                    <div className="h-10"></div>
                    <p className="font-bold underline">( Wali Kelas )</p>
                  </div>
                  <div>
                    <p className="text-gray-500 font-medium">Kepala Sekolah</p>
                    <div className="h-10"></div>
                    <p className="font-bold underline">{form.principalName || "( Kepala Sekolah )"}</p>
                    {form.principalNip && <p className="text-[9px] text-gray-500">NIP: {form.principalNip}</p>}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
