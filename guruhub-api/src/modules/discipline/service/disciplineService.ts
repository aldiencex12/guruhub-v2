import { DisciplineRepository } from "../repository/disciplineRepository";
import { NotFoundError, BadRequestError, ConflictError } from "../../../errors/customErrors";
import { db } from "../../../db";
import { disciplineCategories, disciplineTypes, disciplineSanctionLogs } from "../../../schema/discipline";
import { teachers } from "../../../schema/teachers";
import { academicYears } from "../../../schema/academicYears";
import { classMembers } from "../../../schema/classMembers";
import { eq, and, isNull, sql } from "drizzle-orm";
import { logAudit } from "../../../utils/auditLogger";

export class DisciplineService {
  private repository = new DisciplineRepository();

  // --- Policies ---
  async getPolicy(schoolId: number) {
    let policy = await this.repository.getPolicy(schoolId);
    if (!policy) {
      // Create default if not exists
      policy = await this.repository.updatePolicy(schoolId, {
        pointResetCycle: "ACADEMIC_YEAR",
        maxActivePoints: 100,
        autoSanctionEnabled: true,
        carryForwardPercentage: 0
      });
    }
    return policy;
  }

  async updatePolicy(schoolId: number, data: any) {
    return await this.repository.updatePolicy(schoolId, data);
  }

  private async ensureDefaults(schoolId: number) {
    try {
      const categories = await this.repository.getCategories(schoolId, { limit: 1 });
      if (!categories.data || categories.data.length === 0) {
        const [c1] = await db.insert(disciplineCategories).values({
          schoolId,
          code: "CAT-V-MIN",
          name: "Pelanggaran Ringan",
          type: "VIOLATION",
          description: "Pelanggaran tata tertib kategori ringan"
        });
        const catV1Id = Number(c1.insertId);

        const [c2] = await db.insert(disciplineCategories).values({
          schoolId,
          code: "CAT-V-MOD",
          name: "Pelanggaran Sedang",
          type: "VIOLATION",
          description: "Pelanggaran tata tertib kategori sedang"
        });
        const catV2Id = Number(c2.insertId);

        const [c3] = await db.insert(disciplineCategories).values({
          schoolId,
          code: "CAT-V-MAJ",
          name: "Pelanggaran Berat",
          type: "VIOLATION",
          description: "Pelanggaran tata tertib kategori berat"
        });
        const catV3Id = Number(c3.insertId);

        const [c4] = await db.insert(disciplineCategories).values({
          schoolId,
          code: "CAT-R-ACA",
          name: "Prestasi Akademik",
          type: "REWARD",
          description: "Penghargaan atas prestasi bidang akademik"
        });
        const catR1Id = Number(c4.insertId);

        const [c5] = await db.insert(disciplineCategories).values({
          schoolId,
          code: "CAT-R-CHA",
          name: "Karakter & Kedisiplinan",
          type: "REWARD",
          description: "Penghargaan atas kepribadian dan kedisiplinan luar biasa"
        });
        const catR3Id = Number(c5.insertId);

        await db.insert(disciplineTypes).values([
          { schoolId, categoryId: catV1Id, code: "V-LATE", name: "Terlambat Masuk Sekolah", defaultPoints: 5, description: "Hadir setelah bel masuk berbunyi" },
          { schoolId, categoryId: catV1Id, code: "V-UNIFORM", name: "Atribut Seragam Tidak Lengkap", defaultPoints: 5, description: "Tidak memakai dasi, sabuk, atau kaos kaki sesuai ketentuan" },
          { schoolId, categoryId: catV1Id, code: "V-GROOM", name: "Rambut / Kuku Tidak Rapi", defaultPoints: 5, description: "Rambut panjang untuk siswa laki-laki atau kuku diwarnai" },
          { schoolId, categoryId: catV1Id, code: "V-PHONE", name: "Membawa HP Tanpa Izin", defaultPoints: 10, description: "Menggunakan ponsel saat jam pelajaran tanpa arahan guru" },

          { schoolId, categoryId: catV2Id, code: "V-SKIP", name: "Membolos Jam Pelajaran", defaultPoints: 15, description: "Meninggalkan kelas tanpa izin selama KBM" },
          { schoolId, categoryId: catV2Id, code: "V-LANG", name: "Menggunakan Bahasa Tidak Sopan", defaultPoints: 10, description: "Mengucapkan kata-kata kasar di lingkungan sekolah" },
          { schoolId, categoryId: catV2Id, code: "V-LEAVE", name: "Meninggalkan Sekolah Tanpa Izin", defaultPoints: 20, description: "Keluar dari gerbang sekolah saat jam aktif" },

          { schoolId, categoryId: catV3Id, code: "V-SMOKE", name: "Merokok / Vaping di Area Sekolah", defaultPoints: 30, description: "Membawa atau menggunakan rokok/vape di kawasan sekolah" },
          { schoolId, categoryId: catV3Id, code: "V-FIGHT", name: "Perkelahian / Tawuran", defaultPoints: 50, description: "Melakukan kekerasan fisik terhadap sesama siswa" },

          { schoolId, categoryId: catR1Id, code: "R-OLYMP", name: "Pemenang Olimpiade / Lomba", defaultPoints: 30, description: "Juara 1, 2, atau 3 tingkat Kabupaten/Provinsi/Nasional" },
          { schoolId, categoryId: catR3Id, code: "R-ATT", name: "Kehadiran Sempurna (100% Attendance)", defaultPoints: 15, description: "Tidak pernah absen selama 1 semester" }
        ]);
      }
    } catch (e) {
      console.error("Auto seed defaults failed:", e);
    }
  }

