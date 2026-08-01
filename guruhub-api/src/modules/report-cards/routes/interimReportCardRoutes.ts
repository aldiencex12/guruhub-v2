import { Elysia } from "elysia";
import { InterimReportCardController } from "../controller/interimReportCardController";
import { authMiddleware, requireRoles } from "../../../middleware/auth";
import { tenantMiddleware } from "../../../middleware/tenant";

const interimController = new InterimReportCardController();

export const interimReportCardRoutes = new Elysia({ prefix: "/interim-report-cards" })
  .use(tenantMiddleware)
  .use(authMiddleware)
  .post("/generate", interimController.generateOrGet, {
    beforeHandle: requireRoles(["SuperAdmin", "SchoolAdmin", "Principal", "HomeroomTeacher", "Teacher"]),
  })
  .post("/batch-grades", interimController.batchSaveGrades, {
    beforeHandle: requireRoles(["SuperAdmin", "SchoolAdmin", "Principal", "HomeroomTeacher", "Teacher"]),
  })
  .put("/:id/notes", interimController.updateNotes, {
    beforeHandle: requireRoles(["SuperAdmin", "SchoolAdmin", "Principal", "HomeroomTeacher"]),
  })
  .get("/:id", interimController.getDetails, {
    beforeHandle: requireRoles(["SuperAdmin", "SchoolAdmin", "Principal", "HomeroomTeacher", "Teacher"]),
  })
  .get("/class/:classId", interimController.getClassReports, {
    beforeHandle: requireRoles(["SuperAdmin", "SchoolAdmin", "Principal", "HomeroomTeacher", "Teacher"]),
  });
