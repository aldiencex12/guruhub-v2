import { Elysia, t } from "elysia";
import { ImportController } from "../controller/importController";
import { authMiddleware, requireRoles } from "../../../middleware/auth";
import { tenantMiddleware } from "../../../middleware/tenant";

const controller = new ImportController();

export const importRoutes = new Elysia({ prefix: "/import" })
  .use(tenantMiddleware)
  .use(authMiddleware)
  .guard({
    beforeHandle: requireRoles(["SuperAdmin", "SchoolAdmin", "Principal"])
  })

  // 1. Upload Excel
  .post("/upload", controller.upload, {
    body: t.Object({
      file: t.File()
    })
  })

  // 2. Preview Excel
  .post("/preview", controller.preview, {
    body: t.Object({
      file: t.File()
    })
  })

  // 3. Import Teachers
  .post("/teachers", controller.importTeachers, {
    body: t.Object({
      file: t.File()
    })
  })

  // 4. Import Students
  .post("/students", controller.importStudents, {
    body: t.Object({
      file: t.File()
    })
  })

  // 5. Import Classes
  .post("/classes", controller.importClasses, {
    body: t.Object({
      file: t.File()
    })
  })

  // 6. Import Subjects
  .post("/subjects", controller.importSubjects, {
    body: t.Object({
      file: t.File()
    })
  })

  // 7. Import Class Members
  .post("/class-members", controller.importClassMembers, {
    body: t.Object({
      file: t.File()
    })
  })

  // 8. Import Schedules
  .post("/schedules", controller.importSchedules, {
    body: t.Object({
      file: t.File()
    })
  })

  // 9. Template Download
  .get("/templates/students", controller.templateStudents)
  .get("/templates/teachers", controller.templateTeachers)
  .get("/templates/classes", controller.templateClasses)
  .get("/templates/subjects", controller.templateSubjects)
  .get("/templates/class-members", controller.templateClassMembers)
  .get("/templates/schedules", controller.templateSchedules);
