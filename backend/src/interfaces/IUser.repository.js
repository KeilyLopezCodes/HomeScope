class IUserRepository {
    async findByEmail(correo){
        throw new Error('Metodo findByEmail() debe ser implementado');        
    }
    async findById(id){
        throw new Error('Metodo findById() debe ser implementado');
    }
    async create(userData){
        throw new Error('Metodo create() debe ser implementado');
    }
    async update(id, data){
        throw new Error('Metodo update() debe ser implementado');
    }
}

module.exports = IUserRepository;