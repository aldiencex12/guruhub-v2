/**
 * Menghitung Grade Letter berdasarkan nilai akhir siswa.
 * Aturan:
 * - 90 - 100 = A
 * - 80 - 89.99 = B
 * - 70 - 79.99 = C
 * - < 70 = D
 */
export function calculateGradeLetter(score: number): string {
  if (score >= 90) {
    return "A";
  } else if (score >= 80) {
    return "B";
  } else if (score >= 70) {
    return "C";
  } else {
    return "D";
  }
}
