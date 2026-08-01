import Link from "next/link";
import { ShieldX, ArrowLeft } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Akses Ditolak",
};

export default function ForbiddenPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
      <div className="text-center max-w-md px-6">
        <div className="flex justify-center mb-6">
          <div className="h-20 w-20 rounded-2xl bg-red-100 dark:bg-red-950/50 flex items-center justify-center">
            <ShieldX className="h-10 w-10 text-red-600 dark:text-red-400" />
          </div>
        </div>
        <h1 className="text-6xl font-bold text-gray-900 dark:text-gray-100 mb-2">403</h1>
        <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-3">Akses Ditolak</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-8">
          Anda tidak memiliki izin untuk mengakses halaman ini. Silakan hubungi administrator jika Anda merasa ini adalah kesalahan.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali ke Dashboard
        </Link>
      </div>
    </div>
  );
}
