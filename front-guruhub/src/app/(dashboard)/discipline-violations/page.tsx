"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DisciplineViolationsRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/discipline/incidents");
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <p className="text-xs text-muted-foreground animate-pulse">
        Mengalihkan ke Catatan & Manajemen Pelanggaran...
      </p>
    </div>
  );
}
