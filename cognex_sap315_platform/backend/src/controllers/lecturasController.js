const { Lectura, ConfigCamara, Usuario, LogAlerta } = require('../models');
const { Op } = require('sequelize');
const axios = require('axios');
const xlsx = require('xlsx');

// ============================================================================
// SERVICIOS EXTERNOS (COGNEX)
// ============================================================================

exports.proxyCamara = async (req, res) => {
  try {
    const { COGNEX_IP, COGNEX_PORT_HMI, COGNEX_USER, COGNEX_PASS } = process.env;
    const url = `http://${COGNEX_IP}:${COGNEX_PORT_HMI}/image.jpg`;
    
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
    console.error('❌ Error en Proxy Cognex:', error.message);
    res.status(404).send('Servicio de cámara no disponible');
  }
};

// ============================================================================
// GESTIÓN DE LECTURAS INDIVIDUALES
// ============================================================================

exports.crearLectura = async (req, res) => {
  try {
    const { lpn, linea_origen } = req.body;

    if (!lpn || !linea_origen) {
      return res.status(400).json({ error: 'Faltan campos obligatorios (lpn, linea_origen)' });
    }

    // Cooldown de 5 segundos para evitar duplicados accidentales de la cámara o pistola
    const limiteTiempo = new Date(new Date() - 5000); 
    const lecturaDuplicada = await Lectura.findOne({
      where: {
        lpn: lpn,
        fecha_hora: { [Op.gte]: limiteTiempo }
      }
    });

    if (lecturaDuplicada) {
      return res.status(200).json({ 
        mensaje: 'Lectura ignorada por duplicidad reciente', 
        lectura: lecturaDuplicada 
      });
    }

    const nuevaLectura = await Lectura.create({
      lpn,
      linea_origen,
      estado_sap: 'pendiente',
      fecha_hora: new Date()
    });

    res.status(201).json({ mensaje: 'Lectura registrada correctamente', lectura: nuevaLectura });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getLecturas = async (req, res) => {
  try {
    const { pagina = 1, limite = 20, estado } = req.query;
    const offset = (pagina - 1) * limite;
    
    const whereClause = {};
    if (estado) whereClause.estado_sap = estado;

    const lecturas = await Lectura.findAndCountAll({
      where: whereClause,
      attributes: ['id', 'lpn', 'fecha_hora', 'estado_sap', 'linea_origen'],
      order: [['fecha_hora', 'DESC']],
      limit: parseInt(limite),
      offset: parseInt(offset)
    });

    res.json({
      total: lecturas.count,
      paginas: Math.ceil(lecturas.count / limite),
      actual: parseInt(pagina),
      lecturas: lecturas.rows
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.validarLecturaManual = async (req, res) => {
  try {
    const { id } = req.params;
    const { lpn_corregido, usuario_id } = req.body;

    const lectura = await Lectura.findByPk(id);
    if (!lectura) return res.status(404).json({ error: 'Lectura no encontrada' });

    lectura.lpn = lpn_corregido;
    lectura.estado_sap = 'ok';
    lectura.usuario_validador_id = usuario_id; 

    await lectura.save();
    res.json({ mensaje: 'Lectura validada exitosamente', lectura });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ============================================================================
// MÓDULO DE ALERTAS E INCIDENCIAS
// ============================================================================

exports.getAlertas = async (req, res) => {
  try {
    // Las alertas incluyen tanto errores de cámara como faltantes de auditoría
    const alertas = await Lectura.findAll({
      where: { estado_sap: ['error', 'pendiente'] },
      attributes: ['id', 'lpn', 'linea_origen', 'estado_sap', 'fecha_hora'],
      order: [['fecha_hora', 'DESC']],
      limit: 100
    });

    const alertasFormateadas = alertas.map(alerta => ({
      id: alerta.id,
      lpn: alerta.lpn || 'S/N',
      linea_origen: alerta.linea_origen,
      estado: alerta.estado_sap,
      fecha: alerta.fecha_hora
    }));

    res.json({ alertas: alertasFormateadas });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.resolverAlerta = async (req, res) => {
  try {
    const { id } = req.params;
    const lectura = await Lectura.findByPk(id);
    
    if (!lectura) return res.status(404).json({ error: 'Alerta no encontrada' });

    lectura.estado_sap = 'ok';
    await lectura.save();

    res.json({ mensaje: 'Incidencia resuelta satisfactoriamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.eliminarLectura = async (req, res) => {
  try {
    const { id } = req.params;
    const lectura = await Lectura.findByPk(id);
    if (!lectura) return res.status(404).json({ error: 'Lectura no encontrada' });
    await lectura.destroy();
    res.json({ mensaje: 'Registro eliminado permanentemente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.estadisticas = async (req, res) => {
  try {
    const total = await Lectura.count();
    const ok = await Lectura.count({ where: { estado_sap: 'ok' } });
    const pendientes = await Lectura.count({ where: { estado_sap: 'pendiente' } });
    const errores = await Lectura.count({ where: { estado_sap: 'error' } });

    res.json({ total, ok, pendientes, errores });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ============================================================================
// MÓDULO: RECONCILIACIÓN DE INVENTARIO (AUDITORÍA EXCEL SOFTYS)
// ============================================================================

/**
 * 🚀 COMPARACIÓN INTELIGENTE: Identifica duplicados, alertas previas y matches.
 */
exports.compararConExcel = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No se recibió ningún archivo.' });

    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const dataExcel = xlsx.utils.sheet_to_json(sheet, { defval: "" });

    if (dataExcel.length === 0) return res.status(400).json({ error: 'El archivo Excel está vacío.' });

    const encabezados = Object.keys(dataExcel[0]);
    const colLPN = encabezados.find(h => /LPN|PALLET/i.test(h));
    const colOrden = encabezados.find(h => /ORDEN|ENTREGA/i.test(h));

    if (!colLPN) return res.status(400).json({ error: 'No se encontró la columna LPN en el archivo.' });

    const lpnsExcel = [...new Set(dataExcel.map(fila => String(fila[colLPN]).trim()).filter(l => l !== ""))];

    // 🚀 SINCRONÍA: Buscamos TODOS los estados actuales de estos LPN en la base de datos
    const lecturasExistentes = await Lectura.findAll({
      where: { lpn: { [Op.in]: lpnsExcel } },
      attributes: ['lpn', 'estado_sap']
    });

    // Mapa de búsqueda rápida
    const estadoMapa = new Map(lecturasExistentes.map(l => [l.lpn, l.estado_sap]));

    const resultados = dataExcel.map(fila => {
      const lpn = String(fila[colLPN]).trim();
      const estadoActual = estadoMapa.get(lpn);

      let estadoCruce = 'No Detectado';
      let detalle = 'Este LPN no figura en las lecturas de cámara o pistola.';

      if (estadoActual === 'ok') {
          estadoCruce = 'Ya Validado';
          detalle = 'Este pallet ya fue auditado y procesado exitosamente.';
      } else if (estadoActual === 'pendiente') {
          estadoCruce = 'Match Perfecto';
          detalle = 'Listo para sincronizar con SAP 315.';
      } else if (estadoActual === 'error') {
          estadoCruce = 'En Alerta';
          detalle = 'Ya existe una incidencia activa en el Centro de Alertas.';
      }

      return {
        lpn,
        orden: colOrden ? String(fila[colOrden]).trim() : 'N/A',
        estado: estadoCruce,
        detalle
      };
    });

    res.json({ 
      resultados, 
      resumen: {
        total_excel: dataExcel.length,
        pendientes_validar: resultados.filter(r => r.estado === 'Match Perfecto').length,
        ya_procesados: resultados.filter(r => r.estado === 'Ya Validado').length,
        incidencias_previas: resultados.filter(r => r.estado === 'En Alerta').length,
        nuevas_alertas: resultados.filter(r => r.estado === 'No Detectado').length
      } 
    });

  } catch (error) {
    console.error('❌ Error en Comparación Excel:', error);
    res.status(500).json({ error: 'Fallo al procesar el archivo Excel de Softys.' });
  }
};

/**
 * 🚀 VALIDACIÓN MASIVA BLINDADA: Evita duplicar alertas y registros ya validados.
 */
exports.validarMasivo = async (req, res) => {
  try {
    const { resultados } = req.body;

    if (!resultados || !Array.isArray(resultados)) {
      return res.status(400).json({ error: 'No se recibió el detalle de auditoría.' });
    }

    // 1. Filtrar los que realmente deben pasar a 'ok' (solo si estaban 'pendiente')
    const lpnsParaOk = resultados
      .filter(r => r.estado === 'Match Perfecto')
      .map(r => r.lpn);

    if (lpnsParaOk.length > 0) {
      await Lectura.update(
        { estado_sap: 'ok' },
        { where: { lpn: lpnsParaOk, estado_sap: 'pendiente' } }
      );
    }

    // 2. Filtrar los que realmente son nuevos errores (no existen en la BD)
    const lpnsParaAlerta = resultados.filter(r => r.estado === 'No Detectado');

    if (lpnsParaAlerta.length > 0) {
      const alertasNuevas = lpnsParaAlerta.map(f => ({
        lpn: f.lpn,
        linea_origen: 'AUDITORIA_SISTEMA',
        estado_sap: 'error',
        fecha_hora: new Date(),
        observaciones: `AUTO-ALERTA: El sistema reporta este pallet (Orden: ${f.orden}) como no detectado.`
      }));

      await Lectura.bulkCreate(alertasNuevas);
    }

    res.json({ 
      mensaje: 'Proceso de sincronización terminado.',
      validados: lpnsParaOk.length,
      alertasCreadas: lpnsParaAlerta.length
    });

  } catch (error) {
    console.error('❌ Error en Validación Masiva:', error);
    res.status(500).json({ error: 'Error interno al sincronizar la base de datos.' });
  }
};