import { SchedulesService } from "../service/schedulesService";

const schedulesService = new SchedulesService();

export class SchedulesController {
  async getAll({ schoolId, user, query }: any) {
    const data = await schedulesService.getAllSchedules(schoolId, user, query);
    return {
      success: true,
      message: "Daftar jadwal pelajaran berhasil diambil",
      data,
    };
  }

  async getById({ schoolId, user, params }: any) {
    const id = parseInt(params.id, 10);
    const data = await schedulesService.getScheduleById(schoolId, user, id);
    return {
      success: true,
      message: "Detail jadwal pelajaran berhasil diambil",
      data,
    };
  }

  async create({ schoolId, body }: any) {
    const data = await schedulesService.createSchedule(schoolId, body);
    return {
      success: true,
      message: "Jadwal pelajaran berhasil ditambahkan",
      data,
    };
  }

  async update({ schoolId, params, body }: any) {
    const id = parseInt(params.id, 10);
    const data = await schedulesService.updateSchedule(schoolId, id, body);
    return {
      success: true,
      message: "Jadwal pelajaran berhasil diperbarui",
      data,
    };
  }

  async delete({ schoolId, params }: any) {
    const id = parseInt(params.id, 10);
    await schedulesService.deleteSchedule(schoolId, id);
    return {
      success: true,
      message: "Jadwal pelajaran berhasil dihapus",
    };
  }

  async bulkDelete({ schoolId, body }: any) {
    const { ids } = body;
    await schedulesService.bulkDeleteSchedules(schoolId, ids);
    return {
      success: true,
      message: `${ids.length} jadwal pelajaran berhasil dihapus`,
    };
  }

  async deleteAll({ schoolId }: any) {
    await schedulesService.deleteAllSchedules(schoolId);
    return {
      success: true,
      message: "Seluruh jadwal pelajaran berhasil dikosongkan",
    };
  }
}
