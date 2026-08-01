import { t } from "elysia";

export const GenerateReportCardDto = t.Object({
  studentId: t.Numeric({ error: "Student ID harus berupa angka" }),
  academicYearId: t.Numeric({ error: "Academic Year ID harus berupa angka" }),
  semester: t.Union([t.Literal("GANJIL"), t.Literal("GENAP")], { error: "Semester harus GANJIL atau GENAP" }),
});

export const GetReportCardQueryDto = t.Object({
  academicYearId: t.Numeric({ error: "Academic Year ID harus berupa angka" }),
  semester: t.Union([t.Literal("GANJIL"), t.Literal("GENAP")], { error: "Semester harus GANJIL atau GENAP" }),
});

export const GetAllReportCardsQueryDto = t.Object({
  classId: t.Optional(t.Numeric()),
  academicYearId: t.Optional(t.Numeric()),
  semester: t.Optional(t.Union([t.Literal("GANJIL"), t.Literal("GENAP")])),
  status: t.Optional(t.Union([t.Literal("DRAFT"), t.Literal("PUBLISHED")])),
});

export const UpdateNotesDto = t.Object({
  notes: t.String({ minLength: 1, error: "Catatan tidak boleh kosong" }),
});

export const AddAchievementDto = t.Object({
  title: t.String({ minLength: 1, error: "Judul prestasi tidak boleh kosong" }),
  level: t.Union([
    t.Literal("SCHOOL"),
    t.Literal("DISTRICT"),
    t.Literal("PROVINCE"),
    t.Literal("NATIONAL"),
    t.Literal("INTERNATIONAL"),
  ], { error: "Tingkat prestasi tidak valid" }),
  description: t.Optional(t.String()),
});

export const AddExtracurricularDto = t.Object({
  extracurricularId: t.Numeric({ error: "Extracurricular ID harus berupa angka" }),
  predicate: t.Union([
    t.Literal("A"),
    t.Literal("B"),
    t.Literal("C"),
    t.Literal("D"),
  ], { error: "Predikat ekskul tidak valid" }),
  description: t.Optional(t.String()),
});

export const AddP5ProjectDto = t.Object({
  theme: t.String({ minLength: 1, error: "Tema projek tidak boleh kosong" }),
  predicate: t.Union([
    t.Literal("SB"),
    t.Literal("B"),
    t.Literal("C"),
    t.Literal("PB"),
  ], { error: "Predikat P5 tidak valid" }),
  description: t.Optional(t.String()),
});
