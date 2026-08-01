-- Migration: Create interim_report_cards and interim_report_card_subjects tables
-- Generated: 2026-07-30

CREATE TABLE IF NOT EXISTS `interim_report_cards` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `school_id` bigint unsigned NOT NULL,
  `student_id` bigint unsigned NOT NULL,
  `class_id` bigint unsigned NOT NULL,
  `academic_year_id` bigint unsigned NOT NULL,
  `semester` enum('GANJIL','GENAP') NOT NULL,
  `status` enum('DRAFT','PUBLISHED') NOT NULL DEFAULT 'DRAFT',
  `homeroom_teacher_notes` text,
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

CREATE TABLE IF NOT EXISTS `interim_report_card_subjects` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `interim_report_card_id` bigint unsigned NOT NULL,
  `subject_id` bigint unsigned NOT NULL,
  `tugas_1` int DEFAULT NULL,
  `tugas_2` int DEFAULT NULL,
  `sts` int DEFAULT NULL,
  `final_score` int NOT NULL DEFAULT '0',
  `grade_letter` varchar(5) DEFAULT NULL,
  `notes` text,
  PRIMARY KEY (`id`),
  KEY `idx_ircs_interim_report_card` (`interim_report_card_id`),
  KEY `idx_ircs_subject` (`subject_id`),
  CONSTRAINT `fk_ircs_interim_report_card` FOREIGN KEY (`interim_report_card_id`) REFERENCES `interim_report_cards` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_ircs_subject` FOREIGN KEY (`subject_id`) REFERENCES `subjects` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
