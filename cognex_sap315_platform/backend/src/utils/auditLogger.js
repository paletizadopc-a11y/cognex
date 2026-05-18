const { AuditLog } = require('../models');

/**
 * 🔒 REGISTRAR LOG DE AUDITORÍA AUTOMÁTICO
 * @param {Object} req - Objeto Request de Express (para extraer req.usuario)
 * @param {String} accion - Nombre identificador de la operación ejecutada
 * @param {String} modulo - Módulo del sistema donde se generó
 * @param {Object|String} detalles - Objeto o texto explicativo con metadatos
 */
const registrarLog = async (req, accion, modulo, detalles = '') => {
  try {
    const usuario = req.usuario; // Hidratado previamente por verificarToken
    
    await AuditLog.create({
      usuario_id: usuario?.id || null,
      usuario_nombre: usuario?.nombre || 'Sistema / Anónimo',
      usuario_email: usuario?.email || 'N/A',
      accion: accion.toUpperCase(),
      modulo: modulo.toUpperCase(),
      detalles: typeof detalles === 'object' ? JSON.stringify(detalles) : detalles,
      fecha_hora: new Date()
    });
  } catch (err) {
    console.error("❌ [CRÍTICO] Falló la escritura en la tabla audit_logs:", err.message);
  }
};

module.exports = { registrarLog };