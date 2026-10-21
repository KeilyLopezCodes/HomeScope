const prisma = require('../config/db');
const IAdminRepository = require('../interfaces/IAdmin.repository');

const PERSONA = { id: true, nombre: true, apellido: true };

const INCLUIR_REPORTE = {
  usuario_reporte_reportante_idTousuario: { select: PERSONA },
  usuario_reporte_usuario_reportado_idTousuario: { select: { ...PERSONA, estado: true } },
  propiedad: { select: { id: true, titulo: true, estado: true, vendedor_id: true } },
  comentario_zona: { select: { id: true, comentario: true, estado: true } },
};

const INCLUIR_ADMIN_ACCION = { usuario_accion_moderacion_administrador_idTousuario: { select: PERSONA } };

function conflicto(mensaje) {
  const e = new Error(mensaje);
  e.status = 409;
  return e;
}

class AdminRepository extends IAdminRepository {
  async listReports({ estado, tipo, skip, limit }) {
    const where = { ...(estado ? { estado } : {}), ...(tipo ? { tipo_objetivo: tipo } : {}) };
    const [items, total] = await prisma.$transaction([
      prisma.reporte.findMany({ where, include: INCLUIR_REPORTE, orderBy: { fecha_creacion: 'desc' }, skip, take: limit }),
      prisma.reporte.count({ where }),
    ]);
    return { items, total };
  }

  async findReportById(id) {
    return prisma.reporte.findUnique({
      where: { id },
      include: {
        ...INCLUIR_REPORTE,
        accion_moderacion: { orderBy: { fecha_accion: 'desc' }, include: INCLUIR_ADMIN_ACCION },
      },
    });
  }

  async findPropertyById(id) {
    return prisma.propiedad.findUnique({
      where: { id },
      select: { id: true, titulo: true, estado: true, vendedor_id: true },
    });
  }

  async findUserById(id) {
    return prisma.usuario.findUnique({
      where: { id },
      select: {
        id: true, nombre: true, apellido: true, correo: true, estado: true,
        usuario_rol: { select: { rol: { select: { nombre: true } } } },
      },
    });
  }

  async listUsers({ estado, q, skip, limit }) {
    const where = {
      ...(estado ? { estado } : {}),
      ...(q ? {
        OR: [
          { nombre: { contains: q, mode: 'insensitive' } },
          { apellido: { contains: q, mode: 'insensitive' } },
          { correo: { contains: q, mode: 'insensitive' } },
        ],
      } : {}),
    };
    const [items, total] = await prisma.$transaction([
      prisma.usuario.findMany({
        where,
        // nunca se devuelve password_hash
        select: {
          id: true, nombre: true, apellido: true, correo: true, estado: true,
          fecha_registro: true, ultimo_acceso: true,
          usuario_rol: { select: { rol: { select: { nombre: true } } } },
        },
        orderBy: { fecha_registro: 'desc' }, skip, take: limit,
      }),
      prisma.usuario.count({ where }),
    ]);
    return { items, total };
  }

  async listActions({ administradorId, accion, reporteId, propiedadId, usuarioId, skip, limit }) {
    const where = {
      ...(administradorId ? { administrador_id: administradorId } : {}),
      ...(accion ? { accion } : {}),
      ...(reporteId ? { reporte_id: reporteId } : {}),
      ...(propiedadId ? { propiedad_id: propiedadId } : {}),
      ...(usuarioId ? { usuario_id: usuarioId } : {}),
    };
    const [items, total] = await prisma.$transaction([
      prisma.accion_moderacion.findMany({
        where, include: INCLUIR_ADMIN_ACCION, orderBy: { fecha_accion: 'desc' }, skip, take: limit,
      }),
      prisma.accion_moderacion.count({ where }),
    ]);
    return { items, total };
  }

  /**
   * Aplica una acción de moderación en UNA transacción: cambia el estado del objetivo
   * y escribe la fila de auditoría (administrador, acción, motivo y fecha_accion).
   * Cada cambio exige el estado anterior (`desde`): si otro administrador lo cambió en
   * el medio, se lanza 409 y no se guarda nada.
   */
  async applyModeration({
    adminId, accion, motivo, reporteId = null, propiedadId = null, usuarioId = null,
    propiedadCambio = null, usuarioCambio = null, reporteCambio = null,
  }) {
    return prisma.$transaction(async (tx) => {
      if (propiedadCambio) {
        const r = await tx.propiedad.updateMany({
          where: { id: propiedadCambio.id, estado: propiedadCambio.desde },
          data: { estado: propiedadCambio.hacia, fecha_actualizacion: new Date() },
        });
        if (r.count === 0) throw conflicto('La propiedad cambió de estado mientras se procesaba la acción');
      }
      if (usuarioCambio) {
        const r = await tx.usuario.updateMany({
          where: { id: usuarioCambio.id, estado: usuarioCambio.desde },
          data: { estado: usuarioCambio.hacia },
        });
        if (r.count === 0) throw conflicto('El usuario cambió de estado mientras se procesaba la acción');
      }
      if (reporteCambio) {
        const r = await tx.reporte.updateMany({
          where: { id: reporteCambio.id, estado: { in: reporteCambio.desde } },
          data: { estado: reporteCambio.hacia },
        });
        if (r.count === 0) throw conflicto('El reporte ya fue cerrado por otro administrador');
      }
      return tx.accion_moderacion.create({
        data: {
          administrador_id: adminId, reporte_id: reporteId, accion,
          propiedad_id: propiedadId, usuario_id: usuarioId, motivo,
        },
      });
    });
  }
}

module.exports = new AdminRepository();