import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LogOut, 
  LayoutDashboard, 
  ListOrdered, 
  AlertTriangle, 
  Settings,
  Camera
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

  // Normalizamos el rol para las validaciones
  const rolActual = user?.rol?.toLowerCase() || 'operador';

  // Definición de todos los items posibles
  const menuItemsRaw = [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/lecturas', icon: ListOrdered, label: 'Lecturas' },
    { path: '/monitor', icon: Camera, label: 'Monitor en Vivo' },
    { path: '/alertas', icon: AlertTriangle, label: 'Alertas' },
    { path: '/configuracion', icon: Settings, label: 'Configuración' },
  ];

  // 🚀 Filtro de Seguridad por Roles
  const menuItems = menuItemsRaw.filter(item => {
    if (item.path === '/configuracion' && rolActual !== 'admin') {
      return false; // Solo Admin entra a Configuración
    }
    if (item.path === '/alertas' && rolActual === 'operador') {
      return false; // Operador no ve Alertas
    }
    return true;
  });

  return (
    <div className="w-64 bg-industrial-dark min-h-screen flex flex-col text-white shadow-industrial relative z-10 font-hanken">
      {/* Cabecera */}
      <div className="p-6 border-b border-white/10">
        <h2 className="font-inter font-bold text-xl text-primary-light">Cognex SAP</h2>
        <p className="text-xs text-white/50 uppercase tracking-wider mt-1">Plataforma 315</p>
      </div>

      {/* Menú Dinámico */}
      <nav className="flex-1 py-6">
        <ul className="space-y-1 px-3">
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
                  {item.label}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Perfil de Usuario */}
      <div className="p-4 border-t border-white/10 bg-black/10">
        <div className="px-4 mb-4">
          <p className="text-sm font-bold text-white truncate">{user?.nombre || 'Usuario'}</p>
          <p className="text-xs text-accent uppercase tracking-wider font-inter">{user?.rol || 'Sin Rol'}</p>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-all font-medium"
        >
          <LogOut className="w-5 h-5" />
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </div>
  );
};