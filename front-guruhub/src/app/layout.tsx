import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/providers";

export const metadata: Metadata = {
  title: {
    default: "GuruHub — Platform Manajemen Sekolah",
    template: "%s | GuruHub",
  },
  description:
    "GuruHub adalah platform digital manajemen sekolah untuk guru, siswa, dan administrasi sekolah.",
  keywords: ["sekolah", "manajemen", "guru", "siswa", "rapor", "absensi"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
