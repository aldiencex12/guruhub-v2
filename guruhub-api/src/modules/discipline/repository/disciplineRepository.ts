import { db } from "../../../db";
import { 
  disciplineCategories, 
  disciplineTypes, 
  disciplinePolicies, 
  disciplineIncidents, 
  disciplineIncidentStudents, 
  disciplineIncidentWitnesses, 
  disciplineIncidentAttachments, 
  disciplineSanctionThresholds, 
  disciplineSanctionLogs,
  disciplinePlenoDecisions,
  disciplineCounselingSchedules
} from "../../../schema/discipline";
import { users } from "../../../schema/users";
import { teachers } from "../../../schema/teachers";
import { students } from "../../../schema/students";
import { classes } from "../../../schema/classes";
import { classMembers } from "../../../schema/classMembers";
import { and, eq, ne, or, like, isNull, sql, gte, lte, desc } from "drizzle-orm";

// Tipe spesifik untuk transaksi Drizzle ORM
export type DbTx = Parameters<Parameters<typeof db.transaction>[0]>[0];

export class DisciplineRepository {
  // --- Policies ---
  async getPolicy(schoolId: number) {
    return await db.query.disciplinePolicies.findFirst({
      where: eq(disciplinePolicies.schoolId, schoolId)
      // discipline_policies biasanya tidak memiliki deleted_at, melainkan 1:1 row per school
    });
  }

  async updatePolicy(schoolId: number, data: Partial<typeof disciplinePolicies.$inferInsert>) {
    const existing = await this.getPolicy(schoolId);
    if (!existing) {
      await db.insert(disciplinePolicies).values({
        schoolId,
        ...data
      });
    } else {
      await db.update(disciplinePolicies)
        .set(data)
        .where(eq(disciplinePolicies.schoolId, schoolId));
    }
    return await this.getPolicy(schoolId);
  }

  // --- Categories ---
  async getCategories(schoolId: number, filters: { type?: "VIOLATION" | "REWARD"; search?: string; page?: number; limit?: number }) {
    const page = filters.page || 1;
    const limit = filters.limit || 50;
    const offset = (page - 1) * limit;

    const conditions = [
      eq(disciplineCategories.schoolId, schoolId),
      isNull(disciplineCategories.deletedAt)
    ];

    if (filters.type) {
      conditions.push(eq(disciplineCategories.type, filters.type));
    }
    if (filters.search) {
      conditions.push(
        or(
          like(disciplineCategories.name, `%${filters.search}%`),
          like(disciplineCategories.code, `%${filters.search}%`)
        )!
      );
    }

    const whereClause = and(...conditions);

    const [data, countResult] = await Promise.all([
      db.select().from(disciplineCategories).where(whereClause).limit(limit).offset(offset),
      db.select({ count: sql<number>`count(*)` }).from(disciplineCategories).where(whereClause)
    ]);
    const totalItems = countResult[0]?.count ?? 0;

    return {
      data,
      pagination: { totalItems, totalPages: Math.ceil(totalItems / limit), currentPage: page, limit }
    };
  }

  async createCategory(schoolId: number, data: Omit<typeof disciplineCategories.$inferInsert, "schoolId" | "id">) {
    const [result] = await db.insert(disciplineCategories).values({ schoolId, ...data });
    return await db.query.disciplineCategories.findFirst({
      where: and(
        eq(disciplineCategories.id, result.insertId),
        isNull(disciplineCategories.deletedAt)
      )
    });
  }

  async updateCategory(schoolId: number, categoryId: number, data: Partial<{ name: string; type: "VIOLATION" | "REWARD"; description: string }>) {
    await db.update(disciplineCategories)
      .set(data)
      .where(and(
        eq(disciplineCategories.schoolId, schoolId),
        eq(disciplineCategories.id, categoryId),
        isNull(disciplineCategories.deletedAt)
      ));
    return await db.query.disciplineCategories.findFirst({
      where: and(eq(disciplineCategories.id, categoryId), isNull(disciplineCategories.deletedAt))
    });
  }

  async deleteCategory(schoolId: number, categoryId: number) {
    await db.update(disciplineCategories)
      .set({ deletedAt: new Date() })
      .where(and(
        eq(disciplineCategories.schoolId, schoolId),
        eq(disciplineCategories.id, categoryId),
        isNull(disciplineCategories.deletedAt)
      ));
  }

  // --- Types ---
  async getTypes(schoolId: number, filters: { categoryId?: number; search?: string; page?: number; limit?: number }) {
    const page = filters.page || 1;
    const limit = filters.limit || 50;
    const offset = (page - 1) * limit;

    const conditions = [
      eq(disciplineTypes.schoolId, schoolId),
      isNull(disciplineTypes.deletedAt)
    ];

    if (filters.categoryId) {
      conditions.push(eq(disciplineTypes.categoryId, filters.categoryId));
    }
    if (filters.search) {
      conditions.push(
        or(
          like(disciplineTypes.name, `%${filters.search}%`),
          like(disciplineTypes.code, `%${filters.search}%`)
        )!
      );
    }

    const whereClause = and(...conditions);

    const [data, countResult] = await Promise.all([
      db.select().from(disciplineTypes).where(whereClause).limit(limit).offset(offset),
      db.select({ count: sql<number>`count(*)` }).from(disciplineTypes).where(whereClause)
    ]);
    const totalItems = countResult[0]?.count ?? 0;

    return {
      data,
      pagination: { totalItems, totalPages: Math.ceil(totalItems / limit), currentPage: page, limit }
    };
  }

