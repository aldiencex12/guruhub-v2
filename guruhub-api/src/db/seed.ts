import { db } from "./index";
import { sql } from "drizzle-orm";

async function seed() {
  console.log("Ensuring discipline preset data without deleting master data...");

  // Safely seed default policy, categories, types, and thresholds for existing schools
  const schoolsList: any = await db.execute(sql`SELECT id FROM schools;`);
  const rows = Array.isArray(schoolsList[0]) ? schoolsList[0] : schoolsList;

  for (const school of rows as any[]) {
    const schoolId = school.id;

    // Policy
    await db.execute(sql`
      INSERT INTO discipline_policies (school_id, point_reset_cycle, max_active_points, auto_sanction_enabled, carry_forward_percentage)
      VALUES (${schoolId}, 'ACADEMIC_YEAR', 100, true, 0)
      ON DUPLICATE KEY UPDATE auto_sanction_enabled = true;
    `);

    // Categories
    const categoriesData = [
      { code: "CAT-RINGAN", name: "Pelanggaran Ringan", type: "VIOLATION", desc: "Pelanggaran tata tertib umum tingkat ringan" },
      { code: "CAT-SEDANG", name: "Pelanggaran Sedang", type: "VIOLATION", desc: "Pelanggaran tata tertib tingkat sedang yang memerlukan perhatian khusus" },
      { code: "CAT-BERAT", name: "Pelanggaran Berat", type: "VIOLATION", desc: "Pelanggaran berat yang berdampak pada tindakan disiplin ketat" },
      { code: "CAT-REWARD", name: "Penghargaan & Prestasi", type: "REWARD", desc: "Apresiasi atas pencapaian dan perilaku terpuji siswa" },
    ];

    for (const cat of categoriesData) {
      await db.execute(sql`
        INSERT INTO discipline_categories (school_id, code, name, type, description)
        VALUES (${schoolId}, ${cat.code}, ${cat.name}, ${cat.type}, ${cat.desc})
        ON DUPLICATE KEY UPDATE name = VALUES(name);
      `);
    }

    // 15 Sanction Thresholds
    const thresholds = [
      [schoolId, 5, "TEGURAN 1", "PEMBINAAN_BK", "Teguran langsung (tertulis/tidak tertulis)"],
      [schoolId, 10, "TEGURAN 2", "PEMBINAAN_BK", "Melakukan pembinaan murid untuk menjadi Inspektur Apel"],
      [schoolId, 15, "TEGURAN 3", "PEMBINAAN_BK", "Melakukan pembinaan murid untuk menjadi kultum dan teks"],
      [schoolId, 20, "PANGGILAN ORANG TUA 1", "PANGGILAN_ORANG_TUA", "Konsekuensi HP disimpan sekolah selama sehari, diambil saat pemanggilan Orang tua/Wali siswa"],
      [schoolId, 30, "PANGGILAN ORANG TUA 1", "PANGGILAN_ORANG_TUA", "Konsekuensi HP disimpan sekolah selama sehari, diambil saat pemanggilan Orang tua/Wali siswa"],
      [schoolId, 40, "PANGGILAN ORANG TUA 1", "PANGGILAN_ORANG_TUA", "Konsekuensi HP disimpan sekolah selama sehari, diambil saat pemanggilan Orang tua/Wali siswa"],
      [schoolId, 45, "PANGGILAN ORANG TUA 1", "PANGGILAN_ORANG_TUA", "Konsekuensi HP disimpan sekolah selama sehari, diambil saat pemanggilan Orang tua/Wali siswa"],
      [schoolId, 50, "PANGGILAN ORANG TUA 2", "PANGGILAN_ORANG_TUA", "Konsekuensi HP disimpan sekolah selama 3 hari, diambil setelah pemanggilan Orang tua/Wali siswa"],
      [schoolId, 60, "PANGGILAN ORANG TUA 2", "PANGGILAN_ORANG_TUA", "Konsekuensi HP disimpan sekolah selama 3 hari, diambil setelah pemanggilan Orang tua/Wali siswa"],
      [schoolId, 70, "PANGGILAN ORANG TUA 2", "PANGGILAN_ORANG_TUA", "Konsekuensi HP disimpan sekolah selama 3 hari, diambil setelah pemanggilan Orang tua/Wali siswa"],
      [schoolId, 75, "PANGGILAN ORANG TUA 2", "PANGGILAN_ORANG_TUA", "Konsekuensi HP disimpan sekolah selama 3 hari, diambil setelah pemanggilan Orang tua/Wali siswa"],
      [schoolId, 80, "PANGGILAN ORANG TUA 3 (BERMATERAI)", "SURAT_PERINGATAN", "Konsekuensi HP disimpan sekolah selama 7 hari, diambil setelah pemanggilan Orang tua/Wali siswa"],
      [schoolId, 90, "PANGGILAN ORANG TUA 3 (BERMATERAI)", "SURAT_PERINGATAN", "Konsekuensi HP disimpan sekolah selama 7 hari, diambil setelah pemanggilan Orang tua/Wali siswa"],
      [schoolId, 95, "PANGGILAN ORANG TUA 3 (BERMATERAI)", "SURAT_PERINGATAN", "Konsekuensi HP disimpan sekolah selama 7 hari, diambil setelah pemanggilan Orang tua/Wali siswa"],
      [schoolId, 100, "DIKEMBALIKAN KEPADA ORANG TUA", "DIKELUARKAN", "Drop-Out"],
    ];

    for (const t of thresholds) {
      await db.execute(sql`
        INSERT INTO discipline_sanction_thresholds (school_id, min_points, sanction_name, action_required, description)
        VALUES (${t[0]}, ${t[1]}, ${t[2]}, ${t[3]}, ${t[4]})
        ON DUPLICATE KEY UPDATE sanction_name = VALUES(sanction_name);
      `);
    }
  }

  console.log("Safe discipline preset seeding complete.");
}

seed().catch(console.error);
