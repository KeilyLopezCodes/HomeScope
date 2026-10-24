const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

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

  // 2. Usuario vendedor de prueba
  const passwordHash = await bcrypt.hash('Test1234!', 10);
  const vendedor = await prisma.usuario.upsert({
    where: { correo: 'vendedor@homescope.test' },
    update: {},
    create: {
      nombre: 'Carlos',
      apellido: 'Mendoza',
      correo: 'vendedor@homescope.test',
      password_hash: passwordHash,
      telefono: '50230001234',
      correo_verificado: true,
      estado: 'activo',
    },
  });

  // 3. Propiedades con estado 'publicado'
  const propiedades = [
    {
      titulo: 'Casa moderna en Zona 10',
      descripcion: 'Hermosa casa con jardín, piscina y 3 niveles en zona residencial exclusiva.',
      modalidad: 'VENTA',
      precio: 350000,
      moneda: 'USD',
      habitaciones: 4,
      banos: 3.0,
      area_m2: 280,
      parqueos: 2,
      direccion: '15 Avenida 10-50, Zona 10',
      zona: '10',
      municipio: 'Guatemala',
      departamento: 'Guatemala',
      latitud: 14.604999,
      longitud: -90.506882,
      tipo_propiedad_id: 1,
    },
    {
      titulo: 'Apartamento en Zona 14',
      descripcion: 'Apartamento de lujo con vista panorámica, gimnasio y seguridad 24/7.',
      modalidad: 'ALQUILER',
      precio: 1800,
      moneda: 'USD',
      habitaciones: 2,
      banos: 2.0,
      area_m2: 120,
      parqueos: 1,
      direccion: '7 Avenida 14-30, Zona 14',
      zona: '14',
      municipio: 'Guatemala',
      departamento: 'Guatemala',
      latitud: 14.589500,
      longitud: -90.512300,
      tipo_propiedad_id: 2,
    },
    {
      titulo: 'Casa en Mixco con amplio jardín',
      descripcion: 'Casa familiar de un nivel con jardín, cuarto de servicio y cocina integral.',
      modalidad: 'VENTA',
      precio: 185000,
      moneda: 'USD',
      habitaciones: 3,
      banos: 2.0,
      area_m2: 200,
      parqueos: 2,
      direccion: 'Colonia El Naranjo, Mixco',
      zona: '1',
      municipio: 'Mixco',
      departamento: 'Guatemala',
      latitud: 14.630000,
      longitud: -90.606000,
      tipo_propiedad_id: 1,
    },
    {
      titulo: 'Local comercial en Zona 1',
      descripcion: 'Local en pleno centro histórico, ideal para restaurante o tienda.',
      modalidad: 'ALQUILER',
      precio: 2500,
      moneda: 'USD',
      habitaciones: 0,
      banos: 1.0,
      area_m2: 90,
      parqueos: 0,
      direccion: '6a Avenida 1-20, Zona 1',
      zona: '1',
      municipio: 'Guatemala',
      departamento: 'Guatemala',
      latitud: 14.641500,
      longitud: -90.513200,
      tipo_propiedad_id: 4,
    },
    {
      titulo: 'Terreno en Antigua Guatemala',
      descripcion: 'Terreno plano con vista al volcán, ideal para construcción residencial.',
      modalidad: 'VENTA',
      precio: 95000,
      moneda: 'USD',
      habitaciones: 0,
      banos: 0.0,
      area_m2: 500,
      parqueos: 0,
      direccion: 'Km 45 Carretera a Antigua',
      zona: '1',
      municipio: 'Antigua Guatemala',
      departamento: 'Sacatepéquez',
      latitud: 14.558700,
      longitud: -90.733900,
      tipo_propiedad_id: 3,
    },
  ];

  for (const data of propiedades) {
    await prisma.propiedad.create({
      data: {
        ...data,
        precio: data.precio,
        estado: 'publicado',
        fecha_publicacion: new Date(),
        vendedor_id: vendedor.id,
      },
    });
  }

  console.log(`✅ Seed completado: ${propiedades.length} propiedades creadas con estado 'publicado'`);
  console.log(`   Vendedor: ${vendedor.correo} / contraseña: Test1234!`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
