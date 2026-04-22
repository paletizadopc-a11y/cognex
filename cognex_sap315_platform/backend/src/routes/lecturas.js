const express = require('express');
const router = express.Router();
const lecturasController = require('../controllers/lecturasController');
const { verificarToken } = require('../middleware/auth');
const { verificarRol } = require('../middleware/roles');

router.post('/', verificarToken, lecturasController.crearLectura);
router.get('/', verificarToken, lecturasController.obtenerLecturas);
router.put('/:id/validar', verificarToken, verificarRol('admin', 'supervisor'), lecturasController.validarLectura);

module.exports = router;