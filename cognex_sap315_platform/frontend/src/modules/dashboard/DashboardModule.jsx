import React from 'react';
import { KpiGrid } from './components/KpiGrid';
import { LecturasTable } from './components/LecturasTable';
import { AlertasPanel } from './components/AlertasPanel';
import { useDashboard } from './hooks/useDashboard';
import { Loader2, RefreshCw } from 'lucide-react';

export const DashboardModule = () => {
  // Consumimos nuestro Hook personalizado
  const { lecturas, alertas, kpis, loading, error, refetch } = useDashboard();

  // Pantalla de carga inicial
  if (loading && lecturas.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-100px)]">
        <Loader2 className="w-10 h-10 animate-spin text-[#4A008B] mb-4" />
        <p className="text-[#555555] font-hanken">Conectando con base de datos SAP 315...</p>
      </div>
    );
  }

  return (
    <div className="p-8 font-hanken">
      {/* Cabecera y botón de recarga */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-end mb-8 gap-4">
        <div>
          <h1 className="font-inter font-bold text-3xl text-[#343A40] mb-2">Dashboard Operativo</h1>
          <p className="text-[#555555]">Monitoreo en tiempo real del sistema Cognex SAP 315</p>
        </div>
        
        <button 
          onClick={refetch}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-[#4A008B] hover:bg-[#F3E8FF] transition-all shadow-soft"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span className="text-sm font-medium">Actualizar Datos</span>
        </button>
      </div>

      {/* Banner de Error (si el servidor se cae) */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl border border-red-100 flex items-center gap-3">
          <span className="font-bold">Error de conexión:</span> {error}
        </div>
      )}

      {/* Grid de KPIs inyectado con datos reales */}
      <KpiGrid kpis={kpis} />

      {/* Tablas principales inyectadas con datos reales */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2">
          <LecturasTable lecturas={lecturas} />
        </div>
        <div className="xl:col-span-1">
          <AlertasPanel alertas={alertas} />
        </div>
      </div>
    </div>
  );
};