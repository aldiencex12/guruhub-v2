export interface SchoolKopData {
  foundationName?: string;
  regionalName?: string;
  name: string;
  npsn?: string;
  accreditation?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  logoUrl?: string;
  kopSuratUrl?: string;
  principalName?: string;
  principalNip?: string;
}

export const commonStyle = `
  @page {
    size: 210mm 330mm; /* F4 Paper Size */
    margin: 0mm;
  }
  * {
    box-sizing: border-box;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
  body {
    font-family: 'Times New Roman', Times, serif;
    color: #000000;
    margin: 0;
    padding: 0;
    font-size: 11pt;
    line-height: 1.3;
  }
  .header-container {
    display: flex;
    align-items: center;
    border-bottom: 4px solid #000;
    padding-bottom: 10px;
    margin-bottom: 2px;
    text-align: center;
  }
  .header-line-2 {
    border-bottom: 1px solid #000;
    margin-bottom: 20px;
  }
  .logo-placeholder {
    width: 80px;
    height: 80px;
    background: #f1f5f9;
    border: 1px dashed #cbd5e1;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #64748b;
    font-size: 10px;
    text-align: center;
  }
  .school-details {
    flex-grow: 1;
    text-align: center;
    padding: 0 10px;
  }
  .school-yayasan {
    font-size: 14px;
    font-weight: bold;
    text-transform: uppercase;
    color: #000;
    margin: 0;
  }
  .school-name {
    font-size: 22px;
    font-weight: 900;
    text-transform: uppercase;
    color: #000;
    margin: 5px 0;
    letter-spacing: 1px;
  }
  .school-info {
    font-size: 12px;
    color: #000;
    margin: 0;
  }
  .document-title {
    text-align: center;
    font-size: 16px;
    font-weight: 700;
    text-transform: uppercase;
    color: #0f172a;
    margin: 15px 0 25px 0;
    letter-spacing: 0.5px;
  }
  .grid-info {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 15px;
    margin-bottom: 25px;
  }
  .info-group {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .info-row {
    display: flex;
    font-size: 11px;
  }
  .info-label {
    width: 120px;
    color: #64748b;
    font-weight: 500;
  }
  .info-value {
    color: #0f172a;
    font-weight: 600;
  }
  .section-title {
    font-size: 13px;
    font-weight: 700;
    text-transform: uppercase;
    color: #1e3a8a;
    border-bottom: 2px solid #cbd5e1;
    padding-bottom: 5px;
    margin: 20px 0 10px 0;
  }
  table.data-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 20px;
  }
  table.data-table th {
    background-color: #f8fafc;
    border: 1px solid #cbd5e1;
    color: #334155;
    font-weight: 700;
    padding: 8px 10px;
    text-align: left;
    font-size: 11px;
    text-transform: uppercase;
  }
  table.data-table td {
    border: 1px solid #cbd5e1;
    padding: 8px 10px;
    color: #334155;
    font-size: 11px;
  }
  table.data-table tr:nth-child(even) {
    background-color: #f8fafc;
  }
  .notes-box {
    border: 1px solid #cbd5e1;
    background-color: #f8fafc;
    border-radius: 6px;
    padding: 10px 15px;
    font-size: 11px;
    color: #334155;
    margin-bottom: 20px;
    min-height: 50px;
  }
  .signatures-container {
    margin-top: 40px;
    display: flex;
    justify-content: space-between;
    font-size: 11px;
  }
  .signature-block {
    text-align: center;
    width: 200px;
  }
  .signature-space {
    height: 60px;
  }
  .page-number {
    font-size: 10px;
    color: #94a3b8;
    text-align: right;
    margin-top: 20px;
  }
`;

