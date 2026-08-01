import { ImportService } from "../service/importService";
import { BadRequestError } from "../../../errors/customErrors";
import * as XLSX from "xlsx";

export class ImportController {
  private importService = new ImportService();

  private validateFile(file: File) {
    if (!file) {
      throw new BadRequestError("Berkas Excel wajib disertakan");
    }
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (ext !== "xlsx" && ext !== "xls") {
      throw new BadRequestError("Hanya berkas dengan format .xlsx dan .xls yang diperbolehkan");
    }
    if (file.size > 20 * 1024 * 1024) {
      throw new BadRequestError("Ukuran berkas maksimal adalah 20 MB");
    }
  }

  upload = async ({ body }: any) => {
    const file = body.file as File;
    this.validateFile(file);
    return {
      success: true,
      message: "Berkas Excel valid",
      fileName: file.name,
      fileSize: file.size
    };
  };

  preview = async ({ body, schoolId }: any) => {
    const file = body.file as File;
    this.validateFile(file);
    const result = await this.importService.previewExcel(file, schoolId);
    return {
      success: true,
      data: result
    };
  };

  importTeachers = async ({ body, schoolId, user, set }: any) => {
    const file = body.file as File;
    this.validateFile(file);
    const result = await this.importService.importTeachers(file, schoolId, user.id);
    if (!result.success) {
      set.status = 400;
      return {
        success: false,
        errors: result.errors
      };
    }
    return result;
  };

  importStudents = async ({ body, schoolId, user, set }: any) => {
    const file = body.file as File;
    this.validateFile(file);
    const result = await this.importService.importStudents(file, schoolId, user.id);
    if (!result.success) {
      set.status = 400;
      return {
        success: false,
        errors: result.errors
      };
    }
    return result;
  };

  importClasses = async ({ body, schoolId, user, set }: any) => {
    const file = body.file as File;
    this.validateFile(file);
    const result = await this.importService.importClasses(file, schoolId, user.id);
    if (!result.success) {
      set.status = 400;
      return {
        success: false,
        errors: result.errors
      };
    }
    return result;
  };

  importSubjects = async ({ body, schoolId, user, set }: any) => {
    const file = body.file as File;
    this.validateFile(file);
    const result = await this.importService.importSubjects(file, schoolId, user.id);
    if (!result.success) {
      set.status = 400;
      return {
        success: false,
        errors: result.errors
      };
    }
    return result;
  };

  importClassMembers = async ({ body, schoolId, user, set }: any) => {
    const file = body.file as File;
    this.validateFile(file);
    const result = await this.importService.importClassMembers(file, schoolId, user.id);
    if (!result.success) {
      set.status = 400;
      return {
        success: false,
        errors: result.errors
      };
    }
    return result;
  };

  importSchedules = async ({ body, schoolId, user, set }: any) => {
    const file = body.file as File;
    this.validateFile(file);
    const result = await this.importService.importSchedules(file, schoolId, user.id);
    if (!result.success) {
      set.status = 400;
      return {
        success: false,
        errors: result.errors
      };
    }
    return result;
  };

  // --- Templates download ---

  private buildExcelResponse(headers: string[], filename: string) {
    const ws = XLSX.utils.aoa_to_sheet([headers]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

    return new Response(buf, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`
      }
    });
  }

  templateStudents = async () => {
    return this.buildExcelResponse(["nisn", "name", "gender", "religion", "className"], "template-students.xlsx");
  };

  templateTeachers = async () => {
    return this.buildExcelResponse(["nip", "name", "gender", "phone"], "template-teachers.xlsx");
  };

  templateClasses = async () => {
    return this.buildExcelResponse(["name", "gradeLevel", "homeroomTeacherNip"], "template-classes.xlsx");
  };

  templateSubjects = async () => {
    return this.buildExcelResponse(["code", "name", "gradeLevel", "religionGroup"], "template-subjects.xlsx");
  };

  templateClassMembers = async () => {
    return this.buildExcelResponse(["className", "nisn"], "template-class-members.xlsx");
  };

  templateSchedules = async () => {
    return this.buildExcelResponse(["day", "startTime", "endTime", "className", "subjectCode", "teacherNip"], "template-schedules.xlsx");
  };
}
