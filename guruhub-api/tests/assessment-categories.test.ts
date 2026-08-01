// @ts-nocheck
import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { db } from "../src/db";
import { schools } from "../src/schema/schools";
import { users } from "../src/schema/users";
import { academicYears } from "../src/schema/academicYears";
import { teachers } from "../src/schema/teachers";
import { assessmentCategories } from "../src/schema/assessmentCategories";
import { sessions } from "../src/schema/sessions";
import { auditLogs } from "../src/schema/auditLogs";
import { hashPassword } from "../src/utils/password";
import { eq, and, isNull, isNotNull } from "drizzle-orm";

describe("Modul Assessment Categories GuruHub - Clean Architecture & Tenant Isolation", () => {
  let school1Id: number;
  let school2Id: number;
  let academicYear1Id: number;
  let academicYear2Id: number;

  let admin1Token: string;
  let admin2Token: string;
  let principal1Token: string;
  let teacherToken: string;
  let studentToken: string;

  let createdCategoryId1: number;
  let createdCategoryIdForDelete: number;
  let defaultCategoryId: number;

  const rawPassword = "GuruHub!2026";

  beforeAll(async () => {
    // 1. Setup Sekolah
    const [s1] = await db.insert(schools).values({
      npsn: "33445566",
      name: "Categories School 1",
      level: "SMA",
      status: "Swasta",
    });
    school1Id = s1.insertId;

    const [s2] = await db.insert(schools).values({
      npsn: "33445567",
      name: "Categories School 2",
      level: "SMA",
      status: "Negeri",
    });
    school2Id = s2.insertId;

    // 2. Setup Tahun Ajaran
    const [ay1] = await db.insert(academicYears).values({
      schoolId: school1Id,
      year: "2026/2027",
      semester: "Ganjil",
      isActive: true,
    });
    academicYear1Id = ay1.insertId;

    const [ay2] = await db.insert(academicYears).values({
      schoolId: school2Id,
      year: "2026/2027",
      semester: "Ganjil",
      isActive: true,
    });
    academicYear2Id = ay2.insertId;

    // 3. Setup User Akun
    const passwordHash = await hashPassword(rawPassword);

    const [uAdmin1] = await db.insert(users).values({
      schoolId: school1Id,
      email: "admin.categories@school1.sch.id",
      passwordHash,
      role: "SchoolAdmin",
    });

    const [uAdmin2] = await db.insert(users).values({
      schoolId: school2Id,
      email: "admin.categories@school2.sch.id",
      passwordHash,
      role: "SchoolAdmin",
    });

    const [uPrincipal1] = await db.insert(users).values({
      schoolId: school1Id,
      email: "principal.categories@school1.sch.id",
      passwordHash,
      role: "Principal",
    });

    const [uTeacher1] = await db.insert(users).values({
      schoolId: school1Id,
      email: "teacher1.categories@school1.sch.id",
      passwordHash,
      role: "Teacher",
    });

    const [uStudent] = await db.insert(users).values({
      schoolId: school1Id,
      email: "student.categories@school1.sch.id",
      passwordHash,
      role: "Student",
    });

    // 4. Setup Profil Guru
    await db.insert(teachers).values({
      schoolId: school1Id,
      userId: uTeacher1.insertId,
      name: "Teacher Categories",
      gender: "L",
    });

    // 5. Login untuk mengambil token
    const fetchToken = async (schoolId: number, email: string) => {
      const res = await fetch("http://localhost:3000/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ schoolId, email, password: rawPassword }),
      });
      const body = await res.json();
      return body.accessToken;
    };

    admin1Token = await fetchToken(school1Id, "admin.categories@school1.sch.id");
    admin2Token = await fetchToken(school2Id, "admin.categories@school2.sch.id");
    principal1Token = await fetchToken(school1Id, "principal.categories@school1.sch.id");
    teacherToken = await fetchToken(school1Id, "teacher1.categories@school1.sch.id");
    studentToken = await fetchToken(school1Id, "student.categories@school1.sch.id");
  });

  afterAll(async () => {
    await db.delete(assessmentCategories);
    await db.delete(teachers);
    await db.delete(academicYears);
    await db.delete(sessions);
    await db.delete(auditLogs);
    await db.delete(users);
    await db.delete(schools);
  });

  // 1. Admin berhasil membuat kategori.
  it("1. Admin berhasil membuat kategori", async () => {
    const res = await fetch("http://localhost:3000/assessment-categories", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-school-id": String(school1Id),
        "Authorization": `Bearer ${admin1Token}`,
      },
      body: JSON.stringify({
        name: "Tugas",
        weight: 20,
        isDefault: false,
      }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.id).toBeDefined();
    expect(body.data.name).toBe("Tugas");
    createdCategoryId1 = body.data.id;
  });

  // 2. Teacher tidak boleh membuat kategori.
  it("2. Teacher tidak boleh membuat kategori", async () => {
    const res = await fetch("http://localhost:3000/assessment-categories", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-school-id": String(school1Id),
        "Authorization": `Bearer ${teacherToken}`,
      },
      body: JSON.stringify({
        name: "Pratik",
        weight: 20,
      }),
    });

    expect(res.status).toBe(403);
  });

  // 3. Nama kategori duplikat ditolak.
  it("3. Nama kategori duplikat ditolak", async () => {
    const res = await fetch("http://localhost:3000/assessment-categories", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-school-id": String(school1Id),
        "Authorization": `Bearer ${admin1Token}`,
      },
      body: JSON.stringify({
        name: "Tugas", // Duplikat
        weight: 15,
      }),
    });

    expect(res.status).toBe(409);
  });

  // 4. Bobot negatif ditolak.
  it("4. Bobot negatif ditolak", async () => {
    const res = await fetch("http://localhost:3000/assessment-categories", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-school-id": String(school1Id),
        "Authorization": `Bearer ${admin1Token}`,
      },
      body: JSON.stringify({
        name: "Negatif",
        weight: -5,
      }),
    });

    expect(res.status).toBe(400);
  });

  // 5. Bobot >100 ditolak.
  it("5. Bobot >100 ditolak", async () => {
    const res = await fetch("http://localhost:3000/assessment-categories", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-school-id": String(school1Id),
        "Authorization": `Bearer ${admin1Token}`,
      },
      body: JSON.stringify({
        name: "Lebih 100",
        weight: 105,
      }),
    });

    expect(res.status).toBe(400);
  });

  // 6. Total bobot >100 ditolak.
  it("6. Total bobot >100 ditolak", async () => {
    // Saat ini Tugas = 20. Kita coba tambahkan kategori baru dengan bobot 90 (Total = 110 > 100)
    const res = await fetch("http://localhost:3000/assessment-categories", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-school-id": String(school1Id),
        "Authorization": `Bearer ${admin1Token}`,
      },
      body: JSON.stringify({
        name: "Kategori Besar",
        weight: 90,
      }),
    });

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("Total bobot kategori aktif tidak boleh melebihi 100%");
  });

  // 7. Teacher dapat membaca kategori.
  it("7. Teacher dapat membaca kategori", async () => {
    const res = await fetch("http://localhost:3000/assessment-categories", {
      method: "GET",
      headers: {
        "x-school-id": String(school1Id),
        "Authorization": `Bearer ${teacherToken}`,
      },
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.length).toBeGreaterThan(0);
  });

  // 8. Student ditolak.
  it("8. Student ditolak", async () => {
    const res = await fetch("http://localhost:3000/assessment-categories", {
      method: "GET",
      headers: {
        "x-school-id": String(school1Id),
        "Authorization": `Bearer ${studentToken}`,
      },
    });

    expect(res.status).toBe(403);
  });

  // 9. Update kategori berhasil.
  it("9. Update kategori berhasil", async () => {
    const res = await fetch(`http://localhost:3000/assessment-categories/${createdCategoryId1}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "x-school-id": String(school1Id),
        "Authorization": `Bearer ${admin1Token}`,
      },
      body: JSON.stringify({
        name: "Tugas Harian",
        weight: 25,
      }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.name).toBe("Tugas Harian");
    expect(body.data.weight).toBe(25);
  });

  // 10. Delete kategori berhasil.
  it("10. Delete kategori berhasil", async () => {
    // 1. Buat kategori kuis terlebih dahulu
    const resCreate = await fetch("http://localhost:3000/assessment-categories", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-school-id": String(school1Id),
        "Authorization": `Bearer ${admin1Token}`,
      },
      body: JSON.stringify({
        name: "Kuis",
        weight: 10,
      }),
    });
    const bodyCreate = await resCreate.json();
    createdCategoryIdForDelete = bodyCreate.data.id;

    // 2. Hapus kategori tersebut
    const resDelete = await fetch(`http://localhost:3000/assessment-categories/${createdCategoryIdForDelete}`, {
      method: "DELETE",
      headers: {
        "x-school-id": String(school1Id),
        "Authorization": `Bearer ${admin1Token}`,
      },
    });

    expect(resDelete.status).toBe(200);
    const bodyDelete = await resDelete.json();
    expect(bodyDelete.success).toBe(true);
  });

  // 11. Kategori default tidak dapat dihapus.
  it("11. Kategori default tidak dapat dihapus", async () => {
    // 1. Buat kategori default
    const resCreate = await fetch("http://localhost:3000/assessment-categories", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-school-id": String(school1Id),
        "Authorization": `Bearer ${admin1Token}`,
      },
      body: JSON.stringify({
        name: "Kategori Default",
        weight: 5,
        isDefault: true,
      }),
    });
    const bodyCreate = await resCreate.json();
    defaultCategoryId = bodyCreate.data.id;

    // 2. Coba hapus -> Harus gagal
    const resDelete = await fetch(`http://localhost:3000/assessment-categories/${defaultCategoryId}`, {
      method: "DELETE",
      headers: {
        "x-school-id": String(school1Id),
        "Authorization": `Bearer ${admin1Token}`,
      },
    });

    expect(resDelete.status).toBe(400);
    const bodyDelete = await resDelete.json();
    expect(bodyDelete.error).toContain("Kategori default tidak boleh dihapus");
  });

  // 12. Tenant isolation berhasil.
  it("12. Tenant isolation berhasil", async () => {
    // Admin 2 mencoba membaca kategori dari sekolah 1
    const res = await fetch(`http://localhost:3000/assessment-categories/${createdCategoryId1}`, {
      method: "GET",
      headers: {
        "x-school-id": String(school2Id), // Header sekolah 2
        "Authorization": `Bearer ${admin2Token}`, // Token sekolah 2
      },
    });

    expect(res.status).toBe(404);
  });

  // 13. Soft delete berhasil.
  it("13. Soft delete berhasil", async () => {
    const dbRecord = await db
      .select()
      .from(assessmentCategories)
      .where(and(eq(assessmentCategories.id, createdCategoryIdForDelete), isNotNull(assessmentCategories.deletedAt)));
    
    expect(dbRecord.length).toBe(1);
  });

  // 14. Data soft deleted tidak muncul.
  it("14. Data soft deleted tidak muncul", async () => {
    // List check
    const resList = await fetch("http://localhost:3000/assessment-categories", {
      method: "GET",
      headers: {
        "x-school-id": String(school1Id),
        "Authorization": `Bearer ${admin1Token}`,
      },
    });
    const bodyList = await resList.json();
    const found = bodyList.data.some((c: any) => c.id === createdCategoryIdForDelete);
    expect(found).toBe(false);

    // Detail check
    const resDetail = await fetch(`http://localhost:3000/assessment-categories/${createdCategoryIdForDelete}`, {
      method: "GET",
      headers: {
        "x-school-id": String(school1Id),
        "Authorization": `Bearer ${admin1Token}`,
      },
    });
    expect(resDetail.status).toBe(404);
  });

  // 15. Principal dapat mengelola kategori.
  it("15. Principal dapat mengelola kategori", async () => {
    // 1. Principal membuat kategori
    const resCreate = await fetch("http://localhost:3000/assessment-categories", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-school-id": String(school1Id),
        "Authorization": `Bearer ${principal1Token}`,
      },
      body: JSON.stringify({
        name: "Proyek",
        weight: 15,
      }),
    });
    expect(resCreate.status).toBe(200);
    const bodyCreate = await resCreate.json();
    const principalCategoryId = bodyCreate.data.id;

    // 2. Principal memperbarui kategori
    const resUpdate = await fetch(`http://localhost:3000/assessment-categories/${principalCategoryId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "x-school-id": String(school1Id),
        "Authorization": `Bearer ${principal1Token}`,
      },
      body: JSON.stringify({
        name: "Proyek Sekolah",
        weight: 20,
      }),
    });
    expect(resUpdate.status).toBe(200);

    // 3. Principal menghapus kategori
    const resDelete = await fetch(`http://localhost:3000/assessment-categories/${principalCategoryId}`, {
      method: "DELETE",
      headers: {
        "x-school-id": String(school1Id),
        "Authorization": `Bearer ${principal1Token}`,
      },
    });
    expect(resDelete.status).toBe(200);
  });
});
