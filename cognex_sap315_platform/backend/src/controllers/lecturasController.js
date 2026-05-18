const { Lectura, ConfigCamara, Usuario, LogAlerta } = require('../models');
const { Op } = require('sequelize');
const axios = require('axios');
const xlsx = require('xlsx');

// 🚀 IMPORTACIÓN DE LA UTILIDAD DE LOGS DE AUDITORÍA
const { registrarLog } = require('../utils/auditLogger');

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

    if (req.usuario) {
      await registrarLog(req, 'CAPTURA_LPN_MANUAL', 'MONITOR', { lpn, linea_origen });
    }

    res.status(201).json(nuevaLectura);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

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

exports.validarLecturaManual = async (req, res) => {
  try {
    const { id } = req.params;
    const { lpn_corregido } = req.body;
    const lectura = await Lectura.findByPk(id);
    if (!lectura) return res.status(404).json({ error: 'Lectura no encontrada' });

    const lpnAnterior = lectura.lpn;
    lectura.lpn = lpn_corregido;
    lectura.estado_sap = 'ok';
    await lectura.save();

    await registrarLog(req, 'VALIDAR_LECTURA_MANUAL', 'HISTORICO', { 
      id, 
      lpn_anterior: lpnAnterior, 
      lpn_nuevo: lpn_corregido 
    });

    res.json(lectura);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ============================================================================
// MÓDULO DE ALERTAS E INCIDENCIAS
// ============================================================================
exports.getAlertas = async (req, res) => {
  try {
    // 🚀 CONTROL INTEGRAL: Evaluamos el rol normalizado del operador en planta
    const rolUsuario = (req.usuario?.rol?.nombre_rol || req.usuario?.rol || '').trim().toLowerCase();
    
    if (rolUsuario === 'operador') {
      // Retorna una lista vacía de forma limpia. Evita caídas del Header y rotación de bucles.
      return res.json({ alertas: [] });
    }

    // Supervisores y Administradores cargan las discrepancias reales de Softys
    const alertas = await Lectura.findAll({
      where: { estado_sap: ['error', 'pendiente'] },
      order: [['fecha_hora', 'DESC']],
      limit: 1000
    });
    res.json({ alertas });
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

    await registrarLog(req, 'RESOLVER_ALERTA_INDIVIDUAL', 'ALERTAS', { id, lpn: lectura.lpn });

    res.json({ mensaje: 'Incidencia resuelta satisfactoriamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * ⚡ 1. VALIDACIÓN MASIVA DE ALERTAS POR SELECCIÓN DE CHECKBOXES
 * Resuelve múltiples discrepancias seleccionadas directamente en la interfaz.
 */
exports.validarAlertasMasivo = async (req, res) => {
  try {
    const { alerta_ids } = req.body;

    if (!alerta_ids || !Array.isArray(alerta_ids) || alerta_ids.length === 0) {
      return res.status(400).json({ 
        error: 'No se proporcionaron identificadores de alertas válidos.',
        message: 'No se proporcionaron identificadores de alertas válidos.' 
      });
    }

    await Lectura.update(
      { estado_sap: 'ok' },
      { where: { id: alerta_ids } }
    );

    await registrarLog(req, 'VALIDAR_ALERTAS_MASIVO', 'ALERTAS', { 
      cantidad_seleccionada: alerta_ids.length 
    });

    console.log(`>>> [BACKEND] ⚡ Se validaron masivamente ${alerta_ids.length} alertas en el sistema.`);
    res.json({ 
      mensaje: `Se validaron ${alerta_ids.length} alertas correctamente.`,
      message: `Se validaron ${alerta_ids.length} alertas correctamente.`,
      success: true 
    });
  } catch (error) {
    console.error(">>> [BACKEND] ❌ Error crítico en validarAlertasMasivo:", error.message);
    res.status(500).json({ 
      error: 'Error interno al procesar la validación masiva.', 
      message: error.message 
    });
  }
};

exports.validarTodasLasAlertasDB = async (req, res) => {
  try {
    const cantidadModificada = await Lectura.update(
      { estado_sap: 'ok' },
      { where: { estado_sap: ['error', 'pendiente'] } }
    );

    await registrarLog(req, 'VALIDAR_TODO_EL_SISTEMA', 'ALERTAS', { 
      cantidad_afectados: cantidadModificada[0] 
    });

    console.log(`>>> [BACKEND] 🚀 VALIDACIÓN TOTAL: Se cerraron ${cantidadModificada[0]} incidencias de golpe.`);
    res.json({ 
      mensaje: `Sincronización completa. Se validaron las ${cantidadModificada[0]} incidencias del sistema de forma automática.`,
      message: `Sincronización completa. Se validaron las ${cantidadModificada[0]} incidencias del sistema de forma automática.`,
      success: true,
      afectados: cantidadModificada[0]
    });
  } catch (error) {
    console.error(">>> [BACKEND] ❌ Error crítico en validación absoluta:", error.message);
    res.status(500).json({ 
      error: 'Error interno en la base de datos.', 
      message: error.message 
    });
  }
};

exports.eliminarLectura = async (req, res) => {
  try {
    const { id } = req.params;
    const lectura = await Lectura.findByPk(id);
    
    if (lectura) {
      await registrarLog(req, 'ELIMINAR_LECTURA_INDIVIDUAL', 'LECTURAS', { id, lpn: lectura.lpn });
      await lectura.destroy();
    }

    res.json({ mensaje: 'Registro eliminado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.eliminarTodasAlertas = async (req, res) => {
  try {
    await Lectura.destroy({
      where: {},
      truncate: false 
    });

    await registrarLog(req, 'VACIAR_CENTRO_INCIDENCIAS', 'ALERTAS', 'Se eliminó por completo el historial del turno');

    res.json({ mensaje: "Todas las incidencias han sido eliminadas permanentemente." });
  } catch (error) {
    console.error("Error al vaciar alertas:", error.message);
    res.status(500).json({ error: "Error interno al intentar vaciar el historial." });
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
// MÓDULO: AUDITORÍA EXCEL SOFTYS (VERSIÓN ROBUSTA)
// ============================================================================
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
 * ⚡ 2. VERIFICADO: VALIDACIÓN MASIVA DEL FLUJO DE AUDITORÍA EXCEL
 * Procesa la carga e inserta faltantes como incidencias de tipo 'error'.
 */
exports.validarMasivo = async (req, res) => {
  try {
    const { resultados } = req.body;
    if (!resultados || !Array.isArray(resultados)) {
      return res.status(400).json({ error: 'Detalle no recibido.' });
    }
    
    const lpnsOk = resultados.filter(r => r.estado === 'Match Perfecto').map(r => r.lpn);
    if (lpnsOk.length > 0) {
      await Lectura.update({ estado_sap: 'ok' }, { where: { lpn: lpnsOk } });
    }

    const noDet = resultados.filter(r => r.estado === 'No Detectado');
    if (noDet.length > 0) {
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

    // REGISTRO DE AUDITORÍA DE PARÁMETROS MASIVOS
    await registrarLog(req, 'SINCRONIZAR_AUDITORIA_EXCEL', 'AUDITORIA_CARGA', {
      validados: lpnsOk.length,
      alertas_creadas: noDet.length
    });

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