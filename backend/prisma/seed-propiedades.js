// Seed de propiedades para probar los endpoints del backend.
// Uso:   npm run seed:propiedades            -> inserta si no existen
//        npm run seed:propiedades -- --reset -> borra las propiedades de los vendedores de prueba y las vuelve a crear
require('dotenv').config();
const bcrypt = require('bcryptjs');
const prisma = require('../src/config/db');

const PASSWORD = 'Test1234!';
const RESET = process.argv.includes('--reset');

const DIA = 24 * 60 * 60 * 1000;
const haceDias = (n) => new Date(Date.now() - n * DIA);
const enDias = (n) => new Date(Date.now() + n * DIA);

// Roles definidos en scripts/SeedHomeScope.sql
const ROL_COMPRADOR = 1;
const ROL_VENDEDOR = 2;

const VENDEDORES = [
  { nombre: 'Carlos', apellido: 'Mendoza', correo: 'vendedor@homescope.test', telefono: '50230001234' },
  { nombre: 'María', apellido: 'Castillo', correo: 'vendedor2@homescope.test', telefono: '50240005678' },
];

// v: índice del vendedor en VENDEDORES
// publicado: días desde la publicación (null = nunca publicada)
const PROPIEDADES = [
  // ---------- publicado (10) ----------
  { v: 0, estado: 'publicado', publicado: 2, tipo: 1, modalidad: 'VENTA', precio: 350000, moneda: 'USD', habitaciones: 4, banos: 3.5, area_m2: 280, parqueos: 2,
    titulo: 'Casa moderna en Zona 10', descripcion: 'Casa de 3 niveles con jardín, piscina y terraza en zona residencial exclusiva.',
    direccion: '15 Avenida 10-50, Zona 10', zona: '10', municipio: 'Guatemala', departamento: 'Guatemala', latitud: 14.604999, longitud: -90.506882 },
  { v: 0, estado: 'publicado', publicado: 5, tipo: 2, modalidad: 'ALQUILER', precio: 1800, moneda: 'USD', habitaciones: 2, banos: 2, area_m2: 120, parqueos: 1,
    titulo: 'Apartamento amueblado en Zona 14', descripcion: 'Apartamento de lujo con vista panorámica, gimnasio, piscina y seguridad 24/7.',
    direccion: '7 Avenida 14-30, Zona 14', zona: '14', municipio: 'Guatemala', departamento: 'Guatemala', latitud: 14.589500, longitud: -90.512300 },
  { v: 1, estado: 'publicado', publicado: 10, tipo: 1, modalidad: 'VENTA', precio: 1450000, moneda: 'GTQ', habitaciones: 3, banos: 2, area_m2: 200, parqueos: 2,
    titulo: 'Casa familiar en Mixco con amplio jardín', descripcion: 'Casa de un nivel con jardín, cuarto de servicio y cocina integral, cerca de colegios.',
    direccion: 'Colonia El Naranjo, Mixco', zona: '4', municipio: 'Mixco', departamento: 'Guatemala', latitud: 14.630000, longitud: -90.606000 },
  { v: 1, estado: 'publicado', publicado: 15, tipo: 4, modalidad: 'ALQUILER', precio: 18000, moneda: 'GTQ', habitaciones: 0, banos: 1, area_m2: 90, parqueos: 0,
    titulo: 'Local comercial en el Centro Histórico', descripcion: 'Local sobre la Sexta Avenida, ideal para restaurante, cafetería o tienda.',
    direccion: '6a Avenida 10-20, Zona 1', zona: '1', municipio: 'Guatemala', departamento: 'Guatemala', latitud: 14.641500, longitud: -90.513200 },
  { v: 0, estado: 'publicado', publicado: 20, tipo: 3, modalidad: 'VENTA', precio: 95000, moneda: 'USD', habitaciones: 0, banos: 0, area_m2: 500, parqueos: 0,
    titulo: 'Terreno con vista al volcán en Antigua', descripcion: 'Terreno plano con vista al Volcán de Agua, ideal para construcción residencial.',
    direccion: 'Calle del Hermano Pedro, San Felipe de Jesús', zona: '1', municipio: 'Antigua Guatemala', departamento: 'Sacatepéquez', latitud: 14.575800, longitud: -90.735200 },
  { v: 1, estado: 'publicado', publicado: 1, tipo: 5, modalidad: 'ALQUILER', precio: 2400, moneda: 'USD', habitaciones: 0, banos: 2, area_m2: 150, parqueos: 3,
    titulo: 'Oficina corporativa en Zona 4', descripcion: 'Oficina en edificio con certificación LEED en Cuatro Grados Norte, sala de reuniones incluida.',
    direccion: 'Vía 5 4-50, Zona 4', zona: '4', municipio: 'Guatemala', departamento: 'Guatemala', latitud: 14.623500, longitud: -90.516400 },
  { v: 0, estado: 'publicado', publicado: 30, tipo: 2, modalidad: 'VENTA', precio: 980000, moneda: 'GTQ', habitaciones: 2, banos: 1.5, area_m2: 85, parqueos: 1,
    titulo: 'Apartamento en Zona 15 cerca de Vista Hermosa', descripcion: 'Apartamento con balcón, área de BBQ y salón social. A pasos de centros comerciales.',
    direccion: '20 Calle 15-10, Zona 15', zona: '15', municipio: 'Guatemala', departamento: 'Guatemala', latitud: 14.597200, longitud: -90.489600 },
  { v: 1, estado: 'publicado', publicado: 7, tipo: 1, modalidad: 'ALQUILER', precio: 9500, moneda: 'GTQ', habitaciones: 3, banos: 2.5, area_m2: 180, parqueos: 2,
    titulo: 'Casa en condominio en Villa Nueva', descripcion: 'Casa en condominio cerrado con garita, áreas verdes y parque infantil.',
    direccion: 'Condominio Las Margaritas, Km 17 Carretera al Pacífico', zona: '4', municipio: 'Villa Nueva', departamento: 'Guatemala', latitud: 14.526900, longitud: -90.587500 },
  { v: 0, estado: 'publicado', publicado: 45, tipo: 1, modalidad: 'VENTA', precio: 520000, moneda: 'USD', habitaciones: 5, banos: 4, area_m2: 420, parqueos: 4,
    titulo: 'Casa de lujo en Carretera a El Salvador', descripcion: 'Residencia con 5 habitaciones, estudio, jardín amplio y vista al valle.',
    direccion: 'Km 14.5 Carretera a El Salvador', zona: '1', municipio: 'Santa Catarina Pinula', departamento: 'Guatemala', latitud: 14.556100, longitud: -90.464800 },
  { v: 1, estado: 'publicado', publicado: 3, tipo: 2, modalidad: 'ALQUILER', precio: 4500, moneda: 'GTQ', habitaciones: 1, banos: 1, area_m2: 55, parqueos: 1,
    titulo: 'Apartamento tipo estudio en Quetzaltenango', descripcion: 'Estudio cerca de universidades, ideal para estudiantes. Incluye agua y cable.',
    direccion: '14 Avenida 5-30, Zona 3', zona: '3', municipio: 'Quetzaltenango', departamento: 'Quetzaltenango', latitud: 14.840700, longitud: -91.518100 },

  // ---------- borrador (3): distintos pasos del formulario ----------
  { v: 0, estado: 'borrador', publicado: null, paso: 1, tipo: 1, modalidad: 'VENTA', precio: 210000, moneda: 'USD', habitaciones: 3, banos: 2, area_m2: 160, parqueos: 2,
    titulo: 'Casa en San Cristóbal (borrador)', descripcion: 'Borrador en paso 1 del formulario.',
    direccion: 'Sector B1, Ciudad San Cristóbal', zona: '8', municipio: 'Mixco', departamento: 'Guatemala', latitud: 14.611000, longitud: -90.580200 },
  { v: 0, estado: 'borrador', publicado: null, paso: 2, tipo: 2, modalidad: 'ALQUILER', precio: 6500, moneda: 'GTQ', habitaciones: 2, banos: 1, area_m2: 70, parqueos: 1,
    titulo: 'Apartamento en Zona 11 (borrador)', descripcion: 'Borrador en paso 2 del formulario.',
    direccion: 'Calzada Roosevelt 12-00, Zona 11', zona: '11', municipio: 'Guatemala', departamento: 'Guatemala', latitud: 14.623800, longitud: -90.551900 },
  { v: 1, estado: 'borrador', publicado: null, paso: 3, tipo: 3, modalidad: 'VENTA', precio: 350000, moneda: 'GTQ', habitaciones: 0, banos: 0, area_m2: 1200, parqueos: 0,
    titulo: 'Terreno en Chimaltenango (borrador)', descripcion: 'Borrador en paso 3 del formulario.',
    direccion: 'Km 54 Carretera Interamericana', zona: '1', municipio: 'Chimaltenango', departamento: 'Chimaltenango', latitud: 14.661100, longitud: -90.819900 },

  // ---------- pausado (2) ----------
  { v: 0, estado: 'pausado', publicado: 60, tipo: 5, modalidad: 'VENTA', precio: 175000, moneda: 'USD', habitaciones: 0, banos: 1, area_m2: 95, parqueos: 2,
    titulo: 'Oficina en Zona 9 (pausada)', descripcion: 'Oficina en edificio con recepción y parqueo de visitas.',
    direccion: '6a Avenida 9-18, Zona 9', zona: '9', municipio: 'Guatemala', departamento: 'Guatemala', latitud: 14.618700, longitud: -90.517000 },
  { v: 1, estado: 'pausado', publicado: 25, tipo: 2, modalidad: 'ALQUILER', precio: 1200, moneda: 'USD', habitaciones: 2, banos: 2, area_m2: 100, parqueos: 1,
    titulo: 'Apartamento en Zona 16 (pausado)', descripcion: 'Apartamento en Cayalá con acceso a club deportivo.',
    direccion: 'Bulevar Austriaco 36-00, Zona 16', zona: '16', municipio: 'Guatemala', departamento: 'Guatemala', latitud: 14.610900, longitud: -90.480400 },

  // ---------- vendido (2) ----------
  { v: 0, estado: 'vendido', publicado: 120, tipo: 1, modalidad: 'VENTA', precio: 1100000, moneda: 'GTQ', habitaciones: 3, banos: 2, area_m2: 175, parqueos: 2,
    titulo: 'Casa en San José Pinula (vendida)', descripcion: 'Casa en residencial con club house, ya vendida.',
    direccion: 'Residenciales Los Álamos, San José Pinula', zona: '1', municipio: 'San José Pinula', departamento: 'Guatemala', latitud: 14.546700, longitud: -90.411400 },
  { v: 1, estado: 'vendido', publicado: 90, tipo: 3, modalidad: 'VENTA', precio: 60000, moneda: 'USD', habitaciones: 0, banos: 0, area_m2: 800, parqueos: 0,
    titulo: 'Terreno en Escuintla (vendido)', descripcion: 'Terreno con acceso asfaltado, ya vendido.',
    direccion: 'Km 58 Carretera al Puerto', zona: '1', municipio: 'Escuintla', departamento: 'Escuintla', latitud: 14.305600, longitud: -90.785000 },

  // ---------- alquilado (2) ----------
  { v: 0, estado: 'alquilado', publicado: 80, tipo: 2, modalidad: 'ALQUILER', precio: 7800, moneda: 'GTQ', habitaciones: 2, banos: 2, area_m2: 90, parqueos: 1,
    titulo: 'Apartamento en Zona 13 (alquilado)', descripcion: 'Apartamento cerca del aeropuerto, actualmente alquilado.',
    direccion: 'Avenida Las Américas 9-50, Zona 13', zona: '13', municipio: 'Guatemala', departamento: 'Guatemala', latitud: 14.594800, longitud: -90.526100 },
  { v: 1, estado: 'alquilado', publicado: 50, tipo: 4, modalidad: 'ALQUILER', precio: 3000, moneda: 'USD', habitaciones: 0, banos: 2, area_m2: 200, parqueos: 4,
    titulo: 'Local en Zona 10 (alquilado)', descripcion: 'Local en Zona Viva, actualmente alquilado.',
    direccion: '1a Avenida 13-20, Zona 10', zona: '10', municipio: 'Guatemala', departamento: 'Guatemala', latitud: 14.599300, longitud: -90.508700 },

  // ---------- no_disponible (1): eliminada con soft delete ----------
  { v: 1, estado: 'no_disponible', publicado: 100, tipo: 1, modalidad: 'VENTA', precio: 140000, moneda: 'USD', habitaciones: 3, banos: 2, area_m2: 150, parqueos: 1,
    titulo: 'Casa en Fraijanes (eliminada)', descripcion: 'Propiedad dada de baja por el vendedor.',
    direccion: 'Km 20 Carretera a Fraijanes', zona: '1', municipio: 'Fraijanes', departamento: 'Guatemala', latitud: 14.464800, longitud: -90.441500 },
];

