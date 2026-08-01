ALTER TABLE `classes` ADD `status` enum('Aktif','Nonaktif') DEFAULT 'Aktif' NOT NULL;--> statement-breakpoint
ALTER TABLE `classes` ADD `deleted_at` timestamp;