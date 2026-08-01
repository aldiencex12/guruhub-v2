import { t } from "elysia";

export const CreateAssessmentDto = t.Object({
  classId: t.Numeric({ 
    error: "Class ID harus berupa angka" 
  }),
  subjectId: t.Numeric({ 
    error: "Subject ID harus berupa angka" 
  }),
  teacherId: t.Numeric({ 
    error: "Teacher ID harus berupa angka" 
  }),
  academicYearId: t.Numeric({ 
    error: "Academic Year ID harus berupa angka" 
  }),
  categoryId: t.Numeric({ 
    error: "Category ID harus berupa angka" 
  }),
  title: t.String({ 
    minLength: 1,
    maxLength: 255,
    error: "Judul wajib diisi dan maksimal 255 karakter" 
  }),
  description: t.Optional(t.Nullable(t.String({ 
    error: "Deskripsi harus berupa string" 
  }))),
  assessmentType: t.Union([
    t.Literal("DAILY_TEST"),
    t.Literal("ASSIGNMENT"),
    t.Literal("PROJECT"),
    t.Literal("PRACTICAL"),
    t.Literal("MIDTERM"),
    t.Literal("FINAL")
  ], { 
    error: "Tipe asesmen tidak valid" 
  }),
  assessmentDate: t.String({ 
    pattern: "^\\d{4}-\\d{2}-\\d{2}$",
    error: "Format tanggal asesmen harus YYYY-MM-DD" 
  }),
  maxScore: t.Numeric({ 
    error: "Max score harus berupa angka" 
  }),
});

export const UpdateAssessmentDto = t.Partial(CreateAssessmentDto);

export const InputScoresDto = t.Object({
  scores: t.Array(
    t.Object({
      studentId: t.Numeric({ error: "Student ID harus berupa angka" }),
      score: t.Numeric({ error: "Score harus berupa angka" }),
      notes: t.Optional(t.Nullable(t.String({ error: "Catatan harus berupa string" }))),
    })
  )
});
