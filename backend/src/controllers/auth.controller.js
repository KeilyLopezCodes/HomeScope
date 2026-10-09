const authService = require('../services/auth.service');

const register = async (req, res) => {
  try {
    const { correo, email, contrasena, password, nombre, apellido, telefono } = req.body;

    const userData = {
      correo: correo || email,
      contrasena: contrasena || password,
      nombre,
      apellido,
      telefono
    };

    if (!userData.correo) {
      return res.status(400).json({
        success: false,
        message: 'El correo electrónico es obligatorio'
      });
    }

    const user = await authService.register(userData);
    res.status(201).json({
      success: true,
      message: 'Usuario registrado con éxito. Revisa tu correo para activar la cuenta.',
      data: user
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const login = async (req, res) => {
  try {
    const { correo, email, contrasena, password } = req.body;
    const finalEmail = correo || email;
    const finalPassword = contrasena || password;

    const result = await authService.login(finalEmail, finalPassword);
    res.json({ success: true, message: 'Inicio de sesión exitoso', data: result });
  } catch (error) {
    res.status(401).json({ success: false, message: error.message });
  }
};

const updateProfile = async (req, res) => {
  try {
    const updatedUser = await authService.updateUserProfile(req.user.id, req.body);
    res.json({ success: true, message: 'Perfil actualizado correctamente', data: updatedUser });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;
    await authService.verifyEmail(token);
    res.json({ success: true, message: 'Cuenta verificada exitosamente.' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const forgotPassword = async (req, res) => {
  try {
    await authService.forgotPassword(req.body.email || req.body.correo);
    res.json({ success: true, message: 'Si el correo está registrado, te enviamos un link para recuperar tu contraseña.' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token, password, contrasena } = req.body;
    await authService.resetPassword(token, password || contrasena);
    res.json({ success: true, message: 'Contraseña actualizada correctamente.' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

module.exports = {
  register,
  login,
  updateProfile,
  verifyEmail,
  forgotPassword,
  resetPassword
};