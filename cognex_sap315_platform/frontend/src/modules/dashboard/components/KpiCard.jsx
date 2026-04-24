import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

export const KpiCard = ({ titulo, valor, subtitulo, icono: Icono, color, tendencia }) => {
  // Ahora usamos nuestra paleta semántica
  const variantes = {
    purple: 'bg-primary-light text-primary border-primary-light',
    accent: 'bg-accent/10 text-industrial-dark border-accent/20', // Éxito con turquesa
    error: 'bg-red-50 text-red-600 border-red-100',
  };

  return (
    <div className={`rounded-xl border p-6 shadow-soft transition-all hover:shadow-industrial bg-white ${variantes[color] || variantes.purple}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          {/* Títulos en Inter Tight */}
          <p className="font-inter text-xs uppercase tracking-wider font-semibold opacity-70">
            {titulo}
          </p>
          {/* Datos en Hanken Grotesk para máxima legibilidad */}
          <p className="font-hanken text-3xl font-bold mt-1 text-industrial-dark">
            {valor}
          </p>
          
          {subtitulo && <p className="text-sm mt-1 font-hanken opacity-60">{subtitulo}</p>}
          
          {tendencia && (
            <div className={`flex items-center gap-1 mt-3 text-xs font-bold ${
              tendencia > 0 ? 'text-accent' : 'text-red-500'
            }`}>
              {tendencia > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              <span>{Math.abs(tendencia)}% vs ayer</span>
            </div>
          )}
        </div>
        
        <div className="p-3 bg-white rounded-lg shadow-soft border border-gray-50 text-primary">
          <Icono className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
};