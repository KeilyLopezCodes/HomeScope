module.exports = (prisma) => {
  prisma.$queryRaw`SELECT 1`
    .then(() => console.log('Base de datos conectada'))
    .catch((error) => {
      console.error('\n[BD] No se pudo conectar con la base de datos. Revisa en orden:');
      console.error('  1) Docker corriendo y la base arriba:  docker compose up -d db');
      console.error('  2) backend/.env: DATABASE_URL con host localhost y puerto 5432');
      console.error('  3) Usuario y contraseña iguales a backend/.env.example');
      console.error(`  Detalle: ${String(error.message).split('\n').filter(Boolean).pop()}\n`);
    });
};