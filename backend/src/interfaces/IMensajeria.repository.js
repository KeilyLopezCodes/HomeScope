class IMensajeriaRepository {
    async findPropiedad(propiedadId) {throw new Error('No implementado'); }
    async upsertConversacion(data) {throw new Error('No implementado'); }
    async findConversacionById(id) {throw new Error('No implementado'); }
    async listarConversaciones(usuarioId) {throw new Error('No implementado'); }
    async contarNoLeidos(conversacionIds, usuarioId) {throw new Error('No implementado'); }
    async listarMensajes(conversacionId, usuarioId) {throw new Error('No implementado'); }
    async marcarLeidos(conversacionId, usuarioId) {throw new Error('No implementado'); }
    async crearMensajeConNotificacion(datos) {throw new Error('No implementado'); }
}
module.exports = IMensajeriaRepository;