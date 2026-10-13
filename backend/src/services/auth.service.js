const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const userRepository = require('../repositories/user.repository');
const { ErrorApp } = require('../utils/errors');
const {
  esProduccion,
  JWT_SECRET,
  FRONTEND_URL,
  BACKEND_URL,
  EMAIL_USER,
  EMAIL_PASS,
  correoConfigurado,
  AUTO_VERIFICAR_CORREO,
} = require('../config/env');

// Ids definidos en scripts/SeedHomeScope.sql
const ROLES = { comprador: 1, vendedor: 2, administrador: 3 };
const PASSWORD_MIN = 8;
const PASSWORD_MAX = 72; // bcrypt ignora lo que pase de 72 bytes
const CORREO_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const transporter = correoConfigurado
  ? nodemailer.createTransport({
      service: 'gmail',
      auth: { user: EMAIL_USER, pass: EMAIL_PASS },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
    })
  : null;

const normalizarCorreo = (correo) => String(correo || '').trim().toLowerCase();

const escapar = (texto) =>
  String(texto).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// Envía sin bloquear la respuesta. Sin credenciales (desarrollo) imprime el link en la terminal.
const enviarCorreo = ({ para, asunto, html, link }) => {
  if (!transporter) {
    if (esProduccion) console.error(`[CORREO] Sin EMAIL_USER/EMAIL_PASS: no se envió "${asunto}"`);
    else console.log(`\n[DEV] "${asunto}" para ${para}\n      ${link}\n`);
    return;
  }
  transporter
    .sendMail({ from: `"HomeScope" <${EMAIL_USER}>`, to: para, subject: asunto, html })
    .catch((error) => {
      console.error(`[CORREO] No se pudo enviar "${asunto}" a ${para}: ${error.message}`);
      if (!esProduccion) console.log(`[DEV] Link de respaldo: ${link}`);
    });
};

const enviarVerificacion = (usuario) => {
  const token = jwt.sign({ id: usuario.id, tipo: 'verificacion' }, JWT_SECRET, { expiresIn: '1d' });
  const link = `${BACKEND_URL}/api/auth/verify-email?token=${token}`;
  enviarCorreo({
    para: usuario.correo,
    asunto: 'Verifica tu cuenta en HomeScope',
    html: `<p>Hola ${escapar(usuario.nombre)}, para activar tu cuenta haz clic en el enlace (válido por 24 horas):</p><a href="${link}">${link}</a>`,
    link,
  });
};

const validarContrasena = (contrasena) => {
  if (!contrasena || contrasena.length < PASSWORD_MIN) {
    throw new ErrorApp(`La contraseña debe tener al menos ${PASSWORD_MIN} caracteres`, 400);
  }
  if (contrasena.length > PASSWORD_MAX) {
    throw new ErrorApp(`La contraseña no puede pasar de ${PASSWORD_MAX} caracteres`, 400);
  }
};

const register = async ({ correo, contrasena, nombre, apellido, telefono }) => {
  const correoNormalizado = normalizarCorreo(correo);
  if (!correoNormalizado) throw new ErrorApp('El correo electrónico es obligatorio', 400);
  if (!CORREO_VALIDO.test(correoNormalizado) || correoNormalizado.length > 150) {
    throw new ErrorApp('Escribe un correo electrónico válido', 400);
  }
  validarContrasena(contrasena);

  if (await userRepository.findByEmail(correoNormalizado)) {
    throw new ErrorApp('El correo electrónico ya está registrado', 409);
  }

  const usuario = await userRepository.create({
    correo: correoNormalizado,
    password_hash: await bcrypt.hash(contrasena, 10),
    nombre: String(nombre || '').trim().slice(0, 100) || 'Usuario',
    apellido: String(apellido || '').trim().slice(0, 100),
    telefono: telefono ? String(telefono).trim().slice(0, 20) : null,
    correo_verificado: AUTO_VERIFICAR_CORREO,
    usuario_rol: { create: { rol_id: ROLES.comprador } },
  });

  if (!AUTO_VERIFICAR_CORREO) enviarVerificacion(usuario);

  return { id: usuario.id, correo: usuario.correo, nombre: usuario.nombre, verificado: usuario.correo_verificado };
};

