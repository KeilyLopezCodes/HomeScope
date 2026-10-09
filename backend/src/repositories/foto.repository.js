const IFotoRepository = require('../interfaces/IFoto.repository');
const prisma = require('../config/db');

class FotoRepositoryPrisma extends IFotoRepository {
  async create (data) {
    return await prisma.foto_propiedad.create({ data });
  }

  async findByPropertyId(propiedadId) {
    return await prisma.foto_propiedad.findMany({
      where: { propiedad_id: Number(propiedadId) },
      orderBy: {orden: 'asc'},
    });
  }

  async delete (id) {
    return await prisma.foto_propiedad.delete({ where: { id: Number(id) } });
  }

  async deleteByPropertyId(propiedadId) {
    return await prisma.foto_propiedad.deleteMany({ where: { propiedad_id: Number(propiedadId) } });
  }

  async quitarPortadas(propiedadId) {
    return await prisma.foto_propiedad.updateMany({
      where: { propiedad_id: Number(propiedadId) },
      data: {es_portada: false},
    });
  }

  async reordenar(ids, portadaId) {
    return await prisma.$transacción(
      ids.map((id, index) =>
        prisma.foto_propiedad.update({
          where: { id: Number(id) },
          data: { orden: index, es_portada: Number(id) === Number(portadaId) },
        })
      )
    );
  }
}

module.exports = new FotoRepositoryPrisma();