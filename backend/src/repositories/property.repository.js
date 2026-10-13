const IPropertyRepository = require('../interfaces/IProperty.repository');
const prisma = require('../config/db');

class PropertyRepositoryPrisma extends IPropertyRepository {
  async create(data) {
    return await prisma.propiedad.create({ data });
  }

  async findManyWithPagination({ estado, skip, limit }) {
    return await prisma.propiedad.findMany({
      where: { estado },
      skip,
      take: limit,
      include: {
        usuario: { select: { id: true, nombre: true, apellido: true, correo: true, telefono: true } },
        tipo_propiedad: true,
        foto_propiedad: true
      },
      orderBy: { fecha_creacion: 'desc' }
    });
  }

  async countByEstado(estado) {
    return await prisma.propiedad.count({ where: { estado } });
  }

  async findByVendorId(userId) {
    return await prisma.propiedad.findMany({
      where: { vendedor_id: Number(userId) },
      include: {
        tipo_propiedad: true,
        foto_propiedad: { orderBy: { orden: 'asc'}},
      },
      orderBy: { fecha_creacion: 'desc' }
    });
  }

  async findById(id) {
    return await prisma.propiedad.findUnique({
      where: { id: Number(id) },
      include: {
        usuario: { select: { id: true, nombre: true, apellido: true, correo: true, telefono: true } },
        tipo_propiedad: true,
        foto_propiedad: { orderBy: { orden: 'asc'}},
        historial_precio: true,
        indice_conveniencia: true
      }
    });
  }

  async update(id, data) {
    return await prisma.propiedad.update({
      where: { id: Number(id) },
      data
    });
  }
}

module.exports = new PropertyRepositoryPrisma();