export function generateReportCardHtml(data: {
  school: SchoolKopData;
  student: { name: string; nis: string; nisn: string; className: string };
  academicYear: { year: string; semester: string };
  subjects: Array<{ name: string; finalScore: number; gradeLetter: string; knowledgeDescription: string }>;
  attendance: { sick: number; permission: number; absent: number };
  extracurriculars: Array<{ name: string; predicate: string; description: string }>;
  achievements: Array<{ title: string; level: string; description: string }>;
  p5: Array<{ theme: string; predicate: string; description: string }>;
  homeroomTeacherNotes: string;
  printDate: string;
}) {
  const subjectRows = data.subjects.length > 0 
    ? data.subjects.map((s, idx) => `
        <tr>
          <td style="text-align: center; width: 40px;">${idx + 1}</td>
          <td style="font-weight: 600;">${s.name}</td>
          <td style="text-align: center; font-weight: 700; width: 60px;">${s.finalScore}</td>
          <td style="text-align: center; font-weight: 700; width: 60px;">${s.gradeLetter}</td>
          <td>${s.knowledgeDescription || "-"}</td>
        </tr>
      `).join("")
    : `<tr><td colspan="5" style="text-align: center; color: #64748b;">Belum ada nilai mata pelajaran.</td></tr>`;

  const extracurricularRows = data.extracurriculars.length > 0
    ? data.extracurriculars.map((e, idx) => `
        <tr>
          <td style="text-align: center; width: 40px;">${idx + 1}</td>
          <td style="font-weight: 600; width: 200px;">${e.name}</td>
          <td style="text-align: center; font-weight: 700; width: 80px;">${e.predicate}</td>
          <td>${e.description || "-"}</td>
        </tr>
      `).join("")
    : `<tr><td colspan="4" style="text-align: center; color: #64748b;">Tidak ada kegiatan ekstrakurikuler.</td></tr>`;

  const achievementRows = data.achievements.length > 0
    ? data.achievements.map((a, idx) => `
        <tr>
          <td style="text-align: center; width: 40px;">${idx + 1}</td>
          <td style="font-weight: 600; width: 200px;">${a.title}</td>
          <td style="text-align: center; font-weight: 600; width: 100px;">${a.level}</td>
          <td>${a.description || "-"}</td>
        </tr>
      `).join("")
    : `<tr><td colspan="4" style="text-align: center; color: #64748b;">Tidak ada catatan prestasi.</td></tr>`;

  const p5Rows = data.p5.length > 0
    ? data.p5.map((p, idx) => `
        <tr>
          <td style="text-align: center; width: 40px;">${idx + 1}</td>
          <td style="font-weight: 600; width: 250px;">${p.theme}</td>
          <td style="text-align: center; font-weight: 700; width: 80px;">${p.predicate}</td>
          <td>${p.description || "-"}</td>
        </tr>
      `).join("")
    : `<tr><td colspan="4" style="text-align: center; color: #64748b;">Tidak ada projek P5.</td></tr>`;

  return `
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="UTF-8">
      <title>Laporan Hasil Belajar (Rapor)</title>
      <style>${commonStyle}</style>
    </head>
    <body>
      ${renderKopSuratHtml(data.school)}

      <div class="document-title">LAPORAN HASIL BELAJAR (RAPOR)</div>

      <div class="grid-info">
        <div class="info-group">
          <div class="info-row">
            <span class="info-label">Nama Siswa</span>
            <span class="info-value">: ${data.student.name}</span>
          </div>
          <div class="info-row">
            <span class="info-label">NIS / NISN</span>
            <span class="info-value">: ${data.student.nis} / ${data.student.nisn}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Kelas</span>
            <span class="info-value">: ${data.student.className}</span>
          </div>
        </div>
        <div class="info-group">
          <div class="info-row">
            <span class="info-label">Semester</span>
            <span class="info-value">: ${data.academicYear.semester}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Tahun Ajaran</span>
            <span class="info-value">: ${data.academicYear.year}</span>
          </div>
        </div>
      </div>

      <div class="section-title">A. Nilai Akademik</div>
      <table class="data-table">
        <thead>
          <tr>
            <th style="text-align: center; width: 40px;">No</th>
            <th>Mata Pelajaran</th>
            <th style="text-align: center; width: 60px;">Nilai</th>
            <th style="text-align: center; width: 60px;">Predikat</th>
            <th>Deskripsi Capaian Kompetensi</th>
          </tr>
        </thead>
        <tbody>
          ${subjectRows}
        </tbody>
      </table>

      <div class="section-title">B. Ekstrakurikuler</div>
      <table class="data-table">
        <thead>
          <tr>
            <th style="text-align: center; width: 40px;">No</th>
            <th>Kegiatan Ekstrakurikuler</th>
            <th style="text-align: center; width: 80px;">Predikat</th>
            <th>Keterangan</th>
          </tr>
        </thead>
        <tbody>
          ${extracurricularRows}
        </tbody>
      </table>

      <div class="section-title">C. Prestasi</div>
      <table class="data-table">
        <thead>
          <tr>
            <th style="text-align: center; width: 40px;">No</th>
            <th>Jenis Prestasi</th>
            <th style="text-align: center; width: 100px;">Tingkat</th>
            <th>Keterangan</th>
          </tr>
        </thead>
        <tbody>
          ${achievementRows}
        </tbody>
      </table>

      <div class="section-title">D. Projek Penguatan Profil Pelajar Pancasila (P5)</div>
      <table class="data-table">
        <thead>
          <tr>
            <th style="text-align: center; width: 40px;">No</th>
            <th>Tema Projek</th>
            <th style="text-align: center; width: 80px;">Predikat</th>
            <th>Keterangan</th>
          </tr>
        </thead>
        <tbody>
          ${p5Rows}
        </tbody>
      </table>

      <div class="section-title">E. Kehadiran</div>
      <table class="data-table" style="width: 300px; margin-bottom: 25px;">
        <thead>
          <tr>
            <th>Status Kehadiran</th>
            <th style="text-align: center; width: 100px;">Jumlah Hari</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Sakit (S)</td>
            <td style="text-align: center; font-weight: 600;">${data.attendance.sick}</td>
          </tr>
          <tr>
            <td>Izin (I)</td>
            <td style="text-align: center; font-weight: 600;">${data.attendance.permission}</td>
          </tr>
          <tr>
            <td>Tanpa Keterangan (A)</td>
            <td style="text-align: center; font-weight: 600;">${data.attendance.absent}</td>
          </tr>
        </tbody>
      </table>

      <div class="section-title">F. Catatan Wali Kelas</div>
      <div class="notes-box">
        ${data.homeroomTeacherNotes || "Tingkatkan terus belajarmu dan tetap jaga kedisiplinan."}
      </div>

      <div class="signatures-container">
        <div class="signature-block">
          <p>Orang Tua/Wali,</p>
          <div class="signature-space"></div>
          <p style="border-bottom: 1px solid #0f172a; display: inline-block; width: 150px; margin: 0;"></p>
        </div>
        <div class="signature-block">
          <p>Kota, ${data.printDate}<br>Wali Kelas,</p>
          <div class="signature-space"></div>
          <p style="border-bottom: 1px solid #0f172a; display: inline-block; width: 150px; margin: 0; font-weight: bold;">Wali Kelas</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

export function generateAttendanceReportHtml(data: {
  school: SchoolKopData;
  className: string;
  academicYear: { year: string; semester: string };
  students: Array<{ name: string; present: number; sick: number; permission: number; absent: number }>;
  printDate: string;
  orientation?: "portrait" | "landscape";
}) {
  const rows = data.students.length > 0
    ? data.students.map((s, idx) => `
        <tr>
          <td style="text-align: center; width: 40px;">${idx + 1}</td>
          <td style="font-weight: 600;">${s.name}</td>
          <td style="text-align: center; font-weight: bold; color: #16a34a;">${s.present}</td>
          <td style="text-align: center; font-weight: bold; color: #d97706;">${s.sick}</td>
          <td style="text-align: center; font-weight: bold; color: #2563eb;">${s.permission}</td>
          <td style="text-align: center; font-weight: bold; color: #dc2626;">${s.absent}</td>
        </tr>
      `).join("")
    : `<tr><td colspan="6" style="text-align: center; color: #64748b;">Belum ada data absensi kelas.</td></tr>`;

  const pageOrientationCss = data.orientation === "landscape"
    ? `@page { size: 330mm 210mm; margin: 10mm 15mm; }`
    : `@page { size: 210mm 330mm; margin: 10mm 15mm; }`;

  return `
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="UTF-8">
      <title>Rekap Absensi Kelas</title>
      <style>
        ${commonStyle}
        ${pageOrientationCss}
      </style>
    </head>
    <body>
      ${renderKopSuratHtml(data.school)}

      <div class="document-title">REKAP KEHADIRAN SISWA</div>

      <div class="grid-info">
        <div class="info-group">
          <div class="info-row">
            <span class="info-label">Kelas</span>
            <span class="info-value">: ${data.className}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Semester</span>
            <span class="info-value">: ${data.academicYear.semester}</span>
          </div>
        </div>
        <div class="info-group">
          <div class="info-row">
            <span class="info-label">Tahun Ajaran</span>
            <span class="info-value">: ${data.academicYear.year}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Tanggal Cetak</span>
            <span class="info-value">: ${data.printDate}</span>
          </div>
        </div>
      </div>

      <table class="data-table">
        <thead>
          <tr>
            <th style="text-align: center; width: 40px;">No</th>
            <th>Nama Siswa</th>
            <th style="text-align: center; width: 80px;">Hadir (H)</th>
            <th style="text-align: center; width: 80px;">Sakit (S)</th>
            <th style="text-align: center; width: 80px;">Izin (I)</th>
            <th style="text-align: center; width: 80px;">Alfa (A)</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    </body>
    </html>
  `;
}

export function generateTeachingJournalHtml(data: {
  school: SchoolKopData;
  teacher: { name: string; nip: string };
  journals: Array<{ date: string; topic: string; objectives: string; method: string; reflection: string }>;
  printDate: string;
  orientation?: "portrait" | "landscape";
}) {
  const rows = data.journals.length > 0
    ? data.journals.map((j, idx) => `
        <tr>
          <td style="text-align: center; width: 40px;">${idx + 1}</td>
          <td style="width: 80px;">${j.date}</td>
          <td style="font-weight: 600; width: 120px;">${j.topic}</td>
          <td>${j.objectives}</td>
          <td style="width: 100px;">${j.method}</td>
          <td>${j.reflection || "-"}</td>
        </tr>
      `).join("")
    : `<tr><td colspan="6" style="text-align: center; color: #64748b;">Belum ada jurnal mengajar.</td></tr>`;

  const pageOrientationCss = data.orientation === "landscape"
    ? `@page { size: 330mm 210mm; margin: 0mm; }`
    : `@page { size: 210mm 330mm; margin: 0mm; }`;

  return `
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="UTF-8">
      <title>Jurnal Mengajar Guru</title>
      <style>
        ${commonStyle}
        ${pageOrientationCss}
      </style>
    </head>
    <body>
      ${renderKopSuratHtml(data.school)}

      <div class="document-title">JURNAL MENGAJAR GURU</div>

      <div class="grid-info" style="margin-bottom: 15px;">
        <div class="info-group">
          <div class="info-row">
            <span class="info-label">Nama Guru</span>
            <span class="info-value">: ${data.teacher.name}</span>
          </div>
          <div class="info-row">
            <span class="info-label">NIP</span>
            <span class="info-value">: ${data.teacher.nip || "-"}</span>
          </div>
        </div>
        <div class="info-group">
          <div class="info-row">
            <span class="info-label">Tanggal Cetak</span>
            <span class="info-value">: ${data.printDate}</span>
          </div>
        </div>
      </div>

      <table class="data-table">
        <thead>
          <tr>
            <th style="text-align: center; width: 40px;">No</th>
            <th>Tanggal</th>
            <th>Topik</th>
            <th>Tujuan Pembelajaran</th>
            <th>Metode</th>
            <th>Refleksi</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    </body>
    </html>
  `;
}

export function generateAssessmentReportHtml(data: {
  school: SchoolKopData;
  assessment: { title: string; type: string; date: string; className: string; subjectName: string; teacherName: string };
  stats: { average: number; max: number; min: number };
  scores: Array<{ studentName: string; score: number; notes: string }>;
  printDate: string;
}) {
  const rows = data.scores.length > 0
    ? data.scores.map((s, idx) => `
        <tr>
          <td style="text-align: center; width: 40px;">${idx + 1}</td>
          <td style="font-weight: 600;">${s.studentName}</td>
          <td style="text-align: center; font-weight: 700; width: 100px;">${s.score}</td>
          <td>${s.notes || "-"}</td>
        </tr>
      `).join("")
    : `<tr><td colspan="4" style="text-align: center; color: #64748b;">Belum ada nilai siswa untuk asesmen ini.</td></tr>`;

  return `
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="UTF-8">
      <title>Laporan Asesmen</title>
      <style>${commonStyle}</style>
    </head>
    <body>
      ${renderKopSuratHtml(data.school)}

      <div class="document-title">LAPORAN HASIL ASESMEN</div>

      <div class="grid-info" style="margin-bottom: 15px;">
        <div class="info-group">
          <div class="info-row">
            <span class="info-label">Judul Asesmen</span>
            <span class="info-value">: ${data.assessment.title}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Jenis / Mapel</span>
            <span class="info-value">: ${data.assessment.type} / ${data.assessment.subjectName}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Kelas</span>
            <span class="info-value">: ${data.assessment.className}</span>
          </div>
        </div>
        <div class="info-group">
          <div class="info-row">
            <span class="info-label">Guru Pengampu</span>
            <span class="info-value">: ${data.assessment.teacherName}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Tanggal Pelaksanaan</span>
            <span class="info-value">: ${data.assessment.date}</span>
          </div>
        </div>
      </div>

      <div class="section-title">Ringkasan Statistik Kelas</div>
      <table class="data-table" style="width: 400px; margin-bottom: 20px;">
        <thead>
          <tr>
            <th style="text-align: center;">Rata-Rata Nilai</th>
            <th style="text-align: center;">Nilai Tertinggi</th>
            <th style="text-align: center;">Nilai Terendah</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="text-align: center; font-size: 14px; font-weight: 800; color: #1e3a8a;">${data.stats.average}</td>
            <td style="text-align: center; font-size: 14px; font-weight: 800; color: #16a34a;">${data.stats.max}</td>
            <td style="text-align: center; font-size: 14px; font-weight: 800; color: #dc2626;">${data.stats.min}</td>
          </tr>
        </tbody>
      </table>

      <div class="section-title">Daftar Nilai Siswa</div>
      <table class="data-table">
        <thead>
          <tr>
            <th style="text-align: center; width: 40px;">No</th>
            <th>Nama Siswa</th>
            <th style="text-align: center; width: 100px;">Nilai</th>
            <th>Catatan</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    </body>
    </html>
  `;
}

export function generateStudentListHtml(data: {
  school: SchoolKopData;
  className: string;
  academicYear: { year: string; semester: string };
  students: Array<{ name: string; nis: string; nisn: string; gender: string }>;
  printDate: string;
}) {
  const rows = data.students.length > 0
    ? data.students.map((s, idx) => `
        <tr>
          <td style="text-align: center; width: 40px;">${idx + 1}</td>
          <td style="font-weight: 600;">${s.name}</td>
          <td style="text-align: center; width: 120px;">${s.nis}</td>
          <td style="text-align: center; width: 120px;">${s.nisn}</td>
          <td style="text-align: center; width: 80px;">${s.gender === "L" ? "Laki-laki" : "Perempuan"}</td>
        </tr>
      `).join("")
    : `<tr><td colspan="5" style="text-align: center; color: #64748b;">Belum ada siswa aktif di kelas ini.</td></tr>`;

  return `
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="UTF-8">
      <title>Daftar Siswa</title>
      <style>${commonStyle}</style>
    </head>
    <body>
      ${renderKopSuratHtml(data.school)}

      <div class="document-title">DAFTAR SISWA KELAS</div>

      <div class="grid-info">
        <div class="info-group">
          <div class="info-row">
            <span class="info-label">Kelas</span>
            <span class="info-value">: ${data.className}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Semester / TA</span>
            <span class="info-value">: ${data.academicYear.semester} / ${data.academicYear.year}</span>
          </div>
        </div>
        <div class="info-group">
          <div class="info-row">
            <span class="info-label">Tanggal Cetak</span>
            <span class="info-value">: ${data.printDate}</span>
          </div>
        </div>
      </div>

      <table class="data-table">
        <thead>
          <tr>
            <th style="text-align: center; width: 40px;">No</th>
            <th>Nama Lengkap</th>
            <th style="text-align: center; width: 120px;">NIS</th>
            <th style="text-align: center; width: 120px;">NISN</th>
            <th style="text-align: center; width: 80px;">Jenis Kelamin</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    </body>
    </html>
  `;
}

export function generateTeacherListHtml(data: {
  school: SchoolKopData;
  teachers: Array<{ name: string; nip: string; gender: string; isHomeroom: string }>;
  printDate: string;
}) {
  const rows = data.teachers.length > 0
    ? data.teachers.map((t, idx) => `
        <tr>
          <td style="text-align: center; width: 40px;">${idx + 1}</td>
          <td style="font-weight: 600;">${t.name}</td>
          <td style="text-align: center; width: 150px;">${t.nip || "-"}</td>
          <td style="text-align: center; width: 100px;">${t.gender === "L" ? "Laki-laki" : "Perempuan"}</td>
          <td style="text-align: center; width: 120px;">${t.isHomeroom}</td>
        </tr>
      `).join("")
    : `<tr><td colspan="5" style="text-align: center; color: #64748b;">Belum ada guru terdaftar.</td></tr>`;

  return `
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="UTF-8">
      <title>Daftar Guru</title>
      <style>${commonStyle}</style>
    </head>
    <body>
      ${renderKopSuratHtml(data.school)}

      <div class="document-title">DAFTAR TENAGA PENDIDIK (GURU)</div>

      <div class="grid-info">
        <div class="info-group">
          <div class="info-row">
            <span class="info-label">Tanggal Cetak</span>
            <span class="info-value">: ${data.printDate}</span>
          </div>
        </div>
      </div>

      <table class="data-table">
        <thead>
          <tr>
            <th style="text-align: center; width: 40px;">No</th>
            <th>Nama Lengkap</th>
            <th style="text-align: center; width: 150px;">NIP</th>
            <th style="text-align: center; width: 100px;">Jenis Kelamin</th>
            <th style="text-align: center; width: 120px;">Wali Kelas</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    </body>
    </html>
  `;
}

export function generateSanctionReportHtml(data: {
  school: SchoolKopData;
  student: { name: string; nisn: string; className: string; studentId: number };
  sanction: { id: number; sanctionType: string; cumulativePoints: number; issuedDate: string; notes?: string };
  incidents: Array<{ id: number; incidentDate: string | Date; location: string | null; status: string; demeritPoints: number; notes: string | null; typeName: string; typeDescription: string | null }>;
  semesterPointsSum: number;
  semesterName: string;
  academicYearName: string;
  docType?: string;
  printDate: string;
}) {
  const incidentsRows = data.incidents.length > 0
    ? data.incidents.map((inc, idx) => {
        const dateStr = inc.incidentDate ? new Date(inc.incidentDate).toLocaleDateString("id-ID") : "-";
        const typeName = inc.typeName || "Pelanggaran Tata Tertib";
        const descHtml = inc.typeDescription ? `<span style="display: block; font-size: 10px; font-weight: normal; color: #000000; margin-top: 2px;">${inc.typeDescription}</span>` : "";
        return `
          <tr>
            <td style="border-bottom: 1px solid #e2e8f0; padding: 6px 8px; text-align: center; font-weight: bold;">${idx + 1}</td>
            <td style="border-bottom: 1px solid #e2e8f0; padding: 6px 8px; color: #000000; font-family: 'Times New Roman', Times, serif;">${dateStr}</td>
            <td style="border-bottom: 1px solid #e2e8f0; padding: 6px 8px; font-weight: bold; color: #000000;">${typeName}${descHtml}</td>
            <td style="border-bottom: 1px solid #e2e8f0; padding: 6px 8px; color: #000000;">${inc.location || "Lingkungan Sekolah"}</td>
            <td style="border-bottom: 1px solid #e2e8f0; padding: 6px 8px; text-align: center; font-weight: bold; color: #000000;">+${inc.demeritPoints || 5} Poin</td>
            <td style="border-bottom: 1px solid #e2e8f0; padding: 6px 8px; font-weight: 500; color: #000000;">${inc.status || "VERIFIED"}</td>
          </tr>
        `;
      }).join("")
    : `<tr><td colspan="6" style="border-bottom: 1px solid #e2e8f0; padding: 8px; text-align: center; font-style: italic; color: #000000;">Tidak ada catatan insiden pelanggaran untuk semester ${data.semesterName}.</td></tr>`;

  const sanctionTypeName = data.sanction.sanctionType ? data.sanction.sanctionType.replace(/_/g, " ") : "PEMBINAAN BK";
  const schoolCity = data.school.address ? data.school.address.split(",").pop()?.trim().split(" ")[0] || "Sidoarjo" : "Sidoarjo";
  const documentTitle = data.docType || "SURAT PERINGATAN (SP)";

  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>${documentTitle} - ${data.student.name}</title>
  <style>
    @page {
      size: 210mm 330mm; /* F4 Paper Size */
      margin: 0mm;
    }
    * { box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    body { font-family: 'Times New Roman', Times, serif; color: #000000; margin: 0; padding: 0; font-size: 13px; line-height: 1.5; background: #ffffff; }
  </style>
</head>
<body style="margin: 0; padding: 0; background: #ffffff;">
  <div style="width: 210mm; min-height: 330mm; padding: 12mm 15mm 15mm 15mm; margin: 0 auto; box-sizing: border-box; background: #ffffff;">
    
    ${renderKopSuratHtml(data.school)}


    <div style="text-align: center; margin-bottom: 20px;">
      <h2 style="font-size: 14pt; font-weight: 800; text-transform: uppercase; color: #000000; margin: 0; letter-spacing: 1px; text-decoration: none;">
        ${documentTitle}
      </h2>
      <p style="font-size: 11pt; font-weight: bold; color: #000000; margin: 4px 0 0 0; letter-spacing: normal;">
        Nomor: SP/DISC/${new Date().getFullYear()}/${String(data.sanction.id).padStart(4, "0")}
      </p>
    </div>

    <div style="margin-bottom: 20px; padding: 8px 0; border-top: 1px solid #000000; border-bottom: 1px solid #000000;">
      <table style="width: 100%; font-size: 12px; border-collapse: collapse; font-family: 'Times New Roman', Times, serif;">
        <tbody>
          <tr>
            <td style="padding: 4px; font-weight: bold; color: #000000; width: 140px;">Nama Siswa</td>
            <td style="padding: 4px; font-weight: bold; color: #000000;">: ${data.student.name || `Siswa #${data.student.studentId}`}</td>
            <td style="padding: 4px; font-weight: bold; color: #000000; width: 140px;">Semester</td>
            <td style="padding: 4px; font-weight: bold; color: #000000;">: ${data.semesterName} (${data.academicYearName})</td>
          </tr>
          <tr>
            <td style="padding: 4px; font-weight: bold; color: #000000;">NISN / NIS</td>
            <td style="padding: 4px; font-weight: normal; color: #000000;">: ${data.student.nisn || "-"}</td>
            <td style="padding: 4px; font-weight: bold; color: #000000;">Tingkat Sanksi</td>
            <td style="padding: 4px; font-weight: bold; color: #b91c1c;">: ${sanctionTypeName}</td>
          </tr>
          <tr>
            <td style="padding: 4px; font-weight: bold; color: #000000;">Kelas</td>
            <td style="padding: 4px; font-weight: normal; color: #000000;">: ${data.student.className}</td>
            <td style="padding: 4px; font-weight: bold; color: #000000;">Tanggal Diterbitkan</td>
            <td style="padding: 4px; font-weight: normal; color: #000000;">: ${new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div style="margin-bottom: 20px;">
      <h4 style="font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; color: #000000; padding-bottom: 4px; border-bottom: 1px solid #000000;">
        Rincian Catatan Pelanggaran Kedisiplinan Siswa (${data.semesterName})
      </h4>
      <table style="width: 100%; text-align: left; font-size: 11px; border-collapse: collapse; font-family: 'Times New Roman', Times, serif;">
        <thead style="border-bottom: 1px solid #000000; font-weight: bold; text-transform: uppercase; color: #000000;">
          <tr>
            <th style="padding: 6px 8px; text-align: center; width: 32px;">No</th>
            <th style="padding: 6px 8px; width: 110px;">Tanggal</th>
            <th style="padding: 6px 8px;">Pelanggaran / Catatan Aturan</th>
            <th style="padding: 6px 8px; width: 120px;">Lokasi</th>
            <th style="padding: 6px 8px; text-align: center; width: 80px;">Demerit</th>
            <th style="padding: 6px 8px; width: 80px;">Status</th>
          </tr>
        </thead>
        <tbody>
          ${incidentsRows}
        </tbody>
        <tfoot style="border-top: 1px solid #000000; font-weight: bold;">
          <tr>
            <td colspan="4" style="padding: 8px; text-align: right;">Total Poin Demerit Semester Ini:</td>
            <td style="padding: 8px; text-align: center; color: #000000; font-size: 12px;">${data.semesterPointsSum} Poin</td>
            <td style="padding: 8px;"></td>
          </tr>
        </tfoot>
      </table>
    </div>

    <div style="padding: 10px 14px; margin-bottom: 24px; font-family: 'Times New Roman', Times, serif;">
      <div style="display: flex; align-items: center; justify-content: space-between; font-weight: bold; color: #000000; border-bottom: 1px solid #000000; padding-bottom: 4px; margin-bottom: 4px;">
        <span>TOTAL AKUMULASI POIN KEDISIPLINAN KESELURUHAN:</span>
        <span style="font-size: 14px; color: #000000; font-weight: bold;">${data.sanction.cumulativePoints || 0} POIN</span>
      </div>
      <p style="font-size: 11px; color: #000000; line-height: 1.5; margin: 0;">
        <strong>Catatan Pembinaan Tim BK:</strong> Siswa yang bersangkutan telah menembus batas ambang poin 
        sanksi (<strong>${sanctionTypeName}</strong>). Diharapkan Orang Tua/Wali Siswa 
        dapat bekerja sama mendampingi pembinaan kedisiplinan siswa di rumah serta menghadiri sesi konseling di sekolah.
      </p>
    </div>

    <table style="width: 100%; text-align: center; font-size: 12px; color: #000000; font-family: 'Times New Roman', Times, serif; margin-top: 32px; border-collapse: collapse;">
      <tbody>
        <tr>
          <td style="width: 33.33%; vertical-align: top; padding: 0 8px;">
            <p style="font-weight: bold; color: #000000; margin: 0;">Mengetahui,</p>
            <p style="font-weight: bold; color: #000000; margin: 0;">Orang Tua / Wali Siswa,</p>
            <div style="height: 64px;"></div>
            <p style="font-weight: bold; text-decoration: underline; color: #000000; margin: 0;">( .................................................... )</p>
            <p style="font-size: 10px; color: #000000; margin: 2px 0 0 0;">Nama Terang & Tanda Tangan</p>
          </td>

          <td style="width: 33.33%; vertical-align: top; padding: 0 8px;">
            <p style="font-weight: bold; color: #000000; margin: 0;">Mengetahui,</p>
            <p style="font-weight: bold; color: #000000; margin: 0;">Guru BK / Pembina Disiplin,</p>
            <div style="height: 64px;"></div>
            <p style="font-weight: bold; text-decoration: underline; color: #000000; margin: 0;">( .................................................... )</p>
            <p style="font-size: 10px; color: #000000; margin: 2px 0 0 0;">NIP / NUPTK</p>
          </td>

          <td style="width: 33.33%; vertical-align: top; padding: 0 8px;">
            <p style="font-weight: bold; color: #000000; margin: 0;">
              ${schoolCity}, ${new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
            </p>
            <p style="font-weight: bold; color: #000000; margin: 0;">Kepala Sekolah,</p>
            <div style="height: 64px;"></div>
            <p style="font-weight: bold; text-decoration: underline; color: #000000; margin: 0;">${data.school.principalName || "HERWINDA ROSITA, SE"}</p>
            ${data.school.principalNip ? `<p style="font-size: 10px; color: #000000; margin: 2px 0 0 0;">NIP. ${data.school.principalNip}</p>` : ""}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</body>
</html>`;
}


export function renderKopSuratHtml(school: SchoolKopData): string {
  const logoUrl = school.logoUrl || school.kopSuratUrl;
  const logoHtml = logoUrl ? `<img src="${logoUrl}" style="position: absolute; left: 0; top: 50%; transform: translateY(-50%); width: 70px; height: 70px; object-fit: contain;" />` : '';

  const foundation = school.foundationName || "YAYASAN HANG TUAH";
  const regional = school.regionalName || "PENGURUS CABANG SURABAYA";
  const schoolName = school.name || "SMP HANG TUAH 5 SIDOARJO";
  const accreditation = school.accreditation ? `Terakreditasi “ ${school.accreditation} “` : 'Terakreditasi “ A “';
  const address = school.address || "PERUM TNI AL Blok B. 16 / 18 TELP. (031) 8060725, SIDOARJO 61721";
  const email = school.email ? `Email : ${school.email}` : "Email : smpht5sda@gmail.com";
  const website = school.website ? `website : ${school.website}` : "website : www.smphangtuah5sidoarjo.sch.id";

  return `
    <div style="position: relative; width: 100%; text-align: center; margin-bottom: 8px;">
      ${logoHtml}
      <div style="padding: 0 75px; display: flex; flex-direction: column; gap: 2px;">
        <div style="font-family: Arial, sans-serif; font-weight: bold; font-size: 11pt; text-transform: uppercase; color: #000000; letter-spacing: 0.5px; line-height: 1; margin: 0; padding: 0;">
          ${foundation}
        </div>
        <div style="font-family: Arial, sans-serif; font-weight: bold; font-size: 11pt; text-transform: uppercase; color: #000000; line-height: 1; margin: 0; padding: 0;">
          ${regional}
        </div>
        <div style="font-family: 'Arial Black', Arial, sans-serif; font-weight: 900; font-size: 15pt; text-transform: uppercase; color: #000000; letter-spacing: 1.5px; line-height: 1; margin: 0; padding: 0;">
          ${schoolName}
        </div>
        <div style="font-family: Arial, sans-serif; font-weight: bold; font-size: 10.5pt; color: #000000; line-height: 1; margin: 0; padding: 0;">
          ${accreditation}
        </div>
        <div style="font-family: Arial, sans-serif; font-weight: bold; font-size: 8.5pt; color: #000000; line-height: 1; margin: 0; padding: 0;">
          ${address}
        </div>
        <div style="font-family: Arial, sans-serif; font-weight: bold; font-size: 8.5pt; color: #002060; line-height: 1; margin: 0; padding: 0;">
          ${email}, ${website}
        </div>
      </div>
    </div>
    <div style="border-top: 3px solid #000000; margin-bottom: 14px; clear: both;"></div>
  `;
}


export function generateInterimReportCardHtml(data: {
  school: SchoolKopData;
  student: { name: string; nisn: string; className: string; religion: string; studentNo?: string | number };
  academicYear: { year: string; semester: string };
  subjects: Array<{ name: string; tugas1: number | null; tugas2: number | null; sts: number | null; finalScore: number | null; gradeLetter: string; notes: string }>;
  attendance: { sick: number; permission: number; absent: number };
  homeroomTeacherNotes: string;
  homeroomTeacherName?: string;
  printDate: string;
}) {
  const schoolCity = data.school.address ? data.school.address.split(",").pop()?.trim().split(" ")[0] || "Sidoarjo" : "Sidoarjo";

  const subjectsRows = data.subjects.length > 0
    ? data.subjects.map((sub, idx) => {
        const valT1 = sub.tugas1 !== null && sub.tugas1 !== undefined ? sub.tugas1 : "-";
        const valT2 = sub.tugas2 !== null && sub.tugas2 !== undefined ? sub.tugas2 : "-";
        const valSTS = sub.sts !== null && sub.sts !== undefined ? sub.sts : "-";
        return `
          <tr>
            <td style="border: 1px solid #000000; padding: 4px 2px; text-align: center;">${idx + 1}</td>
            <td style="border: 1px solid #000000; padding: 4px 6px;">${sub.name}</td>
            <td style="border: 1px solid #000000; padding: 4px 2px; text-align: center;">${valT1}</td>
            <td style="border: 1px solid #000000; padding: 4px 2px; text-align: center;">${valT2}</td>
            <td style="border: 1px solid #000000; padding: 4px 2px; text-align: center;">${valSTS}</td>
            <td style="border: 1px solid #000000; padding: 4px 6px; font-size: 9pt; line-height: 1.25;">${sub.notes || ""}</td>
          </tr>
        `;
      }).join("")
    : `<tr><td colspan="6" style="border: 1px solid #000000; padding: 8px; text-align: center;">Belum ada data nilai sisipan</td></tr>`;

  let sumT1 = 0, countT1 = 0;
  let sumT2 = 0, countT2 = 0;
  let sumSTS = 0, countSTS = 0;

  data.subjects.forEach(s => {
    if (s.tugas1 !== null && s.tugas1 !== undefined && !isNaN(Number(s.tugas1))) {
      sumT1 += Number(s.tugas1);
      countT1++;
    }
    if (s.tugas2 !== null && s.tugas2 !== undefined && !isNaN(Number(s.tugas2))) {
      sumT2 += Number(s.tugas2);
      countT2++;
    }
    if (s.sts !== null && s.sts !== undefined && !isNaN(Number(s.sts))) {
      sumSTS += Number(s.sts);
      countSTS++;
    }
  });

  const displaySumT1 = countT1 > 0 ? Math.round(sumT1) : "-";
  const displaySumT2 = countT2 > 0 ? Math.round(sumT2) : "-";
  const displaySumSTS = countSTS > 0 ? Math.round(sumSTS) : "-";

  const displayAvgT1 = countT1 > 0 ? (sumT1 / countT1).toFixed(2).replace(/\.00$/, "") : "-";
  const displayAvgT2 = countT2 > 0 ? (sumT2 / countT2).toFixed(2).replace(/\.00$/, "") : "-";
  const displayAvgSTS = countSTS > 0 ? (sumSTS / countSTS).toFixed(2).replace(/\.00$/, "") : "-";

  return `
  <div class="report-page" style="width: 210mm; min-height: 330mm; padding: 12mm 15mm 15mm 15mm; margin: 0 auto; box-sizing: border-box; background: #ffffff;">
    ${renderKopSuratHtml(data.school)}

    <div style="text-align: center; margin-bottom: 14px;">
      <div style="font-family: 'Times New Roman', Times, serif; font-size: 12pt; font-weight: bold; letter-spacing: 0.5px; text-transform: uppercase;">
        LAPORAN PERKEMBANGAN BELAJAR TENGAH SEMESTER
      </div>
    </div>

    <table style="width: 100%; border-collapse: collapse; font-family: 'Times New Roman', Times, serif; font-size: 10pt; margin-bottom: 12px; line-height: 1.4;">
      <tr>
        <td style="width: 15%; vertical-align: top; padding: 1px 0;">Nama Siswa</td>
        <td style="width: 2%; vertical-align: top; padding: 1px 0;">:</td>
        <td style="width: 35%; vertical-align: top; padding: 1px 0; font-weight: bold;">${data.student.name}</td>
        <td style="width: 15%; vertical-align: top; padding: 1px 0;">No. Absen</td>
        <td style="width: 2%; vertical-align: top; padding: 1px 0;">:</td>
        <td style="width: 31%; vertical-align: top; padding: 1px 0;">${data.student.studentNo || "-"}</td>
      </tr>
      <tr>
        <td style="vertical-align: top; padding: 1px 0;">Nomor Induk</td>
        <td style="vertical-align: top; padding: 1px 0;">:</td>
        <td style="vertical-align: top; padding: 1px 0;">${data.student.nisn}</td>
        <td style="vertical-align: top; padding: 1px 0;">Semester</td>
        <td style="vertical-align: top; padding: 1px 0;">:</td>
        <td style="vertical-align: top; padding: 1px 0;">${data.academicYear.semester}</td>
      </tr>
      <tr>
        <td style="vertical-align: top; padding: 1px 0;">Kelas</td>
        <td style="vertical-align: top; padding: 1px 0;">:</td>
        <td style="vertical-align: top; padding: 1px 0;">${data.student.className}</td>
        <td style="vertical-align: top; padding: 1px 0;">Tahun Ajaran</td>
        <td style="vertical-align: top; padding: 1px 0;">:</td>
        <td style="vertical-align: top; padding: 1px 0;">${data.academicYear.year}</td>
      </tr>
    </table>

    <table style="width: 100%; border-collapse: collapse; font-family: 'Times New Roman', Times, serif; font-size: 9.5pt; margin-bottom: 14px;">
      <thead>
        <tr style="background-color: #ffffff;">
          <th style="border: 1px solid #000000; padding: 5px 2px; text-align: center; width: 4%; font-weight: bold;">NO.</th>
          <th style="border: 1px solid #000000; padding: 5px 6px; text-align: center; width: 33%; font-weight: bold;">MATA PELAJARAN</th>
          <th style="border: 1px solid #000000; padding: 5px 2px; text-align: center; width: 7%; font-weight: bold;">AF 1</th>
          <th style="border: 1px solid #000000; padding: 5px 2px; text-align: center; width: 7%; font-weight: bold;">AF 2</th>
          <th style="border: 1px solid #000000; padding: 5px 2px; text-align: center; width: 7%; font-weight: bold;">ASTS</th>
          <th style="border: 1px solid #000000; padding: 5px 6px; text-align: center; width: 42%; font-weight: bold;">DESKRIPSI</th>
        </tr>
      </thead>
      <tbody>
        ${subjectsRows}
        <tr>
          <td colspan="2" style="border: 1px solid #000000; padding: 4px 6px; font-weight: bold; text-align: center;">JUMLAH</td>
          <td style="border: 1px solid #000000; padding: 4px 2px; font-weight: bold; text-align: center;">${displaySumT1}</td>
          <td style="border: 1px solid #000000; padding: 4px 2px; font-weight: bold; text-align: center;">${displaySumT2}</td>
          <td style="border: 1px solid #000000; padding: 4px 2px; font-weight: bold; text-align: center;">${displaySumSTS}</td>
          <td style="border: 1px solid #000000; padding: 4px 6px;"></td>
        </tr>
        <tr>
          <td colspan="2" style="border: 1px solid #000000; padding: 4px 6px; font-weight: bold; text-align: center;">RATA - RATA</td>
          <td style="border: 1px solid #000000; padding: 4px 2px; font-weight: bold; text-align: center;">${displayAvgT1}</td>
          <td style="border: 1px solid #000000; padding: 4px 2px; font-weight: bold; text-align: center;">${displayAvgT2}</td>
          <td style="border: 1px solid #000000; padding: 4px 2px; font-weight: bold; text-align: center;">${displayAvgSTS}</td>
          <td style="border: 1px solid #000000; padding: 4px 6px;"></td>
        </tr>
      </tbody>
    </table>

    <div style="font-family: 'Times New Roman', Times, serif; font-size: 8.5pt; margin-top: 4px; margin-bottom: 12px; line-height: 1.3;">
      <div style="font-weight: bold;">Keterangan</div>
      <div style="padding-left: 8px;">AF 1 = Asesmen Formatif 1, AF 2 = Asesmen Formatif 2, ASTS = Asesmen Sumatif Tengah Semester</div>
    </div>

    <div style="font-family: 'Times New Roman', Times, serif; font-size: 10pt; margin-bottom: 15px; page-break-inside: avoid;">
      <div style="font-weight: bold; margin-bottom: 4px; text-transform: uppercase;">KETIDAKHADIRAN</div>
      <table style="width: 260px; border-collapse: collapse; font-size: 9.5pt;">
        <tr>
          <td style="border: 1px solid #000000; padding: 3px 6px; text-align: center; width: 25px;">1.</td>
          <td style="border: 1px solid #000000; padding: 3px 8px; width: 140px;">Sakit</td>
          <td style="border: 1px solid #000000; padding: 3px 6px; text-align: center;">${data.attendance.sick} &nbsp;hari</td>
        </tr>
        <tr>
          <td style="border: 1px solid #000000; padding: 3px 6px; text-align: center;">2.</td>
          <td style="border: 1px solid #000000; padding: 3px 8px;">Izin</td>
          <td style="border: 1px solid #000000; padding: 3px 6px; text-align: center;">${data.attendance.permission} &nbsp;hari</td>
        </tr>
        <tr>
          <td style="border: 1px solid #000000; padding: 3px 6px; text-align: center;">3.</td>
          <td style="border: 1px solid #000000; padding: 3px 8px;">Tanpa Keterangan</td>
          <td style="border: 1px solid #000000; padding: 3px 6px; text-align: center;">${data.attendance.absent} &nbsp;hari</td>
        </tr>
      </table>
    </div>

    ${data.homeroomTeacherNotes ? `
    <div style="font-family: 'Times New Roman', Times, serif; font-size: 10pt; margin-bottom: 15px; page-break-inside: avoid;">
      <div style="font-weight: bold; margin-bottom: 4px; text-transform: uppercase;">CATATAN WALI KELAS</div>
      <div style="border: 1px solid #000000; padding: 6px 10px; min-height: 40px; font-size: 9.5pt; line-height: 1.3;">
        ${data.homeroomTeacherNotes}
      </div>
    </div>` : ''}

    ${(() => {
      const teacherName = data.homeroomTeacherName || "...................................";
      const principalName = data.school.principalName || "...................................";

      return `
      <div style="font-family: 'Times New Roman', Times, serif; font-size: 10pt; page-break-inside: avoid; margin-top: 20px;">
        <table style="width: 100%; border-collapse: collapse; text-align: center;">
          <tr>
            <td style="width: 33%; vertical-align: top;">
              <div>Mengetahui,</div>
              <div>Orang Tua / Wali Siswa</div>
              <div style="height: 55px;"></div>
              <div>( .................................... )</div>
            </td>
            <td style="width: 34%; vertical-align: top;">
              <div><br></div>
              <div>Wali Kelas</div>
              <div style="height: 55px;"></div>
              <div><b><u>${teacherName}</u></b></div>
            </td>
            <td style="width: 33%; vertical-align: top;">
              <div>${schoolCity}, ${data.printDate}</div>
              <div>Kepala Sekolah</div>
              <div style="height: 55px;"></div>
              <div><b><u>${principalName}</u></b></div>
              ${data.school.principalNip ? `<div style="font-size: 9pt;">NIP. ${data.school.principalNip}</div>` : ''}
            </td>
          </tr>
        </table>
      </div>`;
    })()}
  </div>`;
}

export function generateInterimReportCardHtml(data: any): string {
  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Raport Sisipan - ${data.student.name}</title>
  <style>${commonStyle}</style>
</head>
<body style="margin: 0; padding: 0; background: #ffffff;">
  ${generateInterimReportCardInnerHtml(data)}
</body>
</html>`;
}

export function generateClassInterimReportCardHtml(reportsData: any[]): string {
  const pagesHtml = reportsData.map(data => generateInterimReportCardInnerHtml(data));
  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Raport Sisipan Kelas</title>
  <style>
    ${commonStyle}
    .page-break { page-break-before: always; break-before: page; }
  </style>
</head>
<body style="margin: 0; padding: 0; background: #ffffff;">
  ${pagesHtml.join('<div class="page-break"></div>')}
</body>
</html>`;
}
