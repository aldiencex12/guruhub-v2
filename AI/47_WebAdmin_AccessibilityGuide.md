# 47 — Web Admin Accessibility (a11y) & Keyboard Specification

## Module: Student Character & Discipline Management (Web Admin)
**Author:** Lead Product Designer & Senior Frontend Architect  
**Status:** DRAFT (Sprint 2)  
**Date:** 2026-07-25  

---

## 1. Compliance Standard

The Web Admin user interface is designed to meet **WCAG 2.1 Level AA Accessibility Standards**, ensuring full usability for users with visual impairments, motor constraints, or screen readers.

---

## 2. Keyboard Navigation & Shortcut Registry

| Shortcut Combo | Global / Context Scope | Target Action |
| :--- | :--- | :--- |
| `Cmd / Ctrl + K` | Global | Focus Global Student & Incident Search Bar |
| `Cmd / Ctrl + Enter` | Incident Detail Modal | Approve / Verify Incident Report |
| `Esc` | Modal / Drawer | Close active modal, light-box, or slide-over drawer |
| `Tab / Shift + Tab` | All Forms | Navigate sequentially through input focus rings |
| `J / K` | Data Table | Navigate up / down table rows in keyboard mode |

---

## 3. ARIA & Screen Reader Standards

1. **Live Regions (`aria-live="polite"`):** Status badge transitions and toast notifications use `aria-live="polite"` so screen readers announce verification state changes without interrupting active voice output.
2. **Modal Focus Traps (`role="dialog"`):** `ApprovalDialog` and `StudentSelectorModal` enforce focus trapping (`aria-modal="true"`), preventing tab focus from slipping behind the overlay.
3. **Contrast Ratios:** All text elements adhere to a minimum contrast ratio of `4.5:1` against their background. Badge pills with status colors maintain high contrast text overlays.
