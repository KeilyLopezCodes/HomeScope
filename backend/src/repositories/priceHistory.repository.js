const IPriceHistoryRepository = require('../interfaces/IPriceHistory.repository');
const prisma = require('../config/db');

// El historial es de solo inserción: no se exponen métodos de update/delete
// (la BD también lo bloquea con el trigger trg_historial_precio_inmutable)
class PriceHistoryRepositoryPrisma extends IPriceHistoryRepository {
    async createHistoryRecord({ propiedadId, precioAnterior, precioNuevo, cambiadoPor}, tx = prisma) {
        return await tx.historial_precio.create({
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
                    select: { id: true, nombre: true }
                }
            },
            orderBy: [{ fecha_cambio: 'asc' }, { id: 'asc' }]
        });
    } 
}

module.exports = new PriceHistoryRepositoryPrisma();