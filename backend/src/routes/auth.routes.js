const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { authenticateToken } = require('../middlewares/auth.middleware');

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Autenticación y gestión de cuenta
 */

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Registrar un nuevo usuario
 *     description: Crea la cuenta con `correo_verificado = false`.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AuthRegister'
 *     responses:
 *       201:
 *         description: Usuario registrado
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         id:     { type: integer, example: 8 }
 *                         correo: { type: string, format: email, example: 'juan@example.com' }
 *                         nombre: { type: string, example: 'Juan' }
 *       400:
 *         description: Datos inválidos o correo ya registrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example: { success: false, message: 'El correo electrónico ya está registrado' }
 */
router.post('/register', authController.register);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Iniciar sesión
 *     description: Devuelve un JWT válido por 8 horas que se envía en `Authorization Bearer <token>`.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AuthLogin'
 *     responses:
 *       200:
 *         description: Login exitoso. Retorna token JWT.
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         token: { type: string, example: 'eyJhbGci...' }
 *                         user:
 *                           type: object
 *                           properties:
 *                             id:     { type: integer, example: 8 }
 *                             nombre: { type: string, example: 'Juan' }
 *                             correo: { type: string, format: email, example: 'juan@example.com' }
 *       401:
 *         description: Faltan datos o credenciales inválidas
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example: { success: false, message: 'Credenciales inválidas' }
 */
router.post('/login', authController.login);

/**
 * @swagger
 * /auth/profile:
 *   put:
 *     summary: Actualizar perfil del usuario autenticado
 *     description: |
 *       `nombre` recibe el nombre completo: la primera palabra se guarda como nombre y el resto como apellido
 *       (p. ej. "María José López" → nombre "María", apellido "José López"). Los campos vacíos no se modifican.
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre:   { type: string, example: 'Juan Pérez', description: 'Nombre completo' }
 *               telefono: { type: string, example: '+502 5555-5555' }
 *     responses:
 *       200:
 *         description: Perfil actualizado correctamente
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data: { $ref: '#/components/schemas/Usuario' }
 *       400:
 *         description: Error al actualizar
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.put('/profile', authenticateToken, authController.updateProfile);

/**
 * @swagger
 * /auth/verify-email:
 *   get:
 *     summary: Verificar correo electrónico con token
 *     tags: [Auth]
 *     parameters:
 *       - in: query
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: Token de verificación recibido por correo
 *     responses:
 *       200:
 *         description: Cuenta verificada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MessageResponse'
 *             example: { success: true, message: 'Cuenta verificada exitosamente.' }
 *       400:
 *         description: Token inválido o expirado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example: { success: false, message: 'Token de verificación inválido o expirado' }
 */
router.get('/verify-email', authController.verifyEmail);

/**
 * @swagger
 * /auth/forgot-password:
 *   post:
 *     summary: Solicitar recuperación de contraseña
 *     description: Envía un link (válido 15 minutos) a `{FRONTEND_URL}/nueva-password?token=...`. Si el correo no está registrado responde lo mismo, sin enviar nada.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             description: Se acepta `email` o `correo`.
 *             properties:
 *               email: { type: string, format: email, example: 'juan@example.com' }
 *     responses:
 *       200:
 *         description: Solicitud procesada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MessageResponse'
 *             example: { success: true, message: 'Si el correo está registrado, te enviamos un link para recuperar tu contraseña.' }
 *       400:
 *         description: Correo no enviado en el body, o error al enviar el correo
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example: { success: false, message: 'Escribe tu correo electrónico' }
 */
router.post('/forgot-password', authController.forgotPassword);

/**
 * @swagger
 * /auth/reset-password:
 *   post:
 *     summary: Restablecer contraseña con token
 *     description: El token es de un solo uso (deja de ser válido al cambiar la contraseña) y expira a los 15 minutos.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token, password]
 *             description: Se acepta `password` o `contrasena`.
 *             properties:
 *               token:    { type: string, description: 'Token recibido en el link de recuperación' }
 *               password: { type: string, format: password, minLength: 8, example: 'NuevaPassword123' }
 *     responses:
 *       200:
 *         description: Contraseña actualizada correctamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MessageResponse'
 *             example: { success: true, message: 'Contraseña actualizada correctamente.' }
 *       400:
 *         description: Contraseña de menos de 8 caracteres, o token inválido o expirado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example: { success: false, message: 'El link es inválido o ya expiró' }
 */
router.post('/reset-password', authController.resetPassword);

module.exports = router;