  // --- Categories ---
  async getCategories(schoolId: number, filters?: { type?: "VIOLATION" | "REWARD"; search?: string; page?: number; limit?: number }) {
    await this.ensureDefaults(schoolId);
    return await this.repository.getCategories(schoolId, filters || {});
  }

  // --- Types ---
  async getTypes(schoolId: number, filters?: { categoryId?: number; search?: string; page?: number; limit?: number }) {
    await this.ensureDefaults(schoolId);
    return await this.repository.getTypes(schoolId, filters || {});
  }

  async createType(schoolId: number, data: any) {
    // Check code unique
    const existing = await this.repository.getTypes(schoolId, { search: data.code });
    if (existing.data.some((c: any) => c.code === data.code)) {
      throw new ConflictError("Kode tipe disiplin sudah digunakan");
    }
    return await this.repository.createType(schoolId, data);
  }

  async updateType(schoolId: number, typeId: number, data: any) {
    return await this.repository.updateType(schoolId, typeId, data);
  }

  async deleteType(schoolId: number, typeId: number) {
    return await this.repository.deleteType(schoolId, typeId);
  }

  // --- Incidents ---
  async createIncident(schoolId: number, userId: number, data: any) {
    const { students, witnesses, attachments, ...incidentData } = data;

    if (incidentData.incidentDate) {
      let dStr = String(incidentData.incidentDate);
      if (dStr.includes("GMT") || dStr.includes("T")) {
        const d = new Date(incidentData.incidentDate);
        if (!isNaN(d.getTime())) {
          const year = d.getFullYear();
          const month = String(d.getMonth() + 1).padStart(2, '0');
          const day = String(d.getDate()).padStart(2, '0');
          dStr = `${year}-${month}-${day}`;
        }
      }
      incidentData.incidentDate = dStr;
    }

    // Fetch active academic year fallback
    let defaultAcademicYearId: number | undefined = undefined;
    const activeAy = await db.query.academicYears.findFirst({
      where: and(
        eq(academicYears.schoolId, schoolId),
        eq(academicYears.isActive, true)
      )
    });
    if (activeAy) {
      defaultAcademicYearId = activeAy.id;
    } else {
      const anyAy = await db.query.academicYears.findFirst({
        where: eq(academicYears.schoolId, schoolId)
      });
      if (anyAy) defaultAcademicYearId = anyAy.id;
    }

    // Validate and fetch point snapshots for each student
    const studentRecords = [];
    for (const s of students) {
      // Pengecekan Duplicate Incident
      const isDuplicate = await this.repository.checkDuplicateIncident(schoolId, s.studentId, userId, incidentData.incidentDate, s.disciplineTypeId);
      if (isDuplicate) {
        throw new ConflictError(`Insiden untuk siswa dengan ID ${s.studentId} pada tanggal ${incidentData.incidentDate} sudah dilaporkan sebelumnya.`);
      }

      let typeRec = await db.query.disciplineTypes.findFirst({
        where: and(
          eq(disciplineTypes.schoolId, schoolId),
          eq(disciplineTypes.id, s.disciplineTypeId),
          isNull(disciplineTypes.deletedAt)
        )
      });

      if (!typeRec) {
        typeRec = await db.query.disciplineTypes.findFirst({
          where: and(
            eq(disciplineTypes.id, s.disciplineTypeId),
            isNull(disciplineTypes.deletedAt)
          )
        });
      }

      if (!typeRec) {
        typeRec = await db.query.disciplineTypes.findFirst({
          where: and(
            eq(disciplineTypes.schoolId, schoolId),
            isNull(disciplineTypes.deletedAt)
          )
        });
      }

      if (!typeRec) {
        throw new BadRequestError(`Tipe disiplin dengan ID ${s.disciplineTypeId} tidak ditemukan.`);
      }

      let studentClassId = s.classId;
      let studentAyId = s.academicYearId || defaultAcademicYearId;

      if (!studentClassId || !studentAyId) {
        const cm = await db.query.classMembers.findFirst({
          where: eq(classMembers.studentId, s.studentId)
        });
        if (cm) {
          if (!studentClassId) studentClassId = cm.classId;
          if (!studentAyId) studentAyId = cm.academicYearId;
        }
      }

      if (!studentClassId) {
        throw new BadRequestError(`Siswa dengan ID ${s.studentId} belum terdaftar di kelas manapun.`);
      }
      if (!studentAyId) {
        throw new BadRequestError("Tahun akademik aktif tidak ditemukan.");
      }

      studentRecords.push({
        studentId: s.studentId,
        classId: studentClassId,
        academicYearId: studentAyId,
        disciplineTypeId: s.disciplineTypeId,
        notes: s.notes,
        pointSnapshot: typeRec.defaultPoints
      });
    }

    const incidentId = await this.repository.createIncident(
      schoolId,
      {
        reporterUserId: userId,
        incidentDate: new Date(incidentData.incidentDate),
        incidentTime: incidentData.incidentTime,
        location: incidentData.location,
        description: incidentData.description,
        status: "PENDING"
      },
      studentRecords,
      witnesses,
      attachments
    );

    // Audit Log recording
    await logAudit({
      schoolId,
      userId,
      action: "CREATE_DISCIPLINE_INCIDENT",
      tableName: "discipline_incidents",
      recordId: incidentId,
      newValues: { status: "PENDING", studentsCount: studentRecords.length, date: incidentData.incidentDate },
    });

    return {
      id: incidentId,
      schoolId,
      reporterUserId: userId,
      incidentDate: incidentData.incidentDate,
      status: "PENDING"
    };
  }

