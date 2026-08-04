#!/usr/bin/env bash

# ==============================================================================
# 🧹 GuruHub v2 — Precise Reset Database Script (VM BARU)
# Clears: Discipline Sanction Logs, Incidents, Students, Grades, Attendances
# ==============================================================================

set -e

# Detect Database Name
DB_NAME="guruhub"
if mysql -e "USE guruhub_db;" &>/dev/null; then
    DB_NAME="guruhub_db"
fi

echo "🔍 Memproses pembersihan di Database: ${DB_NAME}..."

mysql "${DB_NAME}" << 'SQL_END'
SET FOREIGN_KEY_CHECKS = 0;

DROP PROCEDURE IF EXISTS truncate_if_exists;
DELIMITER //
CREATE PROCEDURE truncate_if_exists(IN tbl_name VARCHAR(255))
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = DATABASE() AND table_name = tbl_name
    ) THEN
        SET @s = CONCAT('TRUNCATE TABLE `', tbl_name, '`');
        PREPARE stmt FROM @s;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
    END IF;
END //
DELIMITER ;

-- 1. Pelanggaran & Log Sanksi SP (Exact Schema Table Names)
CALL truncate_if_exists('discipline_sanction_logs');
CALL truncate_if_exists('discipline_counseling_schedules');
CALL truncate_if_exists('discipline_incident_students');
CALL truncate_if_exists('discipline_incident_witnesses');
CALL truncate_if_exists('discipline_incident_attachments');
CALL truncate_if_exists('discipline_incidents');
CALL truncate_if_exists('discipline_pleno_decisions');

-- 2. Legacy / Alias Sanction Tables
CALL truncate_if_exists('student_sanctions');
CALL truncate_if_exists('sanction_actions');
CALL truncate_if_exists('student_demerits');
CALL truncate_if_exists('incident_students');
CALL truncate_if_exists('incident_actions');
CALL truncate_if_exists('discipline_overrides');

-- 3. Nilai & Rapor
CALL truncate_if_exists('interim_report_grade_items');
CALL truncate_if_exists('interim_report_cards');
CALL truncate_if_exists('assessment_scores');
CALL truncate_if_exists('assessments');
CALL truncate_if_exists('report_cards');
CALL truncate_if_exists('student_final_grades');
CALL truncate_if_exists('attendances');
CALL truncate_if_exists('teaching_journals');

-- 4. Siswa & Keanggotaan Kelas
CALL truncate_if_exists('class_members');
CALL truncate_if_exists('students');

DROP PROCEDURE IF EXISTS truncate_if_exists;
SET FOREIGN_KEY_CHECKS = 1;
SQL_END

echo "✅ SELESAI! Seluruh Log Sanksi Aktif Siswa, Insiden Pelanggaran, Nilai, dan Data Siswa telah berhasil dibersihkan total dari database ${DB_NAME}."
