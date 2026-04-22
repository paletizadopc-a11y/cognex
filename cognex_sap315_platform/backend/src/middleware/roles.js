const { Usuario, Rol } = require('../models');

const verificarRol = (...rolesPermitidos) => {
  return async (req, res, next) => {
    try {
      const usuario = await Usuario.findByPk(req.usuario.id, {
        include: [{ model: Rol, attributes: ['nombre_rol'] }]
      });

      if (!usuario || !rolesPermitidos.includes(usuario.rol.nombre_rol)) {
        return res.status(403).json({ error: 'Acceso denegado: rol insuficiente' });
      }
      next();
    } catch (error) {
      res.status(500).json({ error: 'Error verificando permisos' });
    }
  };
};

module.exports = { verificarRol };