const IReviewRepository = require('../interfaces/IReview.repository');
const prisma = require('../config/db');

// Una visita cuenta como contacto previo mientras no haya sido cancelada o rechazada
// (agendada, confirmada o realizada)
const ESTADOS_VISITA_SIN_CONTACTO = ['cancelada', 'rechazada'];

const INCLUDE_RESENA = {
  propiedad: { select: { id: true, titulo: true } },
  usuario_resena_comprador_idTousuario: { select: { id: true, nombre: true, apellido: true, foto_url: true } }
};

class ReviewRepositoryPrisma extends IReviewRepository {
  async findPropertyForReview(propiedadId) {
    return await prisma.propiedad.findUnique({
      where: { id: Number(propiedadId) },
      select: { id: true, vendedor_id: true, estado: true }
    });
  }

  // Contacto previo = una visita vigente o una conversación con al menos un mensaje
  async findPriorContact(compradorId, propiedadId) {
    const [visita, conversacion] = await Promise.all([
      prisma.visita.findFirst({
        where: {
          comprador_id: Number(compradorId),
          propiedad_id: Number(propiedadId),
          estado: { notIn: ESTADOS_VISITA_SIN_CONTACTO }
        },
        select: { id: true }
      }),
      prisma.conversacion.findFirst({
        where: {
          comprador_id: Number(compradorId),
          propiedad_id: Number(propiedadId),
          mensaje: { some: {} }
        },
        select: { id: true }
      })
    ]);
    return { visita: !!visita, conversacion: !!conversacion };
  }

  async findByBuyerAndProperty(compradorId, propiedadId) {
    return await prisma.resena.findFirst({
      where: { comprador_id: Number(compradorId), propiedad_id: Number(propiedadId) },
      select: { id: true }
    });
  }

  async create(data) {
    return await prisma.resena.create({ data, include: INCLUDE_RESENA });
  }

  async findSellerById(vendedorId) {
    return await prisma.usuario.findUnique({
      where: { id: Number(vendedorId) },
      select: { id: true, nombre: true, apellido: true, foto_url: true, fecha_registro: true }
    });
  }

  // Promedio, total y cuántas reseñas hay de cada estrella (1 a 5)
  async getSellerSummary(vendedorId) {
    const where = { vendedor_id: Number(vendedorId) };
    const [agregado, porEstrella] = await Promise.all([
      prisma.resena.aggregate({ where, _avg: { calificacion: true }, _count: { _all: true } }),
      prisma.resena.groupBy({ by: ['calificacion'], where, _count: { _all: true } })
    ]);
    return {
      promedio: agregado._avg.calificacion,
      total: agregado._count._all,
      porEstrella: porEstrella.map((g) => ({ calificacion: g.calificacion, total: g._count._all }))
    };
  }

  async findBySellerWithPagination({ vendedorId, skip, limit }) {
    const where = { vendedor_id: Number(vendedorId) };
    const [resenas, total] = await Promise.all([
      prisma.resena.findMany({
        where,
        skip,
        take: limit,
        include: INCLUDE_RESENA,
        orderBy: [{ fecha_creacion: 'desc' }, { id: 'desc' }]
      }),
      prisma.resena.count({ where })
    ]);
    return { resenas, total };
  }
}

module.exports = new ReviewRepositoryPrisma();
module.exports.ESTADOS_VISITA_SIN_CONTACTO = ESTADOS_VISITA_SIN_CONTACTO;
