import React from 'react';
import { useDashboard } from './hooks/useDashboard';
import { KpiGrid } from './components/KpiGrid';
import { LecturasTable } from './components/LecturasTable';
import { AlertasPanel } from './components/AlertasPanel';

export const DashboardModule = () => {
  const { lecturas, alertas, kpis, loading } = useDashboard(true, 3000);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">Monitoreo en tiempo real del sistema Cognex SAP315</p>
      </div>

      <KpiGrid kpis={kpis} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <LecturasTable lecturas={lecturas} />
        </div>
        <div>
          <AlertasPanel alertas={alertas} />
        </div>
      </div>
    </div>
  );
};