  async createType(schoolId: number, data: Omit<typeof disciplineTypes.$inferInsert, "schoolId" | "id">) {
    const [result] = await db.insert(disciplineTypes).values({ schoolId, ...data });
    return await db.query.disciplineTypes.findFirst({
      where: and(
        eq(disciplineTypes.id, result.insertId),
        isNull(disciplineTypes.deletedAt)
      )
    });
  }

  async updateType(schoolId: number, typeId: number, data: Partial<{ categoryId: number; name: string; defaultPoints: number; description: string }>) {
    await db.update(disciplineTypes)
      .set(data)
      .where(and(
        eq(disciplineTypes.schoolId, schoolId),
        eq(disciplineTypes.id, typeId),
        isNull(disciplineTypes.deletedAt)
      ));
    return await db.query.disciplineTypes.findFirst({
      where: and(eq(disciplineTypes.id, typeId), isNull(disciplineTypes.deletedAt))
    });
  }

  async deleteType(schoolId: number, typeId: number) {
    await db.update(disciplineTypes)
      .set({ deletedAt: new Date() })
      .where(and(
        eq(disciplineTypes.schoolId, schoolId),
        eq(disciplineTypes.id, typeId),
        isNull(disciplineTypes.deletedAt)
      ));
  }

  // --- Incidents ---
  /**
   * Pengecekan Duplicate Incident
   * Mencegah pelaporan ganda (contoh: guru yang sama melaporkan insiden yang sama di hari yang sama untuk murid yang sama)
   */
  async checkDuplicateIncident(schoolId: number, studentId: number, reporterUserId: number, incidentDate: string, disciplineTypeId?: number) {
    const query = db.select({ id: disciplineIncidents.id })
      .from(disciplineIncidents)
      .leftJoin(disciplineIncidentStudents, eq(disciplineIncidents.id, disciplineIncidentStudents.incidentId))
      .where(and(
        eq(disciplineIncidents.schoolId, schoolId),
        eq(disciplineIncidents.reporterUserId, reporterUserId),
        eq(disciplineIncidents.incidentDate, new Date(incidentDate)),
        eq(disciplineIncidentStudents.studentId, studentId),
        disciplineTypeId ? eq(disciplineIncidentStudents.disciplineTypeId, disciplineTypeId) : undefined,
        isNull(disciplineIncidents.deletedAt)
      ))
      .limit(1);

    const result = await query;
    return result.length > 0;
  }

  async createIncident(
    schoolId: number, 
    incidentData: Omit<typeof disciplineIncidents.$inferInsert, "schoolId" | "id">,
    studentsData: Omit<typeof disciplineIncidentStudents.$inferInsert, "incidentId" | "id">[],
    witnessesData?: Omit<typeof disciplineIncidentWitnesses.$inferInsert, "incidentId" | "id">[],
    attachmentsData?: Omit<typeof disciplineIncidentAttachments.$inferInsert, "incidentId" | "id">[]
  ) {
    return await db.transaction(async (tx) => {
      // 1. Insert incident
      const [incidentResult] = await tx.insert(disciplineIncidents).values({
        schoolId,
        ...incidentData
      });
      const incidentId = incidentResult.insertId;

      // 2. Insert students
      const studentsToInsert = studentsData.map(s => ({ ...s, incidentId }));
      await tx.insert(disciplineIncidentStudents).values(studentsToInsert);

      // 3. Insert witnesses
      if (witnessesData && witnessesData.length > 0) {
        const witnessesToInsert = witnessesData.map(w => ({ ...w, incidentId }));
        await tx.insert(disciplineIncidentWitnesses).values(witnessesToInsert);
      }

      // 4. Insert attachments
      if (attachmentsData && attachmentsData.length > 0) {
        const attachmentsToInsert = attachmentsData.map(a => ({ ...a, incidentId }));
        await tx.insert(disciplineIncidentAttachments).values(attachmentsToInsert);
      }

      return incidentId;
    });
  }

