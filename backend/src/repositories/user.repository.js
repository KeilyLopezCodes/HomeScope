const IUserRepository = require('../interfaces/IUser.repository');
const prisma = require('../config/db');
const { findById } = require('./property.repository');

class userRepositoryPrisma extends IUserRepository {
    async findByEmail(correo){
        return await prisma.usuario.findUnique({
            where: {correo},
            include: {
                usuario_rol: {
                    include: {rol: true}
                }
            }
        });
    }
    async findById(id){
        return await prisma.usuario.findUnique({
            where: {id: Number(id)},
            select: {
                id: true,
                nombre: true,
                apellido: true,
                correo: true,
                telefono: true
            }
        });
    }
    async create(userData){
        return await prisma.usuario.create({
            data: userData
        });
    }
    async update(id, data) {
    return await prisma.usuario.update({
      where: { id: Number(id) },
      data
    });
  }
}

module.exports = new userRepositoryPrisma();