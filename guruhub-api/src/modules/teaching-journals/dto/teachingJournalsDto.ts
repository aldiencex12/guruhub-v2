import { t } from "elysia";

export const CreateTeachingJournalDto = t.Object({
  scheduleId: t.Numeric({ 
    error: "Schedule ID harus berupa angka" 
  }),
  teacherId: t.Numeric({ 
    error: "Teacher ID harus berupa angka" 
  }),
  attendanceId: t.Optional(t.Nullable(t.Numeric({ 
    error: "Attendance ID harus berupa angka" 
  }))),
  journalDate: t.String({ 
    pattern: "^\\d{4}-\\d{2}-\\d{2}$",
    error: "Format tanggal jurnal harus YYYY-MM-DD" 
  }),
  topic: t.String({ 
    minLength: 1,
    maxLength: 255,
    error: "Topik wajib diisi dan maksimal 255 karakter" 
  }),
  learningObjectives: t.String({ 
    minLength: 1,
    error: "Tujuan pembelajaran wajib diisi" 
  }),
  teachingMethod: t.String({ 
    minLength: 1,
    maxLength: 255,
    error: "Metode pembelajaran wajib diisi dan maksimal 255 karakter" 
  }),
  reflection: t.Optional(t.Nullable(t.String({ 
    error: "Refleksi harus berupa string" 
  }))),
  notes: t.Optional(t.Nullable(t.String({ 
    error: "Catatan harus berupa string" 
  }))),
});

export const UpdateTeachingJournalDto = t.Partial(CreateTeachingJournalDto);
