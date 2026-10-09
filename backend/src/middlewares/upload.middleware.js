const multer = require('multer');
const { MAX_FOTOS, MAX_BYTES } = require('../config/cloudinary');

const upload = multer({
storage: multer.memoryStorage(),
limits: { fileSize: MAX_BYTES },
});

const subirFotosMiddleware = (req, res, next) => {
  upload.array('fotos', MAX_FOTOS)(req, res, (err) => {
    if (!err) return next();
    const mensajes = {
      LIMIT_FILE_SIZE: 'Una de las fotos supera los 5 MB',
      LIMIT_UNEXPECTED_FILE: `Máximo ${MAX_FOTOS} fotos por vez`,
    };
    res.status(400).json({ success: false, mesagge: mensajes[err.code] || err.message });
  });
};

module.exports = { subirFotosMiddleware };