"use client";

import { create } from "zustand";

interface DisciplineUIStore {
  // Incident Approval Modal State
  isApprovalModalOpen: boolean;
  selectedIncidentId: number | null;
  selectedIncidentStatus: string | null;
  
  // Incident Detail Drawer State
  isDetailDrawerOpen: boolean;
  drawerIncidentId: number | null;
  
  // Student Quick Profile Drawer State
  isStudentDrawerOpen: boolean;
  drawerStudentId: number | null;

  // Actions
  openApprovalModal: (incidentId: number, status?: string) => void;
  closeApprovalModal: () => void;
  openDetailDrawer: (incidentId: number) => void;
  closeDetailDrawer: () => void;
  openStudentDrawer: (studentId: number) => void;
  closeStudentDrawer: () => void;
}

export const useDisciplineUIStore = create<DisciplineUIStore>((set) => ({
  isApprovalModalOpen: false,
  selectedIncidentId: null,
  selectedIncidentStatus: null,
  
  isDetailDrawerOpen: false,
  drawerIncidentId: null,

  isStudentDrawerOpen: false,
  drawerStudentId: null,

  openApprovalModal: (incidentId: number, status?: string) =>
    set({
      isApprovalModalOpen: true,
      selectedIncidentId: incidentId,
      selectedIncidentStatus: status || null,
    }),

  closeApprovalModal: () =>
    set({
      isApprovalModalOpen: false,
      selectedIncidentId: null,
      selectedIncidentStatus: null,
    }),

  openDetailDrawer: (incidentId: number) =>
    set({
      isDetailDrawerOpen: true,
      drawerIncidentId: incidentId,
    }),

  closeDetailDrawer: () =>
    set({
      isDetailDrawerOpen: false,
      drawerIncidentId: null,
    }),

  openStudentDrawer: (studentId: number) =>
    set({
      isStudentDrawerOpen: true,
      drawerStudentId: studentId,
    }),

  closeStudentDrawer: () =>
    set({
      isStudentDrawerOpen: false,
      drawerStudentId: null,
    }),
}));
