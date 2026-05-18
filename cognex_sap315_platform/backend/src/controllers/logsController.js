const { AuditLog } = require('../models');

exports.getAuditLogs = async (req, res) => {
  try {
    // Retorna los últimos 1.000 logs para asegurar la velocidad de renderizado
    const logs = await AuditLog.findAll({
      order: [['fecha_hora', 'DESC']],
      limit: 1000
    });
    res.json({ logs });
  } catch (error) {
    console.error("❌ Error al obtener logs de auditoría:", error.message);
    res.status(500).json({ error: 'Error interno al consultar logs.' });
  }
};