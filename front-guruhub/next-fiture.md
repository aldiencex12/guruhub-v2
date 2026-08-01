Viewed Sidebar.tsx:1-150

Secara fungsionalitas inti (manajemen data master, jadwal, absensi, jurnal, dan kenaikan kelas), GuruHub sudah memiliki fondasi yang sangat kuat dan siap untuk digunakan sehari-hari oleh tata usaha maupun guru.

Namun, agar GuruHub bisa menjadi platform manajemen sekolah yang benar-benar **lengkap (All-in-One)** dan memiliki nilai jual yang tinggi, berikut adalah beberapa fitur krusial yang menurut saya masih "kurang" atau bisa menjadi target kita berikutnya:

### 1. Fitur Kelulusan dan Mutasi Siswa (Graduation & Transfer)
Kita baru saja menyelesaikan fitur "Kenaikan Kelas". Namun, bagaimana jika siswa kelas 9 atau 12 lulus? Atau bagaimana jika ada siswa yang pindah sekolah (mutasi) di pertengahan semester? 
*   **Kekurangan saat ini:** Jika mereka hanya dibiarkan saja, data mereka akan terus menumpuk di daftar siswa aktif.
*   **Solusi:** Fitur "Kelulusan/Mutasi" khusus untuk mengubah status siswa menjadi `GRADUATED` atau `TRANSFERRED`, mencetak surat keterangan pindah/lulus, dan menyimpannya ke dalam arsip (Alumni) agar tidak muncul lagi di operasi akademik sehari-hari.

### 2. Modul Penilaian Terpadu & Cetak Rapor (Report Cards & Grading Engine)
Di menu *Sidebar*, saya melihat Anda sudah merencanakan menu "Kategori Nilai", "Kalkulasi Nilai", dan "Rapor". Ini adalah *"jantung"* dari sistem akademik.
*   **Kekurangan saat ini:** Biasanya proses penggabungan nilai (Tugas, UTS, UAS, Sikap) sangat kompleks dan bergantung pada kurikulum (misal: Kurikulum Merdeka memiliki format rapor khusus dan P5).
*   **Solusi:** Membangun *Grading Engine* (mesin kalkulasi nilai) yang secara otomatis menghitung nilai akhir, lalu menyediakan fitur **Cetak Rapor ke PDF** dengan format resmi (Kop Surat Sekolah, Tanda Tangan Kepala Sekolah, dll).

### 3. Portal Siswa & Orang Tua (Parent/Student Portal)
Sistem kita saat ini sangat berfokus pada Admin, Kepala Sekolah, dan Guru.
*   **Kekurangan saat ini:** Orang tua masih tidak bisa memantau perkembangan anak mereka secara *real-time*.
*   **Solusi:** Membuat antarmuka/portal terpisah (dengan *Role* "Siswa" atau "OrangTua"). Mereka bisa *login* untuk melihat Absensi hari ini, Nilai Ulangan, dan Tagihan Sekolah tanpa bisa mengubah data apapun.

### 4. Manajemen Ekstrakurikuler (Extracurriculars)
Sekolah pasti memiliki ekstrakurikuler (Pramuka, PMR, Paskibra, dll). 
*   **Solusi:** Modul untuk mendata siswa yang ikut ekskul beserta absensi dan nilai ekskul mereka, karena nilai ini wajib masuk ke dalam lembar Rapor di akhir semester.

### 5. Pengumuman Internal (Digital Noticeboard)
Saat Admin/Kepala Sekolah ingin mengumumkan sesuatu ("Besok libur nasional", atau "Jadwal rapat guru diubah ke jam 13:00").
*   **Solusi:** Fitur *Broadcast/Announcement* yang akan muncul di halaman *Dashboard* setiap guru saat mereka baru pertama kali login.

---

**Saran Langkah Selanjutnya:**
Jika Anda ingin melanjutkan pengembangan sekarang, saya sangat menyarankan kita mengerjakan **Nomor 1 (Kelulusan/Mutasi)** terlebih dahulu karena itu adalah kelanjutan langsung dari "Kenaikan Kelas" yang baru saja kita buat. Atau jika Anda ingin masuk ke fitur yang lebih kompleks, kita bisa mulai mendesain arsitektur untuk **Nomor 2 (Modul Cetak Rapor PDF)**.

Bagaimana menurut Anda? Bagian mana yang ingin kita kerjakan selanjutnya?