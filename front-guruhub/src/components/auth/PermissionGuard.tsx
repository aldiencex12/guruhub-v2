"use client";

import type { ReactNode } from "react";
import { usePermissions } from "@/hooks/usePermissions";
import type { Role } from "@/types";

interface PermissionGuardProps {
  allowedRoles: Role[];
  children: ReactNode;
  fallback?: ReactNode;
}

export function PermissionGuard({
  allowedRoles,
  children,
  fallback = null,
}: PermissionGuardProps) {
  const { canAccess } = usePermissions();

  if (!canAccess(allowedRoles)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
