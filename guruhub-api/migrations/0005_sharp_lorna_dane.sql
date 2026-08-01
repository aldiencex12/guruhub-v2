ALTER TABLE `subjects` ADD `description` varchar(255);--> statement-breakpoint
ALTER TABLE `subjects` ADD `status` enum('Aktif','Nonaktif') DEFAULT 'Aktif' NOT NULL;--> statement-breakpoint
ALTER TABLE `subjects` ADD `deleted_at` timestamp;--> statement-breakpoint
ALTER TABLE `subjects` ADD CONSTRAINT `uq_school_subject_name` UNIQUE(`school_id`,`name`);