const { Usuario, Rol } = require('../models');

const verificarRol = (rolesPermitidos) => {
  return async (req, res, next) => {
    try {
      // 1. Verificamos que el token haya pasado correctamente la información del usuario
      if (!req.usuario || !req.usuario.id) {
        return res.status(401).json({ error: 'Sesión no válida o expirada' });
      }

      // 2. Buscamos al usuario en la BD con el ALIAS CORRECTO (as: 'rol')
      const usuario = await Usuario.findByPk(req.usuario.id, {
        include: [{ model: Rol, as: 'rol' }] 
      });

      // 3. Validamos que exista
      if (!usuario || !usuario.rol) {
        return res.status(403).json({ error: 'Error de integridad: Usuario sin rol asignado' });
      }

      // 4. Comparamos el rol del usuario con los roles permitidos para esta ruta
      if (!rolesPermitidos.includes(usuario.rol.nombre_rol)) {
        return res.status(403).json({ 
          error: `Acceso denegado. Eres ${usuario.rol.nombre_rol}, pero necesitas ser: ${rolesPermitidos.join(' o ')}` 
        });
      }

      // Si todo está bien, lo dejamos pasar al controlador (lecturasController.validar)
      next();
      
    } catch (error) {
      // Si algo falla a nivel de código, lo imprimimos en la consola de Node para depurar
      console.error('❌ Error en middleware de roles:', error);
      res.status(500).json({ error: 'Error verificando permisos en el servidor' });
    }
  };
};

module.exports = { verificarRol };