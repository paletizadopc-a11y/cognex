const jwt = require('jsonwebtoken');
const { Usuario } = require('../models');

/**
 * Middleware para verificar la validez del token y las restricciones de seguridad
 * de la cuenta (estado activo y vencimiento de contraseña temporal).
 */
const verificarToken = async (req, res, next) => {
  // 1. Extraer el token del encabezado Authorization
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Token no proporcionado' });
  }

  try {
    // 2. Verificar la integridad y expiración del JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    /**
     * 3. 🚀 VALIDACIÓN DE SEGURIDAD EN TIEMPO REAL
     * Consultamos la base de datos para verificar el estado actual del usuario.
     */
    const usuario = await Usuario.findByPk(decoded.id);

    if (!usuario) {
      return res.status(404).json({ error: 'El usuario ya no existe en el sistema.' });
    }

    // Verificar si la cuenta ha sido desactivada por un administrador
    if (!usuario.activo) {
      return res.status(403).json({ error: 'Tu cuenta ha sido suspendida. Contacta al soporte técnico.' });
    }

    /**
     * 4. 🚀 CONTROL DE CONTRASEÑA TEMPORAL (7 DÍAS)
     * Si el usuario aún tiene una contraseña temporal y la fecha actual es superior 
     * a la de vencimiento, bloqueamos el acceso.
     */
    if (usuario.es_password_temporal && usuario.password_expires_at) {
      const ahora = new Date();
      const fechaVencimiento = new Date(usuario.password_expires_at);

      if (ahora > fechaVencimiento) {
        return res.status(403).json({ 
          error: 'Tu contraseña temporal de 7 días ha vencido.',
          passwordExpirada: true 
        });
      }
    }

    /**
     * 5. Adjuntar la información del usuario al objeto request.
     * Esto permite que las rutas protegidas accedan a los datos del usuario
     * sin necesidad de realizar otra consulta a la base de datos.
     */
    req.usuario = usuario;
    
    next();
  } catch (error) {
    // Manejo de tokens inválidos, manipulados o caducados
    return res.status(403).json({ error: 'Sesión inválida o expirada. Por favor, ingresa de nuevo.' });
  }
};

module.exports = { verificarToken };