const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Usuario, Rol, SessionLogin } = require('../models');

// 🚀 IMPORTACIÓN DE LA UTILIDAD DE LOGS DE AUDITORÍA
const { registrarLog } = require('../utils/auditLogger');

/**
 * 🔐 INICIO DE SESIÓN DE OPERADORES
 */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // 1. Buscamos el usuario por su email
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

    // 5. Generar Token
    const token = jwt.sign(
      { id: usuario.id, email: usuario.email, rol: usuario.rol.nombre_rol },
      process.env.JWT_SECRET || 'secreto_temporal_cognex', 
      { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
    );

    // 6. Registrar la sesión en la base de datos
    await SessionLogin.create({
      usuario_id: usuario.id,
      token_jwt: token,
      ip_equipo: req.ip || '0.0.0.0',
      user_agent: req.headers['user-agent'] || 'Desconocido'
    });

    // 7. Actualizar último acceso
    await usuario.update({ ultimo_login: new Date() });

    // 🚀 TRUCO DE INYECCIÓN DE CONTEXTO:
    // Al ser una ruta de login, req.usuario aún no está inyectado por el middleware.
    // Lo asignamos manualmente aquí para que el auditLogger capture quién se está logueando.
    req.usuario = usuario;

    // 🚀 LOG DE AUDITORÍA: Captura el ingreso del operario
    await registrarLog(req, 'LOGIN_EXITOSO', 'AUTH', `Operador inició sesión de forma correcta desde la dirección IP ${req.ip || '127.0.0.1'}`);

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

/**
 * 📝 REGISTRAR NUEVAS CUENTAS
 */
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

    // 🚀 LOG DE AUDITORÍA: Registra la autoinscripción o creación directa
    await registrarLog(req, 'REGISTRO_CUENTA_NUEVA', 'AUTH', {
      nombre_registrado: nombre,
      email_registrado: email,
      rol_asignado: rol_id || 3
    });

    res.status(201).json({ 
      mensaje: 'Usuario creado exitosamente',
      usuario_id: usuario.id 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * 🚪 CIERRE DE SESIÓN DE OPERADORES
 */
exports.logout = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (token) {
      await SessionLogin.update(
        { activa: false, fecha_fin: new Date() },
        { where: { token_jwt: token } }
      );
    }
    
    // 🚀 LOG DE AUDITORÍA: El middleware ya inyectó req.usuario, por lo que el log saldrá a su nombre
    await registrarLog(req, 'LOGOUT_EXITOSO', 'AUTH', 'El usuario cerró su sesión activa de forma voluntaria.');

    res.json({ mensaje: 'Sesión cerrada exitosamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};