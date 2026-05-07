const { Lectura, ConfigCamara, Usuario, LogAlerta } = require('../models');
const { Op } = require('sequelize');
const axios = require('axios');
const xlsx = require('xlsx'); // 🚀 NUEVA LIBRERÍA: Necesaria para el cruce de datos

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
    res.status(404).send('Cámara no disponible');
  }
};

/**
 * Crea una nueva lectura desde la cámara (Backend o Python).
 */
exports.crearLectura = async (req, res) => {
  try {
    const { lpn, linea_origen, codigo_etiqueta, metadata } = req.body;

    // Validación básica de campos requeridos
    if (!codigo_etiqueta || !linea_origen) {
      return res.status(400).json({ error: 'Faltan campos obligatorios (codigo_etiqueta, linea_origen)' });
    }

    // 🚀 Lógica de Prevención de Duplicados (Cooldown de 5 segundos)
    const limiteTiempo = new Date(new Date() - 5000); 
    const lecturaDuplicada = await Lectura.findOne({
      where: {
        codigo_etiqueta,
        fecha_hora: { [Op.gte]: limiteTiempo }
      }
    });

    if (lecturaDuplicada) {
      return res.status(200).json({ 
        mensaje: 'Lectura ignorada por duplicidad reciente', 
        lectura: lecturaDuplicada 
      });
    }

    // Determinar el estado y la confianza de la lectura
    const confianza = req.body.confianza || 99.0;
    const estado_sap = confianza >= 90 ? 'ok' : 'error';

    // Guardar en la base de datos (SAP315)
    const nuevaLectura = await Lectura.create({
      lpn,
      linea_origen,
      codigo_etiqueta,
      confianza,
      estado_sap,
      fecha_hora: new Date(),
      metadata: metadata || {}
    });

    // Si hubo un error (ej. código ilegible), registramos la alerta
    if (estado_sap === 'error') {
      await LogAlerta.create({
        tipo_alerta: 'Lectura de Baja Confianza',
        descripcion: `El pallet con código ${codigo_etiqueta} no superó el umbral de confianza (${confianza}%).`,
        lectura_id: nuevaLectura.id,
        fecha_alerta: new Date()
      });
    }

    res.status(201).json({ mensaje: 'Lectura registrada', lectura: nuevaLectura });
  } catch (error) {
    console.error('❌ Error al crear lectura:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Obtiene lecturas paginadas para el Monitor Visual (Dashboard).
 */
exports.getLecturas = async (req, res) => {
  try {
    const { pagina = 1, limite = 20, estado } = req.query;
    const offset = (pagina - 1) * limite;
    
    const whereClause = {};
    if (estado) {
      whereClause.estado_sap = estado;
    }

    const lecturas = await Lectura.findAndCountAll({
      where: whereClause,
      order: [['fecha_hora', 'DESC']],
      limit: parseInt(limite),
      offset: parseInt(offset)
    });

    res.json({
      total: lecturas.count,
      paginas: Math.ceil(lecturas.count / limite),
      actual: parseInt(pagina),
      datos: lecturas.rows
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Validación manual de una lectura por el operador en el dashboard.
 */
exports.validarLecturaManual = async (req, res) => {
  try {
    const { id } = req.params;
    const { lpn_corregido, usuario_id } = req.body;

    const lectura = await Lectura.findByPk(id);
    if (!lectura) {
      return res.status(404).json({ error: 'Lectura no encontrada' });
    }

    lectura.lpn = lpn_corregido;
    lectura.estado_sap = 'ok';
    lectura.metadata = {
      ...lectura.metadata,
      validado_manualmente: true,
      usuario_validador: usuario_id,
      fecha_validacion: new Date()
    };

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

    lectura.estado_sap = 'ok';
    await lectura.save();

    res.json({ mensaje: 'Alerta resuelta con éxito' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Elimina una lectura (Soft delete o Hard delete según reglas).
 */
exports.eliminarLectura = async (req, res) => {
  try {
    const { id } = req.params;
    const lectura = await Lectura.findByPk(id);
    
    if (!lectura) return res.status(404).json({ error: 'Lectura no encontrada' });

    await lectura.destroy();
    res.json({ mensaje: 'Lectura eliminada permanentemente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Devuelve KPIs generales para el Dashboard Principal.
 */
exports.estadisticas = async (req, res) => {
  try {
    const total = await Lectura.count();
    const ok = await Lectura.count({ where: { estado_sap: 'ok' } });
    const errores = await Lectura.count({ where: { estado_sap: ['error', 'pendiente'] } });

    res.json({ total, ok, errores });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// ============================================================================
// 🚀 NUEVO MÓDULO: RECONCILIACIÓN DE INVENTARIO (DATA CROSS-CHECK)
// ============================================================================

/**
 * Recibe un archivo Excel de Softys y lo compara contra las lecturas de SAP315.
 * Requiere que la ruta en Express use multer: upload.single('excel')
 */
exports.compararConExcel = async (req, res) => {
  try {
    // 1. Validar que exista el archivo
    if (!req.file) {
      return res.status(400).json({ error: 'No se ha subido ningún archivo Excel.' });
    }

    // 2. Leer y parsear el Excel en memoria
    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0]; // Tomamos la primera hoja
    const sheet = workbook.Sheets[sheetName];
    const datosEmpresa = xlsx.utils.sheet_to_json(sheet);

    // 3. Obtener la fecha de análisis (por defecto hoy, o la enviada por frontend)
    const fechaAnalisis = req.body.fecha_analisis || new Date().toISOString().split('T')[0];
    const inicioDia = new Date(`${fechaAnalisis}T00:00:00.000Z`);
    const finDia = new Date(`${fechaAnalisis}T23:59:59.999Z`);

    // 4. Buscar lecturas de nuestra BD (SAP315) en ese rango de fecha
    const nuestrasLecturas = await Lectura.findAll({
      where: {
        fecha_hora: {
          [Op.gte]: inicioDia,
          [Op.lte]: finDia
        }
      }
    });

    const resultadosCruce = [];
    const lpnEmpresaSet = new Set();

    // 5. Fase 1: Analizar lo que pide el Excel vs lo que leyó la cámara
    datosEmpresa.forEach((item) => {
      // Flexibilidad para mayúsculas/minúsculas en el Excel
      const lpnExcel = item.LPN || item.lpn || item.Lpn;
      const ordenExcel = item.ORDEN || item.Orden || item.orden || 'N/A';

      if (!lpnExcel) return; // Ignorar filas vacías

      const lpnStr = String(lpnExcel).trim();
      lpnEmpresaSet.add(lpnStr);

      // Buscar si el LPN está en nuestra base de datos (por LPN o por código crudo)
      const coincidencia = nuestrasLecturas.find((l) => 
        String(l.lpn) === lpnStr || String(l.codigo_etiqueta) === lpnStr
      );

      if (coincidencia) {
        resultadosCruce.push({
          lpn: lpnStr,
          orden: ordenExcel,
          estado: 'Match Perfecto',
          fecha_lectura: coincidencia.fecha_hora,
          detalle: 'El pallet figura en el Excel y fue leído correctamente.'
        });
      } else {
        resultadosCruce.push({
          lpn: lpnStr,
          orden: ordenExcel,
          estado: 'Faltante (Miss)',
          fecha_lectura: null,
          detalle: 'El pallet está en la planificación, pero la cámara NO lo detectó.'
        });
      }
    });

    // 6. Fase 2: Analizar pallets Fantasmas (Leídos por la cámara, pero que NO están en el Excel)
    nuestrasLecturas.forEach((lectura) => {
      const lpnLeido = lectura.lpn || lectura.codigo_etiqueta;
      
      // Si la cámara leyó algo que no está en la lista del Set del Excel
      if (lpnLeido && !lpnEmpresaSet.has(String(lpnLeido))) {
        resultadosCruce.push({
          lpn: lpnLeido,
          orden: 'Desconocida',
          estado: 'Extra (Ghost)',
          fecha_lectura: lectura.fecha_hora,
          detalle: 'Pallet leído en la cinta, pero que NO figura en el archivo Excel.'
        });
      }
    });

    // 7. Generar resumen ejecutivo para los KPIs del Frontend
    const resumen = {
      total_excel: lpnEmpresaSet.size,
      total_sap315: nuestrasLecturas.length,
      match_perfecto: resultadosCruce.filter(r => r.estado === 'Match Perfecto').length,
      faltantes: resultadosCruce.filter(r => r.estado === 'Faltante (Miss)').length,
      extras: resultadosCruce.filter(r => r.estado === 'Extra (Ghost)').length
    };

    // 8. Responder con la data estructurada
    res.json({
      mensaje: 'Reconciliación de inventario completada',
      resumen,
      resultados: resultadosCruce
    });

  } catch (error) {
    console.error('❌ Error en el cruce con Excel:', error);
    res.status(500).json({ error: 'Error interno al procesar el archivo Excel.' });
  }
};