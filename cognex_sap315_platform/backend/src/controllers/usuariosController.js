const bcrypt = require('bcryptjs');
const { Usuario, Rol } = require('../models');

// Obtener todos los roles activos
exports.getRoles = async (req, res) => {
  try {
    const roles = await Rol.findAll({ where: { activo: true } });
    res.json({ roles });
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener roles', error: error.message });
  }
};

// Listar usuarios con sus roles
exports.getUsuarios = async (req, res) => {
  try {
    const usuarios = await Usuario.findAll({
      attributes: { exclude: ['password_hash'] },
      include: [{ model: Rol, as: 'rol', attributes: ['nombre_rol', 'descripcion'] }],
      order: [['fecha_creacion', 'DESC']]
    });
    res.json({ usuarios });
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener usuarios', error: error.message });
  }
};

/**
 * 🚀 CREAR USUARIO (ADMIN)
 * Al ser creado por un admin, la contraseña se marca como temporal y vence en 7 días.
 */
exports.crearUsuario = async (req, res) => {
  try {
    const { nombre, email, password, rol_id } = req.body;
    
    // Validación de dominio corporativo
    if (!email.toLowerCase().endsWith('@softysla.com')) {
      return res.status(400).json({ message: 'Acceso denegado: Solo se permiten correos @softysla.com' });
    }

    const existeUsuario = await Usuario.findOne({ where: { email: email.toLowerCase() } });
    if (existeUsuario) {
      return res.status(400).json({ message: 'El correo ya está registrado.' });
    }

    // Configuración de expiración (7 días)
    const fechaVencimiento = new Date();
    fechaVencimiento.setDate(fechaVencimiento.getDate() + 7);

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const nuevoUsuario = await Usuario.create({
      nombre, 
      email: email.toLowerCase(), 
      password_hash, 
      rol_id, 
      activo: true,
      es_password_temporal: true, // 🚀 Marca como temporal
      password_expires_at: fechaVencimiento // 🚀 Vence en 7 días
    });

    const usuarioConRol = await Usuario.findByPk(nuevoUsuario.id, {
      attributes: { exclude: ['password_hash'] },
      include: [{ model: Rol, as: 'rol', attributes: ['nombre_rol'] }]
    });

    res.status(201).json({ 
      message: 'Usuario creado. La contraseña vencerá en 7 días.', 
      usuario: usuarioConRol 
    });
  } catch (error) {
    res.status(500).json({ message: 'Error al crear usuario', error: error.message });
  }
};

/**
 * 🚀 CONFIGURAR CONTRASEÑA (FLUJO INVITACIÓN)
 * Cuando el usuario configura su acceso por primera vez, también tiene 7 días para cambiarla por una definitiva.
 */
exports.configurarPasswordNueva = async (req, res) => {
  try {
    const { email, nueva_contrasena, confirmar_contrasena } = req.body;

    if (nueva_contrasena !== confirmar_contrasena) {
      return res.status(400).json({ message: 'Las contraseñas no coinciden.' });
    }

    const usuario = await Usuario.findOne({ where: { email: email.toLowerCase() } });
    if (!usuario) return res.status(404).json({ message: 'Usuario no encontrado.' });

    // La primera contraseña siempre es temporal por 7 días
    const fechaVencimiento = new Date();
    fechaVencimiento.setDate(fechaVencimiento.getDate() + 7);

    const salt = await bcrypt.genSalt(10);
    usuario.password_hash = await bcrypt.hash(nueva_contrasena, salt);
    usuario.password_expires_at = fechaVencimiento;
    usuario.es_password_temporal = true;
    await usuario.save();

    res.json({ message: 'Contraseña configurada. Vence en 7 días.' });
  } catch (error) {
    res.status(500).json({ message: 'Error al configurar contraseña.' });
  }
};

/**
 * 🚀 CAMBIAR A CONTRASEÑA DEFINITIVA
 * El usuario actualiza su clave para que sea permanente.
 */
exports.cambiarPasswordDefinitiva = async (req, res) => {
  try {
    const { email, password_actual, nueva_password } = req.body;

    const usuario = await Usuario.findOne({ where: { email: email.toLowerCase() } });
    if (!usuario) return res.status(404).json({ message: 'Usuario no encontrado.' });

    const validPassword = await bcrypt.compare(password_actual, usuario.password_hash);
    if (!validPassword) return res.status(401).json({ message: 'La contraseña actual es incorrecta.' });

    const salt = await bcrypt.genSalt(10);
    usuario.password_hash = await bcrypt.hash(nueva_password, salt);
    usuario.password_expires_at = null; // 🚀 Ya no vence
    usuario.es_password_temporal = false; // 🚀 Pasa a ser definitiva
    await usuario.save();

    res.json({ message: 'Contraseña actualizada a permanente con éxito.' });
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar contraseña.' });
  }
};

// Editar datos del usuario
exports.editarUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, email, rol_id, password } = req.body;

    const usuario = await Usuario.findByPk(id);
    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });

    if (email && !email.toLowerCase().endsWith('@softysla.com')) {
      return res.status(400).json({ error: 'Acceso denegado: Dominio inválido' });
    }

    const updates = { nombre, email: email?.toLowerCase() || usuario.email, rol_id };

    if (password && password.trim() !== '') {
      const salt = await bcrypt.genSalt(10);
      updates.password_hash = await bcrypt.hash(password, salt);
      // Si el admin le resetea la clave, vuelve a ser temporal por 7 días
      const fechaVencimiento = new Date();
      fechaVencimiento.setDate(fechaVencimiento.getDate() + 7);
      updates.password_expires_at = fechaVencimiento;
      updates.es_password_temporal = true;
    }

    await usuario.update(updates);
    res.json({ mensaje: 'Usuario actualizado correctamente' });
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar usuario' });
  }
};

// Activar o bloquear usuario
exports.actualizarEstadoUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const { activo } = req.body;
    const usuario = await Usuario.findByPk(id);
    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });

    await usuario.update({ activo });
    res.json({ mensaje: `Usuario ${activo ? 'activado' : 'bloqueado'}` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Eliminar usuario permanentemente
exports.eliminarUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const usuario = await Usuario.findByPk(id);
    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });

    await usuario.destroy();
    res.json({ mensaje: 'Usuario eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};