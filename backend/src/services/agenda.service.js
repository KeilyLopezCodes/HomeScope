'use strict';

const DURACION_MIN = 60;
const ANTICIPACION_MIN = 120;   // no se puede pedir una visita para dentro de menos de 2 horas
const MAX_DIAS = 30;            // ni con más de 30 días de anticipación
const MAX_FRANJAS = 30;
const MAX_NOTA = 300;
const OFFSET_MIN = Number(process.env.TZ_OFFSET_MIN ?? -360);
const ESTADOS_ACTIVOS = ['solicitada', 'confirmada', 'reprogramada'];
const REGEX_HORA = /^([01]\d|2[0-3]):[0-5]\d$/;

function errorHttp(status, message) {
  const e = new Error(message);
  e.status = status;
  return e;
}

function validarId(valor, etiqueta) {
  const n = Number(valor);
  if (!Number.isInteger(n) || n <= 0 || n > 2147483647) throw errorHttp(400, `${etiqueta} inválido`);
  return n;
}

// ---- Tiempo (hora local de Guatemala) ----
const aLocal = (fecha) => new Date(fecha.getTime() + OFFSET_MIN * 60000); // leer con getUTC*
const desdeLocal = (y, m, d, minutos) => new Date(Date.UTC(y, m, d, 0, minutos) - OFFSET_MIN * 60000);

const minutosDeHHMM = (hhmm) => Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3, 5));
const minutosDeColumnaTime = (d) => d.getUTCHours() * 60 + d.getUTCMinutes(); // TIME llega como Date 1970 UTC
const pad = (n) => String(n).padStart(2, '0');
const hhmmDeColumna = (d) => `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`;

const fechaEfectiva = (v) => v.fecha_hora_confirmada || v.fecha_hora_solicitada;
const solapa = (a, b) => Math.abs(a.getTime() - b.getTime()) < DURACION_MIN * 60000;

function parsearFecha(valor, etiqueta = 'fecha_hora') {
  if (typeof valor !== 'string' || !valor.trim()) throw errorHttp(400, `${etiqueta} es obligatoria`);
  const f = new Date(valor);
  if (Number.isNaN(f.getTime())) throw errorHttp(400, `${etiqueta} inválida (usa formato ISO, ej. 2026-11-05T15:00:00-06:00)`);
  return f;
}

const textoFecha = (f) =>
  f.toLocaleString('es-GT', { dateStyle: 'full', timeStyle: 'short', timeZone: 'America/Guatemala' });

// ---- DTOs (nunca correo ni teléfono) ----
const nombre = (u) => `${u.nombre} ${u.apellido}`.trim();

function franjaADto(f) {
  return {
    id: f.id, propiedad_id: f.propiedad_id, dia_semana: f.dia_semana,
    hora_inicio: hhmmDeColumna(f.hora_inicio), hora_fin: hhmmDeColumna(f.hora_fin),
  };
}

function visitaADto(v, usuarioId) {
  const esVendedor = v.propiedad.vendedor_id === usuarioId;
  return {
    id: v.id,
    propiedad: { id: v.propiedad.id, titulo: v.propiedad.titulo },
    comprador: { id: v.usuario.id, nombre: nombre(v.usuario) },
    vendedor_id: v.propiedad.vendedor_id,
    estado: v.estado,
    fecha_hora: fechaEfectiva(v),
    fecha_hora_solicitada: v.fecha_hora_solicitada,
    fecha_hora_confirmada: v.fecha_hora_confirmada,
    nota_comprador: v.nota_comprador,
    mi_rol: esVendedor ? 'vendedor' : 'comprador',
    fecha_creacion: v.fecha_creacion,
  };
}

// ---- Cálculo de horarios libres ----
// Si el vendedor definió franjas para esa propiedad se usan solo esas; si no, las generales.
function franjasAplicables(franjas, propiedadId) {
  const propias = franjas.filter((f) => f.propiedad_id === propiedadId);
  return propias.length ? propias : franjas.filter((f) => f.propiedad_id === null);
}

