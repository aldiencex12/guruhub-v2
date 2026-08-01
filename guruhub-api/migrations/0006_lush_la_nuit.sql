CREATE TABLE `attendance_details` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`attendance_id` bigint unsigned NOT NULL,
	`student_id` bigint unsigned NOT NULL,
	`status` enum('PRESENT','SICK','PERMISSION','ABSENT') NOT NULL,
	`notes` text,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `attendance_details_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `assessment_scores` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`assessment_id` bigint unsigned NOT NULL,
	`student_id` bigint unsigned NOT NULL,
	`score` int NOT NULL,
	`notes` text,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `assessment_scores_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `class_members` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`school_id` bigint unsigned NOT NULL,
	`class_id` bigint unsigned NOT NULL,
	`student_id` bigint unsigned NOT NULL,
	`academic_year_id` bigint unsigned NOT NULL,
	`status` enum('ACTIVE','INACTIVE','GRADUATED','TRANSFERRED') NOT NULL DEFAULT 'ACTIVE',
	`deleted_at` timestamp,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `class_members_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `teaching_journals` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`school_id` bigint unsigned NOT NULL,
	`schedule_id` bigint unsigned NOT NULL,
	`teacher_id` bigint unsigned NOT NULL,
	`attendance_id` bigint unsigned,
	`journal_date` date NOT NULL,
	`topic` varchar(255) NOT NULL,
	`learning_objectives` text NOT NULL,
	`teaching_method` varchar(255) NOT NULL,
	`reflection` text,
	`notes` text,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`deleted_at` timestamp,
	CONSTRAINT `teaching_journals_id` PRIMARY KEY(`id`),
	CONSTRAINT `uq_schedule_journal_date` UNIQUE(`schedule_id`,`journal_date`)
);
--> statement-breakpoint
CREATE TABLE `assessment_categories` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`school_id` bigint unsigned NOT NULL,
	`teacher_id` bigint unsigned,
	`name` varchar(255) NOT NULL,
	`description` text,
	`weight` int NOT NULL,
	`is_active` boolean NOT NULL DEFAULT true,
	`is_default` boolean NOT NULL DEFAULT false,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`deleted_at` timestamp,
	CONSTRAINT `assessment_categories_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `student_final_grades` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`school_id` bigint unsigned NOT NULL,
	`student_id` bigint unsigned NOT NULL,
	`class_id` bigint unsigned NOT NULL,
	`subject_id` bigint unsigned NOT NULL,
	`academic_year_id` bigint unsigned NOT NULL,
	`final_score` double NOT NULL,
	`grade_letter` varchar(2) NOT NULL,
	`calculated_at` timestamp NOT NULL DEFAULT (now()),
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `student_final_grades_id` PRIMARY KEY(`id`),
	CONSTRAINT `uq_student_subject_ay` UNIQUE(`student_id`,`subject_id`,`academic_year_id`)
);
--> statement-breakpoint
CREATE TABLE `extracurriculars` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`school_id` bigint unsigned NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`deleted_at` timestamp,
	CONSTRAINT `extracurriculars_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `p5_projects` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`report_card_id` bigint unsigned NOT NULL,
	`theme` varchar(255) NOT NULL,
	`predicate` enum('SB','B','C','PB') NOT NULL,
	`description` text,
	CONSTRAINT `p5_projects_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `report_card_attendances` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`report_card_id` bigint unsigned NOT NULL,
	`sick` int NOT NULL DEFAULT 0,
	`permission` int NOT NULL DEFAULT 0,
	`absent` int NOT NULL DEFAULT 0,
	CONSTRAINT `report_card_attendances_id` PRIMARY KEY(`id`),
	CONSTRAINT `report_card_attendances_report_card_id_unique` UNIQUE(`report_card_id`)
);
--> statement-breakpoint
CREATE TABLE `report_card_subjects` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`report_card_id` bigint unsigned NOT NULL,
	`subject_id` bigint unsigned NOT NULL,
	`final_score` double NOT NULL,
	`grade_letter` varchar(2) NOT NULL,
	`knowledge_description` text,
	CONSTRAINT `report_card_subjects_id` PRIMARY KEY(`id`),
	CONSTRAINT `uq_report_card_subject` UNIQUE(`report_card_id`,`subject_id`)
);
--> statement-breakpoint
CREATE TABLE `report_cards` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`school_id` bigint unsigned NOT NULL,
	`student_id` bigint unsigned NOT NULL,
	`class_id` bigint unsigned NOT NULL,
	`academic_year_id` bigint unsigned NOT NULL,
	`semester` enum('GANJIL','GENAP') NOT NULL,
	`status` enum('DRAFT','PUBLISHED') NOT NULL DEFAULT 'DRAFT',
	`homeroom_teacher_notes` text,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`deleted_at` timestamp,
	CONSTRAINT `report_cards_id` PRIMARY KEY(`id`),
	CONSTRAINT `uq_student_ay_semester` UNIQUE(`student_id`,`academic_year_id`,`semester`)
);
--> statement-breakpoint
CREATE TABLE `student_achievements` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`report_card_id` bigint unsigned NOT NULL,
	`title` varchar(255) NOT NULL,
	`level` enum('SCHOOL','DISTRICT','PROVINCE','NATIONAL','INTERNATIONAL') NOT NULL,
	`description` text,
	CONSTRAINT `student_achievements_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `student_extracurriculars` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`report_card_id` bigint unsigned NOT NULL,
	`extracurricular_id` bigint unsigned NOT NULL,
	`predicate` enum('A','B','C','D') NOT NULL,
	`description` text,
	CONSTRAINT `student_extracurriculars_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `students` DROP INDEX `uq_school_nis`;--> statement-breakpoint
