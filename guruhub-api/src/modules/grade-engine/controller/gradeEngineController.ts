import { GradeEngineService } from "../service/gradeEngineService";

const gradeEngineService = new GradeEngineService();

export class GradeEngineController {
  async calculateStudent({ schoolId, body }: any) {
    const studentId = parseInt(body.studentId, 10);
    const subjectId = parseInt(body.subjectId, 10);
    const academicYearId = parseInt(body.academicYearId, 10);

    const result = await gradeEngineService.calculateStudentFinalGrade(
      schoolId,
      studentId,
      subjectId,
      academicYearId
    );

    return {
      success: true,
      message: "Perhitungan nilai akhir siswa berhasil",
      data: result,
    };
  }

  async calculateClass({ schoolId, body }: any) {
    const classId = parseInt(body.classId, 10);
    const subjectId = parseInt(body.subjectId, 10);
    const academicYearId = parseInt(body.academicYearId, 10);

    const results = await gradeEngineService.calculateClassFinalGrades(
      schoolId,
      classId,
      subjectId,
      academicYearId
    );

    return {
      success: true,
      message: "Perhitungan nilai akhir seluruh siswa di kelas berhasil",
      data: results,
    };
  }

  async getStudentGrade({ schoolId, params, query }: any) {
    const studentId = parseInt(params.studentId, 10);
    const subjectId = parseInt(query.subjectId, 10);
    const academicYearId = parseInt(query.academicYearId, 10);

    const result = await gradeEngineService.getStudentFinalGrade(
      schoolId,
      studentId,
      subjectId,
      academicYearId
    );

    return {
      success: true,
      message: "Data nilai akhir siswa berhasil diambil",
      data: result,
    };
  }
}