function generarHorarios(franjas, ahora, dias, ocupadas) {
  const minimo = new Date(ahora.getTime() + ANTICIPACION_MIN * 60000);
  const resultado = [];
  for (let i = 0; i <= dias; i++) {
    const dia = aLocal(new Date(ahora.getTime() + i * 86400000));
    const y = dia.getUTCFullYear(); const m = dia.getUTCMonth(); const d = dia.getUTCDate();
    const diaSemana = dia.getUTCDay() || 7;
    const slotsDelDia = [];
    franjas.filter((f) => f.dia_semana === diaSemana).forEach((f) => {
      const ini = minutosDeColumnaTime(f.hora_inicio);
      const fin = minutosDeColumnaTime(f.hora_fin);
      for (let t = ini; t + DURACION_MIN <= fin; t += DURACION_MIN) {
        const inicio = desdeLocal(y, m, d, t);
        if (inicio < minimo || inicio > new Date(ahora.getTime() + dias * 86400000)) continue;
        if (ocupadas.some((o) => solapa(inicio, o))) continue;
        slotsDelDia.push(inicio);
      }
    });
    slotsDelDia.sort((a, b) => a - b).forEach((s) => resultado.push(s));
  }
  return resultado;
}

function crearAgendaService({ repo, notificar, ahora = () => new Date() }) {
  // Horarios libres de una propiedad (opcionalmente ignorando una visita, para reprogramarla)
  async function horariosLibres(propiedad, dias, excluirVisitaId = null) {
    const inicio = ahora();
    const franjas = franjasAplicables(await repo.listarFranjasActivas(propiedad.vendedor_id, propiedad.id), propiedad.id);
    if (!franjas.length) return { franjas, horarios: [] };
    const fin = new Date(inicio.getTime() + (dias + 1) * 86400000);
    const visitas = await repo.listarVisitasActivasDelVendedor(propiedad.vendedor_id, inicio, fin, excluirVisitaId);
    const ocupadas = visitas.map(fechaEfectiva);
    return { franjas, horarios: generarHorarios(franjas, inicio, dias, ocupadas) };
  }

  async function propiedadVisitable(propiedadId) {
    const propiedad = await repo.findPropiedad(propiedadId);
    if (!propiedad || propiedad.estado !== 'publicado') throw errorHttp(404, 'Propiedad no encontrada');
    return propiedad;
  }

  async function visitaDelParticipante(usuarioId, idEntrada) {
    const id = validarId(idEntrada, 'id');
    const visita = await repo.findVisitaById(id);
    if (!visita) throw errorHttp(404, 'Visita no encontrada');
    const esVendedor = visita.propiedad.vendedor_id === usuarioId;
    const esComprador = visita.comprador_id === usuarioId;
    if (!esVendedor && !esComprador) throw errorHttp(403, 'No tienes acceso a esta visita');
    return { id, visita, esVendedor, esComprador };
  }

  // ---------- Disponibilidad del vendedor ----------
  async function obtenerMiDisponibilidad(usuarioId) {
    return (await repo.listarFranjasDelVendedor(usuarioId)).map(franjaADto);
  }

  async function guardarDisponibilidad(usuarioId, { propiedad_id: propiedadEntrada, franjas } = {}) {
    let propiedadId = null;
    if (propiedadEntrada !== undefined && propiedadEntrada !== null) {
      propiedadId = validarId(propiedadEntrada, 'propiedad_id');
      const propiedad = await repo.findPropiedad(propiedadId);
      if (!propiedad) throw errorHttp(404, 'Propiedad no encontrada');
      if (propiedad.vendedor_id !== usuarioId) throw errorHttp(403, 'Solo puedes definir horarios de tus propias propiedades');
    }
    if (!Array.isArray(franjas)) throw errorHttp(400, 'franjas debe ser una lista (puede ir vacía para borrar tus horarios)');
    if (franjas.length > MAX_FRANJAS) throw errorHttp(400, `Máximo ${MAX_FRANJAS} franjas`);

    const limpias = franjas.map((f, i) => {
      const dia = Number(f?.dia_semana);
      if (!Number.isInteger(dia) || dia < 1 || dia > 7) throw errorHttp(400, `Franja ${i + 1}: dia_semana debe ser de 1 (lunes) a 7 (domingo)`);
      if (!REGEX_HORA.test(f?.hora_inicio || '') || !REGEX_HORA.test(f?.hora_fin || '')) {
        throw errorHttp(400, `Franja ${i + 1}: hora_inicio y hora_fin deben tener formato HH:MM (24 horas)`);
      }
      const ini = minutosDeHHMM(f.hora_inicio);
      const fin = minutosDeHHMM(f.hora_fin);
      if (fin - ini < DURACION_MIN) throw errorHttp(400, `Franja ${i + 1}: debe durar al menos ${DURACION_MIN} minutos y hora_fin debe ser mayor que hora_inicio`);
      return { dia_semana: dia, hora_inicio: f.hora_inicio, hora_fin: f.hora_fin, ini, fin };
    });
    for (let a = 0; a < limpias.length; a++) {
      for (let b = a + 1; b < limpias.length; b++) {
        const x = limpias[a]; const y = limpias[b];
        if (x.dia_semana === y.dia_semana && x.ini < y.fin && y.ini < x.fin) {
          throw errorHttp(400, 'Hay franjas que se traslapan el mismo día');
        }
      }
    }
    const guardadas = await repo.reemplazarFranjas(usuarioId, propiedadId, limpias);
    return guardadas.map(franjaADto);
  }

  // ---------- Horarios libres para el comprador ----------
  async function listarHorarios(propiedadIdEntrada, diasEntrada) {
    const propiedad = await propiedadVisitable(validarId(propiedadIdEntrada, 'propiedad_id'));
    const dias = Math.min(MAX_DIAS, Math.max(1, parseInt(diasEntrada, 10) || 14));
    const { horarios } = await horariosLibres(propiedad, dias);
    const porDia = {};
    horarios.forEach((h) => {
      const l = aLocal(h);
      const clave = `${l.getUTCFullYear()}-${pad(l.getUTCMonth() + 1)}-${pad(l.getUTCDate())}`;
      (porDia[clave] = porDia[clave] || []).push({
        inicio: h.toISOString(), fin: new Date(h.getTime() + DURACION_MIN * 60000).toISOString(),
      });
    });
    return Object.entries(porDia).map(([fecha, slots]) => ({ fecha, horarios: slots }));
  }

  // ---------- Visitas ----------
  async function solicitarVisita(compradorId, { propiedad_id: propiedadEntrada, fecha_hora: fechaEntrada, nota } = {}) {
    const propiedad = await propiedadVisitable(validarId(propiedadEntrada, 'propiedad_id'));
    const fecha = parsearFecha(fechaEntrada);
    if (nota !== undefined && nota !== null && typeof nota !== 'string') throw errorHttp(400, 'nota debe ser texto');
    const notaLimpia = typeof nota === 'string' ? nota.trim() : '';
    if (notaLimpia.length > MAX_NOTA) throw errorHttp(400, `La nota no puede superar ${MAX_NOTA} caracteres`);
    if (propiedad.vendedor_id === compradorId) throw errorHttp(403, 'No puedes agendar una visita a tu propia propiedad');
    if (await repo.findVisitaActivaDelComprador(compradorId, propiedad.id)) {
      throw errorHttp(409, 'Ya tienes una visita pendiente para esta propiedad. Cancélala o reprográmala.');
    }

    const { franjas, horarios } = await horariosLibres(propiedad, MAX_DIAS);
    if (!franjas.length) throw errorHttp(409, 'El vendedor aún no ha declarado horarios disponibles para visitas');
    if (!horarios.some((h) => h.getTime() === fecha.getTime())) {
      throw errorHttp(400, 'Ese horario no está disponible. Consulta los horarios libres de la propiedad.');
    }

    const visita = await repo.crearVisita(propiedad.vendedor_id, {
      propiedad_id: propiedad.id, comprador_id: compradorId,
      fecha_hora_solicitada: fecha, nota_comprador: notaLimpia || null,
    });
    await notificar(propiedad.vendedor_id, {
      tipo: 'visita_solicitada', titulo: `Nueva solicitud de visita: ${propiedad.titulo}`,
      contenido: `${nombre(visita.usuario)} quiere visitar la propiedad el ${textoFecha(fecha)}.`,
      referencia_tipo: 'visita', referencia_id: visita.id,
    });
    return visitaADto(visita, compradorId);
  }

  async function confirmarVisita(vendedorId, idEntrada) {
    const { id, visita, esVendedor } = await visitaDelParticipante(vendedorId, idEntrada);
    if (!esVendedor) throw errorHttp(403, 'Solo el vendedor puede confirmar la visita');
    if (visita.estado !== 'solicitada') throw errorHttp(409, `Solo se puede confirmar una visita solicitada (estado actual: ${visita.estado})`);
    if (visita.fecha_hora_solicitada <= ahora()) throw errorHttp(409, 'La fecha solicitada ya pasó. Reprograma la visita.');

    const actualizada = await repo.cambiarEstadoVisita(id, vendedorId, {
      desdeEstados: ['solicitada'],
      data: { estado: 'confirmada', fecha_hora_confirmada: visita.fecha_hora_solicitada, recordatorio_enviado: false },
    });
    await notificar(visita.comprador_id, {
      tipo: 'visita_confirmada', titulo: `Visita confirmada: ${visita.propiedad.titulo}`,
      contenido: `Tu visita quedó confirmada para el ${textoFecha(visita.fecha_hora_solicitada)}.`,
      referencia_tipo: 'visita', referencia_id: id,
    });
    return visitaADto(actualizada, vendedorId);
  }

  async function reprogramarVisita(vendedorId, idEntrada, { fecha_hora: fechaEntrada } = {}) {
    const { id, visita, esVendedor } = await visitaDelParticipante(vendedorId, idEntrada);
    if (!esVendedor) throw errorHttp(403, 'Solo el vendedor puede reprogramar la visita');
    if (!ESTADOS_ACTIVOS.includes(visita.estado)) throw errorHttp(409, `No se puede reprogramar una visita ${visita.estado}`);
    const fecha = parsearFecha(fechaEntrada);
    if (fecha.getTime() === fechaEfectiva(visita).getTime()) throw errorHttp(400, 'La nueva fecha es la misma que la actual');

    const propiedad = await repo.findPropiedad(visita.propiedad.id);
    const { horarios } = await horariosLibres(propiedad, MAX_DIAS, id);
    if (!horarios.some((h) => h.getTime() === fecha.getTime())) {
      throw errorHttp(400, 'Ese horario no está dentro de tu disponibilidad o ya está ocupado');
    }

    const actualizada = await repo.cambiarEstadoVisita(id, vendedorId, {
      desdeEstados: ESTADOS_ACTIVOS, nuevaFecha: fecha,
      data: { estado: 'reprogramada', fecha_hora_confirmada: fecha, recordatorio_enviado: false },
    });
    await notificar(visita.comprador_id, {
      tipo: 'visita_reprogramada', titulo: `Visita reprogramada: ${visita.propiedad.titulo}`,
      contenido: `El vendedor propone el ${textoFecha(fecha)}. Acepta el nuevo horario o cancela la visita.`,
      referencia_tipo: 'visita', referencia_id: id,
    });
    return visitaADto(actualizada, vendedorId);
  }

  async function aceptarReprogramacion(compradorId, idEntrada) {
    const { id, visita, esComprador } = await visitaDelParticipante(compradorId, idEntrada);
    if (!esComprador) throw errorHttp(403, 'Solo el comprador puede aceptar la reprogramación');
    if (visita.estado !== 'reprogramada') throw errorHttp(409, `No hay una reprogramación pendiente (estado actual: ${visita.estado})`);
    if (visita.fecha_hora_confirmada <= ahora()) throw errorHttp(409, 'El horario propuesto ya pasó');

    const actualizada = await repo.cambiarEstadoVisita(id, visita.propiedad.vendedor_id, {
      desdeEstados: ['reprogramada'], data: { estado: 'confirmada', recordatorio_enviado: false },
    });
    await notificar(visita.propiedad.vendedor_id, {
      tipo: 'visita_confirmada', titulo: `Reprogramación aceptada: ${visita.propiedad.titulo}`,
      contenido: `${nombre(visita.usuario)} aceptó el nuevo horario: ${textoFecha(visita.fecha_hora_confirmada)}.`,
      referencia_tipo: 'visita', referencia_id: id,
    });
    return visitaADto(actualizada, compradorId);
  }

  async function cancelarVisita(usuarioId, idEntrada) {
    const { id, visita, esVendedor } = await visitaDelParticipante(usuarioId, idEntrada);
    if (!ESTADOS_ACTIVOS.includes(visita.estado)) throw errorHttp(409, `No se puede cancelar una visita ${visita.estado}`);
    // El vendedor que descarta una solicitud nueva la "rechaza"; en cualquier otro caso es una cancelación
    const nuevoEstado = esVendedor && visita.estado === 'solicitada' ? 'rechazada' : 'cancelada';

    const actualizada = await repo.cambiarEstadoVisita(id, visita.propiedad.vendedor_id, {
      desdeEstados: ESTADOS_ACTIVOS, data: { estado: nuevoEstado },
    });
    const destinatario = esVendedor ? visita.comprador_id : visita.propiedad.vendedor_id;
    await notificar(destinatario, {
      tipo: nuevoEstado === 'rechazada' ? 'visita_rechazada' : 'visita_cancelada',
      titulo: `Visita ${nuevoEstado}: ${visita.propiedad.titulo}`,
      contenido: nuevoEstado === 'rechazada'
        ? 'El vendedor no pudo atender tu solicitud. Puedes elegir otro horario.'
        : `La visita del ${textoFecha(fechaEfectiva(visita))} fue cancelada.`,
      referencia_tipo: 'visita', referencia_id: id,
    });
    return visitaADto(actualizada, usuarioId);
  }

  async function listarMisVisitas(usuarioId) {
    return (await repo.listarVisitasDeUsuario(usuarioId)).map((v) => visitaADto(v, usuarioId));
  }

  return {
    obtenerMiDisponibilidad, guardarDisponibilidad, listarHorarios, solicitarVisita,
    confirmarVisita, reprogramarVisita, aceptarReprogramacion, cancelarVisita, listarMisVisitas,
  };
}

// Instancia real, creada al primer uso (así las pruebas no cargan Prisma).
let instancia;
function real() {
  if (!instancia) {
    instancia = crearAgendaService({
      repo: require('../repositories/agenda.repository'),
      notificar: require('./notificacion.service').notificar,
    });
  }
  return instancia;
}
const delegadas = {};
['obtenerMiDisponibilidad', 'guardarDisponibilidad', 'listarHorarios', 'solicitarVisita', 'confirmarVisita',
  'reprogramarVisita', 'aceptarReprogramacion', 'cancelarVisita', 'listarMisVisitas']
  .forEach((n) => { delegadas[n] = (...args) => real()[n](...args); });

module.exports = { crearAgendaService, ...delegadas };