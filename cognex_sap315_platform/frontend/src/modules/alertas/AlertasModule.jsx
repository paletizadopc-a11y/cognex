import React, { useState, useEffect, useCallback } from 'react';
import { 
  AlertTriangle, 
  CheckCircle, 
  Trash2, 
  RefreshCcw, 
  Loader2, 
  Search,
  ShieldAlert,
  Info,
  CheckCircle2,
  AlertOctagon
} from 'lucide-react';
import { api } from '../../shared/services/api';
import { Badge } from '../../shared/components/Badge';

export const AlertasModule = () => {
  const [alertas, setAlertas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [filtro, setFiltro] = useState('pendientes'); 
  const [procesandoId, setProcesandoId] = useState(null);

  /**
   * 🚀 PERSISTENCIA DE DATOS:
   * Los registros se consultan directamente al servidor, asegurando que
   * la información persista entre sesiones y cambios de módulo.
   */
  const fetchAlertas = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/lecturas/alertas');
      setAlertas(response.alertas || []);
    } catch (err) {
      console.error("Error de sincronización con la base de datos:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAlertas();
    const interval = setInterval(fetchAlertas, 60000); // Auto-refresco cada minuto
    return () => clearInterval(interval);
  }, [fetchAlertas]);

  /**
   * 🚀 VALIDAR LPN (Sincronización OK):
   * Mueve el registro del estado de error a validado en la base de datos.
   */
  const handleValidar = async (id) => {
    if (!window.confirm("¿Confirmar validación física y cierre de esta incidencia?")) return;
    try {
      setProcesandoId(id);
      await api.patch(`/lecturas/alertas/${id}/resolver`);
      setAlertas(prev => prev.map(a => a.id === id ? { ...a, estado: 'resuelto' } : a));
    } catch (err) {
      alert("Error técnico al intentar validar el LPN.");
    } finally {
      setProcesandoId(null);
    }
  };

  /**
   * 🚀 ELIMINAR REGISTRO:
   * Borra permanentemente el LPN de la trazabilidad del sistema.
   */
  const handleEliminar = async (id) => {
    if (!window.confirm("¿Eliminar este registro permanentemente de la base de datos? Esta acción no se puede deshacer.")) return;
    try {
      setProcesandoId(id);
      await api.delete(`/lecturas/${id}`);
      setAlertas(prev => prev.filter(a => a.id !== id));
    } catch (err) {
      alert("Error al intentar eliminar el registro.");
    } finally {
      setProcesandoId(null);
    }
  };

  const alertasFiltradas = alertas.filter(alerta => {
    const estadoNormalizado = alerta.estado === 'resuelto' ? 'resueltas' : 'pendientes';
    const cumpleFiltro = filtro === 'todas' ? true : estadoNormalizado === filtro;
    
    const termino = busqueda.toLowerCase();
    const cumpleBusqueda = 
      alerta.lpn?.toLowerCase().includes(termino) || 
      alerta.linea_origen?.toLowerCase().includes(termino);
      
    return cumpleFiltro && cumpleBusqueda;
  });

  return (
    <div className="p-8 font-hanken animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-8 gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <ShieldAlert className="w-8 h-8 text-red-500" />
            <h1 className="font-inter font-bold text-3xl text-[#343A40]">Centro de Incidencias</h1>
          </div>
          <p className="text-[#555555]">Gestión de discrepancias en lecturas Cognex y Auditorías Softys.</p>
        </div>

        <button 
          onClick={fetchAlertas}
          className="p-4 bg-white border border-gray-200 rounded-2xl hover:bg-gray-50 text-[#4A008B] transition-all shadow-soft"
        >
          <RefreshCcw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-soft mb-6 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input 
            type="text"
            placeholder="Buscar por LPN o línea..."
            className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-100 focus:border-[#4A008B] focus:ring-2 focus:ring-[#4A008B]/5 outline-none text-sm transition-all"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>
        
        <div className="flex bg-gray-50 p-1 rounded-xl border border-gray-100">
          {['pendientes', 'resueltas', 'todas'].map((id) => (
            <button
              key={id}
              onClick={() => setFiltro(id)}
              className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                filtro === id ? 'bg-[#4A008B] text-white shadow-md' : 'text-gray-400'
              }`}
            >
              {id}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-soft border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/50 text-[#555555] text-[10px] uppercase font-black tracking-widest border-b border-gray-100">
                <th className="p-6">Prioridad</th>
                <th className="p-6">Identificador LPN</th>
                <th className="p-6">Origen / Línea</th>
                <th className="p-6">Estado</th>
                <th className="p-6 text-center">Acciones Operativas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 font-hanken">
              {loading && alertas.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-20 text-center">
                    <Loader2 className="w-10 h-10 animate-spin text-[#4A008B] mx-auto opacity-20" />
                    <p className="text-xs font-bold text-gray-400 mt-4 uppercase tracking-tighter">Sincronizando memoria del sistema...</p>
                  </td>
                </tr>
              ) : (
                alertasFiltradas.map((alerta) => (
                  <tr key={alerta.id} className="group hover:bg-gray-50/50 transition-colors">
                    <td className="p-6">
                      <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-tighter ${
                        alerta.estado === 'resuelto' ? 'bg-gray-50 text-gray-400' : 'bg-red-50 text-red-600 border-red-100'
                      }`}>
                        {alerta.linea_origen === 'AUDITORIA_SISTEMA' ? <AlertOctagon className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                        {alerta.linea_origen === 'AUDITORIA_SISTEMA' ? 'Crítico' : 'Aviso'}
                      </div>
                    </td>
                    <td className="p-6">
                      <span className="font-mono font-black text-lg text-[#38006B] tracking-tight">{alerta.lpn || 'S/N'}</span>
                    </td>
                    <td className="p-6">
                      <div className="text-sm font-bold text-[#343A40]">{alerta.linea_origen?.replace('_', ' ') || 'Producción'}</div>
                      <div className="text-[10px] text-gray-400">{new Date(alerta.fecha).toLocaleString()}</div>
                    </td>
                    <td className="p-6">
                      <Badge variant={alerta.estado === 'resuelto' ? 'validado' : 'rechazado'}>
                        {alerta.estado === 'resuelto' ? 'CERRADA' : 'ACTIVA'}
                      </Badge>
                    </td>
                    <td className="p-6">
                      <div className="flex justify-center gap-2">
                        {alerta.estado !== 'resuelto' && (
                          <button 
                            onClick={() => handleValidar(alerta.id)}
                            disabled={procesandoId === alerta.id}
                            className="p-3 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-600 hover:text-white transition-all shadow-sm shadow-emerald-100 disabled:opacity-50"
                            title="Validar LPN"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                        )}
                        <button 
                          onClick={() => handleEliminar(alerta.id)}
                          disabled={procesandoId === alerta.id}
                          className="p-3 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-sm shadow-red-100 disabled:opacity-50"
                          title="Eliminar de la Base de Datos"
                        >
                          <Trash2 className="w-4 h-4" />
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
      
      <div className="mt-8 p-4 bg-[#F3E8FF] rounded-2xl border border-[#E0B3FF] flex items-start gap-3">
        <Info className="w-5 h-5 text-[#4A008B] mt-0.5" />
        <p className="text-xs text-[#4A008B] leading-relaxed">
          <strong>Control de Persistencia:</strong> Las validaciones marcadas aquí actualizan el historial de despachos permanentemente. Eliminar un registro lo borrará de la base de datos de trazabilidad sin dejar registros residuales en la memoria del módulo.
        </p>
      </div>
    </div>
  );
};

export default AlertasModule;