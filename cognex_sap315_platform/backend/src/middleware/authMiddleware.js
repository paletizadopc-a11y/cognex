const jwt = require('jsonwebtoken');
const { Usuario } = require('../models');

/**
 * Middleware de Verificación de Token y Seguridad de Cuenta
 * 🚀 Mejora: Valida estado activo y expiración de contraseñas temporales.
 */
const verificarToken = async (req, res, next) => {
  // Obtener el token del encabezado Authorization
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Token no proporcionado' });
  }

  try {
    // 1. Verificación básica de la integridad del JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 2. 🚀 VALIDACIÓN DE SEGURIDAD EN TIEMPO REAL
    // Consultamos la BD para asegurar que el estado del usuario no haya cambiado
    const usuario = await Usuario.findByPk(decoded.id);

    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado en el sistema.' });
    }

    // Verificar si el usuario fue bloqueado por el administrador
    if (!usuario.activo) {
      return res.status(403).json({ error: 'Tu cuenta ha sido desactivada. Contacta al administrador.' });
    }

    // 3. 🚀 CONTROL DE EXPIRACIÓN DE CONTRASEÑA (7 DÍAS)
    // Si la contraseña es temporal y ya pasó la fecha de vencimiento, bloqueamos el acceso.
    if (usuario.es_password_temporal && usuario.password_expires_at) {
      const ahora = new Date();
      const fechaExpiracion = new Date(usuario.password_expires_at);

      if (ahora > fechaExpiracion) {
        return res.status(403).json({ 
          error: 'Tu contraseña temporal de 7 días ha vencido.',
          passwordExpirada: true 
        });
      }
    }

    /**
     * Adjuntamos el objeto del usuario completo al request.
     * Esto permite que los controladores posteriores tengan acceso a los datos 
     * actualizados sin necesidad de volver a consultar la BD.
     */
    req.usuario = usuario;
    
    next();
  } catch (error) {
    // Manejo de tokens malformados o caducados
    return res.status(403).json({ error: 'Sesión inválida o expirada. Por favor, inicia sesión nuevamente.' });
  }
};

module.exports = { verificarToken };