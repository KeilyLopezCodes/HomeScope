const esProduccion = process.env.NODE_ENV === 'production';

if (esProduccion && !process.env.JWT_SECRET) {
  throw new Error('Falta JWT_SECRET en las variables de entorno (obligatorio en producción)');
}

const PORT = process.env.PORT || 3000;

module.exports = {
  esProduccion,
  PORT,
  JWT_SECRET: process.env.JWT_SECRET || 'homescope_secret_key_2026',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
  BACKEND_URL: process.env.BACKEND_URL || `http://localhost:${PORT}`,
  EMAIL_USER: process.env.EMAIL_USER || '',
  EMAIL_PASS: process.env.EMAIL_PASS || '',
  correoConfigurado: Boolean(process.env.EMAIL_USER && process.env.EMAIL_PASS),
  AUTO_VERIFICAR_CORREO: process.env.AUTO_VERIFICAR_CORREO === 'true' && process.env.NODE_ENV !== 'production',
};