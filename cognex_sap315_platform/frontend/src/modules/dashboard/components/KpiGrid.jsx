import React from 'react';
import { 
  Activity, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  AlertTriangle, 
  Target 
} from 'lucide-react';
import { KpiCard } from './KpiCard';

export const KpiGrid = ({ kpis }) => {
  // 💡 Nota: Asegúrate de que el objeto 'kpis' que viene del hook 
  // tenga estas propiedades actualizadas.
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
      <KpiCard
        titulo="Total Lecturas"
        valor={kpis.total || 0}
        subtitulo="Turno actual"
        icono={Activity}
        color="purple" // Color institucional
      />
      
      <KpiCard
        titulo="Validadas"
        valor={kpis.ok || 0} // 🚀 Aquí se reflejan los 10 que acabas de auditar
        subtitulo="Aprobadas por SAP"
        icono={CheckCircle2}
        color="emerald" // Representa el éxito (Turquesa #0AE8C6 en tu CSS)
      />
      
      <KpiCard
        titulo="Pendientes"
        valor={kpis.pendientes || 0}
        subtitulo="Esperando Auditoría"
        icono={Clock}
        color="amber"
      />
      
      <KpiCard
        titulo="Rechazadas"
        valor={kpis.rechazadas || 0}
        subtitulo="No coinciden con Excel"
        icono={XCircle}
        color="rose"
      />

      <KpiCard
        titulo="Errores"
        valor={kpis.errores || 0}
        subtitulo="Fallos de lectura"
        icono={AlertTriangle}
        color="rose"
      />

      <KpiCard
        titulo="Eficiencia"
        valor={`${kpis.eficiencia || 0}%`}
        subtitulo="Tasa de éxito"
        icono={Target}
        color="purple"
      />
    </div>
  );
};