const express = require('express');
const router = express.Router();
const multer = require('multer'); 
const lecturasController = require('../controllers/lecturasController');
const { verificarToken } = require('../middleware/authMiddleware');

// 🚀 IMPORTACIÓN DEL MIDDLEWARE DE CONTROL DE ACCESOS POR ROL
const { verificarRol } = require('../middleware/roles');

// Configuración de Multer para almacenar el Excel temporalmente en la memoria RAM
const upload = multer({ storage: multer.memoryStorage() });

// Ruta Proxy de streaming de la cámara Cognex (Módulo Monitor)
router.get('/proxy-camara', lecturasController.proxyCamara);

// ============================================================================
// 🚀 MÓDULO: AUDITORÍA DE CARGA (Reconciliación de Inventario por Excel)
// Autorizados: Operador, Supervisor y Administrador Sistema
// ============================================================================

// 1. Ruta para subir el Excel y realizar la comparación (Cruce)
router.post(
  '/comparar-excel', 
  verificarToken, 
  verificarRol(['Administrador Sistema', 'Supervisor', 'Operador']), 
  upload.single('archivo_excel'), 
  lecturasController.compararConExcel
);

// 2. VERIFICADO: Validación masiva desde el cruce de Auditoría de Excel
router.post(
  '/validar-masivo', 
  verificarToken, 
  verificarRol(['Administrador Sistema', 'Supervisor', 'Operador']), 
  lecturasController.validarMasivo
);

// ============================================================================
// 🚀 GESTIÓN DE ALERTAS / CENTRO DE INCIDENCIAS
// ============================================================================

// Obtener alertas activas (Lecturas pendientes o con error)
// 🌟 SOLUCIÓN AL LOOP: Se autoriza al 'Operador' aquí, el controlador filtrará el contenido de forma segura.
router.get(
  '/alertas', 
  verificarToken, 
  verificarRol(['Administrador Sistema', 'Supervisor', 'Operador']), 
  lecturasController.getAlertas
);

// Resolver una alerta individual pasándola a estado OK (Solo Supervisor y Admin)
router.patch(
  '/alertas/:id/resolver', 
  verificarToken, 
  verificarRol(['Administrador Sistema', 'Supervisor']), 
  lecturasController.resolverAlerta
);

// VERIFICADO: Validación masiva por selección de bloques (Checkboxes) desde el Centro de Incidencias
router.post(
  '/alertas/validar-masivo', 
  verificarToken, 
  verificarRol(['Administrador Sistema', 'Supervisor']), 
  lecturasController.validarAlertasMasivo
);

// Validación absoluta instantánea del 100% de alertas de un solo clic (Solo Supervisor y Admin)
router.post(
  '/alertas/validar-todas', 
  verificarToken, 
  verificarRol(['Administrador Sistema', 'Supervisor']), 
  lecturasController.validarTodasLasAlertasDB
);

// Borrado físico completo de todas las alertas del historial (Solo Supervisor y Admin)
router.delete(
  '/alertas/todas', 
  verificarToken, 
  verificarRol(['Administrador Sistema', 'Supervisor']), 
  lecturasController.eliminarTodasAlertas
);

// ============================================================================
// 🚀 OPERACIONES GENERALES DE LECTURAS (Dashboard / Historial)
// Autorizados: Operador, Supervisor y Administrador Sistema
// ============================================================================

router.post(
  '/', 
  verificarToken, 
  verificarRol(['Administrador Sistema', 'Supervisor', 'Operador']), 
  lecturasController.crearLectura
);

router.get(
  '/', 
  verificarToken, 
  verificarRol(['Administrador Sistema', 'Supervisor', 'Operador']), 
  lecturasController.getLecturas
);

router.get(
  '/estadisticas', 
  verificarToken, 
  verificarRol(['Administrador Sistema', 'Supervisor', 'Operador']), 
  lecturasController.estadisticas
);

// ============================================================================
// 🚀 RUTAS CON PARÁMETROS DINÁMICOS (:id)
// Autorizados: Operador, Supervisor y Administrador Sistema
// ============================================================================

router.put(
  '/:id/validar', 
  verificarToken, 
  verificarRol(['Administrador Sistema', 'Supervisor', 'Operador']), 
  lecturasController.validarLecturaManual
);

router.delete(
  '/:id', 
  verificarToken, 
  verificarRol(['Administrador Sistema', 'Supervisor', 'Operador']), 
  lecturasController.eliminarLectura
);

module.exports = router;