import type { ReactNode } from "react";

export const metadata = {
  title: "Manajemen Karakter & Kedisiplinan Siswa | GuruHub",
  description: "Modul pengelolaan insiden pelanggaran, sanksi SP, bimbingan konseling, dan analitik karakter siswa GuruHub.",
};

export default function DisciplineLayout({ children }: { children: ReactNode }) {
  return (
    <div className="w-full h-full p-4 md:p-6 lg:p-8 space-y-6">
      {children}
    </div>
  );
}