// Cambios de precio para probar el historial: índice en PROPIEDADES -> precios anteriores (del más antiguo al más reciente)
const HISTORIAL = {
  0: [380000, 365000],
  2: [1500000],
  8: [550000],
};

async function upsertVendedor(datos, passwordHash) {
  const usuario = await prisma.usuario.upsert({
    where: { correo: datos.correo },
    update: {},
    create: { ...datos, password_hash: passwordHash, correo_verificado: true, estado: 'activo' },
  });

  const roles = await prisma.rol.findMany({ where: { id: { in: [ROL_COMPRADOR, ROL_VENDEDOR] } } });
  if (roles.length) {
    await prisma.usuario_rol.createMany({
      data: roles.map((r) => ({ usuario_id: usuario.id, rol_id: r.id })),
      skipDuplicates: true,
    });
  }
  return usuario;
}

async function borrarPropiedades(vendedorIds) {
  const props = await prisma.propiedad.findMany({ where: { vendedor_id: { in: vendedorIds } }, select: { id: true } });
  const ids = props.map((p) => p.id);
  if (!ids.length) return 0;

  await prisma.$transaction([
    prisma.foto_propiedad.deleteMany({ where: { propiedad_id: { in: ids } } }),
    prisma.historial_precio.deleteMany({ where: { propiedad_id: { in: ids } } }),
    prisma.favorito.deleteMany({ where: { propiedad_id: { in: ids } } }),
    prisma.vista_propiedad.deleteMany({ where: { propiedad_id: { in: ids } } }),
    prisma.propiedad.deleteMany({ where: { id: { in: ids } } }),
  ]);
  return ids.length;
}