  /**
   * Documentation of Index Usage:
   * Query ini memanfaatkan compound index `idx_incidents_school_status_date` (terdapat di schema.ts).
   * GroupBy dan leftJoin dieksekusi secara optimal karena `deleted_at IS NULL` dan `school_id` terfilter di indeks.
   */
  async getIncidents(schoolId: number, filters: {
    status?: string;
    studentId?: number;
    classId?: number;
    reporterUserId?: number;
    startDate?: string;
    endDate?: string;
    page: number;
    limit: number;
  }) {
    const offset = (filters.page - 1) * filters.limit;
    
    const whereClause = and(
      eq(disciplineIncidents.schoolId, schoolId),
      isNull(disciplineIncidents.deletedAt),
      filters.status ? eq(disciplineIncidents.status, filters.status as any) : undefined,
      filters.reporterUserId ? eq(disciplineIncidents.reporterUserId, filters.reporterUserId) : undefined,
      filters.studentId ? eq(disciplineIncidentStudents.studentId, filters.studentId) : undefined,
      filters.classId ? eq(disciplineIncidentStudents.classId, filters.classId) : undefined,
      filters.startDate ? gte(disciplineIncidents.incidentDate, new Date(filters.startDate)) : undefined,
      filters.endDate ? lte(disciplineIncidents.incidentDate, new Date(filters.endDate)) : undefined
    );

    const baseQuery = db.select({
      id: disciplineIncidents.id,
      incidentDate: disciplineIncidents.incidentDate,
      location: disciplineIncidents.location,
      status: disciplineIncidents.status,
      description: disciplineIncidents.description,
      reporterUserId: disciplineIncidents.reporterUserId,
      reporterName: sql<string>`COALESCE(MIN(${teachers.name}), MIN(${users.email}))`,
      reporterEmail: users.email,
      reporterRole: users.role,
      studentId: disciplineIncidentStudents.studentId,
      studentsCount: sql<number>`count(distinct ${disciplineIncidentStudents.studentId})`,
      demeritPoints: sql<number>`COALESCE(SUM(${disciplineIncidentStudents.pointSnapshot}), 0)`,
      // First student name and class for list display
      studentName: sql<string>`MIN(${students.name})`,
      className: sql<string>`MIN(${classes.name})`,
      typeName: sql<string>`MIN(${disciplineTypes.name})`,
      categoryName: sql<string>`MIN(${disciplineCategories.name})`
    })
    .from(disciplineIncidents)
    .leftJoin(users, eq(disciplineIncidents.reporterUserId, users.id))
    .leftJoin(teachers, eq(users.id, teachers.userId))
    .leftJoin(disciplineIncidentStudents, eq(disciplineIncidents.id, disciplineIncidentStudents.incidentId))
    .leftJoin(students, eq(disciplineIncidentStudents.studentId, students.id))
    .leftJoin(classes, eq(disciplineIncidentStudents.classId, classes.id))
    .leftJoin(disciplineTypes, eq(disciplineIncidentStudents.disciplineTypeId, disciplineTypes.id))
    .leftJoin(disciplineCategories, eq(disciplineTypes.categoryId, disciplineCategories.id))
    .where(whereClause)
    .groupBy(disciplineIncidents.id, users.email, users.role, disciplineIncidentStudents.studentId)
    .orderBy(desc(disciplineIncidents.incidentDate), desc(disciplineIncidents.id));

    const countQuery = db.select({ count: sql<number>`count(distinct ${disciplineIncidents.id})` })
    .from(disciplineIncidents)
    .leftJoin(disciplineIncidentStudents, eq(disciplineIncidents.id, disciplineIncidentStudents.incidentId))
    .where(whereClause);

    const [data, countResult] = await Promise.all([
      baseQuery.limit(filters.limit).offset(offset),
      countQuery
    ]);
    const totalItems = countResult[0]?.count ?? 0;

    return {
      data,
      pagination: { totalItems, totalPages: Math.ceil(totalItems / filters.limit), currentPage: filters.page, limit: filters.limit }
    };
  }

  async getIncidentDetails(schoolId: number, incidentId: number) {
    const incident = await db.query.disciplineIncidents.findFirst({
      where: and(
        eq(disciplineIncidents.schoolId, schoolId),
        eq(disciplineIncidents.id, incidentId),
        isNull(disciplineIncidents.deletedAt)
      )
    });
    if (!incident) return null;

    const students = await db.select().from(disciplineIncidentStudents)
      .where(eq(disciplineIncidentStudents.incidentId, incidentId));

    return { incident, students };
  }

  async updateIncidentStatus(schoolId: number, incidentId: number, status: string, handlerTeacherId?: number, tx?: DbTx) {
    const runner = tx || db;
    await runner.update(disciplineIncidents)
      .set({ 
        status: status as any,
        ...(handlerTeacherId ? { handlerTeacherId } : {})
      })
      .where(and(
        eq(disciplineIncidents.schoolId, schoolId),
        eq(disciplineIncidents.id, incidentId),
        isNull(disciplineIncidents.deletedAt)
      ));
    
    return this.getIncidentDetails(schoolId, incidentId);
  }

