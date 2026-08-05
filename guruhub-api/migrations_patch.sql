-- GuruHub v2 Database Schema Migration Patch for MariaDB
-- Contains all discipline, interim report cards, assessment, attendance details, and master tables

-- USE guruhub_db;

-- 1. Discipline Policies
CREATE TABLE IF NOT EXISTS `discipline_policies` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `school_id` bigint unsigned NOT NULL,
  `point_reset_cycle` enum('ACADEMIC_YEAR','SEMESTER','NEVER') NOT NULL DEFAULT 'ACADEMIC_YEAR',
  `max_active_points` int NOT NULL DEFAULT 100,
  `auto_sanction_enabled` boolean NOT NULL DEFAULT true,
  `carry_forward_percentage` int NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_school_policy` (`school_id`),
  CONSTRAINT `fk_policy_school` FOREIGN KEY (`school_id`) REFERENCES `schools` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Discipline Categories
CREATE TABLE IF NOT EXISTS `discipline_categories` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `school_id` bigint unsigned NOT NULL,
  `code` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` enum('VIOLATION','REWARD') COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_discipline_cat_code` (`school_id`,`code`,`deleted_at`),
  CONSTRAINT `fk_cat_school` FOREIGN KEY (`school_id`) REFERENCES `schools` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Discipline Types
CREATE TABLE IF NOT EXISTS `discipline_types` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `school_id` bigint unsigned NOT NULL,
  `category_id` bigint unsigned NOT NULL,
  `code` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `default_points` int NOT NULL DEFAULT 5,
  `description` text COLLATE utf8mb4_unicode_ci,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_discipline_type_code` (`school_id`,`code`,`deleted_at`),
  KEY `idx_discipline_types_category` (`school_id`,`category_id`),
  CONSTRAINT `fk_type_school` FOREIGN KEY (`school_id`) REFERENCES `schools` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_type_category` FOREIGN KEY (`category_id`) REFERENCES `discipline_categories` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Discipline Incidents
CREATE TABLE IF NOT EXISTS `discipline_incidents` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `school_id` bigint unsigned NOT NULL,
  `reporter_user_id` bigint unsigned NOT NULL,
  `handler_teacher_id` bigint unsigned DEFAULT NULL,
  `incident_date` date NOT NULL,
  `incident_time` time DEFAULT NULL,
  `location` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `status` enum('DRAFT','PENDING','UNDER_REVIEW','VERIFIED','REJECTED','CANCELLED','RESOLVED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'DRAFT',
  `deleted_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_incidents_reporter` (`school_id`,`reporter_user_id`),
  KEY `idx_incidents_handler` (`school_id`,`handler_teacher_id`),
  KEY `idx_incidents_status` (`school_id`,`status`),
  KEY `idx_incidents_date` (`school_id`,`incident_date`),
  CONSTRAINT `fk_inc_school` FOREIGN KEY (`school_id`) REFERENCES `schools` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_inc_reporter` FOREIGN KEY (`reporter_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_inc_handler` FOREIGN KEY (`handler_teacher_id`) REFERENCES `teachers` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Discipline Incident Students
CREATE TABLE IF NOT EXISTS `discipline_incident_students` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `incident_id` bigint unsigned NOT NULL,
  `student_id` bigint unsigned NOT NULL,
  `class_id` bigint unsigned NOT NULL,
  `academic_year_id` bigint unsigned NOT NULL,
  `discipline_type_id` bigint unsigned NOT NULL,
  `point_snapshot` int NOT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_inc_std_incident` (`incident_id`),
  KEY `idx_inc_std_student` (`student_id`,`academic_year_id`),
  KEY `idx_inc_std_class` (`class_id`),
  KEY `idx_inc_std_type` (`discipline_type_id`),
  CONSTRAINT `fk_inc_std_incident` FOREIGN KEY (`incident_id`) REFERENCES `discipline_incidents` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_inc_std_student` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_inc_std_class` FOREIGN KEY (`class_id`) REFERENCES `classes` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_inc_std_year` FOREIGN KEY (`academic_year_id`) REFERENCES `academic_years` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_inc_std_type` FOREIGN KEY (`discipline_type_id`) REFERENCES `discipline_types` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Discipline Incident Witnesses
CREATE TABLE IF NOT EXISTS `discipline_incident_witnesses` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `incident_id` bigint unsigned NOT NULL,
  `user_id` bigint unsigned DEFAULT NULL,
  `witness_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `witness_role` enum('TEACHER','STUDENT','STAFF','OTHER') COLLATE utf8mb4_unicode_ci NOT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_witness_incident` (`incident_id`),
  CONSTRAINT `fk_witness_incident` FOREIGN KEY (`incident_id`) REFERENCES `discipline_incidents` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_witness_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Discipline Incident Attachments
CREATE TABLE IF NOT EXISTS `discipline_incident_attachments` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `incident_id` bigint unsigned NOT NULL,
  `file_url` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_type` enum('IMAGE','PDF','VIDEO') COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `file_size` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_attachment_incident` (`incident_id`),
  CONSTRAINT `fk_attach_incident` FOREIGN KEY (`incident_id`) REFERENCES `discipline_incidents` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Discipline Sanction Thresholds
CREATE TABLE IF NOT EXISTS `discipline_sanction_thresholds` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `school_id` bigint unsigned NOT NULL,
  `min_points` int NOT NULL,
  `sanction_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `action_required` enum('PEMBINAAN_BK','PANGGILAN_ORANG_TUA','SURAT_PERINGATAN','SKORSING','DIKELUARKAN') COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_thresholds_school` (`school_id`,`min_points`),
  CONSTRAINT `fk_threshold_school` FOREIGN KEY (`school_id`) REFERENCES `schools` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. Discipline Sanction Logs
CREATE TABLE IF NOT EXISTS `discipline_sanction_logs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `school_id` bigint unsigned NOT NULL,
  `student_id` bigint unsigned NOT NULL,
  `academic_year_id` bigint unsigned NOT NULL,
  `threshold_id` bigint unsigned DEFAULT NULL,
  `issued_by_teacher_id` bigint unsigned NOT NULL,
  `cumulative_points` int NOT NULL,
  `sanction_type` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `document_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `status` enum('PENDING','ACTIVE','COMPLETED','REVOKED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PENDING',
  `deleted_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_sanctions_student` (`school_id`,`student_id`,`academic_year_id`),
  CONSTRAINT `fk_sanct_school` FOREIGN KEY (`school_id`) REFERENCES `schools` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_sanct_student` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_sanct_year` FOREIGN KEY (`academic_year_id`) REFERENCES `academic_years` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_sanct_threshold` FOREIGN KEY (`threshold_id`) REFERENCES `discipline_sanction_thresholds` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_sanct_teacher` FOREIGN KEY (`issued_by_teacher_id`) REFERENCES `teachers` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. Discipline Pleno Decisions
CREATE TABLE IF NOT EXISTS `discipline_pleno_decisions` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `school_id` bigint unsigned NOT NULL,
  `student_id` bigint unsigned NOT NULL,
  `academic_year_id` bigint unsigned NOT NULL,
  `system_recommendation` enum('NAIK_KELAS','PEMBINAAN_BASECAMP') COLLATE utf8mb4_unicode_ci NOT NULL,
  `final_decision` enum('NAIK_KELAS','PEMBINAAN_BASECAMP') COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_overridden` boolean NOT NULL DEFAULT false,
  `unfulfilled_subjects_count` int DEFAULT 0,
  `academic_notes` text COLLATE utf8mb4_unicode_ci,
  `attendance_notes` text COLLATE utf8mb4_unicode_ci,
  `discipline_notes` text COLLATE utf8mb4_unicode_ci,
  `override_reason` text COLLATE utf8mb4_unicode_ci,
  `decided_by_user_id` bigint unsigned DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_pleno_std_year` (`school_id`,`student_id`,`academic_year_id`),
  KEY `idx_pleno_school_std` (`school_id`,`student_id`),
  CONSTRAINT `fk_pleno_school` FOREIGN KEY (`school_id`) REFERENCES `schools` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_pleno_student` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_pleno_year` FOREIGN KEY (`academic_year_id`) REFERENCES `academic_years` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. Interim Report Cards
CREATE TABLE IF NOT EXISTS `interim_report_cards` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `school_id` bigint unsigned NOT NULL,
  `student_id` bigint unsigned NOT NULL,
  `class_id` bigint unsigned NOT NULL,
  `academic_year_id` bigint unsigned NOT NULL,
  `semester` enum('GANJIL','GENAP') COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('DRAFT','PUBLISHED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'DRAFT',
  `homeroom_teacher_notes` text COLLATE utf8mb4_unicode_ci,
  `sick` int DEFAULT '0',
  `permission` int DEFAULT '0',
  `absent` int DEFAULT '0',
  `deleted_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_irc_school_student` (`school_id`, `student_id`),
  KEY `idx_irc_class_ay` (`class_id`, `academic_year_id`, `semester`),
  CONSTRAINT `fk_irc_school` FOREIGN KEY (`school_id`) REFERENCES `schools` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_irc_student` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_irc_class` FOREIGN KEY (`class_id`) REFERENCES `classes` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_irc_academic_year` FOREIGN KEY (`academic_year_id`) REFERENCES `academic_years` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 12. Interim Report Card Subjects
CREATE TABLE IF NOT EXISTS `interim_report_card_subjects` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `interim_report_card_id` bigint unsigned NOT NULL,
  `subject_id` bigint unsigned NOT NULL,
  `tugas_1` int DEFAULT NULL,
  `tugas_2` int DEFAULT NULL,
  `sts` int DEFAULT NULL,
  `final_score` int NOT NULL DEFAULT '0',
  `grade_letter` varchar(5) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id`),
  KEY `idx_ircs_interim_report_card` (`interim_report_card_id`),
  KEY `idx_ircs_subject` (`subject_id`),
  CONSTRAINT `fk_ircs_interim_report_card` FOREIGN KEY (`interim_report_card_id`) REFERENCES `interim_report_cards` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_ircs_subject` FOREIGN KEY (`subject_id`) REFERENCES `subjects` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 13. Class Members
CREATE TABLE IF NOT EXISTS `class_members` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `school_id` bigint unsigned NOT NULL,
  `class_id` bigint unsigned NOT NULL,
  `student_id` bigint unsigned NOT NULL,
  `academic_year_id` bigint unsigned NOT NULL,
  `status` enum('ACTIVE','INACTIVE','GRADUATED','TRANSFERRED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ACTIVE',
  `deleted_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_cm_school` FOREIGN KEY (`school_id`) REFERENCES `schools` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_cm_class` FOREIGN KEY (`class_id`) REFERENCES `classes` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_cm_student` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_cm_ay` FOREIGN KEY (`academic_year_id`) REFERENCES `academic_years` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed Default Discipline Policy for School 719 if not existing
INSERT IGNORE INTO `discipline_policies` (`school_id`, `point_reset_cycle`, `max_active_points`, `auto_sanction_enabled`, `carry_forward_percentage`)
VALUES (719, 'ACADEMIC_YEAR', 100, 1, 0);

-- Seed Default Discipline Categories for School 719 if not existing
INSERT IGNORE INTO `discipline_categories` (`id`, `school_id`, `code`, `name`, `type`, `description`) VALUES
(101, 719, 'CAT-V-MIN', 'Pelanggaran Ringan', 'VIOLATION', 'Pelanggaran tata tertib kategori ringan'),
(102, 719, 'CAT-V-MOD', 'Pelanggaran Sedang', 'VIOLATION', 'Pelanggaran tata tertib kategori sedang'),
(103, 719, 'CAT-V-MAJ', 'Pelanggaran Berat', 'VIOLATION', 'Pelanggaran tata tertib kategori berat'),
(104, 719, 'CAT-R-ACA', 'Prestasi Akademik', 'REWARD', 'Penghargaan atas prestasi bidang akademik'),
(105, 719, 'CAT-R-NAC', 'Prestasi Non-Akademik', 'REWARD', 'Penghargaan atas prestasi bidang non-akademik'),
(106, 719, 'CAT-R-CHA', 'Karakter & Kedisiplinan', 'REWARD', 'Penghargaan atas kepribadian dan kedisiplinan luar biasa');

-- Seed Default Discipline Types for School 719 if not existing
INSERT IGNORE INTO `discipline_types` (`id`, `school_id`, `category_id`, `code`, `name`, `default_points`, `description`) VALUES
(201, 719, 101, 'V-LATE', 'Terlambat Masuk Sekolah', 5, 'Hadir setelah bel masuk berbunyi'),
(202, 719, 101, 'V-UNIFORM', 'Atribut Seragam Tidak Lengkap', 5, 'Tidak memakai dasi, sabuk, atau kaos kaki sesuai ketentuan'),
(203, 719, 102, 'V-SKIP', 'Membolos Jam Pelajaran', 15, 'Meninggalkan kelas tanpa izin selama KBM'),
(204, 719, 102, 'V-LANG', 'Menggunakan Bahasa Tidak Sopan', 10, 'Mengucapkan kata-kata kasar di lingkungan sekolah'),
(205, 719, 103, 'V-FIGHT', 'Perkelahian / Tawuran', 50, 'Melakukan kekerasan fisik terhadap sesama siswa'),
(206, 719, 103, 'V-SMOKE', 'Merokok di Area Sekolah', 30, 'Membawa atau merokok di dalam kawasan sekolah'),
(207, 719, 104, 'R-OLYMP', 'Pemenang Olimpiade / Lomba Sains', 30, 'Juara 1, 2, atau 3 tingkat Kabupaten/Provinsi/Nasional'),
(208, 719, 104, 'R-RANK', 'Juara Umum Kelas', 20, 'Meraih peringkat 1 di kelas pada akhir semester'),
(209, 719, 106, 'R-HELP', 'Membantu Penyelenggaraan Acara Sekolah', 10, 'Menjadi panitia atau membantu guru secara sukarela'),
(210, 719, 106, 'R-ATT', 'Kehadiran Sempurna (100% Attendance)', 15, 'Tidak pernah absen selama 1 semester');

-- Seed Default Discipline Sanction Thresholds for School 719 if not existing
INSERT IGNORE INTO `discipline_sanction_thresholds` (`id`, `school_id`, `min_points`, `sanction_name`, `action_required`, `description`) VALUES
(301, 719, 20, 'Pembinaan BK & Teguran Lisan', 'PEMBINAAN_BK', 'Panggilan pertama oleh guru BK untuk konseling'),
(302, 719, 40, 'Panggilan Orang Tua I', 'PANGGILAN_ORANG_TUA', 'Panggilan orang tua siswa ke sekolah untuk diskusi'),
(303, 719, 60, 'Surat Peringatan Pertama (SP 1)', 'SURAT_PERINGATAN', 'Penerbitan SP 1 dan perjanjian tertulis'),
(304, 719, 80, 'Skorsing 3 Hari', 'SKORSING', 'Siswa belajar di rumah selama 3 hari kerja'),
(305, 719, 100, 'Dikembalikan kepada Orang Tua', 'DIKELUARKAN', 'Pemberhentian hak siswa belajar di sekolah secara permanen');

-- Ensure subjects table has religion_group column
ALTER TABLE subjects ADD COLUMN IF NOT EXISTS religion_group enum('Islam','Kristen','Katolik','Hindu','Buddha','Khonghucu','UMUM') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'UMUM';
