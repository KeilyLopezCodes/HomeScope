'use strict';

/**
 * Reglas de negocio del panel de administrador (T33).
 * Sin Express ni Prisma: recibe el repositorio inyectado (se puede probar sin BD).
 * Toda acción de moderación escribe una fila en accion_moderacion (auditoría).
 */

const ESTADOS_REPORTE = ['pendiente', 'en_revision', 'resuelto', 'descartado'];
const ESTADOS_ABIERTOS = ['pendiente', 'en_revision'];
const TIPOS_OBJETIVO = ['propiedad', 'usuario', 'comentario'];
const ESTADOS_USUARIO = ['activo', 'suspendido', 'inhabilitado'];
const ROL_ADMINISTRADOR = 'administrador';
const MOTIVO_MAX = 300; // accion_moderacion.motivo es VARCHAR(300) NOT NULL

// accion (VARCHAR(20)) que se guarda al cambiar el estado de un reporte
const ACCION_POR_ESTADO_REPORTE = { en_revision: 'revisar', resuelto: 'resolver', descartado: 'descartar' };

const ACCIONES_PROPIEDAD = {
  pausar: { desde: 'publicado', hacia: 'pausado' },   // deja de aparecer en el listado público
  aprobar: { desde: 'pausado', hacia: 'publicado' },  // vuelve a publicarse
};
const ACCIONES_USUARIO = {
  suspender: { desde: 'activo', hacia: 'suspendido' },
  reactivar: { desde: 'suspendido', hacia: 'activo' },
};

function errorHttp(status, message) {
  const e = new Error(message);
  e.status = status;
  return e;
}

function validarId(valor, etiqueta) {
  const n = Number(valor);
  if (!Number.isInteger(n) || n <= 0) throw errorHttp(400, `${etiqueta} inválido`);
  return n;
}

function validarMotivo(motivo) {
  const m = typeof motivo === 'string' ? motivo.trim() : '';
  if (!m) throw errorHttp(400, 'El motivo es obligatorio: toda acción de moderación queda registrada');
  if (m.length > MOTIVO_MAX) throw errorHttp(400, `El motivo no puede superar ${MOTIVO_MAX} caracteres`);
  return m;
}

function paginacion(query = {}) {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(query.limit, 10) || 20));
  return { page, limit, skip: (page - 1) * limit };
}

const metaPaginacion = (total, page, limit) => ({
  totalItems: total, totalPages: Math.ceil(total / limit), currentPage: page, limit,
});

function accionADto(a) {
  return {
    id: a.id,
    accion: a.accion,
    motivo: a.motivo,
    fecha_accion: a.fecha_accion,
    administrador: a.usuario_accion_moderacion_administrador_idTousuario || { id: a.administrador_id },
    reporte_id: a.reporte_id,
    propiedad_id: a.propiedad_id,
    usuario_id: a.usuario_id,
  };
}

function reporteADto(r) {
  return {
    id: r.id,
    tipo_objetivo: r.tipo_objetivo,
    motivo: r.motivo,
    descripcion: r.descripcion,
    estado: r.estado,
    fecha_creacion: r.fecha_creacion,
    reportante: r.usuario_reporte_reportante_idTousuario || null,
    propiedad: r.propiedad || null,
    usuario_reportado: r.usuario_reporte_usuario_reportado_idTousuario || null,
    comentario: r.comentario_zona || null,
  };
}

function usuarioADto(u) {
  return {
    id: u.id, nombre: u.nombre, apellido: u.apellido, correo: u.correo, estado: u.estado,
    fecha_registro: u.fecha_registro, ultimo_acceso: u.ultimo_acceso,
    roles: (u.usuario_rol || []).map((ur) => ur.rol && ur.rol.nombre).filter(Boolean),
  };
}

const esAdministrador = (u) => (u.usuario_rol || []).some((ur) => ur.rol && ur.rol.nombre === ROL_ADMINISTRADOR);

