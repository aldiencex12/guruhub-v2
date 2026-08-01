CREATE TABLE `schools` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`npsn` varchar(8) NOT NULL,
	`name` varchar(255) NOT NULL,
	`level` enum('SMP','SMA') NOT NULL,
	`address` text,
	`phone` varchar(20),
	`status` enum('Negeri','Swasta') NOT NULL,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `schools_id` PRIMARY KEY(`id`),
	CONSTRAINT `schools_npsn_unique` UNIQUE(`npsn`)
);
--> statement-breakpoint
CREATE TABLE `academic_years` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`school_id` bigint unsigned NOT NULL,
	`year` varchar(9) NOT NULL,
	`semester` enum('Ganjil','Genap') NOT NULL,
	`is_active` boolean NOT NULL DEFAULT false,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `academic_years_id` PRIMARY KEY(`id`),
	CONSTRAINT `uq_school_academic_semester` UNIQUE(`school_id`,`year`,`semester`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`school_id` bigint unsigned NOT NULL,
	`email` varchar(255) NOT NULL,
	`password_hash` varchar(255) NOT NULL,
	`role` enum('SuperAdmin','AdminSekolah','Guru','Siswa','WaliSiswa') NOT NULL,
	`status` enum('Aktif','Nonaktif') NOT NULL DEFAULT 'Aktif',
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `uq_school_email` UNIQUE(`school_id`,`email`)
);
--> statement-breakpoint
CREATE TABLE `teachers` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`school_id` bigint unsigned NOT NULL,
	`user_id` bigint unsigned,
	`nip` varchar(18),
	`name` varchar(255) NOT NULL,
	`phone` varchar(20),
	`gender` enum('L','P') NOT NULL,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `teachers_id` PRIMARY KEY(`id`),
	CONSTRAINT `uq_school_nip` UNIQUE(`school_id`,`nip`)
);
--> statement-breakpoint
CREATE TABLE `students` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`school_id` bigint unsigned NOT NULL,
	`user_id` bigint unsigned,
	`nisn` varchar(10) NOT NULL,
	`nis` varchar(20) NOT NULL,
	`name` varchar(255) NOT NULL,
	`gender` enum('L','P') NOT NULL,
	`birth_place` varchar(100),
	`birth_date` date,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `students_id` PRIMARY KEY(`id`),
	CONSTRAINT `students_nisn_unique` UNIQUE(`nisn`),
	CONSTRAINT `uq_school_nis` UNIQUE(`school_id`,`nis`)
);
--> statement-breakpoint
CREATE TABLE `class_students` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`school_id` bigint unsigned NOT NULL,
	`class_id` bigint unsigned NOT NULL,
	`student_id` bigint unsigned NOT NULL,
	CONSTRAINT `class_students_id` PRIMARY KEY(`id`),
	CONSTRAINT `uq_school_student_year_class` UNIQUE(`school_id`,`class_id`,`student_id`)
);
--> statement-breakpoint
CREATE TABLE `classes` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`school_id` bigint unsigned NOT NULL,
	`academic_year_id` bigint unsigned NOT NULL,
	`homeroom_teacher_id` bigint unsigned,
	`name` varchar(50) NOT NULL,
	`grade_level` enum('7','8','9','10','11','12') NOT NULL,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `classes_id` PRIMARY KEY(`id`),
	CONSTRAINT `uq_school_year_class_name` UNIQUE(`school_id`,`academic_year_id`,`name`)
);
--> statement-breakpoint
CREATE TABLE `subject_teachers` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`school_id` bigint unsigned NOT NULL,
	`class_id` bigint unsigned NOT NULL,
	`subject_id` bigint unsigned NOT NULL,
	`teacher_id` bigint unsigned NOT NULL,
	CONSTRAINT `subject_teachers_id` PRIMARY KEY(`id`),
	CONSTRAINT `uq_school_class_subject` UNIQUE(`school_id`,`class_id`,`subject_id`)
);
--> statement-breakpoint
CREATE TABLE `subjects` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`school_id` bigint unsigned NOT NULL,
	`name` varchar(100) NOT NULL,
	`code` varchar(20) NOT NULL,
	`grade_level` enum('7','8','9','10','11','12') NOT NULL,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `subjects_id` PRIMARY KEY(`id`),
	CONSTRAINT `uq_school_subject_code` UNIQUE(`school_id`,`code`)
);
--> statement-breakpoint
CREATE TABLE `schedules` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`school_id` bigint unsigned NOT NULL,
	`subject_teacher_id` bigint unsigned NOT NULL,
	`day` enum('Senin','Selasa','Rabu','Kamis','Jumat','Sabtu') NOT NULL,
	`start_time` time NOT NULL,
	`end_time` time NOT NULL,
	`room` varchar(50),
	CONSTRAINT `schedules_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `attendances` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`school_id` bigint unsigned NOT NULL,
	`student_id` bigint unsigned NOT NULL,
	`academic_year_id` bigint unsigned NOT NULL,
	`date` date NOT NULL,
	`status` enum('Hadir','Sakit','Izin','Alfa') NOT NULL,
	`note` text,
	`marked_by_id` bigint unsigned,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `attendances_id` PRIMARY KEY(`id`),
	CONSTRAINT `uq_school_student_date` UNIQUE(`school_id`,`student_id`,`date`)
);
--> statement-breakpoint
CREATE TABLE `journals` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`school_id` bigint unsigned NOT NULL,
	`subject_teacher_id` bigint unsigned NOT NULL,
	`date` date NOT NULL,
	`topic` varchar(255) NOT NULL,
	`activities` text NOT NULL,
	`notes` text,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `journals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `assessments` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`school_id` bigint unsigned NOT NULL,
	`student_id` bigint unsigned NOT NULL,
	`subject_teacher_id` bigint unsigned NOT NULL,
	`type` enum('Formatif','Sumatif_Harian','Sumatif_Tengah_Semester','Sumatif_Akhir_Semester') NOT NULL,
	`name` varchar(100) NOT NULL,
	`score` decimal(5,2) NOT NULL,
	`feedback` text,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `assessments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `raports` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`school_id` bigint unsigned NOT NULL,
	`student_id` bigint unsigned NOT NULL,
	`class_id` bigint unsigned NOT NULL,
	`academic_year_id` bigint unsigned NOT NULL,
	`notes` text,
	`extracurriculars` json,
	`attendance_sick` int NOT NULL DEFAULT 0,
	`attendance_permission` int NOT NULL DEFAULT 0,
	`attendance_absent` int NOT NULL DEFAULT 0,
	`status` enum('Draft','Published') NOT NULL DEFAULT 'Draft',
	`published_at` timestamp,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `raports_id` PRIMARY KEY(`id`),
	CONSTRAINT `uq_school_student_academic_year` UNIQUE(`school_id`,`student_id`,`academic_year_id`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`school_id` bigint unsigned NOT NULL,
	`user_id` bigint unsigned NOT NULL,
	`title` varchar(150) NOT NULL,
	`content` text NOT NULL,
	`is_read` boolean NOT NULL DEFAULT false,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `audit_logs` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`school_id` bigint unsigned,
	`user_id` bigint unsigned,
	`action` varchar(100) NOT NULL,
	`table_name` varchar(100) NOT NULL,
	`record_id` bigint unsigned,
	`old_values` json,
	`new_values` json,
	`ip_address` varchar(45),
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `audit_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `academic_years` ADD CONSTRAINT `academic_years_school_id_schools_id_fk` FOREIGN KEY (`school_id`) REFERENCES `schools`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_school_id_schools_id_fk` FOREIGN KEY (`school_id`) REFERENCES `schools`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `teachers` ADD CONSTRAINT `teachers_school_id_schools_id_fk` FOREIGN KEY (`school_id`) REFERENCES `schools`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `teachers` ADD CONSTRAINT `teachers_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `students` ADD CONSTRAINT `students_school_id_schools_id_fk` FOREIGN KEY (`school_id`) REFERENCES `schools`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `students` ADD CONSTRAINT `students_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `class_students` ADD CONSTRAINT `class_students_school_id_schools_id_fk` FOREIGN KEY (`school_id`) REFERENCES `schools`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `class_students` ADD CONSTRAINT `class_students_class_id_classes_id_fk` FOREIGN KEY (`class_id`) REFERENCES `classes`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `class_students` ADD CONSTRAINT `class_students_student_id_students_id_fk` FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `classes` ADD CONSTRAINT `classes_school_id_schools_id_fk` FOREIGN KEY (`school_id`) REFERENCES `schools`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `classes` ADD CONSTRAINT `classes_academic_year_id_academic_years_id_fk` FOREIGN KEY (`academic_year_id`) REFERENCES `academic_years`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `classes` ADD CONSTRAINT `classes_homeroom_teacher_id_teachers_id_fk` FOREIGN KEY (`homeroom_teacher_id`) REFERENCES `teachers`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `subject_teachers` ADD CONSTRAINT `subject_teachers_school_id_schools_id_fk` FOREIGN KEY (`school_id`) REFERENCES `schools`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `subject_teachers` ADD CONSTRAINT `subject_teachers_class_id_classes_id_fk` FOREIGN KEY (`class_id`) REFERENCES `classes`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `subject_teachers` ADD CONSTRAINT `subject_teachers_subject_id_subjects_id_fk` FOREIGN KEY (`subject_id`) REFERENCES `subjects`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `subject_teachers` ADD CONSTRAINT `subject_teachers_teacher_id_teachers_id_fk` FOREIGN KEY (`teacher_id`) REFERENCES `teachers`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `subjects` ADD CONSTRAINT `subjects_school_id_schools_id_fk` FOREIGN KEY (`school_id`) REFERENCES `schools`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `schedules` ADD CONSTRAINT `schedules_school_id_schools_id_fk` FOREIGN KEY (`school_id`) REFERENCES `schools`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `schedules` ADD CONSTRAINT `schedules_subject_teacher_id_subject_teachers_id_fk` FOREIGN KEY (`subject_teacher_id`) REFERENCES `subject_teachers`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `attendances` ADD CONSTRAINT `attendances_school_id_schools_id_fk` FOREIGN KEY (`school_id`) REFERENCES `schools`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `attendances` ADD CONSTRAINT `attendances_student_id_students_id_fk` FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `attendances` ADD CONSTRAINT `attendances_academic_year_id_academic_years_id_fk` FOREIGN KEY (`academic_year_id`) REFERENCES `academic_years`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `attendances` ADD CONSTRAINT `attendances_marked_by_id_users_id_fk` FOREIGN KEY (`marked_by_id`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `journals` ADD CONSTRAINT `journals_school_id_schools_id_fk` FOREIGN KEY (`school_id`) REFERENCES `schools`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `journals` ADD CONSTRAINT `journals_subject_teacher_id_subject_teachers_id_fk` FOREIGN KEY (`subject_teacher_id`) REFERENCES `subject_teachers`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `assessments` ADD CONSTRAINT `assessments_school_id_schools_id_fk` FOREIGN KEY (`school_id`) REFERENCES `schools`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `assessments` ADD CONSTRAINT `assessments_student_id_students_id_fk` FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `assessments` ADD CONSTRAINT `assessments_subject_teacher_id_subject_teachers_id_fk` FOREIGN KEY (`subject_teacher_id`) REFERENCES `subject_teachers`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `raports` ADD CONSTRAINT `raports_school_id_schools_id_fk` FOREIGN KEY (`school_id`) REFERENCES `schools`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `raports` ADD CONSTRAINT `raports_student_id_students_id_fk` FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `raports` ADD CONSTRAINT `raports_class_id_classes_id_fk` FOREIGN KEY (`class_id`) REFERENCES `classes`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `raports` ADD CONSTRAINT `raports_academic_year_id_academic_years_id_fk` FOREIGN KEY (`academic_year_id`) REFERENCES `academic_years`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_school_id_schools_id_fk` FOREIGN KEY (`school_id`) REFERENCES `schools`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `audit_logs` ADD CONSTRAINT `audit_logs_school_id_schools_id_fk` FOREIGN KEY (`school_id`) REFERENCES `schools`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `audit_logs` ADD CONSTRAINT `audit_logs_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;