# 29 — Infrastructure Architecture Review

## Module: Student Character & Discipline Management
**Author:** Lead Software Architect  
**Status:** DRAFT (Sprint 1.5)  
**Date:** 2026-07-25  

---

## 1. Executive Summary

A comprehensive architectural audit of the current Student Character & Discipline Management module was performed following the implementation of the core CRUD API endpoints. While the fundamental functional requirements and Clean Architecture layers (Route -> Controller -> Service -> Repository) are in place, the module currently exhibits several enterprise architecture anti-patterns that will impede 10-year scalability, auditability, and multi-tenant isolation under heavy production load.

---

## 2. Identified Architectural Smells & Deficiencies

### 2.1 Direct Coupling & Synchronous Execution
*   **Smell:** Business actions directly execute secondary concerns inline.
*   **Impact:** When an incident is verified, threshold calculation and sanction logging happen within the synchronous HTTP request-response cycle. Adding notifications (WhatsApp, Mobile Push, Email) inline will degrade API response latency from ~50ms to >1500ms and introduce single-point-of-failure risks.

### 2.2 Missing Storage Abstraction
*   **Smell:** File URLs are passed directly as plain strings (`fileUrl: string`) without presigned URL generation or underlying storage provider abstraction.
*   **Impact:** Tight coupling to local disk or arbitrary direct links prevents seamless migration to cloud object stores (MinIO, AWS S3, Cloudflare R2, GCP) and creates security vulnerabilities (unrestricted file uploads, SSRF).

### 2.3 Missing Permanent Audit System
*   **Smell:** Audit records are limited to `handlerTeacherId` and `updatedAt` on primary domain entities.
*   **Impact:** Inability to track historical state mutations (old value vs. new value), user IP, device context, or administrative policy changes over time. Regulatory compliance (e.g., school governance audits) cannot be fulfilled.

### 2.4 Lack of Unified Incident & Behavior Timeline Engine
*   **Smell:** Incident progression status (`PENDING -> VERIFIED -> RESOLVED`) is stored as a single mutable column without an event log table.
*   **Impact:** Users cannot inspect the chronological lifecycle of an incident (who verified it, when SP-1 was issued, when parents were notified, when sanctions were fulfilled).

### 2.5 Synchronous Heavy Point Aggregations
*   **Smell:** Student active point balance is computed dynamically on demand via multi-table `SUM()` and `CASE` join queries across historical incident records.
*   **Impact:** Query performance degrades linearly over 10 years as historical incident tables grow into millions of rows.

### 2.6 Missing Asynchronous Background Job System
*   **Smell:** Absence of a background task worker or job queue (e.g., BullMQ / Redis worker).
*   **Impact:** Automated tasks (e.g., periodic point reset cycles, monthly analytical rollups, automated parent notification retries, risk score re-calculations) cannot be executed off-the-main-thread.

### 2.7 Lack of Extension Points for AI & Predictive Analytics
*   **Smell:** Domain models do not provide telemetry hooks or feature extraction abstractions for machine learning models.
*   **Impact:** Integrating AI student behavior risk scoring, counseling recommendations, or early warning alerts will require intrusive rewrites of the core service layer.

---

## 3. Hardening Roadmap Summary

| Component | Current State | Hardened Target Architecture |
| :--- | :--- | :--- |
| **Messaging** | Synchronous method calls | Asynchronous Event-Driven Bus (`TypedEventEmitter`) |
| **Audit Log** | Mutable entity timestamps | Immutable Append-Only Audit Log (`discipline_audit_logs`) |
| **Incident History** | Status column only | Unified Chronological Timeline Engine (`discipline_incident_timelines`) |
| **Notifications** | None | Async Queue -> Background Worker Pipeline (Push, WA, Email) |
| **File Storage** | Plain URL strings | Provider-Agnostic Storage Service Interface (S3, R2, MinIO) |
| **Background Tasks**| Inline processing | Asynchronous Job Scheduler & Worker Pool |
| **Analytics** | On-demand SQL queries | Pre-aggregated Data Marts & Analytical Materialized Views |
