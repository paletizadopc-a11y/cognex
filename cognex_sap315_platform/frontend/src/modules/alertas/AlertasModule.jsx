import React, { useState, useEffect, useCallback } from 'react';
import { 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Filter, 
  AlertOctagon, 
  RefreshCw,
  Search,
  CheckCircle2,
  Loader2,
  ShieldAlert,
  Info
} from 'lucide-react';
import { api } from '../../shared/services/api';
import { Badge } from '../../shared/components/Badge';

export const AlertasModule = () => {
  const [alertas, setAlertas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [resolviendoId, setResolviendoId] = useState(null);
  const [busqueda, setBusqueda] = useState('');
  const [filtro, setFiltro] = useState('pendientes'); 

  // 🚀 Mejora: Memorización de la función de carga para evitar re-renderizados innecesarios
  const fetchAlertas = useCallback(async () => {
    try {
      setLoading(true);
      // El backend devuelve registros con estado 'error' o 'pendiente'
      const response = await api.get('/lecturas/alertas'); 
      setAlertas(response.alertas || []);
    } catch (err) {
      console.error("[FRONTEND] Error cargando alertas:", err);
      setAlertas([]); 
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { 
    fetchAlertas(); 
    // Auto-refresco cada 30 segundos para monitoreo en tiempo real
    const interval = setInterval(fetchAlertas, 30000);
    return () => clearInterval(interval);
  }, [fetchAlertas]);

  const handleResolverAlerta = async (id) => {
    try {
      setResolviendoId(id);
      await api.patch(`/lecturas/alertas/${id}/resolver`);
      // Feedback inmediato en la UI
      setAlertas(prev => prev.map(a => a.id === id ? { ...a, estado: 'resuelto' } : a));
    } catch (err) {
      console.error("Error al resolver:", err);
      alert("Error técnico al intentar cerrar la incidencia.");
    } finally {
      setResolviendoId(null);
    }
  };

  // 🚀 Lógica de Filtrado Inteligente
  const alertasFiltradas = alertas.filter(alerta => {
    const estadoNormalizado = alerta.estado === 'resuelto' ? 'resueltas' : 'pendientes';
    const cumpleFiltro = filtro === 'todas' ? true : estadoNormalizado === filtro;
    
    const termino = busqueda.toLowerCase();
    const cumpleBusqueda = 
      alerta.lpn?.toLowerCase().includes(termino) || 
      alerta.descripcion?.toLowerCase().includes(termino) ||
      alerta.linea_origen?.toLowerCase().includes(termino);
      
    return cumpleFiltro && cumpleBusqueda;
  });

  const stats = {
    pendientes: alertas.filter(a => a.estado !== 'resuelto').length,
    resueltas: alertas.filter(a => a.estado === 'resuelto').length
  };

  return (
    <div className="p-8 font-hanken animate-in fade-in duration-500">
      {/* 1. Cabecera y Resumen Operativo */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-8 gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <ShieldAlert className="w-8 h-8 text-red-500" />
            <h1 className="font-inter font-bold text-3xl text-[#343A40]">Centro de Incidencias</h1>
          </div>
          <p className="text-[#555555]">Supervisión de discrepancias detectadas por Cámara Cognex y Auditoría SAP 315.</p>
        </div>

        <div className="flex gap-4">
          <div className="bg-red-50 border border-red-100 px-6 py-3 rounded-2xl text-center shadow-sm">
            <p className="text-[10px] uppercase font-black text-red-600 tracking-tighter">Críticas / Pendientes</p>
            <p className="text-2xl font-black text-red-700">{stats.pendientes}</p>
          </div>
          <div className="bg-emerald-50 border border-emerald-100 px-6 py-3 rounded-2xl text-center shadow-sm">
            <p className="text-[10px] uppercase font-black text-emerald-600 tracking-tighter">Total Resueltas</p>
            <p className="text-2xl font-black text-emerald-700">{stats.resueltas}</p>
          </div>
          <button 
            onClick={fetchAlertas}
            className="p-4 bg-white border border-gray-200 rounded-2xl hover:bg-gray-50 text-[#4A008B] transition-all shadow-soft"
            title="Sincronizar ahora"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* 2. Filtros y Control de Búsqueda */}
      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-soft mb-6 flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input 
            type="text"
            placeholder="Filtrar por LPN, Línea o detalle del error..."
            className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-100 focus:border-[#4A008B] focus:ring-2 focus:ring-[#4A008B]/5 outline-none text-sm transition-all"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>
        
        <div className="flex bg-gray-50 p-1.5 rounded-xl border border-gray-100 w-full md:w-auto">
          {[
            { id: 'pendientes', label: 'Pendientes' },
            { id: 'resueltas', label: 'Resueltas' },
            { id: 'todas', label: 'Todo el Turno' }
          ].map((opt) => (
            <button
              key={opt.id}
              onClick={() => setFiltro(opt.id)}
              className={`flex-1 md:flex-none px-6 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${
                filtro === opt.id 
                ? 'bg-[#4A008B] text-white shadow-md shadow-[#4A008B]/20' 
                : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Listado de Alertas */}
      <div className="bg-white rounded-3xl shadow-soft border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/50 text-[#555555] text-[10px] uppercase font-black tracking-widest border-b border-gray-100">
                <th className="p-6">Prioridad</th>
                <th className="p-6">LPN Identificado</th>
                <th className="p-6">Detalle de la Incidencia</th>
                <th className="p-6">Tiempo Transcurrido</th>
                <th className="p-6 text-center">Estado</th>
                <th className="p-6 text-center">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 font-hanken">
              {loading && alertas.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-20 text-center">
                    <Loader2 className="w-10 h-10 animate-spin text-[#4A008B] mx-auto mb-4 opacity-20" />
                    <p className="text-sm font-bold text-gray-400">Escaneando base de datos...</p>
                  </td>
                </tr>
              ) : alertasFiltradas.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-20 text-center">
                    <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="w-8 h-8 text-emerald-500" />
                    </div>
                    <p className="text-gray-400 font-medium">Sin incidencias pendientes en este filtro.</p>
                  </td>
                </tr>
              ) : (
                alertasFiltradas.map((alerta) => (
                  <tr key={alerta.id} className="group hover:bg-gray-50/50 transition-colors">
                    {/* PRIORIDAD */}
                    <td className="p-6">
                      <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-tighter ${
                        alerta.estado === 'resuelto' 
                        ? 'bg-gray-50 text-gray-400 border-gray-200'
                        : alerta.linea_origen === 'AUDITORIA_SISTEMA'
                          ? 'bg-red-50 text-red-600 border-red-200 animate-pulse'
                          : 'bg-amber-50 text-amber-600 border-amber-200'
                      }`}>
                        {alerta.linea_origen === 'AUDITORIA_SISTEMA' ? <AlertOctagon className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                        {alerta.linea_origen === 'AUDITORIA_SISTEMA' ? 'CRÍTICO' : 'AVISO'}
                      </div>
                    </td>

                    {/* LPN */}
                    <td className="p-6">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-lg text-[#38006B] tracking-tight">
                          {alerta.lpn || 'S/N'}
                        </span>
                        {alerta.linea_origen === 'AUDITORIA_SISTEMA' && (
                          <div className="group/info relative">
                            <Info className="w-4 h-4 text-[#0AE8C6] cursor-help" />
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-[#2C0140] text-white text-[10px] rounded-lg opacity-0 group-hover/info:opacity-100 transition-opacity z-50 pointer-events-none shadow-xl">
                              Generada automáticamente por discrepancia en Auditoría de Carga.
                            </div>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* DESCRIPCIÓN */}
                    <td className="p-6">
                      <div className="text-sm font-bold text-[#343A40] mb-1">
                        {alerta.descripcion || (alerta.linea_origen === 'AUDITORIA_SISTEMA' ? 'LPN Faltante en Planificación Softys' : 'Error de lectura de cámara')}
                      </div>
                      <div className="flex items-center gap-2">
                         <Badge variant="secondary" className="text-[9px] py-0.5 bg-gray-100 text-gray-500 border-none">
                           Origen: {alerta.linea_origen?.replace('_', ' ') || 'Línea de Producción'}
                         </Badge>
                      </div>
                    </td>

                    {/* HORA */}
                    <td className="p-6">
                      <div className="flex items-center gap-2 text-gray-500">
                        <Clock className="w-3.5 h-3.5" />
                        <span className="text-xs font-medium">
                          {new Date(alerta.fecha).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </td>

                    {/* ESTADO */}
                    <td className="p-6 text-center">
                      <Badge variant={alerta.estado === 'resuelto' ? 'validado' : 'rechazado'}>
                        {alerta.estado === 'resuelto' ? 'CERRADA' : 'ACTIVA'}
                      </Badge>
                    </td>

                    {/* ACCIÓN */}
                    <td className="p-6 text-center">
                      {alerta.estado !== 'resuelto' ? (
                        <button 
                          onClick={() => handleResolverAlerta(alerta.id)}
                          disabled={resolviendoId === alerta.id}
                          className="px-6 py-2.5 bg-[#4A008B] text-white rounded-xl hover:bg-[#38006B] font-black text-[10px] uppercase tracking-widest transition-all shadow-md shadow-[#4A008B]/20 flex items-center gap-2 mx-auto disabled:opacity-50"
                        >
                          {resolviendoId === alerta.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                          Cerrar Incidencia
                        </button>
                      ) : (
                        <div className="flex items-center justify-center gap-1 text-emerald-500 font-black text-[9px] uppercase tracking-widest">
                          <CheckCircle2 className="w-3 h-3" /> Resuelta
                        </div>
                      )}
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