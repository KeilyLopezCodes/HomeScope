class IGeoIndiceRepository {
  async findPropertyLocation(propiedadId) {
    throw new Error('Método findPropertyLocation() debe ser implementado');
  }
  async findActiveCategories() {
    throw new Error('Método findActiveCategories() debe ser implementado');
  }
  async saveCurrentIndex({ propiedadId, resultado, puntos }) {
    throw new Error('Método saveCurrentIndex() debe ser implementado');
  }
  async findCurrentByPropertyId(propiedadId) {
    throw new Error('Método findCurrentByPropertyId() debe ser implementado');
  }
}

module.exports = IGeoIndiceRepository;