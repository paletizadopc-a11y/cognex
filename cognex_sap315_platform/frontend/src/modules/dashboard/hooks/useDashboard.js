import { useState, useEffect, useCallback } from 'react';
import { api } from '../../../shared/services/api';

export const useDashboard = () => {
  const [data, setData] = useState({
    lecturas: [],
    alertas: [],
    kpis: {
      total: 0,
      ok: 0,
      pendientes: 0,
      rechazadas: 0,
      errores: 0,
      eficiencia: 0
    }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      // Hacemos dos peticiones simultáneas: una para la tabla (10) y otra para cálculos (todos)
      const [tablaRes, kpisRes] = await Promise.all([
        api.get('/lecturas?limite=10'),
        api.get('/lecturas?limite=10000')
      ]);

      const lecturasTabla = tablaRes.lecturas || [];
      const lecturasTurno = kpisRes.lecturas || [];

      // 🚀 CÁLCULO DE KPIs SINCRONIZADO CON EL BACKEND
      // Filtramos por los strings exactos que usa tu base de datos
      const validadas = lecturasTurno.filter(l => l.estado_sap === 'ok').length;
      const pendientes = lecturasTurno.filter(l => l.estado_sap === 'pendiente').length;
      const rechazadas = lecturasTurno.filter(l => l.estado_sap === 'rechazado').length;
      const errores = lecturasTurno.filter(l => l.estado_sap === 'error').length;
      const total = kpisRes.total || lecturasTurno.length;

      setData({
        lecturas: lecturasTabla,
        alertas: [],
        kpis: {
          total: total,
          ok: validadas,
          pendientes: pendientes,
          rechazadas: rechazadas,
          errores: errores,
          eficiencia: total > 0 ? Math.round((validadas / total) * 100) : 0
        }
      });
      setError(null);
    } catch (err) {
      console.error('❌ Error en useDashboard:', err);
      setError('No se pudieron cargar los datos de la base de datos SAP 315.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Carga inicial al montar el componente
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  return {
    lecturas: data.lecturas,
    alertas: data.alertas,
    kpis: data.kpis,
    loading,
    error,
    refetch: fetchDashboardData 
  };
};