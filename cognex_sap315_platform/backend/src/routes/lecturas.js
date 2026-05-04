const express = require('express');
const router = express.Router();
const lecturasController = require('../controllers/lecturasController');
const { verificarToken } = require('../middleware/authMiddleware');

// 🚀 RUTA PROXY: Debe ir antes que las rutas con :id
router.get('/proxy-camara', lecturasController.proxyCamara);

// Rutas específicas
router.get('/alertas', verificarToken, lecturasController.getAlertas);
router.patch('/alertas/:id/resolver', verificarToken, lecturasController.resolverAlerta);

// Rutas generales de lecturas
router.post('/', verificarToken, lecturasController.crearLectura);
router.get('/', verificarToken, lecturasController.obtenerLecturas);

// Rutas con parámetros
router.put('/:id/validar', verificarToken, lecturasController.validarLectura);

module.exports = router;