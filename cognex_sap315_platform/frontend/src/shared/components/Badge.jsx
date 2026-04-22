import React from 'react';

const variants = {
  pendiente: 'bg-amber-50 text-amber-700 border-amber-200',
  validado: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  rechazado: 'bg-rose-50 text-rose-700 border-rose-200',
  error: 'bg-gray-50 text-gray-700 border-gray-200',
  critica: 'bg-red-50 text-red-700 border-red-200',
  alta: 'bg-orange-50 text-orange-700 border-orange-200',
  media: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  baja: 'bg-blue-50 text-blue-700 border-blue-200',
};

export const Badge = ({ variant = 'pendiente', children, icon: Icon }) => (
  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${variants[variant] || variants.pendiente}`}>
    {Icon && <Icon className="w-3.5 h-3.5" />}
    {children}
  </span>
);