const login = async (correo, contrasena) => {
  const correoNormalizado = normalizarCorreo(correo);
  if (!correoNormalizado || !contrasena) throw new ErrorApp('Correo y contraseña son requeridos', 400);

  const usuario = await userRepository.findByEmail(correoNormalizado);
  const passwordValido = usuario ? await bcrypt.compare(contrasena, usuario.password_hash) : false;
  if (!passwordValido) throw new ErrorApp('Credenciales inválidas', 401);

  // Primero la contraseña, así no se revela el estado de una cuenta ajena
  if (!usuario.correo_verificado) {
    throw new ErrorApp('Debes verificar tu correo electrónico antes de iniciar sesión', 403);
  }
  if (String(usuario.estado).toLowerCase() !== 'activo') {
    throw new ErrorApp('Tu cuenta no está activa. Contacta al administrador.', 403);
  }

  const rolesIds = usuario.usuario_rol.map((ur) => ur.rol_id);
  const token = jwt.sign(
    { id: usuario.id, id_rol: rolesIds[0], roles: rolesIds, tipo: 'acceso' },
    JWT_SECRET,
    { expiresIn: '8h' }
  );

  userRepository.update(usuario.id, { ultimo_acceso: new Date() }).catch(() => {});

  return {
    token,
    user: {
      id: usuario.id,
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      correo: usuario.correo,
      roles: usuario.usuario_rol.map((ur) => ur.rol.nombre),
    },
  };
};

const updateUserProfile = async (idUsuario, { nombre, apellido, telefono } = {}) => {
  const partes = nombre ? String(nombre).trim().split(/\s+/) : [];
  const nombreFinal = partes[0] || undefined;
  const apellidoFinal =
    apellido !== undefined ? String(apellido).trim() : partes.slice(1).join(' ') || undefined;

  const actualizado = await userRepository.update(idUsuario, {
    ...(nombreFinal && { nombre: nombreFinal.slice(0, 100) }),
    ...(apellidoFinal !== undefined && { apellido: apellidoFinal.slice(0, 100) }),
    ...(telefono !== undefined && { telefono: telefono ? String(telefono).trim().slice(0, 20) : null }),
  });

  // Nunca devolver password_hash
  return {
    id: actualizado.id,
    nombre: actualizado.nombre,
    apellido: actualizado.apellido,
    correo: actualizado.correo,
    telefono: actualizado.telefono,
  };
};

const verifyEmail = async (token) => {
  let decoded;
  try {
    decoded = jwt.verify(token, JWT_SECRET);
  } catch {
    throw new ErrorApp('El link de verificación es inválido o ya expiró', 400);
  }
  if (decoded.tipo !== 'verificacion') throw new ErrorApp('El link de verificación es inválido', 400);
  await userRepository.update(decoded.id, { correo_verificado: true });
};

const resendVerification = async (correo) => {
  const correoNormalizado = normalizarCorreo(correo);
  if (!correoNormalizado) throw new ErrorApp('Escribe tu correo electrónico', 400);
  const usuario = await userRepository.findByEmail(correoNormalizado);
  if (usuario && !usuario.correo_verificado) enviarVerificacion(usuario);
};

const forgotPassword = async (correo) => {
  const correoNormalizado = normalizarCorreo(correo);
  if (!correoNormalizado) throw new ErrorApp('Escribe tu correo electrónico', 400);

  const usuario = await userRepository.findByEmail(correoNormalizado);
  if (!usuario) return; // misma respuesta exista o no, para no revelar qué correos están registrados

  // Se firma con el hash actual: al cambiar la contraseña, el link deja de servir
  const token = jwt.sign({ id: usuario.id, tipo: 'reset' }, JWT_SECRET + usuario.password_hash, { expiresIn: '15m' });
  const link = `${FRONTEND_URL}/nueva-password?token=${token}`;
  enviarCorreo({
    para: usuario.correo,
    asunto: 'Recupera tu contraseña de HomeScope',
    html: `<p>Hola ${escapar(usuario.nombre)}, haz clic en el enlace para crear una nueva contraseña. Es válido por 15 minutos:</p><a href="${link}">${link}</a><p>Si no lo pediste tú, ignora este correo.</p>`,
    link,
  });
};

const resetPassword = async (token, nuevaContrasena) => {
  validarContrasena(nuevaContrasena);

  const invalido = new ErrorApp('El link es inválido o ya expiró', 400);
  const decoded = jwt.decode(token);
  if (!decoded || decoded.tipo !== 'reset' || !decoded.id) throw invalido;

  const usuario = await userRepository.findAuthById(decoded.id); // este sí trae password_hash
  if (!usuario) throw invalido;

  try {
    jwt.verify(token, JWT_SECRET + usuario.password_hash);
  } catch {
    throw invalido;
  }

  await userRepository.update(usuario.id, { password_hash: await bcrypt.hash(nuevaContrasena, 10) });
};

module.exports = {
  register,
  login,
  updateUserProfile,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword,
};