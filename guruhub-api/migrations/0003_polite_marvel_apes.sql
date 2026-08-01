ALTER TABLE `students` ADD `status` enum('Aktif','Nonaktif') DEFAULT 'Aktif' NOT NULL;--> statement-breakpoint
ALTER TABLE `students` ADD `deleted_at` timestamp;