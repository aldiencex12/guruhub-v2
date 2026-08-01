import { Elysia, t } from "elysia";
import { SchoolsController } from "../controller/schoolsController";
import { authMiddleware, requireRoles } from "../../../middleware/auth";
import { tenantMiddleware } from "../../../middleware/tenant";

const controller = new SchoolsController();

export const schoolsRoutes = new Elysia({ prefix: "/schools" })
  .use(tenantMiddleware)
  .use(authMiddleware)
  .get("/current", ({ schoolId }: any) => controller.getSettings(schoolId), {
    beforeHandle: requireRoles(["SuperAdmin", "SchoolAdmin", "Principal", "Teacher", "HomeroomTeacher", "BKTeacher", "Counselor", "Polsis", "Student"])
  })
  .put("/current", ({ schoolId, body }: any) => controller.updateSettings(schoolId, body), {
    body: t.Object({
      foundationName: t.Optional(t.Nullable(t.String())),
      regionalName: t.Optional(t.Nullable(t.String())),
      accreditation: t.Optional(t.Nullable(t.String())),
      name: t.Optional(t.Nullable(t.String())),
      npsn: t.Optional(t.Nullable(t.String())),
      address: t.Optional(t.Nullable(t.String())),
      phone: t.Optional(t.Nullable(t.String())),
      email: t.Optional(t.Nullable(t.String())),
      website: t.Optional(t.Nullable(t.String())),
      logoUrl: t.Optional(t.Nullable(t.String())),
      kopSuratUrl: t.Optional(t.Nullable(t.String())),
      principalName: t.Optional(t.Nullable(t.String())),
      principalNip: t.Optional(t.Nullable(t.String())),
    }),
    beforeHandle: requireRoles(["SuperAdmin", "SchoolAdmin", "Principal"])
  })
  .post("/upload-logo", async ({ schoolId, body }: any) => {
    const file = body.file;
    if (!file) throw new Error("File logo wajib diunggah");
    return controller.uploadLogo(schoolId, file);
  }, {
    body: t.Object({
      file: t.File()
    }),
    beforeHandle: requireRoles(["SuperAdmin", "SchoolAdmin", "Principal"])
  })
  .post("/upload-kop", async ({ schoolId, body }: any) => {
    const file = body.file;
    if (!file) throw new Error("File kop surat wajib diunggah");
    return controller.uploadKop(schoolId, file);
  }, {
    body: t.Object({
      file: t.File()
    }),
    beforeHandle: requireRoles(["SuperAdmin", "SchoolAdmin", "Principal"])
  });
