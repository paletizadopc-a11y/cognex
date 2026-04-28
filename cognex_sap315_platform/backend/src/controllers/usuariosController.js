const bcrypt = require('bcryptjs');
const { Usuario, Rol } = require('../models');

exports.getRoles = async (req, res) => {
  try {
    const roles = await Rol.findAll({ where: { activo: true } });
    res.json({ roles });
  } catch (error) {
    console.error(">>> [BACKEND] Error al obtener roles:", error.message);
    res.status(500).json({ message: 'Error al obtener roles', error: error.message });
  }
};

exports.getUsuarios = async (req, res) => {
  try {
    const usuarios = await Usuario.findAll({
      attributes: { exclude: ['password_hash'] },
      include: [{ model: Rol, as: 'rol', attributes: ['nombre_rol', 'descripcion'] }],
      order: [['fecha_creacion', 'DESC']]
    });
    res.json({ usuarios });
  } catch (error) {
    console.error(">>> [BACKEND] Error al listar usuarios:", error.message);
    res.status(500).json({ message: 'Error al obtener usuarios', error: error.message });
  }
};

exports.crearUsuario = async (req, res) => {
  try {
    const { nombre, email, password, rol_id } = req.body;
    
    // 🚀 VALIDACIÓN DE DOMINIO CORPORATIVO
    if (!email.toLowerCase().endsWith('@softysla.com')) {
      return res.status(400).json({ message: 'Acceso denegado: Solo se permiten correos del dominio @softysla.com' });
    }

    const existeUsuario = await Usuario.findOne({ where: { email: email.toLowerCase() } });
    if (existeUsuario) {
      return res.status(400).json({ message: 'El correo ya está registrado.' });
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const nuevoUsuario = await Usuario.create({
      nombre, 
      email: email.toLowerCase(), 
      password_hash, 
      rol_id, 
      activo: true
    });

    const usuarioConRol = await Usuario.findByPk(nuevoUsuario.id, {
      attributes: { exclude: ['password_hash'] },
      include: [{ model: Rol, as: 'rol', attributes: ['nombre_rol'] }]
    });

    res.status(201).json({ message: 'Usuario creado', usuario: usuarioConRol });
  } catch (error) {
    console.error(">>> [BACKEND] Error al crear usuario:", error.message);
    res.status(500).json({ message: 'Error al crear usuario', error: error.message });
  }
};

// Editar datos del usuario
exports.editarUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, email, rol_id, password } = req.body;

    const usuario = await Usuario.findByPk(id);
    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });

    // 🚀 VALIDACIÓN DE DOMINIO CORPORATIVO AL EDITAR
    if (email && !email.toLowerCase().endsWith('@softysla.com')) {
      return res.status(400).json({ error: 'Acceso denegado: Solo se permiten correos del dominio @softysla.com' });
    }

    const emailNormalizado = email ? email.toLowerCase() : usuario.email;

    // Validar si están cambiando el email por uno que ya usa otra persona
    if (emailNormalizado !== usuario.email) {
      const existeEmail = await Usuario.findOne({ where: { email: emailNormalizado } });
      if (existeEmail) return res.status(400).json({ error: 'El correo ya está en uso por otro usuario.' });
    }

    // Preparamos los datos a actualizar
    const updates = { nombre, email: emailNormalizado, rol_id };

    // Solo actualizamos la contraseña si el usuario escribió una nueva
    if (password && password.trim() !== '') {
      const salt = await bcrypt.genSalt(10);
      updates.password_hash = await bcrypt.hash(password, salt);
    }

    await usuario.update(updates);

    // Devolvemos el usuario con sus datos completos y rol
    const usuarioActualizado = await Usuario.findByPk(id, {
      attributes: { exclude: ['password_hash'] },
      include: [{ model: Rol, as: 'rol', attributes: ['nombre_rol', 'descripcion'] }]
    });

    console.log(`>>> [BACKEND] ✅ Usuario ${id} editado exitosamente.`);
    res.json({ mensaje: 'Usuario actualizado correctamente', usuario: usuarioActualizado });
  } catch (error) {
    console.error(">>> [BACKEND] ❌ Error al editar usuario:", error.message);
    res.status(500).json({ error: 'Error interno al actualizar usuario' });
  }
};

exports.actualizarEstadoUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const { activo } = req.body;

    const usuario = await Usuario.findByPk(id);
    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });

    await usuario.update({ activo: activo });

    res.json({ mensaje: `Usuario ${activo ? 'activado' : 'bloqueado'}`, usuario });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

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