const IReportRepository = require('../interfaces/IReport.repository');
const prisma = require('../config/db');

// Un reporte sigue "abierto" mientras moderación no lo resuelva o descarte
const ESTADOS_ABIERTOS = ['pendiente', 'en_revision'];

const INCLUDE_DETALLE = {
  propiedad: { select: { id: true, titulo: true, estado: true, vendedor_id: true } },
  usuario_reporte_reportante_idTousuario: { select: { id: true, nombre: true, apellido: true } },
  accion_moderacion: {
    select: { id: true, accion: true, motivo: true, fecha_accion: true, administrador_id: true },
    orderBy: { fecha_accion: 'desc' }
  }
};

class ReportRepositoryPrisma extends IReportRepository {
  async create(data) {
    return await prisma.reporte.create({ data });
  }

  async findOpenByReporterAndProperty(reportanteId, propiedadId) {
    return await prisma.reporte.findFirst({
      where: {
        reportante_id: Number(reportanteId),
        tipo_objetivo: 'propiedad',
        propiedad_id: Number(propiedadId),
        estado: { in: ESTADOS_ABIERTOS }
      }
    });
  }

  async findById(id) {
    return await prisma.reporte.findUnique({ where: { id: Number(id) }, include: INCLUDE_DETALLE });
  }

  async findManyWithPagination({ estado, propiedadId, skip, limit }) {
    const where = { tipo_objetivo: 'propiedad' };
    if (estado) where.estado = estado;
    if (propiedadId) where.propiedad_id = Number(propiedadId);

    const [reportes, total] = await Promise.all([
      prisma.reporte.findMany({
        where,
        skip,
        take: limit,
        include: INCLUDE_DETALLE,
        // Cola FIFO: los más antiguos se atienden primero
        orderBy: [{ fecha_creacion: 'asc' }, { id: 'asc' }]
      }),
      prisma.reporte.count({ where })
    ]);
    return { reportes, total };
  }

  // Cambia el estado solo si el reporte sigue abierto y registra la acción de moderación,
  // todo en una transacción. Devuelve null si otro moderador ya lo había resuelto.
  async resolve(id, { nuevoEstado, administradorId, accion, motivo }) {
    return await prisma.$transaction(async (tx) => {
      const { count } = await tx.reporte.updateMany({
        where: { id: Number(id), estado: { in: ESTADOS_ABIERTOS } },
        data: { estado: nuevoEstado }
      });
      if (count === 0) return null;

      const reporte = await tx.reporte.findUnique({ where: { id: Number(id) } });
      await tx.accion_moderacion.create({
        data: {
          administrador_id: administradorId,
          reporte_id: reporte.id,
          propiedad_id: reporte.propiedad_id,
          accion,
          motivo
        }
      });
      return await tx.reporte.findUnique({ where: { id: reporte.id }, include: INCLUDE_DETALLE });
    });
  }
}

module.exports = new ReportRepositoryPrisma();
module.exports.ESTADOS_ABIERTOS = ESTADOS_ABIERTOS;
