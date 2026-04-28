import React, { useState, useEffect } from 'react';
import { X, UserPlus, Loader2, Mail, Lock, User, Shield, Edit2 } from 'lucide-react';
import { api } from '../../../shared/services/api';

export const CrearUsuarioModal = ({ onClose, onUsuarioGuardado, usuarioParaEditar }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [roles, setRoles] = useState([]);
  
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    password: '',
    confirmarPassword: '',
    rol_id: ''
  });

  const esEdicion = !!usuarioParaEditar;

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const response = await api.get('/roles');
        setRoles(response.roles || []);
      } catch (err) {
        console.error("Error cargando roles", err);
      }
    };
    fetchRoles();

    // Si es edición, llenamos el formulario con los datos existentes
    if (esEdicion) {
      setFormData({
        nombre: usuarioParaEditar.nombre,
        email: usuarioParaEditar.email,
        rol_id: usuarioParaEditar.rol_id || '',
        password: '', // Dejamos las contraseñas vacías para no forzar cambio
        confirmarPassword: ''
      });
    }
  }, [usuarioParaEditar, esEdicion]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // 🚀 VALIDACIÓN FRONTEND: Dominio Corporativo
    if (!formData.email.toLowerCase().endsWith('@softysla.com')) {
      setError('Por políticas de seguridad, solo se permiten correos del dominio @softysla.com');
      return;
    }

    // Validación de contraseñas: Si escriben algo, debe coincidir.
    if (formData.password || formData.confirmarPassword) {
      if (formData.password !== formData.confirmarPassword) {
        setError('Las contraseñas no coinciden. Por favor, verifíquelas.');
        return;
      }
    }

    try {
      setLoading(true);
      setError('');
      
      const payload = {
        nombre: formData.nombre,
        email: formData.email,
        rol_id: formData.rol_id
      };

      // Solo enviamos la contraseña si el usuario escribió una nueva
      if (formData.password) {
        payload.password = formData.password;
      }

      if (esEdicion) {
        // ACTUALIZAR (PUT)
        const response = await api.put(`/usuarios/${usuarioParaEditar.id}`, payload);
        onUsuarioGuardado(response.usuario, true);
      } else {
        // CREAR NUEVO (POST)
        const response = await api.post('/usuarios', payload);
        onUsuarioGuardado(response.usuario, false);
      }
      
      onClose();
    } catch (err) {
      setError(err.message || 'Error al guardar. Verifique los datos.');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 font-hanken">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in">
        
        <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#F3E8FF] text-[#4A008B] rounded-lg">
              {esEdicion ? <Edit2 className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
            </div>
            <h3 className="font-inter font-bold text-lg text-[#343A40]">
              {esEdicion ? 'Editar Usuario' : 'Registrar Usuario'}
            </h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100 font-medium">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-[#555555] uppercase tracking-wider mb-1">Nombre Completo</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input 
                type="text" name="nombre" required
                value={formData.nombre} onChange={handleChange}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-[#4A008B]/20 focus:border-[#4A008B] outline-none transition-all"
                placeholder="Ej. Juan Pérez"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#555555] uppercase tracking-wider mb-1">Correo Corporativo</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input 
                type="email" name="email" required
                value={formData.email} onChange={handleChange}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-[#4A008B]/20 focus:border-[#4A008B] outline-none transition-all"
                placeholder="usuario@softysla.com"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-[#555555] uppercase tracking-wider mb-1">Contraseña</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input 
                  type="password" name="password" minLength="6"
                  required={!esEdicion} // Obligatorio al crear, opcional al editar
                  value={formData.password} onChange={handleChange}
                  className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-[#4A008B]/20 focus:border-[#4A008B] outline-none transition-all"
                  placeholder={esEdicion ? "Dejar vacío..." : "Mín. 6"}
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-[#555555] uppercase tracking-wider mb-1">Confirmar</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input 
                  type="password" name="confirmarPassword" minLength="6"
                  required={!esEdicion}
                  value={formData.confirmarPassword} onChange={handleChange}
                  className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-[#4A008B]/20 focus:border-[#4A008B] outline-none transition-all"
                  placeholder={esEdicion ? "Dejar vacío..." : "Repetir"}
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#555555] uppercase tracking-wider mb-1">Rol en el Sistema</label>
            <div className="relative">
              <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select 
                name="rol_id" required
                value={formData.rol_id} onChange={handleChange}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-[#4A008B]/20 focus:border-[#4A008B] outline-none transition-all appearance-none"
              >
                <option value="">Seleccione un rol...</option>
                {roles.map(rol => (
                  <option key={rol.id} value={rol.id}>
                    {rol.nombre_rol.toUpperCase()} - {rol.descripcion}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="pt-4 flex gap-3">
            <button
              type="button" onClick={onClose} disabled={loading}
              className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 font-bold transition-all text-sm"
            >
              Cancelar
            </button>
            <button
              type="submit" disabled={loading}
              className="flex-1 flex justify-center items-center gap-2 px-4 py-2.5 bg-[#4A008B] text-white rounded-xl hover:bg-[#38006B] font-bold transition-all shadow-soft text-sm disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (esEdicion ? <Edit2 className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />)}
              {esEdicion ? 'Guardar Cambios' : 'Guardar Usuario'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};