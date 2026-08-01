# 35 — Background Jobs Specification

## Module: Student Character & Discipline Management
**Author:** Lead Software Architect  
**Status:** DRAFT (Sprint 1.5)  
**Date:** 2026-07-25  

---

## 1. Architectural Concept

To prevent resource-intensive data processing from slowing down end-user HTTP requests, all heavy computations, automated policies, periodic summaries, and recurring tasks are executed as **Asynchronous Background Jobs**.

Jobs are managed by a distributed worker pool using BullMQ / Redis queues with locking mechanisms to prevent duplicate executions across multi-instance API deployments.

---

## 2. Background Job Directory

| Job Name | Trigger Type | Schedule / Frequency | Description |
| :--- | :--- | :--- | :--- |
| `Job:EvaluateSanctions` | Event / Queue | On-Demand (Async) | Evaluates active student points against thresholds off the main HTTP thread. |
| `Job:ResetPointCycle` | Cron | Scheduled (Annual/Semester) | Resets student point balances per policy rules at academic cycle boundary. |
| `Job:DailyDisciplineSummary`| Cron | Daily at 17:00 | Compiles daily violation summary emails for BK teachers and Principals. |
| `Job:WeeklyAnalyticsRollup` | Cron | Weekly (Sunday 02:00) | Pre-aggregates student risk metrics, heatmaps, and category statistics into data marts. |
| `Job:CalculateRiskScores` | Cron | Daily at 01:00 | Runs behavioral risk prediction algorithm across all active students. |

---

## 3. Detailed Job Specifications

### 3.1 Point Reset Cycle Processor (`Job:ResetPointCycle`)
- **Trigger:** Cron scheduler checks school policies daily at 00:00.
- **Operation:**
  1. Identifies schools whose `pointResetCycle` matches the current date.
  2. Iterates students, calculating carry-forward points based on `carryForwardPercentage`.
  3. Logs point reset transaction audit entries for every affected student.

### 3.2 Daily Discipline Digest (`Job:DailyDisciplineSummary`)
- **Trigger:** Daily at 17:00 server time.
- **Operation:**
  1. Aggregates all incidents reported and verified during the day per school.
  2. Generates an HTML/PDF daily digest report.
  3. Dispatches notifications to Homeroom Teachers, Counseling Staff, and Principals.

---

## 4. Multi-Instance Worker Safety

1. **Distributed Locks:** Uses Redlock / Redis mutexes (`lockKey: schoolId:jobName:date`) to ensure scheduled cron jobs run exactly once across horizontally scaled container replicas.
2. **Graceful Shutdown:** Workers handle `SIGTERM` signals by finishing active jobs before terminating, preventing corrupted or half-processed job states.
