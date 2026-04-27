import React from 'react';
import { Activity, CheckCircle, XCircle, BarChart3, Target, Clock } from 'lucide-react';
import { KpiCard } from './KpiCard';

export const KpiGrid = ({ kpis }) => {
  // Ajustamos a 6 columnas en pantallas grandes (xl:grid-cols-6) para que quepan todas las métricas
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
      <KpiCard
        titulo="Total Lecturas"
        valor={kpis.totalHoy}
        subtitulo="Hoy"
        icono={Activity}
        color="blue"
        tendencia={12}
      />
      <KpiCard
        titulo="Validadas"
        valor={kpis.validadas}
        subtitulo="Aprobadas por SAP"
        icono={CheckCircle}
        color="emerald"
        tendencia={8}
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
        tendencia={-5}
      />
      <KpiCard
        titulo="Errores"
        valor={kpis.errores}
        subtitulo="Fallos de lectura"
        icono={BarChart3}
        color="rose"
        tendencia={-2}
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