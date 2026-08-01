# 🏫 GuruHub v2 — Sistem Informasi Manajemen Sekolah, Rapor Sisipan & Kedisiplinan Siswa

GuruHub v2 adalah platform manajemen sekolah modern berbasis web yang dirancang khusus untuk mempermudah administrasi sekolah, penilaian tengah semester (**Rapor Sisipan**), pengelolaan poin pelanggaran kedisiplinan (**Demerit Points**), dan **Rapat Pleno Kenaikan Kelas** berbasis evaluasi 3 pilar.

---

## 🚀 Teknologi Utama (Tech Stack)

### **Frontend App**
- **Framework**: Next.js 16 (App Router) & React
- **Styling**: Tailwind CSS & Lucide Icons
- **State & Data Fetching**: TanStack Query (React Query)
- **Form & Validation**: React Hook Form & Zod
- **Notification**: Sonner Toast

### **Backend API**
- **Runtime**: Bun Runtime
- **Framework**: Elysia.js REST API
- **Database ORM**: Drizzle ORM
- **Database Engine**: MySQL 8.0 / MariaDB 10.5+
- **Process Manager**: PM2

---

## 📁 Struktur Repositori (Monorepo Ecosystem)

```
guruhub-v2/
├── front-guruhub/           # Aplikasi Dashboard Utama (Next.js - Port 3001)
├── front-guruhub-mobile/    # Aplikasi Mobile Web Client (Next.js - Port 3002)
├── guruhub-api/             # REST API Backend Service (Bun - Port 3000)
├── ecosystem.config.js      # Konfigurasi Manajer Proses PM2 & Alokasi RAM Server
├── .gitignore               # Konfigurasi Ignored Files
└── README.md                # Dokumentasi Utama
```

---

## ✨ Fitur-Fitur Unggulan

1. **Otentikasi & Role-Based Access Control (RBAC)**:
   - Pengaturan hak akses terstruktur untuk *Admin Sekolah*, *Guru BK / Konselor*, *Guru Mata Pelajaran*, *Wali Kelas*, dan *Kepala Sekolah*.
2. **Identitas Sekolah & Kop Surat**:
   - Pengaturan Logo, Nama Yayasan, Cabang Regional, Akreditasi, Alamat, serta TTD & NIP Kepala Sekolah yang otomatis muncul di seluruh cetakan dokumen resmi.
3. **Manajemen Master Data & Import Excel**:
   - Pengelolaan Tahun Ajaran, Data Guru, Data Siswa (NISN fleksibel 1–20 digit angka), Kelas, Mapel (termasuk kelompok Agama), Anggota Kelas, dan Jadwal. Fitur impor masal via Excel `.xlsx`.
4. **Modul Kehadiran & Rekap Absensi**:
   - Presensi harian siswa (Hadir, Sakit, Izin, Alpa) yang otomatis ter-sinkronisasi ke rekapitulasi semester.
5. **Modul Rapor Sisipan (Interim Assessment)**:
   - Input nilai per mapel dan kelas dengan isolasi state data, kalkulasi Rata-Rata Nilai siswa, dan cetak PDF Rapor Sisipan sesuai template standar sekolah.
6. **Modul Kedisiplinan & Pelanggaran**:
   - Pencatatan poin demerit pelanggaran, aturan ambang batas sanksi otomatis (*SP-1, SP-2, SP-3*), cetak Surat Peringatan, dan Dashboard Analitik Kedisiplinan untuk Guru BK.
7. **Modul Rapat Pleno Kenaikan Kelas (3-Pillar Evaluation)**:
   - Evaluasi otomatis berdasarkan 3 pilar (Poin Demerit, Alpa Kehadiran, dan Ketuntasan Akademik).
   - Rekomendasi otomatis sistem (`NAIK_KELAS` vs `PEMBINAAN_BASECAMP`).
   - Fitur *Override Keputusan* dilengkapi Catatan Alasan (*justification note*).
   - Cetak Berita Acara & Cetak Surat Pemanggilan Ortu (**Isolated Print Engine pas 1 Halaman dengan 3 Kolom TTD Sejajar**).
8. **Optimasi Performa Server Enterprise (Dell R360)**:
   - Teroptimasi untuk 40+ user guru aktif harian dengan *Database Connection Pool* (50 koneksi serentak), *Database Indexing* pada tabel berfrekuensi tinggi, dan batas alokasi memori PM2 hingga 2GB.

---

## 🛠️ Panduan Instalasi & Jalankan (Local Development)

### 1. Prasyarat
- **Node.js**: v18+ atau v20+
- **Bun**: v1.0+ (pilih salah satu / ikuti setup Bun)
- **MySQL / MariaDB**: Server berjalan di port `3306`

### 2. Jalankan Backend API (`guruhub-api`)
```bash
cd guruhub-api
bun install
# Jalankan migrasi database
bun run drizzle-kit push
# Jalankan development server
bun run dev
```

### 3. Jalankan Frontend (`front-guruhub`)
```bash
cd front-guruhub
npm install
npm run dev
```
Akses di browser: `http://localhost:3001`

---

## 🚀 Panduan Deploy Produksi (Server Dell R360 & PM2)

### 1. Pull & Build
```bash
# Backend API
cd guruhub-api
bun install

# Frontend Main App
cd ../front-guruhub
npm install
npm run build
```

### 2. Jalankan dengan PM2
```bash
cd ..
pm2 start ecosystem.config.js
pm2 save
```

### 3. Rekomendasi Nginx Reverse Proxy
Disarankan mengonfigurasi Nginx di port `80`/`443` di depan PM2:
```nginx
server {
    listen 80;
    server_name guruhub.sekolah.sch.id;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /api {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }
}
```

---

## 📄 Lisensi & Hak Cipta
© 2026 **GuruHub Ecosystem**. Seluruh Hak Cipta Dilindungi Undang-Undang. Dikembangkan untuk SMP Hang Tuah 5 Sidoarjo & Jaringan Sekolah.
