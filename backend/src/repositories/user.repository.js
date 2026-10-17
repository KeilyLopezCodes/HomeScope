const IUserRepository = require('../interfaces/IUser.repository');
const prisma = require('../config/db');

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
    
    async findAuthById(id) {
        return await prisma.usuario.findUnique({ 
            where: { id: Number(id) } });
    }

    async create(userData){
        return await prisma.usuario.create({
            data: userData
        });
    }
    // Los roles son acumulativos: basta con que uno de los roles del usuario tenga el permiso
    async hasPermission(id, codigoPermiso) {
        const permiso = await prisma.rol_permiso.findFirst({
            where: {
                permiso: { codigo: codigoPermiso },
                rol: { usuario_rol: { some: { usuario_id: Number(id) } } }
            },
            select: { permiso_id: true }
        });
        return !!permiso;
    }
    async update(id, data) {
    return await prisma.usuario.update({
      where: { id: Number(id) },
      data
    });
  }
}

module.exports = new userRepositoryPrisma();