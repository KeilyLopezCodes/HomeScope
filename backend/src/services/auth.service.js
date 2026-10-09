const userRepository = require('../repositories/user.repository');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

const JWT_SECRET = process.env.JWT_SECRET || 'secret_key_homescope';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const register = async (userData) => {
  const { correo, contrasena, nombre, apellido, telefono } = userData;

  if (!correo) {
    throw new Error('El correo electrónico es requerido');
  }

  const existingUser = await userRepository.findByEmail(correo);
  if (existingUser) {
    throw new Error('El correo electrónico ya está registrado');
  }

  const hashedPassword = await bcrypt.hash(contrasena, 10);

  const newUser = await userRepository.create({
    correo,
    password_hash: hashedPassword,
    nombre: nombre || 'Usuario',
    apellido: apellido || '',
    telefono: telefono || null
  });

  return {
    id: newUser.id,
    correo: newUser.correo,
    nombre: newUser.nombre
  };
};

const login = async (correo, contrasena) => {
  if (!correo || !contrasena) {
    throw new Error('Correo y contraseña son requeridos');
  }

  const user = await userRepository.findByEmail(correo);
  if (!user) {
    throw new Error('Credenciales inválidas');
  }

  const isValidPassword = await bcrypt.compare(contrasena, user.password_hash);
  if (!isValidPassword) {
    throw new Error('Credenciales inválidas');
  }

  const token = jwt.sign(
    { id: user.id, id_rol: user.usuario_rol[0]?.rol_id },
    JWT_SECRET,
    { expiresIn: '8h' }
  );

  return {
    token,
    user: {
      id: user.id,
      nombre: user.nombre,
      correo: user.correo
    }
  };
};

const updateUserProfile = async (id_usuario, profileData) => {
  const { nombre, telefono } = profileData;

  const partesNombre = nombre ? nombre.trim().split(' ') : [];
  const nombreFinal = partesNombre[0] || undefined;
  const apellidoFinal = partesNombre.slice(1).join(' ') || undefined;

  return await userRepository.update(id_usuario, {
    ...(nombreFinal && { nombre: nombreFinal }),
    ...(apellidoFinal && { apellido: apellidoFinal }),
    ...(telefono && { telefono })
  });
};

const verifyEmail = async (token) => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return await userRepository.update(decoded.id, { correo_verificado: true });
  } catch (error) {
    throw new Error('Token de verificación inválido o expirado');
  }
};

const forgotPassword = async (email) => {
  if (!email) throw new Error('Escribe tu correo electrónico');

  const user = await userRepository.findByEmail(email);
  if (!user) return;

  const token = jwt.sign(
    { id: user.id, tipo: 'reset' },
    JWT_SECRET + user.password_hash,
    { expiresIn: '15m' }
  );

  const resetUrl = `${FRONTEND_URL}/nueva-password?token=${token}`;
  await transporter.sendMail({
    from: '"HomeScope Support" <no-reply@homescope.com>',
    to: email,
    subject: 'Recupera tu contraseña de HomeScope',
    html: `<p>Hola ${user.nombre}, haz clic en el link para crear una nueva contraseña. Es válido por 15 minutos:</p><a href="${resetUrl}">${resetUrl}</a><p>Si no lo pediste tú, ignora este correo.</p>`,
  });
};

const resetPassword = async (token, newPassword) => {
  if (!newPassword || newPassword.length < 8) {
    throw new Error('La contraseña debe tener al menos 8 caracteres');
  }

  const invalido = new Error('El link es inválido o ya expiró');
  const decoded = jwt.decode(token);
  if (!decoded || decoded.tipo !== 'reset' || !decoded.id) throw invalido;

  const user = await userRepository.findById(decoded.id);
  if (!user) throw invalido;

  try {
    jwt.verify(token, JWT_SECRET + user.password_hash);
  } catch {
    throw invalido;
  }

  const hashed = await bcrypt.hash(newPassword, 10);
  await userRepository.update(user.id, { password_hash: hashed });
};

module.exports = {
  register,
  login,
  updateUserProfile,
  verifyEmail,
  forgotPassword,
  resetPassword,
};