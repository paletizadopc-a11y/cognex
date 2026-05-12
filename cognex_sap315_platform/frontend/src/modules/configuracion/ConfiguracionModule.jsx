import React, { useState, useEffect, useCallback } from 'react';
import { 
  Users, UserPlus, Settings, Shield, Loader2, Mail, 
  Trash2, Edit2, Cpu, Activity, Save, AlertCircle, 
  Zap, BellRing, Database, CheckCircle, RefreshCcw
} from 'lucide-react';
import { api } from '../../shared/services/api';
import { Badge } from '../../shared/components/Badge';
import { CrearUsuarioModal } from './components/CrearUsuarioModal';

export const ConfiguracionModule = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [loadingUsuarios, setLoadingUsuarios] = useState(true);
  const [savingParametros, setSavingParametros] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [usuarioParaEditar, setUsuarioParaEditar] = useState(null);

  // 🚀 Estado para parámetros operativos sincronizados con el Backend
  const [parametros, setParametros] = useState({
    umbralConfianza: 55, 
    modoOperacion: 'AUTOMATICO',
    intervaloLectura: 2000,
    integracionSap: true,
    autoAlertasAuditoria: true 
  });

  /**
   * 🚀 SOLUCIÓN: Carga Resiliente
   * Separamos las peticiones para que un error 404 en parámetros 
   * no bloquee la visualización de los usuarios.
   */
  const fetchConfig = useCallback(async () => {
    setLoadingUsuarios(true);
    
    // 1. Cargar Usuarios
    try {
      const usrRes = await api.get('/usuarios');
      setUsuarios(usrRes.usuarios || []);
    } catch (err) {
      console.error("[CONFIG] Error cargando usuarios:", err);
    }

    // 2. Cargar Parámetros (Independiente)
    try {
      const configRes = await api.get('/configuracion/parametros');
      if (configRes && configRes.parametros) {
        setParametros(configRes.parametros);
      }
    } catch (err) {
      // Si falla (404), mantenemos los valores por defecto del estado inicial
      console.warn("[CONFIG] Parámetros no disponibles, usando valores por defecto.");
    } finally {
      setLoadingUsuarios(false);
    }
  }, []);

  useEffect(() => { 
    fetchConfig(); 
  }, [fetchConfig]);

  // Gestión de Usuarios
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
      await api.patch(`/usuarios/${id}/estado`, { activo: !estadoActual });
      setUsuarios(usuarios.map(u => u.id === id ? { ...u, activo: !estadoActual } : u));
    } catch (err) {
      alert('No se pudo cambiar el estado del usuario.');
    }
  };

  // 🚀 Persistencia de Parámetros Operativos
  const handleSaveParametros = async () => {
    setSavingParametros(true);
    try {
      await api.post('/configuracion/parametros', parametros);
      alert('Parámetros de planta actualizados correctamente.');
    } catch (err) {
      console.error("Error al guardar:", err);
      alert('Error al guardar la configuración en el servidor.');
    } finally {
      setSavingParametros(false);
    }
  };

  return (
    <div className="p-8 font-hanken animate-in fade-in">
      {/* Cabecera Institucional */}
      <div className="mb-8 flex justify-between items-start">
        <div>
          <h1 className="font-inter font-bold text-3xl text-[#343A40] mb-2 flex items-center gap-3">
            <Settings className="w-8 h-8 text-[#4A008B]" />
            Configuración del Sistema
          </h1>
          <p className="text-[#555555]">Panel administrativo para parámetros de producción y acceso de usuarios.</p>
        </div>
        <Badge variant="validado" className="bg-[#0AE8C6]/10 text-[#2C0140] px-4 py-2 border-[#0AE8C6]">
          Protocolo SAP 315 v2.0
        </Badge>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* COLUMNA IZQUIERDA: Usuarios */}
        <div className="xl:col-span-2 space-y-8">
          <div className="bg-white rounded-3xl shadow-soft border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/30">
              <h3 className="font-inter font-bold text-lg text-[#343A40] flex items-center gap-2">
                <Users className="w-5 h-5 text-[#4A008B]" /> Gestión de Accesos
              </h3>
              <button 
                onClick={() => { setUsuarioParaEditar(null); setShowModal(true); }}
                className="flex items-center gap-2 px-6 py-2.5 bg-[#4A008B] text-white rounded-xl hover:bg-[#38006B] font-bold text-sm shadow-lg shadow-[#4A008B]/20 transition-all"
              >
                <UserPlus className="w-4 h-4" /> Crear Nuevo
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50/50">
                  <tr className="text-[10px] font-black text-[#555555] uppercase tracking-widest border-b border-gray-100">
                    <th className="p-6">Identidad</th>
                    <th className="p-6">Rol de Sistema</th>
                    <th className="p-6 text-center">Estado</th>
                    <th className="p-6 text-center">Gestión</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {loadingUsuarios ? (
                    <tr>
                      <td colSpan="4" className="p-16 text-center">
                        <Loader2 className="w-10 h-10 animate-spin text-[#4A008B] mx-auto opacity-20" />
                        <p className="text-xs text-gray-400 mt-2">Sincronizando personal...</p>
                      </td>
                    </tr>
                  ) : usuarios.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="p-16 text-center text-gray-400 italic text-sm">
                        No se encontraron usuarios registrados.
                      </td>
                    </tr>
                  ) : (
                    usuarios.map((u) => (
                      <tr key={u.id} className={`hover:bg-gray-50/30 transition-all ${!u.activo ? 'opacity-50 grayscale-[0.5]' : ''}`}>
                        <td className="p-6">
                          <div className="flex items-center gap-4">
                            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-white font-black shadow-inner ${u.activo ? 'bg-[#4A008B]' : 'bg-gray-400'}`}>
                              {u.nombre.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-bold text-sm text-[#343A40]">{u.nombre}</div>
                              <div className="text-[10px] text-gray-400 font-mono tracking-tight uppercase">{u.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-6">
                          <Badge variant="secondary" className="text-[9px] font-black">
                            {u.rol?.nombre_rol || 'SIN ROL'}
                          </Badge>
                        </td>
                        <td className="p-6 text-center">
                          <button
                            onClick={() => handleToggleEstado(u.id, u.activo)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all ${u.activo ? 'bg-[#0AE8C6]' : 'bg-gray-200'}`}
                          >
                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-transform ${u.activo ? 'translate-x-6' : 'translate-x-1'}`} />
                          </button>
                        </td>
                        <td className="p-6 text-center">
                          <div className="flex justify-center gap-4">
                            <button onClick={() => { setUsuarioParaEditar(u); setShowModal(true); }} className="p-2 text-gray-400 hover:text-[#4A008B] hover:bg-purple-50 rounded-lg transition-colors"><Edit2 className="w-4 h-4" /></button>
                            <button onClick={() => { if(window.confirm('¿Eliminar?')) api.delete(`/usuarios/${u.id}`).then(() => fetchConfig()) }} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
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

        {/* COLUMNA DERECHA: Parámetros */}
        <div className="space-y-8">
          <div className="bg-white rounded-3xl shadow-soft border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 bg-gray-50/50">
              <h3 className="font-inter font-bold text-lg text-[#343A40] flex items-center gap-2">
                <Cpu className="w-5 h-5 text-[#4A008B]" /> Planta & Hardware
              </h3>
            </div>

            <div className="p-6 space-y-8">
              {/* Umbral Cognex */}
              <div>
                <label className="block text-[10px] font-black text-[#555555] uppercase tracking-widest mb-4 flex justify-between">
                  Umbral de Confianza Cognex <span>{parametros.umbralConfianza}%</span>
                </label>
                <input 
                  type="range" min="30" max="95" step="5"
                  value={parametros.umbralConfianza}
                  onChange={(e) => setParametros({...parametros, umbralConfianza: parseInt(e.target.value)})}
                  className="w-full h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-[#4A008B] mb-4"
                />
                <div className="p-4 bg-[#F3E8FF] rounded-2xl flex items-start gap-3 border border-[#E0B3FF]">
                  <AlertCircle className="w-5 h-5 text-[#4A008B] shrink-0 mt-0.5" />
                  <p className="text-[11px] text-[#4A008B] leading-relaxed">
                    Las lecturas capturadas con un score inferior a <strong>{parametros.umbralConfianza}%</strong> generarán automáticamente una alerta en el Monitor en Vivo.
                  </p>
                </div>
              </div>

              {/* Polling */}
              <div>
                <label className="block text-[10px] font-black text-[#555555] uppercase tracking-widest mb-2">Polling Frecuencia (ms)</label>
                <div className="relative">
                  <Activity className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                  <input 
                    type="number" 
                    value={parametros.intervaloLectura}
                    onChange={(e) => setParametros({...parametros, intervaloLectura: parseInt(e.target.value)})}
                    className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold text-[#4A008B] focus:ring-2 focus:ring-[#4A008B]/10 outline-none"
                  />
                </div>
              </div>

              {/* Sincronización Automática */}
              <div className="p-5 bg-gray-50 rounded-3xl border border-gray-100 space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-[#0AE8C6]/10 rounded-lg text-[#0AE8C6]">
                      <BellRing className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[#343A40]">Auto-Alertas Auditoría</p>
                      <p className="text-[10px] text-gray-500 uppercase tracking-tighter">Sincronía Softys</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setParametros({...parametros, autoAlertasAuditoria: !parametros.autoAlertasAuditoria})}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-all ${parametros.autoAlertasAuditoria ? 'bg-[#0AE8C6]' : 'bg-gray-300'}`}
                  >
                    <span className={`inline-block h-3 w-3 transform rounded-full bg-white shadow transition-transform ${parametros.autoAlertasAuditoria ? 'translate-x-5' : 'translate-x-1'}`} />
                  </button>
                </div>
                <p className="text-[10px] text-gray-500 italic leading-snug">
                  Habilita la creación de alertas automáticas para LPNs faltantes durante la Auditoría de Carga.
                </p>
              </div>

              {/* Botón Guardar */}
              <button 
                onClick={handleSaveParametros}
                disabled={savingParametros}
                className="w-full flex justify-center items-center gap-3 px-4 py-4 bg-[#4A008B] text-white rounded-2xl hover:bg-[#38006B] font-black text-xs uppercase tracking-widest shadow-xl shadow-[#4A008B]/20 transition-all active:scale-95 disabled:opacity-50"
              >
                {savingParametros ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                {savingParametros ? 'Actualizando...' : 'Guardar Parámetros de Planta'}
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

export default ConfiguracionModule;