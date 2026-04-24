// src/modules/dashboard/hooks/useDashboard.js
import { useState, useEffect } from 'react';
import { api } from '../../../shared/services/api';

export const useDashboard = () => {
  const [data, setData] = useState({
    lecturas: [],
    alertas: [],
    kpis: {
      totalHoy: 0,
      validadas: 0,
      rechazadas: 0,
      errores: 0,
      eficiencia: 0
    }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Ejecutamos las peticiones en paralelo para mayor velocidad
      const [lecturasRes] = await Promise.all([
        api.get('/lecturas?limite=10'),
        // Aquí agregarías la llamada a las alertas cuando el endpoint exista:
        // api.get('/alertas?estado=activas') 
      ]);

      // Calculamos los KPIs basándonos en los datos reales
      // (En producción, esto idealmente lo calcularía un endpoint /kpis en el backend)
      const lecturas = lecturasRes.lecturas || [];
      const validadas = lecturas.filter(l => l.estado_sap === 'validado').length;
      const total = lecturas.length;
      
      setData({
        lecturas: lecturas,
        alertas: [], // Reemplazar con la respuesta real de alertas
        kpis: {
          totalHoy: total,
          validadas: validadas,
          rechazadas: lecturas.filter(l => l.estado_sap === 'rechazado').length,
          errores: lecturas.filter(l => l.estado_sap === 'error').length,
          eficiencia: total > 0 ? Math.round((validadas / total) * 100) : 0
        }
      });
      setError(null);
    } catch (err) {
      setError(err.message || 'Error al conectar con el servidor Cognex');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    
    // Opcional: Refresco automático cada 30 segundos (ideal para plantas operativas)
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  return { ...data, loading, error, refetch: fetchDashboardData };
};