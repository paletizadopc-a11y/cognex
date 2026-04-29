const { Lectura, ConfigCamara, Usuario, LogAlerta } = require('../models');
const { Op } = require('sequelize');

exports.crearLectura = async (req, res) => {
  try {
    // 🚀 LPN añadido para recibirlo del simulador
    const { codigo_etiqueta, lpn, linea_origen, camara_id, resultado, confianza, metadata } = req.body;

    // 🚀 REGLA DE NEGOCIO: Autovalidación al 55%
    let estado_sap = 'pendiente';
    let observacion = null;

    if (confianza >= 55) {
      estado_sap = 'validado';
      observacion = 'Validación automática: Confianza superior al umbral (55%)';
    } else {
      estado_sap = 'error'; // Esto hará que caiga en el panel de Alertas
      observacion = 'Requiere revisión manual: Confianza óptica menor al 55%';
    }

    const lectura = await Lectura.create({
      codigo_etiqueta,
      lpn, // Guardamos el LPN del pallet
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

exports.validarLectura = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado_sap, observacion, codigo_etiqueta, lpn, linea_origen } = req.body;

    const lectura = await Lectura.findByPk(id);
    if (!lectura) {
      return res.status(404).json({ error: 'Lectura no encontrada' });
    }
    
    // Actualizamos los campos recibidos
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

// ==========================================
// 🚀 NUEVO MÓDULO DE ALERTAS
// ==========================================

// Obtener todas las alertas (lecturas que fallaron o están pendientes)
exports.getAlertas = async (req, res) => {
  try {
    const alertas = await Lectura.findAll({
      where: {
        estado_sap: ['error', 'pendiente'] // Trae las que no pasaron la autovalidación
      },
      order: [['fecha_hora', 'DESC']],
      limit: 100 // Límite por rendimiento
    });

    // Mapeamos los datos para que el frontend los reciba con los nombres que espera
    const alertasFormateadas = alertas.map(alerta => ({
      id: alerta.id,
      lpn: alerta.lpn || 'S/N',
      linea_origen: alerta.linea_origen,
      codigo_etiqueta: alerta.codigo_etiqueta,
      confianza: alerta.confianza,
      estado: alerta.estado_sap, // Renombramos estado_sap a estado para el frontend
      fecha: alerta.fecha_hora   // Renombramos fecha_hora a fecha para el frontend
    }));

    res.json({ alertas: alertasFormateadas });
  } catch (error) {
    console.error(">>> [BACKEND] Error al obtener alertas:", error.message);
    res.status(500).json({ error: error.message });
  }
};

// Resolver (Validar manualmente) una alerta
exports.resolverAlerta = async (req, res) => {
  try {
    const { id } = req.params;
    const lectura = await Lectura.findByPk(id);
    
    if (!lectura) {
      return res.status(404).json({ error: 'Alerta no encontrada' });
    }
    
    // Cambiamos el estado para que desaparezca de las pendientes
    await lectura.update({ 
      estado_sap: 'resuelto', 
      observacion: 'Validación manual: Operador confirmó y resolvió la incidencia.'
    });
    
    res.json({ mensaje: 'Alerta resuelta con éxito', lectura });
  } catch (error) {
    console.error(">>> [BACKEND] Error al resolver alerta:", error.message);
    res.status(500).json({ error: error.message });
  }
};