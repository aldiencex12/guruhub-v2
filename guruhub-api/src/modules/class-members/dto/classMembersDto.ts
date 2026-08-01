import { t } from "elysia";

export const CreateClassMemberDto = t.Object({
  classId: t.Numeric({ 
    error: "Class ID harus berupa angka" 
  }),
  studentId: t.Numeric({ 
    error: "Student ID harus berupa angka" 
  }),
  academicYearId: t.Optional(t.Numeric({ 
    error: "Academic Year ID harus berupa angka" 
  })),
  status: t.Optional(t.Union([
    t.Literal("ACTIVE"), t.Literal("INACTIVE"), t.Literal("GRADUATED"), t.Literal("TRANSFERRED")
  ], { 
    error: "Status harus bernilai ACTIVE, INACTIVE, GRADUATED, atau TRANSFERRED" 
  })),
});

export const UpdateClassMemberDto = t.Object({
  status: t.Union([
    t.Literal("ACTIVE"), t.Literal("INACTIVE"), t.Literal("GRADUATED"), t.Literal("TRANSFERRED")
  ], { 
    error: "Status harus bernilai ACTIVE, INACTIVE, GRADUATED, atau TRANSFERRED" 
  }),
});

export const PromoteStudentsDto = t.Object({
  sourceClassId: t.Number({ error: "Source Class ID harus berupa angka" }),
  targetClassId: t.Number({ error: "Target Class ID harus berupa angka" }),
  studentIds: t.Array(t.Number(), { error: "Student IDs harus berupa array angka" })
});
