import React, { useState, useEffect } from 'react';
import { Camera, Image as ImageIcon, X, Maximize, Clock, CheckCircle, AlertTriangle, ShieldCheck, Scan, VideoOff } from 'lucide-react';
import { api } from '../../shared/services/api';
import { Badge } from '../../shared/components/Badge';

// CONFIGURACIÓN DE CÁMARA REAL
const STREAM_URL = import.meta.env.VITE_CAMERA_STREAM_URL || "http://192.168.1.100/video.mjpg";

// URL DEL BACKEND PARA IMÁGENES GUARDADAS
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
  
  // 🚀 NUEVO: Estado independiente para el reloj en vivo
  const [horaActual, setHoraActual] = useState(new Date());

  // Efecto independiente para el reloj fluído (se actualiza cada 1 segundo exacto)
  useEffect(() => {
    const clockInterval = setInterval(() => {
      setHoraActual(new Date());
    }, 1000);
    return () => clearInterval(clockInterval);
  }, []);

  // FETCH REAL AL BACKEND (Sin emuladores)
  const fetchLiveFeed = async () => {
    try {
      const res = await api.get('/lecturas?limite=20');
      const data = res.lecturas || [];
      
      if (data.length > 0) {
          const nuevaLectura = data[0];
          setLecturas(data);
          
          setLecturaActual(prev => {
             // Disparamos el flash solo si detectamos un ID de lectura nuevo y estamos en la vista en vivo
             if (vistaActiva === 'vivo' && (!prev || prev.id !== nuevaLectura.id)) {
                 setFlash(true);
                 setTimeout(() => setFlash(false), 300);
             }
             return nuevaLectura;
          });
          setConexionRealtime(true);
      }
    } catch (err) {
      console.error("Error conectando con el servidor de base de datos:", err);
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
    if (!lectura || !lectura.imagen_url) {
      return '/no-image-available.png'; 
    }
    return lectura.imagen_url.startsWith('http') ? lectura.imagen_url : `${API_BASE_URL}${lectura.imagen_url}`;
  };

  return (
    // 🚀 Ajuste: overflow-hidden aquí previene scrollbars globales
    <div className="p-8 font-hanken h-[calc(100vh-80px)] flex flex-col overflow-hidden">
      
      {/* Cabecera y Tabs */}
      <div className="mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 shrink-0">
        <div>
          <h1 className="font-inter font-bold text-3xl text-[#343A40] mb-2 flex items-center gap-3">
            <Camera className="w-8 h-8 text-[#4A008B]" />
            Monitor Visual (Cam-01)
          </h1>
          <p className="text-[#555555]">Transmisión directa de planta y registro fotográfico.</p>
        </div>
        
        <div className="flex items-center gap-4">
           {/* Indicador de Señal de Cámara */}
           <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-gray-200 shadow-sm hidden md:flex">
             <div className="relative flex h-3 w-3">
               {!errorStream && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#0AE8C6] opacity-75"></span>}
               <span className={`relative inline-flex rounded-full h-3 w-3 ${!errorStream ? 'bg-[#0AE8C6]' : 'bg-red-500'}`}></span>
             </div>
             <span className="text-sm font-bold text-[#555555]">
               {!errorStream ? 'Señal Cámara OK' : 'Sin Señal de Video'}
             </span>
           </div>

           {/* Indicador de conexión de base de datos */}
           <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-gray-200 shadow-sm hidden md:flex">
             <div className="relative flex h-3 w-3">
               {conexionRealtime && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#0AE8C6] opacity-75"></span>}
               <span className={`relative inline-flex rounded-full h-3 w-3 ${conexionRealtime ? 'bg-[#0AE8C6]' : 'bg-red-500'}`}></span>
             </div>
             <span className="text-sm font-bold text-[#555555]">
               {conexionRealtime ? 'BD Conectada' : 'BD Desconectada'}
             </span>
           </div>

           {/* Pestañas de navegación */}
           <div className="flex bg-white border border-gray-200 rounded-xl p-1 shadow-sm">
             <button 
               onClick={() => setVistaActiva('vivo')}
               className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${vistaActiva === 'vivo' ? 'bg-[#4A008B] text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
             >
               <Camera className="w-4 h-4" /> En Vivo
             </button>
             <button 
               onClick={() => setVistaActiva('galeria')}
               className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${vistaActiva === 'galeria' ? 'bg-[#4A008B] text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
             >
               <ImageIcon className="w-4 h-4" /> Galería Capturas
             </button>
           </div>
        </div>
      </div>

      {/* CONTENIDO: VISTA EN VIVO */}
      {vistaActiva === 'vivo' && (
        <div className="flex-1 flex flex-col lg:flex-row gap-6 min-h-0 pb-4">
          
          {/* Cámara Principal */}
          <div className="flex-1 bg-black rounded-2xl overflow-hidden relative shadow-2xl border border-gray-800 flex flex-col h-full">
            {flash && <div className="absolute inset-0 bg-white z-50 opacity-80 animate-pulse"></div>}

            {/* Top Bar superpuesta */}
            <div className="absolute top-4 left-4 z-20 flex items-center gap-3">
               <span className="px-3 py-1 bg-[#0AE8C6]/80 text-black border border-[#0AE8C6] rounded-full text-xs font-bold tracking-widest flex items-center gap-2 backdrop-blur-md shadow-lg">
                 <div className="w-2 h-2 rounded-full bg-black animate-pulse"></div> EN VIVO
               </span>
            </div>
            
            {/* 🚀 RELOJ INDEPENDIENTE Y FLUIDO */}
            <div className="absolute top-4 right-4 z-20 text-white font-mono text-sm backdrop-blur-md px-3 py-1 bg-black/50 rounded-lg border border-white/10">
              {horaActual.toLocaleTimeString()}
            </div>

            {/* STREAM DE VIDEO REAL */}
            <div className="flex-1 relative flex items-center justify-center bg-[#0a0a0a] min-h-0">
              {!errorStream && (
                <img 
                  src={STREAM_URL} 
                  alt="Stream de Cámara en Vivo" 
                  className="absolute inset-0 w-full h-full object-contain opacity-80"
                  onError={() => setErrorStream(true)} 
                  crossOrigin="anonymous"
                />
              )}
              
              {/* Overlay ÚNICO: Retícula de escaneo */}
              <div className="relative z-10 w-48 h-48 sm:w-64 sm:h-64 border-2 border-[#0AE8C6]/50 flex flex-col items-center justify-center bg-black/20 backdrop-blur-[2px] transition-all duration-500">
                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-[#0AE8C6] -mt-1 -ml-1"></div>
                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-[#0AE8C6] -mt-1 -mr-1"></div>
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-[#0AE8C6] -mb-1 -ml-1"></div>
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-[#0AE8C6] -mb-1 -mr-1"></div>
                
                <h2 className="text-white font-bold text-4xl sm:text-5xl tracking-wider drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)] mb-2">
                  {lecturaActual?.codigo_etiqueta || '---'}
                </h2>
                <div className="px-4 py-1.5 bg-[#4A008B]/90 text-white font-mono text-xs sm:text-sm rounded border border-purple-400 shadow-[0_0_15px_rgba(74,0,139,0.8)] backdrop-blur-md">
                  {lecturaActual?.lpn || 'ESPERANDO...'}
                </div>
              </div>
            </div>

            {/* Barra de estado inferior */}
            <div className="bg-black/90 backdrop-blur-xl border-t border-gray-800 p-4 grid grid-cols-3 gap-4 text-center z-20 relative shrink-0">
              <div>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Confianza Visual</p>
                <p className={`text-xl font-bold ${lecturaActual?.confianza >= 55 ? 'text-[#0AE8C6]' : 'text-red-400'}`}>
                  {lecturaActual?.confianza ? `${lecturaActual.confianza}%` : '--'}
                </p>
              </div>
              <div className="border-l border-r border-gray-800">
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Línea Origen</p>
                <p className="text-white font-bold text-lg">{lecturaActual?.linea_origen || '--'}</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-2">Estado SAP</p>
                {lecturaActual?.estado_sap === 'validado' ? (
                  <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded text-xs font-bold tracking-wider">VALIDADO</span>
                ) : lecturaActual?.estado_sap === 'error' ? (
                  <span className="px-3 py-1 bg-red-500/20 text-red-400 border border-red-500/30 rounded text-xs font-bold tracking-wider animate-pulse">RECHAZADO</span>
                ) : (
                  <span className="px-3 py-1 bg-gray-500/20 text-gray-400 border border-gray-500/30 rounded text-xs font-bold tracking-wider">ESPERANDO</span>
                )}
              </div>
            </div>
          </div>

          {/* Panel Lateral: Últimos Escaneos */}
          <div className="w-full lg:w-80 bg-white rounded-2xl shadow-soft border border-gray-100 flex flex-col overflow-hidden h-full">
            <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center shrink-0">
              <h3 className="font-inter font-bold text-sm text-[#343A40] flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#4A008B]" /> Últimos Escaneos
              </h3>
            </div>
            
            <div className="flex-1 overflow-y-auto p-2 space-y-2">
              {lecturas.slice(1, 8).map((lectura) => (
                <div 
                  key={lectura.id} 
                  onClick={() => setImagenModal(lectura)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer hover:shadow-md ${
                    lectura.estado_sap === 'error' 
                      ? 'bg-red-50/50 border-red-100 hover:border-red-300' 
                      : 'bg-white border-gray-100 hover:border-[#4A008B]/30'
                  }`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-bold text-[#343A40]">{lectura.codigo_etiqueta}</span>
                    <span className={`text-xs font-bold ${lectura.confianza >= 55 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {lectura.confianza}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] text-gray-500 font-mono">{lectura.lpn}</span>
                    <span className="text-[10px] text-gray-400">{new Date(lectura.fecha_hora).toLocaleTimeString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* CONTENIDO: GALERÍA DE IMÁGENES REALES */}
      {vistaActiva === 'galeria' && (
        <div className="flex-1 bg-white rounded-2xl shadow-soft border border-gray-100 p-6 overflow-y-auto pb-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {lecturas.map((lectura) => (
              <div 
                key={lectura.id} 
                className="group relative bg-gray-50 rounded-xl overflow-hidden border border-gray-200 hover:shadow-lg transition-all cursor-pointer"
                onClick={() => setImagenModal(lectura)}
              >
                <div className="aspect-video w-full bg-black relative overflow-hidden flex items-center justify-center">
                  <img 
                    src={getImagenReal(lectura)} 
                    alt={`Lectura ${lectura.codigo_etiqueta}`} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90"
                    onError={(e) => { e.target.src = '/no-image-available.png'; }}
                  />
                  
                  <div className="absolute inset-0 bg-[#4A008B]/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Maximize className="w-8 h-8 text-white" />
                  </div>
                  
                  <div className="absolute top-2 right-2">
                    {lectura.estado_sap === 'error' ? (
                       <span className="bg-red-500 text-white p-1 rounded-full shadow-md block"><AlertTriangle className="w-3 h-3"/></span>
                    ) : (
                       <span className="bg-emerald-500 text-white p-1 rounded-full shadow-md block"><CheckCircle className="w-3 h-3"/></span>
                    )}
                  </div>
                </div>
                
                <div className="p-3 border-t border-gray-200 bg-white">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-sm text-[#343A40]">{lectura.codigo_etiqueta}</span>
                    <span className={`text-xs font-bold ${lectura.confianza >= 55 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {lectura.confianza}%
                    </span>
                  </div>
                  <div className="text-[10px] text-gray-500 flex justify-between">
                    <span>{lectura.linea_origen}</span>
                    <span>{new Date(lectura.fecha_hora).toLocaleTimeString()}</span>
                  </div>
                </div>
              </div>
            ))}
            
            {lecturas.length === 0 && !loading && (
               <div className="col-span-full text-center py-20 text-gray-500">
                 <ImageIcon className="w-16 h-16 mx-auto mb-4 opacity-20" />
                 <p>No hay capturas registradas en la base de datos.</p>
               </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL DE IMAGEN AMPLIADA REAL */}
      {imagenModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-[#111111] rounded-2xl w-full max-w-5xl overflow-hidden shadow-2xl flex flex-col md:flex-row border border-gray-800 relative">
            
            <button 
              onClick={() => setImagenModal(null)}
              className="absolute top-4 right-4 z-50 p-2 bg-black/50 text-white hover:bg-red-600 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Zona de la Foto Real (Izquierda) */}
            <div className="flex-1 bg-[#0a0a0a] flex items-center justify-center relative min-h-[400px]">
              <img 
                src={getImagenReal(imagenModal)} 
                alt="Alta Resolución" 
                className="max-w-full max-h-full object-contain"
                onError={(e) => { e.target.src = '/no-image-available.png'; }}
              />
              <div className="absolute bottom-4 left-4">
                 <Badge variant={imagenModal.estado_sap === 'error' ? 'error' : 'validado'}>
                    {imagenModal.estado_sap.toUpperCase()}
                 </Badge>
              </div>
            </div>

            {/* Panel lateral de Metadatos (Derecha) */}
            <div className="w-full md:w-80 bg-white p-6 flex flex-col">
              <h3 className="font-inter font-bold text-xl text-[#343A40] mb-6 flex items-center gap-2">
                <ShieldCheck className="w-6 h-6 text-[#4A008B]" /> Análisis Visual
              </h3>

              <div className="space-y-4 flex-1">
                <div>
                  <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Producto / Código</p>
                  <p className="text-lg font-bold text-[#343A40]">{imagenModal.codigo_etiqueta}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">LPN Asociado</p>
                  <p className="text-sm font-mono text-[#4A008B] bg-purple-50 p-2 rounded-lg border border-purple-100">{imagenModal.lpn}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Confianza</p>
                    <p className={`text-lg font-bold ${imagenModal.confianza >= 55 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {imagenModal.confianza}%
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Línea</p>
                    <p className="text-sm font-bold text-[#343A40] mt-1">{imagenModal.linea_origen}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Timestamp</p>
                  <p className="text-sm text-[#343A40]">{new Date(imagenModal.fecha_hora).toLocaleString()}</p>
                </div>
              </div>

              {imagenModal.estado_sap === 'error' && (
                <div className="mt-6 p-4 bg-red-50 border border-red-100 rounded-xl">
                  <p className="text-xs text-red-800 font-bold mb-1 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> Atención Requerida
                  </p>
                  <p className="text-xs text-red-600">
                    La confianza de la lectura es baja. La imagen almacenada puede ayudar a identificar el problema físico.
                  </p>
                </div>
              )}
            </div>
            
          </div>
        </div>
      )}

    </div>
  );
};