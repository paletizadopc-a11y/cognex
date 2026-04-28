import React from 'react';
import { Badge } from '../../../shared/components/Badge';

export const LecturasTable = ({ lecturas }) => {
  return (
    <div className="bg-white rounded-2xl shadow-soft border border-gray-100 overflow-hidden">
      {/* Cabecera de la Tabla */}
      <div className="p-6 border-b border-gray-100">
        <h3 className="font-inter font-bold text-lg text-[#343A40]">Últimas Lecturas</h3>
        <p className="text-sm text-[#555555]">Registro en tiempo real de códigos y pallets (LPN) escaneados</p>
      </div>
      
      {/* Contenedor de la Tabla */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-50">
            <tr className="text-xs font-inter font-semibold text-[#555555] uppercase tracking-wider border-b border-gray-100">
              <th className="p-4">Código SAP</th>
              <th className="p-4">LPN</th>
              <th className="p-4">Estado</th>
              <th className="p-4">Línea</th>
              <th className="p-4">Cámara</th>
              <th className="p-4">Confianza</th>
              <th className="p-4">Hora</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {lecturas.length === 0 ? (
              <tr>
                <td colSpan="7" className="p-8 text-center text-gray-400 font-medium">
                  Esperando nuevas lecturas de la línea de producción...
                </td>
              </tr>
            ) : (
              lecturas.map((lectura) => (
                <tr key={lectura.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="p-4 font-mono text-sm font-bold text-[#38006B]">
                    {lectura.codigo_etiqueta}
                  </td>
                  
                  <td className="p-4">
                    <span className="px-2 py-1 bg-gray-100 text-[#555555] rounded text-xs font-mono border border-gray-200">
                      {lectura.lpn || 'N/A'}
                    </span>
                  </td>

                  <td className="p-4">
                    <Badge variant={lectura.estado_sap}>{lectura.estado_sap}</Badge>
                  </td>
                  
                  <td className="p-4 text-sm text-[#555555]">
                    {lectura.linea_origen}
                  </td>
                  
                  <td className="p-4 text-sm text-[#555555]">
                    Cam {lectura.camara_id}
                  </td>
                  
                  <td className="p-4">
                    <span className={`text-sm font-bold ${lectura.confianza > 80 ? 'text-[#0AE8C6]' : lectura.confianza > 65 ? 'text-amber-500' : 'text-red-500'}`}>
                      {lectura.confianza}%
                    </span>
                  </td>
                  
                  <td className="p-4 text-xs text-gray-400 font-medium">
                    {new Date(lectura.fecha_hora).toLocaleTimeString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};