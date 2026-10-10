class IImageStorage {
    async subir(buffer, carpeta) { throw new Error('Método subir() debe ser implementado');}
    async eliminar(publicIds) { throw new Error('Método eliminar() debe ser implementado');}
}

module.exports = IImageStorage;