import * as XLSX from "xlsx";
import { ImportRepository } from "../repository/importRepository";
import { BadRequestError } from "../../../errors/customErrors";
import { teachers } from "../../../schema/teachers";
import { students } from "../../../schema/students";
import { classes } from "../../../schema/classes";
import { subjects } from "../../../schema/subjects";
import { classMembers } from "../../../schema/classMembers";
import { eq, sql, and, isNull } from "drizzle-orm";

export interface ImportError {
  row: number;
  column: string;
  reason: string;
}

export interface PreviewResponse {
  validRows: number;
  invalidRows: number;
  errors: ImportError[];
}

export class ImportService {
  private repo = new ImportRepository();

  /**
   * Helper to parse Excel file to normalized JSON rows
   */
  private async parseExcel(file: File): Promise<any[]> {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(Buffer.from(arrayBuffer), { type: "buffer" });
    if (workbook.SheetNames.length === 0) {
      throw new BadRequestError("Berkas Excel tidak memiliki lembar kerja");
    }
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      throw new BadRequestError("Berkas Excel tidak memiliki lembar kerja");
    }
    const worksheet = workbook.Sheets[sheetName];
    if (!worksheet) {
      throw new BadRequestError("Lembar kerja tidak ditemukan");
    }
    const rawRows = XLSX.utils.sheet_to_json<any>(worksheet, { defval: "" });

