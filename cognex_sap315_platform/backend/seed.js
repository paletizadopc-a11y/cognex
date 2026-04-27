require('dotenv').config();
const bcrypt = require('bcryptjs');
// 🚀 RUTA CORREGIDA: Ahora busca en ./src/models
const { sequelize, Usuario, Rol } = require('./src/models'); 

async function crearAdministrador() {
  try {
    console.log('🔄 Conectando a la base de datos PostgreSQL...');
    await sequelize.authenticate();

    const adminRole = await Rol.findByPk(1);
    if (!adminRole) {
      console.error('❌ Error: El rol de Administrador (ID 1) no existe. Verifica que init.sql se ejecutó correctamente.');
      process.exit(1);
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash('Softys2026!', salt);

    const [usuario, creado] = await Usuario.findOrCreate({
      where: { email: 'admin@softys.com' },
      defaults: {
        nombre: 'Administrador Sistema',
        password_hash: password_hash,
        rol_id: 1,
        activo: true
      }
    });

    if (creado) {
      console.log('✅ ¡Éxito! Usuario admin@softys.com creado correctamente.');
      console.log('🔑 Contraseña configurada: Softys2026!');
    } else {
      console.log('⚠️ El usuario admin@softys.com ya existía en el sistema.');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error crítico al crear el usuario:', error);
    process.exit(1);
  }
}

crearAdministrador();