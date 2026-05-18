const express = require('express');
const router = express.Router();
const { 
  getRoles, 
  getUsuarios, 
  crearUsuario, 
  actualizarEstadoUsuario, 
  eliminarUsuario,
  editarUsuario,
  configurarPasswordNueva,  
  cambiarPasswordDefinitiva  
} = require('../controllers/usuariosController');

const { verificarToken } = require('../middleware/authMiddleware');

// ==========================================
// 🔓 RUTAS PÚBLICAS (No requieren Token)
// ==========================================

/**
 * 🚀 CORRECCIÓN: Se agrega el prefijo '/usuarios' 
 * para coincidir con la llamada del LoginModule.jsx
 */
router.post('/usuarios/configurar-password', configurarPasswordNueva);


// ==========================================
// 🔒 MIDDLEWARE DE VERIFICACIÓN (JWT)
// ==========================================
router.use(verificarToken);


// ==========================================
// 🔒 RUTAS PROTEGIDAS (Requieren Token Válido)
// ==========================================

router.get('/roles', getRoles);
router.get('/usuarios', getUsuarios);
router.post('/usuarios', crearUsuario);
router.put('/usuarios/:id', editarUsuario);
router.patch('/usuarios/:id/estado', actualizarEstadoUsuario);
router.delete('/usuarios/:id', eliminarUsuario);

/**
 * 🚀 CORRECCIÓN: Se agrega el prefijo '/usuarios'
 * para coincidir exactamente con api.post('/usuarios/cambiar-password-definitiva') de PerfilModule.jsx
 */
router.post('/usuarios/cambiar-password-definitiva', cambiarPasswordDefinitiva);

module.exports = router;