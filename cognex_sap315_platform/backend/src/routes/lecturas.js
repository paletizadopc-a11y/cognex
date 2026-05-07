const express = require('express');
const router = express.Router();
const multer = require('multer'); 
const lecturasController = require('../controllers/lecturasController');
const { verificarToken } = require('../middleware/authMiddleware');

// Configuración de Multer para almacenar el Excel temporalmente en la memoria RAM
const upload = multer({ storage: multer.memoryStorage() });

// 🚀 RUTA PROXY: Debe ir antes que las rutas con :id
router.get('/proxy-camara', lecturasController.proxyCamara);

// ============================================================================
// 🚀 NUEVA RUTA: Módulo de Reconciliación de Inventario (Excel vs Base de Datos)
// Usamos upload.single('archivo_excel') para interceptar el archivo en la petición
// ============================================================================
router.post('/comparar-excel', verificarToken, upload.single('archivo_excel'), lecturasController.compararConExcel);

// Rutas específicas (Alertas)
router.get('/alertas', verificarToken, lecturasController.getAlertas);
router.patch('/alertas/:id/resolver', verificarToken, lecturasController.resolverAlerta);

// Rutas generales de lecturas
router.post('/', verificarToken, lecturasController.crearLectura);

// 🐛 CORREGIDO: Llamamos a 'getLecturas' (y no a 'obtenerLecturas')
router.get('/', verificarToken, lecturasController.getLecturas);

// Rutas con parámetros
// 🐛 CORREGIDO: Llamamos a 'validarLecturaManual' (y no a 'validarLectura')
router.put('/:id/validar', verificarToken, lecturasController.validarLecturaManual);

module.exports = router;