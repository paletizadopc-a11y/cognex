import React, { useState, useEffect, useRef } from 'react';
import { api } from '../../shared/services/api';
import { ScanLine, CheckCircle2, AlertCircle, Loader2, Clock, MonitorPlay } from 'lucide-react';
import { Badge } from '../../shared/components/Badge';

export const MonitorModule = () => {
  const [ultimosEscaneos, setUltimosEscaneos] = useState([]);
  const [escaneoActual, setEscaneoActual] = useState(null);
  const [horaActual, setHoraActual] = useState(new Date());
  
  const [scanStatus, setScanStatus] = useState(null);
  const barcodeBuffer = useRef('');
  const lastKeyTime = useRef(Date.now());

  // 1. Reloj fluido del sistema
  useEffect(() => {
    const clockInterval = setInterval(() => setHoraActual(new Date()), 1000);
    return () => clearInterval(clockInterval);
  }, []);

  // 2. Cargar historial inicial al abrir la pantalla
  const fetchEscaneos = async () => {
    try {
      const res = await api.get('/lecturas?limite=10');
      if (res.lecturas) {
        setUltimosEscaneos(res.lecturas);
        if (res.lecturas.length > 0) {
          setEscaneoActual(res.lecturas[0]);
        }
      }
    } catch (error) {
      console.error("Error cargando escaneos:", error);
    }
  };

  useEffect(() => {
    fetchEscaneos();
  }, []);

  // ============================================================================
  // 🔒 CONTROL DE PANTALLA ACTIVA (SCREEN WAKE LOCK API)
  // Evita que el computador de la línea suspenda o apague el monitor
  // ============================================================================
  useEffect(() => {
    let wakeLock = null;

    const solicitarWakeLock = async () => {
      try {
        if ('wakeLock' in navigator) {
          wakeLock = await navigator.wakeLock.request('screen');
          console.log('🔒 [WAKE LOCK] Bloqueo de suspensión activo. Pantalla asegurada.');
        } else {
          console.warn('⚠️ El navegador actual no soporta Screen Wake Lock API.');
        }
      } catch (err) {
        console.error(`❌ Fallo al inicializar el control de pantalla activa: ${err.message}`);
      }
    };

    // Solicitar bloqueo al montar el módulo
    solicitarWakeLock();

    // Re-solicitar el bloqueo si el operador minimizó el navegador y volvió a entrar
    const controlarCambioVisibilidad = () => {
      if (wakeLock !== null && document.visibilityState === 'visible') {
        solicitarWakeLock();
      }
    };

    document.addEventListener('visibilitychange', controlarCambioVisibilidad);

    // Limpieza al salir de la pantalla para restablecer las políticas de Windows
    return () => {
      if (wakeLock !== null) {
        wakeLock.release();
        wakeLock = null;
        console.log('🔓 [WAKE LOCK] Bloqueo liberado de forma segura.');
      }
      document.removeEventListener('visibilitychange', controlarCambioVisibilidad);
    };
  }, []);

  // 🚀 3. EL MOTOR DEL ESCÁNER ZEBRA (Listener de teclado)
  useEffect(() => {
    const handleKeyDown = async (e) => {
      // Evitar conflictos si el usuario escribe en inputs
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;

      const currentTime = Date.now();
      
      // Tolerancia de 500ms para emulación de teclado USB-HID
      if (currentTime - lastKeyTime.current > 500) {
        barcodeBuffer.current = '';
      }
      lastKeyTime.current = currentTime;

      // Atrapar el 'Enter' final de la pistola
      if (e.key === 'Enter') {
        const lecturaFinal = barcodeBuffer.current.trim();
        barcodeBuffer.current = ''; 
        
        // Si el LPN es válido, lo procesamos
        if (lecturaFinal.length > 5) { 
          await procesarCapturaLpn(lecturaFinal);
        }
        return;
      }

      // Acumular los números
      if (e.key.length === 1) {
        barcodeBuffer.current += e.key;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // 🚀 4. ENVIAR A BD Y ACTUALIZAR LA PANTALLA GIGANTE EN MODO "PENDIENTE"
  const procesarCapturaLpn = async (lpnCapturado) => {
    try {
      setScanStatus({ type: 'loading', msg: `Capturando...` });
      
      const payload = {
        lpn: lpnCapturado,
        linea_origen: 'LINEA_01_RF_WEB'
      };

      // Guardamos en la base de datos (Backend ya lo pone en 'pendiente')
      const response = await api.post('/lecturas', payload);
      
      const nuevaLectura = response.lectura || {
        id: Date.now(),
        lpn: lpnCapturado,
        fecha_hora: new Date(),
        estado_sap: 'pendiente', // 🚀 Estado en espera de auditoría
        linea_origen: 'LINEA_01_RF_WEB'
      };

      // ¡Magia Visual! Actualizamos el recuadro negro y la lista lateral de inmediato
      setEscaneoActual(nuevaLectura);
      setUltimosEscaneos(prev => [nuevaLectura, ...prev].slice(0, 10));
      
      setScanStatus({ type: 'success', msg: `¡LPN en cola de Auditoría!` });

    } catch (error) {
      setScanStatus({ type: 'error', msg: `Error: LPN ya existe o fallo de BD` });
    } finally {
      setTimeout(() => setScanStatus(null), 2000);
    }
  };

  return (
    <div className="p-8 font-hanken">
      
      {/* CABECERA */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-end mb-6 gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <MonitorPlay className="w-8 h-8 text-[#4A008B]" />
            <h1 className="font-inter font-bold text-3xl text-[#343A40]">Monitor Andon RF</h1>
          </div>
          <p className="text-[#555555]">Pantalla principal de operación. Dispara la pistola al código LPN.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-2 px-4 py-2 bg-[#0AE8C6]/10 text-[#0AE8C6] border border-[#0AE8C6]/50 rounded-full text-sm font-bold shadow-sm">
            <div className="w-2 h-2 rounded-full bg-[#0AE8C6] animate-pulse"></div>
            Pistola RF Lista
          </span>
        </div>
      </div>

      {/* CONTENEDOR PRINCIPAL */}
      <div className="flex flex-col xl:flex-row gap-6 h-[calc(100vh-200px)]">
        
        {/* PANTALLA GIGANTE CENTRAL (Estilo Andon) */}
        <div className="flex-1 bg-[#0A0A0A] rounded-2xl border border-gray-800 shadow-2xl overflow-hidden flex flex-col relative">
          
          {/* Top Bar de la Pantalla */}
          <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-10">
            <span className="flex items-center gap-2 px-3 py-1 bg-[#4A008B] text-white border border-[#7B1FA2] rounded-full text-xs font-bold tracking-widest uppercase">
              <div className="w-1.5 h-1.5 rounded-full bg-[#0AE8C6] animate-pulse"></div>
              ESPERANDO LECTURA
            </span>
            <span className="font-mono text-[#0AE8C6] text-sm tracking-wider font-bold bg-[#0AE8C6]/10 px-3 py-1 rounded">
              {horaActual.toLocaleTimeString()}
            </span>
          </div>

          {/* Banner de Feedback (Pistolazo en modo PENDIENTE - Color Ámbar) */}
          {scanStatus && (
            <div className={`absolute top-16 left-1/2 -translate-x-1/2 z-20 px-8 py-3 rounded-full flex items-center gap-3 font-bold text-base shadow-2xl animate-in fade-in slide-in-from-top-4
              ${scanStatus.type === 'success' ? 'bg-amber-400 text-black' : // 🚀 Feedback amarillo de "Pendiente"
                scanStatus.type === 'error' ? 'bg-red-500 text-white' :
                'bg-white text-black'}`}
            >
              {scanStatus.type === 'success' && <CheckCircle2 className="w-6 h-6" />}
              {scanStatus.type === 'error' && <AlertCircle className="w-6 h-6" />}
              {scanStatus.type === 'loading' && <Loader2 className="w-6 h-6 animate-spin" />}
              {scanStatus.msg}
            </div>
          )}

          {/* Área Central (Muestra el LPN) */}
          <div className="flex-1 flex items-center justify-center p-8 relative">
            {escaneoActual ? (
              <div key={escaneoActual.id} className="w-[80%] max-w-2xl border-4 border-amber-500/30 border-dashed flex flex-col items-center justify-center py-20 relative bg-amber-500/5 animate-in zoom-in duration-300 rounded-2xl">
                {/* Esquinas del bounding box color ámbar */}
                <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-amber-500"></div>
                <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-amber-500"></div>
                <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-amber-500"></div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-amber-500"></div>
                
                <span className="text-amber-500 font-bold tracking-widest uppercase mb-4 opacity-80">ÚLTIMO LPN ENVIADO</span>
                <div className="bg-[#4A008B] text-white px-8 py-4 font-mono text-5xl font-black tracking-widest shadow-2xl shadow-[#4A008B]/50 border-2 border-[#7B1FA2] rounded-xl">
                  {escaneoActual.lpn}
                </div>
              </div>
            ) : (
              <div className="text-white/20 flex flex-col items-center">
                <ScanLine className="w-24 h-24 mb-6 opacity-30" />
                <p className="font-mono text-xl uppercase tracking-widest opacity-50">Sistema Listo</p>
              </div>
            )}
          </div>

          {/* Footer del Monitor */}
          <div className="h-24 border-t border-white/10 bg-[#2C0140] grid grid-cols-2 divide-x divide-white/10">
            <div className="flex flex-col items-center justify-center">
              <span className="text-xs text-white/50 uppercase tracking-widest font-bold mb-1">Línea de Operación</span>
              <span className="text-white font-bold text-xl tracking-wider">{escaneoActual ? escaneoActual.linea_origen : '---'}</span>
            </div>
            <div className="flex flex-col items-center justify-center">
              <span className="text-xs text-white/50 uppercase tracking-widest font-bold mb-1">Estado de Integration SAP</span>
              {escaneoActual ? (
                // 🚀 Reflejo del estado PENDIENTE en el footer
                <span className={`px-4 py-1.5 border rounded font-black tracking-widest uppercase text-lg ${
                  escaneoActual.estado_sap === 'pendiente' 
                  ? 'bg-amber-500/20 text-amber-400 border-amber-500/50' 
                  : 'bg-[#0AE8C6]/20 text-[#0AE8C6] border-[#0AE8C6]/50'
                }`}>
                  {escaneoActual.estado_sap === 'pendiente' ? 'PENDIENTE (AUDITORÍA)' : escaneoActual.estado_sap}
                </span>
              ) : (
                <span className="text-white/50 font-bold text-lg">---</span>
              )}
            </div>
          </div>
        </div>

        {/* SIDEBAR DERECHO: HISTORIAL INMEDIATO */}
        <div className="w-full xl:w-[400px] bg-white rounded-2xl shadow-soft border border-gray-100 flex flex-col overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex items-center gap-3 bg-gray-50">
            <Clock className="w-6 h-6 text-[#4A008B]" />
            <h3 className="font-bold text-[#343A40] text-lg">Historial Reciente</h3>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
            {ultimosEscaneos.length === 0 ? (
              <p className="text-sm text-center text-gray-400 mt-10">No hay lecturas registradas.</p>
            ) : (
              ultimosEscaneos.map((lectura) => (
                <div 
                  key={lectura.id} 
                  className="p-4 border border-gray-100 rounded-xl flex flex-col gap-2 hover:bg-[#F3E8FF]/30 transition-colors bg-white shadow-sm"
                >
                  <div className="flex justify-between items-start">
                    <span className="font-mono font-black text-[#38006B] text-lg">{lectura.lpn}</span>
                    <Badge variant={lectura.estado_sap}>{lectura.estado_sap}</Badge>
                  </div>
                  <div className="flex justify-between items-center text-xs text-gray-500 font-medium">
                    <span className="flex items-center gap-1"><MonitorPlay className="w-3 h-3"/> {lectura.linea_origen}</span>
                    <span>{new Date(lectura.fecha_hora).toLocaleTimeString()}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default MonitorModule;