class IAdminRepository {
  async listReports({ estado, tipo, skip, limit }) {
    throw new Error('Método listReports() debe ser implementado');
  }
  async findReportById(id) {
    throw new Error('Método findReportById() debe ser implementado');
  }
  async findPropertyById(id) {
    throw new Error('Método findPropertyById() debe ser implementado');
  }
  async findUserById(id) {
    throw new Error('Método findUserById() debe ser implementado');
  }
  async listUsers({ estado, q, skip, limit }) {
    throw new Error('Método listUsers() debe ser implementado');
  }
  async listActions(filtros) {
    throw new Error('Método listActions() debe ser implementado');
  }
  async applyModeration(datos) {
    throw new Error('Método applyModeration() debe ser implementado');
  }
}

module.exports = IAdminRepository;