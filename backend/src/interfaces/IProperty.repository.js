class IPropertyRepository{
    async findById(id){
        throw new Error('Metodo findbyId() debe ser implememntado');
    }
    async update(id, data){
        throw new Error('Metodo update() debe ser implementado');
    }
}

module.exports = IPropertyRepository;