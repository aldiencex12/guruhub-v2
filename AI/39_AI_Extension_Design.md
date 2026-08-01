# 39 — AI Extension Architecture Specification

## Module: Student Character & Discipline Management
**Author:** Lead Software Architect  
**Status:** DRAFT (Sprint 1.5)  
**Date:** 2026-07-25  

---

## 1. Architectural Mandate

Future AI features (such as student behavioral risk forecasting, AI counseling recommendations, and student character scoring) must be integrated via **Non-Intrusive Extension Hooks**.

The core domain service must never depend directly on machine learning models or external LLM API clients. Instead, AI services consume domain events and query feature extraction data ports asynchronously.

```
+---------------------+        emits Domain Events      +------------------------+
| Discipline Module   | ------------------------------> | AI Event Listener      |
+---------------------+                                 +------------------------+
                                                                     │
                                                                     ▼
                                                        +------------------------+
                                                        | Feature Extractor      |
                                                        +------------------------+
                                                                     │
                                                                     ▼
                                                        +------------------------+
                                                        | AI / LLM Engine        |
                                                        | (Risk & Rec Model)     |
                                                        +------------------------+
```

---

## 2. Telemetry & Feature Extraction Interface (`IAIFeatureExtractor`)

The AI engine extracts normalized student behavior vectors without polluting transactional repository queries:

```typescript
export interface StudentBehaviorVector {
  studentId: number;
  schoolId: number;
  academicYearId: number;
  totalViolationsCount: number;
  totalRewardsCount: number;
  netDemeritPoints: number;
  violationVelocity30Days: number; // Incident frequency in last 30 days
  topViolationCategory: string;
  mostFrequentIncidentTime: string; // Peak time of day
  recentSanctionsCount: number;
}
```

---

## 3. Targeted AI Extension Features

### 3.1 Student Behavioral Risk Predictor (`IBehaviorRiskModel`)
- **Objective:** Detect students exhibiting escalating demerit patterns before they cross severe sanction thresholds (e.g. SP-3 / Expulsion).
- **Execution:** A daily background job passes student behavior vectors through a classification model, calculating a `riskScore` (0.00 to 1.00) and flagging high-risk students on the BK Guidance Dashboard.

### 3.2 Automated AI Counseling Action Recommender (`ICounselingRecommender`)
- **Objective:** Provide counseling teachers (Guru BK) with tailored guidance strategies based on a student's historical violation profile and psychological indicators.
- **Execution:** When an incident is verified, an AI worker evaluates the incident description and student history, generating suggested counseling talking points (e.g. "Focus on anger management techniques", "Schedule parent-teacher conference").

### 3.3 Student Character Scoring Index (`ICharacterScoreCalculator`)
- **Objective:** Compute a holistic 360-degree Character Index (A/B/C/D grade) combining discipline demerits, positive rewards, attendance rates, and homeroom evaluations for report card inclusion.
