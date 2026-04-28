import React from 'react';

export const KpiCard = ({ titulo, valor, subtitulo, icono: Icon, color }) => {
  // Paleta de colores coherente con el diseño industrial de la plataforma
  const themeClasses = {
    blue: 'text-blue-600 bg-blue-50 border-blue-100',
    emerald: 'text-emerald-600 bg-emerald-50 border-emerald-100',
    amber: 'text-amber-600 bg-amber-50 border-amber-100',
    rose: 'text-rose-600 bg-rose-50 border-rose-100',
    purple: 'text-[#4A008B] bg-[#F3E8FF] border-[#E0B3FF]',
  };

  const currentTheme = themeClasses[color] || themeClasses.blue;

  return (
    <div className="bg-white p-6 rounded-2xl shadow-soft border border-gray-100 flex flex-col justify-between hover:shadow-industrial transition-shadow duration-300">
      <div className="flex justify-between items-start mb-2">
        <div>
          <h4 className="text-xs font-bold text-[#555555] uppercase tracking-wider mb-2">
            {titulo}
          </h4>
          <p className="text-4xl font-inter font-bold text-[#343A40]">
            {valor}
          </p>
        </div>
        {/* Contenedor del ícono con el color dinámico */}
        <div className={`p-3 rounded-xl border ${currentTheme}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
      
      {/* Subtítulo descriptivo con un divisor sutil */}
      {subtitulo && (
        <div className="mt-4 pt-4 border-t border-gray-50">
          <p className="text-sm font-medium text-gray-500">{subtitulo}</p>
        </div>
      )}
    </div>
  );
};