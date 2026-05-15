const { Lectura, ConfigCamara, Usuario, LogAlerta } = require('../models');
const { Op } = require('sequelize');
const axios = require('axios');
const xlsx = require('xlsx');

// ============================================================================
// SERVICIOS EXTERNOS (COGNEX)
// ============================================================================

/**
 * Actúa como puente para obtener la imagen en vivo de la cámara Cognex 
 * sorteando problemas de CORS y autenticación en el frontend.
 */
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

/**
 * Registra una nueva lectura (LPN) detectada por la cámara.
 * Implementa un cooldown de 5 segundos para evitar duplicidad.
 */
exports.crearLectura = async (req, res) => {
  try {
    const { lpn, linea_origen } = req.body;
    if (!lpn || !linea_origen) {
      return res.status(400).json({ error: 'Faltan campos obligatorios (lpn, linea_origen)' });
    }

    const limiteTiempo = new Date(new Date() - 5000); 
    const lecturaDuplicada = await Lectura.findOne({
      where: {
        lpn: lpn,
        fecha_hora: { [Op.gte]: limiteTiempo }
      }
    });

    if (lecturaDuplicada) {
      return res.status(200).json({ mensaje: 'Lectura ignorada por duplicidad reciente' });
    }

    const nuevaLectura = await Lectura.create({
      lpn,
      linea_origen,
      estado_sap: 'pendiente',
      fecha_hora: new Date()
    });

    res.status(201).json(nuevaLectura);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Obtiene el listado de lecturas con paginación para el módulo de histórico.
 */
exports.getLecturas = async (req, res) => {
  try {
    const { pagina = 1, limite = 20 } = req.query;
    const offset = (pagina - 1) * limite;
    
    const lecturas = await Lectura.findAndCountAll({
      order: [['fecha_hora', 'DESC']],
      limit: parseInt(limite),
      offset: parseInt(offset)
    });

    res.json({
      total: lecturas.count,
      lecturas: lecturas.rows
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Permite validar manualmente una lectura o corregir su LPN.
 */
exports.validarLecturaManual = async (req, res) => {
  try {
    const { id } = req.params;
    const { lpn_corregido } = req.body;
    const lectura = await Lectura.findByPk(id);
    if (!lectura) return res.status(404).json({ error: 'Lectura no encontrada' });

    lectura.lpn = lpn_corregido;
    lectura.estado_sap = 'ok';
    await lectura.save();
    res.json(lectura);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ============================================================================
// MÓDULO DE ALERTAS E INCIDENCIAS
// ============================================================================

/**
 * Obtiene las lecturas que requieren atención (pendientes o con error).
 */
exports.getAlertas = async (req, res) => {
  try {
    const alertas = await Lectura.findAll({
      where: { estado_sap: ['error', 'pendiente'] },
      order: [['fecha_hora', 'DESC']],
      limit: 100
    });
    res.json({ alertas });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Resuelve una incidencia validándola físicamente.
 */
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

/**
 * Elimina un registro de lectura individual.
 */
exports.eliminarLectura = async (req, res) => {
  try {
    const { id } = req.params;
    await Lectura.destroy({ where: { id } });
    res.json({ mensaje: 'Registro eliminado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Borrar todas las incidencias (Alertas) del historial.
 */
exports.eliminarTodasAlertas = async (req, res) => {
  try {
    await Lectura.destroy({
      where: {},
      truncate: false 
    });

    res.json({ mensaje: "Todas las incidencias han sido eliminadas permanentemente." });
  } catch (error) {
    console.error("Error al vaciar alertas:", error.message);
    res.status(500).json({ error: "Error interno al intentar vaciar el historial." });
  }
};

/**
 * Métricas para el Dashboard principal.
 */
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
// MÓDULO: AUDITORÍA EXCEL SOFTYS (VERSIÓN ROBUSTA)
// ============================================================================

/**
 * Cruza el Excel de planificación con la BD.
 * Identifica LPNs existentes en cualquier estado para validación automática.
 */
exports.compararConExcel = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Archivo no recibido.' });

    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    let dataExcel = [];
    let sheetNameEncontrada = "";

    for (const name of workbook.SheetNames) {
      const sheet = workbook.Sheets[name];
      const jsonData = xlsx.utils.sheet_to_json(sheet, { defval: "" });
      
      if (jsonData.length > 0) {
        const encabezados = Object.keys(jsonData[0]);
        const colLPN = encabezados.find(h => /LPN|PALLET|ETIQUETA/i.test(h));
        
        if (colLPN) {
          dataExcel = jsonData.filter(row => String(row[colLPN]).trim() !== "");
          sheetNameEncontrada = name;
          break; 
        }
      }
    }

    if (dataExcel.length === 0) return res.status(400).json({ error: 'No se detectaron LPNs válidos.' });

    const encabezados = Object.keys(dataExcel[0]);
    const colLPN = encabezados.find(h => /LPN|PALLET|ETIQUETA/i.test(h));
    const colOrden = encabezados.find(h => /ORDEN|ENTREGA|FABRICACI[OÓ]N/i.test(h));

    const lpnsEnArchivo = [...new Set(dataExcel.map(fila => String(fila[colLPN]).trim()))];
    const existentes = await Lectura.findAll({ 
      where: { lpn: { [Op.in]: lpnsEnArchivo } },
      attributes: ['lpn', 'estado_sap']
    });
    
    const estadoMapa = new Map(existentes.map(l => [l.lpn, l.estado_sap]));

    const resultados = dataExcel.map(fila => {
      const lpn = String(fila[colLPN]).trim();
      const estBD = estadoMapa.get(lpn);
      
      let estadoCruce = 'No Detectado'; 
      let detalle = 'El LPN no ha sido registrado por la cámara.';

      if (estBD === 'ok') {
        estadoCruce = 'Ya Validado'; 
        detalle = 'Este registro ya fue auditado previamente.';
      } else if (estBD) {
        estadoCruce = 'Match Perfecto'; 
        detalle = `Detectado en sistema (${estBD.toUpperCase()}). Listo para validar.`;
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
        total_excel: resultados.length,
        pendientes_validar: resultados.filter(r => r.estado === 'Match Perfecto').length,
        ya_procesados: resultados.filter(r => r.estado === 'Ya Validado').length,
        nuevas_alertas: resultados.filter(r => r.estado === 'No Detectado').length,
        hojaProcesada: sheetNameEncontrada
      } 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * 🚀 SOLUCIÓN AL ERROR 500: Validación masiva con manejo de duplicidad.
 * Sincroniza los matches y crea alertas para los faltantes ignorando duplicados existentes.
 */
exports.validarMasivo = async (req, res) => {
  try {
    const { resultados } = req.body;
    if (!resultados || !Array.isArray(resultados)) {
      return res.status(400).json({ error: 'Detalle no recibido.' });
    }
    
    // 1. Validar los que hicieron match (Pasar a 'ok')
    const lpnsOk = resultados.filter(r => r.estado === 'Match Perfecto').map(r => r.lpn);
    if (lpnsOk.length > 0) {
      await Lectura.update({ estado_sap: 'ok' }, { where: { lpn: lpnsOk } });
    }

    // 2. Insertar los faltantes con protección de duplicidad (ignoreDuplicates: true)
    const noDet = resultados.filter(r => r.estado === 'No Detectado');
    if (noDet.length > 0) {
      /**
       * Se utiliza ignoreDuplicates para evitar errores de llave única (PK/Unique)
       * si un LPN ya existe en la base de datos de una sesión previa.
       */
      await Lectura.bulkCreate(noDet.map(f => ({
        lpn: f.lpn, 
        linea_origen: 'AUDITORIA_SISTEMA', 
        estado_sap: 'error', 
        fecha_hora: new Date(),
        observaciones: `Faltante detectado en Auditoría (Orden: ${f.orden})`
      })), { 
        ignoreDuplicates: true 
      }); 
    }

    res.json({ 
      mensaje: `Sincronización terminada. ${lpnsOk.length} registros validados.`,
      validados: lpnsOk.length,
      alertas_creadas: noDet.length
    });
  } catch (error) {
    console.error(">>> [ERROR SINCRONIZACIÓN]:", error.message);
    res.status(500).json({ error: 'Error al procesar la carga masiva. Verifique duplicidad de LPNs.' });
  }
};