import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext'; // Sincronizado con tu AuthContext global
import { useNavigate, Link } from 'react-router-dom';
import { 
  Bell, 
  User, 
  LogOut, 
  ChevronDown, 
  AlertTriangle,
  Clock,
  Activity
} from 'lucide-react';
import { api } from '../services/api';

export const Header = () => {
  // 🚀 Conectamos el estado global del usuario y método logout
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();

  // Estados locales para el control de dropdowns y polling de alertas
  const [menuPerfilAbierto, setMenuPerfilAbierto] = useState(false);
  const [menuAlertasAbierto, setMenuAlertasAbierto] = useState(false);
  const [alertasRecientes, setAlertasRecientes] = useState([]);
  const [loadingAlertas, setLoadingAlertas] = useState(false);

  // Referencias de nodos para el cierre automático al hacer clic afuera
  const perfilRef = useRef(null);
  const alertasRef = useRef(null);

  // 🚀 FUNCIÓN DE REDIRECCIÓN CONTROLADA: Evita el conflicto de renderizado y redirige a /perfil
  const irAlPerfil = () => {
    setMenuPerfilAbierto(false);
    navigate('/perfil');
  };

  // Extrae dinámicamente las iniciales del nombre real del operador
  const obtenerIniciales = (nombre) => {
    if (!nombre) return 'OP';
    return nombre.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  /**
   * 🚀 FUNCIONALIDAD DE LA CAMPANITA (POLLING SEGURO)
   * Consulta las discrepancias activas cada 30 segundos
   */
  const cargarAlertasCabecera = async () => {
    try {
      setLoadingAlertas(true);
      const response = await api.get('/lecturas/alertas');
      // Filtramos únicamente las incidencias que sigan pendientes/activas
      const activas = (response.alertas || [])
        .filter(a => a.estado !== 'resuelto')
        .slice(0, 4);
      setAlertasRecientes(activas);
    } catch (err) {
      console.error("Error de sincronización de alertas en el Header:", err);
    } finally {
      setLoadingAlertas(false);
    }
  };

  useEffect(() => {
    cargarAlertasCabecera();
    const interval = setInterval(cargarAlertasCabecera, 30000); // Polling cada 30s
    return () => clearInterval(interval);
  }, []);

  // Listener para cerrar los menúes contextuales al hacer clic fuera de ellos
  useEffect(() => {
    const clickAfuera = (e) => {
      if (perfilRef.current && !perfilRef.current.contains(e.target)) setMenuPerfilAbierto(false);
      if (alertasRef.current && !alertasRef.current.contains(e.target)) setMenuAlertasAbierto(false);
    };
    document.addEventListener('mousedown', clickAfuera);
    return () => document.removeEventListener('mousedown', clickAfuera);
  }, []);

  const handleCerrarSesion = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4 relative font-hanken">
      <div className="flex items-center justify-between">
        
        {/* Indicador de Estado de Conectividad */}
        <div className="flex items-center gap-2 text-sm text-gray-500 font-bold">
          <Activity className="w-4 h-4 text-emerald-500" />
          <span>Sistema Operativo</span>
          <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
        </div>
        
        {/* Bloque de Acciones Operativas */}
        <div className="flex items-center gap-4">
          
          {/* ========================================== */}
          {/* CONTROL: CAMPANITA DE ALERTAS REACTIVA */}
          {/* ========================================== */}
          <div className="relative" ref={alertasRef}>
            <button 
              onClick={() => {
                setMenuAlertasAbierto(!menuAlertasAbierto);
                setMenuPerfilAbierto(false);
              }}
              className="relative p-2 text-gray-400 hover:text-[#4A008B] hover:bg-gray-50 rounded-xl transition-all"
            >
              <Bell className="w-5 h-5" />
              {/* Badge dinámico: Solo se muestra si existen alertas reales en cola */}
              {alertasRecientes.length > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-white"></span>
              )}
            </button>

            {/* Dropdown de previsualización de Incidencias */}
            {menuAlertasAbierto && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-[0_12px_30px_rgba(0,0,0,0.15)] border border-gray-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="px-4 py-2 border-b border-gray-50 flex justify-between items-center">
                  <span className="text-xs font-black text-[#343A40] uppercase tracking-wider">Incidencias Activas</span>
                  <span className="bg-red-50 text-red-600 text-[10px] font-black px-2 py-0.5 rounded-full">
                    {alertasRecientes.length} Nuevas
                  </span>
                </div>

                <div className="max-h-64 overflow-y-auto divide-y divide-gray-50">
                  {loadingAlertas && alertasRecientes.length === 0 ? (
                    <div className="p-6 text-center text-xs text-gray-400 font-bold">Actualizando...</div>
                  ) : alertasRecientes.length === 0 ? (
                    <div className="p-6 text-center text-xs text-gray-400 font-bold uppercase tracking-tight">
                      No hay alertas críticas activas
                    </div>
                  ) : (
                    alertasRecientes.map((alerta) => (
                      <div key={alerta.id} className="p-4 hover:bg-gray-50/80 transition-colors flex gap-3 text-left">
                        <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-black text-[#38006B] font-mono truncate">{alerta.lpn}</p>
                          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-tighter">Línea: {alerta.linea_origen?.replace('_', ' ')}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <Link 
                  to="/alertas" 
                  onClick={() => setMenuAlertasAbierto(false)}
                  className="block text-center text-[11px] font-black text-[#7B1FA2] hover:text-[#4A008B] uppercase tracking-wider pt-2.5 pb-1 border-t border-gray-50 transition-colors"
                >
                  Ver Panel de Incidencias →
                </Link>
              </div>
            )}
          </div>
          
          {/* Separador Estructural */}
          <div className="h-5 w-[1px] bg-gray-200"></div>

          {/* ========================================== */}
          {/* CONTROL: MENÚ DESPLEGABLE DE PERFIL */}
          {/* ========================================== */}
          <div className="relative" ref={perfilRef}>
            <button 
              onClick={() => {
                setMenuPerfilAbierto(!menuPerfilAbierto);
                setMenuAlertasAbierto(false);
              }}
              className="flex items-center gap-2.5 p-1 px-2 hover:bg-gray-50 rounded-xl transition-all text-left"
            >
              {/* Avatar circular hidratado con iniciales */}
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-black shadow-sm">
                {obtenerIniciales(usuario?.nombre)}
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-bold text-[#343A40] leading-none tracking-tight">
                  {usuario?.nombre || 'Operador'}
                </p>
                <p className="text-[10px] text-gray-400 font-bold uppercase mt-1 tracking-wider">
                  {usuario?.rol?.nombre_rol || 'Operador'}
                </p>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-gray-400 ml-0.5" />
            </button>

            {/* Panel de Opciones del Perfil */}
            {menuPerfilAbierto && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-[0_12px_30px_rgba(0,0,0,0.15)] border border-gray-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="px-4 py-2 border-b border-gray-100 mb-1">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Conectado como</p>
                  <p className="text-xs font-bold text-[#4A008B] truncate mt-0.5">{usuario?.email || 'S/N'}</p>
                </div>

                {/* 🚀 SOLUCIÓN: Cambiado de <Link> a <button> controlado con navegación programática */}
                <button 
                  onClick={irAlPerfil}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-bold text-gray-600 hover:bg-gray-50 hover:text-[#4A008B] transition-all text-left"
                >
                  <User className="w-4 h-4 text-gray-400" />
                  Mi Perfil
                </button>

                {/* Tag de Alerta de expiración: visible solo si la clave es temporal (7 días) */}
                {usuario?.es_password_temporal && (
                  <div className="mx-2 my-1 px-3 py-1.5 bg-amber-50 border border-amber-100 rounded-xl flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span className="text-[9px] font-black text-amber-700 uppercase tracking-tight">Clave Temporal Activa</span>
                  </div>
                )}

                <div className="border-t border-gray-100 my-1"></div>

                <button 
                  onClick={handleCerrarSesion}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-bold text-red-600 hover:bg-red-50 transition-all text-left"
                >
                  <LogOut className="w-4 h-4" />
                  Cerrar Sesión
                </button>
              </div>
            )}
          </div>

        </div>
      </div>
    </header>
  );
};