async function main() {
  // 1. Tipos de propiedad (FK requerida por propiedad)
  await prisma.tipo_propiedad.createMany({
    data: [
      { id: 1, nombre: 'Casa' },
      { id: 2, nombre: 'Apartamento' },
      { id: 3, nombre: 'Terreno' },
      { id: 4, nombre: 'Local Comercial' },
      { id: 5, nombre: 'Oficina' },
    ],
    skipDuplicates: true,
  });

  // 2. Vendedores de prueba
  const passwordHash = await bcrypt.hash(PASSWORD, 10);
  const vendedores = [];
  for (const datos of VENDEDORES) vendedores.push(await upsertVendedor(datos, passwordHash));
  const vendedorIds = vendedores.map((v) => v.id);

  // 3. Idempotencia
  const existentes = await prisma.propiedad.count({ where: { vendedor_id: { in: vendedorIds } } });
  if (existentes && !RESET) {
    console.log(`ℹ️  Los vendedores de prueba ya tienen ${existentes} propiedades. Usa --reset para recrearlas.`);
    return;
  }
  if (RESET) console.log(`🗑️  Eliminadas ${await borrarPropiedades(vendedorIds)} propiedades anteriores`);

  // 4. Propiedades
  const conteo = {};
  for (const [i, p] of PROPIEDADES.entries()) {
    const vendedor = vendedores[p.v];
    const fechaPublicacion = p.publicado === null ? null : haceDias(p.publicado);

    const propiedad = await prisma.propiedad.create({
      data: {
        vendedor_id: vendedor.id,
        tipo_propiedad_id: p.tipo,
        titulo: p.titulo,
        descripcion: p.descripcion,
        modalidad: p.modalidad,
        precio: p.precio,
        moneda: p.moneda,
        habitaciones: p.habitaciones,
        banos: p.banos,
        area_m2: p.area_m2,
        parqueos: p.parqueos,
        direccion: p.direccion,
        zona: p.zona,
        municipio: p.municipio,
        departamento: p.departamento,
        latitud: p.latitud,
        longitud: p.longitud,
        estado: p.estado,
        paso_formulario: p.paso ?? 4,
        fecha_publicacion: fechaPublicacion,
        fecha_expiracion: fechaPublicacion ? enDias(90 - p.publicado) : null,
        fecha_creacion: fechaPublicacion ? haceDias(p.publicado + 1) : haceDias(1),
      },
    });

    // Fotos (portada + 2) para todo lo que no es borrador
    if (p.estado !== 'borrador') {
      await prisma.foto_propiedad.createMany({
        data: [0, 1, 2].map((orden) => ({
          propiedad_id: propiedad.id,
          url: `https://picsum.photos/seed/homescope-${i}-${orden}/800/600`,
          public_id: `seed/homescope-${i}-${orden}`,
          orden,
          es_portada: orden === 0,
          tamano_bytes: 150000,
        })),
      });
    }

    // Historial de precios
    const anteriores = HISTORIAL[i];
    if (anteriores) {
      const precios = [...anteriores, p.precio];
      await prisma.historial_precio.createMany({
        data: anteriores.map((precio, k) => ({
          propiedad_id: propiedad.id,
          precio_anterior: precio,
          precio_nuevo: precios[k + 1],
          cambiado_por: vendedor.id,
          fecha_cambio: haceDias(Math.max(p.publicado - (k + 1) * 3, 0)),
        })),
      });
    }

    conteo[p.estado] = (conteo[p.estado] || 0) + 1;
  }

  console.log(`✅ Seed completado: ${PROPIEDADES.length} propiedades creadas`);
  console.table(conteo);
  vendedores.forEach((v) => console.log(`   Vendedor #${v.id}: ${v.correo} / ${PASSWORD}`));
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
