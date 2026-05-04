import React, { useState, useEffect } from 'react';
import { Camera, Image as ImageIcon, X, Maximize, Clock, CheckCircle, AlertTriangle, ShieldCheck, VideoOff } from 'lucide-react';
import { api } from '../../shared/services/api';
import { Badge } from '../../shared/components/Badge';

// CONFIGURACIÓN DE CÁMARA DESDE .ENV
const STREAM_BASE_URL = import.meta.env.VITE_CAMERA_STREAM_URL || "http://192.168.1.203:8087/image.jpg";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.replace('/api/v1', '') || 'http://localhost:3000';

export const MonitorModule = () => {
  const [vistaActiva, setVistaActiva] = useState('vivo'); 
  const [lecturas, setLecturas] = useState([]);
  const [lecturaActual, setLecturaActual] = useState(null);
  const [imagenModal, setImagenModal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [flash, setFlash] = useState(false);
  const [conexionRealtime, setConexionRealtime] = useState(true);
  const [errorStream, setErrorStream] = useState(false);
  const [horaActual, setHoraActual] = useState(new Date());

  // 🚀 NUEVO: Estado para la URL con timestamp para forzar refresco[cite: 17]
  const [streamUrlConTimestamp, setStreamUrlConTimestamp] = useState(`${STREAM_BASE_URL}?t=${Date.now()}`);

  // 1. Reloj fluido del sistema[cite: 17]
  useEffect(() => {
    const clockInterval = setInterval(() => setHoraActual(new Date()), 1000);
    return () => clearInterval(clockInterval);
  }, []);

  // 2. 🚀 LÓGICA DE VIDEO: Refresca la imagen cada 100ms para simular streaming[cite: 17]
  useEffect(() => {
    if (vistaActiva === 'vivo' && !errorStream) {
      const videoInterval = setInterval(() => {
        setStreamUrlConTimestamp(`${STREAM_BASE_URL}?t=${Date.now()}`);
      }, 100); 
      return () => clearInterval(videoInterval);
    }
  }, [vistaActiva, errorStream]);

  // 3. Fetch de datos del backend[cite: 17]
  const fetchLiveFeed = async () => {
    try {
      const res = await api.get('/lecturas?limite=20');
      const data = res.lecturas || [];
      if (data.length > 0) {
          const nuevaLectura = data[0];
          setLecturas(data);
          setLecturaActual(prev => {
             if (vistaActiva === 'vivo' && (!prev || prev.id !== nuevaLectura.id)) {
                 setFlash(true);
                 setTimeout(() => setFlash(false), 300);
             }
             return nuevaLectura;
          });
          setConexionRealtime(true);
      }
    } catch (err) {
      setConexionRealtime(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveFeed();
    const interval = setInterval(fetchLiveFeed, 2000); 
    return () => clearInterval(interval);
  }, [vistaActiva]);

  const getImagenReal = (lectura) => {
    if (!lectura || !lectura.imagen_url) return '/no-image-available.png'; 
    return lectura.imagen_url.startsWith('http') ? lectura.imagen_url : `${API_BASE_URL}${lectura.imagen_url}`;
  };

  return (
    <div className="p-8 font-hanken h-[calc(100vh-80px)] flex flex-col overflow-hidden">
      {/* Cabecera[cite: 17] */}
      <div className="mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 shrink-0">
        <div>
          <h1 className="font-inter font-bold text-3xl text-[#343A40] mb-2 flex items-center gap-3">
            <Camera className="w-8 h-8 text-[#4A008B]" /> Monitor Visual (Cam-01)
          </h1>
          <p className="text-[#555555]">Transmisión directa de planta y registro fotográfico.</p>
        </div>
        
        <div className="flex items-center gap-4">
           {/* Indicador de Señal Cámara[cite: 17] */}
           <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-gray-200 shadow-sm">
             <div className="relative flex h-3 w-3">
               {!errorStream && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#0AE8C6] opacity-75"></span>}
               <span className={`relative inline-flex rounded-full h-3 w-3 ${!errorStream ? 'bg-[#0AE8C6]' : 'bg-red-500'}`}></span>
             </div>
             <span className="text-sm font-bold text-[#555555]">{!errorStream ? 'Señal Cámara OK' : 'Sin Señal de Video'}</span>
           </div>

           {/* Tabs[cite: 17] */}
           <div className="flex bg-white border border-gray-200 rounded-xl p-1 shadow-sm">
             <button onClick={() => setVistaActiva('vivo')} className={`px-5 py-2.5 rounded-lg text-sm font-bold ${vistaActiva === 'vivo' ? 'bg-[#4A008B] text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}>En Vivo</button>
             <button onClick={() => setVistaActiva('galeria')} className={`px-5 py-2.5 rounded-lg text-sm font-bold ${vistaActiva === 'galeria' ? 'bg-[#4A008B] text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}>Galería</button>
           </div>
        </div>
      </div>

      {/* VISTA EN VIVO[cite: 17] */}
      {vistaActiva === 'vivo' && (
        <div className="flex-1 flex flex-col lg:flex-row gap-6 min-h-0 pb-4">
          <div className="flex-1 bg-black rounded-2xl overflow-hidden relative shadow-2xl border border-gray-800 flex flex-col h-full">
            {flash && <div className="absolute inset-0 bg-white z-50 opacity-80 animate-pulse"></div>}

            <div className="absolute top-4 left-4 z-20 flex items-center gap-3">
               <span className="px-3 py-1 bg-[#0AE8C6]/80 text-black border border-[#0AE8C6] rounded-full text-xs font-bold tracking-widest flex items-center gap-2 backdrop-blur-md">
                 <div className="w-2 h-2 rounded-full bg-black animate-pulse"></div> EN VIVO
               </span>
            </div>
            
            <div className="absolute top-4 right-4 z-20 text-white font-mono text-sm backdrop-blur-md px-3 py-1 bg-black/50 rounded-lg">
              {horaActual.toLocaleTimeString()}
            </div>

            {/* 🚀 EL CAMBIO: Stream con refresco dinámico[cite: 17] */}
            <div className="flex-1 relative flex items-center justify-center bg-[#0a0a0a] min-h-0">
              {!errorStream ? (
                <img 
                  src={streamUrlConTimestamp} 
                  alt="Stream Real" 
                  className="absolute inset-0 w-full h-full object-contain"
                  onError={() => setErrorStream(true)} 
                  crossOrigin="anonymous"
                />
              ) : (
                <div className="flex flex-col items-center gap-4 text-gray-500">
                  <VideoOff className="w-16 h-16 opacity-20" />
                  <p className="font-bold">CONEXIÓN PERDIDA CON CÁMARA (.203)</p>
                </div>
              )}
              
              <div className="relative z-10 w-48 h-48 sm:w-64 sm:h-64 border-2 border-[#0AE8C6]/50 flex flex-col items-center justify-center bg-black/20 backdrop-blur-[2px]">
                <h2 className="text-white font-bold text-4xl sm:text-5xl drop-shadow-lg mb-2">
                  {lecturaActual?.codigo_etiqueta || '---'}
                </h2>
                <div className="px-4 py-1.5 bg-[#4A008B]/90 text-white font-mono text-xs sm:text-sm rounded border border-purple-400">
                  {lecturaActual?.lpn || 'ESPERANDO...'}
                </div>
              </div>
            </div>

            {/* Barra Inferior[cite: 17] */}
            <div className="bg-black/90 p-4 grid grid-cols-3 gap-4 text-center z-20 border-t border-gray-800">
              <div>
                <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Confianza</p>
                <p className={`text-xl font-bold ${lecturaActual?.confianza >= 55 ? 'text-[#0AE8C6]' : 'text-red-400'}`}>
                  {lecturaActual?.confianza ? `${lecturaActual.confianza}%` : '--'}
                </p>
              </div>
              <div className="border-x border-gray-800">
                <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Línea</p>
                <p className="text-white font-bold text-lg">{lecturaActual?.linea_origen || '--'}</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-400 font-bold uppercase mb-2">Estado SAP</p>
                <span className={`px-3 py-1 rounded text-xs font-bold ${lecturaActual?.estado_sap === 'validado' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                  {lecturaActual?.estado_sap?.toUpperCase() || 'ESPERANDO'}
                </span>
              </div>
            </div>
          </div>

          {/* Lista Lateral[cite: 17] */}
          <div className="w-full lg:w-80 bg-white rounded-2xl shadow-soft border border-gray-100 flex flex-col overflow-hidden h-full">
            <div className="p-4 border-b border-gray-100 bg-gray-50/50">
              <h3 className="font-inter font-bold text-sm text-[#343A40] flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#4A008B]" /> Últimos Escaneos
              </h3>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-2">
              {lecturas.slice(1, 8).map((lectura) => (
                <div key={lectura.id} className="p-3 rounded-xl border border-gray-100 bg-white hover:border-[#4A008B]/30 transition-all cursor-pointer">
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-bold text-[#343A40]">{lectura.codigo_etiqueta}</span>
                    <span className={`text-xs font-bold ${lectura.confianza >= 55 ? 'text-emerald-600' : 'text-red-600'}`}>{lectura.confianza}%</span>
                  </div>
                  <div className="flex justify-between items-center text-[11px] text-gray-500">
                    <span>{lectura.lpn}</span>
                    <span>{new Date(lectura.fecha_hora).toLocaleTimeString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      
      {/* Vista de Galería y Modales se mantienen igual[cite: 17] */}
    </div>
  );
};