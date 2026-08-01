import { PdfGeneratorService } from "../service/pdfGeneratorService";

export class PdfGeneratorController {
  private pdfService = new PdfGeneratorService();

  private handleError(err: any) {
    console.error("PDF Generation Error:", err);
    const message = err.message || "Internal server error";
    if (message.startsWith("403")) {
      return new Response(JSON.stringify({ success: false, error: message.replace("403: ", "") }), {
        status: 403,
        headers: { "Content-Type": "application/json" }
      });
    }
    if (message.startsWith("404")) {
      return new Response(JSON.stringify({ success: false, error: message.replace("404: ", "") }), {
        status: 404,
        headers: { "Content-Type": "application/json" }
      });
    }
    return new Response(JSON.stringify({ success: false, error: message }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }

  /**
   * 1. Export PDF Rapor Siswa
   */
  async exportReportCard(reportCardId: number, schoolId: number, userId: number, role: string) {
    try {
      const buffer = await this.pdfService.generateReportCardPdf(schoolId, reportCardId, userId, role);
      return new Response(buffer, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="rapor-${reportCardId}.pdf"`
        }
      });
    } catch (err: any) {
      return this.handleError(err);
    }
  }

  /**
   * 2. Export PDF Rekap Absensi Kelas
   */
  async exportAttendance(
    classId: number,
    academicYearId: number,
    semester: string,
    schoolId: number,
    userId: number,
    role: string
  ) {
    try {
      const buffer = await this.pdfService.generateAttendancePdf(schoolId, classId, academicYearId, semester, userId, role);
      return new Response(buffer, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="rekap-absensi-kelas-${classId}.pdf"`
        }
      });
    } catch (err: any) {
      return this.handleError(err);
    }
  }

  /**
   * 3. Export PDF Jurnal Mengajar Guru
   */
  async exportTeachingJournal(teacherId: number, schoolId: number, userId: number, role: string) {
    try {
      const buffer = await this.pdfService.generateTeachingJournalPdf(schoolId, teacherId, userId, role);
      return new Response(buffer, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="jurnal-mengajar-guru-${teacherId}.pdf"`
        }
      });
    } catch (err: any) {
      return this.handleError(err);
    }
  }

  /**
   * 4. Export PDF Assessment Report
   */
  async exportAssessment(assessmentId: number, schoolId: number, userId: number, role: string) {
    try {
      const buffer = await this.pdfService.generateAssessmentPdf(schoolId, assessmentId, userId, role);
      return new Response(buffer, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="laporan-asesmen-${assessmentId}.pdf"`
        }
      });
    } catch (err: any) {
      return this.handleError(err);
    }
  }

  /**
   * 5. Export PDF Student List
   */
  async exportStudentList(classId: number, academicYearId: number, schoolId: number, userId: number, role: string) {
    try {
      const buffer = await this.pdfService.generateStudentListPdf(schoolId, classId, academicYearId, userId, role);
      return new Response(buffer, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="daftar-siswa-kelas-${classId}.pdf"`
        }
      });
    } catch (err: any) {
      return this.handleError(err);
    }
  }

  /**
   * 6. Export PDF Teacher List
   */
  async exportTeacherList(schoolId: number, userId: number, role: string) {
    try {
      const buffer = await this.pdfService.generateTeacherListPdf(schoolId, userId, role);
      return new Response(buffer, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="daftar-guru.pdf"`
        }
      });
    } catch (err: any) {
      return this.handleError(err);
    }
  }

  /**
   * 7. Export PDF Sanction (Surat Peringatan)
   */
  async exportSanction(sanctionId: number, schoolId: number, userId: number, role: string, docType?: string) {
    try {
      const buffer = await this.pdfService.generateSanctionPdf(schoolId, sanctionId, userId, role, docType);
      return new Response(buffer, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="surat-peringatan-${sanctionId}.pdf"`
        }
      });
    } catch (err: any) {
      return this.handleError(err);
    }
  }

  /**
   * 8. Export PDF Raport Sisipan Siswa
   */
  async exportInterimReportCard(interimReportCardId: number, schoolId: number, userId: number, role: string) {
    try {
      const buffer = await this.pdfService.generateInterimReportCardPdf(schoolId, interimReportCardId, userId, role);
      return new Response(buffer, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="raport-sisipan-${interimReportCardId}.pdf"`
        }
      });
    } catch (err: any) {
      return this.handleError(err);
    }
  }
}

