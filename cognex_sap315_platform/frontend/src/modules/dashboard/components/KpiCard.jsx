import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

export const KpiCard = ({ titulo, valor, subtitulo, icono: Icono, color, tendencia }) => {
  const colores = {
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    amber: 'bg-amber-50 text-amber-600 border-amber-200',
    rose: 'bg-rose-50 text-rose-600 border-rose-200',
    purple: 'bg-purple-50 text-purple-600 border-purple-200',
  };

  return (
    <div className={`rounded-xl border p-6 ${colores[color] || colores.blue}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium opacity-80">{titulo}</p>
          <p className="text-3xl font-bold mt-2">{valor}</p>
          {subtitulo && <p className="text-sm mt-1 opacity-70">{subtitulo}</p>}
          
          {tendencia && (
            <div className={`flex items-center gap-1 mt-3 text-sm ${
              tendencia > 0 ? 'text-emerald-700' : 'text-rose-700'
            }`}>
              {tendencia > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              <span>{Math.abs(tendencia)}% vs ayer</span>
            </div>
          )}
        </div>
        
        <div className="p-3 bg-white rounded-lg shadow-sm">
          <Icono className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
};