const prisma = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

// Configuración de Nodemailer
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const registerUser = async (userData) => {
  const { nombre, email, password, id_rol, apellido } = userData;

  // 1. Verificar si el correo ya existe
  const existingUser = await prisma.usuario.findUnique({ 
    where: { correo: email } 
  });
  if (existingUser) throw new Error('El correo electrónico ya está registrado');

  // 2. Hash de contraseña
  const hashedPassword = await bcrypt.hash(password, 10);

  // 3. Manejar nombre y apellido
  const partesNombre = nombre ? nombre.trim().split(' ') : ['Usuario'];
  const nombreFinal = partesNombre[0];
  const apellidoFinal = apellido || (partesNombre.slice(1).join(' ') || 'Sin Apellido');

  // 4. Crear usuario en PostgreSQL
  const newUser = await prisma.usuario.create({
    data: {
      nombre: nombreFinal,
      apellido: apellidoFinal,
      correo: email,
      password_hash: hashedPassword,
      correo_verificado: false,
      estado: 'ACTIVO',
    },
  });

  // 5. Asignar rol si viene especificado
  if (id_rol) {
    await prisma.usuario_rol.create({
      data: {
        usuario_id: newUser.id,
        rol_id: id_rol,
      },
    });
  }

  // 6. Generar token de verificación de correo
  const verificationToken = jwt.sign(
    { id: newUser.id }, 
    process.env.JWT_SECRET || 'secret_key_homescope', 
    { expiresIn: '1d' }
  );

  // 7. Enviar correo de verificación
  const verifyUrl = `http://localhost:${process.env.PORT || 3000}/api/auth/verify-email?token=${verificationToken}`;
  await transporter.sendMail({
    from: '"HomeScope Support" <no-reply@homescope.com>',
    to: email,
    subject: 'Verifica tu cuenta en HomeScope',
    html: `<p>Hola ${nombreFinal}, para activar tu cuenta haz clic en el siguiente enlace:</p><a href="${verifyUrl}">${verifyUrl}</a>`,
  });

  return newUser;
};

const loginUser = async (email, password) => {
  const user = await prisma.usuario.findUnique({ 
    where: { correo: email } 
  });
  if (!user) throw new Error('Credenciales inválidas');

  if (!user.correo_verificado) {
    throw new Error('Debes verificar tu correo electrónico antes de iniciar sesión');
  }

  const validPassword = await bcrypt.compare(password, user.password_hash);
  if (!validPassword) throw new Error('Credenciales inválidas');

  // Firmar token con el id real de la base de datos
  const token = jwt.sign(
    { id: user.id },
    process.env.JWT_SECRET || 'secret_key_homescope',
    { expiresIn: '8h' }
  );

  return { 
    token, 
    user: { id: user.id, nombre: user.nombre, email: user.correo } 
  };
};

const updateUserProfile = async (id_usuario, profileData) => {
  const { nombre, telefono } = profileData;
  
  const partesNombre = nombre ? nombre.trim().split(' ') : [];
  const nombreFinal = partesNombre[0] || undefined;
  const apellidoFinal = partesNombre.slice(1).join(' ') || undefined;

  return await prisma.usuario.update({
    where: { id: Number(id_usuario) },
    data: { 
      ...(nombreFinal && { nombre: nombreFinal }),
      ...(apellidoFinal && { apellido: apellidoFinal }),
      ...(telefono && { telefono })
    },
    select: { id: true, nombre: true, apellido: true, correo: true, telefono: true },
  });
};

const verifyEmail = async (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret_key_homescope');
    
    const updatedUser = await prisma.usuario.update({
      where: { id: decoded.id },
      data: { correo_verificado: true },
    });

    return updatedUser;
  } catch (error) {
    throw new Error('Token de verificación inválido o expirado');
  }
};

module.exports = { registerUser, loginUser, updateUserProfile, verifyEmail };