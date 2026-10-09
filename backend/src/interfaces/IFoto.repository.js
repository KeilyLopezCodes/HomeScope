class IFotoRepository {
  async create(data) {
    throw new Error('Método create() debe ser implementado');
  }
  async findByPropertyId(propiedadId) {
    throw new Error('Método findByPropertyId() debe ser implementado');
  }
  async delete(id) {
    throw new Error('Método delete() debe ser implementado');
  }
  async deleteByPropertyId(propiedadId) { 
    throw new Error('Método deleteByPropertyId() debe ser implementado'); 
  }
  async quitarPortadas(propiedadId) { 
    throw new Error('Método quitarPortadas() debe ser implementado');
  }
  async reordenar(ids, portadaId) { 
    throw new Error('Método reordenar() debe ser implementado'); 
  }
}

module.exports = IFotoRepository;