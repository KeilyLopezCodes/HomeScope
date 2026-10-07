import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { publicarPropiedad } from '../api/propertyApi';
import { guardarBorradorLocal, obtenerBorradorLocal, limpiarBorradorLocal } from '../utils/draftStorage';
import { GUATEMALA_UBICACIONES } from '/data/guatemalaData';

export default function FormularioPublicacion() {
  const [paso, setPaso] = useState(1);
  const [mensajeExito, setMensajeExito] = useState('');
  const [mensajeError, setMensajeError] = useState('');

  const {
    register,
    handleSubmit,
    trigger,
    getValues,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting }
  } = useForm({
    defaultValues: {
      titulo: '',
      descripcion: '',
      modalidad: 'VENTA',
      moneda: 'GTQ',
      precio: '',
      tipo_propiedad_id: '1', // 1: Casa, 2: Apartamento, 3: Terreno
      habitaciones: '',
      banos: '',
      parqueos: '',
      area_m2: '',
      direccion: '',
      zona: '1',
      departamento: 'Guatemala',
      municipio: 'Ciudad de Guatemala',
      latitud: 0,
      longitud: 0,
      fotos: []
    }
  });

  const tipoPropiedad = watch('tipo_propiedad_id');
  const departamentoSeleccionado = watch('departamento');
  const fotosSeleccionadas = watch('fotos') || [];

  // Cuando cambia el departamento, ajusta automáticamente el municipio por defecto
  useEffect(() => {
    if (departamentoSeleccionado && GUATEMALA_UBICACIONES[departamentoSeleccionado]) {
      const municipios = GUATEMALA_UBICACIONES[departamentoSeleccionado];
      if (!municipios.includes(getValues('municipio'))) {
        setValue('municipio', municipios[0]);
      }
    }
  }, [departamentoSeleccionado, setValue, getValues]);

  useEffect(() => {
    const borrador = obtenerBorradorLocal();
    if (borrador) {
      reset({ ...borrador, fotos: [] });
    }
  }, [reset]);

  const esTerreno = String(tipoPropiedad) === '3';

  const handleGuardarBorrador = () => {
    if (guardarBorradorLocal(getValues())) {
      setMensajeExito('Borrador guardado localmente.');
      setTimeout(() => setMensajeExito(''), 3000);
    }
  };

  const manejarSeleccionFotos = (e) => {
    const archivos = Array.from(e.target.files);
    if (!archivos.length) return;

    const nuevasFotos = archivos.map((archivo) => ({
      file: archivo,
      previewUrl: URL.createObjectURL(archivo),
      nombre: archivo.name
    }));

    setValue('fotos', [...fotosSeleccionadas, ...nuevasFotos]);
  };

  const eliminarFoto = (index) => {
    const filtradas = fotosSeleccionadas.filter((_, i) => i !== index);
    setValue('fotos', filtradas);
  };

  const avanzarPaso = async (e) => {
    if (e) e.preventDefault();

    let campos = [];
    if (paso === 1) campos = ['titulo', 'descripcion', 'precio', 'modalidad', 'area_m2'];
    if (paso === 3) campos = ['direccion', 'zona', 'departamento', 'municipio'];

    const esValido = await trigger(campos);
    if (esValido && paso < 4) {
      setPaso((prev) => prev + 1);
    }
  };

  const retrocederPaso = (e) => {
    if (e) e.preventDefault();
    if (paso > 1) setPaso((prev) => prev - 1);
  };

  const onSubmit = async (data) => {
    if (paso !== 4) return;

    setMensajeError('');
    setMensajeExito('');

    try {
      const payload = {
        titulo: data.titulo,
        descripcion: data.descripcion,
        precio: Number(data.precio),
        moneda: data.moneda,
        modalidad: data.modalidad,
        tipo_propiedad_id: Number(data.tipo_propiedad_id),
        habitaciones: esTerreno ? 0 : Number(data.habitaciones || 0),
        banos: esTerreno ? 0 : Number(data.banos || 0),
        parqueos: esTerreno ? 0 : Number(data.parqueos || 0),
        area_m2: Number(data.area_m2 || 0),
        direccion: data.direccion,
        zona: data.zona,
        municipio: data.municipio,
        departamento: data.departamento,
        latitud: data.latitud,
        longitud: data.longitud
      };

      await publicarPropiedad(payload);
      limpiarBorradorLocal();
      setMensajeExito('¡Propiedad publicada con éxito!');
      reset();
      setPaso(1);
    } catch (error) {
      setMensajeError(error.message || 'Error al guardar en el servidor.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto my-8 p-6 md:p-8 bg-white border border-gray-100 rounded-xl shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-[#222A33] text-center">Publicar Nueva Propiedad</h2>

      {mensajeExito && (
        <div className="mb-4 p-3 bg-emerald-50 border border-[#2E9E6B] text-[#2E9E6B] rounded-lg text-sm font-medium">
          {mensajeExito}
        </div>
      )}
      {mensajeError && (
        <div className="mb-4 p-3 bg-rose-50 border border-rose-300 text-rose-700 rounded-lg text-sm font-medium">
          {mensajeError}
        </div>
      )}

      {/* Indicadores de Pasos */}
      <div className="flex justify-between items-center mb-8 border-b pb-4">
        {['1. Datos generales', '2. Fotografías', '3. Ubicación', '4. Confirmación'].map((nombre, idx) => {
          const numPaso = idx + 1;
          const estaActivo = paso === numPaso;
          const estaCompletado = paso > numPaso;

          return (
            <div key={idx} className="flex items-center space-x-2">
              <span
                className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-semibold transition-colors ${
                  estaActivo
                    ? 'bg-[#1E4273] text-white'
                    : estaCompletado
                    ? 'bg-[#2E9E6B] text-white'
                    : 'bg-gray-100 text-gray-500'
                }`}
              >
                {numPaso}
              </span>
              <span className={`hidden md:inline text-sm font-medium ${estaActivo ? 'text-[#1E4273]' : 'text-gray-500'}`}>
                {nombre}
              </span>
            </div>
          );
        })}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} onKeyDown={(e) => { if (e.key === 'Enter' && paso < 4) e.preventDefault(); }}>
        {/* PASO 1: DATOS GENERALES */}
        {paso === 1 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#222A33]">Título de la publicación </label>
              <input
                {...register('titulo', { required: 'El título es obligatorio' })}
                className="mt-1 w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-[#1E4273] focus:outline-none"
                placeholder="Ej. Terreno plano comercial sobre carretera principal"
              />
              {errors.titulo && <p className="text-rose-600 text-xs mt-1">{errors.titulo.message}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#222A33]">Modalidad </label>
                <select {...register('modalidad')} className="mt-1 w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-[#1E4273] focus:outline-none bg-white">
                  <option value="VENTA">Venta</option>
                  <option value="ALQUILER">Alquiler</option>
                  <option value="OPCION_COMPRA">Alquiler con opción a compra</option>
                  <option value="CESION_DERECHOS">Cesión de derechos</option>
                  <option value="SUBARRIENDO">Subarriendo</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#222A33]">Tipo de propiedad </label>
                <select {...register('tipo_propiedad_id')} className="mt-1 w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-[#1E4273] focus:outline-none bg-white">
                  <option value="1">Casa</option>
                  <option value="2">Apartamento</option>
                  <option value="3">Terreno / Lote</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#222A33]">Moneda </label>
                <select {...register('moneda')} className="mt-1 w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-[#1E4273] focus:outline-none bg-white">
                  <option value="GTQ">GTQ (Q)</option>
                  <option value="USD">USD ($)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#222A33]">Precio </label>
                <input
                  type="number"
                  {...register('precio', { required: 'El precio es obligatorio' })}
                  className="mt-1 w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-[#1E4273] focus:outline-none"
                  placeholder="Ej. 250000"
                />
                {errors.precio && <p className="text-rose-600 text-xs mt-1">{errors.precio.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-[#222A33]">Área (m²) </label>
                <input
                  type="number"
                  step="0.01"
                  {...register('area_m2', { required: 'El área en m² es obligatoria' })}
                  className="mt-1 w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-[#1E4273] focus:outline-none"
                  placeholder="Ej. 200"
                />
                {errors.area_m2 && <p className="text-rose-600 text-xs mt-1">{errors.area_m2.message}</p>}
              </div>
            </div>

            {/* SI ES TERRENO, NO MUESTRA ESTOS CAMPOS */}
            {!esTerreno && (
              <div className="grid grid-cols-3 gap-4 border-t pt-3 mt-2">
                <div>
                  <label className="block text-sm font-medium text-[#222A33]">Habitaciones</label>
                  <input type="number" {...register('habitaciones')} className="mt-1 w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-[#1E4273] focus:outline-none" placeholder="3" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#222A33]">Baños</label>
                  <input type="number" step="0.5" {...register('banos')} className="mt-1 w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-[#1E4273] focus:outline-none" placeholder="2" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#222A33]">Parqueos</label>
                  <input type="number" {...register('parqueos')} className="mt-1 w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-[#1E4273] focus:outline-none" placeholder="2" />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-[#222A33]">Descripción detallada </label>
              <textarea
                {...register('descripcion', { required: 'La descripción es obligatoria' })}
                rows="4"
                className="mt-1 w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-[#1E4273] focus:outline-none"
                placeholder="Describe el acceso, servicios disponibles y características..."
              />
              {errors.descripcion && <p className="text-rose-600 text-xs mt-1">{errors.descripcion.message}</p>}
            </div>
          </div>
        )}

        {/* PASO 2: FOTOGRAFÍAS */}
        {paso === 2 && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-[#222A33]">Galería de Imágenes</h3>
            <div className="border-2 border-dashed border-gray-300 p-8 text-center rounded-xl bg-gray-50">
              <p className="text-gray-600 mb-3 font-medium">Selecciona las fotografías de la propiedad</p>
              <input type="file" multiple accept="image/*" className="hidden" id="foto-input" onChange={manejarSeleccionFotos} />
              <label htmlFor="foto-input" className="cursor-pointer px-5 py-2.5 bg-[#1E4273] text-white text-sm font-medium rounded-lg hover:bg-[#163156] inline-block transition-colors">
                Examinar Archivos
              </label>
            </div>

            {fotosSeleccionadas.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
                {fotosSeleccionadas.map((item, idx) => (
                  <div key={idx} className="relative border rounded-lg overflow-hidden shadow-sm">
                    <img src={item.previewUrl} alt="Vista previa" className="w-full h-28 object-cover" />
                    <button type="button" onClick={() => eliminarFoto(idx)} className="absolute top-1 right-1 bg-rose-600 text-white text-xs w-6 h-6 rounded-full flex items-center justify-center shadow">
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* PASO 3: UBICACIÓN DE GUATEMALA */}
        {paso === 3 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#222A33]">Dirección completa </label>
              <input {...register('direccion', { required: 'La dirección es obligatoria' })} className="mt-1 w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-[#1E4273] focus:outline-none" placeholder="Ej. 12 Calle avenida 23" />
              {errors.direccion && <p className="text-rose-600 text-xs mt-1">{errors.direccion.message}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#222A33]">Zona / Sector </label>
                <input {...register('zona', { required: 'Obligatorio' })} className="mt-1 w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-[#1E4273] focus:outline-none" placeholder="Ej. 5" />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#222A33]">Departamento </label>
                <select {...register('departamento')} className="mt-1 w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-[#1E4273] focus:outline-none bg-white">
                  {Object.keys(GUATEMALA_UBICACIONES).map((depto) => (
                    <option key={depto} value={depto}>{depto}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#222A33]">Municipio </label>
                <select {...register('municipio')} className="mt-1 w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-[#1E4273] focus:outline-none bg-white">
                  {(GUATEMALA_UBICACIONES[departamentoSeleccionado] || []).map((muni) => (
                    <option key={muni} value={muni}>{muni}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* PASO 4: CONFIRMACIÓN */}
        {paso === 4 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-[#222A33]">Confirmar datos de la propiedad</h3>
            <div className="bg-gray-50 p-5 rounded-xl space-y-2.5 text-sm text-[#222A33] border border-gray-200">
              <p><strong>Título:</strong> {getValues('titulo')}</p>
              <p><strong>Modalidad / Precio:</strong> {getValues('modalidad')} - {getValues('moneda')} {getValues('precio')}</p>
              <p><strong>Ubicación:</strong> {getValues('direccion')}, Zona {getValues('zona')}, {getValues('municipio')}, {getValues('departamento')}</p>
              <p>
                <strong>Detalles:</strong>{' '}
                {esTerreno ? (
                  <span>Área: {getValues('area_m2')} m²</span>
                ) : (
                  <span>
                    {getValues('habitaciones') || 0} Hab | {getValues('banos') || 0} Baños | {getValues('parqueos') || 0} Parqueos | {getValues('area_m2')} m²
                  </span>
                )}
              </p>
            </div>
          </div>
        )}

        {/* BOTONES DE NAVEGACIÓN */}
        <div className="flex justify-between items-center mt-8 pt-4 border-t border-gray-100">
          <button type="button" onClick={handleGuardarBorrador} className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors">
            Guardar Borrador
          </button>

          <div className="flex space-x-3">
            {paso > 1 && (
              <button type="button" onClick={retrocederPaso} className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors">
                Anterior
              </button>
            )}

            {paso < 4 ? (
              <button type="button" onClick={avanzarPaso} className="px-5 py-2 bg-[#1E4273] text-white text-sm font-medium rounded-lg hover:bg-[#163156] transition-colors">
                Siguiente
              </button>
            ) : (
              <button type="submit" disabled={isSubmitting} className="px-5 py-2 bg-[#2E9E6B] text-white text-sm font-semibold rounded-lg hover:bg-[#258258] disabled:bg-gray-300 transition-colors">
                {isSubmitting ? 'Publicando...' : 'Publicar Propiedad'}
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}