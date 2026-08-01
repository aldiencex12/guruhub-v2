# 45 — Web Admin Design System & Token Specifications

## Module: Student Character & Discipline Management (Web Admin)
**Author:** Lead Product Designer & Senior Frontend Architect  
**Status:** DRAFT (Sprint 2)  
**Date:** 2026-07-25  

---

## 1. Design Philosophy

The GuruHub Design System delivers a **Premium, State-of-the-Art Enterprise Aesthetics**. It balances high-density data views with generous whitespace, subtle micro-animations, glassmorphic card overlays, and curated color palettes designed for long administrative working sessions.

---

## 2. Color Tokens (Light & Dark Mode)

### 2.1 Primary & Neutral Palette

```css
:root {
  /* Brand Primary: Deep Indigo */
  --primary: hsl(239 84% 67%);
  --primary-foreground: hsl(0 0% 100%);
  
  /* Backgrounds */
  --bg-light: hsl(220 14% 96%);
  --surface-light: hsl(0 0% 100%);
  --border-light: hsl(220 13% 91%);
  
  /* Dark Mode Surfaces */
  --bg-dark: hsl(224 71% 4%);
  --surface-dark: hsl(224 71% 7%);
  --border-dark: hsl(215 27.9% 16.9%);
}
```

### 2.2 Domain Status Color Mapping

| Status / Metric | Light Mode Color Token | Dark Mode Color Token | Visual Purpose |
| :--- | :--- | :--- | :--- |
| **`PENDING`** | Amber (`hsl(38 92% 50%)`) | Amber Dark (`hsl(45 93% 47%)`) | Requires review attention |
| **`UNDER_REVIEW`**| Sky Blue (`hsl(199 89% 48%)`) | Sky Blue (`hsl(199 89% 58%)`) | Currently being processed |
| **`VERIFIED`** | Emerald (`hsl(142 76% 36%)`) | Emerald (`hsl(142 70% 45%)`) | Approved incident / reward |
| **`REJECTED`** | Rose (`hsl(346 87% 53%)`) | Rose (`hsl(346 87% 65%)`) | Dismissed report |
| **`VIOLATION`** | Ruby Red (`hsl(0 84% 60%)`) | Ruby Red (`hsl(0 84% 70%)`) | Demerit point badge |
| **`REWARD`** | Teal (`hsl(168 76% 42%)`) | Teal (`hsl(168 70% 50%)`) | Positive reward badge |

---

## 3. Typography Scale (Inter / Outfit)

- **Display Header (`H1`):** `32px / 2.25rem`, Weight: 700 (Bold), Letter Spacing: `-0.02em`.
- **Page Header (`H2`):** `24px / 1.5rem`, Weight: 600 (SemiBold), Letter Spacing: `-0.01em`.
- **Section Title (`H3`):** `18px / 1.125rem`, Weight: 600 (SemiBold).
- **Body Regular:** `14px / 0.875rem`, Weight: 400 (Normal), Line Height: `1.5`.
- **Caption & Badges:** `12px / 0.75rem`, Weight: 500 (Medium), Letter Spacing: `0.05em` uppercase.

---

## 4. Micro-Animations & Transitions

- **Hover Elevation:** `transition: transform 150ms cubic-bezier(0.4, 0, 0.2, 1), box-shadow 150ms ease-in-out`.
- **Badge Pulse:** Pulsing ring effect for `HIGH` and `CRITICAL` risk indicators (`animation: pulse 2s infinite`).
- **Drawer Slide-Over:** `transform: translateX(0)` with `300ms cubic-bezier(0.16, 1, 0.3, 1)` easing.
