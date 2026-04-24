const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Usuario, Rol, SessionLogin } = require('../models');

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // 1. Buscamos el usuario por su email (No por ID, porque aún no hay token)
    // Asegurándonos de usar el alias 'rol' para evitar problemas con Sequelize
    const usuario = await Usuario.findOne({
      where: { email: email, activo: true },
      include: [{ model: Rol, as: 'rol' }]
    });

    // 2. Validar que el usuario exista
    if (!usuario) {
      return res.status(401).json({ error: 'Credenciales inválidas (Usuario no encontrado)' });
    }

    // 3. Validar que la base de datos realmente trajo el rol asociado
    if (!usuario.rol) {
       return res.status(500).json({ error: 'El usuario existe, pero no tiene un rol asignado en la base de datos.' });
    }

    // 4. Validar contraseña
    const validPassword = await bcrypt.compare(password, usuario.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Credenciales inválidas (Contraseña incorrecta)' });
    }

    // 5. Generar Token (con un respaldo por si falta la variable en el .env)
    const token = jwt.sign(
      { id: usuario.id, email: usuario.email, rol: usuario.rol.nombre_rol },
      process.env.JWT_SECRET || 'secreto_temporal_cognex', 
      { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
    );

    // 6. Registrar la sesión (protegiendo contra cabeceras vacías)
    await SessionLogin.create({
      usuario_id: usuario.id,
      token_jwt: token,
      ip_equipo: req.ip || '0.0.0.0',
      user_agent: req.headers['user-agent'] || 'Desconocido'
    });

    // 7. Actualizar último acceso
    await usuario.update({ ultimo_login: new Date() });

    // 8. Respuesta exitosa
    res.json({
      token,
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol.nombre_rol
      }
    });

  } catch (error) {
    console.error("❌ Error crítico en login:", error);
    res.status(500).json({ error: error.message });
  }
};

exports.registrar = async (req, res) => {
  try {
    const { nombre, email, password, rol_id } = req.body;
    
    const salt = await bcrypt.genSalt(parseInt(process.env.BCRYPT_ROUNDS) || 10);
    const password_hash = await bcrypt.hash(password, salt);

    const usuario = await Usuario.create({
      nombre,
      email,
      password_hash,
      rol_id: rol_id || 3
    });

    res.status(201).json({ 
      mensaje: 'Usuario creado exitosamente',
      usuario_id: usuario.id 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.logout = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (token) {
      await SessionLogin.update(
        { activa: false, fecha_fin: new Date() },
        { where: { token_jwt: token } }
      );
    }
    
    res.json({ mensaje: 'Sesión cerrada exitosamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};