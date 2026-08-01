import { TeachingJournalsService } from "../service/teachingJournalsService";

const teachingJournalsService = new TeachingJournalsService();

export class TeachingJournalsController {
  async getAll({ schoolId, user, query }: any) {
    const teacherId = query.teacherId ? parseInt(query.teacherId, 10) : undefined;
    const classId = query.classId ? parseInt(query.classId, 10) : undefined;
    const subjectId = query.subjectId ? parseInt(query.subjectId, 10) : undefined;
    const journalDate = query.journalDate || undefined;

    const data = await teachingJournalsService.getAllTeachingJournals(schoolId, user, {
      teacherId,
      classId,
      subjectId,
      journalDate,
    });

    return {
      success: true,
      message: "Daftar jurnal mengajar berhasil diambil",
      data,
    };
  }

  async getById({ schoolId, user, params }: any) {
    const id = parseInt(params.id, 10);
    const data = await teachingJournalsService.getTeachingJournalById(schoolId, user, id);

    return {
      success: true,
      message: "Detail jurnal mengajar berhasil diambil",
      data,
    };
  }

  async create({ schoolId, user, body }: any) {
    const data = await teachingJournalsService.createTeachingJournal(schoolId, user, body);

    return {
      success: true,
      message: "Jurnal mengajar berhasil dibuat",
      data,
    };
  }

  async update({ schoolId, user, params, body }: any) {
    const id = parseInt(params.id, 10);
    const data = await teachingJournalsService.updateTeachingJournal(schoolId, user, id, body);

    return {
      success: true,
      message: "Jurnal mengajar berhasil diperbarui",
      data,
    };
  }

  async delete({ schoolId, user, params }: any) {
    const id = parseInt(params.id, 10);
    await teachingJournalsService.deleteTeachingJournal(schoolId, user, id);

    return {
      success: true,
      message: "Jurnal mengajar berhasil dihapus",
    };
  }
}
