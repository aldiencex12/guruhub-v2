export type IncidentStatus = "PENDING" | "UNDER_REVIEW" | "VERIFIED" | "REJECTED" | "RESOLVED";

export function formatStatus(status: string): { label: string; variant: "default" | "secondary" | "destructive" | "outline" | "success" | "warning" } {
  switch (status?.toUpperCase()) {
    case "PENDING":
      return { label: "Menunggu Verifikasi", variant: "warning" };
    case "UNDER_REVIEW":
      return { label: "Sedang Ditinjau", variant: "secondary" };
    case "VERIFIED":
      return { label: "Terverifikasi", variant: "destructive" };
    case "REJECTED":
      return { label: "Ditolak", variant: "outline" };
    case "RESOLVED":
      return { label: "Selesai", variant: "success" };
    default:
      return { label: status || "Unknown", variant: "outline" };
  }
}

export function formatPoints(points: number, isReward: boolean = false): string {
  if (isReward || points < 0) {
    return `${points} Poin`;
  }
  return `+${points} Poin`;
}

export function formatDate(dateString?: string | Date): string {
  if (!dateString) return "-";
  
  if (typeof dateString === "string") {
    const cleanDateStr = dateString.split("T")[0];
    const parts = cleanDateStr.split("-");
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
        return new Intl.DateTimeFormat("id-ID", {
          day: "numeric",
          month: "long",
          year: "numeric",
        }).format(new Date(year, month, day));
      }
    }
  }

  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "-";
  
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

export function getRiskLevelColor(activePoints: number): { level: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"; label: string; badgeClass: string } {
  if (activePoints >= 75) {
    return { level: "CRITICAL", label: "Tinggi (SP-3)", badgeClass: "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30" };
  }
  if (activePoints >= 50) {
    return { level: "HIGH", label: "Sedang (SP-2)", badgeClass: "bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/30" };
  }
  if (activePoints >= 25) {
    return { level: "MEDIUM", label: "Peringatan (SP-1)", badgeClass: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30" };
  }
  return { level: "LOW", label: "Normal", badgeClass: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30" };
}
