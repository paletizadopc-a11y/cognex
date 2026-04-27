import { useState, useEffect } from 'react';
import { api } from '../../../shared/services/api';

export const useDashboard = () => {
  const [data, setData] = useState({
    lecturas: [],
    alertas: [],
    kpis: {
      totalHoy: 0,
      validadas: 0,
      pendientes: 0, // Nueva métrica agregada
      rechazadas: 0,
      errores: 0,
      eficiencia: 0
    }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboardData = async () => {
    try {
      // Hacemos dos peticiones simultáneas usando Promise.all para no perder velocidad
      const [tablaRes, kpisRes] = await Promise.all([
        api.get('/lecturas?limite=10'),
        api.get('/lecturas?limite=10000')
      ]);

      const lecturasTabla = tablaRes.lecturas || [];
      const lecturasTurno = kpisRes.lecturas || [];

      // Calculamos los KPIs basándonos en la lista COMPLETA del turno
      const validadas = lecturasTurno.filter(l => l.estado_sap === 'validado').length;
      const pendientes = lecturasTurno.filter(l => l.estado_sap === 'pendiente').length; // Conteo de pendientes
      const rechazadas = lecturasTurno.filter(l => l.estado_sap === 'rechazado').length;
      const errores = lecturasTurno.filter(l => l.estado_sap === 'error').length;
      const total = kpisRes.total || lecturasTurno.length;

      setData({
        lecturas: lecturasTabla,
        alertas: [], 
        kpis: {
          totalHoy: total,
          validadas,
          pendientes, // Inyectamos pendientes al objeto
          rechazadas,
          errores,
          eficiencia: total > 0 ? Math.round((validadas / total) * 100) : 0
        }
      });
      setError(null);
    } catch (err) {
      console.error(err);
      setError('No se pudieron cargar los datos de la planta.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 15000);
    return () => clearInterval(interval);
  }, []);

  return { ...data, loading, error, refetch: fetchDashboardData };
};