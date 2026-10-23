const prisma = require('../config/db');
const IAgendaRepository = require('../interfaces/IAgenda.repository');

const ESTADOS_ACTIVOS = ['solicitada', 'confirmada', 'reprogramada'];
const DURACION_MIN = 60; // cada visita ocupa 1 hora

// Solo datos públicos: nunca correo ni teléfono
const PERSONA = { select: { id: true, nombre: true, apellido: true } };
const INCLUIR_VISITA = {
  propiedad: { select: { id: true, titulo: true, vendedor_id: true } },
  usuario: PERSONA, // comprador
};

function conflicto(mensaje) {
  const e = new Error(mensaje);
  e.status = 409;
  return e;
}

// Hora del día de una columna TIME (Prisma la devuelve como Date en 1970-01-01 UTC)
const horaADate = (hhmm) => new Date(`1970-01-01T${hhmm}:00.000Z`);

// Visitas del vendedor que ocupan el rango (lo, hi): usa la fecha confirmada si existe
const filtroOcupadas = (vendedorId, lo, hi, excluirId) => ({
  estado: { in: ESTADOS_ACTIVOS },
  propiedad: { vendedor_id: vendedorId },
  ...(excluirId ? { id: { not: excluirId } } : {}),
  OR: [
    { fecha_hora_confirmada: { gt: lo, lt: hi } },
    { fecha_hora_confirmada: null, fecha_hora_solicitada: { gt: lo, lt: hi } },
  ],
});

// Bloquea al vendedor durante la transacción: dos compradores no pueden tomar el mismo horario a la vez
const bloquearVendedor = (tx, vendedorId) => tx.$executeRaw`SELECT pg_advisory_xact_lock(${vendedorId})`;

class AgendaRepositoryPrisma extends IAgendaRepository {
  async findPropiedad(id) {
    return prisma.propiedad.findUnique({
      where: { id },
      select: { id: true, titulo: true, vendedor_id: true, estado: true },
    });
  }

  // Franjas generales (propiedad_id null) y las específicas de esta propiedad
  async listarFranjasActivas(vendedorId, propiedadId) {
    return prisma.disponibilidad_vendedor.findMany({
      where: { vendedor_id: vendedorId, activa: true, OR: [{ propiedad_id: null }, { propiedad_id: propiedadId }] },
      orderBy: [{ dia_semana: 'asc' }, { hora_inicio: 'asc' }],
    });
  }

  async listarFranjasDelVendedor(vendedorId) {
    return prisma.disponibilidad_vendedor.findMany({
      where: { vendedor_id: vendedorId, activa: true },
      orderBy: [{ dia_semana: 'asc' }, { hora_inicio: 'asc' }],
    });
  }

  // Reemplaza todas las franjas de un ámbito (general o de una propiedad) en una transacción
  async reemplazarFranjas(vendedorId, propiedadId, franjas) {
    return prisma.$transaction(async (tx) => {
      await tx.disponibilidad_vendedor.deleteMany({ where: { vendedor_id: vendedorId, propiedad_id: propiedadId } });
      if (franjas.length) {
        await tx.disponibilidad_vendedor.createMany({
          data: franjas.map((f) => ({
            vendedor_id: vendedorId, propiedad_id: propiedadId, dia_semana: f.dia_semana,
            hora_inicio: horaADate(f.hora_inicio), hora_fin: horaADate(f.hora_fin), activa: true,
          })),
        });
      }
      return tx.disponibilidad_vendedor.findMany({
        where: { vendedor_id: vendedorId, propiedad_id: propiedadId },
        orderBy: [{ dia_semana: 'asc' }, { hora_inicio: 'asc' }],
      });
    });
  }

  async listarVisitasActivasDelVendedor(vendedorId, desde, hasta, excluirId = null) {
    return prisma.visita.findMany({
      where: filtroOcupadas(vendedorId, new Date(desde.getTime() - DURACION_MIN * 60000), hasta, excluirId),
      select: { id: true, fecha_hora_solicitada: true, fecha_hora_confirmada: true },
    });
  }

  async findVisitaActivaDelComprador(compradorId, propiedadId) {
    return prisma.visita.findFirst({
      where: { comprador_id: compradorId, propiedad_id: propiedadId, estado: { in: ESTADOS_ACTIVOS } },
      select: { id: true },
    });
  }

  async findVisitaById(id) {
    return prisma.visita.findUnique({ where: { id }, include: INCLUIR_VISITA });
  }

  async listarVisitasDeUsuario(usuarioId) {
    return prisma.visita.findMany({
      where: { OR: [{ comprador_id: usuarioId }, { propiedad: { vendedor_id: usuarioId } }] },
      include: INCLUIR_VISITA,
      orderBy: { fecha_hora_solicitada: 'desc' },
    });
  }

  async crearVisita(vendedorId, data) {
    return prisma.$transaction(async (tx) => {
      await bloquearVendedor(tx, vendedorId);
      const t = data.fecha_hora_solicitada;
      const choque = await tx.visita.findFirst({
        where: filtroOcupadas(vendedorId, new Date(t.getTime() - DURACION_MIN * 60000), new Date(t.getTime() + DURACION_MIN * 60000)),
        select: { id: true },
      });
      if (choque) throw conflicto('Ese horario acaba de ser reservado. Elige otro.');
      return tx.visita.create({ data, include: INCLUIR_VISITA });
    });
  }

  /**
   * Cambio de estado atómico: solo se aplica si la visita sigue en uno de `desdeEstados`
   * (si otra persona la cambió antes, 409). Con `nuevaFecha` vuelve a revisar choques de horario.
   */
  async cambiarEstadoVisita(id, vendedorId, { desdeEstados, data, nuevaFecha = null }) {
    return prisma.$transaction(async (tx) => {
      await bloquearVendedor(tx, vendedorId);
      if (nuevaFecha) {
        const choque = await tx.visita.findFirst({
          where: filtroOcupadas(
            vendedorId,
            new Date(nuevaFecha.getTime() - DURACION_MIN * 60000),
            new Date(nuevaFecha.getTime() + DURACION_MIN * 60000),
            id,
          ),
          select: { id: true },
        });
        if (choque) throw conflicto('Ese horario ya está ocupado. Elige otro.');
      }
      const r = await tx.visita.updateMany({
        where: { id, estado: { in: desdeEstados } },
        data: { ...data, fecha_actualizacion: new Date() },
      });
      if (r.count === 0) throw conflicto('La visita cambió de estado mientras se procesaba la acción');
      return tx.visita.findUnique({ where: { id }, include: INCLUIR_VISITA });
    });
  }

  async buscarVisitasPorRecordar(desde, hasta, limite = 100) {
    return prisma.visita.findMany({
      where: { estado: 'confirmada', recordatorio_enviado: false, fecha_hora_confirmada: { gt: desde, lte: hasta } },
      include: {
        propiedad: { select: { id: true, titulo: true, vendedor_id: true, usuario: { select: { nombre: true, apellido: true, correo: true } } } },
        usuario: { select: { id: true, nombre: true, apellido: true, correo: true } },
      },
      orderBy: { fecha_hora_confirmada: 'asc' },
      take: limite,
    });
  }

  // true si ESTE proceso fue quien marcó el recordatorio (evita enviarlo dos veces)
  async reclamarRecordatorio(id) {
    const r = await prisma.visita.updateMany({
      where: { id, recordatorio_enviado: false, estado: 'confirmada' },
      data: { recordatorio_enviado: true },
    });
    return r.count === 1;
  }
}

module.exports = new AgendaRepositoryPrisma();
module.exports.ESTADOS_ACTIVOS = ESTADOS_ACTIVOS;