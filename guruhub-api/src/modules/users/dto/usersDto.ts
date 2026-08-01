import { t } from "elysia";

export const CreateUserDto = t.Object({
  email: t.String({ format: "email" }),
  password: t.String({ minLength: 6 }),
  role: t.Union([
    t.Literal("SuperAdmin"),
    t.Literal("SchoolAdmin"),
    t.Literal("Principal"),
    t.Literal("Teacher"),
    t.Literal("HomeroomTeacher"),
    t.Literal("BKTeacher"),
    t.Literal("Student"),
    t.Literal("Polsis")
  ]),
  status: t.Optional(t.Union([t.Literal("Aktif"), t.Literal("Nonaktif")])),
  teacherId: t.Optional(t.Numeric())
});

export const UpdateUserDto = t.Partial(t.Object({
  email: t.String({ format: "email" }),
  role: t.Union([
    t.Literal("SuperAdmin"),
    t.Literal("SchoolAdmin"),
    t.Literal("Principal"),
    t.Literal("Teacher"),
    t.Literal("HomeroomTeacher"),
    t.Literal("BKTeacher"),
    t.Literal("Student"),
    t.Literal("Polsis")
  ]),
  status: t.Union([t.Literal("Aktif"), t.Literal("Nonaktif")])
}));

export const ResetPasswordDto = t.Object({
  newPassword: t.String({ minLength: 6 })
});
