import React, { useState, useEffect } from 'react';
import { X, AlertTriangle, CheckCircle, XCircle, Loader2, Image as ImageIcon, Camera } from 'lucide-react';
import { api } from '../../../shared/services/api';

// Diccionario de productos Softys para el autocompletado automático
const CATALOGO_SOFTYS = {
  "75228": "Pañalera 4", "75216": "Pañalera 4", "75215": "Pañalera 4", "75245": "Pañalera 4", "75244": "Pañalera 4", "75212": "Pañalera 4", "75234": "Pañalera 4", "75211": "Pañalera 4", "75213": "Pañalera 4",
  "77589": "Pañalera 5", "77506": "Pañalera 5", "77588": "Pañalera 5", "77587": "Pañalera 5", "77508": "Pañalera 5",
  "75220": "Pañalera 6", "75226": "Pañalera 6", "75235": "Pañalera 6", "75225": "Pañalera 6", "75227": "Pañalera 6", "75223": "Pañalera 6", "75221": "Pañalera 6",
  "96282": "Toallera 2", "96279": "Toallera 2", "96240": "Toallera 2", "96041": "Toallera 2", "96075": "Toallera 2", "96268": "Toallera 2", "96173": "Toallera 2"
};

export const ValidacionModal = ({ lectura, onClose, onValidacionExitosa }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Estados editables
  const [codigo, setCodigo] = useState(lectura.codigo_etiqueta || '');
  const [lpn, setLpn] = useState(lectura.lpn || '');
  const [linea, setLinea] = useState(lectura.linea_origen || '');
  const [observacion, setObservacion] = useState('');
  
  const [verImagen, setVerImagen] = useState(false);

  // Autocompletado de línea
  useEffect(() => {
    if (CATALOGO_SOFTYS[codigo]) {
      setLinea(CATALOGO_SOFTYS[codigo]);
    }
  }, [codigo]);

  if (!lectura) return null;

  const handleAccion = async (nuevoEstado) => {
    try {
      setLoading(true);
      setError('');
      
      await api.put(`/lecturas/${lectura.id}/validar`, { 
        estado_sap: nuevoEstado,
        observacion: observacion,
        codigo_etiqueta: codigo,
        lpn: lpn,
        linea_origen: linea
      });

      onValidacionExitosa(lectura.id, nuevoEstado, { 
        codigo_etiqueta: codigo, 
        lpn: lpn, 
        linea_origen: linea 
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Error al actualizar el estado de la lectura.');
      setLoading(false);
    }
  };

  // 🚀 Umbral ajustado al 55%
  const esDudosa = lectura.confianza < 55;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 font-hanken overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-fade-in my-8">
        
        {/* Cabecera del Modal */}
        <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50">
          <div>
            <h3 className="font-inter font-bold text-xl text-[#343A40]">Auditoría de Lectura</h3>
            <p className="text-sm text-[#555555]">ID: #{lectura.id} • Cam: {lectura.camara_id}</p>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setVerImagen(!verImagen)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-bold transition-colors border ${verImagen ? 'bg-[#4A008B] text-white border-[#4A008B]' : 'bg-white text-[#4A008B] border-gray-200 hover:bg-gray-100'}`}
            >
              <ImageIcon className="w-4 h-4" />
              {verImagen ? 'Ocultar Imagen' : 'Ver Imagen'}
            </button>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Cuerpo del Modal */}
        <div className="p-6 space-y-6">
          
          {/* Visor de Imagen */}
          {verImagen && (
            <div className="bg-black rounded-xl p-2 relative flex flex-col items-center justify-center border border-gray-200 overflow-hidden shadow-inner h-64">
              <div className="absolute top-2 right-2 flex gap-2">
                <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded animate-pulse">REC</span>
              </div>
              <Camera className="w-16 h-16 text-gray-700 mb-2" />
              <p className="text-gray-500 font-mono text-sm border border-gray-700 px-4 py-1 rounded">FRAME NO DISPONIBLE EN SIMULADOR</p>
              <p className="text-gray-600 text-xs mt-2 font-mono">CODE: {codigo || 'UNKNOWN'} | CONF: {lectura.confianza}%</p>
              
              <div className="absolute inset-0 flex items-center justify-center opacity-30 pointer-events-none">
                <div className="w-48 h-16 border-2 border-[#0AE8C6] relative">
                  <div className="w-full h-px bg-[#0AE8C6] absolute top-1/2 animate-[pulse_2s_ease-in-out_infinite]"></div>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100">
              {error}
            </div>
          )}

          {esDudosa && (
            <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-xl border border-amber-200 text-amber-800">
              <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-sm">Advertencia de Calidad: Etiqueta Ilegible</p>
                <p className="text-xs mt-1">La cámara reporta una confianza crítica ({lectura.confianza}%). Esto suele indicar una etiqueta sucia, borrosa o mal posicionada. Verifique físicamente antes de aprobar.</p>
              </div>
            </div>
          )}

          {/* Formulario de Corrección de Datos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#555555] uppercase tracking-wider mb-1">
                Código Capturado
              </label>
              <input 
                type="text" 
                value={codigo}
                onChange={(e) => setCodigo(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-mono font-bold text-lg text-[#4A008B] focus:bg-white focus:ring-2 focus:ring-[#4A008B]/20 focus:border-[#4A008B] outline-none transition-all"
                placeholder="Ej. 77508"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#555555] uppercase tracking-wider mb-1">
                LPN / Pallet
              </label>
              <input 
                type="text" 
                value={lpn}
                onChange={(e) => setLpn(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-mono font-bold text-lg text-[#0AE8C6] focus:bg-white focus:ring-2 focus:ring-[#0AE8C6]/30 focus:border-[#0AE8C6] outline-none transition-all"
                placeholder="LPN-XXXXXX"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-[#555555] uppercase tracking-wider mb-1 flex justify-between">
                <span>Línea de Origen</span>
                {CATALOGO_SOFTYS[codigo] && <span className="text-[#0AE8C6] text-[10px]">Autocompletado</span>}
              </label>
              <input 
                type="text" 
                value={linea}
                onChange={(e) => setLinea(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-[#343A40] focus:bg-white focus:ring-2 focus:ring-gray-200 focus:border-gray-400 outline-none transition-all"
                placeholder="Indique línea..."
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#555555] uppercase tracking-wider mb-1">
              Observaciones (Obligatorio si se rechaza o modifica)
            </label>
            <textarea
              value={observacion}
              onChange={(e) => setObservacion(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#4A008B]/20 focus:border-[#4A008B] outline-none transition-all resize-none h-20 text-sm"
              placeholder="Ej. Se corrige código ingresado manualmente. Etiqueta manchada..."
            />
          </div>
        </div>

        {/* Botones de Acción */}
        <div className="p-6 border-t border-gray-100 bg-gray-50 flex gap-3 justify-end">
          <button
            onClick={() => handleAccion('rechazado')}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2.5 bg-white border border-red-200 text-red-600 rounded-xl hover:bg-red-50 font-bold transition-all shadow-soft disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <XCircle className="w-5 h-5" />}
            Rechazar SAP
          </button>
          
          <button
            onClick={() => handleAccion('validado')}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2.5 bg-[#4A008B] text-white rounded-xl hover:bg-[#38006B] font-bold transition-all shadow-soft disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
            Aprobar y Corregir SAP
          </button>
        </div>

      </div>
    </div>
  );
};