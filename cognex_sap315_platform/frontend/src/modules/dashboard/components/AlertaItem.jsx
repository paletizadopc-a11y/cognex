import React from 'react';
import { AlertTriangle, AlertCircle, Info, CheckCircle } from 'lucide-react';
import { Badge } from '../../../shared/components/Badge';
import { SEVERIDADES } from '../constants/estados';
import { formatFecha } from '../utils/formatters';

const iconosSeveridad = {
  critica: AlertTriangle,
  alta: AlertCircle,
  media: Info,
  baja: CheckCircle,
};

export const AlertaItem = ({ alerta }) => {
  const Icono = iconosSeveridad[alerta.severidad] || Info;
  
  return (
    <div className="px-6 py-4 flex items-start gap-4 hover:bg-gray-50 transition-colors">
      <div className={`p-2 rounded-lg ${
        alerta.severidad === 'critica' ? 'bg-red-100 text-red-600' :
        alerta.severidad === 'alta' ? 'bg-orange-100 text-orange-600' :
        alerta.severidad === 'media' ? 'bg-yellow-100 text-yellow-600' :
        'bg-blue-100 text-blue-600'
      }`}>
        <Icono className="w-5 h-5" />
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-medium text-gray-900">{alerta.tipo}</span>
          <Badge variant={alerta.severidad}>
            {SEVERIDADES[alerta.severidad]?.label}
          </Badge>
        </div>
        <p className="text-sm text-gray-600">{alerta.descripcion}</p>
        <p className="text-xs text-gray-400 mt-1">{formatFecha(alerta.fecha_registro)}</p>
      </div>
      
      {!alerta.resuelta && (
        <span className="inline-flex items-center px-2 py-1 text-xs font-medium text-red-700 bg-red-50 rounded-full">
          Activa
        </span>
      )}
    </div>
  );
};