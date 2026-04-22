import { useState, useEffect, useCallback } from 'react';

const generateMockLectura = () => {
  const codigos = ['SAP315-001', 'SAP315-002', 'ABC123456', 'XYZ789012', 'TEST001', 'ERROR-CODE'];
  const estados = ['pendiente', 'validado', 'rechazado', 'error'];
  const lineas = ['LINEA_01', 'LINEA_02', 'LINEA_03'];
  const camaras = ['CAMARA_01', 'CAMARA_02'];

  return {
    id: Math.floor(Math.random() * 10000),
    codigo_etiqueta: codigos[Math.floor(Math.random() * codigos.length)],
    fecha_hora: new Date().toISOString(),
    estado_sap: estados[Math.floor(Math.random() * estados.length)],
    linea_origen: lineas[Math.floor(Math.random() * lineas.length)],
    camara_id: camaras[Math.floor(Math.random() * camaras.length)],
    resultado: 'OK',
    confianza: (Math.random() * 100).toFixed(2),
  };
};

export const useDashboard = (activo = true, intervalo = 3000) => {
  const [lecturas, setLecturas] = useState([]);
  const [alertas, setAlertas] = useState([]);
  const [kpis, setKpis] = useState({
    totalHoy: 0,
    validadas: 0,
    rechazadas: 0,
    errores: 0,
    eficiencia: 0,
    promedioConfianza: 0,
  });
  const [loading, setLoading] = useState(true);

  const calcularKpis = useCallback((lista) => {
    const total = lista.length;
    const validadas = lista.filter(l => l.estado_sap === 'validado').length;
    const rechazadas = lista.filter(l => l.estado_sap === 'rechazado').length;
    const errores = lista.filter(l => l.estado_sap === 'error').length;
    const confianzas = lista.map(l => parseFloat(l.confianza));
    const promedioConfianza = confianzas.length > 0 
      ? (confianzas.reduce((a, b) => a + b, 0) / confianzas.length).toFixed(1)
      : 0;

    return {
      totalHoy: total,
      validadas,
      rechazadas,
      errores,
      eficiencia: total > 0 ? ((validadas / total) * 100).toFixed(1) : 0,
      promedioConfianza,
    };
  }, []);

  useEffect(() => {
    if (!activo) return;

    // Datos iniciales
    const iniciales = Array.from({ length: 15 }, generateMockLectura);
    setLecturas(iniciales);
    setKpis(calcularKpis(iniciales));
    setLoading(false);

    const interval = setInterval(() => {
      const nueva = generateMockLectura();
      
      setLecturas(prev => {
        const actualizadas = [nueva, ...prev].slice(0, 50);
        setKpis(calcularKpis(actualizadas));
        return actualizadas;
      });

      if (nueva.estado_sap === 'error') {
        setAlertas(prev => [{
          id: Date.now(),
          tipo: 'error_lectura',
          descripcion: `Error en lectura: ${nueva.codigo_etiqueta}`,
          severidad: 'alta',
          fecha_registro: new Date().toISOString(),
          resuelta: false,
        }, ...prev].slice(0, 20));
      }
    }, intervalo);

    return () => clearInterval(interval);
  }, [activo, intervalo, calcularKpis]);

  return { lecturas, alertas, kpis, loading };
};