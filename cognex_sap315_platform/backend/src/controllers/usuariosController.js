const bcrypt = require('bcryptjs');
const { Usuario, Rol } = require('../models');

// Obtener todos los roles activos
exports.getRoles = async (req, res) => {
  try {
    const roles = await Rol.findAll({ where: { activo: true } });
    res.json({ roles });
  } catch (error) {
    console.error(">>> [BACKEND] ❌ Error al obtener roles:", error.message);
    res.status(500).json({ message: 'Error al obtener roles', mensaje: 'Error al obtener roles', error: error.message });
  }
};

// Listar usuarios con sus roles en orden descendente por fecha de creación
exports.getUsuarios = async (req, res) => {
  try {
    const usuarios = await Usuario.findAll({
      attributes: { exclude: ['password_hash'] },
      include: [{ model: Rol, as: 'rol', attributes: ['nombre_rol', 'descripcion'] }],
      order: [['fecha_creacion', 'DESC']]
    });
    res.json({ usuarios });
  } catch (error) {
    console.error(">>> [BACKEND] ❌ Error al listar usuarios:", error.message);
    res.status(500).json({ message: 'Error al obtener usuarios', mensaje: 'Error al obtener usuarios', error: error.message });
  }
};

/**
 * 🚀 CREAR USUARIO (ADMIN)
 * Al ser creado por un admin, la contraseña se marca como temporal y vence en 7 días.
 */
exports.crearUsuario = async (req, res) => {
  try {
    const { nombre, email, password, rol_id } = req.body;
    
    // Validación estricta de dominio corporativo
    if (!email.toLowerCase().endsWith('@softysla.com')) {
      return res.status(400).json({ message: 'Acceso denegado: Solo se permiten correos @softysla.com', mensaje: 'Acceso denegado: Solo se permiten correos @softysla.com' });
    }

    const existeUsuario = await Usuario.findOne({ where: { email: email.toLowerCase() } });
    if (existeUsuario) {
      return res.status(400).json({ message: 'El correo ya está registrado.', mensaje: 'El correo ya está registrado.' });
    }

    // Configuración de expiración de la regla de seguridad (7 días)
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
      es_password_temporal: true, // Marca como temporal
      password_expires_at: fechaVencimiento // Vence exactamente en 7 días
    });

    const usuarioConRol = await Usuario.findByPk(nuevoUsuario.id, {
      attributes: { exclude: ['password_hash'] },
      include: [{ model: Rol, as: 'rol', attributes: ['nombre_rol'] }]
    });

    console.log(`>>> [BACKEND] 👤 Usuario creado con clave temporal: ${email}`);
    res.status(201).json({ 
      message: 'Usuario creado. La contraseña vencerá en 7 días.', 
      mensaje: 'Usuario creado. La contraseña vencerá en 7 días.', 
      usuario: usuarioConRol 
    });
  } catch (error) {
    console.error(">>> [BACKEND] ❌ Error al crear usuario:", error.message);
    res.status(500).json({ message: 'Error al crear usuario', mensaje: 'Error al crear usuario', error: error.message });
  }
};

/**
 * 🚀 CONFIGURAR CONTRASEÑA (FLUJO INVITACIÓN / USUARIO NUEVO)
 * Cuando el usuario configura su acceso por primera vez, cuenta con 7 días antes del vencimiento.
 */
exports.configurarPasswordNueva = async (req, res) => {
  try {
    const { email, nueva_contrasena, confirmar_contrasena } = req.body;

    if (nueva_contrasena !== confirmar_contrasena) {
      return res.status(400).json({ message: 'Las contraseñas no coinciden.', mensaje: 'Las contraseñas no coinciden.' });
    }

    const usuario = await Usuario.findOne({ where: { email: email.toLowerCase() } });
    if (!usuario) return res.status(404).json({ message: 'Usuario no encontrado.', mensaje: 'Usuario no encontrado.' });

    // La primera contraseña asignada expira por defecto en 7 días
    const fechaVencimiento = new Date();
    fechaVencimiento.setDate(fechaVencimiento.getDate() + 7);

    const salt = await bcrypt.genSalt(10);
    usuario.password_hash = await bcrypt.hash(nueva_contrasena, salt);
    usuario.password_expires_at = fechaVencimiento;
    usuario.es_password_temporal = true;
    await usuario.save();

    console.log(`>>> [BACKEND] 🔑 Clave inicial configurada por el usuario: ${email}`);
    res.json({ message: 'Contraseña configurada. Vence en 7 días.', mensaje: 'Contraseña configurada. Vence en 7 días.' });
  } catch (error) {
    console.error(">>> [BACKEND] ❌ Error al configurar contraseña inicial:", error.message);
    res.status(500).json({ message: 'Error al configurar contraseña.', mensaje: 'Error al configurar contraseña.', error: error.message });
  }
};

/**
 * 🚀 CAMBIAR A CONTRASEÑA DEFINITIVA (MÓDULO PERFIL)
 * El usuario actualiza su clave actual para remover las restricciones y volverla permanente.
 */
