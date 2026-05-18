import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LogOut, 
  LayoutDashboard, 
  ListOrdered, 
  AlertTriangle, 
  Settings,
  Camera,
  ClipboardCheck,
  History 
} from 'lucide-react';

export const Sidebar = () => {
  const { logout, usuario } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  // Ítems del menú de navegación de la plataforma SAP 315
  const menuItems = [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/lecturas', icon: ListOrdered, label: 'Lecturas' },
    { path: '/monitor', icon: Camera, label: 'Monitor en Vivo' },
    { path: '/auditoria', icon: ClipboardCheck, label: 'Auditoría de Carga' }, 
    { path: '/alertas', icon: AlertTriangle, label: 'Alertas' },
    { path: '/logs', icon: History, label: 'Logs de Auditoría' },
    { path: '/configuracion', icon: Settings, label: 'Configuración' },
  ];

  // ============================================================================
  // ⚡ FILTRADO INMUNE A MAYÚSCULAS/MINÚSCULAS SEGÚN ROL SOLICITADO
  // ============================================================================
  const menuItemsFiltrados = menuItems.filter((item) => {
    // Convertimos a minúsculas limpias para evitar cualquier descalce con la DB
    const rolUsuario = (usuario?.rol?.nombre_rol || usuario?.rol || 'operador').toString().trim().toLowerCase();

    if (rolUsuario === 'operador') {
      // El operador solo visualiza: Dashboard, Lecturas y Auditoría de Carga
      return ['Dashboard', 'Lecturas', 'Auditoría de Carga'].includes(item.label);
    }

    if (rolUsuario === 'supervisor') {
      // El supervisor visualiza: Dashboard, Lecturas, Auditoría de Carga y Alertas
      return ['Dashboard', 'Lecturas', 'Auditoría de Carga', 'Alertas'].includes(item.label);
    }

    // Si es 'admin', 'administrador sistema' o cualquier cuenta maestra, ve todo
    return true;
  });

  return (
    <aside className="w-64 shrink-0 h-screen bg-[#2C0140] border-r border-white/10 flex flex-col sticky top-0 z-50 shadow-2xl font-hanken">
      
      {/* Brand / Logo Corporativo */}
      <div className="p-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#4A008B] rounded-xl flex items-center justify-center shadow-lg shadow-[#4A008B]/30 border border-white/10">
            <span className="text-white font-black text-xl">S</span>
          </div>
          <div>
            <h1 className="text-white font-bold text-lg leading-tight tracking-wide">SAP 315</h1>
            <p className="text-[#0AE8C6] text-[10px] font-bold uppercase tracking-widest">Platform v2.0</p>
          </div>
        </div>
      </div>

      {/* Navegación Dinámica Filtrada de forma Segura */}
      <nav className="flex-1 px-4 overflow-y-auto py-4 custom-scrollbar">
        <ul className="space-y-2">
          {menuItemsFiltrados.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <li key={item.path}>
                <button
                  onClick={() => navigate(item.path)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                    isActive 
                      ? 'bg-[#4A008B] text-white font-bold shadow-md shadow-[#4A008B]/20 border border-white/5' 
                      : 'text-white/60 hover:bg-white/5 hover:text-white font-medium'
                  }`}
                >
                  <item.icon className={`w-5 h-5 transition-colors ${isActive ? 'text-[#0AE8C6]' : ''}`} />
                  <span className="text-sm">{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Sección de Usuario Sincronizada */}
      <div className="p-4 border-t border-white/10 bg-black/20">
        <div className="px-4 mb-4">
          <p className="text-sm font-bold text-white truncate">
            {usuario?.nombre || 'Usuario SAP'}
          </p>
          <p className="text-xs text-[#0AE8C6] uppercase tracking-wider font-bold mt-0.5">
            {/* Renderiza el rol de forma elegante en la etiqueta inferior */}
            {usuario?.rol?.nombre_rol || usuario?.rol || 'Operador'}
          </p>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-all duration-300 font-bold text-xs uppercase tracking-widest border border-red-500/20 hover:border-red-500"
        >
          <LogOut className="w-4 h-4" />
          Cerrar Sesión
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;