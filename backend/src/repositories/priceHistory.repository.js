const IPriceHistoryRepository = require('../interfaces/IPriceHistory.repository');
const prisma = require('../config/db');

class PriceHistoryRepositoryPrisma extends IPriceHistoryRepository {
    async createHistoryRecord({ propiedadId, precioAnterior, precioNuevo, cambiadoPor}) {
        return await prisma.historial_precio.create({
            data: {
                propiedad_id: Number(propiedadId),
                precio_anterior: precioAnterior,
                precio_nuevo: precioNuevo,
                cambiado_por: Number(cambiadoPor) 
            }
        });
    }
    
    async findByPropertyId(propiedadId) {
        return await prisma.historial_precio.findMany({
            where: { propiedad_id: Number(propiedadId)},
            include: {
                usuario: {
                    select: { id: true, nombre: true, correo: true}
                }
            },
            orderBy: {fecha_cambio: 'desc'}
        });
    } 
}

module.exports = new PriceHistoryRepositoryPrisma();