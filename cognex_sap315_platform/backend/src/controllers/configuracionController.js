const { Configuracion } = require('../models');

/**
 * Obtiene los parámetros operativos actuales de la planta.
 */
exports.getParametros = async (req, res) => {
  try {
    // Buscamos la configuración global (siempre ID: 1)
    let config = await Configuracion.findByPk(1);
    
    // Si la base de datos es nueva y no hay config, devolvemos valores iniciales
    if (!config) {
      return res.json({
        parametros: {
          umbralConfianza: 55,
          modoOperacion: 'AUTOMATICO',
          intervaloLectura: 2000,
          integracionSap: true,
          autoAlertasAuditoria: true
        }
      });
    }

    // Mapeamos los nombres de la BD a los que espera el Frontend
    res.json({
      parametros: {
        umbralConfianza: config.umbral_confianza,
        modoOperacion: config.modo_operacion,
        intervaloLectura: config.intervalo_lectura,
        integracionSap: config.integracion_sap,
        autoAlertasAuditoria: config.auto_alertas_auditoria
      }
    });
  } catch (error) {
    console.error('❌ Error al obtener configuración:', error);
    res.status(500).json({ error: 'No se pudieron recuperar los parámetros de planta.' });
  }
};

/**
 * Guarda o actualiza los parámetros operativos.
 */
exports.saveParametros = async (req, res) => {
  try {
    const p = req.body;

    // Actualizamos el ID 1 o lo creamos si no existe
    const [config] = await Configuracion.upsert({
      id: 1,
      umbral_confianza: p.umbralConfianza,
      modo_operacion: p.modoOperacion,
      intervalo_lectura: p.intervaloLectura,
      integracion_sap: p.integracionSap,
      auto_alertas_auditoria: p.autoAlertasAuditoria
    });

    res.json({ mensaje: 'Parámetros actualizados con éxito', parametros: config });
  } catch (error) {
    console.error('❌ Error al guardar configuración:', error);
    res.status(500).json({ error: 'Error interno al intentar guardar los cambios.' });
  }
};