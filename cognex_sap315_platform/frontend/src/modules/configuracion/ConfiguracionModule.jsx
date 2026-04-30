import React, { useState, useEffect } from 'react';
import { 
  Users, UserPlus, Settings, Shield, Loader2, Mail, 
  Trash2, Edit2, Cpu, Activity, Save, AlertCircle, Zap 
} from 'lucide-react';
import { api } from '../../shared/services/api';
import { Badge } from '../../shared/components/Badge';
import { CrearUsuarioModal } from './components/CrearUsuarioModal';

export const ConfiguracionModule = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [usuarioParaEditar, setUsuarioParaEditar] = useState(null);

  // 🚀 Estado para parámetros operativos
  const [parametros, setParametros] = useState({
    umbralConfianza: 55, // La regla del 55% definida
    modoOperacion: 'AUTOMATICO',
    intervaloLectura: 2000,
    integracionSap: true
  });

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
      console.error("[FRONTEND] Error:", err);
      alert('No se pudo cambiar el estado del usuario.');
    }
  };

  const handleEliminar = async (id) => {
    if(!window.confirm('¿Está seguro de eliminar este usuario?')) return;
    try {
      await api.delete(`/usuarios/${id}`);
      setUsuarios(usuarios.filter(u => u.id !== id));
    } catch (err) {
      alert('Error al intentar eliminar el usuario.');
    }
  };

  return (
    <div className="p-8 font-hanken">
      {/* Cabecera */}
      <div className="mb-8">
        <h1 className="font-inter font-bold text-3xl text-[#343A40] mb-2 flex items-center gap-3">
          <Settings className="w-8 h-8 text-[#4A008B]" />
          Configuración del Sistema
        </h1>
        <p className="text-[#555555]">Administración de acceso y parámetros operativos de planta.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* COLUMNA IZQUIERDA: Directorio de Usuarios (2/3) */}
        <div className="xl:col-span-2 space-y-8">
          <div className="bg-white rounded-2xl shadow-soft border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="font-inter font-bold text-lg text-[#343A40] flex items-center gap-2">
                <Users className="w-5 h-5 text-[#4A008B]" /> Directorio de Usuarios
              </h3>
              <button 
                onClick={() => { setUsuarioParaEditar(null); setShowModal(true); }}
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
                    <th className="p-4 text-center">Activo</th>
                    <th className="p-4 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {loading ? (
                    <tr><td colSpan="4" className="p-8 text-center"><Loader2 className="w-8 h-8 animate-spin text-[#4A008B] mx-auto" /></td></tr>
                  ) : (
                    usuarios.map((u) => (
                      <tr key={u.id} className={`hover:bg-gray-50/50 transition-all ${!u.activo ? 'opacity-60 bg-gray-50/50' : ''}`}>
                        <td className="p-4 pl-6">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${u.activo ? 'bg-[#4A008B]' : 'bg-gray-400'}`}>
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
                        <td className="p-4 text-center">
                          <button
                            onClick={() => handleToggleEstado(u.id, u.activo)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${u.activo ? 'bg-[#4A008B]' : 'bg-gray-300'}`}
                          >
                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${u.activo ? 'translate-x-6' : 'translate-x-1'}`} />
                          </button>
                        </td>
                        <td className="p-4 text-center">
                          <div className="flex justify-center gap-3">
                            <button onClick={() => { setUsuarioParaEditar(u); setShowModal(true); }} className="text-gray-400 hover:text-[#4A008B]"><Edit2 className="w-5 h-5" /></button>
                            <button onClick={() => handleEliminar(u.id)} className="text-gray-400 hover:text-red-600"><Trash2 className="w-5 h-5" /></button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* COLUMNA DERECHA: Parámetros Operativos (1/3) */}
        <div className="space-y-8">
          <div className="bg-white rounded-2xl shadow-soft border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 bg-gray-50/50">
              <h3 className="font-inter font-bold text-lg text-[#343A40] flex items-center gap-2">
                <Cpu className="w-5 h-5 text-[#4A008B]" /> Parámetros Operativos
              </h3>
            </div>

            <div className="p-6 space-y-6">
              {/* Umbral de Confianza */}
              <div>
                <label className="block text-xs font-bold text-[#555555] uppercase tracking-wider mb-2 flex justify-between">
                  Umbral de Confianza <span>{parametros.umbralConfianza}%</span>
                </label>
                <input 
                  type="range" min="30" max="95" step="5"
                  value={parametros.umbralConfianza}
                  onChange={(e) => setParametros({...parametros, umbralConfianza: parseInt(e.target.value)})}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#4A008B]"
                />
                <div className="mt-2 p-3 bg-blue-50 rounded-xl flex items-start gap-2 border border-blue-100">
                  <AlertCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-blue-700">
                    Lecturas bajo este umbral requerirán validación manual en el módulo de Alertas.
                  </p>
                </div>
              </div>

              <hr className="border-gray-100" />

              {/* Intervalo de Lectura */}
              <div>
                <label className="block text-xs font-bold text-[#555555] uppercase tracking-wider mb-2">Polling de Cámara (ms)</label>
                <div className="flex items-center gap-3">
                  <Activity className="w-5 h-5 text-gray-400" />
                  <input 
                    type="number" 
                    value={parametros.intervaloLectura}
                    onChange={(e) => setParametros({...parametros, intervaloLectura: parseInt(e.target.value)})}
                    className="flex-1 p-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-[#4A008B] focus:outline-none focus:ring-2 focus:ring-[#4A008B]/20"
                  />
                </div>
              </div>

              {/* Integración SAP */}
              <div className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl border border-gray-100">
                <div className="flex items-center gap-3">
                  <Zap className={`w-5 h-5 ${parametros.integracionSap ? 'text-emerald-500' : 'text-gray-400'}`} />
                  <div>
                    <p className="text-sm font-bold text-[#343A40]">Integración SAP</p>
                    <p className="text-[10px] text-gray-500">Protocolo SAP 315</p>
                  </div>
                </div>
                <button
                  onClick={() => setParametros({...parametros, integracionSap: !parametros.integracionSap})}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${parametros.integracionSap ? 'bg-emerald-500' : 'bg-gray-300'}`}
                >
                  <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${parametros.integracionSap ? 'translate-x-5' : 'translate-x-1'}`} />
                </button>
              </div>

              <button className="w-full flex justify-center items-center gap-2 px-4 py-3 bg-[#4A008B] text-white rounded-xl hover:bg-[#38006B] font-bold text-sm shadow-soft transition-all">
                <Save className="w-4 h-4" /> Guardar Parámetros
              </button>
            </div>
          </div>
        </div>
      </div>

      {showModal && (
        <CrearUsuarioModal 
          usuarioParaEditar={usuarioParaEditar}
          onClose={() => { setShowModal(false); setUsuarioParaEditar(null); }} 
          onUsuarioGuardado={handleUsuarioGuardado} 
        />
      )}
    </div>
  );
};