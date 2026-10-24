'use strict';

const MAX_LOTE = 100;

function errorHttp(status, message) {
  const e = new Error(message);
  e.status = status;
  return e;
}

function validarId(valor, etiqueta = 'propiedad_id') {
  const n = Number(valor);
  if (!Number.isInteger(n) || n <= 0 || n > 2147483647) throw errorHttp(400, `${etiqueta} inválido`);
  return n;
}

// `consultar(sql, params)` devuelve filas (Prisma en producción, Postgres en memoria en las pruebas)
function crearFavoritoService({ consultar }) {
  async function listar(usuarioId) {
    const rows = await consultar(
      `SELECT f.propiedad_id
         FROM favorito f JOIN propiedad p ON p.id = f.propiedad_id
        WHERE f.usuario_id = $1 AND p.estado = 'publicado'
        ORDER BY f.fecha_agregado DESC`,
      [usuarioId],
    );
    return rows.map((r) => Number(r.propiedad_id));
  }

  async function agregar(usuarioId, propiedadIdEntrada) {
    const propiedadId = validarId(propiedadIdEntrada);
    const [p] = await consultar('SELECT id, vendedor_id FROM propiedad WHERE id = $1 AND estado = \'publicado\'', [propiedadId]);
    if (!p) throw errorHttp(404, 'Propiedad no encontrada');
    if (Number(p.vendedor_id) === usuarioId) throw errorHttp(403, 'No puedes agregar tu propia propiedad a favoritos');
    await consultar(
      'INSERT INTO favorito (usuario_id, propiedad_id) VALUES ($1, $2) ON CONFLICT DO NOTHING RETURNING propiedad_id',
      [usuarioId, propiedadId],
    );
    return { favorito: true };
  }

  async function quitar(usuarioId, propiedadIdEntrada) {
    const propiedadId = validarId(propiedadIdEntrada);
    await consultar('DELETE FROM favorito WHERE usuario_id = $1 AND propiedad_id = $2 RETURNING propiedad_id', [usuarioId, propiedadId]);
    return { favorito: false };
  }

  // Sube de golpe los favoritos que el usuario guardó sin sesión. Ignora los que no existen, no están publicados o son suyos.
  async function agregarLote(usuarioId, ids) {
    if (!Array.isArray(ids)) throw errorHttp(400, 'ids debe ser una lista');
    if (ids.length > MAX_LOTE) throw errorHttp(400, `Máximo ${MAX_LOTE} favoritos por envío`);
    const limpios = [...new Set(ids.map(Number).filter((n) => Number.isInteger(n) && n > 0 && n <= 2147483647))];
    if (limpios.length) {
      await consultar(
        `INSERT INTO favorito (usuario_id, propiedad_id)
         SELECT $1::int, p.id FROM propiedad p
          WHERE p.id = ANY($2::int[]) AND p.estado = 'publicado' AND p.vendedor_id <> $1::int
         ON CONFLICT DO NOTHING
         RETURNING propiedad_id`,
        [usuarioId, limpios],
      );
    }
    return listar(usuarioId);
  }

  return { listar, agregar, quitar, agregarLote };
}

let instancia;
function real() {
  if (!instancia) {
    const prisma = require('../config/db');
    instancia = crearFavoritoService({ consultar: (sql, params) => prisma.$queryRawUnsafe(sql, ...params) });
  }
  return instancia;
}

module.exports = {
  crearFavoritoService,
  listar: (...a) => real().listar(...a),
  agregar: (...a) => real().agregar(...a),
  quitar: (...a) => real().quitar(...a),
  agregarLote: (...a) => real().agregarLote(...a),
};