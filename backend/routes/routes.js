const express = require('express');
const { proteger, autorizar } = require('../middleware/auth');
const authController = require('../controladores/authController');
const usuariosController = require('../controladores/usuariosController');
const confirmacionController = require('../controladores/confirmacionController');
const { validateEmailBeforeAuth, verifyEmailOnly } = require('../middleware/emailValidation');
const router = express.Router();

// ==================== RUTAS DE CONFIRMACIÓN ====================
router.get('/auth/confirmar', confirmacionController.confirmarEmail);
router.post('/auth/reenviar-confirmacion', confirmacionController.reenviarConfirmacion);
router.post('/usuarios/verificar-email', verifyEmailOnly, (req, res) => {
  res.json({
    success: true,
    message: 'Verificación de email completada',
    validation: req.emailValidation
  });
});
// ==================== RUTAS PÚBLICAS ====================
router.post('/usuarios/registro', validateEmailBeforeAuth, usuariosController.registrar);
router.post('/usuarios/login', authController.login);
router.post('/usuarios/logout', authController.logout);
router.get('/usuarios/session', authController.getSession);

// ==================== RUTAS PROTEGIDAS ====================
// Ruta para verificar estado de confirmación
router.get('/usuario/estado-confirmacion', proteger, confirmacionController.estadoConfirmacionEmail);

// Ruta para obtener perfil del usuario autenticado
router.get('/usuario/perfil', proteger, usuariosController.obtenerPerfil);

// Ruta para actualizar perfil del usuario autenticado
router.put('/usuario/perfil', proteger, usuariosController.actualizarPerfil);

// Ruta para desactivar cuenta del usuario autenticado
router.put('/usuario/desactivar-cuenta', proteger, usuariosController.desactivarCuenta);

// ==================== RUTAS PARA ADMINISTRADORES ====================
// Ruta para obtener perfil de cualquier usuario por ID (solo operadores)
router.get('/usuarios/:id/perfil', proteger, autorizar('operador'), usuariosController.obtenerPerfilPorId);

// Ruta para actualizar perfil de cualquier usuario por ID (solo operadores)
router.put('/usuarios/:id/perfil', proteger, autorizar('operador'), usuariosController.actualizarPerfilPorId);

// Rutas específicas por rol
router.get('/admin/dashboard', proteger, autorizar('operador'), (req, res) => {
  res.json({ 
    success: true,
    message: 'Dashboard administrativo',
    data: {
      usuario: req.usuario.nombre_completo,
      rol: req.usuario.rol
    }
  });
});

module.exports = router;