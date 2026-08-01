import { t } from "elysia";

export const CreateAssessmentCategoryDto = t.Object({
  name: t.String({ 
    minLength: 1, 
    maxLength: 255, 
    error: "Nama kategori wajib diisi dan maksimal 255 karakter" 
  }),
  description: t.Optional(t.Nullable(t.String({ 
    error: "Deskripsi harus berupa string" 
  }))),
  weight: t.Numeric({ 
    minimum: 0,
    maximum: 100,
    error: "Bobot harus antara 0 dan 100" 
  }),
  isActive: t.Optional(t.Boolean({
    error: "isActive harus berupa boolean"
  })),
  isDefault: t.Optional(t.Boolean({ 
    error: "isDefault harus berupa boolean" 
  })),
});

export const UpdateAssessmentCategoryDto = t.Partial(CreateAssessmentCategoryDto);