ALTER TABLE `classes` DROP INDEX `uq_school_year_class_name`;--> statement-breakpoint
ALTER TABLE `subjects` DROP INDEX `uq_school_subject_name`;--> statement-breakpoint
ALTER TABLE `subjects` DROP INDEX `uq_school_subject_code`;--> statement-breakpoint
ALTER TABLE `attendances` DROP INDEX `uq_school_student_date`;--> statement-breakpoint
ALTER TABLE `schedules` DROP FOREIGN KEY `schedules_subject_teacher_id_subject_teachers_id_fk`;
--> statement-breakpoint
ALTER TABLE `attendances` DROP FOREIGN KEY `attendances_student_id_students_id_fk`;
--> statement-breakpoint
ALTER TABLE `attendances` DROP FOREIGN KEY `attendances_academic_year_id_academic_years_id_fk`;
--> statement-breakpoint
ALTER TABLE `attendances` DROP FOREIGN KEY `attendances_marked_by_id_users_id_fk`;
--> statement-breakpoint
ALTER TABLE `assessments` DROP FOREIGN KEY `assessments_student_id_students_id_fk`;
--> statement-breakpoint
ALTER TABLE `assessments` DROP FOREIGN KEY `assessments_subject_teacher_id_subject_teachers_id_fk`;
--> statement-breakpoint
ALTER TABLE `students` MODIFY COLUMN `nisn` varchar(20) NOT NULL;--> statement-breakpoint
ALTER TABLE `students` ADD `religion` enum('Islam','Kristen','Katolik','Hindu','Buddha','Khonghucu') DEFAULT 'Islam' NOT NULL;--> statement-breakpoint
ALTER TABLE `schedules` ADD `class_id` bigint unsigned NOT NULL;--> statement-breakpoint
ALTER TABLE `schedules` ADD `subject_id` bigint unsigned NOT NULL;--> statement-breakpoint
ALTER TABLE `schedules` ADD `teacher_id` bigint unsigned NOT NULL;--> statement-breakpoint
ALTER TABLE `schedules` ADD `academic_year_id` bigint unsigned NOT NULL;--> statement-breakpoint
ALTER TABLE `schedules` ADD `day_of_week` enum('Senin','Selasa','Rabu','Kamis','Jumat','Sabtu','Minggu') NOT NULL;--> statement-breakpoint
ALTER TABLE `schedules` ADD `status` enum('Aktif','Nonaktif') DEFAULT 'Aktif' NOT NULL;--> statement-breakpoint
ALTER TABLE `schedules` ADD `deleted_at` timestamp;--> statement-breakpoint
ALTER TABLE `schedules` ADD `created_at` timestamp DEFAULT (now());--> statement-breakpoint
ALTER TABLE `schedules` ADD `updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `attendances` ADD `schedule_id` bigint unsigned NOT NULL;--> statement-breakpoint
ALTER TABLE `attendances` ADD `teacher_id` bigint unsigned NOT NULL;--> statement-breakpoint
ALTER TABLE `attendances` ADD `attendance_date` date NOT NULL;--> statement-breakpoint
ALTER TABLE `attendances` ADD `notes` text;--> statement-breakpoint
ALTER TABLE `attendances` ADD `deleted_at` timestamp;--> statement-breakpoint
ALTER TABLE `assessments` ADD `class_id` bigint unsigned NOT NULL;--> statement-breakpoint
ALTER TABLE `assessments` ADD `subject_id` bigint unsigned NOT NULL;--> statement-breakpoint
ALTER TABLE `assessments` ADD `teacher_id` bigint unsigned NOT NULL;--> statement-breakpoint
ALTER TABLE `assessments` ADD `academic_year_id` bigint unsigned NOT NULL;--> statement-breakpoint
ALTER TABLE `assessments` ADD `category_id` bigint unsigned;--> statement-breakpoint
ALTER TABLE `assessments` ADD `title` varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE `assessments` ADD `description` text;--> statement-breakpoint
ALTER TABLE `assessments` ADD `assessment_type` enum('DAILY_TEST','ASSIGNMENT','PROJECT','PRACTICAL','MIDTERM','FINAL') NOT NULL;--> statement-breakpoint
ALTER TABLE `assessments` ADD `assessment_date` date NOT NULL;--> statement-breakpoint
ALTER TABLE `assessments` ADD `max_score` int NOT NULL;--> statement-breakpoint
ALTER TABLE `assessments` ADD `deleted_at` timestamp;--> statement-breakpoint
ALTER TABLE `classes` ADD CONSTRAINT `uq_school_year_class_name` UNIQUE(`school_id`,`academic_year_id`,`name`,`deleted_at`);--> statement-breakpoint
ALTER TABLE `subjects` ADD CONSTRAINT `uq_school_subject_name_grade` UNIQUE(`school_id`,`name`,`grade_level`,`deleted_at`);--> statement-breakpoint
ALTER TABLE `subjects` ADD CONSTRAINT `uq_school_subject_code` UNIQUE(`school_id`,`code`,`deleted_at`);--> statement-breakpoint
ALTER TABLE `attendances` ADD CONSTRAINT `uq_schedule_attendance_date` UNIQUE(`school_id`,`schedule_id`,`attendance_date`);--> statement-breakpoint
ALTER TABLE `attendance_details` ADD CONSTRAINT `attendance_details_attendance_id_attendances_id_fk` FOREIGN KEY (`attendance_id`) REFERENCES `attendances`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `attendance_details` ADD CONSTRAINT `attendance_details_student_id_students_id_fk` FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `assessment_scores` ADD CONSTRAINT `assessment_scores_assessment_id_assessments_id_fk` FOREIGN KEY (`assessment_id`) REFERENCES `assessments`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `assessment_scores` ADD CONSTRAINT `assessment_scores_student_id_students_id_fk` FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `class_members` ADD CONSTRAINT `class_members_school_id_schools_id_fk` FOREIGN KEY (`school_id`) REFERENCES `schools`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `class_members` ADD CONSTRAINT `class_members_class_id_classes_id_fk` FOREIGN KEY (`class_id`) REFERENCES `classes`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `class_members` ADD CONSTRAINT `class_members_student_id_students_id_fk` FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `class_members` ADD CONSTRAINT `class_members_academic_year_id_academic_years_id_fk` FOREIGN KEY (`academic_year_id`) REFERENCES `academic_years`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `teaching_journals` ADD CONSTRAINT `teaching_journals_school_id_schools_id_fk` FOREIGN KEY (`school_id`) REFERENCES `schools`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `teaching_journals` ADD CONSTRAINT `teaching_journals_schedule_id_schedules_id_fk` FOREIGN KEY (`schedule_id`) REFERENCES `schedules`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `teaching_journals` ADD CONSTRAINT `teaching_journals_teacher_id_teachers_id_fk` FOREIGN KEY (`teacher_id`) REFERENCES `teachers`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `teaching_journals` ADD CONSTRAINT `teaching_journals_attendance_id_attendances_id_fk` FOREIGN KEY (`attendance_id`) REFERENCES `attendances`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `assessment_categories` ADD CONSTRAINT `assessment_categories_school_id_schools_id_fk` FOREIGN KEY (`school_id`) REFERENCES `schools`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `assessment_categories` ADD CONSTRAINT `assessment_categories_teacher_id_teachers_id_fk` FOREIGN KEY (`teacher_id`) REFERENCES `teachers`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `student_final_grades` ADD CONSTRAINT `student_final_grades_school_id_schools_id_fk` FOREIGN KEY (`school_id`) REFERENCES `schools`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `student_final_grades` ADD CONSTRAINT `student_final_grades_student_id_students_id_fk` FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `student_final_grades` ADD CONSTRAINT `student_final_grades_class_id_classes_id_fk` FOREIGN KEY (`class_id`) REFERENCES `classes`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `student_final_grades` ADD CONSTRAINT `student_final_grades_subject_id_subjects_id_fk` FOREIGN KEY (`subject_id`) REFERENCES `subjects`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `student_final_grades` ADD CONSTRAINT `student_final_grades_academic_year_id_academic_years_id_fk` FOREIGN KEY (`academic_year_id`) REFERENCES `academic_years`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `extracurriculars` ADD CONSTRAINT `extracurriculars_school_id_schools_id_fk` FOREIGN KEY (`school_id`) REFERENCES `schools`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `p5_projects` ADD CONSTRAINT `p5_projects_report_card_id_report_cards_id_fk` FOREIGN KEY (`report_card_id`) REFERENCES `report_cards`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `report_card_attendances` ADD CONSTRAINT `report_card_attendances_report_card_id_report_cards_id_fk` FOREIGN KEY (`report_card_id`) REFERENCES `report_cards`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `report_card_subjects` ADD CONSTRAINT `report_card_subjects_report_card_id_report_cards_id_fk` FOREIGN KEY (`report_card_id`) REFERENCES `report_cards`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `report_card_subjects` ADD CONSTRAINT `report_card_subjects_subject_id_subjects_id_fk` FOREIGN KEY (`subject_id`) REFERENCES `subjects`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `report_cards` ADD CONSTRAINT `report_cards_school_id_schools_id_fk` FOREIGN KEY (`school_id`) REFERENCES `schools`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `report_cards` ADD CONSTRAINT `report_cards_student_id_students_id_fk` FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `report_cards` ADD CONSTRAINT `report_cards_class_id_classes_id_fk` FOREIGN KEY (`class_id`) REFERENCES `classes`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `report_cards` ADD CONSTRAINT `report_cards_academic_year_id_academic_years_id_fk` FOREIGN KEY (`academic_year_id`) REFERENCES `academic_years`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `student_achievements` ADD CONSTRAINT `student_achievements_report_card_id_report_cards_id_fk` FOREIGN KEY (`report_card_id`) REFERENCES `report_cards`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `student_extracurriculars` ADD CONSTRAINT `student_extracurriculars_report_card_id_report_cards_id_fk` FOREIGN KEY (`report_card_id`) REFERENCES `report_cards`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `student_extracurriculars` ADD CONSTRAINT `fk_stud_ext_ext_id` FOREIGN KEY (`extracurricular_id`) REFERENCES `extracurriculars`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `idx_school_id` ON `assessment_categories` (`school_id`);--> statement-breakpoint
CREATE INDEX `idx_final_grades_school` ON `student_final_grades` (`school_id`);--> statement-breakpoint
CREATE INDEX `idx_final_grades_student` ON `student_final_grades` (`student_id`);--> statement-breakpoint
CREATE INDEX `idx_final_grades_subject` ON `student_final_grades` (`subject_id`);--> statement-breakpoint
CREATE INDEX `idx_final_grades_ay` ON `student_final_grades` (`academic_year_id`);--> statement-breakpoint
CREATE INDEX `idx_extracurriculars_school` ON `extracurriculars` (`school_id`);--> statement-breakpoint
CREATE INDEX `idx_report_cards_school` ON `report_cards` (`school_id`);--> statement-breakpoint
CREATE INDEX `idx_report_cards_class` ON `report_cards` (`class_id`);--> statement-breakpoint
ALTER TABLE `schedules` ADD CONSTRAINT `schedules_class_id_classes_id_fk` FOREIGN KEY (`class_id`) REFERENCES `classes`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `schedules` ADD CONSTRAINT `schedules_subject_id_subjects_id_fk` FOREIGN KEY (`subject_id`) REFERENCES `subjects`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `schedules` ADD CONSTRAINT `schedules_teacher_id_teachers_id_fk` FOREIGN KEY (`teacher_id`) REFERENCES `teachers`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `schedules` ADD CONSTRAINT `schedules_academic_year_id_academic_years_id_fk` FOREIGN KEY (`academic_year_id`) REFERENCES `academic_years`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `attendances` ADD CONSTRAINT `attendances_schedule_id_schedules_id_fk` FOREIGN KEY (`schedule_id`) REFERENCES `schedules`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `attendances` ADD CONSTRAINT `attendances_teacher_id_teachers_id_fk` FOREIGN KEY (`teacher_id`) REFERENCES `teachers`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `assessments` ADD CONSTRAINT `assessments_class_id_classes_id_fk` FOREIGN KEY (`class_id`) REFERENCES `classes`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `assessments` ADD CONSTRAINT `assessments_subject_id_subjects_id_fk` FOREIGN KEY (`subject_id`) REFERENCES `subjects`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `assessments` ADD CONSTRAINT `assessments_teacher_id_teachers_id_fk` FOREIGN KEY (`teacher_id`) REFERENCES `teachers`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `assessments` ADD CONSTRAINT `assessments_academic_year_id_academic_years_id_fk` FOREIGN KEY (`academic_year_id`) REFERENCES `academic_years`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `assessments` ADD CONSTRAINT `assessments_category_id_assessment_categories_id_fk` FOREIGN KEY (`category_id`) REFERENCES `assessment_categories`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `students` DROP COLUMN `nis`;--> statement-breakpoint
ALTER TABLE `students` DROP COLUMN `birth_place`;--> statement-breakpoint
ALTER TABLE `students` DROP COLUMN `birth_date`;--> statement-breakpoint
ALTER TABLE `schedules` DROP COLUMN `subject_teacher_id`;--> statement-breakpoint
ALTER TABLE `schedules` DROP COLUMN `day`;--> statement-breakpoint
ALTER TABLE `schedules` DROP COLUMN `room`;--> statement-breakpoint
ALTER TABLE `attendances` DROP COLUMN `student_id`;--> statement-breakpoint
ALTER TABLE `attendances` DROP COLUMN `academic_year_id`;--> statement-breakpoint
ALTER TABLE `attendances` DROP COLUMN `date`;--> statement-breakpoint
ALTER TABLE `attendances` DROP COLUMN `status`;--> statement-breakpoint
ALTER TABLE `attendances` DROP COLUMN `note`;--> statement-breakpoint
ALTER TABLE `attendances` DROP COLUMN `marked_by_id`;--> statement-breakpoint
ALTER TABLE `assessments` DROP COLUMN `student_id`;--> statement-breakpoint
ALTER TABLE `assessments` DROP COLUMN `subject_teacher_id`;--> statement-breakpoint
ALTER TABLE `assessments` DROP COLUMN `type`;--> statement-breakpoint
ALTER TABLE `assessments` DROP COLUMN `name`;--> statement-breakpoint
ALTER TABLE `assessments` DROP COLUMN `score`;--> statement-breakpoint
ALTER TABLE `assessments` DROP COLUMN `feedback`;