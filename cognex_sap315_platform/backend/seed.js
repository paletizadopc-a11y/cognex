// backend/seed.js
require('dotenv').config();
const bcrypt = require('bcryptjs');
const { sequelize, Rol, Usuario } = require('./src/models');

async function poblarBaseDeDatos() {
  try {
    console.log('🔄 Conectando a la base de datos...');
    await sequelize.authenticate();
    console.log('✅ Conexión establecida.');

    // 1. Crear los Roles por defecto
    console.log('📝 Creando roles...');
    const roles = [
      { nombre_rol: 'admin', descripcion: 'Administrador total del sistema' },
      { nombre_rol: 'supervisor', descripcion: 'Supervisor de línea SAP 315' },
      { nombre_rol: 'operador', descripcion: 'Operador de hardware Cognex' }
    ];

    for (const rolData of roles) {
      await Rol.findOrCreate({
        where: { nombre_rol: rolData.nombre_rol },
        defaults: rolData
      });
    }
    console.log('✅ Roles creados.');

    // 2. Obtener el ID del rol de administrador
    const rolAdmin = await Rol.findOne({ where: { nombre_rol: 'admin' } });

    // 3. Crear el Usuario Administrador Inicial
    console.log('👤 Creando usuario administrador...');
    const emailAdmin = 'admin@softys.com';
    const passwordPlana = 'Softys2026!'; // Contraseña temporal
    
    // Generar el hash de la contraseña (igual que en tu authController)
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(passwordPlana, salt);

    await Usuario.findOrCreate({
      where: { email: emailAdmin },
      defaults: {
        nombre: 'Administrador Sistema',
        email: emailAdmin,
        password_hash: password_hash,
        rol_id: rolAdmin.id,
        activo: true
      }
    });

    console.log('✅ Usuario administrador creado con éxito.');
    console.log('--------------------------------------------------');
    console.log(`✉️  Email: ${emailAdmin}`);
    console.log(`🔑 Contraseña: ${passwordPlana}`);
    console.log('--------------------------------------------------');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error poblando la base de datos:', error);
    process.exit(1);
  }
}

poblarBaseDeDatos();