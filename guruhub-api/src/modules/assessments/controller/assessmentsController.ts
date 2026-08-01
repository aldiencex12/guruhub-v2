import { AssessmentsService } from "../service/assessmentsService";

const assessmentsService = new AssessmentsService();

export class AssessmentsController {
  async getAll({ schoolId, user, query }: any) {
    const classId = query.classId ? parseInt(query.classId, 10) : undefined;
    const subjectId = query.subjectId ? parseInt(query.subjectId, 10) : undefined;
    const teacherId = query.teacherId ? parseInt(query.teacherId, 10) : undefined;
    const academicYearId = query.academicYearId ? parseInt(query.academicYearId, 10) : undefined;
    const assessmentType = query.assessmentType || undefined;

    const data = await assessmentsService.getAllAssessments(schoolId, user, {
      classId,
      subjectId,
      teacherId,
      assessmentType,
      academicYearId,
    });

    return {
      success: true,
      message: "Daftar asesmen berhasil diambil",
      data,
    };
  }

  async getById({ schoolId, user, params }: any) {
    const id = parseInt(params.id, 10);
    const data = await assessmentsService.getAssessmentById(schoolId, user, id);

    return {
      success: true,
      message: "Detail asesmen berhasil diambil",
      data,
    };
  }

  async create({ schoolId, user, body }: any) {
    const data = await assessmentsService.createAssessment(schoolId, user, body);

    return {
      success: true,
      message: "Asesmen berhasil dibuat",
      data,
    };
  }

  async update({ schoolId, user, params, body }: any) {
    const id = parseInt(params.id, 10);
    const data = await assessmentsService.updateAssessment(schoolId, user, id, body);

    return {
      success: true,
      message: "Asesmen berhasil diperbarui",
      data,
    };
  }

  async delete({ schoolId, user, params }: any) {
    const id = parseInt(params.id, 10);
    await assessmentsService.deleteAssessment(schoolId, user, id);

    return {
      success: true,
      message: "Asesmen berhasil dihapus",
    };
  }

  async inputScores({ schoolId, user, params, body }: any) {
    const assessmentId = parseInt(params.id, 10);
    const data = await assessmentsService.inputScores(schoolId, user, assessmentId, body.scores);

    return {
      success: true,
      message: "Nilai siswa berhasil disimpan",
      data,
    };
  }
}
