const { Usuario, Rol } = require('../models');

/**
 * 🔒 MIDDLEWARE DE CONTROL DE ACCESO BASADO EN ROLES (RBAC)
 * Intercepta la petición y valida si el rol del operario se encuentra
 * autorizado dentro del arreglo de roles permitidos para el endpoint.
 */
const verificarRol = (rolesPermitidos) => {
  return async (req, res, next) => {
    try {
      // 1. Verificamos el contexto de autenticación inyectado por el token JWT
      if (!req.usuario || !req.usuario.id) {
        return res.status(401).json({ 
          error: 'Sesión no válida o expirada',
          message: 'No se encontró un contexto de autenticación activo.' 
        });
      }

      // 2. Buscamos al usuario en la BD hidratando su relación de rol
      const usuario = await Usuario.findByPk(req.usuario.id, {
        include: [{ model: Rol, as: 'rol' }] 
      });

      // 3. Validamos la existencia e integridad del registro
      if (!usuario || !usuario.rol) {
        return res.status(403).json({ 
          error: 'Error de integridad',
          message: 'El usuario actual no posee un rol asignado en la base de datos.' 
        });
      }

      // ============================================================================
      // 🚀 SOLUCIÓN: NORMALIZACIÓN ABSOLUTA DE MAYÚSCULAS/MINÚSCULAS Y ALIAS
      // ============================================================================
      // Limpiamos espacios y pasamos temporalmente a minúsculas para evaluar sin errores
      const rolRaw = (usuario.rol.nombre_rol || '').trim().toLowerCase();
      let nombreRol = usuario.rol.nombre_rol; // Mantiene el original por defecto

      if (rolRaw === 'admin' || rolRaw === 'administrador' || rolRaw === 'administrador sistema') {
        nombreRol = 'Administrador Sistema';
      } else if (rolRaw === 'supervisor') {
        nombreRol = 'Supervisor';
      } else if (rolRaw === 'operador' || rolRaw === 'operator') {
        nombreRol = 'Operador';
      }

      // Imprimimos la traza en la consola de Node para certificar la corrección en caliente
      console.log(`\n🔍 [RBAC DEBUG] Solicitud a: "${req.originalUrl}" [${req.method}]`);
      console.log(`👤 [RBAC DEBUG] Operador: ${usuario.nombre} (${usuario.email})`);
      console.log(`🗃️ [RBAC DEBUG] Rol en BD: "${usuario.rol.nombre_rol}" -> Normalizado con éxito a: "${nombreRol}"`);
      console.log(`📋 [RBAC DEBUG] Roles autorizados para esta acción:`, rolesPermitidos);

      // 4. Comparamos el rol ya formateado contra los permitidos por la ruta
      if (!rolesPermitidos.includes(nombreRol)) {
        console.log(`❌ [RBAC DEBUG] ACCESO RECHAZADO para ${usuario.email}`);
        return res.status(403).json({ 
          error: 'Acceso denegado',
          message: `Permisos insuficientes. El rol [${nombreRol}] no está autorizado para esta acción.` 
        });
      }

      console.log(`✅ [RBAC DEBUG] ACCESO CONCEDIDO a ${usuario.email}\n`);
      next();
      
    } catch (error) {
      console.error('❌ Error en el middleware de roles:', error);
      res.status(500).json({ 
        error: 'Error verificando permisos en el servidor',
        details: error.message 
      });
    }
  };
};

module.exports = { verificarRol };