  async getIncidents(schoolId: number, filters: any) {
    return await this.repository.getIncidents(schoolId, filters);
  }

  async updateIncidentStatus(schoolId: number, incidentId: number, userId: number, data: { status: string; notes?: string }) {
    const details = await this.repository.getIncidentDetails(schoolId, incidentId);
    if (!details || !details.incident) {
      throw new NotFoundError("Laporan insiden tidak ditemukan");
    }

    if (
      details.incident.status !== "PENDING" &&
      details.incident.status !== "UNDER_REVIEW" &&
      details.incident.status !== "VERIFIED"
    ) {
      throw new BadRequestError(`Tidak dapat mengubah status dari ${details.incident.status}`);
    }

    // Resolve valid teacher ID from user ID (if present)
    let teacherId: number | undefined = undefined;
    const teacher = await db.query.teachers.findFirst({
      where: eq(teachers.userId, userId)
    });
    if (teacher) {
      teacherId = teacher.id;
    }

    // Update status
    const updated = await this.repository.updateIncidentStatus(schoolId, incidentId, data.status, teacherId);

    // Audit log recording for status verification / resolution
    await logAudit({
      schoolId,
      userId,
      action: `UPDATE_INCIDENT_STATUS_${data.status}`,
      tableName: "discipline_incidents",
      recordId: incidentId,
      oldValues: { status: details.incident.status },
      newValues: { status: data.status, notes: data.notes },
    });

    // If verified or resolved, calculate points and trigger auto sanctions
    if (data.status === "VERIFIED" || data.status === "RESOLVED") {
      const policy = await this.getPolicy(schoolId);
      const autoSanctionEnabled = policy ? policy.autoSanctionEnabled : true;
      
      if (autoSanctionEnabled) {
        for (const student of details.students) {
          // Calculate new active points
          const cumulativePoints = await this.repository.getStudentActivePoints(schoolId, student.studentId, student.academicYearId);
          
          // Check thresholds
          const thresholdsRes = await this.repository.getSanctionThresholds(schoolId, { limit: 100 });
          let thresholds = thresholdsRes.data;
          if (!thresholds || thresholds.length === 0) {
            thresholds = [
              { id: 1, minPoints: 25, actionRequired: "PEMBINAAN_BK" },
              { id: 2, minPoints: 50, actionRequired: "PANGGILAN_ORANG_TUA" },
              { id: 3, minPoints: 75, actionRequired: "SKORSING" }
            ] as any;
          }

          // Check all thresholds reached by student
          for (const t of thresholds) {
            if (cumulativePoints >= t.minPoints) {
              const sanctionType = t.actionRequired || "PANGGILAN_ORANG_TUA";

              const existingSanction = await db.query.disciplineSanctionLogs.findFirst({
                where: and(
                  eq(disciplineSanctionLogs.schoolId, schoolId),
                  eq(disciplineSanctionLogs.studentId, student.studentId),
                  eq(disciplineSanctionLogs.academicYearId, student.academicYearId),
                  eq(disciplineSanctionLogs.sanctionType, sanctionType),
                  isNull(disciplineSanctionLogs.deletedAt)
                )
              });

              if (!existingSanction) {
                let validTeacherId = teacherId;
                if (!validTeacherId) {
                  const fallbackTeacher = await db.query.teachers.findFirst({
                    where: eq(teachers.schoolId, schoolId)
                  });
                  if (fallbackTeacher) validTeacherId = fallbackTeacher.id;
                }

                if (validTeacherId) {
                  await this.repository.createSanctionLog(schoolId, {
                    studentId: student.studentId,
                    academicYearId: student.academicYearId,
                    thresholdId: t.id ? Number(t.id) : null,
                    issuedByTeacherId: validTeacherId,
                    cumulativePoints: cumulativePoints,
                    sanctionType: sanctionType,
                    status: "PENDING",
                    notes: `Auto-triggered by incident #${incidentId} crossing ${t.minPoints} points`
                  });
                }
              } else if (existingSanction.cumulativePoints !== cumulativePoints) {
                await db.update(disciplineSanctionLogs)
                  .set({ cumulativePoints })
                  .where(eq(disciplineSanctionLogs.id, existingSanction.id));
              }
            }
          }
        }
      }
    }

    return updated?.incident;
  }

