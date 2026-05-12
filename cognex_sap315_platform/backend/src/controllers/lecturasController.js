const { Lectura, ConfigCamara, Usuario, LogAlerta } = require('../models');
const { Op } = require('sequelize');
const axios = require('axios');
const xlsx = require('xlsx');

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
    console.error('❌ Error en Proxy:', error.message);
    res.status(404).send('Servicio no disponible');
  }
};

/**
 * Crea una nueva lectura desde la Pistola RF.
 */
exports.crearLectura = async (req, res) => {
  try {
    // Ahora la RF solo nos manda lpn y linea_origen
    const { lpn, linea_origen } = req.body;

    if (!lpn || !linea_origen) {
      return res.status(400).json({ error: 'Faltan campos obligatorios (lpn, linea_origen)' });
    }

    // 🚀 Lógica de Prevención de Duplicados (Cooldown de 5 segundos para el mismo LPN)
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

    // Guardar en la base de datos (SAP315)
    const nuevaLectura = await Lectura.create({
      lpn,
      linea_origen,
      estado_sap: 'ok', // Asumimos OK porque la RF no se equivoca al leer
      fecha_hora: new Date()
    });

    res.status(201).json({ mensaje: 'Lectura registrada', lectura: nuevaLectura });
  } catch (error) {
    console.error('❌ Error al crear lectura:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * 🚀 AQUÍ ESTABA EL ERROR 500: Obligamos a pedir solo las columnas existentes
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
    if (!lectura) {
      return res.status(404).json({ error: 'Lectura no encontrada' });
    }

    lectura.lpn = lpn_corregido;
    lectura.estado_sap = 'ok';
    lectura.usuario_validador_id = usuario_id; 

    await lectura.save();
    res.json({ mensaje: 'Lectura validada exitosamente', lectura });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * 🚀 AQUÍ TAMBIÉN EVITAMOS EL ERROR DE COLUMNAS INEXISTENTES
 */
exports.getAlertas = async (req, res) => {
  try {
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

    res.json({ mensaje: 'Alerta resuelta con éxito' });
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
    res.json({ mensaje: 'Lectura eliminada permanentemente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

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
// MÓDULO: RECONCILIACIÓN DE INVENTARIO (LPN PURGE)
// ============================================================================
exports.compararConExcel = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se ha subido ningún archivo Excel.' });
    }

    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const datosEmpresa = xlsx.utils.sheet_to_json(sheet);

    const fechaAnalisis = req.body.fecha_analisis || new Date().toISOString().split('T')[0];
    const inicioDia = new Date(`${fechaAnalisis}T00:00:00.000Z`);
    const finDia = new Date(`${fechaAnalisis}T23:59:59.999Z`);

    const nuestrasLecturas = await Lectura.findAll({
      where: {
        fecha_hora: {
          [Op.gte]: inicioDia,
          [Op.lte]: finDia
        }
      },
      attributes: ['lpn', 'fecha_hora'] // Limpio
    });

    const resultadosCruce = [];
    const lpnEmpresaSet = new Set();

    datosEmpresa.forEach((item) => {
      const lpnExcel = item.LPN || item.lpn || item.Lpn;
      const ordenExcel = item.ORDEN || item.Orden || item.orden || 'N/A';

      if (!lpnExcel) return;

      const lpnStr = String(lpnExcel).trim();
      lpnEmpresaSet.add(lpnStr);

      const coincidencia = nuestrasLecturas.find((l) => String(l.lpn) === lpnStr);

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

    nuestrasLecturas.forEach((lectura) => {
      const lpnLeido = lectura.lpn;
      
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

    const resumen = {
      total_excel: lpnEmpresaSet.size,
      total_sap315: nuestrasLecturas.length,
      match_perfecto: resultadosCruce.filter(r => r.estado === 'Match Perfecto').length,
      faltantes: resultadosCruce.filter(r => r.estado === 'Faltante (Miss)').length,
      extras: resultadosCruce.filter(r => r.estado === 'Extra (Ghost)').length
    };

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