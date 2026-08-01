import { useQuery } from "@tanstack/react-query";
import { dashboardService } from "@/services/dashboard";

export function useDashboardSummary() {
  return useQuery({
    queryKey: ["dashboard-summary"],
    queryFn: () => dashboardService.getSummary(),
  });
}

export function useAcademicYears() {
  return useQuery({
    queryKey: ["academic-years"],
    queryFn: () => dashboardService.getAcademicYears(),
  });
}

export function useDashboardAttendance() {
  return useQuery({
    queryKey: ["dashboard-attendance"],
    queryFn: () => dashboardService.getAttendance(),
  });
}

export function useDashboardActivities() {
  return useQuery({
    queryKey: ["dashboard-activities"],
    queryFn: () => dashboardService.getActivities(),
  });
}

export function useDashboardPendingTasks() {
  return useQuery({
    queryKey: ["dashboard-pending-tasks"],
    queryFn: () => dashboardService.getPendingTasks(),
  });
}

export function useDashboardStudentHighlights() {
  return useQuery({
    queryKey: ["dashboard-student-highlights"],
    queryFn: () => dashboardService.getStudentHighlights(),
  });
}
