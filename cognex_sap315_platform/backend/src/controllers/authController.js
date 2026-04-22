const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Usuario, Rol, SessionLogin } = require('../models');

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const usuario = await Usuario.findOne({
      where: { email, activo: true },
      include: [{ model: Rol }]
    });

    if (!usuario) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const validPassword = await bcrypt.compare(password, usuario.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const token = jwt.sign(
      { id: usuario.id, email: usuario.email, rol: usuario.rol.nombre_rol },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    await SessionLogin.create({
      usuario_id: usuario.id,
      token_jwt: token,
      ip_equipo: req.ip,
      user_agent: req.headers['user-agent']
    });

    await usuario.update({ ultimo_login: new Date() });

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
    res.status(500).json({ error: error.message });
  }
};

exports.registrar = async (req, res) => {
  try {
    const { nombre, email, password, rol_id } = req.body;
    
    const salt = await bcrypt.genSalt(parseInt(process.env.BCRYPT_ROUNDS));
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
    await SessionLogin.update(
      { activa: false, fecha_fin: new Date() },
      { where: { token_jwt: token } }
    );
    res.json({ mensaje: 'Sesión cerrada exitosamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};