import { Elysia } from "elysia";
import { authController } from "./modules/auth/controller/authController";
import { CustomError } from "./errors/customErrors";

import { teachersRoutes } from "./modules/teachers/routes/teachersRoutes";
import { studentsRoutes } from "./modules/students/routes/studentsRoutes";
import { classesRoutes } from "./modules/classes/routes/classesRoutes";
import { subjectsRoutes } from "./modules/subjects/routes/subjectsRoutes";
import { schedulesRoutes } from "./modules/schedules/routes/schedulesRoutes";
import { attendanceRoutes } from "./modules/attendance/routes/attendanceRoutes";
import { classMembersRoutes } from "./modules/class-members/routes/classMembersRoutes";
import { teachingJournalsRoutes } from "./modules/teaching-journals/routes/teachingJournalsRoutes";
import { assessmentsRoutes } from "./modules/assessments/routes/assessmentsRoutes";
import { assessmentCategoriesRoutes } from "./modules/assessment-categories/routes/assessmentCategoriesRoutes";
import { academicYearsRoutes } from "./modules/academic-years/routes/academicYearsRoutes";
import { usersRoutes } from "./modules/users/routes/usersRoutes";
import { gradeEngineRoutes } from "./modules/grade-engine/routes/gradeEngineRoutes";
import { reportCardRoutes } from "./modules/report-cards/routes/reportCardRoutes";
import { interimReportCardRoutes } from "./modules/report-cards/routes/interimReportCardRoutes";
import { dashboardRoutes } from "./modules/dashboard/routes/dashboardRoutes";
import { pdfGeneratorRoutes } from "./modules/pdf-generator/routes/pdfGeneratorRoutes";
import { importRoutes } from "./modules/import/routes/importRoutes";
import { disciplineRoutes } from "./modules/discipline/routes/disciplineRoutes";
import { schoolsRoutes } from "./modules/schools/routes/schoolsRoutes";
import { swagger } from "@elysiajs/swagger";
import { db } from "./db";
import { sql } from "drizzle-orm";
import { cors } from "@elysiajs/cors";

const app = new Elysia()
  .use(cors({
    origin: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization", "x-school-id", "Accept", "Origin", "X-Requested-With", "User-Agent"],
  }))
  .use(swagger({
    path: "/swagger",
    documentation: {
      info: {
        title: "GuruHub API Documentation",
        version: "1.0.0",
        description: "Dokumentasi API produksi untuk platform manajemen sekolah multi-tenant GuruHub",
      },
    },
  }))
  .error({
    CUSTOM_ERROR: CustomError,
  })
  .onError(({ code, error, set }) => {
    if (error instanceof CustomError) {
      set.status = error.statusCode;
      return {
        success: false,
        error: error.message,
      };
    }

    if (code === "VALIDATION") {
      set.status = 400;
      const detailMsg = (error as any)?.all ? JSON.stringify((error as any).all) : error.message;
      console.error("[VALIDATION ERROR]:", detailMsg);
      return {
        success: false,
        error: `Validasi data input gagal: ${error.message || "Format data tidak sesuai"}`,
        details: detailMsg,
      };
    }

    set.status = 500;
    const errMessage = (error && typeof error === "object" && "message" in error) ? (error as any).message : String(error);
    console.error("[INTERNAL SERVER ERROR]:", error);
    return {
      success: false,
      error: errMessage || "Kesalahan internal server",
      message: errMessage,
    };
  })
  .get("/", () => "Hello World! Elysia is running.")
  .use(authController)
  .use(teachersRoutes)
  .use(studentsRoutes)
  .use(classesRoutes)
  .use(subjectsRoutes)
  .use(schedulesRoutes)
  .use(attendanceRoutes)
  .use(classMembersRoutes)
  .use(teachingJournalsRoutes)
  .use(assessmentsRoutes)
  .use(assessmentCategoriesRoutes)
  .use(academicYearsRoutes)
  .use(usersRoutes)
  .use(gradeEngineRoutes)
  .use(reportCardRoutes)
  .use(interimReportCardRoutes)
  .use(dashboardRoutes)
  .use(pdfGeneratorRoutes)
  .use(importRoutes)
  .use(disciplineRoutes)
  .use(schoolsRoutes)
  .group("/api", (app) => 
    app
      .use(authController)
      .use(teachersRoutes)
      .use(studentsRoutes)
      .use(classesRoutes)
      .use(subjectsRoutes)
      .use(schedulesRoutes)
      .use(attendanceRoutes)
      .use(classMembersRoutes)
      .use(teachingJournalsRoutes)
      .use(assessmentsRoutes)
      .use(assessmentCategoriesRoutes)
      .use(academicYearsRoutes)
      .use(usersRoutes)
      .use(gradeEngineRoutes)
      .use(reportCardRoutes)
      .use(interimReportCardRoutes)
      .use(dashboardRoutes)
      .use(pdfGeneratorRoutes)
      .use(importRoutes)
      .use(disciplineRoutes)
      .use(schoolsRoutes)
  )
  .listen({
    port: process.env.PORT ? parseInt(process.env.PORT) : 3000,
    hostname: "0.0.0.0"
  });

console.log(`🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`);

// Clean up legacy [Rekap POLSIS]: prefixes in database records
db.execute(sql`UPDATE discipline_incidents SET description = TRIM(REPLACE(description, '[Rekap POLSIS]:', '')) WHERE description LIKE '%[Rekap POLSIS]:%'`).catch(() => {});
app.onError(({ code, error, request, set }) => {
  console.error(`[Global Error] ${request.method} ${request.url}:`, error.message || error);
  if (!set.status || set.status === 200) {
    set.status = (error as any).statusCode || (error as any).status || (code === 'VALIDATION' ? 400 : 500);
  }
  return { success: false, error: error.message || "Internal Server Error" };
});