  // --- Sanctions ---
  async getSanctionThresholds(schoolId: number, filters: { page?: number; limit?: number }) {
    const page = filters.page || 1;
    const limit = filters.limit || 50;
    const offset = (page - 1) * limit;

    const whereClause = and(
      eq(disciplineSanctionThresholds.schoolId, schoolId),
      isNull(disciplineSanctionThresholds.deletedAt)
    );

    const [data, countResult] = await Promise.all([
      db.select().from(disciplineSanctionThresholds).where(whereClause).orderBy(disciplineSanctionThresholds.minPoints).limit(limit).offset(offset),
      db.select({ count: sql<number>`count(*)` }).from(disciplineSanctionThresholds).where(whereClause)
    ]);
    const totalItems = countResult[0]?.count ?? 0;

    return {
      data,
      pagination: { totalItems, totalPages: Math.ceil(totalItems / limit), currentPage: page, limit }
    };
  }

  async createThreshold(schoolId: number, data: Omit<typeof disciplineSanctionThresholds.$inferInsert, "schoolId" | "id">) {
    const [result] = await db.insert(disciplineSanctionThresholds).values({ schoolId, ...data });
    return await db.query.disciplineSanctionThresholds.findFirst({
      where: and(
        eq(disciplineSanctionThresholds.id, result.insertId),
        isNull(disciplineSanctionThresholds.deletedAt)
      )
    });
  }

  async updateThreshold(schoolId: number, thresholdId: number, data: Partial<{ minPoints: number; label: string; actionRequired: string; description: string }>) {
    await db.update(disciplineSanctionThresholds)
      .set(data as any)
      .where(and(
        eq(disciplineSanctionThresholds.schoolId, schoolId),
        eq(disciplineSanctionThresholds.id, thresholdId),
        isNull(disciplineSanctionThresholds.deletedAt)
      ));
    return await db.query.disciplineSanctionThresholds.findFirst({
      where: and(eq(disciplineSanctionThresholds.id, thresholdId), isNull(disciplineSanctionThresholds.deletedAt))
    });
  }

  async deleteThreshold(schoolId: number, thresholdId: number) {
    await db.update(disciplineSanctionThresholds)
      .set({ deletedAt: new Date() })
      .where(and(
        eq(disciplineSanctionThresholds.schoolId, schoolId),
        eq(disciplineSanctionThresholds.id, thresholdId),
        isNull(disciplineSanctionThresholds.deletedAt)
      ));
  }

  async getStudentSanctionLogs(schoolId: number, filters: { studentId?: number; status?: string; page?: number; limit?: number }) {
    const page = filters.page || 1;
    const limit = filters.limit || 50;
    const offset = (page - 1) * limit;

    const conditions = [
      eq(disciplineSanctionLogs.schoolId, schoolId),
      isNull(disciplineSanctionLogs.deletedAt)
    ];

    if (filters.studentId) {
      conditions.push(eq(disciplineSanctionLogs.studentId, filters.studentId));
    }

    if (filters.status) {
      conditions.push(eq(disciplineSanctionLogs.status, filters.status as any));
    }

    const whereClause = and(...conditions);

    const baseQuery = db.select({
      id: disciplineSanctionLogs.id,
      schoolId: disciplineSanctionLogs.schoolId,
      studentId: disciplineSanctionLogs.studentId,
      academicYearId: disciplineSanctionLogs.academicYearId,
      thresholdId: disciplineSanctionLogs.thresholdId,
      issuedByTeacherId: disciplineSanctionLogs.issuedByTeacherId,
      cumulativePoints: disciplineSanctionLogs.cumulativePoints,
      sanctionType: disciplineSanctionLogs.sanctionType,
      status: disciplineSanctionLogs.status,
      documentUrl: disciplineSanctionLogs.documentUrl,
      notes: disciplineSanctionLogs.notes,
      createdAt: disciplineSanctionLogs.createdAt,
      updatedAt: disciplineSanctionLogs.updatedAt,
      deletedAt: disciplineSanctionLogs.deletedAt,
      studentName: students.name,
      studentNisn: students.nisn,
      className: classes.name,
      activePoints: sql<number>`(
        SELECT COALESCE(SUM(dis2.point_snapshot), 0)
        FROM discipline_incident_students dis2
        JOIN discipline_incidents di2 ON dis2.incident_id = di2.id
        WHERE dis2.student_id = ${disciplineSanctionLogs.studentId}
          AND di2.school_id = ${schoolId}
          AND di2.status IN ('VERIFIED', 'RESOLVED')
          AND di2.deleted_at IS NULL
      )`
    })
    .from(disciplineSanctionLogs)
    .leftJoin(students, eq(disciplineSanctionLogs.studentId, students.id))
    .leftJoin(classMembers, and(eq(students.id, classMembers.studentId), isNull(classMembers.deletedAt)))
    .leftJoin(classes, eq(classMembers.classId, classes.id))
    .where(whereClause);

    const [data, countResult] = await Promise.all([
      baseQuery.orderBy(desc(disciplineSanctionLogs.createdAt)).limit(limit).offset(offset),
      db.select({ count: sql<number>`count(*)` }).from(disciplineSanctionLogs).where(whereClause)
    ]);
    const totalItems = countResult[0]?.count ?? 0;

    const formattedData = data.map((item: any) => ({
      ...item,
      cumulativePoints: Number(item.activePoints) > 0 ? Number(item.activePoints) : Number(item.cumulativePoints || 0)
    }));

    return {
      data: formattedData,
      pagination: { totalItems, totalPages: Math.ceil(totalItems / limit), currentPage: page, limit }
    };
  }

