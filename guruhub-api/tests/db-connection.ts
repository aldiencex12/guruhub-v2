// @ts-nocheck
import { db } from "../src/db/index";
import { schools } from "../src/schema/schools";

try {
  console.log("Menghubungkan ke database dan menguji query...");
  
  // Masukkan data sekolah uji coba
  console.log("Menyisipkan data sekolah...");
  await db.insert(schools).values({
    npsn: "12345678",
    name: "SMP Negeri 1 Jakarta",
    level: "SMP",
    status: "Negeri",
  });

  const allSchools = await db.select().from(schools);
  console.log("Query berhasil! Daftar sekolah:");
  console.log(allSchools);

  // Bersihkan data sekolah uji coba
  console.log("Membersihkan data uji coba...");
  await db.delete(schools);

  console.log("Semua pengujian database sukses!");
  process.exit(0);
} catch (error: any) {
  console.error("Pengujian database gagal:", error.message);
  process.exit(1);
}
