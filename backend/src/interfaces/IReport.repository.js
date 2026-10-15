class IReportRepository {
  async create(reportData) {
    throw new Error('Método create() debe ser implementado');
  }

  async findOpenByReporterAndProperty(reportanteId, propiedadId) {
    throw new Error('Método findOpenByReporterAndProperty() debe ser implementado');
  }

  async findById(id) {
    throw new Error('Método findById() debe ser implementado');
  }

  async findManyWithPagination({ estado, propiedadId, skip, limit }) {
    throw new Error('Método findManyWithPagination() debe ser implementado');
  }

  async resolve(id, { nuevoEstado, administradorId, accion, motivo }) {
    throw new Error('Método resolve() debe ser implementado');
  }
}

module.exports = IReportRepository;
