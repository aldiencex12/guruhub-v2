# 68 — Screen Transition Map Specification

## Module: Student Character & Discipline Management
**Author:** Chief Product Designer & UX Architect  
**Status:** DRAFT (Sprint 2.9)  
**Date:** 2026-07-25  

---

## 1. Global Navigation State & Transition Diagram

```mermaid
graph LR
    Dashboard[/discipline/dashboard] -->|Click Incident Row| IncidentDetail[/discipline/incidents/42]
    Dashboard -->|Click Student Card| StudentProfile[/discipline/students/105]
    Dashboard -->|Click Quick Verify| ApprovalModal[Approval Dialog Overlay]
    
    IncidentsList[/discipline/incidents] -->|Click Row| IncidentDrawer[Slide-Over Detail Drawer]
    IncidentDrawer -->|Click View Full| IncidentDetail
    IncidentDetail -->|Click Student Tag| StudentProfile
    
    StudentProfile -->|Click SP Letter| SanctionPDFModal[PDF Lightbox Viewer]
    StudentProfile -->|Click Add BK Log| CounselingModal[BK Session Editor Modal]
    
    SanctionsList[/discipline/sanctions] -->|Click Rule| PolicySettings[/discipline/policies]
```

---

## 2. Transition Animations & Micro-Interactions

- **Slide-Over Drawer:** Enters from right edge with `300ms cubic-bezier(0.16, 1, 0.3, 1)` transform.
- **Modal Overlay Backdrop:** Fades in with `200ms ease-out` backdrop opacity (`bg-black/50`).
- **Tab State Transitions:** Horizontal slide underline effect moving between tabs on Student 360 profile.
- **Optimistic Badge Morph:** Status badge smoothly transitions color from Amber (`PENDING`) to Emerald (`VERIFIED`) upon verification submit.
