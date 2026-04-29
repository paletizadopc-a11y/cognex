const express = require('express');
const router = express.Router();
const lecturasController = require('../controllers/lecturasController');
const { verificarToken } = require('../middleware/authMiddleware');
const { verificarRol } = require('../middleware/roles'); 

// 🚀 Rutas específicas (DEBEN ir antes de las rutas con parámetros como :id)
router.get('/alertas', verificarToken, lecturasController.getAlertas);
router.patch('/alertas/:id/resolver', verificarToken, lecturasController.resolverAlerta);

// Rutas generales
router.post('/', verificarToken, lecturasController.crearLectura);
router.get('/', verificarToken, lecturasController.obtenerLecturas);

// Rutas con parámetros
router.put('/:id/validar', verificarToken, lecturasController.validarLectura);

module.exports = router;