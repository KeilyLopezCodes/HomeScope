import { io } from 'socket.io-client';

// El socket vive en el mismo origen que la API (sin el sufijo /api)
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
const SOCKET_URL = API_URL.replace(/\/api\/?$/, '');

export const EVENTOS = {
  NUEVO: 'mensaje:nuevo',
  ENVIADO: 'mensaje:enviado',
  LEIDOS: 'mensajes:leidos',
  NOTIFICACION: 'notificacion:nueva',
};

let socket = null;

// onEstado recibe: 'conectado' | 'reconectando' | 'desconectado'
export function conectar(token, { onEstado, onEvento }) {
  desconectar();
  socket = io(SOCKET_URL, {
    auth: { token },
    reconnection: true,           // reconexión automática
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: Infinity,
    transports: ['websocket', 'polling'],
  });

  socket.on('connect', () => onEstado?.('conectado'));
  socket.on('disconnect', (motivo) => {
    // "io server disconnect": el servidor cortó (token vencido), no reintenta solo
    onEstado?.(motivo === 'io server disconnect' ? 'desconectado' : 'reconectando');
  });
  socket.io.on('reconnect_attempt', () => onEstado?.('reconectando'));
  socket.on('connect_error', (err) => {
    const authFallo = /Token/i.test(err.message);
    onEstado?.(authFallo ? 'desconectado' : 'reconectando');
  });

  Object.values(EVENTOS).forEach((evento) => socket.on(evento, (payload) => onEvento?.(evento, payload)));
  return socket;
}

export function desconectar() {
  if (socket) {
    socket.removeAllListeners();
    socket.io.removeAllListeners();
    socket.disconnect();
    socket = null;
  }
}