const { Lectura, ConfigCamara, Usuario, LogAlerta } = require('../models');
const { Op } = require('sequelize');
const axios = require('axios');

/**
 * 🚀 PROXY DE CÁMARA: Resuelve errores de CORS y 403 Forbidden.
 * Actúa como túnel entre el frontend y el hardware Cognex.
 */
exports.proxyCamara = async (req, res) => {
  try {
    const { COGNEX_IP, COGNEX_PORT_HMI, COGNEX_USER, COGNEX_PASS } = process.env;
    const url = `http://${COGNEX_IP}:${COGNEX_PORT_HMI}/image.jpg`;
    
    // Generación de cabecera de autenticación (maneja contraseña vacía)
    const authString = `${COGNEX_USER}:${COGNEX_PASS || ''}`;
    const authBase64 = Buffer.from(authString).toString('base64');

    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      timeout: 5000,
      headers: {
        'Authorization': `Basic ${authBase64}`,
        'Cache-Control': 'no-cache'
      }
    });

    res.set('Content-Type', 'image/jpeg');
    res.send(response.data);
  } catch (error) {
    console.error('❌ Error en Proxy de Cámara:', error.message);
    res.status(404).send('Cámara no disponible o error de autenticación');
  }
};

/**
 * Registra una nueva lectura recibida desde el hardware o simulador.
 * Aplica la regla de negocio de autovalidación al 55% de confianza.
 */
exports.crearLectura = async (req, res) => {
  try {
    const { codigo_etiqueta, lpn, linea_origen, camara_id, resultado, confianza, metadata } = req.body;

    let estado_sap = 'pendiente';
    let observacion = null;

    if (confianza >= 55) {
      estado_sap = 'validado';
      observacion = 'Validación automática: Confianza superior al umbral (55%)';
    } else {
      estado_sap = 'error'; 
      observacion = 'Requiere revisión manual: Confianza óptica menor al 55%';
    }

    const lectura = await Lectura.create({
      codigo_etiqueta,
      lpn,
      fecha_hora: new Date(),
      estado_sap,
      linea_origen,
      camara_id,
      resultado,
      confianza,
      observacion,
      metadata_lectura: metadata || {}
    });

    res.status(201).json({ mensaje: 'Lectura registrada', lectura });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Obtiene el listado de lecturas con soporte para filtros y paginación.
 */
exports.obtenerLecturas = async (req, res) => {
  try {
    const { estado, desde, hasta, codigo, pagina = 1, limite = 25 } = req.query;
    const where = {};

    if (estado) where.estado_sap = estado;
    if (codigo) where.codigo_etiqueta = { [Op.iLike]: `%${codigo}%` };
    if (desde && hasta) {
      where.fecha_hora = { [Op.between]: [new Date(desde), new Date(hasta)] };
    }

    const { count, rows: lecturas } = await Lectura.findAndCountAll({
      where,
      include: [
        { model: ConfigCamara, attributes: ['nombre_camara', 'ubicacion'] },
        { model: Usuario, as: 'validador', attributes: ['nombre'] }
      ],
      order: [['fecha_hora', 'DESC']],
      limit: parseInt(limite),
      offset: (parseInt(pagina) - 1) * parseInt(limite)
    });

    res.json({ 
      total: count, 
      pagina: parseInt(pagina), 
      totalPaginas: Math.ceil(count / limite), 
      lecturas 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Permite actualizar o validar manualmente una lectura.
 */
exports.validarLectura = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado_sap, observacion, codigo_etiqueta, lpn, linea_origen } = req.body;

    const lectura = await Lectura.findByPk(id);
    if (!lectura) return res.status(404).json({ error: 'Lectura no encontrada' });
    
    lectura.estado_sap = estado_sap;
    if (observacion) lectura.observacion = observacion;
    if (codigo_etiqueta) lectura.codigo_etiqueta = codigo_etiqueta;
    if (lpn !== undefined) lectura.lpn = lpn;
    if (linea_origen) lectura.linea_origen = linea_origen;

    await lectura.save();
    res.json({ mensaje: 'Lectura validada exitosamente', lectura });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Obtiene las alertas pendientes (lecturas con error o pendientes).
 */
exports.getAlertas = async (req, res) => {
  try {
    const alertas = await Lectura.findAll({
      where: { estado_sap: ['error', 'pendiente'] },
      order: [['fecha_hora', 'DESC']],
      limit: 100
    });

    const alertasFormateadas = alertas.map(alerta => ({
      id: alerta.id,
      lpn: alerta.lpn || 'S/N',
      linea_origen: alerta.linea_origen,
      codigo_etiqueta: alerta.codigo_etiqueta,
      confianza: alerta.confianza,
      estado: alerta.estado_sap,
      fecha: alerta.fecha_hora
    }));

    res.json({ alertas: alertasFormateadas });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Marca una alerta como resuelta tras la intervención del operador.
 */
exports.resolverAlerta = async (req, res) => {
  try {
    const { id } = req.params;
    const lectura = await Lectura.findByPk(id);
    if (!lectura) return res.status(404).json({ error: 'Alerta no encontrada' });
    
    await lectura.update({
      estado_sap: 'resuelto', 
      observacion: 'Validación manual: Operador confirmó y resolvió la incidencia.'
    });
    
    res.json({ mensaje: 'Alerta resuelta con éxito', lectura });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};