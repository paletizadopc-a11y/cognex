import React from 'react';
import { Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { Badge } from '../../../shared/components/Badge';
import { ESTADOS_SAP } from '../constants/estados';
import { formatFecha, formatConfianza } from '../utils/formatters';

const iconosEstado = {
  pendiente: Clock,
  validado: CheckCircle,
  rechazado: XCircle,
  error: AlertCircle,
};

export const LecturaRow = ({ lectura }) => {
  const EstadoIcono = iconosEstado[lectura.estado_sap] || Clock;
  
  return (
    <tr className="hover:bg-gray-50 transition-colors">
      <td className="px-6 py-4">
        <div className="font-mono text-sm font-medium text-gray-900">
          {lectura.codigo_etiqueta}
        </div>
      </td>
      <td className="px-6 py-4">
        <Badge variant={lectura.estado_sap} icon={EstadoIcono}>
          {ESTADOS_SAP[lectura.estado_sap]?.label || lectura.estado_sap}
        </Badge>
      </td>
      <td className="px-6 py-4 text-sm text-gray-600">{lectura.linea_origen}</td>
      <td className="px-6 py-4 text-sm text-gray-600">{lectura.camara_id}</td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
          <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full ${
                parseFloat(lectura.confianza) > 80 ? 'bg-emerald-500' : 
                parseFloat(lectura.confianza) > 50 ? 'bg-amber-500' : 'bg-rose-500'
              }`}
              style={{ width: `${lectura.confianza}%` }}
            />
          </div>
          <span className="text-sm text-gray-600">{formatConfianza(lectura.confianza)}</span>
        </div>
      </td>
      <td className="px-6 py-4 text-sm text-gray-500">
        {formatFecha(lectura.fecha_hora)}
      </td>
    </tr>
  );
};