  async createSanctionLog(schoolId: number, data: Omit<typeof disciplineSanctionLogs.$inferInsert, "schoolId" | "id">, tx?: DbTx) {
    const runner = tx || db;
    const [result] = await runner.insert(disciplineSanctionLogs).values({ schoolId, ...data });
    return result.insertId;
  }

  async updateSanctionLogStatus(schoolId: number, sanctionId: number, data: { status: string; documentUrl?: string; notes?: string }, tx?: DbTx) {
    const runner = tx || db;
    await runner.update(disciplineSanctionLogs)
      .set({ ...data, status: data.status as any })
      .where(and(
        eq(disciplineSanctionLogs.schoolId, schoolId),
        eq(disciplineSanctionLogs.id, sanctionId),
        isNull(disciplineSanctionLogs.deletedAt)
      ));
    
    return await runner.select().from(disciplineSanctionLogs).where(and(
      eq(disciplineSanctionLogs.id, sanctionId),
      isNull(disciplineSanctionLogs.deletedAt)
    )).then(res => res[0]);
  }

  // --- Calculations ---
  /**
   * Mengapa menggunakan RAW SQL untuk kalkulasi ini?
   * 1. Efisiensi Agregasi: Menjalankan SUM() dengan CASE (conditional polarity) di database layer 
   *    jauh lebih cepat daripada menarik ribuan log ke memori Node.js dan menjumlahkannya.
   * 2. Polaritas Tipe: Poin pelanggaran (VIOLATION) dihitung positif (demerit), sedangkan penghargaan (REWARD)
   *    mengurangi poin demerit. Penggunaan CASE WHEN dc.type = 'REWARD' THEN -dis.point_snapshot
   *    paling efisien ditulis secara deklaratif melalui Drizzle SQL tagged template.
   */
  async getStudentActivePoints(schoolId: number, studentId: number, academicYearId: number) {
    const result = await db.execute(sql`
      SELECT 
        SUM(
          CASE 
            WHEN dc.type = 'VIOLATION' THEN dis.point_snapshot
            WHEN dc.type = 'REWARD' THEN -dis.point_snapshot
            ELSE 0
          END
        ) as totalPoints
      FROM discipline_incident_students dis
      JOIN discipline_incidents di ON dis.incident_id = di.id
      JOIN discipline_types dt ON dis.discipline_type_id = dt.id
      JOIN discipline_categories dc ON dt.category_id = dc.id
      WHERE di.school_id = ${schoolId}
        AND dis.student_id = ${studentId}
        AND dis.academic_year_id = ${academicYearId}
        AND di.status IN ('VERIFIED', 'RESOLVED')
        AND di.deleted_at IS NULL
    `);
    
    const rows = result[0] as unknown as any[];
    const totalPoints = rows.length > 0 && rows[0].totalPoints ? Number(rows[0].totalPoints) : 0;
    
    // Ensure points don't go below 0 (rewards cannot produce negative demerits)
    return Math.max(0, totalPoints);
  }

  async getAnalytics(schoolId: number) {
    const totalIncidentsRes = await db.select({ count: sql<number>`count(*)` })
      .from(disciplineIncidents)
      .where(and(eq(disciplineIncidents.schoolId, schoolId), isNull(disciplineIncidents.deletedAt)));
    const totalIncidents = totalIncidentsRes[0]?.count || 0;
    
    const pendingCountRes = await db.select({ count: sql<number>`count(*)` })
      .from(disciplineIncidents)
      .where(and(eq(disciplineIncidents.schoolId, schoolId), eq(disciplineIncidents.status, "PENDING"), isNull(disciplineIncidents.deletedAt)));
    const pendingIncidents = pendingCountRes[0]?.count || 0;

    // Category Distribution query
    const categoryCountsResult = await db.execute(sql`
      SELECT 
        dc.name as categoryName,
        COUNT(dis.id) as incidentCount
      FROM discipline_incident_students dis
      JOIN discipline_incidents di ON dis.incident_id = di.id
      JOIN discipline_types dt ON dis.discipline_type_id = dt.id
      JOIN discipline_categories dc ON dt.category_id = dc.id
      WHERE di.school_id = ${schoolId} AND di.deleted_at IS NULL
      GROUP BY dc.id, dc.name
    `);

    const rawCategoryCounts = (categoryCountsResult[0] as unknown as any[]) || [];
    const totalCategoryIncidents = rawCategoryCounts.reduce((acc: number, item: any) => acc + Number(item.incidentCount || 0), 0);

    const categoriesDistribution = rawCategoryCounts.map((item: any) => {
      const cnt = Number(item.incidentCount || 0);
      const percentage = totalCategoryIncidents > 0 ? Math.round((cnt / totalCategoryIncidents) * 100) : 0;
      return {
        category: item.categoryName || "Lainnya",
        count: cnt,
        percentage
      };
    }).sort((a, b) => b.percentage - a.percentage);

    const topCategory = categoriesDistribution.length > 0 ? categoriesDistribution[0] : null;

    // High risk students (accumulated points >= 50)
    const highRiskStudentsResult = await db.execute(sql`
      SELECT dis.student_id, SUM(dis.point_snapshot) as totalPoints
      FROM discipline_incident_students dis
      JOIN discipline_incidents di ON dis.incident_id = di.id
      WHERE di.school_id = ${schoolId} AND di.status IN ('VERIFIED', 'RESOLVED') AND di.deleted_at IS NULL
      GROUP BY dis.student_id
      HAVING totalPoints >= 50
    `);
    const rawHighRisk = (highRiskStudentsResult[0] as unknown as any[]) || [];
    const highRiskStudentsCount = rawHighRisk.length;

    return {
      totalIncidents,
      pendingIncidents,
      topCategoryName: topCategory?.category || "Belum Ada Data",
      topCategoryPercentage: topCategory?.percentage || 0,
      highRiskStudentsCount,
      categoriesDistribution
    };
  }

