# 24 — API Contract Specification

## Module Name: Student Character & Discipline Management
**Author:** Lead Software Architect  
**Status:** DRAFT (Sprint 0)  
**Date:** 2026-07-25  

---

## 1. Global Request Requirements

Every API endpoint in this module requires the following headers:
- `Authorization: Bearer <accessToken>` (15-minute access token)
- `x-school-id: <schoolId>` (Tenant isolation ID)

---

## 2. API Endpoint Specifications

### 2.1 Configuration & Policies

#### 2.1.1 Get Discipline Policy
- **Path:** `GET /discipline/policy`
- **Authorization:** `SuperAdmin`, `SchoolAdmin`, `Principal`, `Teacher`, `HomeroomTeacher`
- **Request Parameters:** None
- **Response Example (200 OK):**
```json
{
  "success": true,
  "message": "Kebijakan disiplin berhasil diambil",
  "data": {
    "id": 1,
    "schoolId": 719,
    "pointResetCycle": "ACADEMIC_YEAR",
    "maxActivePoints": 100,
    "autoSanctionEnabled": true,
    "carryForwardPercentage": 0,
    "createdAt": "2026-07-25T15:00:00.000Z",
    "updatedAt": "2026-07-25T15:00:00.000Z"
  }
}
```

#### 2.1.2 Update Discipline Policy
- **Path:** `PUT /discipline/policy`
- **Authorization:** `SuperAdmin`, `SchoolAdmin`
- **Validation (Body):**
  - `pointResetCycle`: `ENUM('ACADEMIC_YEAR', 'SEMESTER', 'NEVER')` (Required)
  - `maxActivePoints`: `Integer` (Min: 10, Max: 1000)
  - `autoSanctionEnabled`: `Boolean`
  - `carryForwardPercentage`: `Integer` (Min: 0, Max: 100)
- **Response Example (200 OK):**
```json
{
  "success": true,
  "message": "Kebijakan disiplin berhasil diperbarui",
  "data": {
    "id": 1,
    "schoolId": 719,
    "pointResetCycle": "ACADEMIC_YEAR",
    "maxActivePoints": 150,
    "autoSanctionEnabled": true,
    "carryForwardPercentage": 10
  }
}
```

---

### 2.2 Categories & Types

#### 2.2.1 Get All Categories
- **Path:** `GET /discipline/categories`
- **Authorization:** `SuperAdmin`, `SchoolAdmin`, `Principal`, `Teacher`, `HomeroomTeacher`
- **Filtering Options (Query):**
  - `type`: `VIOLATION` or `REWARD`
  - `search`: string matching name or code
- **Response Example (200 OK):**
```json
{
  "success": true,
  "message": "Kategori disiplin berhasil diambil",
  "data": [
    {
      "id": 1,
      "schoolId": 719,
      "code": "CAT-PEL-01",
      "name": "Keterlambatan & Kehadiran",
      "type": "VIOLATION",
      "description": "Kategori terkait kedisiplinan kehadiran siswa"
    }
  ]
}
```

#### 2.2.2 Create Category
- **Path:** `POST /discipline/categories`
- **Authorization:** `SuperAdmin`, `SchoolAdmin`
- **Validation (Body):**
  - `code`: string (1-30 chars, alphanumeric)
  - `name`: string (1-255 chars)
  - `type`: `VIOLATION` or `REWARD`
  - `description`: optional string
- **Response Example (201 Created):**
```json
{
  "success": true,
  "message": "Kategori disiplin berhasil dibuat",
  "data": {
    "id": 5,
    "code": "CAT-PGR-01",
    "name": "Prestasi Akademik",
    "type": "REWARD",
    "description": "Penghargaan prestasi lomba akademik"
  }
}
```

#### 2.2.3 Get All Types
- **Path:** `GET /discipline/types`
- **Authorization:** `SuperAdmin`, `SchoolAdmin`, `Principal`, `Teacher`, `HomeroomTeacher`
- **Filtering Options (Query):**
  - `categoryId`: `Integer`
  - `search`: string matching name or code
- **Response Example (200 OK):**
```json
{
  "success": true,
  "message": "Tipe aturan disiplin berhasil diambil",
  "data": [
    {
      "id": 12,
      "schoolId": 719,
      "categoryId": 1,
      "code": "PEL-01",
      "name": "Terlambat Masuk Sekolah",
      "defaultPoints": 5,
      "description": "Siswa datang setelah bel masuk berbunyi"
    }
  ]
}
```

---

### 2.3 Incidents

#### 2.3.1 Create Incident Report
- **Path:** `POST /discipline/incidents`
- **Authorization:** `SuperAdmin`, `SchoolAdmin`, `Principal`, `Teacher`, `HomeroomTeacher`
- **Validation (Body):**
  - `incidentDate`: date string (YYYY-MM-DD, Required)
  - `incidentTime`: time string (HH:MM:SS, Optional)
  - `location`: string (Optional)
  - `description`: string (Required)
  - `students`: Array of Objects (Required, Min: 1)
    - `studentId`: `Integer` (Required)
    - `classId`: `Integer` (Required)
    - `academicYearId`: `Integer` (Required)
    - `disciplineTypeId`: `Integer` (Required)
    - `notes`: string (Optional)
  - `witnesses`: Array of Objects (Optional)
    - `userId`: `Integer` (Optional)
    - `witnessName`: string (Optional)
    - `witnessRole`: `TEACHER`, `STUDENT`, `STAFF`, or `OTHER`
    - `notes`: string (Optional)
  - `attachments`: Array of Objects (Optional)
    - `fileUrl`: string (Required)
    - `fileType`: `IMAGE`, `PDF`, or `VIDEO`
    - `fileName`: string (Optional)
    - `fileSize`: `Integer` (Optional)
