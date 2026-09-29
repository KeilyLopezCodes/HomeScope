const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

prisma.$connect()
  .then(() => console.log('Conexión exitosa a PostgreSQL mediante Prisma ORM'))
  .catch((err) => console.error('Error de conexión:', err));

module.exports = prisma;