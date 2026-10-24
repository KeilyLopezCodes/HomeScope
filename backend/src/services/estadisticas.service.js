'use strict';

const OFFSET_MIN = Number(process.env.TZ_OFFSET_MIN ?? -360); // Guatemala (UTC-6), igual que la agenda
const DIAS_PERMITIDOS = [7, 30, 90];

// Umbrales de las sugerencias (valores razonables para ~30 días; se ajustan aquí)
const UMBRAL = { vistasAltas: 20, vistasBajas: 5, favoritosSinContacto: 3, fotosMinimas: 5 };

function errorHttp(status, message) {
  const e = new Error(message);
  e.status = status;
  return e;
}

// Inicio (00:00 hora de Guatemala) del primer día del periodo, expresado como instante UTC
function inicioDelPeriodo(ahora, dias) {
  const local = new Date(ahora.getTime() + OFFSET_MIN * 60000);
  const mediaNocheLocalUtc = Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate() - (dias - 1));
  return new Date(mediaNocheLocalUtc - OFFSET_MIN * 60000);
}

function sugerenciasDePropiedad(p, dias, fotos) {
  const s = [];
  const enlaceFicha = { texto: 'Ver publicación', to: `/propiedades/${p.id}` };

  if (p.estado === 'borrador') {
    s.push({ nivel: 'info', texto: 'Está en borrador: publícala para que aparezca en el catálogo.', accion: enlaceFicha });
    return s;
  }
  if (p.estado === 'pausado') {
    s.push({ nivel: 'aviso', texto: 'Esta publicación fue pausada por moderación y no se muestra en el catálogo.' });
    return s;
  }
  if (p.estado !== 'publicado') return s;

  if (p.visitas_pendientes > 0) {
    s.push({
      nivel: 'importante',
      texto: `Tienes ${p.visitas_pendientes} solicitud${p.visitas_pendientes === 1 ? '' : 'es'} de visita sin responder.`,
      accion: { texto: 'Responder', to: '/panel?tab=visitas' },
    });
  }
  if (p.mensajes_sin_leer > 0) {
    s.push({
      nivel: 'importante',
      texto: `Tienes ${p.mensajes_sin_leer} mensaje${p.mensajes_sin_leer === 1 ? '' : 's'} sin leer. Responder rápido ayuda a no perder interesados.`,
      accion: { texto: 'Ir a mensajes', to: '/mensajes' },
    });
  }
  if (p.vistas >= UMBRAL.vistasAltas && p.mensajes === 0 && p.visitas_solicitadas === 0) {
    s.push({
      nivel: 'aviso',
      texto: `Tuvo ${p.vistas} vistas en ${dias} días pero nadie te ha contactado. Revisa el precio, la descripción y las fotos.`,
      accion: enlaceFicha,
    });
  } else if (p.favoritos >= UMBRAL.favoritosSinContacto && p.mensajes === 0) {
    s.push({
      nivel: 'aviso',
      texto: `${p.favoritos} personas la guardaron en favoritos pero no escribieron. Quizá les falta información o el precio los frena.`,
      accion: enlaceFicha,
    });
  }
  if (p.vistas < UMBRAL.vistasBajas) {
    s.push({
      nivel: 'aviso',
      texto: `Pocas vistas en ${dias} días (${p.vistas}). Mejora el título y las fotos, o destácala para que aparezca primero.`,
      accion: enlaceFicha,
    });
  }
  if (fotos != null && fotos < UMBRAL.fotosMinimas) {
    s.push({
      nivel: 'aviso',
      texto: `Solo tiene ${fotos} foto${fotos === 1 ? '' : 's'}. Agrega más (recomendado: ${UMBRAL.fotosMinimas} o más) para mostrar mejor la propiedad.`,
      accion: enlaceFicha,
    });
  }
  return s;
}

function crearEstadisticasService({ repo, ahora = () => new Date() }) {
  async function obtenerPanel(vendedorId, diasEntrada) {
    const pedido = Number(diasEntrada ?? 30);
    if (!DIAS_PERMITIDOS.includes(pedido)) throw errorHttp(400, `dias debe ser uno de: ${DIAS_PERMITIDOS.join(', ')}`);

    const hasta = ahora();
    const desde = inicioDelPeriodo(hasta, pedido);

    const [propiedades, serie, franjas] = await Promise.all([
      repo.resumenPorPropiedad(vendedorId, desde),
      repo.serieDiaria(vendedorId, desde),
      repo.contarFranjasActivas(vendedorId),
    ]);
    const fotos = await repo.contarFotos(propiedades.map((p) => p.id)); // Map | null

    const detalle = propiedades.map((p) => ({
      ...p,
      tasa_contacto: p.vistas > 0 ? Math.round((p.mensajes / p.vistas) * 1000) / 10 : null, // % de vistas que terminan en mensaje
      sugerencias: sugerenciasDePropiedad(p, pedido, fotos ? (fotos.get(p.id) ?? 0) : null),
    }));

    const publicadas = propiedades.filter((p) => p.estado === 'publicado').length;
    const generales = [];
    if (publicadas > 0 && franjas === 0) {
      generales.push({
        nivel: 'importante',
        texto: 'Aún no defines tus horarios disponibles: los compradores no pueden solicitar visitas.',
        accion: { texto: 'Definir disponibilidad', to: '/panel?tab=disponibilidad' },
      });
    }
    if (propiedades.length === 0) {
      generales.push({
        nivel: 'info', texto: 'Todavía no tienes propiedades. Publica la primera para empezar a ver estadísticas.',
        accion: { texto: 'Publicar', to: '/publicar' },
      });
    }

    const suma = (campo) => detalle.reduce((a, p) => a + p[campo], 0);
    return {
      periodo: { dias: pedido, desde: desde.toISOString(), hasta: hasta.toISOString() },
      resumen: {
        propiedades: propiedades.length, publicadas,
        vistas: suma('vistas'), favoritos: suma('favoritos'), mensajes: suma('mensajes'),
        visitas_pendientes: suma('visitas_pendientes'), mensajes_sin_leer: suma('mensajes_sin_leer'),
      },
      propiedades: detalle,
      serie,
      sugerencias: generales,
    };
  }

  async function registrarVista(propiedadIdEntrada, usuarioId) {
    const id = Number(propiedadIdEntrada);
    if (!Number.isInteger(id) || id <= 0 || id > 2147483647) throw errorHttp(400, 'propiedad_id inválido');
    return { registrada: await repo.registrarVista(id, usuarioId ?? null) };
  }

  return { obtenerPanel, registrarVista };
}

let instancia;
function real() {
  if (!instancia) instancia = crearEstadisticasService({ repo: require('../repositories/estadisticas.repository') });
  return instancia;
}

module.exports = {
  crearEstadisticasService, inicioDelPeriodo, sugerenciasDePropiedad,
  obtenerPanel: (...a) => real().obtenerPanel(...a),
  registrarVista: (...a) => real().registrarVista(...a),
};