import { t } from "elysia";

// 1. Policies
export const UpdatePolicyDto = t.Object({
  pointResetCycle: t.Union([
    t.Literal("ACADEMIC_YEAR"),
    t.Literal("SEMESTER"),
    t.Literal("NEVER")
  ], { error: "Siklus reset poin harus berupa ACADEMIC_YEAR, SEMESTER, atau NEVER" }),
  maxActivePoints: t.Optional(t.Number({ minimum: 10, maximum: 1000, error: "Batas poin harus antara 10 dan 1000" })),
  autoSanctionEnabled: t.Optional(t.Boolean()),
  carryForwardPercentage: t.Optional(t.Number({ minimum: 0, maximum: 100, error: "Persentase harus antara 0 dan 100" }))
});

// 2. Categories
export const CreateCategoryDto = t.Object({
  code: t.String({ minLength: 1, maxLength: 30, error: "Kode wajib diisi (Maksimal 30 karakter)" }),
  name: t.String({ minLength: 1, maxLength: 255, error: "Nama kategori wajib diisi" }),
  type: t.Union([
    t.Literal("VIOLATION"),
    t.Literal("REWARD")
  ], { error: "Tipe harus VIOLATION atau REWARD" }),
  description: t.Optional(t.String())
});

export const UpdateCategoryDto = t.Object({
  name: t.Optional(t.String({ minLength: 1, maxLength: 255 })),
  type: t.Optional(t.Union([t.Literal("VIOLATION"), t.Literal("REWARD")])),
  description: t.Optional(t.String())
});

export const CategoryFilterQuery = t.Object({
  type: t.Optional(t.Union([t.Literal("VIOLATION"), t.Literal("REWARD")])),
  search: t.Optional(t.String())
});

// 3. Types
export const CreateDisciplineTypeDto = t.Object({
  categoryId: t.Number({ error: "ID Kategori wajib diisi" }),
  code: t.String({ minLength: 1, maxLength: 30, error: "Kode wajib diisi (Maksimal 30 karakter)" }),
  name: t.String({ minLength: 1, maxLength: 255, error: "Nama tipe wajib diisi" }),
  defaultPoints: t.Number({ minimum: 0, error: "Poin default harus positif atau nol" }),
  description: t.Optional(t.String())
});

export const TypeFilterQuery = t.Object({
  categoryId: t.Optional(t.Numeric()),
  search: t.Optional(t.String())
});

export const UpdateDisciplineTypeDto = t.Object({
  categoryId: t.Optional(t.Number()),
  name: t.Optional(t.String({ minLength: 1, maxLength: 255 })),
  defaultPoints: t.Optional(t.Number({ minimum: 0 })),
  description: t.Optional(t.String())
});

// 4. Incidents
export const CreateIncidentDto = t.Object({
  incidentDate: t.String({ format: "date", error: "Format tanggal tidak valid (YYYY-MM-DD)" }),
  incidentTime: t.Optional(t.String()),
  location: t.Optional(t.String({ maxLength: 255 })),
  description: t.String({ minLength: 1, error: "Deskripsi wajib diisi" }),
  students: t.Array(t.Object({
    studentId: t.Number(),
    classId: t.Optional(t.Number()),
    academicYearId: t.Optional(t.Number()),
    disciplineTypeId: t.Number(),
    notes: t.Optional(t.String())
  }), { minItems: 1, error: "Minimal harus ada satu siswa yang terlibat" }),
  witnesses: t.Optional(t.Array(t.Object({
    userId: t.Optional(t.Number()),
    witnessName: t.Optional(t.String()),
    witnessRole: t.Union([
      t.Literal("TEACHER"),
      t.Literal("STUDENT"),
      t.Literal("STAFF"),
      t.Literal("OTHER")
    ]),
    notes: t.Optional(t.String())
  }))),
  attachments: t.Optional(t.Array(t.Object({
    fileUrl: t.String(),
    fileType: t.Union([
      t.Literal("IMAGE"),
      t.Literal("PDF"),
      t.Literal("VIDEO")
    ]),
    fileName: t.Optional(t.String()),
    fileSize: t.Optional(t.Number())
  })))
});

export const IncidentFilterQuery = t.Object({
  status: t.Optional(t.Union([
    t.Literal("DRAFT"),
    t.Literal("PENDING"),
    t.Literal("UNDER_REVIEW"),
    t.Literal("VERIFIED"),
    t.Literal("REJECTED"),
    t.Literal("CANCELLED"),
    t.Literal("RESOLVED")
  ])),
  studentId: t.Optional(t.Numeric()),
  reporterUserId: t.Optional(t.Numeric()),
  startDate: t.Optional(t.String()),
  endDate: t.Optional(t.String()),
  page: t.Optional(t.Numeric()),
  limit: t.Optional(t.Numeric())
});

export const UpdateIncidentStatusDto = t.Object({
  status: t.Union([
    t.Literal("PENDING"),
    t.Literal("UNDER_REVIEW"),
    t.Literal("VERIFIED"),
    t.Literal("REJECTED"),
    t.Literal("RESOLVED")
  ], { error: "Status insiden tidak valid" }),
  notes: t.Optional(t.String())
});

// 5. Sanctions
export const SanctionLogFilterQuery = t.Object({
  studentId: t.Optional(t.Numeric()),
  status: t.Optional(t.Union([
    t.Literal("PENDING"),
    t.Literal("ACTIVE"),
    t.Literal("COMPLETED"),
    t.Literal("REVOKED")
  ]))
});

export const UpdateSanctionStatusDto = t.Object({
  status: t.Union([
    t.Literal("PENDING"),
    t.Literal("ACTIVE"),
    t.Literal("COMPLETED"),
    t.Literal("REVOKED")
  ], { error: "Status sanksi tidak valid" }),
  documentUrl: t.Optional(t.String()),
  notes: t.Optional(t.String())
});

// 6. Thresholds
export const UpdateThresholdDto = t.Object({
  minPoints: t.Number({ minimum: 1, maximum: 9999, error: "Minimum poin harus antara 1-9999" }),
  label: t.Optional(t.String({ maxLength: 100 })),
  actionRequired: t.String({ minLength: 1, maxLength: 100, error: "Tindakan wajib diisi" }),
  description: t.Optional(t.String({ maxLength: 500 }))
});

export const CreateThresholdDto = t.Object({
  minPoints: t.Number({ minimum: 1, maximum: 9999, error: "Minimum poin harus antara 1-9999" }),
  label: t.Optional(t.String({ maxLength: 100 })),
  actionRequired: t.String({ minLength: 1, maxLength: 100, error: "Tindakan wajib diisi" }),
  description: t.Optional(t.String({ maxLength: 500 }))
});

