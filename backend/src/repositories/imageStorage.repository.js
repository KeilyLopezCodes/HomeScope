const IImageStorage = require('../interfaces/IImageStorage');

const { cloudinary } = require('../config/cloudinary');

class ImageStorageCloudinary extends IImageStorage {
    subir(buffer, carpeta) {
        return new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
                { folder: carpeta, resource_type: 'image', transformation: [{ width: 1600, crop: 'limit' }] },
                (error, result) => (error ? reject(error) : resolve(result))
            );
            stream.end(buffer);
        });
    }

    async eliminar(publicIds) {
        if (!publicIds.length) return;
        await cloudinary.api.delete_resources(publicIds);
        }
    }

module.exports = new ImageStorageCloudinary();