function crearAdminService({ adminRepo }) {
  // Carga el reporte que se quiere resolver junto con la acción y verifica que esté abierto
  // y que corresponda al objetivo de la acción.
  async function cargarReporteVinculado(reporteIdEntrada, correspondeAlObjetivo, mensajeNoCorresponde) {
    const id = validarId(reporteIdEntrada, 'reporte_id');
    const reporte = await adminRepo.findReportById(id);
    if (!reporte) throw errorHttp(404, 'Reporte no encontrado');
    if (!ESTADOS_ABIERTOS.includes(reporte.estado)) throw errorHttp(409, 'El reporte ya está cerrado');
    if (!correspondeAlObjetivo(reporte)) throw errorHttp(400, mensajeNoCorresponde);
    return reporte;
  }

  async function listarReportes(query = {}) {
    const { estado, tipo } = query;
    if (estado && !ESTADOS_REPORTE.includes(estado)) {
      throw errorHttp(400, `estado inválido. Válidos: ${ESTADOS_REPORTE.join(', ')}`);
    }
    if (tipo && !TIPOS_OBJETIVO.includes(tipo)) {
      throw errorHttp(400, `tipo inválido. Válidos: ${TIPOS_OBJETIVO.join(', ')}`);
    }
    const { page, limit, skip } = paginacion(query);
    const { items, total } = await adminRepo.listReports({ estado, tipo, skip, limit });
    return { items: items.map(reporteADto), pagination: metaPaginacion(total, page, limit) };
  }

  async function obtenerReporte(idEntrada) {
    const id = validarId(idEntrada, 'id');
    const reporte = await adminRepo.findReportById(id);
    if (!reporte) throw errorHttp(404, 'Reporte no encontrado');
    return { ...reporteADto(reporte), acciones: (reporte.accion_moderacion || []).map(accionADto) };
  }

  async function cambiarEstadoReporte(adminId, idEntrada, { estado, motivo } = {}) {
    const id = validarId(idEntrada, 'id');
    if (!ACCION_POR_ESTADO_REPORTE[estado]) {
      throw errorHttp(400, 'estado inválido. Válidos: en_revision, resuelto, descartado');
    }
    const motivoLimpio = validarMotivo(motivo);
    const reporte = await adminRepo.findReportById(id);
    if (!reporte) throw errorHttp(404, 'Reporte no encontrado');
    if (!ESTADOS_ABIERTOS.includes(reporte.estado)) throw errorHttp(409, 'El reporte ya está cerrado');
    if (reporte.estado === estado) throw errorHttp(409, `El reporte ya está en estado ${estado}`);

    const fila = await adminRepo.applyModeration({
      adminId, accion: ACCION_POR_ESTADO_REPORTE[estado], motivo: motivoLimpio,
      reporteId: id, propiedadId: reporte.propiedad_id, usuarioId: reporte.usuario_reportado_id,
      reporteCambio: { id, desde: ESTADOS_ABIERTOS, hacia: estado },
    });
    return { accion: accionADto(fila), nuevo_estado: estado };
  }

  async function cambiarEstadoPropiedad(adminId, idEntrada, { accion, motivo, reporte_id: reporteId } = {}) {
    const id = validarId(idEntrada, 'id');
    const regla = ACCIONES_PROPIEDAD[accion];
    if (!regla) throw errorHttp(400, `accion inválida. Válidas: ${Object.keys(ACCIONES_PROPIEDAD).join(', ')}`);
    const motivoLimpio = validarMotivo(motivo);
    if (reporteId !== undefined && reporteId !== null && accion !== 'pausar') {
      throw errorHttp(400, 'reporte_id solo se puede enviar al pausar una propiedad');
    }

    const propiedad = await adminRepo.findPropertyById(id);
    if (!propiedad) throw errorHttp(404, 'Propiedad no encontrada');
    if (propiedad.estado !== regla.desde) {
      throw errorHttp(409, `Solo se puede ${accion} una propiedad en estado ${regla.desde} (estado actual: ${propiedad.estado})`);
    }

    let reporte = null;
    if (reporteId !== undefined && reporteId !== null) {
      reporte = await cargarReporteVinculado(
        reporteId,
        (r) => r.tipo_objetivo === 'propiedad' && r.propiedad_id === id,
        'El reporte no corresponde a esta propiedad',
      );
    }

    const fila = await adminRepo.applyModeration({
      adminId, accion, motivo: motivoLimpio, propiedadId: id, reporteId: reporte ? reporte.id : null,
      propiedadCambio: { id, desde: regla.desde, hacia: regla.hacia },
      reporteCambio: reporte ? { id: reporte.id, desde: ESTADOS_ABIERTOS, hacia: 'resuelto' } : null,
    });
    return { accion: accionADto(fila), nuevo_estado: regla.hacia };
  }

  async function eliminarPropiedad(adminId, idEntrada, { motivo, reporte_id: reporteId } = {}) {
    const id = validarId(idEntrada, 'id');
    const motivoLimpio = validarMotivo(motivo);
    const propiedad = await adminRepo.findPropertyById(id);
    if (!propiedad) throw errorHttp(404, 'Propiedad no encontrada');
    if (propiedad.estado === 'no_disponible') throw errorHttp(409, 'La propiedad ya fue eliminada');

    let reporte = null;
    if (reporteId !== undefined && reporteId !== null) {
      reporte = await cargarReporteVinculado(
        reporteId,
        (r) => r.tipo_objetivo === 'propiedad' && r.propiedad_id === id,
        'El reporte no corresponde a esta propiedad',
      );
    }

    // Borrado lógico, igual que cuando el dueño elimina: pasa a no_disponible
    const fila = await adminRepo.applyModeration({
      adminId, accion: 'eliminar', motivo: motivoLimpio, propiedadId: id, reporteId: reporte ? reporte.id : null,
      propiedadCambio: { id, desde: propiedad.estado, hacia: 'no_disponible' },
      reporteCambio: reporte ? { id: reporte.id, desde: ESTADOS_ABIERTOS, hacia: 'resuelto' } : null,
    });
    return { accion: accionADto(fila), nuevo_estado: 'no_disponible' };
  }

  async function cambiarEstadoUsuario(adminId, idEntrada, { accion, motivo, reporte_id: reporteId } = {}) {
    const id = validarId(idEntrada, 'id');
    const regla = ACCIONES_USUARIO[accion];
    if (!regla) throw errorHttp(400, `accion inválida. Válidas: ${Object.keys(ACCIONES_USUARIO).join(', ')}`);
    const motivoLimpio = validarMotivo(motivo);
    if (reporteId !== undefined && reporteId !== null && accion !== 'suspender') {
      throw errorHttp(400, 'reporte_id solo se puede enviar al suspender un usuario');
    }
    if (id === Number(adminId)) throw errorHttp(403, 'No puedes moderar tu propia cuenta');

    const usuario = await adminRepo.findUserById(id);
    if (!usuario) throw errorHttp(404, 'Usuario no encontrado');
    if (esAdministrador(usuario)) throw errorHttp(403, 'No se puede moderar a otro administrador');
    if (usuario.estado !== regla.desde) {
      throw errorHttp(409, `Solo se puede ${accion} un usuario en estado ${regla.desde} (estado actual: ${usuario.estado})`);
    }

    let reporte = null;
    if (reporteId !== undefined && reporteId !== null) {
      // El reporte puede ser sobre el usuario o sobre una propiedad de ese usuario
      reporte = await cargarReporteVinculado(
        reporteId,
        (r) => (r.tipo_objetivo === 'usuario' && r.usuario_reportado_id === id)
          || (r.tipo_objetivo === 'propiedad' && r.propiedad && r.propiedad.vendedor_id === id),
        'El reporte no corresponde a este usuario',
      );
    }

    const fila = await adminRepo.applyModeration({
      adminId, accion, motivo: motivoLimpio, usuarioId: id, reporteId: reporte ? reporte.id : null,
      usuarioCambio: { id, desde: regla.desde, hacia: regla.hacia },
      reporteCambio: reporte ? { id: reporte.id, desde: ESTADOS_ABIERTOS, hacia: 'resuelto' } : null,
    });
    return { accion: accionADto(fila), nuevo_estado: regla.hacia };
  }

  async function listarAcciones(query = {}) {
    const opcional = (v, etiqueta) => (v === undefined || v === '' ? undefined : validarId(v, etiqueta));
    const filtros = {
      administradorId: opcional(query.administrador_id, 'administrador_id'),
      reporteId: opcional(query.reporte_id, 'reporte_id'),
      propiedadId: opcional(query.propiedad_id, 'propiedad_id'),
      usuarioId: opcional(query.usuario_id, 'usuario_id'),
      accion: query.accion ? String(query.accion).slice(0, 20) : undefined,
    };
    const { page, limit, skip } = paginacion(query);
    const { items, total } = await adminRepo.listActions({ ...filtros, skip, limit });
    return { items: items.map(accionADto), pagination: metaPaginacion(total, page, limit) };
  }

  async function listarUsuarios(query = {}) {
    if (query.estado && !ESTADOS_USUARIO.includes(query.estado)) {
      throw errorHttp(400, `estado inválido. Válidos: ${ESTADOS_USUARIO.join(', ')}`);
    }
    const q = query.q ? String(query.q).trim().slice(0, 100) : undefined;
    const { page, limit, skip } = paginacion(query);
    const { items, total } = await adminRepo.listUsers({ estado: query.estado, q, skip, limit });
    return { items: items.map(usuarioADto), pagination: metaPaginacion(total, page, limit) };
  }

  return {
    listarReportes, obtenerReporte, cambiarEstadoReporte, cambiarEstadoPropiedad,
    eliminarPropiedad, cambiarEstadoUsuario, listarAcciones, listarUsuarios,
  };
}

// Instancia real, creada al primer uso (así las pruebas no cargan Prisma).
let instancia;
function real() {
  if (!instancia) instancia = crearAdminService({ adminRepo: require('../repositories/admin.repository') });
  return instancia;
}

const delegadas = {};
['listarReportes', 'obtenerReporte', 'cambiarEstadoReporte', 'cambiarEstadoPropiedad',
  'eliminarPropiedad', 'cambiarEstadoUsuario', 'listarAcciones', 'listarUsuarios']
  .forEach((nombre) => { delegadas[nombre] = (...args) => real()[nombre](...args); });

module.exports = { crearAdminService, ...delegadas };