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
  ClipboardCheck
} from 'lucide-react';

export const Sidebar = () => {
  const { logout, user } = useAuth();
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

  const rolActual = user?.rol?.toLowerCase() || 'operador';

  // Definición de items de navegación
  const menuItemsRaw = [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/lecturas', icon: ListOrdered, label: 'Lecturas' },
    { path: '/monitor', icon: Camera, label: 'Monitor en Vivo' },
    { path: '/auditoria', icon: ClipboardCheck, label: 'Auditoría de Carga' }, // 🚀 NUEVA SECCIÓN
    { path: '/alertas', icon: AlertTriangle, label: 'Alertas' },
    { path: '/configuracion', icon: Settings, label: 'Configuración' },
  ];

  // Filtro de seguridad (CTO tiene acceso a todo)
  const menuItems = menuItemsRaw; 

  return (
    <aside className="w-64 h-screen bg-header-footer border-r border-white/10 flex flex-col fixed left-0 top-0 z-50">
      {/* Brand / Logo */}
      <div className="p-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
            <span className="text-white font-black text-xl">S</span>
          </div>
          <div>
            <h1 className="text-white font-bold text-lg leading-tight font-interTight">SAP 315</h1>
            <p className="text-accent text-[10px] font-bold uppercase tracking-widest">Platform v2.0</p>
          </div>
        </div>
      </div>

      {/* Navegación */}
      <nav className="flex-1 px-4 overflow-y-auto py-4">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <li key={item.path}>
                <button
                  onClick={() => navigate(item.path)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    isActive 
                      ? 'bg-primary text-white font-medium shadow-soft' 
                      : 'text-white/60 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <item.icon className={`w-5 h-5 ${isActive ? 'text-accent' : ''}`} />
                  <span className="text-sm">{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Perfil de Usuario y Logout */}
      <div className="p-4 border-t border-white/10 bg-black/10">
        <div className="px-4 mb-4">
          <p className="text-sm font-bold text-white truncate">{user?.nombre || 'CTO User'}</p>
          <p className="text-xs text-accent uppercase tracking-wider font-inter">{user?.rol || 'Administrador'}</p>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all font-bold text-xs uppercase tracking-widest"
        >
          <LogOut className="w-4 h-4" />
          Cerrar Sesión
        </button>
      </div>
    </aside>
  );
};