- **Response Example (201 Created):**
```json
{
  "success": true,
  "message": "Laporan insiden disiplin berhasil dibuat",
  "data": {
    "id": 42,
    "schoolId": 719,
    "reporterUserId": 868,
    "incidentDate": "2026-07-25",
    "status": "PENDING"
  }
}
```

#### 2.3.2 List Incidents
- **Path:** `GET /discipline/incidents`
- **Authorization:** `SuperAdmin`, `SchoolAdmin`, `Principal`, `HomeroomTeacher`, `Teacher`
- **Filtering Options (Query):**
  - `status`: `DRAFT`, `PENDING`, `UNDER_REVIEW`, `VERIFIED`, `REJECTED`, `RESOLVED`
  - `studentId`: `Integer`
  - `reporterUserId`: `Integer`
  - `startDate`: YYYY-MM-DD
  - `endDate`: YYYY-MM-DD
  - `page`: `Integer` (Default: 1)
  - `limit`: `Integer` (Default: 10)
- **Response Example (200 OK):**
```json
{
  "success": true,
  "message": "Daftar insiden berhasil diambil",
  "data": [
    {
      "id": 42,
      "incidentDate": "2026-07-25",
      "location": "Kantin",
      "status": "PENDING",
      "reporterName": "Budi Santoso",
      "studentsCount": 1
    }
  ],
  "pagination": {
    "totalItems": 150,
    "totalPages": 15,
    "currentPage": 1,
    "limit": 10
  }
}
```

#### 2.3.3 Update Incident Status
- **Path:** `PUT /discipline/incidents/:id/status`
- **Authorization:** `SuperAdmin`, `SchoolAdmin`, `Principal`
- **Validation (Body):**
  - `status`: `PENDING`, `UNDER_REVIEW`, `VERIFIED`, `REJECTED`, `RESOLVED`
  - `notes`: string (Required if status is `REJECTED`)
- **Response Example (200 OK):**
```json
{
  "success": true,
  "message": "Status insiden berhasil diperbarui",
  "data": {
    "id": 42,
    "status": "VERIFIED",
    "handlerTeacherId": 869
  }
}
```

---

### 2.4 Sanction Thresholds & Logs

#### 2.4.1 Get Sanction Thresholds
- **Path:** `GET /discipline/thresholds`
- **Authorization:** `SuperAdmin`, `SchoolAdmin`, `Principal`
- **Response Example (200 OK):**
```json
{
  "success": true,
  "message": "Ambang batas sanksi berhasil diambil",
  "data": [
    {
      "id": 1,
      "schoolId": 719,
      "minPoints": 25,
      "sanctionName": "Surat Peringatan 1 (SP-1)",
      "actionRequired": "SURAT_PERINGATAN",
      "description": "Pemanggilan orang tua dan penerbitan SP-1"
    }
  ]
}
```

#### 2.4.2 Get Student Sanction Logs
- **Path:** `GET /discipline/sanctions`
- **Authorization:** `SuperAdmin`, `SchoolAdmin`, `Principal`, `HomeroomTeacher`
- **Filtering Options (Query):**
  - `studentId`: `Integer` (Required)
  - `status`: `PENDING`, `ACTIVE`, `COMPLETED`, `REVOKED`
- **Response Example (200 OK):**
```json
{
  "success": true,
  "message": "Log sanksi siswa berhasil diambil",
  "data": [
    {
      "id": 3,
      "studentId": 2368,
      "studentName": "Aditya Pratama",
      "sanctionType": "SURAT_PERINGATAN",
      "cumulativePoints": 25,
      "status": "PENDING",
      "createdAt": "2026-07-25T15:10:00.000Z"
    }
  ]
}
```

#### 2.4.3 Update Sanction Log Status
- **Path:** `PUT /discipline/sanctions/:id`
- **Authorization:** `SuperAdmin`, `SchoolAdmin`, `Principal`
- **Validation (Body):**
  - `status`: `ACTIVE`, `COMPLETED`, `REVOKED`
  - `documentUrl`: string (Optional, file upload path)
  - `notes`: string (Optional)
- **Response Example (200 OK):**
```json
{
  "success": true,
  "message": "Status sanksi siswa berhasil diperbarui",
  "data": {
    "id": 3,
    "status": "ACTIVE",
    "documentUrl": "https://storage.guruhub.id/sanctions/sp1_2368.pdf",
    "notes": "Surat SP-1 sudah diserahkan ke wali murid"
  }
}
```

---

## 3. Standard Error States

```json
{
  "success": false,
  "error": "Pesan deskripsi error dalam Bahasa Indonesia"
}
```

Common Error Codes returned:
- **400 Bad Request:** Validation failed or body parameters were missing/malformed.
- **401 Unauthorized:** Invalid token or expired session.
- **403 Forbidden:** Action not allowed for current role, or tenant isolation boundary violated.
- **404 Not Found:** Incident, student, or category ID does not exist.
- **409 Conflict:** Category/type code already exists.
