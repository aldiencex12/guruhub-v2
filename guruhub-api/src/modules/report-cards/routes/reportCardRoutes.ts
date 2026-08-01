import { Elysia } from "elysia";
import { ReportCardController } from "../controller/reportCardController";
import {
  GenerateReportCardDto,
  GetReportCardQueryDto,
  GetAllReportCardsQueryDto,
  UpdateNotesDto,
  AddAchievementDto,
  AddExtracurricularDto,
  AddP5ProjectDto,
} from "../dto/reportCardDto";
import { authMiddleware, requireRoles } from "../../../middleware/auth";
import { tenantMiddleware } from "../../../middleware/tenant";

const controller = new ReportCardController();

export const reportCardRoutes = new Elysia({ prefix: "/report-cards" })
  .use(tenantMiddleware)
  .use(authMiddleware)

  // 1. Generate Rapor (SchoolAdmin, Principal, HomeroomTeacher, SuperAdmin)
  .post("/generate", controller.generate, {
    body: GenerateReportCardDto,
    beforeHandle: requireRoles(["SuperAdmin", "SchoolAdmin", "Principal", "HomeroomTeacher"]),
  })

  // 2. Publish Rapor (Principal, SchoolAdmin, SuperAdmin)
  .post("/:id/publish", controller.publish, {
    beforeHandle: requireRoles(["SuperAdmin", "SchoolAdmin", "Principal"]),
  })

  // 3. Catatan Wali Kelas & Sub-Entitas Rapor (SuperAdmin, SchoolAdmin, Principal, HomeroomTeacher)
  .group("/:id", (app) =>
    app
      .guard({
        beforeHandle: requireRoles(["SuperAdmin", "SchoolAdmin", "Principal", "HomeroomTeacher"]),
      })
      .put("/notes", controller.updateNotes, {
        body: UpdateNotesDto,
      })
      .post("/achievement", controller.addAchievement, {
        body: AddAchievementDto,
      })
      .post("/extracurricular", controller.addExtracurricular, {
        body: AddExtracurricularDto,
      })
      .post("/p5", controller.addP5, {
        body: AddP5ProjectDto,
      })
      .delete("", controller.delete)
  )

  // 4. Read Rapor (Teacher, HomeroomTeacher, Principal, SchoolAdmin, SuperAdmin)
  .group("", (app) =>
    app
      .guard({
        beforeHandle: requireRoles(["SuperAdmin", "SchoolAdmin", "Principal", "Teacher", "HomeroomTeacher"]),
      })
      .get("/", controller.getAll, {
        query: GetAllReportCardsQueryDto,
      })
      .get("/:id", controller.getDetails)
      .get("/student/:studentId", controller.getStudentReport, {
        query: GetReportCardQueryDto,
      })
      .get("/class/:classId", controller.getClassReports, {
        query: GetReportCardQueryDto,
      })
  );