exports.cambiarPasswordDefinitiva = async (req, res) => {
  try {
    const { email, password_actual, nueva_password } = req.body;

    // Buscamos al usuario incluyendo su rol para retornar el perfil completo e hidratar el frontend sin desloguear
    const usuario = await Usuario.findOne({ 
      where: { email: email.toLowerCase() },
      include: [{ model: Rol, as: 'rol', attributes: ['nombre_rol', 'descripcion'] }]
    });
    if (!usuario) return res.status(404).json({ message: 'Usuario no encontrado.', mensaje: 'Usuario no encontrado.' });

    // Validamos la contraseña temporal ingresada
    const validPassword = await bcrypt.compare(password_actual, usuario.password_hash);
    if (!validPassword) return res.status(401).json({ message: 'La contraseña actual es incorrecta.', mensaje: 'La contraseña actual es incorrecta.' });

    const salt = await bcrypt.genSalt(10);
    usuario.password_hash = await bcrypt.hash(nueva_password, salt);
    usuario.password_expires_at = null; // Remueve la fecha de caducidad
    usuario.es_password_temporal = false; // El acceso pasa a ser permanente e ilimitado
    await usuario.save();

    // Objeto limpio listo para actualizar de forma transparente el localStorage del frontend
    const perfilActualizado = {
      id: usuario.id,
      nombre: usuario.nombre,
      email: usuario.email,
      es_password_temporal: false,
      password_expires_at: null,
      rol: usuario.rol
    };

    console.log(`>>> [BACKEND] 🔒 Contraseña definitiva establecida para: ${email}`);
    res.json({ 
      message: 'Contraseña actualizada a permanente con éxito.', 
      mensaje: 'Contraseña actualizada a permanente con éxito.',
      usuario: perfilActualizado
    });
  } catch (error) {
    console.error(">>> [BACKEND] ❌ Error crítico en cambiarPasswordDefinitiva:", error.message);
    res.status(500).json({ message: 'Error al actualizar contraseña.', mensaje: 'Error al actualizar contraseña.', error: error.message });
  }
};

// Editar datos administrativos del usuario
exports.editarUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, email, rol_id, password } = req.body;

    const usuario = await Usuario.findByPk(id);
    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado', message: 'Usuario no encontrado' });

    if (email && !email.toLowerCase().endsWith('@softysla.com')) {
      return res.status(400).json({ error: 'Acceso denegado: Dominio inválido', message: 'Acceso denegado: Dominio inválido' });
    }

    const updates = { nombre, email: email?.toLowerCase() || usuario.email, rol_id };

    if (password && password.trim() !== '') {
      const salt = await bcrypt.genSalt(10);
      updates.password_hash = await bcrypt.hash(password, salt);
      
      // Si el administrador resetea o fuerza la clave de un usuario, vuelve a ser temporal por 7 días
      const fechaVencimiento = new Date();
      fechaVencimiento.setDate(fechaVencimiento.getDate() + 7);
      updates.password_expires_at = fechaVencimiento;
      updates.es_password_temporal = true;
    }

    await usuario.update(updates);

    // Devolvemos el registro con el include de Rol para prevenir filas rotas en la tabla de Gestión de Accesos
    const usuarioActualizado = await Usuario.findByPk(id, {
      attributes: { exclude: ['password_hash'] },
      include: [{ model: Rol, as: 'rol', attributes: ['nombre_rol', 'descripcion'] }]
    });

    console.log(`>>> [BACKEND] ✅ Usuario ${id} editado exitosamente.`);
    res.json({ mensaje: 'Usuario actualizado correctamente', message: 'Usuario actualizado correctamente', usuario: usuarioActualizado });
  } catch (error) {
    console.error(">>> [BACKEND] ❌ Error al editar usuario:", error.message);
    res.status(500).json({ error: 'Error interno al actualizar usuario', message: 'Error interno al actualizar usuario', details: error.message });
  }
};

// Activar o bloquear usuario desde el panel administrativo
exports.actualizarEstadoUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const { activo } = req.body;

    const usuario = await Usuario.findByPk(id);
    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado', message: 'Usuario no encontrado' });

    await usuario.update({ activo });
    
    console.log(`>>> [BACKEND] 🔄 Estado del usuario ${id} cambiado a: ${activo ? 'ACTIVO' : 'BLOQUEADO'}`);
    res.json({ mensaje: `Usuario ${activo ? 'activado' : 'bloqueado'}`, message: `Usuario ${activo ? 'activado' : 'bloqueado'}`, usuario });
  } catch (error) {
    console.error(">>> [BACKEND] ❌ Error al cambiar estado del usuario:", error.message);
    res.status(500).json({ error: error.message, message: 'Error al cambiar estado del usuario.' });
  }
};

// Eliminar un registro de usuario permanentemente de la tabla
exports.eliminarUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const usuario = await Usuario.findByPk(id);
    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado', message: 'Usuario no encontrado' });

    await usuario.destroy();
    
    console.log(`>>> [BACKEND] 🗑️ Usuario ${id} eliminado permanentemente del sistema.`);
    res.json({ mensaje: 'Usuario eliminado correctamente', message: 'Usuario eliminado correctamente' });
  } catch (error) {
    console.error(">>> [BACKEND] ❌ Error al eliminar usuario:", error.message);
    res.status(500).json({ error: error.message, message: 'Error al intentar eliminar el registro.' });
  }
};