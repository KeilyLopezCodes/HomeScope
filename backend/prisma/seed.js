const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const tipos = [
    { id: 1, nombre: 'Casa' },
    { id: 2, nombre: 'Apartamento' },
    { id: 3, nombre: 'Terreno' },
    { id: 4, nombre: 'Oficina' },
  ];

  for (const tipo of tipos) {
    await prisma.tipo_propiedad.upsert({
      where: { id: tipo.id },
      update: {},
      create: tipo,
    });
  }

  console.log('Tipos de propiedad insertados correctamente');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });