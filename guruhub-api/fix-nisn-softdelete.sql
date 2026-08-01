-- =============================================================
-- FIX: Izinkan NISN dipakai ulang setelah siswa di-soft-delete
-- =============================================================

-- 1. Ubah kolom nisn menjadi nullable
ALTER TABLE students MODIFY COLUMN nisn VARCHAR(20) NULL;

-- 2. Hapus/nullify NISN pada record yang sudah soft-deleted
--    agar unique constraint tidak memblokir penambahan siswa baru
--    dengan NISN yang sama
UPDATE students
SET nisn = NULL
WHERE deleted_at IS NOT NULL AND nisn IS NOT NULL;

-- Verifikasi hasil
SELECT
  COUNT(*) AS total_dihapus_dinullify
FROM students
WHERE deleted_at IS NOT NULL AND nisn IS NULL;
