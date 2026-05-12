import React from 'react';
import { Badge } from '../../../shared/components/Badge';
import { ScanLine } from 'lucide-react';

export const LecturasTable = ({ lecturas = [] }) => {
  return (
    <div className="bg-white rounded-2xl shadow-soft border border-gray-100 p-6 h-full flex flex-col">
      <div className="mb-6">
        <h2 className="font-inter font-bold text-xl text-[#343A40]">Últimas Lecturas</h2>
        <p className="text-sm text-[#555555]">Registro en tiempo real de pallets (LPN) escaneados</p>
      </div>

      <div className="overflow-x-auto flex-1">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-50 text-xs font-inter font-semibold text-[#555555] uppercase border-b border-gray-100">
            <tr>
              <th className="p-4">ID / Hora</th>
              <th className="p-4">LPN</th>
              <th className="p-4">Línea</th>
              <th className="p-4">Estado SAP</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 text-sm">
            {lecturas.length === 0 ? (
              <tr>
                <td colSpan="4" className="p-10 text-center text-gray-400 font-medium">
                  Esperando nuevas lecturas de la línea de producción...
                </td>
              </tr>
            ) : (
              lecturas.slice(0, 10).map((lectura) => (
                <tr key={lectura.id} className={`hover:bg-gray-50/50 transition-colors ${lectura.linea_origen === 'LINEA_01_RF_WEB' ? 'bg-[#F3E8FF]/10' : ''}`}>
                  <td className="p-4">
                    <div className="font-medium text-[#343A40]">#{lectura.id}</div>
                    <div className="text-xs text-gray-400">
                      {new Date(lectura.fecha_hora).toLocaleTimeString()}
                    </div>
                  </td>
                  <td className="p-4 font-mono font-bold text-[#38006B] text-base tracking-wide">
                    {lectura.lpn || 'N/A'}
                    {lectura.linea_origen === 'LINEA_01_RF_WEB' && <ScanLine className="inline w-4 h-4 ml-2 text-[#0AE8C6]" title="Ingresado por RF" />}
                  </td>
                  <td className="p-4 font-medium text-[#555555]">{lectura.linea_origen}</td>
                  <td className="p-4"><Badge variant={lectura.estado_sap}>{lectura.estado_sap}</Badge></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};