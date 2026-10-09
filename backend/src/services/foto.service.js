const fotoRepository = require('../repositories/foto.repository');
const propertyRepository = require('../repositories/property.repository');
const imageStorage = require('../repositories/imageStorage.repository');
const { MAX_FOTOS } = require('../config/cloudinary');

const esImagenValida = (buf) => {
  if (!buf || buf.length < 12) return false;
  const jpeg = buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
  const png = buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  const webp = buf.subarray(0, 4).toString('ascii') === 'RIFF' && buf.subarray(8, 12).toString('ascii') === 'WEBP';
  return jpeg || png || webp;
};

const validarDueno = async (propiedadId, userId) => {
  const propiedad = await propertyRepository.findById(propiedadId);
  if (!propiedad) throw new Error('Propiedad no encontrada');
  if (propiedad.vendedor_id !== userId) throw new Error('No tienes permisos sobre esta propiedad');
};

const subirFotos = async (propiedadId, userId, files, portadaIndex) => {
  await validarDueno(propiedadId, userId);
  if (!files || files.length === 0) throw new Error('No se recibió ninguna imagen');

  const actuales = await fotoRepository.findByPropertyId(propiedadId);
  if (actuales.length + files.length > MAX_FOTOS) {
    throw new Error(`Máximo ${MAX_FOTOS} fotos por propiedad (ya tiene ${actuales.length})`);
  }

  for (const file of files) {
    if (!esImagenValida(file.buffer)) {
      throw new Error(`"${file.originalname}" no es una imagen jpg, png o webp válida`);
    }
  }

  const hayPortada = actuales.some((f) => f.es_portada);
  const indicePortada =
    Number.isInteger(portadaIndex) && portadaIndex >= 0 && portadaIndex < files.length
      ? portadaIndex
      : hayPortada ? -1 : 0;

  const resultados = await Promise.allSettled(
    files.map((f) => imageStorage.subir(f.buffer, `homescope/propiedades/${propiedadId}`))
  );

  if (resultados.some((r) => r.status === 'rejected')) {
    await imageStorage.eliminar(resultados.filter((r) => r.status === 'fulfilled').map((r) => r.value.public_id));
    throw new Error('No se pudieron subir las imágenes, intenta de nuevo');
  }

  if (indicePortada >= 0 && hayPortada) await fotoRepository.quitarPortadas(propiedadId);

  return await Promise.all(
    resultados.map((r, i) =>
      fotoRepository.create({
        propiedad_id: Number(propiedadId),
        url: r.value.secure_url,
        public_id: r.value.public_id,
        orden: actuales.length + i,
        es_portada: i === indicePortada,
        tamano_bytes: r.value.bytes,
      })
    )
  );
};

const reordenarFotos = async (propiedadId, userId, ids, portadaId) => {
  await validarDueno(propiedadId, userId);
  const actuales = await fotoRepository.findByPropertyId(propiedadId);
  const porNumero = (a, b) => a - b;
  const idsActuales = actuales.map((f) => f.id).sort(porNumero);
  const idsRecibidos = (ids || []).map(Number).sort(porNumero);

  if (JSON.stringify(idsActuales) !== JSON.stringify(idsRecibidos)) {
    throw new Error('La lista de fotos no coincide con las de la propiedad');
  }
  if (!idsRecibidos.includes(Number(portadaId))) {
    throw new Error('La portada debe ser una de las fotos de la propiedad');
  }

  await fotoRepository.reordenar(ids, portadaId);
  return await fotoRepository.findByPropertyId(propiedadId);
};

const eliminarFoto = async (propiedadId, fotoId, userId) => {
  await validarDueno(propiedadId, userId);
  const fotos = await fotoRepository.findByPropertyId(propiedadId);
  const foto = fotos.find((f) => f.id === Number(fotoId));
  if (!foto) throw new Error('Foto no encontrada');

  await imageStorage.eliminar([foto.public_id]);
  await fotoRepository.delete(foto.id);

  const resto = fotos.filter((f) => f.id !== foto.id);
  if (foto.es_portada && resto.length) {
    await fotoRepository.reordenar(resto.map((f) => f.id), resto[0].id);
  }
};

const eliminarFotosDePropiedad = async (propiedadId) => {
  const fotos = await fotoRepository.findByPropertyId(propiedadId);
  await imageStorage.eliminar(fotos.map((f) => f.public_id));
  await fotoRepository.deleteByPropertyId(propiedadId);
};

module.exports = { subirFotos, reordenarFotos, eliminarFoto, eliminarFotosDePropiedad };