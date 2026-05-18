import React, { useState, useEffect, useCallback } from 'react';
import { 
  AlertTriangle, 
  Trash2, 
  RefreshCcw, 
  Loader2, 
  Search,
  ShieldAlert,
  Info,
  CheckCircle2,
  AlertOctagon,
  Eraser,
  CheckCheck,
  Zap // 🚀 Añadido icono para la acción maestra fulminante
} from 'lucide-react';
import { api } from '../../shared/services/api';
import { Badge } from '../../shared/components/Badge';

export const AlertasModule = () => {
  const [alertas, setAlertas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [filtro, setFiltro] = useState('pendientes');
  const [procesandoId, setProcesandoId] = useState(null);
  
  // Estado para los checkboxes de selección masiva en bloques de la vista
  const [seleccionados, setSeleccionados] = useState([]);

  /**
   * 🚀 CARGA DE DATOS:
   * Consulta al servidor para obtener las incidencias actuales (Límite 1000).
   */
  const fetchAlertas = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/lecturas/alertas');
      setAlertas(response.alertas || []);
      setSeleccionados([]); // Limpiar selección previa al recargar datos
    } catch (err) {
      console.error("Error de sincronización con la base de datos:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAlertas();
    const interval = setInterval(fetchAlertas, 60000); // Auto-refresco cada minuto
    return () => clearInterval(interval);
  }, [fetchAlertas]);

  /**
   * 🚀 ACCIÓN 1: VALIDAR LPN INDIVIDUAL
   * Resuelve la incidencia marcándola como validada en la BD.
   */
  const handleValidar = async (id) => {
    if (!window.confirm("¿Confirmar validación física y cierre de esta incidencia?")) return;
    try {
      setProcesandoId(id);
      await api.patch(`/lecturas/alertas/${id}/resolver`);
      setAlertas(prev => prev.map(a => a.id === id ? { ...a, estado: 'resuelto' } : a));
      setSeleccionados(prev => prev.filter(item => item !== id)); // Remover de la selección si estaba marcado
    } catch (err) {
      alert("Error técnico al intentar validar el LPN.");
    } finally {
      setProcesandoId(null);
    }
  };

  /**
   * 🚀 ACCIÓN 2: VALIDACIÓN MASIVA POR BLOQUES (CHECKBOXES)
   * Envía el arreglo de IDs seleccionados al endpoint optimizado del backend
   */
  const handleValidarMasivo = async () => {
    if (seleccionados.length === 0) return;
    if (!window.confirm(`¿Confirmar la validación física masiva de ${seleccionados.length} incidencias seleccionadas?`)) return;

    try {
      setProcesandoId('masivo');
      await api.post('/lecturas/alertas/validar-masivo', {
        alerta_ids: seleccionados
      });

      // Actualizar el estado local pasando las alertas procesadas a 'resuelto'
      setAlertas(prev => prev.map(a => seleccionados.includes(a.id) ? { ...a, estado: 'resuelto' } : a));
      setSeleccionados([]); // Vaciar selección tras éxito
      alert("Incidencias validadas en lote correctamente.");
    } catch (err) {
      console.error("Error al ejecutar validación masiva:", err);
      alert("Error técnico al intentar procesar la validación masiva.");
    } finally {
      setProcesandoId(null);
    }
  };

  /**
   * 🚀 ACCIÓN NUEVA: VALIDAR ABSOLUTAMENTE TODO EL UNIVERSO DE ALERTAS
   * Actualiza el 100% de las alertas abiertas en una sola query directo en la base de datos.
   */
  const handleValidarTodoElSistema = async () => {
    const alertasActivas = alertas.filter(a => a.estado !== 'resuelto');
    if (alertasActivas.length === 0) return;

    const confirmacion = window.confirm(`🚨 ¡ALERTA DE PROCESAMIENTO TOTAL!\n\n¿Estás seguro de que deseas VALIDAR ABSOLUTAMENTE TODAS las incidencias abiertas del sistema de forma automática?\n\nEsta acción actualizará los registros de golpe en la base de datos.`);
    if (!confirmacion) return;

    try {
      setLoading(true);
      const response = await api.post('/lecturas/alertas/validar-todas');
      alert(response.data?.mensaje || "Sincronización masiva completada con éxito.");
      await fetchAlertas(); // Recarga limpia del árbol de datos
    } catch (err) {
      console.error("Error crítico al validar todo el sistema:", err);
      alert("Error crítico al intentar procesar la validación absoluta del sistema.");
    } finally {
      setLoading(false);
    }
  };

  /**
   * 🚀 ACCIÓN 3: ELIMINAR REGISTRO INDIVIDUAL
   * Borra permanentemente un LPN específico.
   */
  const handleEliminar = async (id) => {
    if (!window.confirm("¿Eliminar este registro permanentemente de la base de datos?")) return;
    try {
      setProcesandoId(id);
      await api.delete(`/lecturas/${id}`);
      setAlertas(prev => prev.filter(a => a.id !== id));
      setSeleccionados(prev => prev.filter(item => item !== id));
    } catch (err) {
      alert("Error al intentar eliminar el registro.");
    } finally {
      setProcesandoId(null);
    }
  };

  /**
   * 🚀 ACCIÓN 4: BORRAR TODAS LAS ALERTAS
   * Limpia completamente la tabla de incidencias.
   */
  const handleEliminarTodas = async () => {
    const confirmacionPrincipal = window.confirm("¡ATENCIÓN! Estás a punto de borrar TODAS las incidencias del historial. Esta acción no se puede deshacer. ¿Deseas continuar?");
    if (!confirmacionPrincipal) return;

    const confirmacionSeguridad = window.confirm("¿Estás absolutamente seguro? Se perderá toda la trazabilidad de las alertas actuales.");
    if (!confirmacionSeguridad) return;

    try {
      setLoading(true);
      await api.delete('/lecturas/alertas/todas');
      setAlertas([]);
      setSeleccionados([]);
      alert("Historial de incidencias vaciado correctamente.");
    } catch (err) {
      alert("Error técnico al intentar vaciar el historial.");
    } finally {
      setLoading(false);
    }
  };

  // Filtrado lógico de alertas según la pestaña y la barra de búsqueda
  const alertasFiltradas = alertas.filter(alerta => {
    const estadoNormalizado = alerta.estado === 'resuelto' ? 'resueltas' : 'pendientes';
    const cumpleFiltro = filtro === 'todas' ? true : estadoNormalizado === filtro;
    
    const termino = busqueda.toLowerCase();
    const cumpleBusqueda =
      alerta.lpn?.toLowerCase().includes(termino) ||
      alerta.linea_origen?.toLowerCase().includes(termino);
      
    return cumpleFiltro && cumpleBusqueda;
  });

  // Filtrar de las visibles cuáles están pendientes y son susceptibles de selección masiva
  const alertasPendientesVisibles = alertasFiltradas.filter(a => a.estado !== 'resuelto');

  // Controladores interactivos de las casillas de verificación (Checkboxes)
  const handleToggleSeleccion = (id) => {
    if (seleccionados.includes(id)) {
      setSeleccionados(prev => prev.filter(item => item !== id));
    } else {
      setSeleccionados(prev => [...prev, id]);
    }
  };

  const handleToggleTodos = () => {
    if (seleccionados.length === alertasPendientesVisibles.length) {
      setSeleccionados([]); // Deseleccionar todos si ya estaban completos
    } else {
      setSeleccionados(alertasPendientesVisibles.map(a => a.id)); // Seleccionar solo los pendientes de la vista actual
    }
  };

  const totalActivasSinResolver = alertas.filter(a => a.estado !== 'resuelto').length;

  return (
    <div className="p-8 font-hanken animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-8 gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <ShieldAlert className="w-8 h-8 text-red-500" />
            <h1 className="font-inter font-bold text-3xl text-[#343A40]">Centro de Incidencias</h1>
          </div>
          <p className="text-[#555555]">Gestión de discrepancias en lecturas Cognex y Auditorías Softys.</p>
        </div>

        <div className="flex flex-wrap gap-3">
          
          {/* 🚀 NUEVO BOTÓN MAESTRO: VALIDAR TODO EL UNIVERSO DE INCIDENCIAS */}
          <button 
            onClick={handleValidarTodoElSistema}
            disabled={totalActivasSinResolver === 0 || loading}
            className="flex items-center gap-2 px-5 py-3 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-2xl hover:bg-emerald-600 hover:text-white transition-all shadow-sm font-bold text-xs uppercase tracking-wider disabled:opacity-30"
            title="Validar absolutamente todas las incidencias abiertas directamente en la base de datos"
          >
            <Zap className="w-4 h-4 fill-current" />
            <span>Validar Todo ({totalActivasSinResolver})</span>
          </button>

          <button 
            onClick={handleEliminarTodas}
            disabled={alertas.length === 0 || loading}
            className="flex items-center gap-2 px-5 py-3 bg-red-50 text-red-600 border border-red-100 rounded-2xl hover:bg-red-600 hover:text-white transition-all shadow-sm disabled:opacity-30"
            title="Vaciar todo el historial"
          >
            <Eraser className="w-5 h-5" />
            <span className="font-black text-[10px] uppercase tracking-widest">Borrar Todo</span>
          </button>

          <button 
            onClick={fetchAlertas}
            className="p-4 bg-white border border-gray-200 rounded-2xl hover:bg-gray-50 text-[#4A008B] transition-all shadow-soft"
          >
            <RefreshCcw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* ⚡ BARRA FLOTANTE DE ACCIÓN MASIVA (LOTE SELECCIONADO EN PANTALLA) */}
      {/* ==================================================================== */}
      {seleccionados.length > 0 && (
        <div className="mb-6 p-4 bg-[#F3E8FF] border border-[#E0B3FF] rounded-2xl flex items-center justify-between animate-in slide-in-from-top-4 duration-300 shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#4A008B] rounded-xl flex items-center justify-center text-white text-xs font-black shadow-sm">
              {seleccionados.length}
            </div>
            <p className="text-sm font-bold text-[#2C0140]">
              {seleccionados.length === 1 ? 'Incidencia seleccionada' : 'Incidencias listas para validación colectiva'}
            </p>
          </div>
          
          <button
            onClick={handleValidarMasivo}
            disabled={procesandoId === 'masivo'}
            className="bg-[#4A008B] hover:bg-[#38006B] text-white text-xs font-black uppercase tracking-widest px-6 py-3 rounded-xl flex items-center gap-2 transition-all shadow-md active:scale-95 disabled:opacity-50"
          >
            {procesandoId === 'masivo' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <CheckCheck className="w-4 h-4 text-[#0AE8C6]" />
                Validar Bloque Masivo
              </>
            )}
          </button>
        </div>
      )}

      {/* Filtros de Búsqueda */}
      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-soft mb-6 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input 
            type="text"
            placeholder="Buscar por LPN o línea..."
            className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-100 focus:border-[#4A008B] focus:ring-2 focus:ring-[#4A008B]/5 outline-none text-sm transition-all"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>
        
        <div className="flex bg-gray-50 p-1 rounded-xl border border-gray-100">
          {['pendientes', 'resueltas', 'todas'].map((id) => (
            <button
              key={id}
              onClick={() => setFiltro(id)}
              className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                filtro === id ? 'bg-[#4A008B] text-white shadow-md' : 'text-gray-400'
              }`}
            >
              {id}
            </button>
          ))}
        </div>
      </div>

      {/* Tabla Estructurada de Datos */}
      <div className="bg-white rounded-3xl shadow-soft border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/50 text-[#555555] text-[10px] uppercase font-black tracking-widest border-b border-gray-100">
                
                {/* Checkbox Maestro del encabezado */}
                <th className="p-6 w-14 text-center">
                  <input 
                    type="checkbox"
                    checked={alertasPendientesVisibles.length > 0 && seleccionados.length === alertasPendientesVisibles.length}
                    onChange={handleToggleTodos}
                    disabled={alertasPendientesVisibles.length === 0 || loading}
                    className="w-4 h-4 rounded border-gray-300 text-[#4A008B] focus:ring-[#4A008B] cursor-pointer accent-[#4A008B] disabled:opacity-30"
                  />
                </th>

                <th className="p-6">Prioridad</th>
                <th className="p-6">Identificador LPN</th>
                <th className="p-6">Origen / Línea</th>
                <th className="p-6">Estado</th>
                <th className="p-6 text-center">Acciones Operativas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 font-hanken">
              {loading && alertas.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-20 text-center">
                    <Loader2 className="w-10 h-10 animate-spin text-[#4A008B] mx-auto opacity-20" />
                    <p className="text-xs font-bold text-gray-400 mt-4 uppercase tracking-tighter">Sincronizando memoria del sistema...</p>
                  </td>
                </tr>
              ) : alertasFiltradas.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-12 text-center text-gray-400 font-bold uppercase tracking-tight">
                    No se registran alertas que cumplan con el criterio de búsqueda.
                  </td>
                </tr>
              ) : (
                alertasFiltradas.map((alerta) => (
                  <tr key={alerta.id} className={`group transition-colors ${seleccionados.includes(alerta.id) ? 'bg-[#F3E8FF]/20 hover:bg-[#F3E8FF]/30' : 'hover:bg-gray-50/50'}`}>
                    
                    {/* Checkbox de Selección Individual */}
                    <td className="p-6 text-center">
                      <input 
                        type="checkbox"
                        checked={seleccionados.includes(alerta.id)}
                        onChange={() => handleToggleSeleccion(alerta.id)}
                        disabled={alerta.estado === 'resuelto' || loading}
                        className="w-4 h-4 rounded border-gray-300 text-[#4A008B] focus:ring-[#4A008B] cursor-pointer accent-[#4A008B] disabled:opacity-20 disabled:cursor-not-allowed"
                      />
                    </td>

                    <td className="p-6">
                      <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-tighter ${
                        alerta.estado === 'resuelto' ? 'bg-gray-50 text-gray-400' : 'bg-red-50 text-red-600 border-red-100'
                      }`}>
                        {alerta.linea_origen === 'AUDITORIA_SISTEMA' ? <AlertOctagon className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                        {alerta.linea_origen === 'AUDITORIA_SISTEMA' ? 'Crítico' : 'Aviso'}
                      </div>
                    </td>
                    <td className="p-6">
                      <span className="font-mono font-black text-lg text-[#38006B] tracking-tight">{alerta.lpn || 'S/N'}</span>
                    </td>
                    <td className="p-6">
                      <div className="text-sm font-bold text-[#343A40]">{alerta.linea_origen?.replace('_', ' ') || 'Producción'}</div>
                      <div className="text-[10px] text-gray-400">{alerta.fecha_hora ? new Date(alerta.fecha_hora).toLocaleString() : new Date().toLocaleString()}</div>
                    </td>
                    <td className="p-6">
                      <Badge variant={alerta.estado === 'resuelto' ? 'validado' : 'rechazado'}>
                        {alerta.estado === 'resuelto' ? 'CERRADA' : 'ACTIVA'}
                      </Badge>
                    </td>
                    <td className="p-6">
                      <div className="flex justify-center gap-2">
                        {alerta.estado !== 'resuelto' && (
                          <button 
                            onClick={() => handleValidar(alerta.id)}
                            disabled={procesandoId !== null}
                            className="p-3 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-600 hover:text-white transition-all shadow-sm shadow-emerald-100 disabled:opacity-50"
                            title="Validar LPN"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                        )}
                        <button 
                          onClick={() => handleEliminar(alerta.id)}
                          disabled={procesandoId !== null}
                          className="p-3 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-sm shadow-red-100 disabled:opacity-50"
                          title="Eliminar de la Base de Datos"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="mt-8 p-4 bg-[#F3E8FF] rounded-2xl border border-[#E0B3FF] flex items-start gap-3">
        <Info className="w-5 h-5 text-[#4A008B] mt-0.5" />
        <p className="text-xs text-[#4A008B] leading-relaxed">
          <strong>Control de Persistencia:</strong> Las validaciones marcadas aquí actualizan el historial de despachos permanentemente. Eliminar un registro lo borrará de la base de datos de trazabilidad sin dejar registros residuales en la memoria del módulo.
        </p>
      </div>
    </div>
  );
};

export default AlertasModule;