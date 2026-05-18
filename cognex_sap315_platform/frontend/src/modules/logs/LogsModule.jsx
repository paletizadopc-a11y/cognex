import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../../shared/services/api';
import { 
  History, 
  Search, 
  RefreshCw, 
  User, 
  Terminal,
  Clock,
  Filter,
  Loader2
} from 'lucide-react';

export const LogsModule = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [filtroModulo, setFiltroModulo] = useState('TODOS');

  const cargarLogs = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/logs');
      setLogs(response.logs || []);
    } catch (err) {
      console.error("Error sincronizando logs de auditoría:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarLogs();
  }, [cargarLogs]);

  // Filtrado lógico reactivo
  const logsFiltrados = logs.filter(log => {
    const cumpleModulo = filtroModulo === 'TODOS' ? true : log.modulo === filtroModulo;
    
    const termino = busqueda.toLowerCase();
    const cumpleBusqueda =
      log.usuario_nombre?.toLowerCase().includes(termino) ||
      log.usuario_email?.toLowerCase().includes(termino) ||
      log.accion?.toLowerCase().includes(termino) ||
      log.detalles?.toLowerCase().includes(termino);

    return cumpleModulo && cumpleBusqueda;
  });

  // Generador de insignias de color por módulo
  const getBadgeStyle = (modulo) => {
    switch (modulo) {
      case 'AUTH': return 'bg-blue-50 text-blue-700 border-blue-100';
      case 'LECTURAS': return 'bg-emerald-50 text-emerald-700 border-emerald-100'; // 🚀 NUEVO: Badge esmeralda operativo
      case 'ALERTAS': return 'bg-red-50 text-red-700 border-red-100';
      case 'PERFIL': return 'bg-amber-50 text-amber-700 border-amber-100';
      case 'MONITOR': return 'bg-purple-50 text-[#7B1FA2] border-purple-100';
      default: return 'bg-gray-50 text-gray-600 border-gray-100';
    }
  };

  return (
    <div className="p-8 font-hanken max-w-7xl mx-auto animate-in fade-in duration-500">
      
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-50 rounded-xl border border-purple-100">
              <History className="w-6 h-6 text-[#4A008B]" />
            </div>
            <h1 className="font-inter font-bold text-3xl text-[#343A40] tracking-tight">Logs de Auditoría</h1>
          </div>
          <p className="text-[#555555] text-sm">Historial completo y traza de transacciones de operadores en la plataforma SAP 315.</p>
        </div>

        <button 
          onClick={cargarLogs} disabled={loading}
          className="p-2.5 bg-white border border-gray-200 hover:border-gray-300 rounded-xl text-gray-500 transition-all flex items-center gap-2 text-xs font-bold uppercase tracking-wider shadow-sm disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Sincronizar Logs
        </button>
      </div>

      {/* Controles de Búsqueda y Filtrado */}
      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm mb-6 flex flex-col lg:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input 
            type="text"
            placeholder="Buscar por operador, acción o palabra clave..."
            className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-100 focus:border-[#4A008B] focus:ring-2 focus:ring-[#4A008B]/5 outline-none text-sm transition-all"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-2 bg-gray-50 p-1.5 rounded-xl border border-gray-100 overflow-x-auto">
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider px-2 flex items-center gap-1"><Filter className="w-3 h-3"/> Módulo:</span>
          {/* 🚀 SOLUCIÓN: Agregado 'LECTURAS' al array de mapeo de botones */}
          {['TODOS', 'AUTH', 'LECTURAS', 'ALERTAS', 'PERFIL', 'MONITOR'].map((mod) => (
            <button
              key={mod}
              onClick={() => setFiltroModulo(mod)}
              className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all shrink-0 ${
                filtroModulo === mod ? 'bg-[#4A008B] text-white shadow-sm' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              {mod}
            </button>
          ))}
        </div>
      </div>

      {/* Tabla de Logs */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/70 border-b border-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                <th className="p-5 w-48">Fecha / Hora</th>
                <th className="p-5">Operador</th>
                <th className="p-5 w-32">Módulo</th>
                <th className="p-5">Acción Ejecutada</th>
                <th className="p-5">Detalle Operacional</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-xs font-semibold text-[#343A40]">
              {loading && logs.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-16 text-center text-gray-400 font-bold">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-[#4A008B]" />
                    Cargando traza de auditoría del sistema...
                  </td>
                </tr>
              ) : logsFiltrados.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-12 text-center text-gray-400 font-bold uppercase tracking-tight">
                    No se registran logs de auditoría bajo los criterios ingresados.
                  </td>
                </tr>
              ) : (
                logsFiltrados.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50/40 transition-colors">
                    {/* Fecha y Hora */}
                    <td className="p-5 text-gray-400 font-medium whitespace-nowrap">
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-gray-300" />
                        {new Date(log.fecha_hora).toLocaleString()}
                      </span>
                    </td>
                    
                    {/* Operador */}
                    <td className="p-5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 bg-purple-100 text-[#4A008B] rounded-lg flex items-center justify-center font-black text-[11px] shrink-0">
                          <User className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-gray-700 truncate">{log.usuario_nombre}</p>
                          <p className="text-[10px] text-gray-400 font-medium truncate">{log.usuario_email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Módulo */}
                    <td className="p-5">
                      <span className={`px-2.5 py-0.5 border text-[9px] font-black uppercase tracking-wider rounded-md ${getBadgeStyle(log.modulo)}`}>
                        {log.modulo}
                      </span>
                    </td>

                    {/* Acción */}
                    <td className="p-5 font-mono font-bold text-[#38006B] tracking-tight">
                      {log.accion}
                    </td>

                    {/* Detalle Operacional */}
                    {/* 🚀 SOLUCIÓN: Removido el truncate, configurado max-w-md, break-words y whitespace-pre-wrap */}
                    <td className="p-5 font-mono text-[11px] text-gray-500 max-w-md break-words whitespace-pre-wrap group relative hover:text-gray-800 transition-colors" title={log.detalles}>
                      <span className="flex items-start gap-1.5">
                        <Terminal className="w-3.5 h-3.5 text-gray-300 shrink-0 mt-0.5" />
                        <span className="block">{log.detalles || '---'}</span>
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default LogsModule;