// @ts-nocheck
import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { db } from "../src/db";
import { schools } from "../src/schema/schools";
import { users } from "../src/schema/users";
import { classes } from "../src/schema/classes";
import { students } from "../src/schema/students";
import { classMembers } from "../src/schema/classMembers";
import { academicYears } from "../src/schema/academicYears";
import { teachers } from "../src/schema/teachers";
import { subjects } from "../src/schema/subjects";
import { sessions } from "../src/schema/sessions";
import { auditLogs } from "../src/schema/auditLogs";
import { hashPassword } from "../src/utils/password";
import { eq } from "drizzle-orm";
import * as XLSX from "xlsx";

function createExcelFile(headers: string[], data: any[][], filename = "test.xlsx"): File {
  const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
  return new File([buf], filename, { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
}

describe("Modul Excel Import GuruHub - Integration & Security tests", () => {
  let school1Id: number;
  let school2Id: number;
  let academicYearId: number;

  let superAdminToken: string;
  let adminToken: string;
  let principalToken: string;
  let teacherToken: string;
  let studentToken: string;
  let school2AdminToken: string;

  const rawPassword = "GuruHub!2026";

  beforeAll(async () => {
    // 1. Setup Sekolah
    const [s1] = await db.insert(schools).values({
      npsn: "11990001",
      name: "Import Test School 1",
      level: "SMP",
      status: "Negeri"
    });
    school1Id = s1.insertId;

    const [s2] = await db.insert(schools).values({
      npsn: "11990002",
      name: "Import Test School 2",
      level: "SMP",
      status: "Swasta"
    });
    school2Id = s2.insertId;

    // 2. Setup TA
    const [ay] = await db.insert(academicYears).values({
      schoolId: school1Id,
      year: "2026/2027",
      semester: "Ganjil",
      isActive: true
    });
    academicYearId = ay.insertId;

    // 3. Setup Hash
    const passwordHash = await hashPassword(rawPassword);

    // 4. Setup Users
    await db.insert(users).values([
      { schoolId: school1Id, email: "superadmin.imp@guruhub.sch.id", passwordHash, role: "SuperAdmin" },
      { schoolId: school1Id, email: "admin.imp@school1.sch.id", passwordHash, role: "SchoolAdmin" },
      { schoolId: school1Id, email: "principal.imp@school1.sch.id", passwordHash, role: "Principal" },
      { schoolId: school1Id, email: "teacher.imp@school1.sch.id", passwordHash, role: "Teacher" },
      { schoolId: school1Id, email: "student.imp@school1.sch.id", passwordHash, role: "Student" },
      { schoolId: school2Id, email: "admin.imp@school2.sch.id", passwordHash, role: "SchoolAdmin" }
    ]);

    // Login tokens
    const fetchToken = async (schoolId: number, email: string) => {
      const res = await fetch("http://localhost:3000/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ schoolId, email, password: rawPassword })
      });
      const body = await res.json();
      return body.accessToken;
    };

    superAdminToken = await fetchToken(school1Id, "superadmin.imp@guruhub.sch.id");
    adminToken = await fetchToken(school1Id, "admin.imp@school1.sch.id");
    principalToken = await fetchToken(school1Id, "principal.imp@school1.sch.id");
    teacherToken = await fetchToken(school1Id, "teacher.imp@school1.sch.id");
    studentToken = await fetchToken(school1Id, "student.imp@school1.sch.id");
    school2AdminToken = await fetchToken(school2Id, "admin.imp@school2.sch.id");
  });

  afterAll(async () => {
    // Clean all seeded data
    await db.delete(classMembers).where(eq(classMembers.schoolId, school1Id));
    await db.delete(students).where(eq(students.schoolId, school1Id));
    await db.delete(classes).where(eq(classes.schoolId, school1Id));
    await db.delete(subjects).where(eq(subjects.schoolId, school1Id));
    await db.delete(teachers).where(eq(teachers.schoolId, school1Id));
    await db.delete(academicYears).where(eq(academicYears.schoolId, school1Id));
    await db.delete(sessions);
    await db.delete(auditLogs);
    await db.delete(users);
    await db.delete(schools);
  });

  // --- UPLOAD & FILE VALIDATION TESTS ---

  it("1. POST /import/upload - SchoolAdmin succeeds with valid xlsx", async () => {
    const file = createExcelFile(["col1", "col2"], [["val1", "val2"]]);
    const fd = new FormData();
    fd.append("file", file);

    const res = await fetch("http://localhost:3000/import/upload", {
      method: "POST",
      headers: { "x-school-id": String(school1Id), Authorization: `Bearer ${adminToken}` },
      body: fd
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.message).toContain("Excel valid");
  });

  it("2. POST /import/upload - Student returns Forbidden (403)", async () => {
    const file = createExcelFile(["col"], [["val"]]);
    const fd = new FormData();
    fd.append("file", file);

    const res = await fetch("http://localhost:3000/import/upload", {
      method: "POST",
      headers: { "x-school-id": String(school1Id), Authorization: `Bearer ${studentToken}` },
      body: fd
    });
    expect(res.status).toBe(403);
  });

  it("3. POST /import/upload - Teacher returns Forbidden (403)", async () => {
    const file = createExcelFile(["col"], [["val"]]);
    const fd = new FormData();
    fd.append("file", file);

    const res = await fetch("http://localhost:3000/import/upload", {
      method: "POST",
      headers: { "x-school-id": String(school1Id), Authorization: `Bearer ${teacherToken}` },
      body: fd
    });
    expect(res.status).toBe(403);
  });

  it("4. POST /import/upload - Returns 400 for invalid file extension", async () => {
    const file = new File([Buffer.from("invalid")], "test.txt", { type: "text/plain" });
    const fd = new FormData();
    fd.append("file", file);

    const res = await fetch("http://localhost:3000/import/upload", {
      method: "POST",
      headers: { "x-school-id": String(school1Id), Authorization: `Bearer ${adminToken}` },
      body: fd
    });
    expect(res.status).toBe(400);
  });

  it("5. POST /import/upload - Returns 400 if file is missing", async () => {
    const fd = new FormData();
    const res = await fetch("http://localhost:3000/import/upload", {
      method: "POST",
      headers: { "x-school-id": String(school1Id), Authorization: `Bearer ${adminToken}` },
      body: fd
    });
    expect(res.status).toBe(400);
  });

  // --- PREVIEW TESTS ---

  it("6. POST /import/preview - Preview teachers template", async () => {
    const file = createExcelFile(
      ["nip", "name", "gender", "phone"],
      [
        ["1980010101", "Budi Santoso", "L", "08123456789"],
        ["1980010102", "Siti Aminah", "P", "08123456780"]
      ]
    );
    const fd = new FormData();
    fd.append("file", file);

    const res = await fetch("http://localhost:3000/import/preview", {
      method: "POST",
      headers: { "x-school-id": String(school1Id), Authorization: `Bearer ${adminToken}` },
      body: fd
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.validRows).toBe(2);
    expect(body.data.invalidRows).toBe(0);
    expect(body.data.errors.length).toBe(0);
  });

  it("7. POST /import/preview - Preview students template", async () => {
    const file = createExcelFile(
      ["nisn", "nis", "name", "gender"],
      [
        ["0123456789", "10001", "Ali", "L"],
        ["0123456780", "10002", "Bella", "P"]
      ]
    );
    const fd = new FormData();
    fd.append("file", file);

    const res = await fetch("http://localhost:3000/import/preview", {
      method: "POST",
      headers: { "x-school-id": String(school1Id), Authorization: `Bearer ${adminToken}` },
      body: fd
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.validRows).toBe(2);
  });

  it("8. POST /import/preview - Preview classes template", async () => {
    const file = createExcelFile(
      ["name", "gradeLevel", "homeroomTeacherNip"],
      [
        ["VII-A", "7", "1980010101"]
      ]
    );
    const fd = new FormData();
    fd.append("file", file);

    const res = await fetch("http://localhost:3000/import/preview", {
      method: "POST",
      headers: { "x-school-id": String(school1Id), Authorization: `Bearer ${adminToken}` },
      body: fd
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  it("9. POST /import/preview - Preview subjects template", async () => {
    const file = createExcelFile(
      ["code", "name", "gradeLevel"],
      [
        ["MATH-7", "Matematika 7", "7"]
      ]
    );
    const fd = new FormData();
    fd.append("file", file);

    const res = await fetch("http://localhost:3000/import/preview", {
      method: "POST",
      headers: { "x-school-id": String(school1Id), Authorization: `Bearer ${adminToken}` },
      body: fd
    });
    expect(res.status).toBe(200);
  });

  it("10. POST /import/preview - Preview class members template", async () => {
    const file = createExcelFile(
      ["className", "nis"],
      [
        ["VII-A", "10001"]
      ]
    );
    const fd = new FormData();
    fd.append("file", file);

    const res = await fetch("http://localhost:3000/import/preview", {
      method: "POST",
      headers: { "x-school-id": String(school1Id), Authorization: `Bearer ${adminToken}` },
      body: fd
    });
    expect(res.status).toBe(200);
  });

  it("11. POST /import/preview - Preview unrecognized template returns 400", async () => {
    const file = createExcelFile(["unrecognizedKey"], [["val"]]);
    const fd = new FormData();
    fd.append("file", file);

    const res = await fetch("http://localhost:3000/import/preview", {
      method: "POST",
      headers: { "x-school-id": String(school1Id), Authorization: `Bearer ${adminToken}` },
      body: fd
    });
    expect(res.status).toBe(400);
  });

  // --- IMPORT TEACHERS TESTS ---

  it("12. POST /import/teachers - Successfully import teachers", async () => {
    const file = createExcelFile(
      ["nip", "name", "gender", "phone"],
      [
        ["TCH-001", "Pak Budi", "L", "0811"],
        ["TCH-002", "Ibu Rina", "P", "0812"]
      ]
    );
    const fd = new FormData();
    fd.append("file", file);

    const res = await fetch("http://localhost:3000/import/teachers", {
      method: "POST",
      headers: { "x-school-id": String(school1Id), Authorization: `Bearer ${adminToken}` },
      body: fd
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.importedRows).toBe(2);
  });

  it("13. POST /import/teachers - Fails on duplicate NIP in sheet", async () => {
    const file = createExcelFile(
      ["nip", "name", "gender", "phone"],
      [
        ["TCH-DUP", "Teacher 1", "L", ""],
        ["TCH-DUP", "Teacher 2", "P", ""]
      ]
    );
    const fd = new FormData();
    fd.append("file", file);

    const res = await fetch("http://localhost:3000/import/teachers", {
      method: "POST",
      headers: { "x-school-id": String(school1Id), Authorization: `Bearer ${adminToken}` },
      body: fd
    });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.errors[0].reason).toContain("ganda");
  });

  it("14. POST /import/teachers - Fails on duplicate NIP in DB", async () => {
    const file = createExcelFile(
      ["nip", "name", "gender", "phone"],
      [
        ["TCH-001", "Budi Santoso", "L", ""] // already created in test 12
      ]
    );
    const fd = new FormData();
    fd.append("file", file);

    const res = await fetch("http://localhost:3000/import/teachers", {
      method: "POST",
      headers: { "x-school-id": String(school1Id), Authorization: `Bearer ${adminToken}` },
      body: fd
    });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.errors[0].column).toBe("nip");
    expect(body.errors[0].reason).toContain("sudah digunakan");
  });

  it("15. POST /import/teachers - Fails on invalid gender value", async () => {
    const file = createExcelFile(
      ["nip", "name", "gender", "phone"],
      [
        ["TCH-003", "Asep", "X", ""]
      ]
    );
    const fd = new FormData();
    fd.append("file", file);

    const res = await fetch("http://localhost:3000/import/teachers", {
      method: "POST",
      headers: { "x-school-id": String(school1Id), Authorization: `Bearer ${adminToken}` },
      body: fd
    });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.errors[0].column).toBe("gender");
  });

  // --- IMPORT STUDENTS TESTS ---

  it("16. POST /import/students - Successfully import students", async () => {
    const file = createExcelFile(
      ["nisn", "nis", "name", "gender"],
      [
        ["1000000001", "STD-01", "Andi", "L"],
        ["1000000002", "STD-02", "Riana", "P"]
      ]
    );
    const fd = new FormData();
    fd.append("file", file);

    const res = await fetch("http://localhost:3000/import/students", {
      method: "POST",
      headers: { "x-school-id": String(school1Id), Authorization: `Bearer ${adminToken}` },
      body: fd
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.importedRows).toBe(2);
  });

  it("17. POST /import/students - Fails on duplicate NISN in DB (global uniqueness)", async () => {
    const file = createExcelFile(
      ["nisn", "nis", "name", "gender"],
      [
        ["1000000001", "STD-99", "Duplikat NISN", "L"] // 1000000001 already used in test 16
      ]
    );
    const fd = new FormData();
    fd.append("file", file);

    const res = await fetch("http://localhost:3000/import/students", {
      method: "POST",
      headers: { "x-school-id": String(school1Id), Authorization: `Bearer ${adminToken}` },
      body: fd
    });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.errors[0].column).toBe("nisn");
    expect(body.errors[0].reason).toContain("sudah digunakan");
  });

  it("18. POST /import/students - Fails on duplicate NIS in DB (school uniqueness)", async () => {
    const file = createExcelFile(
      ["nisn", "nis", "name", "gender"],
      [
        ["1000000005", "STD-01", "Duplikat NIS", "P"] // STD-01 already used in test 16
      ]
    );
    const fd = new FormData();
    fd.append("file", file);

    const res = await fetch("http://localhost:3000/import/students", {
      method: "POST",
      headers: { "x-school-id": String(school1Id), Authorization: `Bearer ${adminToken}` },
      body: fd
    });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.errors[0].column).toBe("nis");
    expect(body.errors[0].reason).toContain("sudah digunakan");
  });

  // --- IMPORT CLASSES TESTS ---

  it("19. POST /import/classes - Successfully import classes", async () => {
    const file = createExcelFile(
      ["name", "gradeLevel", "homeroomTeacherNip"],
      [
        ["VII-A", "7", "TCH-001"],
        ["VII-B", "7", "TCH-002"]
      ]
    );
    const fd = new FormData();
    fd.append("file", file);

    const res = await fetch("http://localhost:3000/import/classes", {
      method: "POST",
      headers: { "x-school-id": String(school1Id), Authorization: `Bearer ${adminToken}` },
      body: fd
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.importedRows).toBe(2);
  });

  it("20. POST /import/classes - Fails on non-existent homeroom teacher NIP", async () => {
    const file = createExcelFile(
      ["name", "gradeLevel", "homeroomTeacherNip"],
      [
        ["VII-C", "7", "TCH-NONEXIST"]
      ]
    );
    const fd = new FormData();
    fd.append("file", file);

    const res = await fetch("http://localhost:3000/import/classes", {
      method: "POST",
      headers: { "x-school-id": String(school1Id), Authorization: `Bearer ${adminToken}` },
      body: fd
    });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.errors[0].column).toBe("homeroomTeacherNip");
    expect(body.errors[0].reason).toContain("tidak ditemukan");
  });

  it("21. POST /import/classes - Fails on duplicate class name in DB", async () => {
    const file = createExcelFile(
      ["name", "gradeLevel", "homeroomTeacherNip"],
      [
        ["VII-A", "7", "TCH-002"] // VII-A already imported in test 19
      ]
    );
    const fd = new FormData();
    fd.append("file", file);

    const res = await fetch("http://localhost:3000/import/classes", {
      method: "POST",
      headers: { "x-school-id": String(school1Id), Authorization: `Bearer ${adminToken}` },
      body: fd
    });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.errors[0].column).toBe("name");
    expect(body.errors[0].reason).toContain("sudah digunakan");
  });

  // --- IMPORT SUBJECTS TESTS ---

  it("22. POST /import/subjects - Successfully import subjects", async () => {
    const file = createExcelFile(
      ["code", "name", "gradeLevel"],
      [
        ["MATH-7", "Matematika Kelas 7", "7"],
        ["IND-7", "Bahasa Indonesia 7", "7"]
      ]
    );
    const fd = new FormData();
    fd.append("file", file);

    const res = await fetch("http://localhost:3000/import/subjects", {
      method: "POST",
      headers: { "x-school-id": String(school1Id), Authorization: `Bearer ${adminToken}` },
      body: fd
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.importedRows).toBe(2);
  });

  it("23. POST /import/subjects - Fails on duplicate code in DB", async () => {
    const file = createExcelFile(
      ["code", "name", "gradeLevel"],
      [
        ["MATH-7", "Aljabar Baru", "7"] // MATH-7 already used
      ]
    );
    const fd = new FormData();
    fd.append("file", file);

    const res = await fetch("http://localhost:3000/import/subjects", {
      method: "POST",
      headers: { "x-school-id": String(school1Id), Authorization: `Bearer ${adminToken}` },
      body: fd
    });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.errors[0].column).toBe("code");
    expect(body.errors[0].reason).toContain("sudah digunakan");
  });

  // --- IMPORT CLASS MEMBERS TESTS ---

  it("24. POST /import/class-members - Successfully import class members", async () => {
    const file = createExcelFile(
      ["className", "nis"],
      [
        ["VII-A", "STD-01"]
      ]
    );
    const fd = new FormData();
    fd.append("file", file);

    const res = await fetch("http://localhost:3000/import/class-members", {
      method: "POST",
      headers: { "x-school-id": String(school1Id), Authorization: `Bearer ${adminToken}` },
      body: fd
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.importedRows).toBe(1);
  });

  it("25. POST /import/class-members - Fails on student NIS not found", async () => {
    const file = createExcelFile(
      ["className", "nis"],
      [
        ["VII-A", "STD-NONEXIST"]
      ]
    );
    const fd = new FormData();
    fd.append("file", file);

    const res = await fetch("http://localhost:3000/import/class-members", {
      method: "POST",
      headers: { "x-school-id": String(school1Id), Authorization: `Bearer ${adminToken}` },
      body: fd
    });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.errors[0].column).toBe("nis");
    expect(body.errors[0].reason).toContain("tidak ditemukan");
  });

  it("26. POST /import/class-members - Fails on className not found", async () => {
    const file = createExcelFile(
      ["className", "nis"],
      [
        ["VII-NONEXIST", "STD-02"]
      ]
    );
    const fd = new FormData();
    fd.append("file", file);

    const res = await fetch("http://localhost:3000/import/class-members", {
      method: "POST",
      headers: { "x-school-id": String(school1Id), Authorization: `Bearer ${adminToken}` },
      body: fd
    });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.errors[0].column).toBe("className");
  });

  it("27. POST /import/class-members - Fails on double active membership in same academic year", async () => {
    const file = createExcelFile(
      ["className", "nis"],
      [
        ["VII-B", "STD-01"] // STD-01 is already active in VII-A for same AY
      ]
    );
    const fd = new FormData();
    fd.append("file", file);

    const res = await fetch("http://localhost:3000/import/class-members", {
      method: "POST",
      headers: { "x-school-id": String(school1Id), Authorization: `Bearer ${adminToken}` },
      body: fd
    });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.errors[0].column).toBe("nis");
    expect(body.errors[0].reason).toContain("kelas aktif lain");
  });

  // --- TEMPLATE DOWNLOADS TESTS ---

  it("28. GET /import/templates/students - Download empty template", async () => {
    const res = await fetch("http://localhost:3000/import/templates/students", {
      headers: { "x-school-id": String(school1Id), Authorization: `Bearer ${adminToken}` }
    });
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("spreadsheetml.sheet");
    const buf = await res.arrayBuffer();
    const wb = XLSX.read(Buffer.from(buf), { type: "buffer" });
    const sheetData = XLSX.utils.sheet_to_json<string[]>(wb.Sheets[wb.SheetNames[0]], { header: 1 });
    const keys = sheetData[0];
    expect(keys).toContain("nisn");
    expect(keys).toContain("nis");
  });

  it("29. GET /import/templates/teachers - Download empty template", async () => {
    const res = await fetch("http://localhost:3000/import/templates/teachers", {
      headers: { "x-school-id": String(school1Id), Authorization: `Bearer ${adminToken}` }
    });
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("spreadsheetml.sheet");
  });

  it("30. GET /import/templates/classes - Download empty template", async () => {
    const res = await fetch("http://localhost:3000/import/templates/classes", {
      headers: { "x-school-id": String(school1Id), Authorization: `Bearer ${adminToken}` }
    });
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("spreadsheetml.sheet");
  });

  it("31. GET /import/templates/subjects - Download empty template", async () => {
    const res = await fetch("http://localhost:3000/import/templates/subjects", {
      headers: { "x-school-id": String(school1Id), Authorization: `Bearer ${adminToken}` }
    });
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("spreadsheetml.sheet");
  });

  it("32. GET /import/templates/class-members - Download empty template", async () => {
    const res = await fetch("http://localhost:3000/import/templates/class-members", {
      headers: { "x-school-id": String(school1Id), Authorization: `Bearer ${adminToken}` }
    });
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("spreadsheetml.sheet");
  });

  // --- TENANT ISOLATION TESTS ---

  it("33. Tenant Isolation - School 2 Admin cannot import to School 1", async () => {
    const file = createExcelFile(
      ["nip", "name", "gender", "phone"],
      [
        ["TCH-999", "Guru Sekolah 2", "L", ""]
      ]
    );
    const fd = new FormData();
    fd.append("file", file);

    const res = await fetch("http://localhost:3000/import/teachers", {
      method: "POST",
      headers: { "x-school-id": String(school1Id), Authorization: `Bearer ${school2AdminToken}` }, // School 2 admin trying to write to School 1
      body: fd
    });
    expect(res.status).toBe(403);
  });
});
