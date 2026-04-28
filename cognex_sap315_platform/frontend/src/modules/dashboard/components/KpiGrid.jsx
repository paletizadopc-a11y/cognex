import React from 'react';
import { Activity, CheckCircle, XCircle, BarChart3, Target, Clock } from 'lucide-react';
import { KpiCard } from './KpiCard';

export const KpiGrid = ({ kpis }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
      <KpiCard
        titulo="Total Lecturas"
        valor={kpis.totalHoy}
        subtitulo="Turno actual"
        icono={Activity}
        color="blue"
      />
      <KpiCard
        titulo="Validadas"
        valor={kpis.validadas}
        subtitulo="Aprobadas por SAP"
        icono={CheckCircle}
        color="emerald"
      />
      <KpiCard
        titulo="Pendientes"
        valor={kpis.pendientes}
        subtitulo="Esperando acción"
        icono={Clock}
        color="amber"
      />
      <KpiCard
        titulo="Rechazadas"
        valor={kpis.rechazadas}
        subtitulo="Requieren revisión"
        icono={XCircle}
        color="rose"
      />
      <KpiCard
        titulo="Errores"
        valor={kpis.errores}
        subtitulo="Fallos de lectura"
        icono={BarChart3}
        color="rose"
      />
      <KpiCard
        titulo="Eficiencia"
        valor={`${kpis.eficiencia}%`}
        subtitulo="Tasa de éxito"
        icono={Target}
        color="purple"
      />
    </div>
  );
};