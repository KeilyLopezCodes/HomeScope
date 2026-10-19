const authService = require('../services/auth.service');
const { FRONTEND_URL } = require('../config/env');
const { responderError } = require('../utils/errors');

const register = async (req, res) => {
  try {
    const { correo, email, contrasena, password, nombre, apellido, telefono } = req.body || {};
    const usuario = await authService.register({
      correo: correo || email,
      contrasena: contrasena || password,
      nombre,
      apellido,
      telefono,
    });
    res.status(201).json({
      success: true,
      message: usuario.verificado
        ? 'Cuenta creada. Ya puedes iniciar sesión.'
        : 'Cuenta creada. Revisa tu correo para activarla.',
      data: usuario,
    });
  } catch (error) {
    responderError(res, error);
  }
};

const login = async (req, res) => {
  try {
    const { correo, email, contrasena, password } = req.body || {};
    const result = await authService.login(correo || email, contrasena || password);
    res.json({ success: true, message: 'Inicio de sesión exitoso', data: result });
  } catch (error) {
    responderError(res, error);
  }
};

const updateProfile = async (req, res) => {
  try {
    const actualizado = await authService.updateUserProfile(req.user.id, req.body);
    res.json({ success: true, message: 'Perfil actualizado correctamente', data: actualizado });
  } catch (error) {
    responderError(res, error);
  }
};

// El link del correo abre esto en el navegador: se verifica y se manda a la pantalla de Majo
const verifyEmail = async (req, res) => {
  try {
    await authService.verifyEmail(req.query.token);
    res.redirect(`${FRONTEND_URL}/verificado?status=ok`);
  } catch (error) {
    console.error('[VERIFICACIÓN]', error.message);
    res.redirect(`${FRONTEND_URL}/verificado?status=error`);
  }
};

const resendVerification = async (req, res) => {
  try {
    const { correo, email } = req.body || {};
    await authService.resendVerification(correo || email);
    res.json({ success: true, message: 'Si la cuenta existe y no está verificada, te enviamos un nuevo link.' });
  } catch (error) {
    responderError(res, error);
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { correo, email } = req.body || {};
    await authService.forgotPassword(correo || email);
    res.json({ success: true, message: 'Si el correo está registrado, te enviamos un link para recuperar tu contraseña.' });
  } catch (error) {
    responderError(res, error);
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token, password, contrasena } = req.body || {};
    await authService.resetPassword(token, password || contrasena);
    res.json({ success: true, message: 'Contraseña actualizada correctamente.' });
  } catch (error) {
    responderError(res, error);
  }
};

module.exports = { register, login, updateProfile, verifyEmail, resendVerification, forgotPassword, resetPassword };