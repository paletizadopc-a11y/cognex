import React, { useState, useEffect, useRef } from 'react';
import { api } from '../../shared/services/api';
import { useAuth } from '../../shared/context/AuthContext';
import { Badge } from '../../shared/components/Badge';
import { Loader2, Search, ShieldCheck, RefreshCw, Filter, ScanLine, CheckCircle2, AlertCircle } from 'lucide-react';
import { ValidacionModal } from './components/ValidacionModal';

export const LecturasModule = () => {
  const { user } = useAuth();
  const [lecturas, setLecturas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [filtroActivo, setFiltroActivo] = useState('todas');
  const [busqueda, setBusqueda] = useState('');
  const [filtroLpn, setFiltroLpn] = useState('');
  
  const [lecturaSeleccionada, setLecturaSeleccionada] = useState(null);

  // 🚀 ESTADOS PARA EL ESCÁNER ZEBRA
  const [scanStatus, setScanStatus] = useState(null); 
  const barcodeBuffer = useRef('');
  const lastKeyTime = useRef(Date.now());

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

  // 🚀 MOTOR DEL ESCÁNER (Tolerancia 500ms)
  useEffect(() => {
    const handleKeyDown = async (e) => {
      // Ignorar si el usuario está escribiendo en un buscador o campo de texto
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;

      const currentTime = Date.now();
      
      // Control de velocidad ajustado para emulación USB-HID
      if (currentTime - lastKeyTime.current > 500) {
        barcodeBuffer.current = '';
      }
      lastKeyTime.current = currentTime;

      // Captura del 'Enter' final de la pistola
      if (e.key === 'Enter') {
        const lecturaFinal = barcodeBuffer.current.trim();
        barcodeBuffer.current = ''; 
        
        // El LPN de Softys es largo, validamos longitud mínima
        if (lecturaFinal.length > 5) { 
          await procesarCapturaLpn(lecturaFinal);
        }
        return;
      }

      // Acumular caracteres
      if (e.key.length === 1) {
        barcodeBuffer.current += e.key;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []); 

  // 🚀 FUNCIÓN QUE ENVÍA EL LPN DIRECTO AL BACKEND (Alineado con nueva BD)
  const procesarCapturaLpn = async (lpnCapturado) => {
    try {
      setScanStatus({ type: 'loading', msg: `Atrapando LPN: ${lpnCapturado}...` });
      
      // PAYLOAD LIMPIO: Solo enviamos lo que existe en la tabla SQL
      const payload = {
        lpn: lpnCapturado,        
        linea_origen: 'LINEA_01_RF_WEB'
      };

      await api.post('/lecturas', payload);
      
      setScanStatus({ type: 'success', msg: `¡LPN ${lpnCapturado} registrado con éxito!` });
      fetchHistorial();

    } catch (error) {
      setScanStatus({ type: 'error', msg: `Error al registrar. ¿El LPN ${lpnCapturado} ya existe?` });
      console.error("Error de RF:", error);
    } finally {
      setTimeout(() => setScanStatus(null), 4000);
    }
  };

  const handleValidacionExitosa = (id, nuevoEstado, datosCorregidos) => {
    setLecturas(prevLecturas => 
      prevLecturas.map(lectura => 
        lectura.id === id ? { 
          ...lectura, 
          estado_sap: nuevoEstado,
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

    return pasaPestaña && pasaBusqueda && pasaLpn;
  });

  if (loading && lecturas.length === 0) {
    return (
      <div className="flex justify-center items-center h-full mt-20">
        <Loader2 className="w-10 h-10 animate-spin text-[#4A008B]" />
      </div>
    );
  }

  return (
    <div className="p-8 font-hanken relative">
      
      {/* 🚀 BANNER FLOTANTE DEL ESCÁNER ZEBRA */}
      {scanStatus && (
        <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-full shadow-2 border flex items-center gap-3 font-bold text-sm animate-in slide-in-from-top-4 fade-in duration-300
          ${scanStatus.type === 'success' ? 'bg-[#0AE8C6]/10 border-[#0AE8C6] text-[#2C0140]' : 
            scanStatus.type === 'error' ? 'bg-red-50 border-red-200 text-red-700' : 
            'bg-[#F3E8FF] border-[#7B1FA2] text-[#4A008B]'}`}
        >
          {scanStatus.type === 'success' && <CheckCircle2 className="w-5 h-5 text-[#0AE8C6]" />}
          {scanStatus.type === 'error' && <AlertCircle className="w-5 h-5" />}
          {scanStatus.type === 'loading' && <Loader2 className="w-5 h-5 animate-spin" />}
          {scanStatus.msg}
        </div>
      )}

      <div className="mb-6 flex flex-col md:flex-row md:justify-between md:items-end gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="font-inter font-bold text-3xl text-[#343A40]">Historial de Lecturas</h1>
            <span className="flex items-center gap-1.5 bg-[#F3E8FF] text-[#4A008B] px-3 py-1 rounded-full text-xs font-bold border border-[#E0B3FF]">
              <ScanLine className="w-3.5 h-3.5" /> Escáner RF Activo
            </span>
          </div>
          <p className="text-[#555555]">Auditoría rápida. Dispara la pistola al código LPN de la caja.</p>
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
            type="text" placeholder="Filtrar por LPN..." value={filtroLpn}
            onChange={(e) => setFiltroLpn(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm font-mono outline-none focus:ring-2 focus:ring-[#4A008B]/20 transition-all"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-soft border border-gray-100 overflow-hidden">
        <div className="max-h-[600px] overflow-y-auto">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-gray-50 z-10 shadow-sm text-xs font-inter font-semibold text-[#555555] uppercase">
              <tr>
                <th className="p-4">ID / Fecha</th>
                <th className="p-4">LPN</th>
                <th className="p-4">Línea de Origen</th>
                <th className="p-4">Estado Actual</th>
                <th className="p-4 text-center">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-sm">
              {lecturasFiltradas.map((lectura) => (
                <tr key={lectura.id} className={`hover:bg-gray-50/50 transition-colors ${lectura.linea_origen === 'LINEA_01_RF_WEB' ? 'bg-[#F3E8FF]/20' : ''}`}>
                  <td className="p-4">
                    <div className="font-medium text-[#343A40]">#{lectura.id}</div>
                    <div className="text-xs text-gray-400">{new Date(lectura.fecha_hora).toLocaleString()}</div>
                  </td>
                  <td className="p-4 font-mono font-bold text-[#38006B] text-base">
                    {lectura.lpn || 'N/A'}
                    {lectura.linea_origen === 'LINEA_01_RF_WEB' && <ScanLine className="inline w-4 h-4 ml-2 text-[#0AE8C6]" title="Ingresado por Pistola" />}
                  </td>
                  <td className="p-4 font-medium text-[#555555]">{lectura.linea_origen}</td>
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