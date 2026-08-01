-- Drop unique index that prevents re-creating journal after soft delete
-- App-level validation in service already handles duplicate prevention correctly
ALTER TABLE `teaching_journals` DROP INDEX `uq_schedule_journal_date`;
