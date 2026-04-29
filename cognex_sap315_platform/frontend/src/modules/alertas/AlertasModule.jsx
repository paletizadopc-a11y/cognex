import React, { useState, useEffect } from 'react';
// 🚀 AQUÍ ESTÁ LA CORRECCIÓN: Agregamos Loader2 a la importación
import { AlertTriangle, CheckCircle, Clock, Filter, AlertOctagon, ArrowRight, Activity, Loader2 } from 'lucide-react';
import { api } from '../../shared/services/api';
import { Badge } from '../../shared/components/Badge';

export const AlertasModule = () => {
  const [alertas, setAlertas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState('pendientes'); // 'pendientes', 'resueltas', 'todas'

  const fetchAlertas = async () => {
    try {
      setLoading(true);
      const response = await api.get('/lecturas/alertas'); 
      setAlertas(response.alertas || []);
    } catch (err) {
      console.error("[FRONTEND] Error cargando alertas:", err);
      setAlertas([]); 
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAlertas(); }, []);

  const handleResolverAlerta = async (id) => {
    try {
      await api.patch(`/lecturas/alertas/${id}/resolver`);
      setAlertas(alertas.map(a => a.id === id ? { ...a, estado: 'resuelto' } : a));
    } catch (err) {
      console.error("[FRONTEND] Error resolviendo alerta:", err);
      alert('Error al intentar resolver la alerta. Intente nuevamente.');
    }
  };

  const alertasFiltradas = alertas.filter(a => {
    if (filtro === 'pendientes') return a.estado === 'error' || a.estado === 'pendiente';
    if (filtro === 'resueltas') return a.estado === 'resuelto';
    return true; 
  });

  const totalPendientes = alertas.filter(a => a.estado === 'error' || a.estado === 'pendiente').length;
  const totalCriticas = alertas.filter(a => a.confianza < 40 && (a.estado === 'error' || a.estado === 'pendiente')).length;
  const totalResueltas = alertas.filter(a => a.estado === 'resuelto').length;

  return (
    <div className="p-8 font-hanken">
      {/* Cabecera */}
      <div className="mb-8 flex flex-col md:flex-row md:justify-between md:items-end gap-4">
        <div>
          <h1 className="font-inter font-bold text-3xl text-[#343A40] mb-2 flex items-center gap-3">
            <AlertTriangle className="w-8 h-8 text-[#4A008B]" />
            Centro de Alertas
          </h1>
          <p className="text-[#555555]">Monitoreo de excepciones y lecturas con baja confianza en planta.</p>
        </div>
      </div>

      {/* Tarjetas KPI */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-2xl p-6 shadow-soft border border-gray-100 flex items-center gap-4">
          <div className="p-4 bg-orange-50 text-orange-600 rounded-xl">
            <Activity className="w-8 h-8" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">Pendientes de Revisión</p>
            <h3 className="text-3xl font-inter font-bold text-[#343A40]">{totalPendientes}</h3>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-soft border border-gray-100 flex items-center gap-4">
          <div className="p-4 bg-red-50 text-red-600 rounded-xl">
            <AlertOctagon className="w-8 h-8" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">Críticas (&lt; 40%)</p>
            <h3 className="text-3xl font-inter font-bold text-[#343A40]">{totalCriticas}</h3>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-soft border border-gray-100 flex items-center gap-4">
          <div className="p-4 bg-emerald-50 text-emerald-600 rounded-xl">
            <CheckCircle className="w-8 h-8" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">Resueltas Hoy</p>
            <h3 className="text-3xl font-inter font-bold text-[#343A40]">{totalResueltas}</h3>
          </div>
        </div>
      </div>

      {/* Contenedor Principal */}
      <div className="bg-white rounded-2xl shadow-soft border border-gray-100 overflow-hidden">
        
        {/* Barra de Filtros */}
        <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex bg-white border border-gray-200 rounded-xl p-1 shadow-sm">
            <button 
              onClick={() => setFiltro('pendientes')}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${filtro === 'pendientes' ? 'bg-[#4A008B] text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
            >
              Requieren Acción
            </button>
            <button 
              onClick={() => setFiltro('resueltas')}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${filtro === 'resueltas' ? 'bg-[#4A008B] text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
            >
              Resueltas
            </button>
            <button 
              onClick={() => setFiltro('todas')}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${filtro === 'todas' ? 'bg-[#4A008B] text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
            >
              Historial
            </button>
          </div>
          
          <button onClick={fetchAlertas} className="flex items-center gap-2 px-4 py-2 text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 font-bold text-sm transition-all">
             Actualizar Datos
          </button>
        </div>

        {/* Tabla de Alertas */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50">
              <tr className="border-b border-gray-100 text-xs font-inter font-semibold text-[#555555] uppercase tracking-wider">
                <th className="p-4 pl-6">Hora / Fecha</th>
                <th className="p-4">Origen (Línea)</th>
                <th className="p-4">LPN / Producto</th>
                <th className="p-4 text-center">Confianza</th>
                <th className="p-4 text-center">Estado</th>
                <th className="p-4 text-center">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan="6" className="p-10 text-center">
                     <Loader2 className="w-8 h-8 animate-spin text-[#4A008B] mx-auto" />
                     <p className="text-gray-500 mt-2 text-sm">Cargando alertas desde el servidor...</p>
                  </td>
                </tr>
              ) : alertasFiltradas.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-10 text-center text-gray-500 font-medium">
                    <CheckCircle className="w-10 h-10 mx-auto text-emerald-400 mb-2" />
                    No hay alertas en esta vista. ¡Todo en orden!
                  </td>
                </tr>
              ) : (
                alertasFiltradas.map((alerta) => (
                  <tr key={alerta.id} className={`hover:bg-gray-50/50 transition-all ${alerta.estado === 'resuelto' ? 'opacity-60' : ''}`}>
                    <td className="p-4 pl-6">
                      <div className="flex items-center gap-2 text-sm text-[#343A40] font-bold">
                        <Clock className="w-4 h-4 text-gray-400" />
                        {new Date(alerta.fecha).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </div>
                      <div className="text-[11px] text-gray-500 ml-6">
                        {new Date(alerta.fecha).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="p-4 text-sm font-bold text-[#555555] uppercase">
                      {alerta.linea_origen}
                    </td>
                    <td className="p-4">
                      <div className="font-bold text-[#4A008B]">{alerta.lpn}</div>
                      <div className="text-xs text-gray-500">Cód: {alerta.codigo_etiqueta}</div>
                    </td>
                    <td className="p-4 text-center">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        alerta.confianza < 40 ? 'bg-red-100 text-red-700' : 
                        alerta.confianza < 55 ? 'bg-orange-100 text-orange-700' : 
                        'bg-emerald-100 text-emerald-700'
                      }`}>
                        {alerta.confianza}%
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      {alerta.estado === 'resuelto' ? (
                        <span className="text-emerald-600 font-bold text-xs flex items-center justify-center gap-1">
                          <CheckCircle className="w-4 h-4" /> Resuelto
                        </span>
                      ) : (
                        <span className="text-red-600 font-bold text-xs flex items-center justify-center gap-1 animate-pulse">
                          <AlertTriangle className="w-4 h-4" /> Pendiente
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      {alerta.estado !== 'resuelto' && (
                        <button 
                          onClick={() => handleResolverAlerta(alerta.id)}
                          className="px-4 py-2 bg-white border border-gray-200 text-[#4A008B] rounded-xl hover:bg-[#F3E8FF] hover:border-[#4A008B] font-bold text-xs transition-all shadow-sm flex items-center gap-2 mx-auto"
                        >
                          Validar Manual <ArrowRight className="w-3 h-3" />
                        </button>
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