  // --- Pleno Kenaikan Kelas ---
  async getPlenoDecisions(schoolId: number, filters: { classId?: number; search?: string }) {
    const classCondition = filters.classId ? sql`AND cm.class_id = ${filters.classId}` : sql``;
    const searchCondition = filters.search ? sql`AND (s.name LIKE ${`%${filters.search}%`} OR s.nisn LIKE ${`%${filters.search}%`})` : sql``;

    const query = sql`
      SELECT 
        s.id as studentId,
        s.name as studentName,
        s.nisn as nisn,
        c.id as classId,
        c.name as className,
        COALESCE(points_query.totalDemeritPoints, 0) as totalDemeritPoints,
        COALESCE(points_query.totalRewardPoints, 0) as totalRewardPoints,
        dpd.id as plenoId,
        dpd.system_recommendation as dbSystemRec,
        dpd.final_decision as finalDecision,
        dpd.is_overridden as isOverridden,
        dpd.academic_notes as academicNotes,
        dpd.attendance_notes as attendanceNotes,
        dpd.discipline_notes as disciplineNotes,
        COALESCE(dpd.unfulfilled_subjects_count, 0) as unfulfilledSubjectsCount,
        COALESCE(alpha_query.totalAlphaCount, 0) as totalAlphaCount,
        dpd.override_reason as overrideReason,
        dpd.updated_at as updatedAt
      FROM students s
      JOIN class_members cm ON s.id = cm.student_id AND cm.deleted_at IS NULL
      JOIN classes c ON cm.class_id = c.id AND c.deleted_at IS NULL
      LEFT JOIN (
        SELECT 
          dis.student_id,
          SUM(CASE WHEN dc.type = 'VIOLATION' THEN dis.point_snapshot ELSE 0 END) as totalDemeritPoints,
          SUM(CASE WHEN dc.type = 'REWARD' THEN dis.point_snapshot ELSE 0 END) as totalRewardPoints
        FROM discipline_incident_students dis
        JOIN discipline_incidents di ON dis.incident_id = di.id
        JOIN discipline_types dt ON dis.discipline_type_id = dt.id
        JOIN discipline_categories dc ON dt.category_id = dc.id
        WHERE di.school_id = ${schoolId} AND di.status IN ('VERIFIED', 'RESOLVED') AND di.deleted_at IS NULL
        GROUP BY dis.student_id
      ) points_query ON s.id = points_query.student_id
      LEFT JOIN (
        SELECT 
          ad.student_id,
          COUNT(DISTINCT att.attendance_date) as totalAlphaCount
        FROM attendance_details ad
        JOIN attendances att ON ad.attendance_id = att.id
        WHERE att.school_id = ${schoolId} AND ad.status = 'ABSENT' AND att.deleted_at IS NULL
        GROUP BY ad.student_id
      ) alpha_query ON s.id = alpha_query.student_id
      LEFT JOIN discipline_pleno_decisions dpd ON s.id = dpd.student_id AND dpd.school_id = ${schoolId} AND dpd.deleted_at IS NULL
      WHERE s.school_id = ${schoolId} AND s.deleted_at IS NULL ${classCondition} ${searchCondition}
      ORDER BY c.name ASC, s.name ASC
    `;

    const res = await db.execute(query);
    const rows = (res[0] as unknown as any[]) || [];

    const data = rows.map((r: any) => {
      const demerit = Number(r.totalDemeritPoints || 0);
      const systemRec = demerit >= 100 ? "PEMBINAAN_BASECAMP" : "NAIK_KELAS";
      const finalDec = r.finalDecision || systemRec;
      const isOverridden = Boolean(r.isOverridden);

      return {
        studentId: Number(r.studentId),
        studentName: String(r.studentName || ""),
        nisn: r.nisn ? String(r.nisn) : "-",
        classId: Number(r.classId),
        className: String(r.className || ""),
        totalDemeritPoints: demerit,
        totalRewardPoints: Number(r.totalRewardPoints || 0),
        totalAlphaCount: Number(r.totalAlphaCount || 0),
        unfulfilledSubjectsCount: Number(r.unfulfilledSubjectsCount || 0),
        systemRecommendation: systemRec,
        finalDecision: finalDec,
        isOverridden,
        academicNotes: r.academicNotes || null,
        attendanceNotes: r.attendanceNotes || null,
        disciplineNotes: r.disciplineNotes || null,
        overrideReason: r.overrideReason || null,
        updatedAt: r.updatedAt || null
      };
    });

    const summary = {
      totalStudents: data.length,
      totalNaikKelas: data.filter(d => d.finalDecision === "NAIK_KELAS").length,
      totalBasecamp: data.filter(d => d.finalDecision === "PEMBINAAN_BASECAMP").length,
      totalOverridden: data.filter(d => d.isOverridden).length
    };

    return { data, summary };
  }

