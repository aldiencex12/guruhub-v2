import { Elysia } from "elysia";
import { DashboardController } from "../controller/dashboardController";
import { authMiddleware, requireRoles } from "../../../middleware/auth";
import { tenantMiddleware } from "../../../middleware/tenant";

const controller = new DashboardController();

export const dashboardRoutes = new Elysia({ prefix: "/dashboard" })
  .use(tenantMiddleware)
  .use(authMiddleware)
  .guard({
    beforeHandle: requireRoles(["SuperAdmin", "SchoolAdmin", "Principal", "Teacher", "HomeroomTeacher", "BKTeacher", "Counselor"]),
  })
  .get("/summary", controller.getSummary)
  .get("/attendance", controller.getAttendance)
  .get("/journals", controller.getJournals)
  .get("/assessments", controller.getAssessments)
  .get("/grades", controller.getGrades)
  .get("/report-cards", controller.getReportCards)
  .get("/academic-years", controller.getAcademicYears)
  .get("/activities", controller.getActivities)
  .get("/pending-tasks", controller.getPendingTasks)
  .get("/student-highlights", controller.getStudentHighlights);
