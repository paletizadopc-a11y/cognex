const express = require('express');
const router = express.Router();
const logsController = require('../controllers/logsController');
const { verificarToken } = require('../middleware/authMiddleware');

// 🚀 IMPORTACIÓN DEL MIDDLEWARE DE CONTROL DE ACCESOS POR ROL
const { verificarRol } = require('../middleware/roles');

/**
 * 🔒 ENDPOINT DE CONSULTA DE TRAZA FORENSE
 * Restringido estrictamente para el rol de 'Administrador Sistema'.
 * Se ejecuta en cascada: primero valida la autenticidad del token JWT y luego sus privilegios de planta.
 */
router.get(
  '/logs', 
  verificarToken, 
  verificarRol(['Administrador Sistema']), 
  logsController.getAuditLogs
);

module.exports = router;