  async upsertPlenoOverride(
    schoolId: number,
    data: {
      studentId: number;
      academicYearId: number;
      systemRecommendation: "NAIK_KELAS" | "PEMBINAAN_BASECAMP";
      finalDecision: "NAIK_KELAS" | "PEMBINAAN_BASECAMP";
      academicNotes?: string;
      attendanceNotes?: string;
      disciplineNotes?: string;
      overrideReason?: string;
      decidedByUserId?: number;
    }
  ) {
    const isOverridden = data.systemRecommendation !== data.finalDecision;

    const existing = await db.query.disciplinePlenoDecisions.findFirst({
      where: and(
        eq(disciplinePlenoDecisions.schoolId, schoolId),
        eq(disciplinePlenoDecisions.studentId, data.studentId),
        eq(disciplinePlenoDecisions.academicYearId, data.academicYearId),
        isNull(disciplinePlenoDecisions.deletedAt)
      )
    });

    const combinedReason = [
      data.academicNotes ? `[Akademik]: ${data.academicNotes}` : "",
      data.attendanceNotes ? `[Presensi]: ${data.attendanceNotes}` : "",
      data.disciplineNotes ? `[Karakter]: ${data.disciplineNotes}` : "",
      data.overrideReason
    ].filter(Boolean).join(" | ");

    if (existing) {
      await db.update(disciplinePlenoDecisions)
        .set({
          systemRecommendation: data.systemRecommendation,
          finalDecision: data.finalDecision,
          isOverridden,
          academicNotes: data.academicNotes || null,
          attendanceNotes: data.attendanceNotes || null,
          disciplineNotes: data.disciplineNotes || null,
          overrideReason: combinedReason || null,
          decidedByUserId: data.decidedByUserId || null,
          updatedAt: new Date()
        })
        .where(eq(disciplinePlenoDecisions.id, existing.id));
    } else {
      await db.insert(disciplinePlenoDecisions).values({
        schoolId,
        studentId: data.studentId,
        academicYearId: data.academicYearId,
        systemRecommendation: data.systemRecommendation,
        finalDecision: data.finalDecision,
        isOverridden,
        academicNotes: data.academicNotes || null,
        attendanceNotes: data.attendanceNotes || null,
        disciplineNotes: data.disciplineNotes || null,
        overrideReason: combinedReason || null,
        decidedByUserId: data.decidedByUserId || null
      });
    }

    return { success: true };
  }

  async getStudentViolationDetails(schoolId: number, studentId: number) {
    const query = sql`
      SELECT 
        di.id as incidentId,
        di.incident_date as incidentDate,
        dt.name as violationName,
        dc.name as categoryName,
        dis.point_snapshot as demeritPoints,
        di.description as notes,
        di.status as status
      FROM discipline_incident_students dis
      JOIN discipline_incidents di ON dis.incident_id = di.id
      JOIN discipline_types dt ON dis.discipline_type_id = dt.id
      JOIN discipline_categories dc ON dt.category_id = dc.id
      WHERE di.school_id = ${schoolId} 
        AND dis.student_id = ${studentId} 
        AND dc.type = 'VIOLATION'
        AND di.status IN ('VERIFIED', 'RESOLVED')
        AND di.deleted_at IS NULL
      ORDER BY di.incident_date DESC
    `;

    const res = await db.execute(query);
    const rows = (res[0] as unknown as any[]) || [];
    return rows.map((r: any) => {
      const pts = Number(r.demeritPoints || 0);
      const severityLevel = pts >= 25 ? "BERAT" : pts >= 10 ? "SEDANG" : "RINGAN";

      return {
        incidentId: Number(r.incidentId),
        incidentDate: r.incidentDate ? String(r.incidentDate) : "-",
        violationName: String(r.violationName || ""),
        categoryName: String(r.categoryName || ""),
        severityLevel,
        demeritPoints: pts,
        notes: r.notes ? String(r.notes) : "-",
        status: String(r.status || "")
      };
    });
  }

