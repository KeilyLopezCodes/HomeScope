class IAgendaRepository {
  async findPropiedad(id) { throw new Error('No implementado'); }
  async listarFranjasActivas(vendedorId, propiedadId) { throw new Error('No implementado'); }
  async listarFranjasDelVendedor(vendedorId) { throw new Error('No implementado'); }
  async reemplazarFranjas(vendedorId, propiedadId, franjas) { throw new Error('No implementado'); }
  async listarVisitasActivasDelVendedor(vendedorId, desde, hasta, excluirId) { throw new Error('No implementado'); }
  async findVisitaActivaDelComprador(compradorId, propiedadId) { throw new Error('No implementado'); }
  async findVisitaById(id) { throw new Error('No implementado'); }
  async listarVisitasDeUsuario(usuarioId) { throw new Error('No implementado'); }
  async crearVisita(vendedorId, data) { throw new Error('No implementado'); }
  async cambiarEstadoVisita(id, vendedorId, { desdeEstados, data, nuevaFecha }) { throw new Error('No implementado'); }
  async buscarVisitasPorRecordar(desde, hasta, limite) { throw new Error('No implementado'); }
  async reclamarRecordatorio(id) { throw new Error('No implementado'); }
}
module.exports = IAgendaRepository;