  // --- Sanctions ---
  async getSanctionThresholds(schoolId: number, filters?: any) {
    return await this.repository.getSanctionThresholds(schoolId, filters || {});
  }

  async createThreshold(schoolId: number, data: any) {
    const payload = {
      minPoints: Number(data.minPoints),
      sanctionName: data.label || data.sanctionName || "Ambang Batas Poin",
      actionRequired: data.actionRequired || "PEMBINAAN_BK",
      description: data.description || null,
    };
    return await this.repository.createThreshold(schoolId, payload);
  }

  async updateThreshold(schoolId: number, thresholdId: number, data: any) {
    const payload: any = {};
    if (data.minPoints !== undefined) payload.minPoints = Number(data.minPoints);
    if (data.label || data.sanctionName) payload.sanctionName = data.label || data.sanctionName;
    if (data.actionRequired) payload.actionRequired = data.actionRequired;
    if (data.description !== undefined) payload.description = data.description;

    return await this.repository.updateThreshold(schoolId, thresholdId, payload);
  }

  async deleteThreshold(schoolId: number, thresholdId: number) {
    return await this.repository.deleteThreshold(schoolId, thresholdId);
  }

  async getSanctionLogs(schoolId: number, filters: { studentId?: number; status?: string; page?: number; limit?: number }) {
    // Auto-sync sanction logs for any students crossing thresholds
    try {
      const policy = await this.getPolicy(schoolId);
      const autoSanctionEnabled = policy ? policy.autoSanctionEnabled : true;

      if (autoSanctionEnabled) {
        const thresholdsRes = await this.repository.getSanctionThresholds(schoolId, { limit: 100 });
        let dbThresholds = thresholdsRes.data || [];
        const standardThresholds = [
          { minPoints: 25, actionRequired: "PEMBINAAN_BK" },
          { minPoints: 50, actionRequired: "PANGGILAN_ORANG_TUA" },
          { minPoints: 75, actionRequired: "SKORSING" }
        ];

        const thresholdsToUse = dbThresholds.length > 0 ? dbThresholds : standardThresholds;

        const studentPointsResult = await db.execute(sql`
          SELECT 
            dis.student_id as studentId,
            dis.academic_year_id as academicYearId,
            SUM(dis.point_snapshot) as totalPoints
          FROM discipline_incident_students dis
          JOIN discipline_incidents di ON dis.incident_id = di.id
          WHERE di.school_id = ${schoolId}
            AND di.status IN ('VERIFIED', 'RESOLVED')
            AND di.deleted_at IS NULL
          GROUP BY dis.student_id, dis.academic_year_id
        `);

        const rows = (studentPointsResult[0] as unknown as any[]) || [];
        for (const row of rows) {
          const studentId = Number(row.studentId || row.student_id);
          const academicYearId = Number(row.academicYearId || row.academic_year_id);
          const cumulativePoints = Number(row.totalPoints || row.total_points || 0);

          for (const t of thresholdsToUse) {
            if (cumulativePoints >= t.minPoints) {
              const sanctionType = t.actionRequired;
              
              const existingSanction = await db.query.disciplineSanctionLogs.findFirst({
                where: and(
                  eq(disciplineSanctionLogs.schoolId, schoolId),
                  eq(disciplineSanctionLogs.studentId, studentId),
                  eq(disciplineSanctionLogs.academicYearId, academicYearId),
                  eq(disciplineSanctionLogs.sanctionType, sanctionType)
                )
              });

              if (!existingSanction) {
                let validTeacherId = null;
                const fallbackTeacher = await db.query.teachers.findFirst({
                  where: eq(teachers.schoolId, schoolId)
                });
                if (fallbackTeacher) validTeacherId = fallbackTeacher.id;

                if (validTeacherId) {
                  await this.repository.createSanctionLog(schoolId, {
                    studentId,
                    academicYearId,
                    thresholdId: (t as any).id ? Number((t as any).id) : null,
                    issuedByTeacherId: validTeacherId,
                    cumulativePoints,
                    sanctionType,
                    status: "PENDING",
                    notes: `Auto-sync triggered for student #${studentId} crossing ${t.minPoints} points`
                  });
                }
              } else if (existingSanction.cumulativePoints !== cumulativePoints) {
                await db.update(disciplineSanctionLogs)
                  .set({ cumulativePoints })
                  .where(eq(disciplineSanctionLogs.id, existingSanction.id));
              }
            }
          }
        }
      }
    } catch (err) {
      console.error("[getSanctionLogs sync error]", err);
    }

    return await this.repository.getStudentSanctionLogs(schoolId, filters);
  }

