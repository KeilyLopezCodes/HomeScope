'use strict';

// Consultas del panel del vendedor. Todo va con parámetros ($1, $2...), nunca concatenado.
// `consultar(sql, params)` devuelve filas; en producción usa Prisma, en las pruebas un Postgres en memoria.
const TZ = 'America/Guatemala';

const numero = (v) => Number(v ?? 0); // count(*) llega como BigInt

function crearEstadisticasRepository(consultar) {
  const filas = async (sql, params) => (await consultar(sql, params)) || [];

  return {
    // Propiedades del vendedor con sus totales (en el periodo y en toda su historia)
    async resumenPorPropiedad(vendedorId, desde) {
      const rows = await filas(
        `SELECT p.id, p.titulo, p.estado,
           (SELECT count(*) FROM vista_propiedad v WHERE v.propiedad_id = p.id AND v.fecha_vista >= $2::timestamptz) AS vistas,
           (SELECT count(*) FROM vista_propiedad v WHERE v.propiedad_id = p.id) AS vistas_total,
           (SELECT count(*) FROM favorito f WHERE f.propiedad_id = p.id AND f.fecha_agregado >= $2::timestamptz) AS favoritos,
           (SELECT count(*) FROM favorito f WHERE f.propiedad_id = p.id) AS favoritos_total,
           (SELECT count(*) FROM mensaje m JOIN conversacion c ON c.id = m.conversacion_id
              WHERE c.propiedad_id = p.id AND m.remitente_id <> p.vendedor_id AND m.fecha_envio >= $2::timestamptz) AS mensajes,
           (SELECT count(*) FROM mensaje m JOIN conversacion c ON c.id = m.conversacion_id
              WHERE c.propiedad_id = p.id AND m.remitente_id <> p.vendedor_id) AS mensajes_total,
           (SELECT count(*) FROM mensaje m JOIN conversacion c ON c.id = m.conversacion_id
              WHERE c.propiedad_id = p.id AND m.remitente_id <> p.vendedor_id AND m.leido_en IS NULL) AS mensajes_sin_leer,
           (SELECT count(*) FROM visita vi WHERE vi.propiedad_id = p.id AND vi.fecha_creacion >= $2::timestamptz) AS visitas_solicitadas,
           (SELECT count(*) FROM visita vi WHERE vi.propiedad_id = p.id AND vi.estado = 'solicitada') AS visitas_pendientes
         FROM propiedad p
         WHERE p.vendedor_id = $1 AND p.estado <> 'no_disponible'
         ORDER BY p.id DESC`,
        [vendedorId, desde],
      );
      return rows.map((r) => ({
        id: numero(r.id), titulo: r.titulo, estado: r.estado,
        vistas: numero(r.vistas), vistas_total: numero(r.vistas_total),
        favoritos: numero(r.favoritos), favoritos_total: numero(r.favoritos_total),
        mensajes: numero(r.mensajes), mensajes_total: numero(r.mensajes_total),
        mensajes_sin_leer: numero(r.mensajes_sin_leer),
        visitas_solicitadas: numero(r.visitas_solicitadas), visitas_pendientes: numero(r.visitas_pendientes),
      }));
    },

    // Actividad por día y por propiedad (solo los días con actividad; el frontend rellena los ceros)
    async serieDiaria(vendedorId, desde) {
      const rows = await filas(
        `SELECT to_char(fecha, 'YYYY-MM-DD') AS fecha, propiedad_id,
                sum(vistas)::int AS vistas, sum(favoritos)::int AS favoritos, sum(mensajes)::int AS mensajes
         FROM (
           SELECT (v.fecha_vista AT TIME ZONE '${TZ}')::date AS fecha, v.propiedad_id, 1 AS vistas, 0 AS favoritos, 0 AS mensajes
             FROM vista_propiedad v JOIN propiedad p ON p.id = v.propiedad_id
            WHERE p.vendedor_id = $1 AND v.fecha_vista >= $2::timestamptz
           UNION ALL
           SELECT (f.fecha_agregado AT TIME ZONE '${TZ}')::date, f.propiedad_id, 0, 1, 0
             FROM favorito f JOIN propiedad p ON p.id = f.propiedad_id
            WHERE p.vendedor_id = $1 AND f.fecha_agregado >= $2::timestamptz
           UNION ALL
           SELECT (m.fecha_envio AT TIME ZONE '${TZ}')::date, c.propiedad_id, 0, 0, 1
             FROM mensaje m JOIN conversacion c ON c.id = m.conversacion_id JOIN propiedad p ON p.id = c.propiedad_id
            WHERE p.vendedor_id = $1 AND m.remitente_id <> p.vendedor_id AND m.fecha_envio >= $2::timestamptz
         ) t
         GROUP BY fecha, propiedad_id
         ORDER BY fecha, propiedad_id`,
        [vendedorId, desde],
      );
      return rows.map((r) => ({
        fecha: r.fecha, propiedad_id: numero(r.propiedad_id),
        vistas: numero(r.vistas), favoritos: numero(r.favoritos), mensajes: numero(r.mensajes),
      }));
    },

    async contarFranjasActivas(vendedorId) {
      const [r] = await filas('SELECT count(*) AS n FROM disponibilidad_vendedor WHERE vendedor_id = $1 AND activa', [vendedorId]);
      return numero(r?.n);
    },

    // Fotos por propiedad. Si la tabla tuviera otro nombre de columna, el panel sigue funcionando sin esta sugerencia.
    async contarFotos(propiedadIds) {
      if (!propiedadIds.length) return new Map();
      try {
        const rows = await filas(
          'SELECT propiedad_id, count(*) AS n FROM foto_propiedad WHERE propiedad_id = ANY($1::int[]) GROUP BY propiedad_id',
          [propiedadIds],
        );
        return new Map(rows.map((r) => [numero(r.propiedad_id), numero(r.n)]));
      } catch (e) {
        console.warn('[estadísticas] no se pudieron contar las fotos:', e.message);
        return null;
      }
    },

    // Registra una vista de la ficha. Solo cuenta propiedades publicadas, ignora al dueño
    // y no repite la vista del mismo usuario en 30 minutos.
    async registrarVista(propiedadId, usuarioId) {
      const rows = await filas(
        `INSERT INTO vista_propiedad (propiedad_id, usuario_id, origen)
         SELECT p.id, $2::int, 'ficha'
           FROM propiedad p
          WHERE p.id = $1::int AND p.estado = 'publicado'
            AND ($2::int IS NULL OR p.vendedor_id <> $2::int)
            AND ($2::int IS NULL OR NOT EXISTS (
                  SELECT 1 FROM vista_propiedad v
                   WHERE v.propiedad_id = p.id AND v.usuario_id = $2::int AND v.fecha_vista > now() - interval '30 minutes'))
         RETURNING id`,
        [propiedadId, usuarioId ?? null],
      );
      return rows.length > 0;
    },
  };
}

// Instancia real (Prisma), creada al primer uso para que las pruebas no la carguen.
let instancia;
function real() {
  if (!instancia) {
    const prisma = require('../config/db');
    instancia = crearEstadisticasRepository((sql, params) => prisma.$queryRawUnsafe(sql, ...params));
  }
  return instancia;
}
const delegadas = {};
['resumenPorPropiedad', 'serieDiaria', 'contarFranjasActivas', 'contarFotos', 'registrarVista']
  .forEach((n) => { delegadas[n] = (...args) => real()[n](...args); });

module.exports = { crearEstadisticasRepository, ...delegadas };