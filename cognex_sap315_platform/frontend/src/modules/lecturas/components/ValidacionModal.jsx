import React, { useState } from 'react';
import { X, AlertTriangle, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { api } from '../../../shared/services/api';

export const ValidacionModal = ({ lectura, onClose, onValidacionExitosa }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [observacion, setObservacion] = useState('');

  if (!lectura) return null;

  const handleAccion = async (nuevoEstado) => {
    try {
      setLoading(true);
      setError('');
      
      // Llamamos al endpoint PUT que creaste en lecturasController.js
      await api.put(`/lecturas/${lectura.id}/validar`, { 
        estado_sap: nuevoEstado,
        observacion: observacion 
      });

      // Avisamos a la tabla que se actualice
      onValidacionExitosa(lectura.id, nuevoEstado);
      onClose();
    } catch (err) {
      setError(err.message || 'Error al actualizar el estado de la lectura.');
      setLoading(false);
    }
  };

  // Lógica visual: Si la confianza es menor a 70%, mostramos advertencia
  const esDudosa = lectura.confianza < 70;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-industrial-dark/60 backdrop-blur-sm p-4 font-hanken">
      <div className="bg-white rounded-2xl shadow-industrial w-full max-w-lg overflow-hidden animate-fade-in">
        
        {/* Cabecera del Modal */}
        <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50">
          <div>
            <h3 className="font-inter font-bold text-xl text-industrial-text">Auditoría de Lectura</h3>
            <p className="text-sm text-industrial-muted">ID: #{lectura.id}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Cuerpo del Modal */}
        <div className="p-6 space-y-6">
          {error && (
            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100">
              {error}
            </div>
          )}

          {/* Advertencia de Confianza */}
          {esDudosa && (
            <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-xl border border-amber-200 text-amber-800">
              <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-sm">Advertencia de Calidad</p>
                <p className="text-xs mt-1">La cámara reporta una confianza baja ({lectura.confianza}%). Por favor, verifique físicamente el código antes de aprobar.</p>
              </div>
            </div>
          )}

          {/* Detalles de la Lectura con LPN */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
              <p className="text-[#555555] text-xs uppercase tracking-wider font-semibold mb-1">Código Capturado</p>
              <p className="font-mono font-bold text-lg text-[#4A008B]">{lectura.codigo_etiqueta}</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
              <p className="text-[#555555] text-xs uppercase tracking-wider font-semibold mb-1">LPN / Pallet</p>
              <p className="font-mono font-bold text-lg text-[#0AE8C6] drop-shadow-sm">{lectura.lpn || 'SIN LPN'}</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 col-span-2">
              <p className="text-[#555555] text-xs uppercase tracking-wider font-semibold mb-1">Línea de Origen</p>
              <p className="font-bold text-[#343A40]">{lectura.linea_origen}</p>
            </div>
          </div>

          {/* Campo de Observaciones (Opcional pero útil para rechazos) */}
          <div>
            <label className="block text-sm font-semibold text-[#343A40] mb-2 uppercase tracking-wider text-xs">
              Observaciones (Opcional)
            </label>
            <textarea
              value={observacion}
              onChange={(e) => setObservacion(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#4A008B] outline-none transition-all resize-none h-24 text-sm"
              placeholder="Indique si el código estaba borroso, cruzado, etc..."
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
            Aprobar SAP
          </button>
        </div>

      </div>
    </div>
  );
};