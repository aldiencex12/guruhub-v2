CREATE TABLE `discipline_action_logs` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`school_id` bigint unsigned NOT NULL,
	`violation_id` bigint unsigned NOT NULL,
	`actor_user_id` bigint unsigned NOT NULL,
	`previous_status` varchar(50),
	`new_status` varchar(50) NOT NULL,
	`notes` text,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `discipline_action_logs_id` PRIMARY KEY(`id`)
);
CREATE TABLE `discipline_categories` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`school_id` bigint unsigned NOT NULL,
	`code` varchar(30) NOT NULL,
	`name` varchar(255) NOT NULL,
	`category` enum('KETERAMBATAN','KERAPIAN','KERAJINAN','ETIKA','KERUSAKAN','BERAT') NOT NULL,
	`severity` enum('LOW','MEDIUM','HIGH','CRITICAL') NOT NULL,
	`default_points` int NOT NULL DEFAULT 5,
	`description` text,
	`deleted_at` timestamp,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `discipline_categories_id` PRIMARY KEY(`id`),
	CONSTRAINT `uq_discipline_cat_code` UNIQUE(`school_id`,`code`,`deleted_at`)
);
CREATE TABLE `discipline_sanction_logs` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`school_id` bigint unsigned NOT NULL,
	`student_id` bigint unsigned NOT NULL,
	`academic_year_id` bigint unsigned NOT NULL,
	`threshold_id` bigint unsigned,
	`issued_by_teacher_id` bigint unsigned NOT NULL,
	`cumulative_points` int NOT NULL,
	`sanction_type` varchar(100) NOT NULL,
	`document_url` varchar(500),
	`notes` text,
	`deleted_at` timestamp,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `discipline_sanction_logs_id` PRIMARY KEY(`id`)
);
CREATE TABLE `discipline_sanction_thresholds` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`school_id` bigint unsigned NOT NULL,
	`min_points` int NOT NULL,
	`sanction_name` varchar(255) NOT NULL,
	`action_required` enum('PEMBINAAN_BK','PANGGILAN_ORANG_TUA','SURAT_PERINGATAN','SKORSING','DIKELUARKAN') NOT NULL,
	`description` text,
	`deleted_at` timestamp,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `discipline_sanction_thresholds_id` PRIMARY KEY(`id`)
);
CREATE TABLE `discipline_violations` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`school_id` bigint unsigned NOT NULL,
	`student_id` bigint unsigned NOT NULL,
	`class_id` bigint unsigned NOT NULL,
	`academic_year_id` bigint unsigned NOT NULL,
	`category_id` bigint unsigned NOT NULL,
	`reporter_user_id` bigint unsigned NOT NULL,
	`handler_teacher_id` bigint unsigned,
	`violation_date` date NOT NULL,
	`violation_time` time,
	`location` varchar(255),
	`notes` text,
	`evidence_url` varchar(500),
	`status` enum('PENDING','VERIFIED','RESOLVED','REJECTED') NOT NULL DEFAULT 'PENDING',
	`demerit_points` int NOT NULL DEFAULT 0,
	`action_taken` text,
	`deleted_at` timestamp,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `discipline_violations_id` PRIMARY KEY(`id`)
);
ALTER TABLE `teaching_journals` DROP INDEX `uq_schedule_journal_date`;ALTER TABLE `students` MODIFY COLUMN `nisn` varchar(20);ALTER TABLE `discipline_action_logs` ADD CONSTRAINT `discipline_action_logs_school_id_schools_id_fk` FOREIGN KEY (`school_id`) REFERENCES `schools`(`id`) ON DELETE cascade ON UPDATE no action;ALTER TABLE `discipline_action_logs` ADD CONSTRAINT `discipline_action_logs_violation_id_discipline_violations_id_fk` FOREIGN KEY (`violation_id`) REFERENCES `discipline_violations`(`id`) ON DELETE cascade ON UPDATE no action;ALTER TABLE `discipline_action_logs` ADD CONSTRAINT `discipline_action_logs_actor_user_id_users_id_fk` FOREIGN KEY (`actor_user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;ALTER TABLE `discipline_categories` ADD CONSTRAINT `discipline_categories_school_id_schools_id_fk` FOREIGN KEY (`school_id`) REFERENCES `schools`(`id`) ON DELETE cascade ON UPDATE no action;ALTER TABLE `discipline_sanction_logs` ADD CONSTRAINT `discipline_sanction_logs_school_id_schools_id_fk` FOREIGN KEY (`school_id`) REFERENCES `schools`(`id`) ON DELETE cascade ON UPDATE no action;ALTER TABLE `discipline_sanction_logs` ADD CONSTRAINT `discipline_sanction_logs_student_id_students_id_fk` FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE cascade ON UPDATE no action;ALTER TABLE `discipline_sanction_logs` ADD CONSTRAINT `discipline_sanction_logs_academic_year_id_academic_years_id_fk` FOREIGN KEY (`academic_year_id`) REFERENCES `academic_years`(`id`) ON DELETE cascade ON UPDATE no action;ALTER TABLE `discipline_sanction_logs` ADD CONSTRAINT `discipline_sanction_logs_threshold_id_discipline_sanction_thresholds_id_fk` FOREIGN KEY (`threshold_id`) REFERENCES `discipline_sanction_thresholds`(`id`) ON DELETE set null ON UPDATE no action;ALTER TABLE `discipline_sanction_logs` ADD CONSTRAINT `discipline_sanction_logs_issued_by_teacher_id_teachers_id_fk` FOREIGN KEY (`issued_by_teacher_id`) REFERENCES `teachers`(`id`) ON DELETE cascade ON UPDATE no action;ALTER TABLE `discipline_sanction_thresholds` ADD CONSTRAINT `discipline_sanction_thresholds_school_id_schools_id_fk` FOREIGN KEY (`school_id`) REFERENCES `schools`(`id`) ON DELETE cascade ON UPDATE no action;ALTER TABLE `discipline_violations` ADD CONSTRAINT `discipline_violations_school_id_schools_id_fk` FOREIGN KEY (`school_id`) REFERENCES `schools`(`id`) ON DELETE cascade ON UPDATE no action;ALTER TABLE `discipline_violations` ADD CONSTRAINT `discipline_violations_student_id_students_id_fk` FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE cascade ON UPDATE no action;ALTER TABLE `discipline_violations` ADD CONSTRAINT `discipline_violations_class_id_classes_id_fk` FOREIGN KEY (`class_id`) REFERENCES `classes`(`id`) ON DELETE cascade ON UPDATE no action;ALTER TABLE `discipline_violations` ADD CONSTRAINT `discipline_violations_academic_year_id_academic_years_id_fk` FOREIGN KEY (`academic_year_id`) REFERENCES `academic_years`(`id`) ON DELETE cascade ON UPDATE no action;ALTER TABLE `discipline_violations` ADD CONSTRAINT `discipline_violations_category_id_discipline_categories_id_fk` FOREIGN KEY (`category_id`) REFERENCES `discipline_categories`(`id`) ON DELETE restrict ON UPDATE no action;ALTER TABLE `discipline_violations` ADD CONSTRAINT `discipline_violations_reporter_user_id_users_id_fk` FOREIGN KEY (`reporter_user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;ALTER TABLE `discipline_violations` ADD CONSTRAINT `discipline_violations_handler_teacher_id_teachers_id_fk` FOREIGN KEY (`handler_teacher_id`) REFERENCES `teachers`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `idx_action_logs_violation` ON `discipline_action_logs` (`school_id`,`violation_id`);--> statement-breakpoint
CREATE INDEX `idx_sanctions_student` ON `discipline_sanction_logs` (`school_id`,`student_id`,`academic_year_id`);--> statement-breakpoint
CREATE INDEX `idx_thresholds_school` ON `discipline_sanction_thresholds` (`school_id`,`min_points`);--> statement-breakpoint
CREATE INDEX `idx_violations_student` ON `discipline_violations` (`school_id`,`student_id`,`academic_year_id`);--> statement-breakpoint
CREATE INDEX `idx_violations_class` ON `discipline_violations` (`school_id`,`class_id`);--> statement-breakpoint
CREATE INDEX `idx_violations_status` ON `discipline_violations` (`school_id`,`status`);--> statement-breakpoint
CREATE INDEX `idx_violations_date` ON `discipline_violations` (`school_id`,`violation_date`);