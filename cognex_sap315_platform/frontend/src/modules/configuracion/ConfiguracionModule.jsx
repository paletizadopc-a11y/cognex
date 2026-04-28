import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Settings, Shield, Loader2, Mail, Trash2, Edit2 } from 'lucide-react';
import { api } from '../../shared/services/api';
import { Badge } from '../../shared/components/Badge';
import { CrearUsuarioModal } from './components/CrearUsuarioModal';

export const ConfiguracionModule = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  
  // 🚀 Estado para saber qué usuario vamos a editar
  const [usuarioParaEditar, setUsuarioParaEditar] = useState(null);

  const fetchUsuarios = async () => {
    try {
      setLoading(true);
      const response = await api.get('/usuarios');
      setUsuarios(response.usuarios || []);
    } catch (err) {
      console.error("[FRONTEND] Error al cargar usuarios:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsuarios(); }, []);

  // 🚀 Función única para crear y editar visualmente
  const handleUsuarioGuardado = (usuarioGuardado, esEdicion) => {
    if (esEdicion) {
      setUsuarios(usuarios.map(u => u.id === usuarioGuardado.id ? usuarioGuardado : u));
    } else {
      setUsuarios([usuarioGuardado, ...usuarios]);
    }
    setUsuarioParaEditar(null);
  };

  const handleToggleEstado = async (id, estadoActual) => {
    try {
      const nuevoEstado = !estadoActual;
      await api.patch(`/usuarios/${id}/estado`, { activo: nuevoEstado });
      setUsuarios(usuarios.map(u => u.id === id ? { ...u, activo: nuevoEstado } : u));
    } catch (err) {
      console.error("[FRONTEND] ❌ Error en handleToggleEstado:", err);
      alert(err.message || 'Error: No se pudo cambiar el estado del usuario.');
    }
  };

  const handleEliminar = async (id) => {
    try {
      await api.delete(`/usuarios/${id}`);
      setUsuarios(usuarios.filter(u => u.id !== id));
    } catch (err) {
      console.error("[FRONTEND] ❌ Error en handleEliminar:", err);
      alert(err.message || 'Error al intentar eliminar el usuario.');
    }
  };

  // Abrir modal para crear
  const abrirModalCrear = () => {
    setUsuarioParaEditar(null);
    setShowModal(true);
  };

  // Abrir modal para editar
  const abrirModalEditar = (usuario) => {
    setUsuarioParaEditar(usuario);
    setShowModal(true);
  };

  return (
    <div className="p-8 font-hanken">
      <div className="mb-8 flex flex-col md:flex-row md:justify-between md:items-end gap-4">
        <div>
          <h1 className="font-inter font-bold text-3xl text-[#343A40] mb-2 flex items-center gap-3">
            <Settings className="w-8 h-8 text-[#4A008B]" />
            Configuración del Sistema
          </h1>
          <p className="text-[#555555]">Administración de acceso y parámetros operativos.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-soft border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <h3 className="font-inter font-bold text-lg text-[#343A40]">Directorio de Usuarios</h3>
          <button 
            onClick={abrirModalCrear}
            className="flex items-center gap-2 px-4 py-2 bg-[#4A008B] text-white rounded-xl hover:bg-[#38006B] font-bold text-sm shadow-soft transition-all"
          >
            <UserPlus className="w-4 h-4" /> Nuevo Usuario
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50">
              <tr className="border-b border-gray-100 text-xs font-inter font-semibold text-[#555555] uppercase tracking-wider">
                <th className="p-4 pl-6">Usuario / Email</th>
                <th className="p-4">Rol</th>
                <th className="p-4">Estado</th>
                <th className="p-4 text-center">Activo (On/Off)</th>
                <th className="p-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-[#4A008B] mx-auto" />
                  </td>
                </tr>
              ) : (
                usuarios.map((u) => (
                  <tr key={u.id} className={`hover:bg-gray-50/50 transition-all ${!u.activo ? 'opacity-60 bg-gray-50/50' : ''}`}>
                    <td className="p-4 pl-6">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold transition-colors ${u.activo ? 'bg-[#4A008B]' : 'bg-gray-400'}`}>
                          {u.nombre.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-sm text-[#343A40]">{u.nombre}</div>
                          <div className="text-[11px] text-gray-500">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-xs font-bold uppercase text-gray-400">
                      {u.rol?.nombre_rol || 'Sin Rol'}
                    </td>
                    <td className="p-4">
                      <Badge variant={u.activo ? 'validado' : 'error'}>
                        {u.activo ? 'Activo' : 'Bloqueado'}
                      </Badge>
                    </td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => handleToggleEstado(u.id, u.activo)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 ${
                          u.activo ? 'bg-[#4A008B]' : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-300 ${
                            u.activo ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex justify-center items-center gap-3">
                        {/* 🚀 Botón Editar */}
                        <button 
                          onClick={() => abrirModalEditar(u)}
                          className="text-gray-400 hover:text-[#4A008B] transition-colors"
                          title="Editar usuario"
                        >
                          <Edit2 className="w-5 h-5" />
                        </button>
                        
                        <button 
                          onClick={() => handleEliminar(u.id)} 
                          className="text-gray-400 hover:text-red-600 transition-colors"
                          title="Eliminar usuario"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <CrearUsuarioModal 
          usuarioParaEditar={usuarioParaEditar}
          onClose={() => {
            setShowModal(false);
            setUsuarioParaEditar(null);
          }} 
          onUsuarioGuardado={handleUsuarioGuardado} 
        />
      )}
    </div>
  );
};