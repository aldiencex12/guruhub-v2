# 34 — Storage Service Design Specification

## Module: Student Character & Discipline Management
**Author:** Lead Software Architect  
**Status:** DRAFT (Sprint 1.5)  
**Date:** 2026-07-25  

---

## 1. Architectural Concept

Incident evidence (photos, video clips, voice notes) and signed sanction documents must be stored securely. The application must **never** hardcode local disk paths or assume a specific cloud provider.

The system uses a **Provider-Agnostic Storage Interface (`IStorageService`)**. The underlying driver is configured via environment variables without changing domain code.

```
                        +--------------------+
                        |  IStorageService   |
                        +--------------------+
                                  |
    +-----------------+-----------+-----------+-----------------+
    |                 |                       |                 |
    v                 v                       v                 v
+-------+      +-------------+        +---------------+  +--------------+
| Local |      | MinIO S3    |        | AWS S3 / R2   |  | Google Cloud |
+-------+      +-------------+        +---------------+  +--------------+
```

---

## 2. Storage Service Interface Definition

```typescript
export interface UploadFileOptions {
  schoolId: number;
  folder: "incidents" | "sanctions" | "evidence";
  filename: string;
  mimeType: string;
  buffer: Buffer;
}

export interface IStorageService {
  uploadFile(options: UploadFileOptions): Promise<{ path: string; key: string }>;
  getPresignedUrl(key: string, expiresInSeconds?: number): Promise<string>;
  deleteFile(key: string): Promise<boolean>;
}
```

---

## 3. Supported Storage Drivers

1. **`LocalStorageDriver`**: Saves files to the local file system (used in local development and offline environments).
2. **`MinIOS3StorageDriver`**: Self-hosted S3-compatible object storage (used in private school cloud deployments).
3. **`AWSS3StorageDriver` / `CloudflareR2Driver`**: High-availability cloud object storage for production multi-tenant scale.
4. **`GCSStorageDriver`**: Google Cloud Storage driver for GCP enterprise setups.

---

## 4. Security & Access Control Specifications

1. **Private by Default:** Files are stored in private buckets/folders (`acl: private`). Direct public access to attachment URLs is strictly blocked.
2. **Presigned Access URLs:** Attachment views dynamically generate temporary presigned URLs expiring in 15 minutes (`getPresignedUrl(key, 900)`).
3. **Strict MIME & Magic Byte Validation:** File uploads inspect magic bytes to prevent malicious script uploads (`.php`, `.sh`, `.exe`, `.html` wrapped as images). Max size is enforced at 10 MB per file.
4. **Tenant Namespace Isolation:** Object keys follow a strict multi-tenant prefix structure:  
   `tenants/school_{schoolId}/discipline/{folder}/{year}/{uuid}_{filename}`