  async updateSanctionLogStatus(schoolId: number, sanctionId: number, data: any) {
    const existing = await db.query.disciplineSanctionLogs.findFirst({
      where: and(
        eq(disciplineSanctionLogs.schoolId, schoolId),
        eq(disciplineSanctionLogs.id, sanctionId)
      )
    });
    if (!existing) throw new NotFoundError("Log sanksi tidak ditemukan");
    
    return await this.repository.updateSanctionLogStatus(schoolId, sanctionId, data);
  }

  async getAnalytics(schoolId: number) {
    return await this.repository.getAnalytics(schoolId);
  }

  // --- Pleno Kenaikan Kelas ---
  async getPlenoDecisions(schoolId: number, filters: { classId?: number; search?: string }) {
    return await this.repository.getPlenoDecisions(schoolId, filters);
  }

  async overridePlenoDecision(schoolId: number, userId: number, data: any) {
    let academicYearId = data.academicYearId;
    if (!academicYearId) {
      const activeAy = await db.query.academicYears.findFirst({
        where: and(
          eq(academicYears.schoolId, schoolId),
          eq(academicYears.isActive, true)
        )
      });
      academicYearId = activeAy?.id || 1;
    }

    return await this.repository.upsertPlenoOverride(schoolId, {
      studentId: Number(data.studentId),
      academicYearId: Number(academicYearId),
      systemRecommendation: data.systemRecommendation,
      finalDecision: data.finalDecision,
      academicNotes: data.academicNotes,
      attendanceNotes: data.attendanceNotes,
      disciplineNotes: data.disciplineNotes,
      overrideReason: data.overrideReason,
      decidedByUserId: userId
    });
  }

  async getStudentViolationDetails(schoolId: number, studentId: number) {
    return await this.repository.getStudentViolationDetails(schoolId, studentId);
  }

  async getStudentDemeritSummaryReport(schoolId: number) {
    return await this.repository.getStudentDemeritSummaryReport(schoolId);
  }
}

