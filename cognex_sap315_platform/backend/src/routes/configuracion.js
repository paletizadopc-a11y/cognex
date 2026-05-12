const express = require('express');
const router = express.Router();
const configController = require('../controllers/configuracionController');
const { verificarToken } = require('../middleware/authMiddleware'); // Asegura la seguridad

/**
 * @route   GET /api/v1/configuracion/parametros
 * @desc    Obtener umbral de confianza, polling y otros ajustes
 */
router.get('/parametros', verificarToken, configController.getParametros);

/**
 * @route   POST /api/v1/configuracion/parametros
 * @desc    Guardar o actualizar la configuración global
 */
router.post('/parametros', verificarToken, configController.saveParametros);

module.exports = router;