  async getStudentDemeritSummaryReport(schoolId: number) {
    const analytics = await this.getAnalytics(schoolId);
    const highRiskStudents = await this.getPlenoDecisions(schoolId, {});
    const filteredHighRisk = highRiskStudents.data.filter(s => s.totalDemeritPoints > 0);

    return {
      schoolId,
      totalStudentsWithDemerits: filteredHighRisk.length,
      highRiskStudentsCount: analytics.highRiskStudentsCount,
      topViolationCategory: analytics.topCategoryName,
      topCategoryPercentage: analytics.topCategoryPercentage,
      students: filteredHighRisk.map(s => ({
        studentId: s.studentId,
        studentName: s.studentName,
        className: s.className,
        totalDemeritPoints: s.totalDemeritPoints,
        recommendation: s.systemRecommendation
      }))
    };
  }

  // --- Counseling Schedules / Restorative Tasks ---
  async getCounselingSchedules(schoolId: number) {
    const list = await db
      .select({
        id: disciplineCounselingSchedules.id,
        schoolId: disciplineCounselingSchedules.schoolId,
        studentId: disciplineCounselingSchedules.studentId,
        studentName: students.name,
        nisn: students.nisn,
        className: classes.name,
        taskType: disciplineCounselingSchedules.taskType,
        date: disciplineCounselingSchedules.scheduleDate,
        time: disciplineCounselingSchedules.scheduleTime,
        location: disciplineCounselingSchedules.location,
        counselorName: disciplineCounselingSchedules.counselorName,
        notes: disciplineCounselingSchedules.notes,
        status: disciplineCounselingSchedules.status,
        cumulativePoints: disciplineCounselingSchedules.cumulativePoints,
        createdAt: disciplineCounselingSchedules.createdAt,
      })
      .from(disciplineCounselingSchedules)
      .innerJoin(students, eq(disciplineCounselingSchedules.studentId, students.id))
      .leftJoin(classMembers, eq(classMembers.studentId, students.id))
      .leftJoin(classes, eq(classMembers.classId, classes.id))
      .where(
        and(
          eq(disciplineCounselingSchedules.schoolId, schoolId),
          isNull(disciplineCounselingSchedules.deletedAt),
          ne(disciplineCounselingSchedules.status, "SUDAH")
        )
      )
      .orderBy(desc(disciplineCounselingSchedules.scheduleDate), desc(disciplineCounselingSchedules.id));

    return list;
  }

  async getAllCounselingSchedulesIncludingDeleted(schoolId: number) {
    return await db
      .select({
        id: disciplineCounselingSchedules.id,
        studentId: disciplineCounselingSchedules.studentId,
        taskType: disciplineCounselingSchedules.taskType,
        cumulativePoints: disciplineCounselingSchedules.cumulativePoints,
        status: disciplineCounselingSchedules.status,
      })
      .from(disciplineCounselingSchedules)
      .where(eq(disciplineCounselingSchedules.schoolId, schoolId));
  }

  async createCounselingSchedule(schoolId: number, data: any) {
    const [result] = await db.insert(disciplineCounselingSchedules).values({
      schoolId,
      studentId: Number(data.studentId),
      academicYearId: data.academicYearId ? Number(data.academicYearId) : null,
      taskType: data.taskType,
      scheduleDate: data.scheduleDate,
      scheduleTime: data.scheduleTime || "09:00 WIB",
      location: data.location || "Ruang BK",
      counselorName: data.counselorName || "Guru BK / Pembina",
      notes: data.notes || null,
      status: data.status || "BELUM",
      cumulativePoints: Number(data.cumulativePoints || 0),
    });

    return result.insertId;
  }

  async updateCounselingSchedule(schoolId: number, id: number, data: any) {
    await db
      .update(disciplineCounselingSchedules)
      .set({
        ...(data.taskType && { taskType: data.taskType }),
        ...(data.scheduleDate && { scheduleDate: data.scheduleDate }),
        ...(data.scheduleTime && { scheduleTime: data.scheduleTime }),
        ...(data.location && { location: data.location }),
        ...(data.counselorName && { counselorName: data.counselorName }),
        ...(data.notes !== undefined && { notes: data.notes }),
        ...(data.status && { status: data.status }),
        ...(data.cumulativePoints !== undefined && { cumulativePoints: Number(data.cumulativePoints) }),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(disciplineCounselingSchedules.schoolId, schoolId),
          eq(disciplineCounselingSchedules.id, id),
          isNull(disciplineCounselingSchedules.deletedAt)
        )
      );
  }

  async deleteCounselingSchedule(schoolId: number, id: number) {
    await db
      .update(disciplineCounselingSchedules)
      .set({ deletedAt: new Date() })
      .where(
        and(
          eq(disciplineCounselingSchedules.schoolId, schoolId),
          eq(disciplineCounselingSchedules.id, id)
        )
      );
  }
}