    return rawRows.map((row) => {
      const normalized: any = {};
      for (const key of Object.keys(row)) {
        // Remove BOM and any zero-width spaces before trimming
        const cleanKey = key.replace(/^[\uFEFF\u200B]+/, "");
        const normKey = cleanKey.trim().toLowerCase();
        const val = row[key];
        normalized[normKey] = typeof val === "string" ? val.trim() : (val !== null && val !== undefined ? String(val).trim() : "");
      }
      return normalized;
    });
  }

  /**
   * Detect type from Excel headers
   */
  private detectType(row: any): "teachers" | "students" | "classes" | "subjects" | "class-members" | "schedules" | null {
    if (!row) return null;
    const keys = Object.keys(row);
    const hSet = new Set(keys);

    if (hSet.has("nip") && hSet.has("name") && hSet.has("gender")) return "teachers";
    if (hSet.has("nisn") && hSet.has("name") && hSet.has("gender")) return "students";
    if (hSet.has("name") && hSet.has("gradelevel") && hSet.has("homeroomteachernip")) return "classes";
    if (hSet.has("code") && hSet.has("name") && hSet.has("gradelevel")) return "subjects";
    if (hSet.has("classname") && hSet.has("nisn") && !hSet.has("nip")) return "class-members";
    if (hSet.has("day") && hSet.has("starttime") && hSet.has("classname") && hSet.has("subjectcode")) return "schedules";

    return null;
  }

  /**
   * 1. Preview Excel File
   */
  async previewExcel(file: File, schoolId: number): Promise<PreviewResponse> {
    const rows = await this.parseExcel(file);
    if (rows.length === 0) {
      return { validRows: 0, invalidRows: 0, errors: [] };
    }

    const type = this.detectType(rows[0]);
    if (!type) {
      throw new BadRequestError("Format kolom Excel tidak dikenali");
    }

    let errors: ImportError[] = [];
    if (type === "teachers") {
      errors = await this.validateTeachers(rows, schoolId);
    } else if (type === "students") {
      errors = await this.validateStudents(rows, schoolId);
    } else if (type === "classes") {
      errors = await this.validateClasses(rows, schoolId);
    } else if (type === "subjects") {
      errors = await this.validateSubjects(rows, schoolId);
    } else if (type === "class-members") {
      errors = await this.validateClassMembers(rows, schoolId);
    } else if (type === "schedules") {
      errors = await this.validateSchedules(rows, schoolId);
    }

    const invalidRowIndices = new Set(errors.map((e) => e.row));
    const invalidRowsCount = invalidRowIndices.size;
    const validRowsCount = rows.length - invalidRowsCount;

    return {
      validRows: validRowsCount,
      invalidRows: invalidRowsCount,
      errors
    };
  }

  /**
   * 2. Import Teachers
   */
  async importTeachers(file: File, schoolId: number, userId: number): Promise<any> {
    const rows = await this.parseExcel(file);
    const errors = await this.validateTeachers(rows, schoolId);
    if (errors.length > 0) {
      return { success: false, errors };
    }

    // Prepare values to insert
    const insertValues = rows.map((r) => ({
      schoolId,
      nip: r.nip || null,
      name: r.name,
      phone: r.phone || null,
      gender: r.gender as "L" | "P"
    }));

    await this.repo.runTransaction(async (tx) => {
      // Chunk inserts for safety
      const chunkSize = 1000;
      for (let i = 0; i < insertValues.length; i += chunkSize) {
        const chunk = insertValues.slice(i, i + chunkSize);
        for (const row of chunk) {
          await tx.insert(teachers).values(row).onDuplicateKeyUpdate({
            set: {
              name: row.name,
              phone: row.phone,
              gender: row.gender,
              deletedAt: sql`NULL`,
              updatedAt: sql`CURRENT_TIMESTAMP`
            }
          });
        }
      }

      await this.repo.createAuditLog({
        schoolId,
        userId,
        action: "IMPORT_TEACHERS",
        tableName: "teachers",
        newValues: { rowCount: insertValues.length }
      });
    });

    return { success: true, message: "Import guru berhasil", importedRows: insertValues.length };
  }

  /**
   * 3. Import Students
   */
  async importStudents(file: File, schoolId: number, userId: number): Promise<any> {
    const rows = await this.parseExcel(file);
const RELIGION_MAP: Record<string, "Islam" | "Kristen" | "Katolik" | "Hindu" | "Buddha" | "Khonghucu"> = {
  "islam": "Islam",
  "kristen": "Kristen",
  "katolik": "Katolik",
  "hindu": "Hindu",
  "buddha": "Buddha",
  "khonghucu": "Khonghucu",
  "konghucu": "Khonghucu",
};

function normalizeReligion(val: string): "Islam" | "Kristen" | "Katolik" | "Hindu" | "Buddha" | "Khonghucu" | null {
  if (!val) return null;
  const key = String(val).trim().toLowerCase();
  return RELIGION_MAP[key] || null;
}

function normalizeGender(val: string): "L" | "P" | null {
  if (!val) return null;
  const g = String(val).trim().toUpperCase();
  if (g === "L" || g === "LAKI-LAKI" || g === "LAKI LAKI" || g === "MALE") return "L";
  if (g === "P" || g === "PEREMPUAN" || g === "FEMALE") return "P";
  return null;
}

    const errors = await this.validateStudents(rows, schoolId);
    if (errors.length > 0) {
      return { success: false, errors };
    }

    // Prepare values to insert
    const insertValues = rows.map((r) => ({
      schoolId,
      nisn: r.nisn,
      name: r.name,
      gender: normalizeGender(r.gender) || "L",
      religion: normalizeReligion(r.religion) || "Islam",
      status: "Aktif" as const
    }));

    // Fetch Academic Year if there are class assignments
    const ay = await this.repo.getActiveAcademicYear(schoolId);
    let classMap = new Map<string, number>();
    if (ay) {
      const dbClasses = await this.repo.getActiveClasses(schoolId, ay.id);
      for (const c of dbClasses) {
        classMap.set(c.name.toLowerCase(), c.id);
      }
    }

    await this.repo.runTransaction(async (tx) => {
      const chunkSize = 1000;
      for (let i = 0; i < insertValues.length; i += chunkSize) {
        const chunk = insertValues.slice(i, i + chunkSize);
        for (const row of chunk) {
          await tx.insert(students).values(row).onDuplicateKeyUpdate({
            set: {
              name: row.name,
              gender: row.gender,
              religion: row.religion,
              status: "Aktif",
              deletedAt: sql`NULL`,
              updatedAt: sql`CURRENT_TIMESTAMP`
            }
          });
        }
      }

      // If there are class assignments, fetch the newly inserted students by NIS
      // and insert into class_members
      if (ay) {
        const classMemberInserts: any[] = [];
        const insertedStudents = await tx.select({ id: students.id, nisn: students.nisn }).from(students).where(eq(students.schoolId, schoolId));
        const studentMap = new Map<string, number>();
        for (const s of insertedStudents) {
          studentMap.set(s.nisn, s.id);
        }

        const existingMemberships = await tx.select({
          studentId: classMembers.studentId,
          classId: classMembers.classId
        }).from(classMembers)
          .where(and(
            eq(classMembers.schoolId, schoolId),
            eq(classMembers.academicYearId, ay.id),
            isNull(classMembers.deletedAt)
          ));
          
        const memberSet = new Set(existingMemberships.map((m: { studentId: number; classId: number }) => `${m.studentId}-${m.classId}`));

        for (const r of rows) {
          if (r.classname) {
            const classId = classMap.get(r.classname.toLowerCase());
            const studentId = studentMap.get(r.nisn);
            if (classId && studentId) {
              const key = `${studentId}-${classId}`;
              if (!memberSet.has(key)) {
                classMemberInserts.push({
                  schoolId,
                  classId,
                  studentId,
                  academicYearId: ay.id,
                  status: "ACTIVE" as const
                });
                memberSet.add(key);
              }
            }
          }
        }

        if (classMemberInserts.length > 0) {
          for (let i = 0; i < classMemberInserts.length; i += chunkSize) {
            await tx.insert(classMembers).values(classMemberInserts.slice(i, i + chunkSize));
          }
        }
      }

      await this.repo.createAuditLog({
        schoolId,
        userId,
        action: "IMPORT_STUDENTS",
        tableName: "students",
        newValues: { rowCount: insertValues.length }
      });
    });

    return { success: true, message: "Import siswa berhasil", importedRows: insertValues.length };
  }

  /**
   * 4. Import Classes
   */
  async importClasses(file: File, schoolId: number, userId: number): Promise<any> {
    const rows = await this.parseExcel(file);
    const errors = await this.validateClasses(rows, schoolId);
    if (errors.length > 0) {
      return { success: false, errors };
    }

    const ay = await this.repo.getActiveAcademicYear(schoolId);
    if (!ay) {
      return { success: false, errors: [{ row: 0, column: "File", reason: "Tahun ajaran aktif tidak ditemukan" }] };
    }

    // Map teacher NIP to teacher ID
    const dbTeachers = await this.repo.getActiveTeachers(schoolId);
    const teacherMap = new Map<string, number>();
    for (const t of dbTeachers) {
      if (t.nip) teacherMap.set(t.nip, t.id);
    }

    // Prepare values to insert
    const insertValues = rows.map((r) => ({
      schoolId,
      academicYearId: ay.id,
      homeroomTeacherId: teacherMap.get(r.homeroomteachernip)!,
      name: r.name,
      gradeLevel: r.gradelevel as "7" | "8" | "9" | "10" | "11" | "12",
      status: "Aktif" as const
    }));

    await this.repo.runTransaction(async (tx) => {
      const chunkSize = 1000;
      for (let i = 0; i < insertValues.length; i += chunkSize) {
        const chunk = insertValues.slice(i, i + chunkSize);
        for (const row of chunk) {
          await tx.insert(classes).values(row).onDuplicateKeyUpdate({
            set: {
              name: row.name,
              homeroomTeacherId: row.homeroomTeacherId,
              gradeLevel: row.gradeLevel,
              status: "Aktif",
              deletedAt: sql`NULL`,
              updatedAt: sql`CURRENT_TIMESTAMP`
            }
          });
        }
      }

      await this.repo.createAuditLog({
        schoolId,
        userId,
        action: "IMPORT_CLASSES",
        tableName: "classes",
        newValues: { rowCount: insertValues.length }
      });
    });

    return { success: true, message: "Import kelas berhasil", importedRows: insertValues.length };
  }

  /**
   * 5. Import Subjects
   */
  async importSubjects(file: File, schoolId: number, userId: number): Promise<any> {
    const rows = await this.parseExcel(file);
    const errors = await this.validateSubjects(rows, schoolId);
    if (errors.length > 0) {
      return { success: false, errors };
    }

    // Prepare values to insert
    const insertValues = rows.map((r) => ({
      schoolId,
      code: r.code,
      name: r.name,
      gradeLevel: r.gradelevel as "7" | "8" | "9" | "10" | "11" | "12",
      religionGroup: (r.religiongroup || "UMUM") as any,
      status: "Aktif" as const
    }));

    await this.repo.runTransaction(async (tx) => {
      const chunkSize = 1000;
      for (let i = 0; i < insertValues.length; i += chunkSize) {
        const chunk = insertValues.slice(i, i + chunkSize);
        for (const row of chunk) {
          await tx.insert(subjects)
            .values(row)
            .onDuplicateKeyUpdate({
              set: {
                code: row.code,
                name: row.name,
                gradeLevel: row.gradeLevel,
                religionGroup: row.religionGroup,
                status: "Aktif",
                deletedAt: sql`NULL`,
                updatedAt: sql`CURRENT_TIMESTAMP`
              }
            });
        }
      }

      await this.repo.createAuditLog({
        schoolId,
        userId,
        action: "IMPORT_SUBJECTS",
        tableName: "subjects",
        newValues: { rowCount: insertValues.length }
      });
    });

    return { success: true, message: "Import mata pelajaran berhasil", importedRows: insertValues.length };
  }

  /**
   * 6. Import Class Members
   */
  async importClassMembers(file: File, schoolId: number, userId: number): Promise<any> {
    const rows = await this.parseExcel(file);
    const errors = await this.validateClassMembers(rows, schoolId);
    if (errors.length > 0) {
      return { success: false, errors };
    }

    const ay = await this.repo.getActiveAcademicYear(schoolId);
    if (!ay) {
      return { success: false, errors: [{ row: 0, column: "File", reason: "Tahun ajaran aktif tidak ditemukan" }] };
    }

    // Fetch mappings
    const [dbClasses, dbStudents] = await Promise.all([
      this.repo.getActiveClasses(schoolId, ay.id),
      this.repo.getActiveStudents(schoolId)
    ]);

    const classMap = new Map<string, number>();
    for (const c of dbClasses) {
      classMap.set(c.name.toLowerCase(), c.id);
    }

    const studentMap = new Map<string, number>();
    for (const s of dbStudents) {
      if (s.nisn) {
        studentMap.set(s.nisn, s.id);
      }
    }

    // Prepare values to insert
    const insertValues = rows.map((r) => ({
      schoolId,
      classId: classMap.get(r.classname.toLowerCase())!,
      studentId: studentMap.get(r.nisn)!,
      academicYearId: ay.id,
      status: "ACTIVE" as const
    }));

    await this.repo.runTransaction(async (tx) => {
      const chunkSize = 1000;
      for (let i = 0; i < insertValues.length; i += chunkSize) {
        await tx.insert(classMembers).values(insertValues.slice(i, i + chunkSize));
      }

      await this.repo.createAuditLog({
        schoolId,
        userId,
        action: "IMPORT_CLASS_MEMBERS",
        tableName: "class_members",
        newValues: { rowCount: insertValues.length }
      });
    });

    return { success: true, message: "Import anggota kelas berhasil", importedRows: insertValues.length };
  }

  /**
   * 7. Import Schedules
   */
  async importSchedules(file: File, schoolId: number, userId: number): Promise<any> {
    const rows = await this.parseExcel(file);
    const errors = await this.validateSchedules(rows, schoolId);
    if (errors.length > 0) {
      return { success: false, errors };
    }

    const ay = await this.repo.getActiveAcademicYear(schoolId);
    if (!ay) {
      return { success: false, errors: [{ row: 0, column: "File", reason: "Tahun ajaran aktif tidak ditemukan" }] };
    }

    // Fetch mappings
    const [dbClasses, dbTeachers, dbSubjects] = await Promise.all([
      this.repo.getActiveClasses(schoolId, ay.id),
      this.repo.getActiveTeachers(schoolId),
      this.repo.getActiveSubjects(schoolId)
    ]);

    const classMap = new Map<string, number>();
    for (const c of dbClasses) classMap.set(c.name.toLowerCase(), c.id);

    const teacherMap = new Map<string, number>();
    for (const t of dbTeachers) if (t.nip) teacherMap.set(t.nip, t.id);

    const subjectMap = new Map<string, number>();
    for (const s of dbSubjects) subjectMap.set(s.code.toLowerCase(), s.id);

    // Prepare values to insert
    const insertValues = rows.map((r) => ({
      schoolId,
      academicYearId: ay.id,
      classId: classMap.get(r.classname.toLowerCase())!,
      subjectId: subjectMap.get(r.subjectcode.toLowerCase())!,
      teacherId: teacherMap.get(r.teachernip)!,
      dayOfWeek: r.day as any,
      startTime: r.starttime,
      endTime: r.endtime,
      status: "Aktif" as const
    }));

    await this.repo.runTransaction(async (tx) => {
      const { schedules } = require("../../../schema/schedules");
      const chunkSize = 1000;
      for (let i = 0; i < insertValues.length; i += chunkSize) {
        await tx.insert(schedules).values(insertValues.slice(i, i + chunkSize));
      }

      await this.repo.createAuditLog({
        schoolId,
        userId,
        action: "IMPORT_SCHEDULES",
        tableName: "schedules",
        newValues: { rowCount: insertValues.length }
      });
    });

    return { success: true, message: "Import jadwal berhasil", importedRows: insertValues.length };
  }

  // --- VALIDATION FUNCTIONS ---

  private async validateTeachers(rows: any[], schoolId: number): Promise<ImportError[]> {
    const errors: ImportError[] = [];
    const dbNipsValidation = await this.repo.getAllTeacherNipsForValidation(schoolId);

    const dbNips = new Set<string>();
    for (const t of dbNipsValidation) {
      if (t.nip) dbNips.add(t.nip);
    }

    const sheetNips = new Set<string>();

    for (let i = 0; i < rows.length; i++) {
      const rowNum = i + 2;
      const r = rows[i];

      // name check
      if (!r.name) {
        errors.push({ row: rowNum, column: "name", reason: "Nama guru wajib diisi" });
      }

      // gender check
      if (!r.gender || (r.gender !== "L" && r.gender !== "P")) {
        errors.push({ row: rowNum, column: "gender", reason: "Gender harus L atau P" });
      }

      // nip check
      if (r.nip) {
        if (sheetNips.has(r.nip)) {
          errors.push({ row: rowNum, column: "nip", reason: "NIP ganda di dalam file Excel" });
        } else {
          sheetNips.add(r.nip);
        }

        if (dbNips.has(r.nip)) {
          errors.push({ row: rowNum, column: "nip", reason: "NIP sudah digunakan di sekolah ini" });
        }
      }
    }

    return errors;
  }

  private async validateStudents(rows: any[], schoolId: number): Promise<ImportError[]> {
    const errors: ImportError[] = [];
    const ay = await this.repo.getActiveAcademicYear(schoolId);

    const [dbStudentsActive, dbNisnsGlobal, dbClasses] = await Promise.all([
      this.repo.getActiveStudents(schoolId),
      this.repo.getAllStudentNisnsGlobal(),
      ay ? this.repo.getActiveClasses(schoolId, ay.id) : Promise.resolve([])
    ]);

    const dbClassNames = new Set<string>(dbClasses.map((c) => c.name.toLowerCase()));
    const dbNisn = new Set<string>(dbNisnsGlobal.map((s) => s.nisn).filter((nisn): nisn is string => Boolean(nisn)));

    const VALID_RELIGIONS = new Set(["Islam", "Kristen", "Katolik", "Hindu", "Buddha", "Khonghucu"]);
    const sheetNisn = new Set<string>();

    for (let i = 0; i < rows.length; i++) {
      const rowNum = i + 2;
      const r = rows[i];

      // name check
      if (!r.name) {
        errors.push({ row: rowNum, column: "name", reason: "Nama siswa wajib diisi" });
      }

      // gender check
      if (!r.gender || !normalizeGender(r.gender)) {
        errors.push({ row: rowNum, column: "gender", reason: "Gender harus L atau P" });
      }

      // nisn check
      if (!r.nisn) {
        errors.push({ row: rowNum, column: "nisn", reason: "NISN wajib diisi" });
      } else {
        if (r.nisn.length > 20) {
          errors.push({ row: rowNum, column: "nisn", reason: "NISN maksimal 20 digit" });
        } else if (!/^[0-9]+$/.test(r.nisn)) {
          errors.push({ row: rowNum, column: "nisn", reason: "NISN harus berupa angka" });
        }
        if (sheetNisn.has(r.nisn)) {
          errors.push({ row: rowNum, column: "nisn", reason: "NISN ganda di dalam file Excel" });
        } else {
          sheetNisn.add(r.nisn);
        }
        if (dbNisn.has(r.nisn)) {
          errors.push({ row: rowNum, column: "nisn", reason: "NISN sudah digunakan" });
        }
      }

      // religion check
      if (!r.religion) {
        errors.push({ row: rowNum, column: "religion", reason: "Agama wajib diisi" });
      } else if (!normalizeReligion(r.religion)) {
        errors.push({ row: rowNum, column: "religion", reason: "Agama harus salah satu dari: Islam, Kristen, Katolik, Hindu, Buddha, Khonghucu" });
      }

      // classname check (optional)
      if (r.classname) {
        if (!ay) {
          errors.push({ row: rowNum, column: "className", reason: "Tahun ajaran aktif tidak ditemukan untuk penempatan kelas" });
        } else if (!dbClassNames.has(r.classname.toLowerCase())) {
          errors.push({ row: rowNum, column: "className", reason: `Kelas "${r.classname}" tidak ditemukan` });
        }
      }
    }

    return errors;
  }

  private async validateClasses(rows: any[], schoolId: number): Promise<ImportError[]> {
    const errors: ImportError[] = [];
    const ay = await this.repo.getActiveAcademicYear(schoolId);

    if (!ay) {
      return [{ row: 1, column: "File", reason: "Tahun ajaran aktif tidak ditemukan untuk sekolah ini" }];
    }

    const [dbClasses, dbTeachers] = await Promise.all([
      this.repo.getActiveClasses(schoolId, ay.id),
      this.repo.getActiveTeachers(schoolId)
    ]);

    const dbClassNames = new Set<string>(dbClasses.map((c) => c.name.toLowerCase()));
    const dbTeacherNips = new Set<string>();
    for (const t of dbTeachers) {
      if (t.nip) dbTeacherNips.add(t.nip);
    }

    const sheetClassNames = new Set<string>();

    const validGrades = new Set(["7", "8", "9", "10", "11", "12"]);

    for (let i = 0; i < rows.length; i++) {
      const rowNum = i + 2;
      const r = rows[i];

      // name check
      if (!r.name) {
        errors.push({ row: rowNum, column: "name", reason: "Nama kelas wajib diisi" });
      } else {
        const lowerName = r.name.toLowerCase();
        if (sheetClassNames.has(lowerName)) {
          errors.push({ row: rowNum, column: "name", reason: "Nama kelas ganda di dalam file Excel" });
        } else {
          sheetClassNames.add(lowerName);
        }
        if (dbClassNames.has(lowerName)) {
          errors.push({ row: rowNum, column: "name", reason: "Nama kelas sudah digunakan" });
        }
      }

      // grade level check
      if (!r.gradelevel || !validGrades.has(r.gradelevel)) {
        errors.push({ row: rowNum, column: "gradeLevel", reason: "Grade level harus antara 7-12" });
      }

      // homeroom teacher check
      if (!r.homeroomteachernip) {
        errors.push({ row: rowNum, column: "homeroomTeacherNip", reason: "NIP wali kelas wajib diisi" });
      } else if (!dbTeacherNips.has(r.homeroomteachernip)) {
        errors.push({ row: rowNum, column: "homeroomTeacherNip", reason: "Guru dengan NIP tersebut tidak ditemukan di sekolah ini" });
      }
    }

    return errors;
  }

  private async validateSubjects(rows: any[], schoolId: number): Promise<ImportError[]> {
    const errors: ImportError[] = [];
    const dbSubjects = await this.repo.getActiveSubjects(schoolId);

    const dbCodes = new Set<string>(dbSubjects.map((s) => s.code.toLowerCase()));
    const dbNamesGrades = new Set<string>(dbSubjects.map((s) => `${s.name.toLowerCase()}-${s.gradeLevel}`));

    const sheetCodes = new Set<string>();
    const sheetNamesGrades = new Set<string>();

    const validGrades = new Set(["7", "8", "9", "10", "11", "12"]);

    for (let i = 0; i < rows.length; i++) {
      const rowNum = i + 2;
      const r = rows[i];

      // code check
      if (!r.code) {
        errors.push({ row: rowNum, column: "code", reason: `Kode mata pelajaran wajib diisi. (Kolom yang terbaca di sistem: ${Object.keys(r).join(", ")})` });
      } else {
        const lowerCode = r.code.toLowerCase();
        if (sheetCodes.has(lowerCode)) {
          errors.push({ row: rowNum, column: "code", reason: "Kode ganda di dalam file Excel" });
        } else {
          sheetCodes.add(lowerCode);
        }
        if (dbCodes.has(lowerCode)) {
          errors.push({ row: rowNum, column: "code", reason: "Kode sudah digunakan" });
        }
      }

      // name check
      if (!r.name) {
        errors.push({ row: rowNum, column: "name", reason: "Nama mata pelajaran wajib diisi" });
      } else if (!r.gradelevel) {
        // diproses di grade level check
      } else {
        const lowerName = r.name.toLowerCase();
        const nameGradeKey = `${lowerName}-${r.gradelevel}`;
        if (sheetNamesGrades.has(nameGradeKey)) {
          errors.push({ row: rowNum, column: "name", reason: `Nama mata pelajaran "${r.name}" ganda untuk Kelas ${r.gradelevel} di dalam file Excel` });
        } else {
          sheetNamesGrades.add(nameGradeKey);
        }
        if (dbNamesGrades.has(nameGradeKey)) {
          errors.push({ row: rowNum, column: "name", reason: `Nama mata pelajaran "${r.name}" sudah digunakan untuk Kelas ${r.gradelevel}` });
        }
      }

      // grade level check
      if (!r.gradelevel || !validGrades.has(r.gradelevel)) {
        errors.push({ row: rowNum, column: "gradeLevel", reason: "Grade level harus antara 7-12" });
      }
    }

    return errors;
  }

  private async validateClassMembers(rows: any[], schoolId: number): Promise<ImportError[]> {
    const errors: ImportError[] = [];
    const ay = await this.repo.getActiveAcademicYear(schoolId);

    if (!ay) {
      return [{ row: 1, column: "File", reason: "Tahun ajaran aktif tidak ditemukan untuk sekolah ini" }];
    }

    const [dbClasses, dbStudents, dbClassMembers] = await Promise.all([
      this.repo.getActiveClasses(schoolId, ay.id),
      this.repo.getActiveStudents(schoolId),
      this.repo.getActiveClassMembers(schoolId, ay.id)
    ]);

    const classMap = new Map<string, number>();
    for (const c of dbClasses) {
      classMap.set(c.name.toLowerCase(), c.id);
    }

    const studentMap = new Map<string, number>();
    for (const s of dbStudents) {
      if (s.nisn) {
        studentMap.set(s.nisn, s.id);
      }
    }

    // Set of studentIds that already have active class membership in DB for this academic year
    const dbActiveStudentIds = new Set<number>(dbClassMembers.map((m) => m.studentId));

    // Map from studentId to classId in DB to check for same class duplicate
    const dbMemberMap = new Set<string>();
    for (const m of dbClassMembers) {
      dbMemberMap.add(`${m.classId}-${m.studentId}`);
    }

    // Track active memberships in the current upload sheet
    // Map studentNis to active className they are enrolled in
    const sheetActiveStudents = new Map<string, string>();
    const sheetMemberMap = new Set<string>();

    for (let i = 0; i < rows.length; i++) {
      const rowNum = i + 2;
      const r = rows[i];

      // className check
      if (!r.classname) {
        errors.push({ row: rowNum, column: "className", reason: "Nama kelas wajib diisi" });
      }

      // nisn check
      if (!r.nisn) {
        errors.push({ row: rowNum, column: "nisn", reason: "NISN siswa wajib diisi" });
      }

      if (r.classname && r.nisn) {
        const classId = classMap.get(r.classname.toLowerCase());
        const studentId = studentMap.get(r.nisn);

        if (!classId) {
          errors.push({ row: rowNum, column: "className", reason: "Kelas tidak ditemukan" });
        }
        if (!studentId) {
          errors.push({ row: rowNum, column: "nisn", reason: "Siswa dengan NISN tersebut tidak ditemukan" });
        }

        if (classId && studentId) {
          const key = `${classId}-${studentId}`;

          // Check duplicate membership for SAME class in sheet/db
          if (sheetMemberMap.has(key) || dbMemberMap.has(key)) {
            errors.push({ row: rowNum, column: "nisn", reason: "Siswa sudah terdaftar di kelas ini" });
          } else {
            sheetMemberMap.add(key);
          }

          // Check active membership in ANOTHER class for the same academic year in sheet/db
          const enrolledClassInSheet = sheetActiveStudents.get(r.nisn);
          if (enrolledClassInSheet) {
            errors.push({
              row: rowNum,
              column: "nisn",
              reason: `Siswa sudah memiliki kelas aktif lain (${enrolledClassInSheet}) pada tahun ajaran yang sama`
            });
          } else if (dbActiveStudentIds.has(studentId)) {
            errors.push({
              row: rowNum,
              column: "nisn",
              reason: "Siswa sudah memiliki kelas aktif lain pada tahun ajaran yang sama"
            });
          } else {
            sheetActiveStudents.set(r.nisn, r.classname);
          }
        }
      }
    }

    return errors;
  }

  private async validateSchedules(rows: any[], schoolId: number): Promise<ImportError[]> {
    const errors: ImportError[] = [];
    const ay = await this.repo.getActiveAcademicYear(schoolId);

    if (!ay) {
      return [{ row: 1, column: "File", reason: "Tahun ajaran aktif tidak ditemukan untuk sekolah ini" }];
    }

    const [dbClasses, dbTeachers, dbSubjects] = await Promise.all([
      this.repo.getActiveClasses(schoolId, ay.id),
      this.repo.getActiveTeachers(schoolId),
      this.repo.getActiveSubjects(schoolId)
    ]);

    const dbClassNames = new Set<string>(dbClasses.map((c) => c.name.toLowerCase()));
    const dbSubjectCodes = new Set<string>(dbSubjects.map((s) => s.code.toLowerCase()));
    const dbTeacherNips = new Set<string>();
    for (const t of dbTeachers) if (t.nip) dbTeacherNips.add(t.nip);

    const validDays = new Set(["senin", "selasa", "rabu", "kamis", "jumat", "sabtu", "minggu"]);

    for (let i = 0; i < rows.length; i++) {
      const rowNum = i + 2;
      const r = rows[i];

      // Support Indonesian aliases for headers
      r.day = r.day || r.hari || "";
      r.starttime = r.starttime || r["jam mulai"] || r.jammulai || r.start || "";
      r.endtime = r.endtime || r["jam selesai"] || r.jamselesai || r.end || "";
      r.classname = r.classname || r.kelas || r.namakelas || r["nama kelas"] || "";
      r.subjectcode = r.subjectcode || r.kodemapel || r.mapel || r["kode mapel"] || "";
      r.teachernip = r.teachernip || r.nip || r.nipguru || r["nip guru"] || "";

      // day check
      const dayVal = r.day ? r.day.toLowerCase() : "";
      if (!dayVal || !validDays.has(dayVal)) {
        errors.push({ row: rowNum, column: "day", reason: `Hari tidak valid (Senin-Minggu). Terbaca di sistem: "${r.day || ''}"` });
      }

      // Reassign to title case for consistency in DB
      if (dayVal) {
        r.day = dayVal.charAt(0).toUpperCase() + dayVal.slice(1);
      }

      // startTime and endTime check (basic regex for HH:mm)
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (!r.starttime || !timeRegex.test(r.starttime)) {
        errors.push({ row: rowNum, column: "startTime", reason: "Format jam mulai tidak valid (HH:mm)" });
      }
      if (!r.endtime || !timeRegex.test(r.endtime)) {
        errors.push({ row: rowNum, column: "endTime", reason: "Format jam selesai tidak valid (HH:mm)" });
      }

      // className check
      if (!r.classname) {
        errors.push({ row: rowNum, column: "className", reason: "Nama kelas wajib diisi" });
      } else if (!dbClassNames.has(r.classname.toLowerCase())) {
        errors.push({ row: rowNum, column: "className", reason: "Kelas tidak ditemukan pada tahun ajaran ini" });
      }

      // subjectCode check
      if (!r.subjectcode) {
        errors.push({ row: rowNum, column: "subjectCode", reason: "Kode mata pelajaran wajib diisi" });
      } else if (!dbSubjectCodes.has(r.subjectcode.toLowerCase())) {
        errors.push({ row: rowNum, column: "subjectCode", reason: "Kode mata pelajaran tidak ditemukan" });
      }

      // teacherNip check
      if (!r.teachernip) {
        errors.push({ row: rowNum, column: "teacherNip", reason: "NIP Guru wajib diisi" });
      } else if (!dbTeacherNips.has(r.teachernip)) {
        errors.push({ row: rowNum, column: "teacherNip", reason: "Guru dengan NIP tersebut tidak ditemukan" });
      }
    }

    return errors;
  }
}
