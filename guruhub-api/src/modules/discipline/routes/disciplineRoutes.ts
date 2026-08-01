import { Elysia } from "elysia";
import { disciplineController } from "../controller/disciplineController";
import { authMiddleware, requireRoles } from "../../../middleware/auth";
import { tenantMiddleware } from "../../../middleware/tenant";
import { 
  UpdatePolicyDto, 
  CreateCategoryDto, UpdateCategoryDto, CategoryFilterQuery, 
  CreateDisciplineTypeDto, UpdateDisciplineTypeDto, TypeFilterQuery, 
  CreateIncidentDto, IncidentFilterQuery, UpdateIncidentStatusDto,
  SanctionLogFilterQuery, UpdateSanctionStatusDto,
  CreateThresholdDto, UpdateThresholdDto
} from "../dto/disciplineDto";

export const disciplineRoutes = new Elysia({ prefix: "/discipline" })
  .use(tenantMiddleware)
  .use(authMiddleware)
  // --- Policies ---
  .group("/policy", (app) => app
    .get("/", disciplineController.getPolicy, {
      beforeHandle: requireRoles(["SuperAdmin", "SchoolAdmin", "Principal", "Teacher", "HomeroomTeacher", "BKTeacher", "Counselor", "Polsis", "Student"])
    })
    .put("/", disciplineController.updatePolicy, {
      body: UpdatePolicyDto,
      beforeHandle: requireRoles(["SuperAdmin", "SchoolAdmin"])
    })
  )

  // --- Categories ---
  .group("/categories", (app) => app
    .get("/", disciplineController.getCategories, {
      query: CategoryFilterQuery,
      beforeHandle: requireRoles(["SuperAdmin", "SchoolAdmin", "Principal", "Teacher", "HomeroomTeacher", "BKTeacher", "Counselor", "Polsis", "Student"])
    })
    .post("/", disciplineController.createCategory, {
      body: CreateCategoryDto,
      beforeHandle: requireRoles(["SuperAdmin", "SchoolAdmin", "BKTeacher", "Counselor"])
    })
    .put("/:id", disciplineController.updateCategory, {
      body: UpdateCategoryDto,
      beforeHandle: requireRoles(["SuperAdmin", "SchoolAdmin", "BKTeacher", "Counselor"])
    })
    .delete("/:id", disciplineController.deleteCategory, {
      beforeHandle: requireRoles(["SuperAdmin", "SchoolAdmin"])
    })
  )

  // --- Types ---
  .group("/types", (app) => app
    .get("/", disciplineController.getTypes, {
      query: TypeFilterQuery,
      beforeHandle: requireRoles(["SuperAdmin", "SchoolAdmin", "Principal", "Teacher", "HomeroomTeacher", "BKTeacher", "Counselor", "Polsis", "Student"])
    })
    .post("/", disciplineController.createType, {
      body: CreateDisciplineTypeDto,
      beforeHandle: requireRoles(["SuperAdmin", "SchoolAdmin", "BKTeacher", "Counselor"])
    })
    .put("/:id", disciplineController.updateType, {
      body: UpdateDisciplineTypeDto,
      beforeHandle: requireRoles(["SuperAdmin", "SchoolAdmin", "BKTeacher", "Counselor"])
    })
    .delete("/:id", disciplineController.deleteType, {
      beforeHandle: requireRoles(["SuperAdmin", "SchoolAdmin"])
    })
  )

  // --- Incidents ---
  .group("/incidents", (app) => app
    .post("/", disciplineController.createIncident, {
      body: CreateIncidentDto,
      beforeHandle: requireRoles(["SuperAdmin", "SchoolAdmin", "Principal", "Teacher", "HomeroomTeacher", "BKTeacher", "Counselor", "Polsis", "Student"])
    })
    .get("/", disciplineController.getIncidents, {
      query: IncidentFilterQuery,
      beforeHandle: requireRoles(["SuperAdmin", "SchoolAdmin", "Principal", "Teacher", "HomeroomTeacher", "BKTeacher", "Counselor", "Polsis", "Student"])
    })
    .put("/:id/status", disciplineController.updateIncidentStatus, {
      body: UpdateIncidentStatusDto,
      beforeHandle: requireRoles(["SuperAdmin", "SchoolAdmin", "Principal", "BKTeacher", "Counselor"])
    })
  )

  // --- Sanctions & Thresholds ---
  .get("/thresholds", disciplineController.getSanctionThresholds, {
    beforeHandle: requireRoles(["SuperAdmin", "SchoolAdmin", "Principal", "BKTeacher", "Counselor", "Polsis"])
  })
  .post("/thresholds", disciplineController.createThreshold, {
    body: CreateThresholdDto,
    beforeHandle: requireRoles(["SuperAdmin", "SchoolAdmin", "BKTeacher", "Counselor"])
  })
  .put("/thresholds/:id", disciplineController.updateThreshold, {
    body: UpdateThresholdDto,
    beforeHandle: requireRoles(["SuperAdmin", "SchoolAdmin", "BKTeacher", "Counselor"])
  })
  .delete("/thresholds/:id", disciplineController.deleteThreshold, {
    beforeHandle: requireRoles(["SuperAdmin", "SchoolAdmin", "BKTeacher", "Counselor"])
  })
  .group("/sanctions", (app) => app
    .get("/", disciplineController.getSanctionLogs, {
      query: SanctionLogFilterQuery,
      beforeHandle: requireRoles(["SuperAdmin", "SchoolAdmin", "Principal", "HomeroomTeacher", "BKTeacher", "Counselor", "Polsis"])
    })
    .put("/:id", disciplineController.updateSanctionStatus, {
      body: UpdateSanctionStatusDto,
      beforeHandle: requireRoles(["SuperAdmin", "SchoolAdmin", "Principal", "HomeroomTeacher", "BKTeacher", "Counselor", "Teacher", "Polsis"])
    })
  )

  // --- Analytics ---
  .get("/analytics", disciplineController.getAnalytics, {
    beforeHandle: requireRoles(["SuperAdmin", "SchoolAdmin", "Principal", "Teacher", "HomeroomTeacher", "BKTeacher", "Counselor", "Polsis", "Student"])
  })

  // --- Pleno Kenaikan Kelas ---
  .get("/pleno", disciplineController.getPlenoDecisions, {
    beforeHandle: requireRoles(["SuperAdmin", "SchoolAdmin", "Principal", "HomeroomTeacher", "BKTeacher", "Counselor"])
  })
  .post("/pleno/override", disciplineController.overridePlenoDecision, {
    beforeHandle: requireRoles(["SuperAdmin", "SchoolAdmin", "Principal", "HomeroomTeacher", "BKTeacher", "Counselor"])
  })
  .get("/pleno/incidents/:studentId", disciplineController.getStudentViolationDetails, {
    beforeHandle: requireRoles(["SuperAdmin", "SchoolAdmin", "Principal", "Teacher", "HomeroomTeacher", "BKTeacher", "Counselor"])
  })
  .get("/demerit-summary", disciplineController.getDemeritSummaryReport, {
    beforeHandle: requireRoles(["SuperAdmin", "SchoolAdmin", "Principal", "Teacher", "HomeroomTeacher", "BKTeacher", "Counselor"])
  });

