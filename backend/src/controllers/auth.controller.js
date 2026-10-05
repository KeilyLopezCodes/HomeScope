const authService = require('../services/auth.service');

const register = async (req, res) => {
  try {
    const user = await authService.registerUser(req.body);
    res.status(201).json({ success: true, message: 'Usuario registrado con éxito. Revisa tu correo para activar la cuenta.', data: user });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await authService.loginUser(email, password);
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
    res.json({ success: true, message: 'Cuenta verificada exitosamente. Ya puedes iniciar sesión.' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

module.exports = { register, login, updateProfile, verifyEmail };

const forgotPassword = async (req, res) => {
  try {
    await authService.forgotPassword(req.body.email);
    res.json({ success: true, message: 'Si el correo está registrado, te enviamos un link para recuperar tu contraseña.' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
 

const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;
    await authService.resetPassword(token, password);
    res.json({ success: true, message: 'Contraseña actualizada correctamente.' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
 
module.exports = { register, login, updateProfile, verifyEmail, forgotPassword, resetPassword };