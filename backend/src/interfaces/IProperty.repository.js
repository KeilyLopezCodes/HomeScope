class IPropertyRepository {
  async create(propertyData) {
    throw new Error('Método create() debe ser implementado');
  }

  async findManyWithPagination({ estado, skip, limit }) {
    throw new Error('Método findManyWithPagination() debe ser implementado');
  }

  async countByEstado(estado) {
    throw new Error('Método countByEstado() debe ser implementado');
  }

  async findByVendorId(userId) {
    throw new Error('Método findByVendorId() debe ser implementado');
  }

  async findById(id) {
    throw new Error('Método findById() debe ser implementado');
  }

  async update(id, data) {
    throw new Error('Método update() debe ser implementado');
  }
}

module.exports = IPropertyRepository;