const prisma = require('../config/db');

class PropertyRepository {
    async findById(id) {
        return await prisma.propiedad.findUnique({
            where: {id: Number(id)}
        });
    }

    async update(id, data){
        return await prisma.propiedad.update({
            where: {id: Number(id)},
            data
        });
    }
}

module.exports = new PropertyRepository();