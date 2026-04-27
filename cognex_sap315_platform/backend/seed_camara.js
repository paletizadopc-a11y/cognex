// backend/seed_camara.js
require('dotenv').config();
const { sequelize, ConfigCamara } = require('./src/models');

async function registrarCamara() {
  try {
    console.log('🔄 Conectando a la base de datos...');
    await sequelize.authenticate();

    // Buscamos o creamos la cámara con ID 1
    await ConfigCamara.findOrCreate({
      where: { id: 1 },
      defaults: {
        nombre_camara: 'Cámara Principal Cognex',
        ip: '192.168.1.100',
        puerto: 23,
        ubicacion: 'Línea de Producción 1',
        estado: 'activo'
      }
    });

    console.log('✅ Cámara ID 1 registrada con éxito en el sistema.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error registrando la cámara:', error);
    process.exit(1);
  }
}

registrarCamara();