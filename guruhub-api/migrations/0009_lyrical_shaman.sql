CREATE TABLE `discipline_incident_attachments` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`incident_id` bigint unsigned NOT NULL,
	`file_url` varchar(500) NOT NULL,
	`file_type` enum('IMAGE','PDF','VIDEO') NOT NULL,
	`file_name` varchar(255),
	`file_size` int,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `discipline_incident_attachments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `discipline_incident_students` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`incident_id` bigint unsigned NOT NULL,
	`student_id` bigint unsigned NOT NULL,
	`class_id` bigint unsigned NOT NULL,
	`academic_year_id` bigint unsigned NOT NULL,
	`discipline_type_id` bigint unsigned NOT NULL,
	`point_snapshot` int NOT NULL,
	`notes` text,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `discipline_incident_students_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `discipline_incident_witnesses` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`incident_id` bigint unsigned NOT NULL,
	`user_id` bigint unsigned,
	`witness_name` varchar(255),
	`witness_role` enum('TEACHER','STUDENT','STAFF','OTHER') NOT NULL,
	`notes` text,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `discipline_incident_witnesses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `discipline_incidents` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`school_id` bigint unsigned NOT NULL,
	`reporter_user_id` bigint unsigned NOT NULL,
	`handler_teacher_id` bigint unsigned,
	`incident_date` date NOT NULL,
	`incident_time` time,
	`location` varchar(255),
	`description` text,
	`status` enum('DRAFT','PENDING','UNDER_REVIEW','VERIFIED','REJECTED','CANCELLED','RESOLVED') NOT NULL DEFAULT 'DRAFT',
	`deleted_at` timestamp,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `discipline_incidents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `discipline_policies` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`school_id` bigint unsigned NOT NULL,
	`point_reset_cycle` enum('ACADEMIC_YEAR','SEMESTER','NEVER') NOT NULL DEFAULT 'ACADEMIC_YEAR',
	`max_active_points` int NOT NULL DEFAULT 100,
	`auto_sanction_enabled` boolean NOT NULL DEFAULT true,
	`carry_forward_percentage` int NOT NULL DEFAULT 0,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `discipline_policies_id` PRIMARY KEY(`id`),
	CONSTRAINT `uq_school_policy` UNIQUE(`school_id`)
);
--> statement-breakpoint
CREATE TABLE `discipline_types` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`school_id` bigint unsigned NOT NULL,
	`category_id` bigint unsigned NOT NULL,
	`code` varchar(30) NOT NULL,
	`name` varchar(255) NOT NULL,
	`default_points` int NOT NULL DEFAULT 5,
	`description` text,
	`deleted_at` timestamp,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `discipline_types_id` PRIMARY KEY(`id`),
	CONSTRAINT `uq_discipline_type_code` UNIQUE(`school_id`,`code`,`deleted_at`)
);
--> statement-breakpoint
ALTER TABLE `discipline_sanction_logs` DROP FOREIGN KEY `discipline_sanction_logs_issued_by_teacher_id_teachers_id_fk`;
--> statement-breakpoint
ALTER TABLE `discipline_sanction_thresholds` DROP FOREIGN KEY `discipline_sanction_thresholds_school_id_schools_id_fk`;
--> statement-breakpoint
ALTER TABLE `discipline_categories` ADD `type` enum('VIOLATION','REWARD') NOT NULL;--> statement-breakpoint
ALTER TABLE `discipline_sanction_logs` ADD `status` enum('PENDING','ACTIVE','COMPLETED','REVOKED') DEFAULT 'PENDING' NOT NULL;--> statement-breakpoint
ALTER TABLE `discipline_incident_attachments` ADD CONSTRAINT `fk_attach_incident` FOREIGN KEY (`incident_id`) REFERENCES `discipline_incidents`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `discipline_incident_students` ADD CONSTRAINT `fk_inc_std_incident` FOREIGN KEY (`incident_id`) REFERENCES `discipline_incidents`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `discipline_incident_students` ADD CONSTRAINT `fk_inc_std_student` FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `discipline_incident_students` ADD CONSTRAINT `fk_inc_std_class` FOREIGN KEY (`class_id`) REFERENCES `classes`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `discipline_incident_students` ADD CONSTRAINT `fk_inc_std_year` FOREIGN KEY (`academic_year_id`) REFERENCES `academic_years`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `discipline_incident_students` ADD CONSTRAINT `fk_inc_std_type` FOREIGN KEY (`discipline_type_id`) REFERENCES `discipline_types`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `discipline_incident_witnesses` ADD CONSTRAINT `fk_witness_incident` FOREIGN KEY (`incident_id`) REFERENCES `discipline_incidents`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `discipline_incident_witnesses` ADD CONSTRAINT `fk_witness_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `discipline_incidents` ADD CONSTRAINT `fk_inc_school` FOREIGN KEY (`school_id`) REFERENCES `schools`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `discipline_incidents` ADD CONSTRAINT `fk_inc_reporter` FOREIGN KEY (`reporter_user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `discipline_incidents` ADD CONSTRAINT `fk_inc_handler` FOREIGN KEY (`handler_teacher_id`) REFERENCES `teachers`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `discipline_policies` ADD CONSTRAINT `fk_policy_school` FOREIGN KEY (`school_id`) REFERENCES `schools`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `discipline_types` ADD CONSTRAINT `fk_type_school` FOREIGN KEY (`school_id`) REFERENCES `schools`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `discipline_types` ADD CONSTRAINT `fk_type_category` FOREIGN KEY (`category_id`) REFERENCES `discipline_categories`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `idx_attachment_incident` ON `discipline_incident_attachments` (`incident_id`);--> statement-breakpoint
CREATE INDEX `idx_inc_std_incident` ON `discipline_incident_students` (`incident_id`);--> statement-breakpoint
CREATE INDEX `idx_inc_std_student` ON `discipline_incident_students` (`student_id`,`academic_year_id`);--> statement-breakpoint
CREATE INDEX `idx_inc_std_class` ON `discipline_incident_students` (`class_id`);--> statement-breakpoint
CREATE INDEX `idx_inc_std_type` ON `discipline_incident_students` (`discipline_type_id`);--> statement-breakpoint
CREATE INDEX `idx_witness_incident` ON `discipline_incident_witnesses` (`incident_id`);--> statement-breakpoint
CREATE INDEX `idx_incidents_reporter` ON `discipline_incidents` (`school_id`,`reporter_user_id`);--> statement-breakpoint
CREATE INDEX `idx_incidents_handler` ON `discipline_incidents` (`school_id`,`handler_teacher_id`);--> statement-breakpoint
CREATE INDEX `idx_incidents_status` ON `discipline_incidents` (`school_id`,`status`);--> statement-breakpoint
CREATE INDEX `idx_incidents_date` ON `discipline_incidents` (`school_id`,`incident_date`);--> statement-breakpoint
CREATE INDEX `idx_discipline_types_category` ON `discipline_types` (`school_id`,`category_id`);--> statement-breakpoint
ALTER TABLE `discipline_categories` ADD CONSTRAINT `fk_cat_school` FOREIGN KEY (`school_id`) REFERENCES `schools`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `discipline_sanction_logs` ADD CONSTRAINT `fk_sanct_school` FOREIGN KEY (`school_id`) REFERENCES `schools`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `discipline_sanction_logs` ADD CONSTRAINT `fk_sanct_student` FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `discipline_sanction_logs` ADD CONSTRAINT `fk_sanct_year` FOREIGN KEY (`academic_year_id`) REFERENCES `academic_years`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `discipline_sanction_logs` ADD CONSTRAINT `fk_sanct_threshold` FOREIGN KEY (`threshold_id`) REFERENCES `discipline_sanction_thresholds`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `discipline_sanction_logs` ADD CONSTRAINT `fk_sanct_teacher` FOREIGN KEY (`issued_by_teacher_id`) REFERENCES `teachers`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `discipline_sanction_thresholds` ADD CONSTRAINT `fk_threshold_school` FOREIGN KEY (`school_id`) REFERENCES `schools`(`id`) ON DELETE cascade ON UPDATE no action;