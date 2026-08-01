/**
 * Menghasilkan deskripsi capaian kompetensi otomatis berdasarkan nilai akhir.
 * 
 * @param score Nilai akhir mata pelajaran (0 - 100)
 * @returns Deskripsi kualitatif kompetensi
 */
export function generateReportDescription(score: number): string {
  if (score >= 90) {
    return "Sangat baik dalam memahami dan menerapkan materi.";
  } else if (score >= 80) {
    return "Baik dalam memahami materi pembelajaran.";
  } else if (score >= 70) {
    return "Cukup memahami materi pembelajaran.";
  } else {
    return "Perlu pendampingan lebih lanjut.";
  }
}
