const nodemailer = require('nodemailer');
const { esProduccion, EMAIL_USER, EMAIL_PASS, correoConfigurado } = require('../config/env');

const transporter = correoConfigurado
  ? nodemailer.createTransport({
      service: 'gmail',
      auth: { user: EMAIL_USER, pass: EMAIL_PASS },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
    })
  : null;

const escapar = (texto) =>
  String(texto).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/**
 * Envía un correo. NUNCA lanza: devuelve true si salió y false si no (sin credenciales o error).
 * Se puede llamar sin esperar el resultado (registro, recuperar contraseña) o con await (recordatorios).
 * Sin credenciales (desarrollo) imprime en la terminal el link o el texto en lugar de enviar.
 */
const enviarCorreo = async ({ para, asunto, html, link, texto }) => {
  if (!transporter) {
    if (esProduccion) console.error(`[CORREO] Sin EMAIL_USER/EMAIL_PASS: no se envió "${asunto}"`);
    else console.log(`\n[DEV] "${asunto}" para ${para}\n      ${link || texto || ''}\n`);
    return false;
  }
  try {
    await transporter.sendMail({ from: `"HomeScope" <${EMAIL_USER}>`, to: para, subject: asunto, html });
    return true;
  } catch (error) {
    console.error(`[CORREO] No se pudo enviar "${asunto}" a ${para}: ${error.message}`);
    if (!esProduccion && link) console.log(`[DEV] Link de respaldo: ${link}`);
    return false;
  }
};

module.exports = { enviarCorreo, escapar, correoConfigurado };