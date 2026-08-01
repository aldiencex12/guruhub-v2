import { Elysia, t } from "elysia";
import { PdfGeneratorController } from "../controller/pdfGeneratorController";
import { authMiddleware, requireRoles } from "../../../middleware/auth";
import { tenantMiddleware } from "../../../middleware/tenant";

const controller = new PdfGeneratorController();

export const pdfGeneratorRoutes = new Elysia({ prefix: "/pdf" })
  .use(tenantMiddleware)
  .use(authMiddleware)
  // Rapor: HomeroomTeacher, Principal, SchoolAdmin, SuperAdmin
  .get("/report-card/:reportCardId", ({ params: { reportCardId }, headers, user }) => {
    return controller.exportReportCard(
      Number(reportCardId),
      Number(headers["x-school-id"]),
      user.id,
      user.role
    );
  }, {
    beforeHandle: requireRoles(["SuperAdmin", "SchoolAdmin", "Principal", "HomeroomTeacher"])
  })
  // Absensi: Teacher, HomeroomTeacher, Principal, SchoolAdmin, SuperAdmin
  .get("/attendance/class/:classId", ({ params: { classId }, query: { semester, academicYearId }, headers, user }) => {
    return controller.exportAttendance(
      Number(classId),
      Number(academicYearId),
      semester,
      Number(headers["x-school-id"]),
      user.id,
      user.role
    );
  }, {
    beforeHandle: requireRoles(["SuperAdmin", "SchoolAdmin", "Principal", "Teacher", "HomeroomTeacher"]),
    query: t.Object({
      semester: t.String(),
      academicYearId: t.String()
    })
  })
  // Jurnal: Teacher, HomeroomTeacher, Principal, SchoolAdmin, SuperAdmin
  .get("/journals/teacher/:teacherId", ({ params: { teacherId }, headers, user }) => {
    return controller.exportTeachingJournal(
      Number(teacherId),
      Number(headers["x-school-id"]),
      user.id,
      user.role
    );
  }, {
    beforeHandle: requireRoles(["SuperAdmin", "SchoolAdmin", "Principal", "Teacher", "HomeroomTeacher"])
  })
  // Asesmen: Teacher, HomeroomTeacher, Principal, SchoolAdmin, SuperAdmin
  .get("/assessments/:assessmentId", ({ params: { assessmentId }, headers, user }) => {
    return controller.exportAssessment(
      Number(assessmentId),
      Number(headers["x-school-id"]),
      user.id,
      user.role
    );
  }, {
    beforeHandle: requireRoles(["SuperAdmin", "SchoolAdmin", "Principal", "Teacher", "HomeroomTeacher"])
  })
  // Student List: Teacher, HomeroomTeacher, Principal, SchoolAdmin, SuperAdmin
  .get("/students", ({ query: { classId, academicYearId }, headers, user }) => {
    return controller.exportStudentList(
      Number(classId),
      Number(academicYearId),
      Number(headers["x-school-id"]),
      user.id,
      user.role
    );
  }, {
    beforeHandle: requireRoles(["SuperAdmin", "SchoolAdmin", "Principal", "Teacher", "HomeroomTeacher"]),
    query: t.Object({
      classId: t.String(),
      academicYearId: t.String()
    })
  })
  // Teacher List: Teacher, HomeroomTeacher, Principal, SchoolAdmin, SuperAdmin
  .get("/teachers", ({ headers, user }) => {
    return controller.exportTeacherList(
      Number(headers["x-school-id"]),
      user.id,
      user.role
    );
  }, {
    beforeHandle: requireRoles(["SuperAdmin", "SchoolAdmin", "Principal", "Teacher", "HomeroomTeacher"])
  })
  // Sanction SP: BKTeacher, Counselor, Principal, SchoolAdmin, SuperAdmin, Polsis
  .get("/sanctions/:sanctionId", ({ params: { sanctionId }, headers, user, query }) => {
    return controller.exportSanction(
      Number(sanctionId),
      Number(headers["x-school-id"]),
      user.id,
      user.role,
      query.docType
    );
  }, {
    beforeHandle: requireRoles(["SuperAdmin", "SchoolAdmin", "Principal", "BKTeacher", "Counselor", "Polsis"])
  })
  // Raport Sisipan: Teacher, HomeroomTeacher, Principal, SchoolAdmin, SuperAdmin
  .get("/interim-report-card/:id", ({ params: { id }, headers, user }) => {
    return controller.exportInterimReportCard(
      Number(id),
      Number(headers["x-school-id"]),
      user.id,
      user.role
    );
  }, {
    beforeHandle: requireRoles(["SuperAdmin", "SchoolAdmin", "Principal", "Teacher", "HomeroomTeacher"])
  });

