import React, { useState, useEffect } from 'react';
import { api } from '../../shared/services/api';
import { useAuth } from '../../shared/context/AuthContext';
import { Badge } from '../../shared/components/Badge';
import { Loader2, Search, ShieldCheck, RefreshCw, Filter } from 'lucide-react';
import { ValidacionModal } from './components/ValidacionModal';

export const LecturasModule = () => {
  const { user } = useAuth();
  const [lecturas, setLecturas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [filtroActivo, setFiltroActivo] = useState('todas');
  const [busqueda, setBusqueda] = useState('');
  const [filtroLpn, setFiltroLpn] = useState('');
  const [filtroCodigo, setFiltroCodigo] = useState('');
  
  const [lecturaSeleccionada, setLecturaSeleccionada] = useState(null);

  const rolActual = user?.rol?.toLowerCase() || 'operador';
  const puedeAuditar = rolActual === 'admin' || rolActual === 'supervisor';

  const fetchHistorial = async () => {
    try {
      setLoading(true);
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

  const handleValidacionExitosa = (id, nuevoEstado, datosCorregidos) => {
    setLecturas(prevLecturas => 
      prevLecturas.map(lectura => 
        lectura.id === id ? { 
          ...lectura, 
          estado_sap: nuevoEstado,
          codigo_etiqueta: datosCorregidos?.codigo_etiqueta || lectura.codigo_etiqueta,
          lpn: datosCorregidos?.lpn || lectura.lpn,
          linea_origen: datosCorregidos?.linea_origen || lectura.linea_origen
        } : lectura
      )
    );
  };

  const lecturasFiltradas = lecturas.filter(lectura => {
    let pasaPestaña = true;
    if (filtroActivo === 'pendientes') {
      pasaPestaña = lectura.estado_sap === 'pendiente' || lectura.estado_sap === 'error';
    } else if (filtroActivo === 'auditadas') {
      pasaPestaña = lectura.estado_sap === 'validado' || lectura.estado_sap === 'rechazado';
    }

    const pasaBusqueda = busqueda === '' || 
      lectura.id.toString().includes(busqueda) || 
      (lectura.linea_origen && lectura.linea_origen.toLowerCase().includes(busqueda.toLowerCase()));

    const pasaLpn = filtroLpn === '' || 
      (lectura.lpn && lectura.lpn.toLowerCase().includes(filtroLpn.toLowerCase()));

    const pasaCodigo = filtroCodigo === '' || 
      (lectura.codigo_etiqueta && lectura.codigo_etiqueta.toLowerCase().includes(filtroCodigo.toLowerCase()));

    return pasaPestaña && pasaBusqueda && pasaLpn && pasaCodigo;
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
      <div className="mb-6 flex flex-col md:flex-row md:justify-between md:items-end gap-4">
        <div>
          <h1 className="font-inter font-bold text-3xl text-[#343A40] mb-2">Historial de Lecturas</h1>
          <p className="text-[#555555]">Auditoría completa de códigos SAP 315 registrados por las cámaras.</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex gap-1 bg-white p-1 rounded-xl border border-gray-200 shadow-soft">
            {['todas', 'pendientes', 'auditadas'].map((f) => (
              <button 
                key={f}
                onClick={() => setFiltroActivo(f)} 
                className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all capitalize ${filtroActivo === f ? 'bg-[#4A008B] text-white shadow-sm' : 'text-[#555555] hover:bg-gray-50'}`}
              >
                {f}
              </button>
            ))}
          </div>

          <button onClick={fetchHistorial} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-[#4A008B] shadow-soft hover:bg-[#F3E8FF] font-bold text-sm transition-colors">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl shadow-soft border border-gray-100 mb-6 flex flex-col lg:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input 
            type="text" placeholder="Buscar por ID o Línea..." value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#4A008B]/20 transition-all"
          />
        </div>
        
        <div className="relative flex-1 w-full">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input 
            type="text" placeholder="LPN..." value={filtroLpn}
            onChange={(e) => setFiltroLpn(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm font-mono outline-none"
          />
        </div>

        <div className="relative flex-1 w-full">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input 
            type="text" placeholder="Código..." value={filtroCodigo}
            onChange={(e) => setFiltroCodigo(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm font-mono outline-none"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-soft border border-gray-100 overflow-hidden">
        <div className="max-h-[600px] overflow-y-auto">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-gray-50 z-10 shadow-sm text-xs font-inter font-semibold text-[#555555] uppercase">
              <tr>
                <th className="p-4">ID / Fecha</th>
                <th className="p-4">Código</th>
                <th className="p-4">LPN</th>
                <th className="p-4">Línea</th>
                <th className="p-4">Confianza</th>
                <th className="p-4">Estado Actual</th>
                <th className="p-4 text-center">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-sm">
              {lecturasFiltradas.map((lectura) => (
                <tr key={lectura.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="p-4">
                    <div className="font-medium text-[#343A40]">#{lectura.id}</div>
                    <div className="text-xs text-gray-400">{new Date(lectura.fecha_hora).toLocaleString()}</div>
                  </td>
                  <td className="p-4 font-mono font-bold text-[#38006B]">{lectura.codigo_etiqueta}</td>
                  <td className="p-4 font-mono text-xs text-gray-500">{lectura.lpn || 'N/A'}</td>
                  <td className="p-4">{lectura.linea_origen}</td>
                  <td className="p-4">
                    {/* 🚀 Renderizado de colores actualizado para la regla de 55% */}
                    <span className={`font-bold ${
                      lectura.confianza >= 80 ? 'text-[#0AE8C6]' : 
                      lectura.confianza >= 55 ? 'text-amber-500' : 
                      'text-red-500'
                    }`}>
                      {lectura.confianza}%
                    </span>
                  </td>
                  <td className="p-4"><Badge variant={lectura.estado_sap}>{lectura.estado_sap}</Badge></td>
                  <td className="p-4 text-center">
                    {(lectura.estado_sap === 'pendiente' || lectura.estado_sap === 'error') ? (
                      puedeAuditar ? (
                        <button 
                          onClick={() => setLecturaSeleccionada(lectura)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#F3E8FF] text-[#4A008B] hover:bg-[#4A008B] hover:text-white rounded-lg text-xs font-bold transition-all"
                        >
                          <ShieldCheck className="w-4 h-4" /> Auditar
                        </button>
                      ) : (
                        <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded border border-amber-100 uppercase">
                          Solo Supervisor
                        </span>
                      )
                    ) : (
                      <span className="text-xs text-gray-400 italic">Auditado</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

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