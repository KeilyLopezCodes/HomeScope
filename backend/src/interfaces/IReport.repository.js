class IReportRepository {
  async create(reportData) {
    throw new Error('Método create() debe ser implementado');
  }

  async findOpenByReporterAndProperty(reportanteId, propiedadId) {
    throw new Error('Método findOpenByReporterAndProperty() debe ser implementado');
  }
}

module.exports = IReportRepository;
