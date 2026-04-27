import React, { useState, useEffect } from 'react';
import { api } from '../../shared/services/api';
import { Badge } from '../../shared/components/Badge';
import { Loader2, Search, ShieldCheck, RefreshCw } from 'lucide-react';
import { ValidacionModal } from './components/ValidacionModal';

export const LecturasModule = () => {
  const [lecturas, setLecturas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Nuevo estado para controlar qué pestaña está activa
  const [filtroActivo, setFiltroActivo] = useState('todas'); // 'todas', 'pendientes', 'auditadas'
  
  const [lecturaSeleccionada, setLecturaSeleccionada] = useState(null);

  const fetchHistorial = async () => {
    try {
      setLoading(true);
      // Aumentamos el límite a 500 para traer el historial completo del turno
      const response = await api.get('/lecturas?limite=500');
      setLecturas(response.lecturas || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistorial();
  }, []);

  const handleValidacionExitosa = (id, nuevoEstado) => {
    setLecturas(prevLecturas => 
      prevLecturas.map(lectura => 
        lectura.id === id ? { ...lectura, estado_sap: nuevoEstado } : lectura
      )
    );
  };

  // Motor de filtrado local para las pestañas
  const lecturasFiltradas = lecturas.filter(lectura => {
    if (filtroActivo === 'pendientes') {
      return lectura.estado_sap === 'pendiente' || lectura.estado_sap === 'error';
    }
    if (filtroActivo === 'auditadas') {
      return lectura.estado_sap === 'validado' || lectura.estado_sap === 'rechazado';
    }
    return true; // 'todas'
  });

  if (loading && lecturas.length === 0) {
    return (
      <div className="flex justify-center items-center h-full mt-20">
        <Loader2 className="w-10 h-10 animate-spin text-[#4A008B]" />
      </div>
    );
  }

  return (
    <div className="p-8 font-hanken">
      {/* Cabecera y Filtros */}
      <div className="mb-8 flex flex-col md:flex-row md:justify-between md:items-end gap-4">
        <div>
          <h1 className="font-inter font-bold text-3xl text-[#343A40] mb-2">Historial de Lecturas</h1>
          <p className="text-[#555555]">Auditoría completa de códigos SAP 315 registrados por las cámaras.</p>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Pestañas de Filtrado Rápido */}
          <div className="flex gap-1 bg-white p-1 rounded-xl border border-gray-200 shadow-soft">
            <button
              onClick={() => setFiltroActivo('todas')}
              className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${filtroActivo === 'todas' ? 'bg-[#4A008B] text-white shadow-sm' : 'text-[#555555] hover:bg-gray-50'}`}
            >
              Todas
            </button>
            <button
              onClick={() => setFiltroActivo('pendientes')}
              className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${filtroActivo === 'pendientes' ? 'bg-amber-500 text-white shadow-sm' : 'text-[#555555] hover:bg-gray-50'}`}
            >
              Pendientes
            </button>
            <button
              onClick={() => setFiltroActivo('auditadas')}
              className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${filtroActivo === 'auditadas' ? 'bg-[#0AE8C6] text-black shadow-sm' : 'text-[#555555] hover:bg-gray-50'}`}
            >
              Auditadas
            </button>
          </div>

          <button 
            onClick={fetchHistorial} 
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-[#4A008B] shadow-soft hover:bg-[#F3E8FF] font-bold text-sm transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl border border-red-100">
          {error}
        </div>
      )}

      {/* Tabla de Historial (Renderiza 'lecturasFiltradas') */}
      <div className="bg-white rounded-2xl shadow-soft border border-gray-100 overflow-hidden">
        <div className="max-h-[600px] overflow-y-auto">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-gray-50 z-10 shadow-sm">
              <tr className="border-b border-gray-100 text-xs font-inter font-semibold text-[#555555] uppercase tracking-wider">
                <th className="p-4">ID / Fecha</th>
                <th className="p-4">Código</th>
                <th className="p-4">LPN</th>
                <th className="p-4">Línea</th>
                <th className="p-4">Confianza</th>
                <th className="p-4">Estado Actual</th>
                <th className="p-4 text-center">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {lecturasFiltradas.length === 0 ? (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-gray-400 font-medium"> {/* <-- Ajustado a 7 columnas */}
                    No hay lecturas en esta categoría.
                  </td>
                </tr>
              ) : (
                lecturasFiltradas.map((lectura) => (
                  <tr key={lectura.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="p-4">
                      <div className="font-medium text-[#343A40]">#{lectura.id}</div>
                      <div className="text-xs text-gray-400">{new Date(lectura.fecha_hora).toLocaleString()}</div>
                    </td>
                    <td className="p-4 font-mono text-sm font-bold text-[#38006B]">{lectura.codigo_etiqueta}</td>
                    
                    {/* Visualización del LPN */}
                    <td className="p-4">
                      <span className="px-2 py-1 bg-gray-100 text-[#555555] rounded text-xs font-mono border border-gray-200">
                        {lectura.lpn || 'N/A'}
                      </span>
                    </td>

                    <td className="p-4 text-sm text-[#555555]">{lectura.linea_origen}</td>
                    <td className="p-4">
                      <span className={`text-sm font-bold ${lectura.confianza > 80 ? 'text-[#0AE8C6]' : lectura.confianza > 65 ? 'text-amber-500' : 'text-red-500'}`}>
                        {lectura.confianza}%
                      </span>
                    </td>
                    <td className="p-4">
                      <Badge variant={lectura.estado_sap}>{lectura.estado_sap}</Badge>
                    </td>
                    <td className="p-4 text-center">
                      {(lectura.estado_sap === 'pendiente' || lectura.estado_sap === 'error') ? (
                        <button 
                          onClick={() => setLecturaSeleccionada(lectura)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#F3E8FF] text-[#4A008B] hover:bg-[#4A008B] hover:text-white rounded-lg text-xs font-bold transition-colors"
                        >
                          <ShieldCheck className="w-4 h-4" />
                          Auditar
                        </button>
                      ) : (
                        <span className="text-xs text-gray-400 italic">Auditado</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Validación */}
      {lecturaSeleccionada && (
        <ValidacionModal 
          lectura={lecturaSeleccionada}
          onClose={() => setLecturaSeleccionada(null)}
          onValidacionExitosa={handleValidacionExitosa}
        />
      )}
    </div>
  );
};