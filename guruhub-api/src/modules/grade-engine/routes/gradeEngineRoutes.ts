import { Elysia } from "elysia";
import { GradeEngineController } from "../controller/gradeEngineController";
import { CalculateStudentDto, CalculateClassDto, GetStudentGradeQueryDto } from "../dto/gradeEngineDto";
import { authMiddleware, requireRoles } from "../../../middleware/auth";
import { tenantMiddleware } from "../../../middleware/tenant";

const controller = new GradeEngineController();

export const gradeEngineRoutes = new Elysia({ prefix: "/grade-engine" })
  .use(tenantMiddleware)
  .use(authMiddleware)

  // Rute Perhitungan (Teacher, SchoolAdmin, Principal, SuperAdmin)
  .group("", (app) =>
    app
      .guard({
        beforeHandle: requireRoles(["SuperAdmin", "SchoolAdmin", "Principal", "Teacher"]),
      })
      .post("/calculate", controller.calculateStudent, {
        body: CalculateStudentDto,
      })
      .post("/calculate-class", controller.calculateClass, {
        body: CalculateClassDto,
      })
  )

  // Rute Membaca (SuperAdmin, SchoolAdmin, Principal, Teacher, HomeroomTeacher)
  .group("", (app) =>
    app
      .guard({
        beforeHandle: requireRoles(["SuperAdmin", "SchoolAdmin", "Principal", "Teacher", "HomeroomTeacher"]),
      })
      .get("/student/:studentId", controller.getStudentGrade, {
        query: GetStudentGradeQueryDto,
      })
  );
