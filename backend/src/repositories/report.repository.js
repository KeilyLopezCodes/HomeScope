const IReportRepository = require('../interfaces/IReport.repository');
const prisma = require('../config/db');

// Un reporte sigue "abierto" mientras moderación no lo resuelva o descarte
const ESTADOS_ABIERTOS = ['pendiente', 'en_revision'];

class ReportRepositoryPrisma extends IReportRepository {
  async create(data) {
    return await prisma.reporte.create({ data });
  }

  async findOpenByReporterAndProperty(reportanteId, propiedadId) {
    return await prisma.reporte.findFirst({
      where: {
        reportante_id: Number(reportanteId),
        tipo_objetivo: 'propiedad',
        propiedad_id: Number(propiedadId),
        estado: { in: ESTADOS_ABIERTOS }
      }
    });
  }
}

module.exports = new ReportRepositoryPrisma();
