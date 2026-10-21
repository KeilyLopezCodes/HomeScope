const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const { JWT_SECRET, FRONTEND_URL } = require('../config/env');
const { setIo, sala } = require('./emisor');
const mensajeria = require('../services/mensajeria.service');

const EVENTOS = { ENVIAR: 'mensaje:enviar' };

const iniciarSockets = (httpServer) => {
  const io = new Server(httpServer, {
    cors: { origin: FRONTEND_URL, methods: ['GET', 'POST'] },
  });
  setIo(io);

  // Autenticación del handshake: el cliente manda { auth: { token } }
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('Token no proporcionado'));
      const payload = jwt.verify(token, JWT_SECRET);
      if (payload.tipo && payload.tipo !== 'acceso') return next(new Error('Tipo de token no válido'));
      socket.data.usuarioId = payload.id;
      next();
    } catch {
      next(new Error('Token inválido o expirado'));
    }
  });

  io.on('connection', (socket) => {
    // Cada usuario entra a su sala personal: así recibe mensajes de cualquier conversación
    socket.join(sala(socket.data.usuarioId));

    // Envío por WebSocket con acuse (alternativa al POST REST)
    socket.on(EVENTOS.ENVIAR, async ({ conversacionId, contenido } = {}, ack) => {
      const responder = typeof ack === 'function' ? ack : () => {};
      try {
        const mensaje = await mensajeria.enviarMensaje(socket.data.usuarioId, conversacionId, contenido);
        responder({ ok: true, mensaje });
      } catch (error) {
        responder({ ok: false, error: error.estado ? error.message : 'No se pudo enviar el mensaje' });
      }
    });
  });

  return io;
};

module.exports = { iniciarSockets };