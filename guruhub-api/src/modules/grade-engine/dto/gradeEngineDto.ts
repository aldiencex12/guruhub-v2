import { t } from "elysia";

export const CalculateStudentDto = t.Object({
  studentId: t.Numeric({ error: "Student ID harus berupa angka" }),
  subjectId: t.Numeric({ error: "Subject ID harus berupa angka" }),
  academicYearId: t.Numeric({ error: "Academic Year ID harus berupa angka" }),
});

export const CalculateClassDto = t.Object({
  classId: t.Numeric({ error: "Class ID harus berupa angka" }),
  subjectId: t.Numeric({ error: "Subject ID harus berupa angka" }),
  academicYearId: t.Numeric({ error: "Academic Year ID harus berupa angka" }),
});

export const GetStudentGradeQueryDto = t.Object({
  subjectId: t.Numeric({ error: "Subject ID harus berupa angka" }),
  academicYearId: t.Numeric({ error: "Academic Year ID harus berupa angka" }),
});
