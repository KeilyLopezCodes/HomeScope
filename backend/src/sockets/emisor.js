// Guarda la instancia de socket.io para que los servicios puedan emitir sin importar el servidor
// evita dependencias circulares entre server.js y services.
let io = null;

const setIo = (instancia) => { io = instancia; };

const sala = (usuarioId) => `usuario:${usuarioId}`;

// Si socket.io no está levantado (tests, scripts) simplemente no emite: el mensaje ya quedó guardado
const emitirAUsuario = (usuarioId, evento, payload) => {
  if (io) io.to(sala(usuarioId)).emit(evento, payload);
};

module.exports = { setIo, sala, emitirAUsuario };