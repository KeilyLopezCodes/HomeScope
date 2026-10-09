class IPriceHistoryRepository {
    async createHistoryRecord({propiedaId, precioAnterior, precioNuevo, cambiadoPor}) {
        throw new Error('Metodo createHistoryRecord() debe ser implementado');
    }
    async findByPropertyId(propiedadId){
        throw new Error('Metodo findByPropertyId() debe ser implementado');
    }
}

module.exports = IPriceHistoryRepository;