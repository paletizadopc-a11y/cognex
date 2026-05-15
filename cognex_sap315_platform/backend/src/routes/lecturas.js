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
// 🚀 MÓDULO: RECONCILIACIÓN DE INVENTARIO (Cruce de Datos)
// ============================================================================

// 1. Ruta para subir el Excel y realizar la comparación (Cruce)
router.post('/comparar-excel', verificarToken, upload.single('archivo_excel'), lecturasController.compararConExcel);

// 2. Validación masiva (Actualización de estados en BD)
router.post('/validar-masivo', verificarToken, lecturasController.validarMasivo);

// ============================================================================
// 🚀 GESTIÓN DE ALERTAS
// ============================================================================

// Obtener alertas activas
router.get('/alertas', verificarToken, lecturasController.getAlertas);

// Resolver una alerta individual
router.patch('/alertas/:id/resolver', verificarToken, lecturasController.resolverAlerta);

// 🚀 NUEVA RUTA: Borrar todo el historial de alertas
// Esta ruta permite la limpieza masiva solicitada para el módulo de incidencias.
router.delete('/alertas/todas', verificarToken, lecturasController.eliminarTodasAlertas);

// ============================================================================
// 🚀 OPERACIONES GENERALES DE LECTURAS
// ============================================================================

// Registrar una nueva lectura (Pistola RF o Cámara)
router.post('/', verificarToken, lecturasController.crearLectura);

// Obtener historial de lecturas (Paginado)
router.get('/', verificarToken, lecturasController.getLecturas);

// Obtener estadísticas para KPIs
router.get('/estadisticas', verificarToken, lecturasController.estadisticas);

// ============================================================================
// 🚀 RUTAS CON PARÁMETROS (:id)
// ============================================================================

// Validación manual desde el modal del Historial
router.put('/:id/validar', verificarToken, lecturasController.validarLecturaManual);

// Eliminar un registro específico
router.delete('/:id', verificarToken, lecturasController.eliminarLectura);

module.exports = router;