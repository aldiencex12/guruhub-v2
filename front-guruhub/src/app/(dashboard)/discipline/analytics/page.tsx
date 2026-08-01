"use client";

import { useQuery } from "@tanstack/react-query";
import { disciplineService } from "@/services/discipline";
import { disciplineKeys } from "@/queries/discipline.query";
import { PageHeader } from "@/components/core/PageHeader";
import { SectionCard } from "@/components/core/SectionCard";
import { LoadingState } from "@/components/core/LoadingState";
import { ErrorState } from "@/components/core/ErrorState";
import { EmptyState } from "@/components/core/EmptyState";
import { TrendingUp, BarChart2, ShieldAlert } from "lucide-react";

export default function DisciplineAnalyticsPage() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: disciplineKeys.analytics({}),
    queryFn: async () => {
      const res = await disciplineService.getAnalytics();
      return res.data || res;
    },
  });

  const totalIncidents = data?.totalIncidents ?? 0;
  const topCategoryName = data?.topCategoryName || "Belum Ada Data";
  const topCategoryPercentage = data?.topCategoryPercentage ?? 0;
  const highRiskStudentsCount = data?.highRiskStudentsCount ?? 0;
  const categoriesDistribution: any[] = data?.categoriesDistribution || [];

  const barColors = ["bg-indigo-600", "bg-amber-500", "bg-orange-500", "bg-rose-500", "bg-emerald-500", "bg-sky-500"];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analitik Karakter & Kedisiplinan Siswa"
        description="Laporan visual tren insiden harian, distribusi kategori pelanggaran, dan pemetaan tingkat risiko."
      />

      {/* Analytics Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SectionCard title="Total Insiden" subtitle="Total laporan pelanggaran tercatat">
          <div className="flex items-center justify-between pt-2">
            <div>
              <span className="text-3xl font-bold text-foreground">{totalIncidents}</span>
              <p className="text-xs text-muted-foreground mt-1">
                Laporan insiden dalam sistem
              </p>
            </div>
            <div className="h-12 w-12 rounded-lg bg-indigo-500/10 text-indigo-600 flex items-center justify-center">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Pelanggaran Terbanyak" subtitle="Kategori insiden paling sering dilaporkan">
          <div className="flex items-center justify-between pt-2">
            <div>
              <span className="text-lg font-bold text-foreground">{topCategoryName}</span>
              <p className="text-xs text-muted-foreground mt-1">
                {topCategoryPercentage}% dari total laporan
              </p>
            </div>
            <div className="h-12 w-12 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <BarChart2 className="w-6 h-6" />
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Tingkat Risiko Siswa" subtitle="Distribusi siswa berdasarkan akumulasi poin">
          <div className="flex items-center justify-between pt-2">
            <div>
              <span className="text-lg font-bold text-rose-600 dark:text-rose-400">
                {highRiskStudentsCount} Siswa Risiko SP
              </span>
              <p className="text-xs text-muted-foreground mt-1">Akumulasi poin &ge; 50</p>
            </div>
            <div className="h-12 w-12 rounded-lg bg-rose-500/10 text-rose-600 flex items-center justify-center">
              <ShieldAlert className="w-6 h-6" />
            </div>
          </div>
        </SectionCard>
      </div>

      <SectionCard title="Distribusi Kategori Pelanggaran">
        {isLoading ? (
          <LoadingState message="Memuat analitik data..." rows={3} />
        ) : isError ? (
          <ErrorState onRetry={refetch} />
        ) : categoriesDistribution.length === 0 ? (
          <EmptyState
            title="Belum Ada Data Analitik"
            description="Belum ada insiden terdaftar untuk menghitung distribusi kategori."
          />
        ) : (
          <div className="space-y-4 pt-2">
            {categoriesDistribution.map((item, idx) => {
              const color = barColors[idx % barColors.length];
              return (
                <div key={item.category} className="space-y-1">
                  <div className="flex justify-between text-xs font-medium">
                    <span>{item.category} ({item.count || 0} Insiden)</span>
                    <span className="text-muted-foreground">{item.percentage}%</span>
                  </div>
                  <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full ${color} rounded-full transition-all duration-500`}
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </SectionCard>
    </div>
  );
}
