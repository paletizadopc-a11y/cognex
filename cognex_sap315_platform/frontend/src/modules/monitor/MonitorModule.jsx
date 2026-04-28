import React, { useState, useEffect } from 'react';
import { api } from '../../shared/services/api';
import { Camera, Scan, Wifi, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { Badge } from '../../shared/components/Badge';

export const MonitorModule = () => {
  const [ultimaLectura, setUltimaLectura] = useState(null);
  const [historialReciente, setHistorialReciente] = useState([]);
  const [flash, setFlash] = useState(false);
  const [conexionRealtime, setConexionRealtime] = useState(true);

  // Función para consultar la cámara en tiempo real
  const fetchLiveFeed = async () => {
    try {
      const response = await api.get('/lecturas?limite=6');
      const lecturas = response.lecturas || [];
      
      if (lecturas.length > 0) {
        const nuevaLectura = lecturas[0];
        
        // Si hay una lectura nueva, disparamos el flash de la cámara
        setUltimaLectura(prev => {
          if (!prev || prev.id !== nuevaLectura.id) {
            setFlash(true);
            setTimeout(() => setFlash(false), 300); // El flash dura 300ms
          }
          return nuevaLectura;
        });

        // Guardamos las otras 5 para el panel lateral
        setHistorialReciente(lecturas.slice(1, 6));
        setConexionRealtime(true);
      }
    } catch (err) {
      setConexionRealtime(false);
    }
  };

  useEffect(() => {
    // Polling agresivo cada 1.5 segundos para simular tiempo real
    fetchLiveFeed();
    const interval = setInterval(fetchLiveFeed, 1500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-8 font-hanken h-[calc(100vh-80px)] flex flex-col">
      {/* Cabecera del Monitor */}
      <div className="mb-6 flex justify-between items-end">
        <div>
          <h1 className="font-inter font-bold text-3xl text-[#343A40] mb-2 flex items-center gap-3">
            <Camera className="w-8 h-8 text-[#4A008B]" />
            Monitor en Vivo (Cam-01)
          </h1>
          <p className="text-[#555555]">Visualización en tiempo real de la línea de producción.</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-gray-200 shadow-sm">
          <div className="relative flex h-3 w-3">
            {conexionRealtime && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#0AE8C6] opacity-75"></span>}
            <span className={`relative inline-flex rounded-full h-3 w-3 ${conexionRealtime ? 'bg-[#0AE8C6]' : 'bg-red-500'}`}></span>
          </div>
          <span className="text-sm font-bold text-[#555555]">
            {conexionRealtime ? 'Conexión Estable' : 'Pérdida de Señal'}
          </span>
        </div>
      </div>

      {/* Área Principal: Visor y Panel Lateral */}
      <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0">
        
        {/* VISOR DE CÁMARA (Izquierda - Ocupa más espacio) */}
        <div className="flex-1 bg-[#1A1A1A] rounded-2xl overflow-hidden relative shadow-industrial border border-gray-800 flex flex-col">
          
          {/* Efecto Flash */}
          {flash && <div className="absolute inset-0 bg-white z-50 opacity-80 animate-pulse"></div>}
          
          {/* Top Bar del Visor */}
          <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-10 bg-gradient-to-b from-black/80 to-transparent">
            <Badge variant={conexionRealtime ? 'validado' : 'error'}>LIVE</Badge>
            <span className="text-white font-mono text-sm opacity-80">
              {new Date().toLocaleTimeString()}
            </span>
          </div>

          {/* Área Central (Simulación de Imagen) */}
          <div className="flex-1 relative flex items-center justify-center">
            {/* Retícula de Escaneo (Estilo Cognex) */}
            <div className="absolute inset-0 flex items-center justify-center opacity-20 pointer-events-none">
              <div className="w-64 h-64 border border-[#0AE8C6] relative">
                <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-[#0AE8C6] -ml-1 -mt-1"></div>
                <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-[#0AE8C6] -mr-1 -mt-1"></div>
                <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-[#0AE8C6] -ml-1 -mb-1"></div>
                <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-[#0AE8C6] -mr-1 -mb-1"></div>
                <div className="w-full h-px bg-[#0AE8C6] absolute top-1/2 animate-[pulse_2s_ease-in-out_infinite]"></div>
              </div>
            </div>

            {!ultimaLectura ? (
              <div className="text-center text-gray-500">
                <Scan className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>Esperando lectura de caja...</p>
              </div>
            ) : (
              <div className="z-10 text-center transform scale-110 transition-transform">
                <Scan className={`w-24 h-24 mx-auto mb-6 ${ultimaLectura.confianza > 80 ? 'text-[#0AE8C6]' : 'text-amber-500'}`} />
                <h2 className="text-5xl font-mono font-bold text-white mb-2 tracking-wider">
                  {ultimaLectura.codigo_etiqueta}
                </h2>
                <div className="inline-block px-4 py-1 bg-[#4A008B] text-white font-mono text-xl rounded border border-[#7B1FA2] mb-4 shadow-[0_0_15px_rgba(74,0,139,0.5)]">
                  {ultimaLectura.lpn}
                </div>
              </div>
            )}
          </div>

          {/* Bottom Bar del Visor */}
          <div className="p-4 bg-black/60 border-t border-gray-800 backdrop-blur-md">
            {ultimaLectura && (
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center border-r border-gray-700">
                  <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Confianza Visual</p>
                  <p className={`text-2xl font-bold ${ultimaLectura.confianza > 80 ? 'text-[#0AE8C6]' : 'text-amber-500'}`}>
                    {ultimaLectura.confianza}%
                  </p>
                </div>
                <div className="text-center border-r border-gray-700">
                  <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Línea Origen</p>
                  <p className="text-lg font-bold text-white">{ultimaLectura.linea_origen}</p>
                </div>
                <div className="text-center flex flex-col items-center justify-center">
                  <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Estado SAP</p>
                  <Badge variant={ultimaLectura.estado_sap}>{ultimaLectura.estado_sap.toUpperCase()}</Badge>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* PANEL LATERAL: HISTORIAL RÁPIDO */}
        <div className="w-full lg:w-80 bg-white rounded-2xl shadow-soft border border-gray-100 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
            <h3 className="font-inter font-bold text-[#343A40] flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#4A008B]" />
              Últimos Escaneos
            </h3>
          </div>
          
          <div className="flex-1 overflow-y-auto p-2">
            <div className="space-y-2">
              {historialReciente.map((lectura) => (
                <div key={lectura.id} className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex justify-between items-center hover:bg-[#F3E8FF] transition-colors">
                  <div>
                    <p className="font-mono font-bold text-sm text-[#38006B]">{lectura.codigo_etiqueta}</p>
                    <p className="text-xs text-[#555555] font-mono">{lectura.lpn || 'N/A'}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-xs font-bold ${lectura.confianza > 80 ? 'text-[#0AE8C6]' : 'text-amber-500'}`}>
                      {lectura.confianza}%
                    </p>
                    <p className="text-[10px] text-gray-400">
                      {new Date(lectura.fecha_hora).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
              
              {historialReciente.length === 0 && (
                <p className="text-center text-sm text-gray-400 mt-10">Sin historial reciente</p>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};