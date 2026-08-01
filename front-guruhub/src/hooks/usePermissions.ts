"use client";

import { useAuthStore } from "@/store/auth.store";
import type { Role } from "@/types";

export function usePermissions() {
  const currentUser = useAuthStore((state) => state.currentUser);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const hasRole = useAuthStore((state) => state.hasRole);
  const canAccess = useAuthStore((state) => state.canAccess);

  const role = currentUser?.role || null;
  const isSuperAdmin = role === "SuperAdmin";
  const isSchoolAdmin = role === "SchoolAdmin";
  const isPrincipal = role === "Principal";
  const isTeacher = role === "Teacher";
  const isHomeroom = role === "HomeroomTeacher";
  const isStudent = role === "Student";

  const isManagement = isSuperAdmin || isSchoolAdmin || isPrincipal;
  const canVerifyIncidents = isSuperAdmin || isSchoolAdmin || isPrincipal;
  const canManagePolicies = isSuperAdmin || isSchoolAdmin;
  const canViewCounselingNotes = isSuperAdmin || isSchoolAdmin || isPrincipal;

  return {
    currentUser,
    isAuthenticated,
    role,
    isSuperAdmin,
    isSchoolAdmin,
    isPrincipal,
    isTeacher,
    isHomeroom,
    isStudent,
    isManagement,
    canVerifyIncidents,
    canManagePolicies,
    canViewCounselingNotes,
    hasRole,
    canAccess: (allowedRoles: Role[]) => canAccess(allowedRoles),
  };
}
