import { t } from "elysia";

export const CreateAcademicYearDto = t.Object({
  year: t.String({ minLength: 9, maxLength: 9, description: "Format: YYYY/YYYY (e.g. 2024/2025)" }),
  semester: t.Union([t.Literal("Ganjil"), t.Literal("Genap")]),
  isActive: t.Optional(t.Boolean({ default: false }))
});

export const UpdateAcademicYearDto = t.Partial(t.Object({
  year: t.String({ minLength: 9, maxLength: 9 }),
  semester: t.Union([t.Literal("Ganjil"), t.Literal("Genap")]),
  isActive: t.Boolean()
}));
